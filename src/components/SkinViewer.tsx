import { useEffect, useRef } from "react";
import type { Player } from "@/lib/tiers";

interface Props {
  player: Pick<Player, "uuid" | "username" | "avatarUrl">;
  width?: number;
  height?: number;
  /** When true, plays the wave emote instead of the steady idle pose. */
  emote?: boolean;
  className?: string;
}

/**
 * Renders a 3D Minecraft skin. Steady idle by default; plays a wave emote when `emote` is true.
 * Uses skinview3d (three.js under the hood). Client-only.
 */
export function SkinViewer({
  player,
  width = 180,
  height = 260,
  emote = false,
  className,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewerRef = useRef<any>(null);
  const modRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    let disposed = false;

    (async () => {
      const mod = await import("skinview3d");
      if (disposed) return;
      modRef.current = mod;

      const skinUrl =
        player.uuid && player.uuid.length >= 8
          ? `https://crafatar.com/skins/${player.uuid}`
          : `https://mc-heads.net/skin/${encodeURIComponent(player.username)}`;

      const viewer = new mod.SkinViewer({
        canvas,
        width,
        height,
        skin: skinUrl,
      });
      viewerRef.current = viewer;

      viewer.fov = 40;
      viewer.zoom = 0.9;
      viewer.background = null;
      viewer.autoRotate = false;

      applyAnimation(viewer, mod, emote);
    })();

    return () => {
      disposed = true;
      try {
        viewerRef.current?.dispose?.();
      } catch {
        /* noop */
      }
      viewerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player.uuid, player.username, width, height]);

  // React to emote toggle without recreating the viewer.
  useEffect(() => {
    const viewer = viewerRef.current;
    const mod = modRef.current;
    if (!viewer || !mod) return;
    applyAnimation(viewer, mod, emote);
  }, [emote]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={className}
      style={{ display: "block" }}
    />
  );
}

function applyAnimation(viewer: any, mod: any, emote: boolean) {
  if (!emote) {
    // Steady idle — subtle breathing, no rotation.
    const idle = new mod.IdleAnimation();
    idle.speed = 0.6;
    viewer.animation = idle;
    return;
  }

  // Custom wave emote — raise the right arm and wave the hand.
  class WaveAnimation extends mod.PlayerAnimation {
    animate(player: any) {
      const t = this.progress;
      // Reset other limbs to steady pose.
      player.skin.leftArm.rotation.set(0, 0, 0);
      player.skin.leftLeg.rotation.set(0, 0, 0);
      player.skin.rightLeg.rotation.set(0, 0, 0);
      player.skin.head.rotation.set(0, Math.sin(t * 1.5) * 0.15, 0);
      // Raise right arm overhead and wave.
      player.skin.rightArm.rotation.z = -Math.PI + Math.sin(t * 6) * 0.35;
      player.skin.rightArm.rotation.x = 0;
      player.skin.rightArm.rotation.y = 0;
    }
  }
  const wave = new WaveAnimation();
  wave.speed = 1;
  viewer.animation = wave;
}
