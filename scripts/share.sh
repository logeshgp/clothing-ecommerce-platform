#!/usr/bin/env bash
#
# Expose the storefront on the local network AND the public internet.
#
#   ./scripts/share.sh            # dev server (hot reload) on :5173
#   ./scripts/share.sh preview    # production build on :4173
#
# The LAN URL works for any device on the same Wi-Fi. The tunnel URL works
# from anywhere, for as long as this script keeps running.

set -euo pipefail

MODE="${1:-dev}"
export PATH="$HOME/.local/node/bin:$PATH"

if [ "$MODE" = "preview" ]; then
  PORT=4173
else
  PORT=5173
fi

# ---------------------------------------------------------------- LAN address
LAN_IP="$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || true)"
if [ -z "$LAN_IP" ]; then
  LAN_IP="$(hostname -I 2>/dev/null | awk '{print $1}' || true)"
fi

cleanup() {
  echo ""
  echo "Shutting down…"
  [ -n "${SERVER_PID:-}" ] && kill "$SERVER_PID" 2>/dev/null || true
  [ -n "${TUNNEL_PID:-}" ] && kill "$TUNNEL_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

# -------------------------------------------------------------- start server
if [ "$MODE" = "preview" ]; then
  echo "Building production bundle…"
  npm run build >/dev/null
  npm run preview >/tmp/dnd-server.log 2>&1 &
else
  npm run dev >/tmp/dnd-server.log 2>&1 &
fi
SERVER_PID=$!

# Wait for the port to answer before announcing anything.
for _ in $(seq 1 40); do
  if curl -fsS -o /dev/null "http://localhost:$PORT/"; then break; fi
  sleep 0.5
done

echo ""
echo "─────────────────────────────────────────────"
echo " Local      http://localhost:$PORT"
[ -n "$LAN_IP" ] && echo " Network    http://$LAN_IP:$PORT"
echo "─────────────────────────────────────────────"
echo ""

# --------------------------------------------------------- public tunnel
echo "Opening a public tunnel (Cloudflare)…"
npx --yes cloudflared tunnel --url "http://localhost:$PORT" 2>&1 \
  | tee /tmp/dnd-tunnel.log \
  | grep --line-buffered -Eo 'https://[a-z0-9-]+\.trycloudflare\.com' \
  | while read -r url; do
      echo ""
      echo " Internet   $url"
      echo ""
      echo "Share that link with anyone. Press Ctrl+C to stop."
    done &
TUNNEL_PID=$!

wait "$SERVER_PID"
