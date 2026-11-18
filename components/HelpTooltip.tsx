"use client";

import type { HelpTooltipProps } from "@/types/props";
import { PiQuestionBold } from "react-icons/pi";
import Tooltip from "@/components/Tooltip";

export default function HelpTooltip(props: HelpTooltipProps) {
  const { children } = props;

  return (
    <Tooltip
      trigger={
        <div className="p-1 flex items-center bg-blue-200 rounded-full">
          <PiQuestionBold className="text-blue-800" />
        </div>
      }
      className="bg-blue-100"
      arrowFill="#dbeafe"
    >
      {children}
    </Tooltip>
  );
}
