---
type: TypeScript Interface
title: Core game contracts
description: Type definitions shared by challenge configuration, evaluation, rewards, and in-memory player state.
resource: ./src/types
tags: [typescript, types, api]
timestamp: 2026-08-09T00:00:00+05:30
---

# Interface model

`LevelConfig` defines the public configuration shape of a challenge: identity and presentation, a station position, instructional content, evaluation criteria, XP breakdown, fail conditions, reward, and optional unlock condition. `EvaluationResult` carries the evaluator's normalized score, earned XP, pass status, feedback, and found/missing elements.

`GameState` tracks the player identifier, XP, current level, per-level completion state, badges, loading/error flags, pointer-lock state, and victory state. `LevelState` retains an individual level's score, XP, best submission, and attempt count.

`Reward` supports badge, title, template, certificate, and library reward variants. `CharacterType` selects the visual worker model. The [gameplay system](./gameplay.md) consumes these contracts.
