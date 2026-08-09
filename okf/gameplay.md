---
type: Gameplay System
title: Challenge and progression flow
description: How players enter the world, unlock stations, submit skills, and earn XP and badges.
resource: ./src/App.tsx
tags: [gameplay, challenges, progression]
timestamp: 2026-08-09T00:00:00+05:30
---

# Gameplay flow

The HUD starts a session and synchronously requests player control locking. The player moves between four stations in the [3D scene](./scene.md), and `InteractionSystem` opens a challenge when the player is close enough to an unlocked station.

Each challenge definition supplies story content, requirements, evaluator criteria, XP breakdown, fail conditions, reward, worker presentation, and world position. `isLevelUnlocked` always unlocks `guardrails`; later levels may name a prerequisite using `unlockCondition`.

The submitted Markdown is evaluated before `useGameState` records completion, XP, and badges. The current code keeps game state in the browser for the active session. Challenge data, scoring types, and results are described in [interface model](./interfaces.md).

# Current levels

1. `guardrails` — hard compensation limits.
2. `variables` — structured input handling.
3. `copywriter` — style and tone constraints.
4. `boss` — validated HR onboarding workflow.
