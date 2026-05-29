"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { TopNavbar } from "./TopNavbar";
import { Sidebar } from "./Sidebar";
import { AuthProvider } from "@/contexts/AuthContext";

/**
 * Routes that should render WITHOUT the chrome (navbar + sidebar).
 * Add any future public/standalone pages here.
 */
const SHELL_FREE_ROUTES = ["/login"];

function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isLanding, setIsLanding] = React.useState(false);

  React.useEffect(() => {
    const checkShellFree = () => {
      if (typeof window !== "undefined") {
        const host = window.location.hostname;
        const isLandingHost = (host.includes("travelcab.ar") || host.includes("travelapp.ar")) && !host.startsWith("admin.");
        const hasClass = document.body.classList.contains("shell-free");
        const hasElement = !!document.querySelector("[data-shell-free]");
        setIsLanding(isLandingHost || hasClass || hasElement);
      }
    };

    checkShellFree();

    // Crear un observer para escuchar cambios en el DOM y clases
    const observer = new MutationObserver(checkShellFree);
    observer.observe(document.body, { attributes: true, childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  const hideShell =
    isLanding ||
    pathname === "/login" ||
    pathname.startsWith("/login/") ||
    pathname === "/landing/travelcab" ||
    pathname.startsWith("/landing/travelcab/") ||
    pathname.startsWith("/landing/");

  if (hideShell) {
    // Login (and other standalone pages) render without any chrome
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-tech-blue">
      <TopNavbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

export const MainLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <AuthProvider>
      <AppShell>{children}</AppShell>
    </AuthProvider>
  );
};
