"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./icons";

const links = [
  { href: "/", label: "状态", icon: "home" },
  { href: "/drives", label: "行程", icon: "drive" },
  { href: "/charges", label: "充电", icon: "charge" },
] as const;
export function Navigation() {
  const path = usePathname();
  return (
    <nav className="bottom-nav" aria-label="主导航">
      {links.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={path === item.href ? "page" : undefined}
        >
          <Icon name={item.icon} />
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}
