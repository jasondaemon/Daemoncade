#!/bin/sh
set -eu

repo_dir=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)

echo "Meddle preview: http://127.0.0.1:4174/games/meddle/"
echo "Keep this Terminal window open; press Control-C to stop."
exec python3 -m http.server 4174 --bind 127.0.0.1 --directory "$repo_dir"
