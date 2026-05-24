import { useEffect } from "react";

export function ClickRipple() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const r = document.createElement("span");
      const size = 28;
      r.className = "mcranks-ripple";
      r.style.left = `${e.clientX - size / 2}px`;
      r.style.top = `${e.clientY - size / 2}px`;
      r.style.width = `${size}px`;
      r.style.height = `${size}px`;
      document.body.appendChild(r);
      window.setTimeout(() => r.remove(), 600);
    };
    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, []);
  return null;
}
