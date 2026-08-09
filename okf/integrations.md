---
type: Integration
title: Evaluation integration
description: Next.js server-side Featherless AI evaluation with a browser-local fallback.
resource: ./app/api/evaluate/route.ts
tags: [nextjs, featherless, evaluation]
timestamp: 2026-08-09T00:00:00+05:30
---

# Evaluation

`evaluateSkill` posts the level identifier and submitted skill content to the Next.js `POST /api/evaluate` route. If the request fails, returns an error, or produces an invalid payload, the frontend uses a local regex-based fallback evaluator.

The route accepts `POST` requests, validates the level and content length, builds a level-specific rubric prompt, requests an evaluation from Featherless AI, parses JSON output, and returns score, XP, pass state, feedback, and detected elements. It requires the `FEATHERLESS_API_KEY` server environment variable; the key is not exposed to the browser or stored in this repository.
