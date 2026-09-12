import { allowedReadPath, privateApiOrigin } from "@z/api-client";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
const noStore = { "Cache-Control": "no-store" };
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  const suffix = path.join("/");
  if (!allowedReadPath(suffix))
    return Response.json(
      { error: "Read endpoint not allowed" },
      { status: 404, headers: noStore },
    );
  if (process.env.NEXT_PUBLIC_USE_MOCK !== "false")
    return Response.json(
      { error: "Real API is disabled in mock mode" },
      { status: 503, headers: noStore },
    );
  if (
    [...request.nextUrl.searchParams.keys()].some(
      (key) => !["page", "show"].includes(key),
    )
  )
    return Response.json(
      { error: "Query not allowed" },
      { status: 400, headers: noStore },
    );
  const history = /\/(drives|charges)$/.test(suffix);
  const page = request.nextUrl.searchParams.get("page");
  const show = request.nextUrl.searchParams.get("show");
  if (
    (page && page !== "1") ||
    (show && show !== "20") ||
    (!history && (page || show))
  )
    return Response.json(
      { error: "Query not allowed" },
      { status: 400, headers: noStore },
    );
  let origin: string;
  try {
    origin = privateApiOrigin(process.env.NEXT_PUBLIC_API_BASE ?? "");
  } catch {
    return Response.json(
      { error: "Private API origin is not configured" },
      { status: 503, headers: noStore },
    );
  }
  const headers: Record<string, string> = { Accept: "application/json" };
  const token = process.env.TESLAMATE_API_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;
  try {
    const response = await fetch(
      `${origin}/api/v1/${suffix}${history ? "?page=1&show=20" : ""}`,
      {
        method: "GET",
        headers,
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.any([request.signal, AbortSignal.timeout(10_000)]),
      },
    );
    if (!response.ok)
      return Response.json(
        { error: "Upstream data unavailable" },
        { status: 502, headers: noStore },
      );
    return Response.json(await response.json(), { headers: noStore });
  } catch {
    return Response.json(
      { error: "Upstream timeout or network error" },
      { status: 502, headers: noStore },
    );
  }
}
