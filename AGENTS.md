# Taskforge Idle — Agent Context

## Project
- **Name**: Taskforge Idle
- **Repo**: `taskforge-idle` (private)
- **Build**: AFK ARPG idle with Pixelorama art pipeline
- **Target**: 120-stage campaign + Endless Frontier

## Module Inventory
| # | Module | Status |
|---|--------|--------|
| 00 | bigint | DONE |
| 01 | rng | DONE |
| 02 | state | DONE |
| 03 | engine | DONE |
| 04 | input | DONE |
| 05 | session-persistence | DONE |
| 06 | ui-hud | DONE |
| 07 | talent-tree | DONE |
| 08 | shop | DONE |
| 09 | loadout | DONE |
| 10 | ability-registry | DONE |
| 11 | ability-effects | DONE |
| 12 | damage | DONE |
| 13 | renderer (game-renderer.js) | DONE |
| 14 | save-manager (save-system.js) | DONE |
| 15 | forge-tokens | DONE |
| 16 | frontier-director | DONE |

## Scripts
- `npm test` — Node test runner
- `npm run art:pixelorama:*` — Pixelorama pipeline
- `npm run verify:release:quick` — Full validation

## Conventions
- Node ESM (`"type": "module"`)
- Tests: node:test + node:assert
- No secrets committed
- Canvas objects mocked in Node tests
