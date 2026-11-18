"use client";

import React, { useRef, useState } from "react";
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
import { PiQuestionBold } from "react-icons/pi";

export type HelpTooltipProps = {
  children: React.ReactNode;
}
 
export default function HelpTooltip(props: HelpTooltipProps) {
  const { children } = props;

  const arrowRef = useRef(null);

  const [isOpen, setIsOpen] = useState(true);

  const {refs, floatingStyles, context} = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    middleware: [
      offset(10),
      flip(),
      shift(),
      arrow({
        element: arrowRef,
      })
    ],
    whileElementsMounted: autoUpdate,
    placement: "right",
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
            ref={refs.setFloating}
            style={floatingStyles}
            {...getFloatingProps()}
            className=" max-w-140 p-3 flex gap-3 text-sm bg-blue-100 shadow z-100"
          >
            <FloatingArrow ref={arrowRef} context={context} fill="#dbeafe" />
            {children}
          </div>
        )}
      </FloatingPortal>
    </>
  );
}