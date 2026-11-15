import type { TableProps } from "@/types/props";

export default function Table(props: TableProps) {
  const { caption, theadContents, tbodyContents } = props;

  return (
    <div className="overflow-x-auto">
      <table className="table-fixed min-w-full" tabIndex={0}>
        <caption className="sr-only">{caption}</caption>
        <thead className="border-b-2">
          {theadContents}
        </thead>

        <tbody>
          {tbodyContents}
        </tbody>
      </table>
    </div>
  )
}