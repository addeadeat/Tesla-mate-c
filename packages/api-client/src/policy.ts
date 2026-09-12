/** Fixed, read-only paths. No arbitrary URL or command pass-through. */
export function allowedReadPath(path: string): boolean {
  return /^cars(?:\/[1-9]\d*\/(?:status|drives|charges|battery-health))?$/.test(
    path,
  );
}
export function assertCarId(id: number): void {
  if (!Number.isSafeInteger(id) || id < 1)
    throw new Error("车辆 ID 必须是正整数");
}
export function pollDelay(state: string | null, failures = 0): number {
  const base =
    state === "asleep"
      ? 900_000
      : ["online", "charging", "driving"].includes(state ?? "")
        ? 60_000
        : 300_000;
  return Math.min(900_000, base * 2 ** Math.min(failures, 4));
}
/** Service-owned configuration only. This is not a user-supplied URL proxy. */
export function privateApiOrigin(input: string): string {
  const url = new URL(input);
  const host = url.hostname;
  const ipv4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host);
  const parts = ipv4?.slice(1).map(Number);
  const privateV4 =
    parts &&
    parts.every((n) => n <= 255) &&
    (parts[0] === 127 ||
      parts[0] === 10 ||
      (parts[0] === 192 && parts[1] === 168) ||
      (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
      (parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127));
  const privateHost =
    ["localhost", "[::1]", "teslamateapi"].includes(host) ||
    host.endsWith(".ts.net");
  if (
    !["http:", "https:"].includes(url.protocol) ||
    (!privateV4 && !privateHost) ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  )
    throw new Error("API base 必须是可信私网 origin");
  return url.origin;
}
