"use client";

import { PiSealWarningBold } from "react-icons/pi";
import Tooltip from "@/components/Tooltip";

export default function PastBillTooltip() {
  return (
    <Tooltip
      trigger={
        <div className="p-1 flex items-center bg-yellow-200 rounded-full">
          <PiSealWarningBold className="text-lg text-yellow-600" />
        </div>
      }
      className="bg-yellow-100"
      arrowFill="#fef9c3"
    >
      This bill is past its end date.
    </Tooltip>
  );
}
