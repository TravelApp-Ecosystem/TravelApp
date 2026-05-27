"use client";
import React, { useState, useMemo } from 'react';
import { Search, Plus, ArrowUpCircle, ArrowDownCircle, X, CheckCircle2 } from 'lucide-react';
import {
  LedgerTransaction, BankAccount, BizUnit, Currency, TxType, TxStatus, PaymentMethod,
  BIZ_COLOR, CUR_SYM, fmt,
} from './types';
import { ExportButton } from './ExportButton';

const PAGE_SIZE = 6;

const STATUS_STYLE: Record<TxStatus, string> = {
  completado:             'bg-green-100 text-green-700',
  pendiente_conciliacion: 'bg-yellow-100 text-yellow-700',
};
const STATUS_LABEL: Record<TxStatus, string> = {
  completado:             'Completado',
  pendiente_conciliacion: 'Pend. Conciliación',
};

// ─── New Transaction Modal ────────────────────────────────────────────────────
function TxModal({
  mode, accounts, onClose, onSave,
}: {
  mode: 'ingreso' | 'egreso';
  accounts: BankAccount[];
  onClose: () => void;
  onSave: (tx: LedgerTransaction) => void;
}) {
  const [concept, setConcept] = useState('');
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? '');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<Currency>('ARS');
  const [status, setStatus] = useState<TxStatus>('completado');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('transferencia');
  const [attachmentName, setAttachmentName] = useState<string | null>(null);

  const selAcc = accounts.find(a => a.id === accountId);

  const ic = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-tech-blue outline-none focus:border-tech-blue focus:ring-2 focus:ring-tech-blue/10";
  const lc = "block text-xs font-semibold text-slate-500 mb-1";

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: `tx-${Date.now()}`,
      date: new Date(),
      concept,
      businessUnit: selAcc?.businessUnit ?? 'Global',
      accountId,
      type: mode,
      amount: parseFloat(amount) || 0,
      currency,
      status,
      paymentMethod,
      attachmentUrl: attachmentName,
    });
  };

  const isIngreso = mode === 'ingreso';
  const accent = isIngreso ? 'text-green-600' : 'text-vial-orange';
  const btnBg  = isIngreso ? 'bg-tech-blue hover:bg-blue-900' : 'bg-vial-orange hover:bg-orange-600';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className={`text-lg font-bold ${accent}`}>
            {isIngreso ? '+ Nuevo Ingreso' : '+ Nueva Orden de Pago'}
          </h2>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-slate-100">
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>
        <form onSubmit={submit} className="space-y-4 p-6">
          <div>
            <label className={lc}>Concepto</label>
            <input required className={ic} placeholder="Ej: Cobro Reserva RVA-N°45"
              value={concept} onChange={e => setConcept(e.target.value)} />
          </div>
          <div>
            <label className={lc}>Cuenta Afectada</label>
            <select required className={ic} value={accountId} onChange={e => setAccountId(e.target.value)}>
              {accounts.map(a => (
                <option key={a.id} value={a.id}>{a.name} — {a.businessUnit}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lc}>Monto</label>
              <input required type="number" min="0" step="0.01" className={ic}
                placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} />
            </div>
            <div>
              <label className={lc}>Moneda</label>
              <select className={ic} value={currency} onChange={e => setCurrency(e.target.value as Currency)}>
                <option value="ARS">ARS</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="BRL">BRL</option>
              </select>
            </div>
          </div>
          <div>
            <label className={lc}>Estado</label>
            <select className={ic} value={status} onChange={e => setStatus(e.target.value as TxStatus)}>
              <option value="completado">Completado</option>
              <option value="pendiente_conciliacion">Pendiente de Conciliación</option>
            </select>
          </div>
          <div>
            <label className={lc}>Método de Pago</label>
            <select className={ic} value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}>
              <option value="transferencia">Transferencia Bancaria</option>
              <option value="efectivo">Efectivo</option>
              <option value="tarjeta">Tarjeta de Crédito/Débito</option>
              <option value="cheque">Cheque</option>
            </select>
          </div>
          <div>
            <label className={lc}>Adjuntar Comprobante</label>
            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-3 hover:border-tech-blue hover:bg-tech-blue/5 transition-colors">
              <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
                onChange={e => setAttachmentName(e.target.files?.[0]?.name ?? null)} />
              <span className="text-xs text-slate-400">
                {attachmentName
                  ? <span className="font-semibold text-tech-blue">✅ {attachmentName}</span>
                  : 'PDF, JPG o PNG (opcional)'}
              </span>
            </label>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 rounded-lg border border-slate-200 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-50 transition-colors">
              Cancelar
            </button>
            <button type="submit"
              className={`flex-1 rounded-lg py-2.5 text-sm font-bold text-white transition-colors ${btnBg}`}>
              Registrar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Ledger Tab ───────────────────────────────────────────────────────────────
