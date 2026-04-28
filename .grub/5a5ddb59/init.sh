#!/usr/bin/env bash
set -euo pipefail

echo "=== grub bearings (5a5ddb59) ==="
echo "--- pwd ---"
pwd
echo "--- recent commits ---"
cd /d/Projects/Pencil/Asgard-platform && git log --oneline -n 10 2>/dev/null || true
echo "--- working tree ---"
git status --short 2>/dev/null || true
echo "--- submodule status ---"
git submodule status 2>/dev/null || true
echo "--- feature progress ---"
TOTAL=$(grep -c '"passes"' .grub/5a5ddb59/feature-list.json 2>/dev/null || echo 0)
PASS=$(grep '"passes": true' .grub/5a5ddb59/feature-list.json 2>/dev/null | wc -l || echo 0)
echo "${PASS}/${TOTAL} features passing"
echo "--- progress tail ---"
tail -n 40 .grub/5a5ddb59/progress-log.md 2>/dev/null || true
echo "=== smoke: python syntax check ==="
cd /d/Projects/Pencil/Asgard-platform/packages/api
for f in app/config.py app/schemas.py app/main.py app/routers/chat.py app/auth.py; do
  if [ -f "$f" ]; then
    python -m py_compile "$f" 2>&1 && echo "  OK: $f" || echo "  FAIL: $f"
  else
    echo "  SKIP: $f (not found)"
  fi
done
echo "=== bearings complete ==="
