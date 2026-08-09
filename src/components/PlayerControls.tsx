import { useEffect, useRef, forwardRef, useImperativeHandle, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3 } from 'three';

export interface PlayerControlsHandle {
  lock: () => void;
  unlock: () => void;
  isLocked: () => boolean;
}

interface PlayerControlsProps {
  onLockChange: (locked: boolean) => void;
  onWarp?: () => void;     // called when player is warped back to center
}

const MOVE_SPEED = 5;
const MOUSE_SENSITIVITY = 0.002;
// Avoid the exact Euler poles while still allowing the player to look virtually straight up/down.
const MAX_PITCH = Math.PI / 2 - 0.02;

// World boundary — floor is 80×80, so keep player well inside it
const PLAYER_BOUNDARY = 36;
const WARP_POSITION = new Vector3(0, 1.7, 0);

const pressed = { forward: false, backward: false, left: false, right: false };

function resetPressed() {
  pressed.forward = false;
  pressed.backward = false;
  pressed.left = false;
  pressed.right = false;
}

/**
 * Detects if we're running inside an iframe (e.g. preview panel).
 * Browsers block the Pointer Lock API in cross-origin iframes,
 * so we skip requestPointerLock entirely and rely on drag-look.
 */
function isInsideIframe(): boolean {
  try {
    return window.self !== window.top;
  } catch {
    // Access to window.top is blocked (cross-origin) — definitely in an iframe
    return true;
  }
}

