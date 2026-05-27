"use client";
import React, { useState } from 'react';
import { Vault, Building2, Wallet, PiggyBank, Plus, X, RefreshCw, EyeOff, DollarSign, TrendingUp, ChevronDown, CheckCircle2, Copy, Check } from 'lucide-react';
import { BankAccount, AuditAdjustment, BizUnit, Currency, AccountType, BIZ_COLOR, CUR_SYM, fmt } from './types';

const ic = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-tech-blue outline-none focus:border-tech-blue focus:ring-2 focus:ring-tech-blue/10";
const lc = "block text-xs font-semibold text-slate-500 mb-1";

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="ml-2 rounded p-1 hover:bg-slate-100 text-slate-400 hover:text-tech-blue transition-colors">
      {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

function AccountCard({ acc, onAudit, onDisable }: { acc: BankAccount; onAudit: (a: BankAccount) => void; onDisable: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const [conf, setConf] = useState(false);
  const hasBank = acc.type !== 'caja_chica';
  const TypeIcon = acc.type === 'banco' ? Building2 : acc.type === 'billetera' ? Wallet : PiggyBank;
  return (
    <div className="flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-all">
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-tech-blue/8 text-tech-blue">
              <TypeIcon className="h-6 w-6" />
            </div>
            <div>
              <p className="font-bold text-tech-blue text-sm">{acc.name}</p>
              <p className="text-[11px] text-slate-400 mt-0.5 capitalize">{acc.type.replace('_', ' ')}</p>
            </div>
          </div>
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${BIZ_COLOR[acc.businessUnit]}`}>{acc.businessUnit}</span>
        </div>
        <p className="text-[11px] font-medium text-slate-400 mb-0.5">Saldo Actual</p>
        <p className="text-3xl font-black text-tech-blue">{fmt(acc.balance, acc.currency)}</p>
        <span className="inline-block mt-1 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">{acc.currency}</span>
      </div>
      <div className="border-t border-slate-100">
        <button onClick={() => setOpen(o => !o)} className="flex w-full items-center justify-between px-5 py-3 text-xs font-semibold text-slate-500 hover:bg-slate-50 transition-colors">
          Ver detalles bancarios <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
        {open && (
          <div className="px-5 pb-4 space-y-2.5 bg-slate-50/60 border-t border-slate-100">
            {acc.branch && <div><p className="text-[10px] font-bold text-slate-400 uppercase">Sucursal</p><p className="text-xs text-tech-blue font-medium">{acc.branch}</p></div>}
            {hasBank && acc.accountNumber && <div><p className="text-[10px] font-bold text-slate-400 uppercase">N° de Cuenta</p><p className="text-xs font-medium font-mono text-tech-blue">{acc.accountNumber}</p></div>}
            {hasBank && acc.cbuCvu && <div><p className="text-[10px] font-bold text-slate-400 uppercase">CBU / CVU</p><div className="flex items-center"><p className="text-xs font-medium font-mono tracking-wide text-tech-blue">{acc.cbuCvu}</p><CopyBtn text={acc.cbuCvu} /></div></div>}
            {hasBank && acc.alias && <div><p className="text-[10px] font-bold text-slate-400 uppercase">Alias</p><div className="flex items-center"><p className="text-xs font-medium text-tech-blue">{acc.alias}</p><CopyBtn text={acc.alias} /></div></div>}
            {!acc.accountNumber && !acc.cbuCvu && !acc.alias && <p className="text-xs text-slate-400 italic">Sin datos bancarios.</p>}
          </div>
        )}
      </div>
      <div className="flex gap-2 border-t border-slate-100 px-5 py-3">
        <button onClick={() => onAudit(acc)} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-tech-blue/20 bg-tech-blue/5 px-3 py-2 text-xs font-bold text-tech-blue hover:bg-tech-blue/10 transition-colors">
          <RefreshCw className="h-3.5 w-3.5" /> Arqueo
        </button>
        {!conf
          ? <button onClick={() => setConf(true)} className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-400 hover:bg-red-50 hover:border-red-200 hover:text-red-500 transition-colors"><EyeOff className="h-3.5 w-3.5" /> Deshabilitar</button>
          : <div className="flex gap-1"><button onClick={() => onDisable(acc.id)} className="rounded-lg bg-red-500 px-3 py-2 text-[11px] font-bold text-white hover:bg-red-600">Confirmar</button><button onClick={() => setConf(false)} className="rounded-lg border border-slate-200 px-2 py-2 text-[11px] text-slate-400 hover:bg-slate-50">No</button></div>
        }
      </div>
    </div>
  );
}

function NewAccountModal({ onClose, onSave }: { onClose: () => void; onSave: (a: BankAccount) => void }) {
  const [f, setF] = useState({ name: '', type: 'banco' as AccountType, currency: 'ARS' as Currency, businessUnit: 'Global' as BizUnit, balance: '', accountNumber: '', cbuCvu: '', alias: '', branch: '' });
  const isCaja = f.type === 'caja_chica';
  const submit = (e: React.FormEvent) => { e.preventDefault(); onSave({ id: `acc-${Date.now()}`, ...f, balance: parseFloat(f.balance) || 0, status: 'active' }); };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 sticky top-0 bg-white z-10">
          <h2 className="text-lg font-bold text-tech-blue">+ Nueva Cuenta</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-slate-100"><X className="h-5 w-5 text-slate-400" /></button>
        </div>
        <form onSubmit={submit} className="space-y-4 p-6">
          <div><label className={lc}>Nombre</label><input required className={ic} placeholder="Ej: Banco Nación CC" value={f.name} onChange={e => setF(p => ({ ...p, name: e.target.value }))} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className={lc}>Tipo</label>
              <select className={ic} value={f.type} onChange={e => setF(p => ({ ...p, type: e.target.value as AccountType }))}>
                <option value="banco">Banco</option><option value="billetera">Billetera Digital</option><option value="caja_chica">Caja Chica</option>
              </select></div>
            <div><label className={lc}>Moneda</label>
              <select className={ic} value={f.currency} onChange={e => setF(p => ({ ...p, currency: e.target.value as Currency }))}>
                <option value="ARS">ARS — Peso</option><option value="USD">USD — Dólar</option><option value="EUR">EUR — Euro</option><option value="BRL">BRL — Real</option>
              </select></div>
          </div>
          <div><label className={lc}>Unidad de Negocio</label>
            <select className={ic} value={f.businessUnit} onChange={e => setF(p => ({ ...p, businessUnit: e.target.value as BizUnit }))}>
              <option value="Global">Global</option><option value="TravelCab">TravelCab</option><option value="Experiences">Experiences</option><option value="Rewards">Rewards</option>
            </select></div>
          <div><label className={lc}>Saldo Inicial</label><input required type="number" min="0" className={ic} placeholder="0" value={f.balance} onChange={e => setF(p => ({ ...p, balance: e.target.value }))} /></div>
          <div><label className={lc}>Sucursal / Detalle</label><input className={ic} placeholder="Ej: Suc. Centro - 0123" value={f.branch} onChange={e => setF(p => ({ ...p, branch: e.target.value }))} /></div>
          {!isCaja && (
            <div className="rounded-xl border border-dashed border-slate-200 p-4 space-y-3">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Datos Bancarios</p>
              <div><label className={lc}>N° de Cuenta</label><input className={ic} placeholder="Ej: 4-123456/7-001" value={f.accountNumber} onChange={e => setF(p => ({ ...p, accountNumber: e.target.value }))} /></div>
              <div><label className={lc}>CBU / CVU (22 dígitos)</label><input className={ic} maxLength={22} placeholder="22 dígitos numéricos" value={f.cbuCvu} onChange={e => setF(p => ({ ...p, cbuCvu: e.target.value.replace(/\D/g, '') }))} />
                {f.cbuCvu && <p className={`mt-1 text-[10px] font-bold ${f.cbuCvu.length === 22 ? 'text-green-600' : 'text-slate-400'}`}>{f.cbuCvu.length}/22</p>}</div>
              <div><label className={lc}>Alias</label><input className={ic} placeholder="Ej: travelapp.exp.galicia" value={f.alias} onChange={e => setF(p => ({ ...p, alias: e.target.value.toLowerCase() }))} /></div>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-slate-200 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-50">Cancelar</button>
            <button type="submit" className="flex-1 rounded-lg bg-vial-orange py-2.5 text-sm font-bold text-white hover:bg-orange-600">Guardar Cuenta</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AuditModal({ acc, onClose, onSave }: { acc: BankAccount; onClose: () => void; onSave: (adj: AuditAdjustment, nb: number) => void }) {
  const [real, setReal] = useState('');
  const [reason, setReason] = useState('');
  const [done, setDone] = useState(false);
  const diff = parseFloat(real) - acc.balance;
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const nb = parseFloat(real);
    onSave({ id: `adj-${Date.now()}`, accountId: acc.id, previousBalance: acc.balance, newBalance: nb, reason, executedBy: 'Fernando Raul Incola (ADMIN)', timestamp: new Date() }, nb);
    setDone(true); setTimeout(onClose, 1200);
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div><h2 className="text-lg font-bold text-tech-blue">Arqueo / Ajuste Manual</h2><p className="text-xs text-slate-400">{acc.name} · {acc.businessUnit}</p></div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-slate-100"><X className="h-5 w-5 text-slate-400" /></button>
        </div>
        {done ? (
          <div className="flex flex-col items-center gap-3 py-12"><CheckCircle2 className="h-14 w-14 text-green-500" /><p className="font-bold text-tech-blue">Arqueo registrado</p></div>
        ) : (
          <form onSubmit={submit} className="space-y-4 p-6">
            <div className="rounded-xl bg-slate-50 border border-slate-100 p-4"><p className="text-xs text-slate-400 mb-1">Saldo en sistema</p><p className="text-2xl font-black text-tech-blue">{fmt(acc.balance, acc.currency)}</p></div>
            <div><label className={lc}>Saldo Real ({acc.currency})</label><input required type="number" step="0.01" className={ic} placeholder="Ingresá el saldo real" value={real} onChange={e => setReal(e.target.value)} />
              {real && !isNaN(diff) && diff !== 0 && <p className={`mt-1.5 text-xs font-bold ${diff > 0 ? 'text-green-600' : 'text-red-500'}`}>Diferencia: {diff > 0 ? '+' : ''}{fmt(diff, acc.currency)}</p>}
            </div>
            <div><label className={lc}>Motivo del Ajuste</label><textarea required rows={3} className={ic} placeholder="Ej: Conciliación fin de mes..." value={reason} onChange={e => setReason(e.target.value)} /></div>
            <p className="text-[10px] text-slate-400">Ejecutado por: <span className="font-bold text-tech-blue">Fernando Raul Incola (ADMIN)</span></p>
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-slate-200 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-50">Cancelar</button>
              <button type="submit" className="flex-1 rounded-lg bg-vial-orange py-2.5 text-sm font-bold text-white hover:bg-orange-600">Confirmar Arqueo</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

interface FlowTabProps {
  accounts: BankAccount[];
  adjustments: AuditAdjustment[];
  setAccounts: React.Dispatch<React.SetStateAction<BankAccount[]>>;
  setAdjustments: React.Dispatch<React.SetStateAction<AuditAdjustment[]>>;
}

export function FlowTab({ accounts, adjustments, setAccounts, setAdjustments }: FlowTabProps) {
  const [showNew, setShowNew] = useState(false);
  const [auditTarget, setAuditTarget] = useState<BankAccount | null>(null);
  const [filter, setFilter] = useState<BizUnit | 'all'>('all');

  const active = accounts.filter(a => a.status === 'active');
  const totalARS = active.filter(a => a.currency === 'ARS').reduce((s, a) => s + a.balance, 0);
  const totalUSD = active.filter(a => a.currency === 'USD').reduce((s, a) => s + a.balance, 0);
  const displayed = active.filter(a => filter === 'all' || a.businessUnit === filter);

  const saveAdj = (adj: AuditAdjustment, nb: number) => {
    setAdjustments(p => [adj, ...p]);
    setAccounts(p => p.map(a => a.id === adj.accountId ? { ...a, balance: nb } : a));
    setAuditTarget(null);
  };

  return (
    <div className="space-y-6">
      {/* Top action */}
      <div className="flex justify-end">
        <button onClick={() => setShowNew(true)} className="flex items-center gap-2 rounded-xl bg-vial-orange px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-orange-200 hover:bg-orange-600 active:scale-95 transition-all">
          <Plus className="h-4 w-4" /> Nueva Cuenta
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Total ARS', val: fmt(totalARS, 'ARS'), sub: `${active.filter(a => a.currency === 'ARS').length} cuentas`, icon: <DollarSign className="h-4 w-4 text-tech-blue" />, bg: 'bg-tech-blue/10' },
          { label: 'Total USD', val: fmt(totalUSD, 'USD'), sub: `${active.filter(a => a.currency === 'USD').length} cuentas`, icon: <TrendingUp className="h-4 w-4 text-green-600" />, bg: 'bg-green-500/10' },
          { label: 'Cuentas Activas', val: String(active.length), sub: `${accounts.filter(a => a.status === 'disabled').length} deshabilitadas`, icon: <Building2 className="h-4 w-4 text-vial-orange" />, bg: 'bg-vial-orange/10' },
          { label: 'Arqueos (Sesión)', val: String(adjustments.length), sub: 'registros generados', icon: <RefreshCw className="h-4 w-4 text-purple-500" />, bg: 'bg-purple-500/10' },
        ].map(k => (
          <div key={k.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{k.label}</p>
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${k.bg}`}>{k.icon}</div>
            </div>
            <p className="text-2xl font-black text-tech-blue">{k.val}</p>
            <p className="mt-1 text-[11px] text-slate-400">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        {(['all', 'TravelCab', 'Experiences', 'Rewards', 'Global'] as const).map(u => (
          <button key={u} onClick={() => setFilter(u)} className={`rounded-full px-4 py-1.5 text-xs font-bold transition-colors ${filter === u ? 'bg-tech-blue text-white' : 'bg-white border border-slate-200 text-slate-500 hover:border-slate-300'}`}>
            {u === 'all' ? 'Todas' : u}
          </button>
        ))}
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {displayed.map(a => (
          <AccountCard key={a.id} acc={a} onAudit={setAuditTarget}
            onDisable={id => setAccounts(p => p.map(x => x.id === id ? { ...x, status: 'disabled' } : x))} />
        ))}
        {displayed.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
            <p className="text-slate-400">No hay cuentas activas para esta unidad.</p>
          </div>
        )}
      </div>

      {/* Adjustments log */}
      {adjustments.length > 0 && (
        <div>
          <h2 className="mb-4 text-base font-bold text-tech-blue">Registro de Arqueos — Sesión Actual</h2>
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>{['Cuenta', 'Anterior', 'Nuevo', 'Diferencia', 'Motivo', 'Ejecutado por', 'Hora'].map(h => <th key={h} className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-400">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {adjustments.map(adj => {
                  const a = accounts.find(x => x.id === adj.accountId);
                  const d = adj.newBalance - adj.previousBalance;
                  return (
                    <tr key={adj.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-semibold text-tech-blue">{a?.name ?? adj.accountId}</td>
                      <td className="px-4 py-3 text-slate-500">{fmt(adj.previousBalance, a?.currency ?? 'ARS')}</td>
                      <td className="px-4 py-3 font-bold text-tech-blue">{fmt(adj.newBalance, a?.currency ?? 'ARS')}</td>
                      <td className={`px-4 py-3 font-bold ${d >= 0 ? 'text-green-600' : 'text-red-500'}`}>{d >= 0 ? '+' : ''}{fmt(d, a?.currency ?? 'ARS')}</td>
                      <td className="px-4 py-3 text-slate-500 max-w-[180px] truncate">{adj.reason}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">{adj.executedBy}</td>
                      <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{adj.timestamp.toLocaleTimeString('es-AR')}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showNew && <NewAccountModal onClose={() => setShowNew(false)} onSave={a => { setAccounts(p => [...p, a]); setShowNew(false); }} />}
      {auditTarget && <AuditModal acc={auditTarget} onClose={() => setAuditTarget(null)} onSave={saveAdj} />}
    </div>
  );
}
