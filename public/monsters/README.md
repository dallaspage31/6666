# Monsters Directory

Contains enemy sprite sheets organized by game act progression.

## Expected Image Formats

- **Sprite sheets**: PNG format, transparent background (RGBA)
- **Animation frames**: PNG format, sequential frames arranged in rows or columns

## Naming Conventions

- Act group directories use lowercase with hyphens: `act-1/`, `act-2/`, `act-5/`, `late-acts/`
- Monster sprite sheet files: `{monsterName}_sheet.png` (e.g., `Goblin_sheet.png`)
- Individual frame images: `{monsterName}_frame_{index}.png`
- Monster icon/thumb: `{monsterName}_icon.png`

## Subdirectories

- `act-1/` — Early-game enemies (weak foes, tutorial enemies)
- `act-2/` — Mid-tier enemies with increased stats
- `act-5/` — Late-mid game enemies, mini-bosses
- `late-acts/` — End-game bosses and elite enemies
