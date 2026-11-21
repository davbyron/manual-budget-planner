"use client";

import { PiExclamationMarkBold } from "react-icons/pi";
import Tooltip from "@/components/Tooltip";

export default function VariableBillWarningTooltip() {
  return (
    <Tooltip
      trigger={
        <div className="p-1 flex items-center bg-[#efc0cc] rounded-full">
          <PiExclamationMarkBold className="text-lg text-[#800020]" aria-hidden="true" />
          <span className="sr-only">Missing bill amount</span>
        </div>
      }
      className="text-[#650019] bg-[#f9e0e6]"
      arrowFill="#f9e0e6"
    >
      This bill does not yet have an amount.
    </Tooltip>
  );
}
