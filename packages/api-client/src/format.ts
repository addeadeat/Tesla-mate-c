export const TIME_ZONE = "Asia/Hong_Kong";
export function formatDate(iso: string | null, timeOnly = false): string {
  if (!iso || !Number.isFinite(Date.parse(iso))) return "时间未知";
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: TIME_ZONE,
    ...(timeOnly ? {} : { month: "2-digit", day: "2-digit" }),
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(iso));
}
export function formatNumber(value: number | null, digits = 0): string {
  return value === null || !Number.isFinite(value)
    ? "—"
    : value.toLocaleString("zh-CN", { maximumFractionDigits: digits });
}
