#!/usr/bin/env bash
set -euo pipefail
systemctl --user daemon-reload
systemctl --user enable --now weekly-wiki-admin.service
tailscale serve --bg --set-path /wiki-admin-api http://127.0.0.1:8768
sleep 2
systemctl --user status weekly-wiki-admin.service --no-pager -l
curl -sS https://tonys-alienware-1.tail85fe36.ts.net/wiki-admin-api/health
printf '\nAdmin page: https://wiki.tonymuzo.dev/admin/delete-articles/\n'
