---
type: Architecture
title: SkillsForge application architecture
description: A Vite, React, and React Three Fiber learning game with Supabase-backed evaluation and progress.
resource: ./
tags: [react, vite, threejs, supabase]
timestamp: 2026-08-09T00:00:00+05:30
---

# Architecture

SkillsForge is a browser-based 3D game for practising AI-agent skill writing. Vite starts `src/main.tsx`, which renders `App` into the page root. `App` composes the 3D canvas, first-person controls, station interaction, HUD, tutorial, challenge modal, and victory view.

The application uses React 18 and TypeScript, Tailwind CSS v4 for the 2D interface, and React Three Fiber/Three.js for the world. The production build is generated with Vite. See [development](./development.md) for commands.

The frontend can call the Supabase Edge Function `evaluate-skill`; when it cannot, it uses a browser-local rule-based evaluator. [Evaluation and persistence](./integrations.md) documents those flows.

# Source map

- `src/components/` contains the UI, scene, player movement, interaction, and station visuals.
- `src/data/challenges.ts` is the ordered level configuration.
- `src/hooks/` owns React stateful behaviour for game state, authentication, and proximity.
- `src/services/` contains Supabase, progress, and evaluation clients.
- `supabase/functions/evaluate-skill/` contains the Deno Edge Function.
