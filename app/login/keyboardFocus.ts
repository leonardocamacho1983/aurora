import { useEffect } from "react";

const VIEWPORT_HEIGHT_VAR = "--aurora-visual-viewport-height";

export function useVisualViewportHeight() {
  useEffect(() => {
    if (typeof window === "undefined" || !window.visualViewport) return;

    const root = document.documentElement;
    const viewport = window.visualViewport;
    const update = () => {
      root.style.setProperty(VIEWPORT_HEIGHT_VAR, `${Math.round(viewport.height)}px`);
    };

    update();
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    window.addEventListener("orientationchange", update);

    return () => {
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
      window.removeEventListener("orientationchange", update);
      root.style.removeProperty(VIEWPORT_HEIGHT_VAR);
    };
  }, []);
}

export function keepFocusedFieldVisible(input: HTMLInputElement) {
  if (typeof window === "undefined") return;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const scrollToField = () => {
    input.scrollIntoView({
      block: "center",
      inline: "nearest",
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  };

  window.requestAnimationFrame(scrollToField);
  window.setTimeout(scrollToField, 180);
  window.setTimeout(scrollToField, 420);
}
