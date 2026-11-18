"use client";

import type { HelpTooltipProps } from "@/types/props";
import {
  useFloating,
  useInteractions,
  useHover,
  useFocus,
  useDismiss,
  useRole,
  autoUpdate,
  offset,
  flip,
  shift,
  arrow,
  FloatingPortal,
  FloatingArrow,
} from "@floating-ui/react";
import { useRef, useState } from "react";
import { PiQuestionBold } from "react-icons/pi";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";

export default function HelpTooltip(props: HelpTooltipProps) {
  const { children } = props;

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
      <button ref={refs.setReference} {...getReferenceProps()}>
        <div className="p-1 flex items-center bg-blue-200 rounded-full">
          <PiQuestionBold className="text-blue-800"/>
        </div>
      </button>
      <FloatingPortal>
        {isOpen && (
          <div
            // Floating UI exposes a callback setter here.
            // eslint-disable-next-line react-hooks/refs
            ref={refs.setFloating}
            style={floatingStyles}
            {...getFloatingProps()}
            className=" max-w-110 p-3 flex gap-3 text-sm bg-blue-100 shadow z-100"
          >
            <FloatingArrow ref={arrowRef} context={context} fill="#dbeafe" />
            {children}
          </div>
        )}
      </FloatingPortal>
    </>
  );
}
