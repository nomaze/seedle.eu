"use client";

import { useEffect, useRef } from "react";
import { useSpross } from "@/components/spross/SprossContext";

export interface UseSprossTargetOptions {
  /** Explicit callback action triggered when Spross targets the element (avoids imperative .click()). */
  onTrigger?: () => void;
}

export function useSprossTarget<T extends HTMLElement = HTMLElement>(
  targetId: string,
  options?: UseSprossTargetOptions
) {
  const ref = useRef<T | null>(null);
  const { registerTarget, activeHighlight } = useSpross();
  const isHighlighted = activeHighlight === targetId;

  useEffect(() => {
    return registerTarget(targetId, {
      element: ref.current,
      onTrigger: options?.onTrigger,
    });
  }, [targetId, registerTarget, options?.onTrigger]);

  return {
    ref,
    isHighlighted,
    targetProps: {
      ref,
      "data-spross-target": targetId,
      "data-spross-highlight": isHighlighted ? "true" : undefined,
    },
  };
}
