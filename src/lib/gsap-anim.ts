import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/** Split a text node into per-character spans and stagger them in. */
export function useTextReveal<T extends HTMLElement>(deps: unknown[] = []) {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const text = el.dataset["text"] ?? el.textContent ?? "";
    el.dataset["text"] = text;
    el.textContent = "";
    const chars = [...text].map((ch) => {
      const s = document.createElement("span");
      s.textContent = ch === " " ? "\u00a0" : ch;
      s.style.display = "inline-block";
      s.style.willChange = "transform,opacity";
      el.appendChild(s);
      return s;
    });
    const tween = gsap.from(chars, {
      yPercent: 110,
      opacity: 0,
      duration: 0.6,
      ease: "power3.out",
      stagger: 0.03,
    });
    return () => {
      tween.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return ref;
}

/** Reveal direct children of the container on scroll inside a scrollable panel. */
export function useScrollReveal<T extends HTMLElement>(selector: string, scroller?: string) {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const items = Array.from(el.querySelectorAll<HTMLElement>(selector));
    const ctx = gsap.context(() => {
      items.forEach((item, i) => {
        gsap.from(item, {
          y: 28,
          opacity: 0,
          duration: 0.7,
          delay: Math.min(i * 0.06, 0.3),
          ease: "power3.out",
          scrollTrigger: {
            trigger: item,
            scroller: scroller ?? undefined,
            start: "top 95%",
            once: true,
          },
        });
      });
    }, el);
    ScrollTrigger.refresh();
    return () => ctx.revert();
  }, [selector, scroller]);
  return ref;
}

/** Pointer-follow glow + subtle tilt on a card. */
export function useMagneticCard<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      el.style.setProperty("--mx", `${px * 100}%`);
      el.style.setProperty("--my", `${py * 100}%`);
      gsap.to(el, {
        rotateX: (0.5 - py) * 4,
        rotateY: (px - 0.5) * 4,
        duration: 0.5,
        ease: "power2.out",
        transformPerspective: 900,
      });
    };
    const leave = () => gsap.to(el, { rotateX: 0, rotateY: 0, duration: 0.6, ease: "power2.out" });
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
    };
  }, []);
  return ref;
}

export { gsap, ScrollTrigger };
