# Backgrounds Directory

Contains parallax background layer images for the game UI and scenes.

## Expected Image Formats

- **Parallax layers**: PNG or WebP format, transparent or semi-transparent where needed
- **Optimized**: Prefer WebP for smaller file sizes; PNG for lossless transparency

## Naming Conventions

- Layer directories use kebab-case descriptive names
- Layer images: `{layerName}.png` or `{layerName}.webp`
- Variant versions (e.g., day/night): `{layerName}_{variant}.png`

## Subdirectories

- `far-sky/` — Far sky layer (slowest parallax movement)
- `middle-mountains/` — Mountain range mid-ground layer
- `ground-terrain/` — Ground and terrain visible layer
- `foreground/` — Foreground decorative elements (fastest parallax movement)
