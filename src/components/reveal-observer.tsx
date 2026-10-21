"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Fait apparaître en douceur les éléments [data-reveal] quand ils entrent à l'écran.
 * Sans JavaScript, la classe « reveal-ready » n'est jamais posée : tout reste visible.
 */
export function RevealObserver() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    const elements = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]:not(.is-visible)"));

    // Ce qui est déjà à l'écran s'affiche tout de suite, sans clignoter.
    const inView = (el: HTMLElement) => {
      const r = el.getBoundingClientRect();
      return r.top < window.innerHeight && r.bottom > 0;
    };
    const pending = elements.filter((el) => {
      if (inView(el)) {
        el.classList.add("is-visible");
        return false;
      }
      return true;
    });
    root.classList.add("reveal-ready");

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.1 },
    );
    pending.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [pathname]);

  return null;
}
