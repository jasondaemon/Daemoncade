#!/bin/sh
set -eu

repo_dir=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
port=${1:-4174}

printf 'Serving Daemoncade at http://127.0.0.1:%s/\n' "$port"
printf 'Open the arcade menu above, or append a game directory to the URL.\n'
exec python3 -m http.server "$port" --bind 127.0.0.1 --directory "$repo_dir"
