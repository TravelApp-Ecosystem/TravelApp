"use client";
import React, { useState, useMemo } from 'react';
import { AlarmClock, Plus, X, ArrowUpCircle, ArrowDownCircle, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import { ScheduledTransaction, ScheduleType, ScheduleStatus, BizUnit, Currency, BIZ_COLOR, CUR_SYM, fmt } from './types';

// ─── Urgency helpers ──────────────────────────────────────────────────────────
const today = () => { const d = new Date(); d.setHours(0,0,0,0); return d; };
const diffDays = (due: Date) => Math.ceil((new Date(due).setHours(0,0,0,0) - today().getTime()) / 86400000);

function urgency(tx: ScheduledTransaction): 'expired' | 'urgent' | 'soon' | 'ok' | 'paid' {
  if (tx.status === 'pagado') return 'paid';
  if (tx.status === 'vencido') return 'expired';
  const d = diffDays(tx.dueDate);
  if (d <= 0)  return 'expired';
  if (d <= 7)  return 'urgent';
  if (d <= 15) return 'soon';
  return 'ok';
}

const URGENCY_STYLES = {
  expired: { dot: 'bg-red-500',        row: 'bg-red-50/60 border-l-4 border-l-red-400',  text: 'text-red-600 font-bold',   badge: 'bg-red-100 text-red-700',    label: 'VENCIDO' },
  urgent:  { dot: 'bg-vial-orange',    row: 'bg-orange-50/60 border-l-4 border-l-vial-orange', text: 'text-orange-600 font-bold', badge: 'bg-orange-100 text-orange-700', label: '≤ 7 días' },
  soon:    { dot: 'bg-yellow-400',     row: '',                                           text: 'text-yellow-700',          badge: 'bg-yellow-100 text-yellow-700', label: '≤ 15 días' },
  ok:      { dot: 'bg-green-400',      row: '',                                           text: 'text-slate-500',           badge: 'bg-green-100 text-green-700',  label: 'A tiempo' },
  paid:    { dot: 'bg-slate-300',      row: 'opacity-60',                                 text: 'text-slate-400 line-through', badge: 'bg-slate-100 text-slate-500', label: 'PAGADO' },
};

const ic = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-tech-blue outline-none focus:border-tech-blue focus:ring-2 focus:ring-tech-blue/10";
const lc = "block text-xs font-semibold text-slate-500 mb-1";

// ─── New Schedule Modal ───────────────────────────────────────────────────────
function NewScheduleModal({ onClose, onSave }: { onClose: () => void; onSave: (s: ScheduledTransaction) => void }) {
  const [f, setF] = useState({ concept: '', dueDate: '', businessUnit: 'Global' as BizUnit, type: 'cobro' as ScheduleType, amount: '', currency: 'ARS' as Currency });
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ id: `sc-${Date.now()}`, ...f, dueDate: new Date(f.dueDate), amount: parseFloat(f.amount) || 0, status: 'pendiente' });
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-bold text-tech-blue">+ Nuevo Vencimiento</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-slate-100"><X className="h-5 w-5 text-slate-400" /></button>
        </div>
        <form onSubmit={submit} className="space-y-4 p-6">
          <div><label className={lc}>Concepto</label><input required className={ic} placeholder="Ej: Pago Proveedor XYZ" value={f.concept} onChange={e => setF(p => ({ ...p, concept: e.target.value }))} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className={lc}>Fecha de Vencimiento</label><input required type="date" className={ic} value={f.dueDate} onChange={e => setF(p => ({ ...p, dueDate: e.target.value }))} /></div>
            <div><label className={lc}>Tipo</label>
              <select className={ic} value={f.type} onChange={e => setF(p => ({ ...p, type: e.target.value as ScheduleType }))}>
                <option value="cobro">Cobro (Ingreso)</option><option value="pago">Pago (Egreso)</option>
              </select></div>
          </div>
          <div><label className={lc}>Unidad de Negocio</label>
            <select className={ic} value={f.businessUnit} onChange={e => setF(p => ({ ...p, businessUnit: e.target.value as BizUnit }))}>
              <option value="Global">Global</option><option value="TravelCab">TravelCab</option><option value="Experiences">Experiences</option><option value="Rewards">Rewards</option>
            </select></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className={lc}>Monto</label><input required type="number" min="0" step="0.01" className={ic} placeholder="0.00" value={f.amount} onChange={e => setF(p => ({ ...p, amount: e.target.value }))} /></div>
            <div><label className={lc}>Moneda</label>
              <select className={ic} value={f.currency} onChange={e => setF(p => ({ ...p, currency: e.target.value as Currency }))}>
                <option value="ARS">ARS</option><option value="USD">USD</option><option value="EUR">EUR</option>
              </select></div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-slate-200 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-50">Cancelar</button>
            <button type="submit" className="flex-1 rounded-lg bg-vial-orange py-2.5 text-sm font-bold text-white hover:bg-orange-600">Guardar</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Schedule Tab ─────────────────────────────────────────────────────────────
