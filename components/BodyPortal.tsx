// src/components/BodyPortal.tsx
"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

type Props = {
  children: ReactNode;
  /** Optional: reuse or customize the mount node */
  containerId?: string;
  /** Optional: class on the mount node (for z-index, etc.) */
  className?: string;
};

export default function BodyPortal({
  children,
  containerId = "__body_portal__",
  className,
}: Props) {
  const [el, setEl] = useState<HTMLElement | null>(null);

  useEffect(() => {
    // Only run on client
    const doc = document;
    let container = doc.getElementById(containerId);
    let created = false;

    if (!container) {
      container = doc.createElement("div");
      container.id = containerId;
      if (className) container.className = className;
      doc.body.appendChild(container);
      created = true;
    } else if (className) {
      // ensure class is applied if the node already existed
      container.classList.add(...className.split(" ").filter(Boolean));
    }

    setEl(container);

    return () => {
      // Clean up only if we created it
      if (created && container && container.parentNode) {
        container.parentNode.removeChild(container);
      }
    };
  }, [containerId, className]);

  // During SSR / before mount, render nothing to avoid hydration mismatch
  if (!el) return null;

  return createPortal(children, el);
}
