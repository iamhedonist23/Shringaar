"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const footer = document.querySelector("footer");
    let footerIsVisible = false;

    function updateVisibility() {
      setVisible(window.scrollY > 500 && !footerIsVisible);
    }

    const observer = footer
      ? new IntersectionObserver(([entry]) => {
          footerIsVisible = entry.isIntersecting;
          updateVisibility();
        })
      : null;
    if (footer) observer?.observe(footer);

    updateVisibility();
    window.addEventListener("scroll", updateVisibility, { passive: true });
    return () => {
      window.removeEventListener("scroll", updateVisibility);
      observer?.disconnect();
    };
  }, []);

  if (!visible) return null;

  return (
    <button
      aria-label="Back to top"
      className="fixed bottom-5 right-4 z-30 grid size-11 place-items-center rounded-full border border-plum/10 bg-[#e5c57a] text-plum shadow-soft transition hover:scale-105 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum focus-visible:ring-offset-2 sm:right-6"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      type="button"
    >
      <ArrowUp aria-hidden="true" className="size-5" />
    </button>
  );
}
