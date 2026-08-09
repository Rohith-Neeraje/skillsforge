---
type: 3D Scene
title: Sunset desert scene and first-person controls
description: The React Three Fiber world containing procedural terrain, a camera-following sky, stations, and player movement.
resource: ./src/components/FactoryScene.tsx
tags: [threejs, react-three-fiber, terrain, sky, controls]
timestamp: 2026-08-09T00:00:00+05:30
---

# Scene

`GameCanvas` creates the full-screen Three.js renderer with ACES filmic tone mapping, shadows, bloom, a 75-degree camera, and a 200-unit far plane. `FactoryScene` supplies lights, fog, terrain, paths, environmental props, station pedestals, and the camera-following sky.

# Terrain and sky

The 80×80 terrain is generated deterministically from value noise and fractal Brownian motion. Its centre is flattened for station gameplay. Terrain vertex colors now use an intentionally separate sand palette—deep umber troughs, warm ochre mids, and golden dune crests—rather than the sky’s magenta/blue family. The material is highly rough and non-metallic.

`SkyWrapper` follows the camera, keeping a 160-unit inward-facing shader dome, star field, constellations, and planets around the player. The dome has a visible blue zenith, preventing an empty-looking overhead view. `PlayerControls` limits pitch just inside the Euler poles while retaining near-vertical look.

# Movement

Movement uses WASD or arrow keys, pointer lock when available, and drag-look in iframe previews. Movement stays horizontal at camera height 1.7. Crossing the 36-unit boundary teleports the player to the centre and triggers a UI flash.
