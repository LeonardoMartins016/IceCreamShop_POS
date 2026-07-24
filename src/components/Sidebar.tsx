"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { FiShoppingCart, FiFileText, FiBarChart2, FiSettings, FiMenu, FiX, FiSun } from "react-icons/fi";
import { GiIceCreamCone } from "react-icons/gi";

const navItems = [
  { href: "/", label: "Caixa", icon: FiShoppingCart },
  { href: "/comandas", label: "Comandas", icon: FiFileText },
  { href: "/vendas", label: "Vendas", icon: FiBarChart2 },
  { href: "/admin", label: "Admin", icon: FiSettings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile hamburger */}
      <button
        className="fixed top-4 left-4 z-50 md:hidden bg-white shadow-card rounded-xl p-2.5 text-brand-dark"
        onClick={() => setOpen(!open)}
        aria-label="Menu"
      >
        {open ? <FiX size={22} /> : <FiMenu size={22} />}
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-64 bg-white shadow-[2px_0_16px_rgba(0,0,0,0.06)]
          flex flex-col z-40 transform transition-transform duration-300
          ${open ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
        `}
      >
        {/* Brand header */}
        <div className="px-5 py-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-brand-red to-brand-orange rounded-xl flex items-center justify-center shadow-sm">
              <GiIceCreamCone className="text-white" size={22} />
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-brand-red font-extrabold text-lg leading-none">Doce</span>
                <span className="text-brand-blue font-extrabold text-lg leading-none">Sabor</span>
              </div>
              <p className="text-[10px] text-gray-400 font-medium tracking-wider uppercase mt-0.5">Sorveteria</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={isActive ? "nav-link-active" : "nav-link"}
              >
                <Icon size={18} className="shrink-0" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <FiSun size={14} className="text-brand-orange" />
            <span>PDV v1.0</span>
          </div>
        </div>
      </aside>
    </>
  );
}
