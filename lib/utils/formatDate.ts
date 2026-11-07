export default function formatDate(date: string): string {
  const [year, month, day] = date.split("-");
  return `${month}/${day}/${year.slice(-2)}`;
}
