"use client";

import type { TooltipProps } from "@/types/props";
import {
  arrow,
  autoUpdate,
  flip,
  FloatingArrow,
  FloatingPortal,
  offset,
  shift,
  useDismiss,
  useFloating,
  useFocus,
  useHover,
  useInteractions,
  useRole,
} from "@floating-ui/react";
import { useRef, useState } from "react";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";

export default function Tooltip(props: TooltipProps) {
  const { trigger, className, arrowFill, children } = props;

  const arrowRef = useRef(null);
  const isLargeScreen = useMediaQuery("(min-width: 64rem)");

  const [isOpen, setIsOpen] = useState(false);

  const {refs, floatingStyles, context} = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    middleware: [
      offset(10),
      flip(),
      shift(),
      // Floating UI reads this ref during positioning.
      // eslint-disable-next-line react-hooks/refs
      arrow({
        element: arrowRef,
      })
    ],
    whileElementsMounted: autoUpdate,
    placement: isLargeScreen ? "right" : "bottom",
  });

  const hover = useHover(context, {move: false});
  const focus = useFocus(context);
  const dismiss = useDismiss(context);
  const role = useRole(context, {
    role: "label",
  });

  // Merge all the interactions into prop getters
  const {getReferenceProps, getFloatingProps} = useInteractions([
    hover,
    focus,
    dismiss,
    role,
  ]);

  return (
    <>
      <button
        type="button"
        ref={refs.setReference}
        {...getReferenceProps()}
      >
        {trigger}
      </button>
      <FloatingPortal>
        {isOpen && (
          <div
            // Floating UI exposes a callback setter here.
            // eslint-disable-next-line react-hooks/refs
            ref={refs.setFloating}
            style={floatingStyles}
            {...getFloatingProps()}
            className={`p-3 max-w-110 flex gap-3 text-sm z-100 shadow ${className}`}
          >
            <FloatingArrow
              ref={arrowRef}
              context={context}
              fill={arrowFill}
            />
            {children}
          </div>
        )}
      </FloatingPortal>
    </>
  );
}
