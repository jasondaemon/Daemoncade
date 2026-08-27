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

    markdown = [
        "# Daemoncade game catalog",
        "",
        "Every game is versioned independently. Its icon, metadata, and playable files travel together in its directory.",
        "",
        "This page is generated from the per-game `game.json` files by `./scripts/build-catalog.py`.",
        "",
    ]
    for stage in ("stable", "beta", "alpha"):
        stage_games = [game for game in games if game["release_stage"] == stage]
        markdown.extend(
            [
                f"## {stage.title()}",
                "",
                "| Icon | Game | Version | About |",
                "| --- | --- | --- | --- |",
            ]
        )
        for game in stage_games:
            summary = str(game["summary"]).replace("|", "\\|").replace("\n", " ")
            markdown.append(
                f'| <img src="{game["slug"]}/{game["icon"]}" width="48" height="48" alt=""> '
                f'| [{game["title"]}]({game["slug"]}/) | `{game["version"]}` | {summary} |'
            )
        markdown.append("")

    games_page = ROOT / "GAMES.md"
    games_page.write_text("\n".join(markdown), encoding="utf-8")
    print(f"Wrote {destination} and {games_page} with {len(games)} games")


if __name__ == "__main__":
    main()
