"use client";

import { PiAlarmBold } from "react-icons/pi";
import Tooltip from "@/components/Tooltip";

export default function FutureBillTooltip() {
  return (
    <Tooltip
      trigger={
        <div className="p-1 flex items-center bg-[#f59ae6] rounded-full">
          <PiAlarmBold className="text-lg text-[#a34193]" />
        </div>
      }
      className="bg-[#fac0f0]"
      arrowFill="#fac0f0"
    >
      This bill is planned for the future.
    </Tooltip>
  );
}
