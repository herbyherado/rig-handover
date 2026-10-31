# Build

> Coordinator-maintained narrative board. TRACK, NEXT, PARKED and DROPPED are coordinator prose: keep them true in the change that moves feature state. NOW and PROVEN are generated from the feature lanes by `limen land`, `limen ticket done` and `limen board --write`; edit the tickets, not those lines.

TRACK at most three bullets. NEXT one clause per ticket. PROVEN names the last ten landed features, then one count line per month.

Status marks are prose only: 🟠 ACTIVE · 🔴 PLANNED · 🟢 PROVEN · ⚪ DROPPED. Nothing in `limen` treats them as workflow state.

## TRACK

- <!-- Current stretch: intended outcome, why it matters, and material constraint. At most three bullets. -->

## NOW

<!-- Generated from spec/features/active/ by limen land, limen ticket done and limen board --write. Edit the tickets, not these lines. -->

## NEXT

- `FNNN-slug` (PLANNED): <!-- One clause: likely outcome, dependency, or sequencing reason. -->

## PROVEN

<!-- Generated from spec/features/done/ by limen land, limen ticket done and limen board --write. Edit the tickets, not these lines. -->

## SEAT

- Pi jobs on this seat run the model through `pi-claude-bridge`, which `--no-extensions` hides. Every `limen spawn` and `limen continue` with `--engine pi --provider claude-bridge` must also pass `--extension /home/agent/.pi/agent/npm/node_modules/pi-claude-bridge`, or the worker fails with `Unknown provider "claude-bridge"`. Route: `--engine pi --provider claude-bridge --model claude-opus-5-5 --thinking medium`.
