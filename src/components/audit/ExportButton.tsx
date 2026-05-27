"use client";
import React from 'react';
import { Download } from 'lucide-react';

interface Props {
  label?: string;
  onExport?: () => void;
}

export function ExportButton({ label = 'Exportar CSV/PDF', onExport }: Props) {
  const handleClick = () => {
    // Log to AuditLog (wire to Firestore in production)
    console.info('[AuditLog]', {
      userId: 'Fernando Incola',
      action: 'EXPORT',
      module: 'audit',
      timestamp: new Date(),
      details: label,
    });
    if (onExport) onExport();
    else alert('Exportación preparada — integrar con generador CSV/PDF en producción.');
  };

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-500 shadow-sm hover:border-slate-300 hover:bg-slate-50 hover:text-tech-blue transition-colors"
    >
      <Download className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
