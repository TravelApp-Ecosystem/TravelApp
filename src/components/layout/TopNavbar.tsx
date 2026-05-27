"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Globe, LogOut, User } from "lucide-react";
import { topNavTabs } from "@/lib/navigation";
import { NotificationsPopover } from "./NotificationsPopover";
import { useAuth } from "@/contexts/AuthContext";

export const TopNavbar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  // Helper function to check if a tab is active based on current path
  const isTabActive = (href: string) => {
    if (href === "/" && pathname === "/") return true;
    if (href !== "/" && pathname.startsWith(href)) return true;
    return false;
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <header className="sticky top-0 z-50 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
      <div className="flex items-center">
        <img
          src="/assets/travelapp_original.svg"
          alt="TravelApp Ecosystem"
          className="h-8 w-auto"
        />
      </div>

      <nav className="hidden flex-1 justify-center lg:flex">
        <ul className="flex space-x-1 rounded-full bg-slate-50 p-1 border border-slate-200">
          {topNavTabs.map((tab) => {
            const active = isTabActive(tab.href);
            return (
              <li key={tab.id}>
                <Link
                  href={tab.href}
                  className={`block rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                    active
                      ? "bg-tech-blue text-white"
                      : "text-slate-500 hover:text-tech-blue hover:bg-slate-100"
                  }`}
                >
                  {tab.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="flex items-center space-x-3">
        <NotificationsPopover />

        {/* Language selector */}
        <div className="flex items-center space-x-2 text-slate-500 bg-slate-50 px-3 py-1.5 rounded-md border border-slate-200">
          <Globe className="h-4 w-4" />
          <select className="bg-transparent text-sm font-medium outline-none text-tech-blue appearance-none cursor-pointer">
            <option value="es">ES</option>
            <option value="en">EN</option>
            <option value="pt">PT</option>
          </select>
        </div>

        {/* User info + logout */}
        {user ? (
          <div className="flex items-center gap-2">
            <div className="hidden flex-col items-end sm:flex">
              <span className="text-xs font-bold text-tech-blue leading-none">
                {user.displayName ?? user.email?.split("@")[0]}
              </span>
              <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                {user.role}
              </span>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-tech-blue/10 border border-tech-blue/20">
              <User className="h-5 w-5 text-tech-blue" />
            </div>
            <button
              id="logout-btn"
              onClick={handleLogout}
              title="Cerrar sesión"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-red-200 bg-red-50 text-red-500 transition hover:bg-red-100"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="h-9 w-9 overflow-hidden rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center">
            <User className="h-5 w-5 text-slate-400" />
          </div>
        )}
      </div>
    </header>
  );
};
