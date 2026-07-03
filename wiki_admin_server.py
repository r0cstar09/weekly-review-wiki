#!/usr/bin/env python3
"""Tailnet-gated admin API for weekly-review-wiki.

Security model:
- The service binds to 127.0.0.1 only.
- It is exposed to phones/laptops through Tailscale Serve HTTPS, tailnet-only.
- The Astro site reveals delete controls only after it can reach this Tailnet API.
- It only soft-deletes Markdown idea files under src/content/ideas/.
- Deleted files move to /home/rootadmin/weekly-review-wiki-trash/<timestamp>/src/content/ideas/<slug>.md.
- A delete is not considered complete until related links are cleaned, validation/build pass,
  the deletion is committed, and the commit is pushed to main for Vercel.
"""
from __future__ import annotations

import os
import re
import shutil
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

ROOT = Path(os.environ.get("WEEKLY_WIKI_ROOT", "/home/rootadmin/weekly-review-wiki")).resolve()
IDEAS = (ROOT / "src/content/ideas").resolve()
TRASH = Path(os.environ.get("WEEKLY_WIKI_TRASH", "/home/rootadmin/weekly-review-wiki-trash")).resolve()

app = FastAPI(title="Weekly Review Wiki Admin", version="1.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


class DeleteRequest(BaseModel):
    path: str


def run(cmd: list[str], *, timeout: int = 180) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        cmd,
        cwd=ROOT,
        text=True,
        capture_output=True,
        timeout=timeout,
        check=False,
    )


def require_ok(cmd: list[str], *, timeout: int = 180) -> subprocess.CompletedProcess[str]:
    proc = run(cmd, timeout=timeout)
    if proc.returncode != 0:
        raise RuntimeError(
            f"command failed: {' '.join(cmd)}\nSTDOUT:\n{proc.stdout[-4000:]}\nSTDERR:\n{proc.stderr[-4000:]}"
        )
    return proc


def safe_idea_path(rel: str) -> Path:
    rel = rel.strip().lstrip("/")
    if rel.startswith("src/content/ideas/"):
        rel = rel.removeprefix("src/content/ideas/")
    if not rel or rel.endswith("/"):
        raise HTTPException(status_code=400, detail="Pick a Markdown article, not a directory")
    if "\x00" in rel:
        raise HTTPException(status_code=400, detail="Invalid path")
    path = (IDEAS / rel).resolve()
    if IDEAS not in path.parents:
        raise HTTPException(status_code=400, detail="Path escapes ideas directory")
    if path.name.startswith("_"):
        raise HTTPException(status_code=400, detail="Refusing to delete templates/private helper files")
    if path.suffix.lower() != ".md":
        raise HTTPException(status_code=400, detail="Only .md wiki articles can be deleted")
    if not path.exists():
        raise HTTPException(status_code=404, detail="Article not found")
    if not path.is_file():
        raise HTTPException(status_code=400, detail="Not a file")
    return path


def title_for(path: Path) -> str:
    try:
        text = path.read_text(encoding="utf-8", errors="replace")
        in_frontmatter = text.startswith("---")
        for line in text.splitlines()[:80]:
            stripped = line.strip()
            if in_frontmatter and stripped.startswith("title:"):
                return stripped.split(":", 1)[1].strip().strip('"\'') or path.stem
            if stripped.startswith("#"):
                return stripped.lstrip("#").strip() or path.stem
    except Exception:
        pass
    return path.stem.replace("-", " ").title()


def article_rows() -> list[dict[str, Any]]:
    rows = []
    for path in sorted(IDEAS.glob("*.md")):
        if path.name.startswith("_"):
            continue
        rel = path.relative_to(IDEAS).as_posix()
        rows.append({
            "path": rel,
            "fullPath": f"src/content/ideas/{rel}",
            "slug": path.stem,
            "title": title_for(path),
            "size": path.stat().st_size,
            "modified": datetime.fromtimestamp(path.stat().st_mtime, timezone.utc).isoformat(),
            "url": f"/ideas/{path.stem}/",
        })
    return rows


def remove_related_slug_from_text(text: str, slug: str) -> tuple[str, bool]:
    lines = text.splitlines()
    if not lines or lines[0].strip() != "---":
        return text, False
    try:
        frontmatter_end = next(i for i in range(1, len(lines)) if lines[i].strip() == "---")
    except StopIteration:
        return text, False

    out: list[str] = []
    i = 0
    changed = False
    while i < len(lines):
        if i <= frontmatter_end and lines[i].strip() == "related:":
            block = [lines[i]]
            i += 1
            while i < len(lines) and (lines[i].startswith("  ") or lines[i].strip() == ""):
                block.append(lines[i])
                i += 1

            new_block = [block[0]]
            for line in block[1:]:
                if re.match(r"\s*-\s*[\"']?" + re.escape(slug) + r"[\"']?\s*$", line):
                    changed = True
                    continue
                new_block.append(line)

            if any(re.match(r"\s*-\s*\S+", line) for line in new_block[1:]):
                out.extend(new_block)
            else:
                changed = True
            continue
        out.append(lines[i])
        i += 1

    return "\n".join(out) + ("\n" if text.endswith("\n") else ""), changed


