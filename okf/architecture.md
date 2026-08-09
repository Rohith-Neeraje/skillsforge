---
type: Architecture
title: SkillsForge application architecture
description: A Next.js, React, and React Three Fiber learning game with server-side AI evaluation.
resource: ./
tags: [nextjs, react, threejs, evaluation]
timestamp: 2026-08-09T00:00:00+05:30
---

# Architecture

SkillsForge is a browser-based 3D game for practising AI-agent skill writing. The Next.js App Router renders the client-only game entry at `app/page.tsx`, which loads `src/App.tsx`. `App` composes the 3D canvas, first-person controls, station interaction, HUD, tutorial, challenge modal, and victory view.

The application uses Next.js, React 18, and TypeScript, Tailwind CSS v4 for the 2D interface, and React Three Fiber/Three.js for the world. The production build is generated with Next.js. See [development](./development.md) for commands.

The frontend posts submissions to the Next.js `POST /api/evaluate` route; when it cannot use the route, it uses a browser-local rule-based evaluator. [Evaluation](./integrations.md) documents those flows.

# Source map

- `src/components/` contains the UI, scene, player movement, interaction, and station visuals.
- `src/data/challenges.ts` is the ordered level configuration.
- `src/hooks/` owns React stateful behaviour for game state and station proximity.
- `src/services/` contains the evaluation client and browser-local fallback evaluator.
- `app/api/evaluate/route.ts` validates submissions and calls Featherless AI from the server.
