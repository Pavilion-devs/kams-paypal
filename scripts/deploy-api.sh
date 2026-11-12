#!/usr/bin/env bash
# Redeploy the Kams API container on the TierHive VPS (api.usekams.xyz -> 10.3.245.2:3017).
set -euo pipefail
HOST=root@57.129.106.133; PORT=3155
cd "$(dirname "$0")/.."
rsync -az -e "ssh -p $PORT" Dockerfile package.json package-lock.json .dockerignore server "$HOST:/opt/kams/"
ssh -p $PORT $HOST 'cd /opt/kams && docker build -q -t kams-api:latest . && docker rm -f kams-api >/dev/null 2>&1 || true
docker run -d --name kams-api --restart unless-stopped --env-file /opt/kams/.env \
  -e BASE_URL=https://www.usekams.xyz -e WEB_ORIGIN=https://www.usekams.xyz \
  -p 10.3.245.2:3017:3000 -v kams-data:/data --memory 300m kams-api:latest && sleep 3 && curl -s 10.3.245.2:3017/api/health'
