#!/usr/bin/env python3
"""Build the browser-readable Daemoncade catalog from per-game metadata."""

from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RELEASE_STAGES = {"alpha", "beta", "stable"}
SEMVER = re.compile(r"^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?$")


def main() -> None:
    games = []
    for metadata_path in sorted(ROOT.glob("*/game.json")):
        game = json.loads(metadata_path.read_text(encoding="utf-8"))
        slug = metadata_path.parent.name
        if game.get("slug") != slug:
            raise SystemExit(f"{metadata_path}: slug must be {slug!r}")
        if not SEMVER.fullmatch(str(game.get("version", ""))):
            raise SystemExit(f"{metadata_path}: version must be a Semantic Versioning value")
        if game.get("release_stage") not in RELEASE_STAGES:
            raise SystemExit(
                f"{metadata_path}: release_stage must be one of {sorted(RELEASE_STAGES)}"
            )
        icon = game.get("icon")
        if not icon or not (metadata_path.parent / icon).is_file():
            raise SystemExit(f"{metadata_path}: icon {icon!r} does not exist")
        if not (metadata_path.parent / "index.html").is_file():
            raise SystemExit(f"{metadata_path}: index.html does not exist")
        games.append(game)

    games.sort(key=lambda game: game["order"], reverse=True)
    destination = ROOT / "catalog.json"
    destination.write_text(
        json.dumps({"games": games}, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    print(f"Wrote {destination} with {len(games)} games")


if __name__ == "__main__":
    main()
