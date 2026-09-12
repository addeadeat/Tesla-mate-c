"use client";
import { ErrorState } from "@/components/states";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <ErrorState
      message="页面暂时无法显示，请重新读取。"
      retry={reset}
      disabled={false}
    />
  );
}
