import { useEffect, useRef } from "react";
import type { Player } from "@/lib/tiers";

interface Props {
  player: Pick<Player, "uuid" | "username" | "avatarUrl">;
  width?: number;
  height?: number;
  /** WALK | RUN | IDLE | FLY */
  animation?: "walk" | "run" | "idle" | "fly";
  className?: string;
}

/**
 * Renders a 3D Minecraft skin on a rotating stand with a walking animation.
 * Uses skinview3d (three.js under the hood). Client-only.
 */
export function SkinViewer({
  player,
  width = 180,
  height = 260,
  animation = "walk",
  className,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    let viewer: any = null;
    let disposed = false;

    (async () => {
      const mod = await import("skinview3d");
      if (disposed) return;

      const skinUrl =
        player.uuid && player.uuid.length >= 8
          ? `https://crafatar.com/skins/${player.uuid}`
          : `https://mc-heads.net/skin/${encodeURIComponent(player.username)}`;

      viewer = new mod.SkinViewer({
        canvas,
        width,
        height,
        skin: skinUrl,
      });

      viewer.fov = 40;
      viewer.zoom = 0.9;
      viewer.background = null;
      viewer.autoRotate = true;
      viewer.autoRotateSpeed = 0.6;

      switch (animation) {
        case "run":
          viewer.animation = new mod.RunningAnimation();
          break;
        case "idle":
          viewer.animation = new mod.IdleAnimation();
          break;
        case "fly":
          viewer.animation = new mod.FlyingAnimation();
          break;
        case "walk":
        default:
          viewer.animation = new mod.WalkingAnimation();
      }
      if (viewer.animation) viewer.animation.speed = 0.8;
    })();

    return () => {
      disposed = true;
      try {
        viewer?.dispose?.();
      } catch {
        /* noop */
      }
    };
  }, [player.uuid, player.username, width, height, animation]);

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
