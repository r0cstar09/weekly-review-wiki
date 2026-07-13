#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# Tony's Alienware Tailscale IP; override with WIKI_DEPLOY_HOST if the device is renamed/re-enrolled.
deploy_host="${WIKI_DEPLOY_HOST:-rootadmin@100.119.113.11}"
project='hermes-ai-agent-497702'
region='us-east1'
service='weekly-review-wiki'
public_url='https://wiki.tonymuzo.dev'
verify_path="${WIKI_VERIFY_PATH:-/}"
verify_marker="${WIKI_VERIFY_MARKER:-Field Notes}"

cd "$repo_root"

if [ "$(git branch --show-current)" != 'main' ]; then
  echo 'Refusing deployment: the local branch is not main.' >&2
  exit 1
fi
if [ -n "$(git status --short)" ]; then
  echo 'Refusing deployment: the local repository is not clean.' >&2
  git status --short >&2
  exit 1
fi

git fetch origin main --quiet
local_sha="$(git rev-parse HEAD)"
remote_sha="$(git rev-parse origin/main)"
if [ "$local_sha" != "$remote_sha" ]; then
  echo "Refusing deployment: local HEAD ${local_sha} does not match origin/main ${remote_sha}." >&2
  exit 1
fi

remote_script="$(cat <<'REMOTE'
set -euo pipefail
repo='/home/rootadmin/weekly-review-wiki'
project='hermes-ai-agent-497702'
region='us-east1'
service='weekly-review-wiki'
gcloud='/mnt/c/Program Files (x86)/Google/Cloud SDK/google-cloud-sdk/bin/gcloud'
cd "$repo"
git fetch origin main --quiet
git pull --ff-only origin main
if [ -n "$(git status --short)" ]; then
  echo 'Alienware deployment repository is not clean.' >&2
  git status --short >&2
  exit 1
fi
sha="$(git rev-parse HEAD)"
short="$(git rev-parse --short=12 HEAD)"
tag="$(date -u +%Y%m%dT%H%M%SZ)-${short}"
image="us-east1-docker.pkg.dev/${project}/tonymuzo-apps/weekly-review-wiki:${tag}"
echo "SOURCE_SHA=${sha}"
echo "IMAGE=${image}"
"$gcloud" builds submit . --project "$project" --config cloudbuild.yaml --substitutions "_IMAGE=${image}" --quiet
"$gcloud" run deploy "$service" --project "$project" --region "$region" --image "$image" --quiet
"$gcloud" run services describe "$service" --project "$project" --region "$region" --format='value(status.latestReadyRevisionName,status.url,spec.template.spec.containers[0].image)'
REMOTE
)"

ssh -o BatchMode=yes -o ConnectTimeout=20 "$deploy_host" "$remote_script"

for attempt in 1 2 3 4 5 6 7 8; do
  live="$(curl -fsSL --max-time 20 "${public_url}${verify_path}" || true)"
  if [ -n "$live" ] && [[ "$live" == *"$verify_marker"* ]]; then
    echo "CANONICAL_VERIFY=PASS"
    echo "CANONICAL_URL=${public_url}${verify_path}"
    echo "CANONICAL_MARKER=${verify_marker}"
    exit 0
  fi
  echo "Waiting for canonical content after deployment (attempt ${attempt}/8)..."
  sleep 10
done

echo "Cloud Run deployed, but ${public_url}${verify_path} did not expose marker '${verify_marker}'." >&2
exit 1
