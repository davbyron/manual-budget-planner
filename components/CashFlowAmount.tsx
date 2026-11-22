import type { CashFlowAmountProps } from "@/types/props";
import { PiArrowDownRightBold, PiArrowUpRightBold } from "react-icons/pi";

const dollarFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  signDisplay: "never",
});

export default function CashFlowAmount(props: CashFlowAmountProps) {
  const { amountInCents, stackOnSmallScreens } = props;
  const amount = dollarFormatter.format(amountInCents / 100);
  const arrowClass = "size-[1em] shrink-0";

  if (amountInCents === 0) return <span>{amount}</span>;

  const positive = amountInCents > 0;
  const Arrow = positive ? PiArrowUpRightBold : PiArrowDownRightBold;
  const color = positive ? "text-green-800 dark:text-green-300" : "text-red-800 dark:text-red-300";

  return (
    <span
      className={`
        min-w-0 inline-flex items-center gap-0.5
        ${stackOnSmallScreens ? "flex-col items-start sm:flex-row sm:items-center" : ""}
        font-medium tabular-nums ${color}
      `}
    >
      <Arrow className={arrowClass} aria-hidden="true" />
      <span className="min-w-0 wrap-anywhere">{amount}</span>
    </span>
  );
}
