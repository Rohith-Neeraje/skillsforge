---
type: Integration
title: Evaluation and Supabase integration
description: Client fallback evaluation, Supabase anonymous progress APIs, and the Edge Function's Featherless AI request.
resource: ./supabase/functions/evaluate-skill/index.ts
tags: [supabase, deno, evaluation, persistence]
timestamp: 2026-08-09T00:00:00+05:30
---

# Evaluation

`evaluateSkill` invokes the Supabase `evaluate-skill` Edge Function with a level identifier and submitted skill content. If the request fails, returns an error, or produces an invalid payload, the frontend uses a local regex-based fallback evaluator.

The Edge Function accepts `POST` requests, validates the level and content length, builds a level-specific rubric prompt, requests an evaluation from Featherless AI, parses JSON output, and returns score, XP, pass state, feedback, and detected elements. It requires the `FEATHERLESS_API_KEY` environment variable; the key is not stored in this repository.

# Persistence

`progress.ts` supports anonymous Supabase sign-in and reads or writes `profiles`, `progress`, and `badges` rows. The expected progress conflict keys are `user_id, level_id`; badge conflict keys are `user_id, badge_id`. Failures return `null` or `false` so gameplay can continue without persistence.
