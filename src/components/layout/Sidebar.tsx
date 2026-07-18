"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PlusCircle, Tag, Activity, Cloud, Database, ShieldCheck } from 'lucide-react';
import { getSidebarConfig } from '@/lib/navigation';

export const Sidebar = () => {
  const pathname = usePathname();
  const config = getSidebarConfig(pathname);

  const isTravelCabModule = pathname.startsWith('/travelcab');

  return (
    <aside className="w-64 border-r border-slate-200 bg-slate-50 flex flex-col hidden lg:flex min-h-[calc(100vh-4rem)] p-4 justify-between">
      <div className="flex-1 flex flex-col">
        {/* LOGO: Concorde 360 styled in Quicksand */}
        <div className="mb-6 flex items-center justify-center py-2 bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl border border-slate-700 shadow-md">
          <span className="text-lg font-black tracking-tight text-white font-quicksand">
            Concorde <span className="text-[#FF7A00]">360</span>
          </span>
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

      {/* MONITOR DE ESTABILIDAD DEL SISTEMA (Firebase & Google Cloud) */}
      <div className="mt-auto pt-6 border-t border-slate-200">
        <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase mb-3 flex items-center gap-1.5 px-3">
          <Activity className="h-3 w-3 text-emerald-500 animate-pulse" /> Estabilidad
        </p>
        <div className="bg-white rounded-xl border border-slate-200 p-3 space-y-2 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="h-3.5 w-3.5 text-tech-blue/60" />
              <span className="text-[10px] font-bold text-slate-500">Firebase DB</span>
            </div>
            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cloud className="h-3.5 w-3.5 text-tech-blue/60" />
              <span className="text-[10px] font-bold text-slate-500">Google Cloud</span>
            </div>
            <span className="text-[9px] font-extrabold text-emerald-600 bg-emerald-50 px-1 rounded border border-emerald-200">12ms</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-3.5 w-3.5 text-tech-blue/60" />
              <span className="text-[10px] font-bold text-slate-500">Travis AI</span>
            </div>
            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
          </div>
        </div>
      </div>
    </aside>
  );
};
