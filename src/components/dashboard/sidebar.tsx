"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Scale,
  Users,
  Briefcase,
  FileText,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/procesos", label: "Procesos", icon: Scale },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/abogados", label: "Abogados", icon: Briefcase },
  { href: "/documentos", label: "Documentos", icon: FileText },
  { href: "/configuracion", label: "Configuración", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 flex-col bg-[#060606]">
      {/* Logo */}
      <div className="px-7 pt-7 pb-5">
        <Link
          href="/"
          className="text-[1.25rem] font-light uppercase tracking-[0.25em] text-white"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          LEXIA
        </Link>
      </div>

      {/* Divider */}
      <div className="mx-5 border-t border-white/[0.15]" />

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 px-0 py-5">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex items-center gap-3 px-7 py-2.5 text-[13px] font-medium tracking-wide transition-colors",
                isActive
                  ? "bg-[rgba(0,128,128,0.12)] text-white before:absolute before:left-0 before:top-0 before:h-full before:w-[2px] before:bg-[#008080]"
                  : "text-white/[0.65] hover:bg-white/[0.06] hover:text-white/90"
              )}
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="mx-5 border-t border-white/[0.15]" />
      <div className="px-7 py-4">
        <p className="text-[11px] tracking-wide text-white/30">
          Intelligence Hub
        </p>
      </div>
    </aside>
  );
}