const PlayerControls = forwardRef<PlayerControlsHandle, PlayerControlsProps>(
  ({ onLockChange, onWarp }, ref) => {
    const { camera, gl } = useThree();
    const isIframe = isInsideIframe();
    const lockedRef = useRef(false);
    const isDragging = useRef(false);
    const lastMouse = useRef({ x: 0, y: 0 });
    const yaw = useRef(0);
    const pitch = useRef(0);
    // Reusable vectors to avoid GC churn every frame
    const _fwd = useRef(new Vector3());
    const _rgt = useRef(new Vector3());
    const _dir = useRef(new Vector3());
    // Track previous position to detect boundary cross between frames
    const _prevPos = useRef(new Vector3());

    const setLocked = useCallback((v: boolean) => {
      lockedRef.current = v;
      // Reset pressed keys when lock state changes so no key gets stuck
      resetPressed();
      onLockChange(v);
    }, [onLockChange]);

    useImperativeHandle(ref, () => ({
      lock: () => {
        if (!isIframe) {
          try {
            gl.domElement.requestPointerLock?.();
          } catch { /* ignore */ }
        }
        setLocked(true);
      },
      unlock: () => {
        try { document.exitPointerLock?.(); } catch { /* ignore */ }
        setLocked(false);
      },
      isLocked: () => lockedRef.current,
    }));

    // Keyboard + window blur
    useEffect(() => {
      const down = (e: KeyboardEvent) => {
        switch (e.code) {
          case 'ArrowUp': case 'KeyW': pressed.forward = true; break;
          case 'ArrowDown': case 'KeyS': pressed.backward = true; break;
          case 'ArrowLeft': case 'KeyA': pressed.left = true; break;
          case 'ArrowRight': case 'KeyD': pressed.right = true; break;
          case 'Escape': setLocked(false); break;
        }
      };
      const up = (e: KeyboardEvent) => {
        switch (e.code) {
          case 'ArrowUp': case 'KeyW': pressed.forward = false; break;
          case 'ArrowDown': case 'KeyS': pressed.backward = false; break;
          case 'ArrowLeft': case 'KeyA': pressed.left = false; break;
          case 'ArrowRight': case 'KeyD': pressed.right = false; break;
        }
      };
      const onBlur = () => resetPressed();
      document.addEventListener('keydown', down);
      document.addEventListener('keyup', up);
      window.addEventListener('blur', onBlur);
      return () => {
        document.removeEventListener('keydown', down);
        document.removeEventListener('keyup', up);
        window.removeEventListener('blur', onBlur);
      };
    }, [setLocked]);

    // Mouse: try pointer lock; fall back to drag
    useEffect(() => {
      const canvas = gl.domElement;

      const onClick = () => {
        if (!lockedRef.current && !isIframe) {
          try {
            canvas.requestPointerLock?.();
          } catch { /* ignore */ }
        }
        setLocked(true);
      };

      const onPointerLockChange = () => {
        if (!document.pointerLockElement) {
          setLocked(false);
        }
      };

      const onMouseDown = (e: MouseEvent) => {
        if (e.button !== 0) return;
        if (lockedRef.current && !document.pointerLockElement) {
          isDragging.current = true;
          lastMouse.current = { x: e.clientX, y: e.clientY };
        }
      };

      const onMouseMove = (e: MouseEvent) => {
        if (document.pointerLockElement) {
          yaw.current -= e.movementX * MOUSE_SENSITIVITY;
          pitch.current -= e.movementY * MOUSE_SENSITIVITY;
          pitch.current = Math.max(-MAX_PITCH, Math.min(MAX_PITCH, pitch.current));
          return;
        }

        if (!isDragging.current) return;
        const dx = e.clientX - lastMouse.current.x;
        const dy = e.clientY - lastMouse.current.y;
        lastMouse.current = { x: e.clientX, y: e.clientY };
        yaw.current -= dx * MOUSE_SENSITIVITY;
        pitch.current -= dy * MOUSE_SENSITIVITY;
        pitch.current = Math.max(-MAX_PITCH, Math.min(MAX_PITCH, pitch.current));
      };

      const onMouseUp = () => { isDragging.current = false; };

      canvas.addEventListener('click', onClick);
      document.addEventListener('pointerlockchange', onPointerLockChange);
      document.addEventListener('mousedown', onMouseDown);
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);

      return () => {
        canvas.removeEventListener('click', onClick);
        document.removeEventListener('pointerlockchange', onPointerLockChange);
        document.removeEventListener('mousedown', onMouseDown);
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };
    }, [gl, setLocked]);

    // Apply camera rotation & movement each frame
    useFrame((_, delta) => {
      if (!lockedRef.current) return;

      // ── Rotation ──────────────────────────────────────────
      camera.rotation.order = 'YXZ';
      camera.rotation.y = yaw.current;
      camera.rotation.x = pitch.current;

      // ── Movement ──────────────────────────────────────────
      const speed = MOVE_SPEED * delta;
      const fwd = _fwd.current;
      const rgt = _rgt.current;
      const dir = _dir.current;

      fwd.set(0, 0, -1).applyQuaternion(camera.quaternion);
      fwd.y = 0; fwd.normalize();
      rgt.set(1, 0, 0).applyQuaternion(camera.quaternion);
      rgt.y = 0; rgt.normalize();

      dir.set(0, 0, 0);
      if (pressed.forward) dir.add(fwd);
      if (pressed.backward) dir.sub(fwd);
      if (pressed.left) dir.sub(rgt);
      if (pressed.right) dir.add(rgt);

      if (dir.length() > 0) {
        dir.normalize().multiplyScalar(speed);
        camera.position.add(dir);
        camera.position.y = 1.7;
      }

      // ── Boundary check & warp ─────────────────────────────
      // If the player strays beyond the world boundary, warp them
      // back to the centre with a brief visual flash.
      const px = camera.position.x;
      const pz = camera.position.z;
      if (Math.abs(px) > PLAYER_BOUNDARY || Math.abs(pz) > PLAYER_BOUNDARY) {
        // Save the current position so we can detect crossing direction (optional)
        _prevPos.current.copy(camera.position);

        // Teleport to the warp position (centre of the factory floor)
        camera.position.copy(WARP_POSITION);

        // Keep the current yaw/pitch so the player doesn't get disoriented
        // (only position resets, not look direction)

        // Notify parent for the flash effect
        onWarp?.();
      }
    });

    return null;
  }
);

PlayerControls.displayName = 'PlayerControls';
export default PlayerControls;
