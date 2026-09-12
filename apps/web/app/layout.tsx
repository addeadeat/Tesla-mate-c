import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Navigation } from "@/components/navigation";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Z · 我的车辆", template: "%s · Z" },
  description: "自用车辆数据看板，行程与充电一目了然。",
  applicationName: "Z",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Z" },
  icons: { icon: "/icons/icon-192.png", apple: "/icons/apple-touch-icon.png" },
  robots: { index: false, follow: false },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#172c28",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const mock = process.env.NEXT_PUBLIC_USE_MOCK !== "false";
  return (
    <html lang="zh-CN">
      <body>
        <a className="skip-link" href="#main">
          跳到内容
        </a>
        <div className="app-shell">
          <header className="app-header">
            <Link className="brand" href="/" aria-label="Z 首页">
              Z<span>行车手记</span>
            </Link>
            <span className={`mode-badge ${mock ? "" : "live"}`}>
              <i />
              {mock ? "演示数据" : "车辆记录"}
            </span>
          </header>
          <main id="main">{children}</main>
          <footer className="page-footer">Z · 私人行车手记</footer>
          <Navigation />
        </div>
      </body>
    </html>
  );
}