def cleanup_related_references(slug: str) -> list[str]:
    changed_files: list[str] = []
    for path in sorted(IDEAS.glob("*.md")):
        if path.name.startswith("_"):
            continue
        original = path.read_text(encoding="utf-8")
        updated, changed = remove_related_slug_from_text(original, slug)
        if changed:
            path.write_text(updated, encoding="utf-8")
            changed_files.append(path.relative_to(ROOT).as_posix())
    return changed_files


def rollback(src: Path, dest: Path, backups: dict[Path, str]) -> None:
    for path, text in backups.items():
        path.write_text(text, encoding="utf-8")
    if dest.exists() and not src.exists():
        src.parent.mkdir(parents=True, exist_ok=True)
        shutil.move(str(dest), str(src))


def publish_delete(src: Path, dest: Path, changed_related: list[str]) -> dict[str, Any]:
    # Validate the content graph first, then build the Astro site, then commit/push.
    validate = require_ok(["npm", "run", "validate"], timeout=120)
    build = require_ok(["npm", "run", "build"], timeout=300)

    require_ok(["git", "add", "-A", "src/content/ideas", ".gitignore"], timeout=60)
    status = require_ok(["git", "status", "--short", "--", "src/content/ideas", ".gitignore"], timeout=60).stdout.strip()
    if not status:
        return {
            "committed": False,
            "pushed": False,
            "message": "No git changes remained after delete.",
        }

    commit_message = f"Delete wiki article {src.stem}"
    commit = require_ok(["git", "commit", "-m", commit_message], timeout=120)
    push = require_ok(["git", "push", "origin", "main"], timeout=180)
    head = require_ok(["git", "rev-parse", "--short", "HEAD"], timeout=60).stdout.strip()
    return {
        "committed": True,
        "pushed": True,
        "commit": head,
        "changed_related": changed_related,
        "validate_tail": validate.stdout[-1200:],
        "build_tail": build.stdout[-1200:],
        "commit_output": commit.stdout[-1200:],
        "push_output": push.stdout[-1200:] + push.stderr[-1200:],
    }


@app.get("/health")
@app.get("/wiki-admin-api/health")
def health() -> dict[str, Any]:
    return {
        "ok": True,
        "root": str(ROOT),
        "ideas": str(IDEAS),
        "security": "Astro-hidden UI + loopback-only service exposed through Tailscale Serve HTTPS tailnet-only",
        "delete_semantics": "soft-delete, cleanup related links, validate/build, commit, push main",
    }


@app.get("/articles")
@app.get("/wiki-admin-api/articles")
def articles() -> dict[str, Any]:
    rows = article_rows()
    return {"root": str(ROOT), "count": len(rows), "articles": rows}


@app.post("/delete")
@app.post("/wiki-admin-api/delete")
def delete_article(req: DeleteRequest) -> dict[str, Any]:
    src = safe_idea_path(req.path)
    slug = src.stem
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    dest = TRASH / stamp / "src/content/ideas" / src.name
    dest.parent.mkdir(parents=True, exist_ok=True)

    backups = {path: path.read_text(encoding="utf-8") for path in IDEAS.glob("*.md") if path.exists()}

    try:
        shutil.move(str(src), str(dest))
        changed_related = cleanup_related_references(slug)
        publish = publish_delete(src, dest, changed_related)
    except Exception as exc:
        rollback(src, dest, backups)
        raise HTTPException(status_code=409, detail=f"Delete rolled back: {exc}") from exc

    return {
        "ok": True,
        "deleted": src.relative_to(IDEAS).as_posix(),
        "trash_path": str(dest),
        "changed_related": changed_related,
        "publish": publish,
        "message": "Article moved to external wiki trash, related links cleaned, validation/build passed, deletion committed and pushed to main.",
    }


if __name__ == "__main__":
    import uvicorn

    host = os.environ.get("WEEKLY_WIKI_ADMIN_HOST", "127.0.0.1")
    port = int(os.environ.get("WEEKLY_WIKI_ADMIN_PORT", "8768"))
    print(f"Starting weekly-review wiki admin on http://{host}:{port} (Tailscale Serve exposes HTTPS)")
    uvicorn.run(app, host=host, port=port)
