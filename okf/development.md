---
type: Development Guide
title: Local development and verification
description: Required runtimes, project commands, Conda activation, and visual acceptance checks.
resource: ./package.json
tags: [development, conda, vite, verification]
timestamp: 2026-08-09T00:00:00+05:30
---

# Local setup

The project uses the system Node.js installation for Vite and the new Conda environment named `skillsforge` for Python-based tooling. Activate it with:

```powershell
conda activate skillsforge
```

The environment contains Python 3.12. Node.js is not managed by Conda. In PowerShell, use `npm.cmd` because the machine execution policy may block `npm.ps1`.

# Commands

```powershell
npm.cmd install
npm.cmd run dev
npm.cmd run build
```

# Visual verification

Start the app, enter the world, and confirm the terrain reads as desert sand rather than the sky. Look nearly straight up to confirm the continuous blue upper sky and stars are visible. Walk and interact with each station, then cross the world boundary to verify the warp still returns the player to the centre.
