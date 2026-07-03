#!/usr/bin/env python3
"""Tailnet-gated admin API for weekly-review-wiki.

Security model:
- The service binds to 127.0.0.1 only.
- It is exposed to phones/laptops through Tailscale Serve HTTPS, tailnet-only.
- It only soft-deletes Markdown idea files under src/content/ideas/.
- Deleted files move to .wiki-trash/<timestamp>/src/content/ideas/<slug>.md.
"""
from __future__ import annotations

import os
import shutil
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

ROOT = Path(os.environ.get("WEEKLY_WIKI_ROOT", "/home/rootadmin/weekly-review-wiki")).resolve()
IDEAS = (ROOT / "src/content/ideas").resolve()
TRASH = (ROOT / ".wiki-trash").resolve()

app = FastAPI(title="Weekly Review Wiki Admin", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


class DeleteRequest(BaseModel):
    path: str


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


@app.get("/health")
@app.get("/wiki-admin-api/health")
def health() -> dict[str, Any]:
    return {
        "ok": True,
        "root": str(ROOT),
        "ideas": str(IDEAS),
        "security": "loopback-only service exposed through Tailscale Serve HTTPS tailnet-only",
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
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    dest = TRASH / stamp / "src/content/ideas" / src.name
    dest.parent.mkdir(parents=True, exist_ok=True)
    shutil.move(str(src), str(dest))
    return {
        "ok": True,
        "deleted": src.relative_to(IDEAS).as_posix(),
        "trash_path": str(dest),
        "message": "Article moved to .wiki-trash; recover by moving it back under src/content/ideas/.",
    }


if __name__ == "__main__":
    import uvicorn

    host = os.environ.get("WEEKLY_WIKI_ADMIN_HOST", "127.0.0.1")
    port = int(os.environ.get("WEEKLY_WIKI_ADMIN_PORT", "8768"))
    print(f"Starting weekly-review wiki admin on http://{host}:{port} (Tailscale Serve exposes HTTPS)")
    uvicorn.run(app, host=host, port=port)
