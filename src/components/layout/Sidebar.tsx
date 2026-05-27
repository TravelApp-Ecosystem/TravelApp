"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PlusCircle, Tag } from 'lucide-react';
import { getSidebarConfig } from '@/lib/navigation';

export const Sidebar = () => {
  const pathname = usePathname();
  const config = getSidebarConfig(pathname);

  const isTravelCabModule = pathname.startsWith('/travelcab');
  const logoSrc = isTravelCabModule ? "/assets/travelcab_original.svg" : "/assets/isologo.png";

  return (
    <aside className="w-64 border-r border-slate-200 bg-slate-50 flex-col hidden lg:flex min-h-[calc(100vh-4rem)]">
      <div className="p-4">
        <div className="mb-6 flex justify-center">
          <img src={logoSrc} alt={isTravelCabModule ? "TravelCab" : "TravelApp"} className={isTravelCabModule ? "h-10 w-auto" : "h-12 w-auto"} />
        </div>
        <nav className="space-y-1">
          {config.items.map((item) => {
            const Icon = item.icon;
            // Strict matching for active state in sidebar
            const active = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/' && item.href !== '/crm');
            
            // Override active state for specific exact matches
            const isReallyActive = pathname === item.href;

            return (
              <Link
                key={item.id}
                href={item.href}
                className={`flex items-center space-x-3 rounded-lg px-3 py-2 transition-colors ${
                  isReallyActive
                    ? 'bg-tech-blue/10 text-tech-blue'
                    : 'text-slate-500 hover:bg-white hover:text-tech-blue'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {isTravelCabModule && (
          <div className="mt-8 pt-6 border-t border-slate-200 space-y-3">
            <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase px-3">
              Operaciones Rápidas
            </p>
            <Link
              href="/travelcab/settings?tab=tariffs&action=new"
              className="flex items-center space-x-2.5 rounded-xl border border-dashed border-vial-orange/40 bg-vial-orange/5 hover:bg-vial-orange/10 hover:border-vial-orange px-3.5 py-2.5 transition-all text-vial-orange group shadow-sm"
            >
              <PlusCircle className="h-4 w-4" />
              <span className="text-xs font-black tracking-tight">Crear Servicio</span>
            </Link>
            <Link
              href="/travelcab/settings?tab=categories&action=new"
              className="flex items-center space-x-2.5 rounded-xl border border-slate-200 bg-white hover:border-tech-blue/40 px-3.5 py-2.5 transition-all text-slate-600 hover:text-tech-blue group shadow-sm"
            >
              <Tag className="h-4 w-4 text-slate-400 group-hover:text-tech-blue transition-colors" />
              <span className="text-xs font-bold tracking-tight">Crear Categoría</span>
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
};