interface Props { items: ScheduledTransaction[]; onAdd: (s: ScheduledTransaction) => void; onSettle: (id: string) => void; }

export function ScheduleTab({ items, onAdd, onSettle }: Props) {
  const [showNew, setShowNew] = useState(false);
  const [filter, setFilter] = useState<'all' | 'cobro' | 'pago'>('all');

  const sorted = useMemo(() =>
    [...items].sort((a, b) => {
      const ord = { vencido: 0, pendiente: 1, pagado: 2 };
      if (a.status !== b.status) return ord[a.status] - ord[b.status];
      return a.dueDate.getTime() - b.dueDate.getTime();
    }), [items]);

  const visible = filter === 'all' ? sorted : sorted.filter(s => s.type === filter);
  const active  = items.filter(s => s.status !== 'pagado');

  // KPI aggregates (ARS only for simplicity, USD shown separately)
  const totalCobrar = active.filter(s => s.type === 'cobro' && s.currency === 'ARS').reduce((a, s) => a + s.amount, 0);
  const totalPagar  = active.filter(s => s.type === 'pago'  && s.currency === 'ARS').reduce((a, s) => a + s.amount, 0);
  const urgentes    = active.filter(s => ['expired', 'urgent'].includes(urgency(s)));

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Total a Cobrar (30d)</p>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-500/10"><ArrowUpCircle className="h-4 w-4 text-green-600" /></div>
          </div>
          <p className="text-2xl font-black text-tech-blue">{fmt(totalCobrar, 'ARS')}</p>
          <p className="mt-1 text-[11px] text-slate-400">{active.filter(s => s.type === 'cobro').length} cobros pendientes</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Total a Pagar</p>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-vial-orange/10"><ArrowDownCircle className="h-4 w-4 text-vial-orange" /></div>
          </div>
          <p className="text-2xl font-black text-tech-blue">{fmt(totalPagar, 'ARS')}</p>
          <p className="mt-1 text-[11px] text-slate-400">{active.filter(s => s.type === 'pago').length} pagos pendientes</p>
        </div>
        <div className={`rounded-2xl border p-5 shadow-sm ${urgentes.length > 0 ? 'border-red-200 bg-red-50' : 'border-slate-200 bg-white'}`}>
          <div className="flex items-center justify-between mb-3">
            <p className={`text-xs font-semibold uppercase tracking-wide ${urgentes.length > 0 ? 'text-red-500' : 'text-slate-400'}`}>Vencido / Urgente</p>
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${urgentes.length > 0 ? 'bg-red-100' : 'bg-slate-100'}`}>
              <AlertTriangle className={`h-4 w-4 ${urgentes.length > 0 ? 'text-red-500' : 'text-slate-400'}`} />
            </div>
          </div>
          <p className={`text-2xl font-black ${urgentes.length > 0 ? 'text-red-600' : 'text-tech-blue'}`}>{urgentes.length}</p>
          <p className={`mt-1 text-[11px] ${urgentes.length > 0 ? 'text-red-400' : 'text-slate-400'}`}>requieren atención inmediata</p>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 rounded-xl border border-slate-200 bg-white p-1 w-fit">
          {([['all','Todos'],['cobro','Cobros'],['pago','Pagos']] as const).map(([v,l]) => (
            <button key={v} onClick={() => setFilter(v)} className={`rounded-lg px-4 py-1.5 text-xs font-bold transition-colors ${filter===v?'bg-tech-blue text-white':'text-slate-500 hover:bg-slate-50'}`}>{l}</button>
          ))}
        </div>
        <button onClick={() => setShowNew(true)} className="flex items-center gap-2 rounded-xl bg-vial-orange px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-orange-200 hover:bg-orange-600 active:scale-95 transition-all">
          <Plus className="h-4 w-4" /> Nuevo Vencimiento
        </button>
      </div>

      {/* Urgency Legend */}
      <div className="flex flex-wrap gap-3 text-[11px] font-semibold">
        {[['bg-red-500','Vencido / Hoy'],['bg-vial-orange','≤ 7 días'],['bg-yellow-400','≤ 15 días'],['bg-green-400','A tiempo'],['bg-slate-300','Pagado']].map(([color,label]) => (
          <span key={label} className="flex items-center gap-1.5 text-slate-500"><span className={`h-2.5 w-2.5 rounded-full ${color}`}/>{label}</span>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>{['','Vencimiento','Concepto','Unidad','Tipo','Monto','Estado','Acción'].map(h => (
              <th key={h} className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-400">{h}</th>
            ))}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visible.length === 0 && (
              <tr><td colSpan={8} className="py-12 text-center text-slate-400">No hay vencimientos en esta categoría.</td></tr>
            )}
            {visible.map(tx => {
              const u = urgency(tx);
              const s = URGENCY_STYLES[u];
              const d = tx.status !== 'pagado' ? diffDays(tx.dueDate) : null;
              return (
                <tr key={tx.id} className={`transition-colors hover:brightness-95 ${s.row}`}>
                  <td className="px-4 py-3">
                    <span className={`inline-block h-2.5 w-2.5 rounded-full ${s.dot}`} />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <p className={`text-sm font-bold ${s.text}`}>{tx.dueDate.toLocaleDateString('es-AR')}</p>
                    {d !== null && <p className="text-[10px] text-slate-400">{d === 0 ? 'Hoy' : d < 0 ? `Hace ${Math.abs(d)}d` : `En ${d}d`}</p>}
                  </td>
                  <td className="px-4 py-3 max-w-[220px]">
                    <p className="font-medium text-tech-blue truncate" title={tx.concept}>{tx.concept}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{tx.id}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${BIZ_COLOR[tx.businessUnit]}`}>{tx.businessUnit}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`flex items-center gap-1.5 text-xs font-bold ${tx.type==='cobro'?'text-green-600':'text-red-500'}`}>
                      {tx.type==='cobro' ? <ArrowUpCircle className="h-3.5 w-3.5"/> : <ArrowDownCircle className="h-3.5 w-3.5"/>}
                      {tx.type==='cobro'?'Cobro':'Pago'}
                    </span>
                  </td>
                  <td className={`px-4 py-3 font-bold whitespace-nowrap ${tx.type==='cobro'?'text-green-600':'text-red-500'}`}>
                    {tx.type==='cobro'?'+':'-'} {CUR_SYM[tx.currency]} {tx.amount.toLocaleString('es-AR')}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${s.badge}`}>{s.label}</span>
                  </td>
                  <td className="px-4 py-3">
                    {tx.status !== 'pagado' ? (
                      <button onClick={() => onSettle(tx.id)}
                        className="rounded-lg border border-tech-blue/20 bg-tech-blue/5 px-3 py-1.5 text-[11px] font-bold text-tech-blue hover:bg-tech-blue/10 transition-colors whitespace-nowrap">
                        {tx.type==='cobro'?'Registrar Cobro':'Liquidar'}
                      </button>
                    ) : (
                      <span className="flex items-center gap-1 text-[11px] text-slate-400"><CheckCircle2 className="h-3.5 w-3.5 text-green-500"/> Liquidado</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showNew && <NewScheduleModal onClose={() => setShowNew(false)} onSave={s => { onAdd(s); setShowNew(false); }} />}
    </div>
  );
}
