"use client";
import React, { useState, useMemo } from 'react';
import { Search, ExternalLink } from 'lucide-react';
import { DirectoryContact, DirectoryCategory, INITIAL_DIRECTORY } from './types';
import { ExportButton } from './ExportButton';

const CAT_LABEL: Record<DirectoryCategory, string> = {
  proveedor: 'Proveedor',
  prestador: 'Prestador',
  operador:  'Operador Mayorista',
};
const CAT_COLOR: Record<DirectoryCategory, string> = {
  proveedor: 'bg-sky-100 text-sky-700',
  prestador: 'bg-lime-100 text-lime-700',
  operador:  'bg-purple-100 text-purple-700',
};

export function DirectoryTab() {
  const [contacts] = useState<DirectoryContact[]>(INITIAL_DIRECTORY);
  const [filter, setFilter] = useState<DirectoryCategory | 'all'>('all');
  const [search, setSearch] = useState('');

  const visible = useMemo(() =>
    contacts.filter(c => {
      const matchCat = filter === 'all' || c.category === filter;
      const q = search.toLowerCase();
      const matchSearch = !q || c.name.toLowerCase().includes(q) || c.cuit.includes(q) || c.rubro.toLowerCase().includes(q);
      return matchCat && matchSearch;
    }), [contacts, filter, search]);

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {([['all','Todos'],['proveedor','Proveedores'],['prestador','Prestadores'],['operador','Operadores']] as const).map(([v, l]) => (
            <button key={v} onClick={() => setFilter(v)}
              className={`rounded-full px-4 py-1.5 text-xs font-bold transition-colors ${filter===v ? 'bg-tech-blue text-white' : 'bg-white border border-slate-200 text-slate-500 hover:border-slate-300'}`}>
              {l}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              className="w-56 rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-sm text-tech-blue outline-none focus:border-tech-blue focus:ring-2 focus:ring-tech-blue/10"
              placeholder="Buscar contacto..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <ExportButton label="Exportar Directorio" />
        </div>
      </div>

      {/* Stat pills */}
      <div className="flex flex-wrap gap-3">
        {(['proveedor','prestador','operador'] as DirectoryCategory[]).map(cat => (
          <div key={cat} className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold ${CAT_COLOR[cat]}`}>
            <span>{CAT_LABEL[cat]}s</span>
            <span className="rounded-full bg-white/60 px-1.5 py-0.5 text-[10px] font-black">
              {contacts.filter(c => c.category === cat).length}
            </span>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              {['Razón Social / Nombre','CUIT','Categoría','Rubro','Contacto','Acciones'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visible.length === 0 && (
              <tr><td colSpan={6} className="py-12 text-center text-slate-400">No hay contactos para este filtro.</td></tr>
            )}
            {visible.map(c => (
              <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3">
                  <p className="font-bold text-tech-blue text-sm">{c.name}</p>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-slate-500">{c.cuit}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${CAT_COLOR[c.category]}`}>
                    {CAT_LABEL[c.category]}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-slate-500">{c.rubro}</td>
                <td className="px-4 py-3 text-xs">
                  <p className="text-tech-blue">{c.email}</p>
                  <p className="text-slate-400 mt-0.5">{c.phone}</p>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => alert(`Ficha de: ${c.name}\nCUIT: ${c.cuit}\nRubro: ${c.rubro}`)}
                      className="rounded-lg border border-tech-blue/20 bg-tech-blue/5 px-3 py-1.5 text-[11px] font-bold text-tech-blue hover:bg-tech-blue/10 transition-colors whitespace-nowrap"
                    >
                      Ver Ficha
                    </button>
                    <button
                      onClick={() => alert(`Exportando ficha de ${c.name}...`)}
                      className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-semibold text-slate-500 hover:bg-slate-50 transition-colors"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="border-t border-slate-100 px-4 py-3">
          <p className="text-xs text-slate-400">
            Mostrando <span className="font-bold text-tech-blue">{visible.length}</span> de <span className="font-bold text-tech-blue">{contacts.length}</span> contactos
          </p>
        </div>
      </div>
    </div>
  );
}