interface Props {
  transactions: LedgerTransaction[];
  accounts: BankAccount[];
  onAdd: (tx: LedgerTransaction) => void;
}

export function LedgerTab({ transactions, accounts, onAdd }: Props) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<'ingreso' | 'egreso' | null>(null);

  const filtered = useMemo(() =>
    transactions.filter(t =>
      t.concept.toLowerCase().includes(search.toLowerCase()) ||
      t.id.toLowerCase().includes(search.toLowerCase())
    ), [transactions, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const accName = (id: string) => {
    const a = accounts.find(x => x.id === id);
    return a ? `${a.name}` : id;
  };

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2.5 text-sm text-tech-blue outline-none focus:border-tech-blue focus:ring-2 focus:ring-tech-blue/10"
            placeholder="Buscar por concepto o ID..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <div className="flex gap-2">
          <ExportButton label="Exportar" />
          <button
            onClick={() => setModal('ingreso')}
            className="flex items-center gap-2 rounded-xl bg-tech-blue px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-900 transition-colors shadow-sm"
          >
            <ArrowUpCircle className="h-4 w-4" /> Nuevo Ingreso
          </button>
          <button
            onClick={() => setModal('egreso')}
            className="flex items-center gap-2 rounded-xl bg-vial-orange px-4 py-2.5 text-sm font-bold text-white hover:bg-orange-600 transition-colors shadow-sm shadow-orange-200"
          >
            <ArrowDownCircle className="h-4 w-4" /> Orden de Pago
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              {['Fecha', 'Concepto', 'Unidad', 'Cuenta', 'Monto', 'Estado'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400">
                  No se encontraron movimientos.
                </td>
              </tr>
            ) : paginated.map(tx => (
              <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 whitespace-nowrap text-slate-500 text-xs">
                  {tx.date.toLocaleDateString('es-AR')}
                  <span className="ml-1 text-slate-400">{tx.date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {tx.type === 'ingreso'
                      ? <ArrowUpCircle className="h-4 w-4 shrink-0 text-green-500" />
                      : <ArrowDownCircle className="h-4 w-4 shrink-0 text-red-400" />}
                    <span className="font-medium text-tech-blue max-w-[220px] truncate" title={tx.concept}>{tx.concept}</span>
                  </div>
                  <span className="ml-6 text-[10px] text-slate-400 font-mono">{tx.id}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${BIZ_COLOR[tx.businessUnit]}`}>
                    {tx.businessUnit}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">{accName(tx.accountId)}</td>
                <td className={`px-4 py-3 font-bold whitespace-nowrap ${tx.type === 'ingreso' ? 'text-green-600' : 'text-red-500'}`}>
                  {tx.type === 'ingreso' ? '+' : '-'} {CUR_SYM[tx.currency]} {tx.amount.toLocaleString('es-AR')}
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${STATUS_STYLE[tx.status]}`}>
                    {STATUS_LABEL[tx.status]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
          <p className="text-xs text-slate-400">
            Mostrando <span className="font-bold text-tech-blue">{Math.min((page-1)*PAGE_SIZE+1, filtered.length)}</span>–<span className="font-bold text-tech-blue">{Math.min(page*PAGE_SIZE, filtered.length)}</span> de <span className="font-bold text-tech-blue">{filtered.length}</span> registros
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p-1))}
              disabled={page === 1}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >← Anterior</button>
            {Array.from({ length: totalPages }, (_, i) => i+1).map(n => (
              <button key={n} onClick={() => setPage(n)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${page===n ? 'bg-tech-blue text-white' : 'border border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                {n}
              </button>
            ))}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p+1))}
              disabled={page === totalPages}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >Siguiente →</button>
          </div>
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <TxModal
          mode={modal}
          accounts={accounts.filter(a => a.status === 'active')}
          onClose={() => setModal(null)}
          onSave={tx => { onAdd(tx); setModal(null); setPage(1); }}
        />
      )}
    </div>
  );
}
