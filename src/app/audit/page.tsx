"use client";
import React, { useState } from 'react';
import { Vault, Landmark, BookOpen, AlarmClock, Building2, BarChart2 } from 'lucide-react';
import {
  BankAccount, AuditAdjustment, LedgerTransaction, ScheduledTransaction,
  INITIAL_ACCOUNTS, INITIAL_TRANSACTIONS, INITIAL_SCHEDULED,
} from '@/components/audit/types';
import { FlowTab }          from '@/components/audit/FlowTab';
import { LedgerTab }        from '@/components/audit/LedgerTab';
import { ScheduleTab }      from '@/components/audit/ScheduleTab';
import { ProfitabilityTab } from '@/components/audit/ProfitabilityTab';
import { DirectoryTab }     from '@/components/audit/DirectoryTab';

type TabId = 'flow' | 'ledger' | 'schedule' | 'profit' | 'directory';

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'flow',      label: 'Flujo y Bancos',      icon: <Landmark className="h-4 w-4" /> },
  { id: 'ledger',    label: 'Libro Mayor',          icon: <BookOpen className="h-4 w-4" /> },
  { id: 'schedule',  label: 'Vencimientos',         icon: <AlarmClock className="h-4 w-4" /> },
  { id: 'profit',    label: 'Rentabilidad',         icon: <BarChart2 className="h-4 w-4" /> },
  { id: 'directory', label: 'Directorio',           icon: <Building2 className="h-4 w-4" /> },
];

export default function AuditPage() {
  const [activeTab, setActiveTab]       = useState<TabId>('flow');
  const [accounts, setAccounts]         = useState<BankAccount[]>(INITIAL_ACCOUNTS);
  const [adjustments, setAdjustments]   = useState<AuditAdjustment[]>([]);
  const [transactions, setTransactions] = useState<LedgerTransaction[]>(INITIAL_TRANSACTIONS);
  const [scheduled, setScheduled]       = useState<ScheduledTransaction[]>(INITIAL_SCHEDULED);

  const settleItem = (id: string) =>
    setScheduled(p => p.map(s => s.id === id ? { ...s, status: 'pagado' } : s));

  return (
    <div className="min-h-full bg-slate-50 p-6 lg:p-8">
      {/* ── Header ── */}
      <div className="mb-8">
        <h1 className="flex items-center gap-3 text-2xl font-black text-tech-blue">
          <Vault className="h-7 w-7 text-vial-orange" />
          Auditoría &amp; Control Financiero
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Gestión integral de cuentas, movimientos, vencimientos, rentabilidad y directorio comercial del ecosistema TravelApp.
        </p>
      </div>

      {/* ── Tab Bar ── */}
      <div className="mb-8 flex overflow-x-auto gap-1 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-1 min-w-max items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all ${
              activeTab === tab.id
                ? 'bg-tech-blue text-white shadow-sm'
                : 'text-slate-500 hover:bg-slate-50 hover:text-tech-blue'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      {activeTab === 'flow' && (
        <FlowTab
          accounts={accounts}
          adjustments={adjustments}
          setAccounts={setAccounts}
          setAdjustments={setAdjustments}
        />
      )}
      {activeTab === 'ledger' && (
        <LedgerTab
          transactions={transactions}
          accounts={accounts}
          onAdd={tx => setTransactions(p => [tx, ...p])}
        />
      )}
      {activeTab === 'schedule' && (
        <ScheduleTab
          items={scheduled}
          onAdd={s => setScheduled(p => [s, ...p])}
          onSettle={settleItem}
        />
      )}
      {activeTab === 'profit'    && <ProfitabilityTab />}
      {activeTab === 'directory' && <DirectoryTab />}
    </div>
  );
}
