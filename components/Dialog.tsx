import { DialogProps } from "@/types/props";
import { PiInfoBold } from "react-icons/pi";

export default function Dialog(props: DialogProps) {
  const { level, content } = props;

  return level === "info" ? (
    <div className="p-2 flex gap-3 text-sm bg-blue-100 rounded-xs">
      <div className="flex items-center py-4 px-2 bg-blue-200 rounded-xs">
        <PiInfoBold className="text-blue-800"/>
      </div>
      <div className="self-center">
        {content}
      </div>
    </div>
  ) : null;
}