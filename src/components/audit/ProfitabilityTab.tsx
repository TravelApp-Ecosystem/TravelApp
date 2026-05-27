"use client";
import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, TrendingDown, Percent, Plus, Pencil, CheckCircle2, X, Archive } from 'lucide-react';
import { FixedCost, Budget, INITIAL_FIXED_COSTS, INITIAL_BUDGETS } from './types';
import { ExportButton } from './ExportButton';

const fmtARS = (n: number) => `$ ${n.toLocaleString('es-AR')}`;
const ic = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-tech-blue outline-none focus:border-tech-blue focus:ring-2 focus:ring-tech-blue/10";
const lc = "block text-xs font-semibold text-slate-500 mb-1";

const chartData = [
  { unit: 'TravelCab',   ingresos: 3_850_000, costos: 2_100_000 },
  { unit: 'Experiences', ingresos: 2_140_000, costos: 980_000 },
  { unit: 'Rewards',     ingresos: 420_000,   costos: 310_000 },
  { unit: 'Global',      ingresos: 0,          costos: 285_000 },
];
const totalIncome = chartData.reduce((s, d) => s + d.ingresos, 0);
const totalCost   = chartData.reduce((s, d) => s + d.costos, 0);

// ─── Fixed Cost Modal ─────────────────────────────────────────────────────────
function CostModal({ initial, onClose, onSave }: {
  initial?: FixedCost;
  onClose: () => void;
  onSave: (c: FixedCost) => void;
}) {
  const [concept, setConcept]     = useState(initial?.concept ?? '');
  const [amount, setAmount]       = useState(String(initial?.amount ?? ''));
  const [category, setCategory]   = useState(initial?.category ?? 'IT / Software');
  const [isTemp, setIsTemp]       = useState(initial?.isTemporary ?? false);
  const [installments, setInstall] = useState(String(initial?.remainingInstallments ?? ''));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: initial?.id ?? `fc-${Date.now()}`,
      concept, category,
      amount: parseFloat(amount) || 0,
      isTemporary: isTemp,
      remainingInstallments: isTemp ? parseInt(installments) || undefined : undefined,
      status: 'active',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-bold text-tech-blue">{initial ? 'Editar Costo Fijo' : '+ Nuevo Costo Fijo'}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-slate-100"><X className="h-5 w-5 text-slate-400" /></button>
        </div>
        <form onSubmit={submit} className="space-y-4 p-6">
          <div><label className={lc}>Concepto</label><input required className={ic} placeholder="Ej: Alquiler Oficina" value={concept} onChange={e => setConcept(e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className={lc}>Monto (ARS)</label><input required type="number" min="0" className={ic} value={amount} onChange={e => setAmount(e.target.value)} /></div>
            <div><label className={lc}>Categoría</label>
              <select className={ic} value={category} onChange={e => setCategory(e.target.value)}>
                {['IT / Software','Inmueble','Seguros','Profesionales','Equipamiento','Servicios','Otros'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 p-4">
            <button type="button" onClick={() => setIsTemp(t => !t)}
              className={`relative h-6 w-11 rounded-full transition-colors ${isTemp ? 'bg-vial-orange' : 'bg-slate-200'}`}>
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${isTemp ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
            <div>
              <p className="text-sm font-semibold text-tech-blue">¿Es temporal / en cuotas?</p>
              <p className="text-[11px] text-slate-400">Activar si tiene fecha de finalización</p>
            </div>
          </div>
          {isTemp && (
            <div><label className={lc}>Cuotas Restantes</label><input type="number" min="1" className={ic} placeholder="Ej: 6" value={installments} onChange={e => setInstall(e.target.value)} /></div>
          )}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-slate-200 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-50">Cancelar</button>
            <button type="submit" className="flex-1 rounded-lg bg-vial-orange py-2.5 text-sm font-bold text-white hover:bg-orange-600">Guardar</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Budget Modal ─────────────────────────────────────────────────────────────
function BudgetModal({ initial, onClose, onSave }: {
  initial?: Budget;
  onClose: () => void;
  onSave: (b: Budget) => void;
}) {
  const [name, setName]       = useState(initial?.name ?? '');
  const [assigned, setAssigned] = useState(String(initial?.assignedAmount ?? ''));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: initial?.id ?? `bg-${Date.now()}`,
      name,
      assignedAmount: parseFloat(assigned) || 0,
      consumedAmount: initial?.consumedAmount ?? 0,
      status: 'active',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-bold text-tech-blue">{initial ? 'Editar Presupuesto' : '+ Asignar Presupuesto'}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-slate-100"><X className="h-5 w-5 text-slate-400" /></button>
        </div>
        <form onSubmit={submit} className="space-y-4 p-6">
          <div><label className={lc}>Nombre del Presupuesto</label><input required className={ic} placeholder="Ej: Campaña Meta Vaca Muerta" value={name} onChange={e => setName(e.target.value)} /></div>
          <div><label className={lc}>Monto Asignado (ARS)</label><input required type="number" min="0" className={ic} placeholder="0" value={assigned} onChange={e => setAssigned(e.target.value)} /></div>
          {initial && (
            <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500">
              <span className="font-semibold text-tech-blue">Consumido actual:</span> {fmtARS(initial.consumedAmount)}{' '}
              — El monto consumido no se modifica aquí; se actualiza automáticamente desde el Libro Mayor.
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-slate-200 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-50">Cancelar</button>
            <button type="submit" className="flex-1 rounded-lg bg-vial-orange py-2.5 text-sm font-bold text-white hover:bg-orange-600">Guardar</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function ProfitabilityTab() {
  const [costs, setCosts]       = useState<FixedCost[]>(INITIAL_FIXED_COSTS);
  const [budgets, setBudgets]   = useState<Budget[]>(INITIAL_BUDGETS);
  const [costModal, setCostModal]   = useState<FixedCost | true | null>(null);
  const [budgetModal, setBudgetModal] = useState<Budget | true | null>(null);

  const activeCosts   = costs.filter(c => c.status === 'active');
  const activeBudgets = budgets.filter(b => b.status === 'active');

  const fixedTotal  = activeCosts.filter(c => !c.id.includes('fc-2')).reduce((s, c) => s + c.amount, 0);
  const budgetExec  = activeBudgets.reduce((s, b) => s + b.consumedAmount, 0);
  const roi         = totalCost > 0 ? ((totalIncome - totalCost) / totalCost * 100).toFixed(1) : '0';

  const saveCost = (c: FixedCost) => {
    setCosts(p => p.some(x => x.id === c.id) ? p.map(x => x.id === c.id ? c : x) : [...p, c]);
    setCostModal(null);
  };
  const archiveCost = (id: string) => setCosts(p => p.map(x => x.id === id ? { ...x, status: 'completed' } : x));

  const saveBudget = (b: Budget) => {
    setBudgets(p => p.some(x => x.id === b.id) ? p.map(x => x.id === b.id ? b : x) : [...p, b]);
    setBudgetModal(null);
  };
  const archiveBudget = (id: string) => setBudgets(p => p.map(x => x.id === id ? { ...x, status: 'archived' } : x));

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Costo Fijo Mensual</p>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/10"><TrendingDown className="h-4 w-4 text-red-500" /></div>
          </div>
          <p className="text-2xl font-black text-tech-blue">{fmtARS(fixedTotal)}</p>
          <p className="mt-1 text-[11px] text-slate-400">{activeCosts.length} ítems activos</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Presupuesto Ejecutado</p>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-vial-orange/10"><TrendingUp className="h-4 w-4 text-vial-orange" /></div>
          </div>
          <p className="text-2xl font-black text-tech-blue">{fmtARS(budgetExec)}</p>
          <p className="mt-1 text-[11px] text-slate-400">sobre {fmtARS(activeBudgets.reduce((s,b)=>s+b.assignedAmount,0))} asignado</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">Margen / ROI</p>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100"><Percent className="h-4 w-4 text-emerald-600" /></div>
          </div>
          <p className="text-2xl font-black text-emerald-700">{roi}%</p>
          <p className="mt-1 text-[11px] text-emerald-500">Resultado: {fmtARS(totalIncome - totalCost)}</p>
        </div>
      </div>

      {/* Chart */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-tech-blue">Costos vs. Ingresos por Unidad de Negocio</h3>
            <p className="text-xs text-slate-400 mt-0.5">Mayo 2026 — período actual</p>
          </div>
          <ExportButton label="Exportar Gráfico" />
        </div>
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="unit" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => `$${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor:'#fff', border:'1px solid #e2e8f0', borderRadius:'0.75rem', fontSize:12 }} formatter={(v: any) => [fmtARS(Number(v || 0))]} />
              <Legend wrapperStyle={{ fontSize:12, color:'#64748b' }} />
              <Bar dataKey="ingresos" name="Ingresos" fill="#0a2a5b" radius={[6,6,0,0]} />
              <Bar dataKey="costos"   name="Costos"   fill="#ff6b00" radius={[6,6,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Split tables */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

        {/* ── Fixed Costs ── */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h3 className="text-sm font-bold text-tech-blue">Costos Fijos Mensuales</h3>
            <div className="flex gap-2">
              <ExportButton />
              <button onClick={() => setCostModal(true)}
                className="flex items-center gap-1.5 rounded-lg bg-vial-orange px-3 py-1.5 text-xs font-bold text-white hover:bg-orange-600 transition-colors">
                <Plus className="h-3.5 w-3.5" /> Nuevo Costo
              </button>
            </div>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {['Concepto','Categoría','Monto','Acciones'].map(h => <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-slate-400">{h}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activeCosts.map(c => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-tech-blue text-xs">{c.concept}</p>
                    {c.isTemporary && c.remainingInstallments && (
                      <span className="inline-block mt-0.5 rounded-full bg-vial-orange/10 px-2 py-0.5 text-[9px] font-bold text-vial-orange">
                        {c.remainingInstallments} cuota{c.remainingInstallments > 1 ? 's' : ''} restante{c.remainingInstallments > 1 ? 's' : ''}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">{c.category}</td>
                  <td className="px-4 py-3 font-bold text-red-500 text-xs whitespace-nowrap">{fmtARS(c.amount)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => setCostModal(c)} title="Editar"
                        className="rounded-lg border border-slate-200 p-1.5 text-slate-400 hover:bg-slate-100 hover:text-tech-blue transition-colors">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => archiveCost(c.id)} title="Finalizar"
                        className="rounded-lg border border-slate-200 p-1.5 text-slate-400 hover:bg-green-50 hover:border-green-200 hover:text-green-600 transition-colors">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {activeCosts.length === 0 && (
                <tr><td colSpan={4} className="py-8 text-center text-xs text-slate-400">No hay costos fijos activos.</td></tr>
              )}
            </tbody>
            <tfoot className="border-t border-slate-200 bg-slate-50">
              <tr>
                <td className="px-4 py-3 text-xs font-bold text-tech-blue" colSpan={2}>Total ARS</td>
                <td className="px-4 py-3 text-xs font-black text-red-600" colSpan={2}>{fmtARS(fixedTotal)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* ── Budgets ── */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h3 className="text-sm font-bold text-tech-blue">Presupuesto por Área</h3>
            <div className="flex gap-2">
              <ExportButton />
              <button onClick={() => setBudgetModal(true)}
                className="flex items-center gap-1.5 rounded-lg bg-vial-orange px-3 py-1.5 text-xs font-bold text-white hover:bg-orange-600 transition-colors">
                <Plus className="h-3.5 w-3.5" /> Asignar
              </button>
            </div>
          </div>
          <div className="divide-y divide-slate-100">
            {activeBudgets.map(b => {
              const pct = Math.min(100, Math.round(b.consumedAmount / b.assignedAmount * 100));
              const barColor = pct >= 90 ? 'bg-red-500' : pct >= 80 ? 'bg-vial-orange' : 'bg-tech-blue';
              const pctColor = pct >= 90 ? 'text-red-500' : pct >= 80 ? 'text-orange-500' : 'text-slate-400';
              return (
                <div key={b.id} className="px-5 py-4">
                  <div className="flex items-start justify-between mb-1.5">
                    <p className="text-xs font-bold text-tech-blue leading-tight flex-1 mr-2">{b.name}</p>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className={`text-[10px] font-black ${pctColor}`}>{pct}%</span>
                      <button onClick={() => setBudgetModal(b)} title="Editar"
                        className="rounded p-1 text-slate-300 hover:text-tech-blue hover:bg-slate-100 transition-colors">
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button onClick={() => archiveBudget(b.id)} title="Archivar"
                        className="rounded p-1 text-slate-300 hover:text-orange-500 hover:bg-orange-50 transition-colors">
                        <Archive className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
                  </div>
                  <div className="mt-1.5 flex justify-between text-[10px] text-slate-400">
                    <span>Consumido: <span className="font-semibold text-tech-blue">{fmtARS(b.consumedAmount)}</span></span>
                    <span>Asignado: {fmtARS(b.assignedAmount)}</span>
                  </div>
                  {/* Budget-to-Ledger link hook (production: pass budgetId when saving egreso in LedgerTab) */}
                  {/* onLedgerEgreso: setBudgets(p => p.map(x => x.id === budgetId ? {...x, consumedAmount: x.consumedAmount + amount} : x)) */}
                </div>
              );
            })}
            {activeBudgets.length === 0 && (
              <div className="py-10 text-center text-xs text-slate-400">No hay presupuestos activos.</div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {costModal && (
        <CostModal
          initial={costModal === true ? undefined : costModal}
          onClose={() => setCostModal(null)}
          onSave={saveCost}
        />
      )}
      {budgetModal && (
        <BudgetModal
          initial={budgetModal === true ? undefined : budgetModal}
          onClose={() => setBudgetModal(null)}
          onSave={saveBudget}
        />
      )}
    </div>
  );
}
