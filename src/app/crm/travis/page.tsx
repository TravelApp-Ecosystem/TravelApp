'use client';

import React, { useState, useEffect, useRef } from 'react';
import { doc, getDoc, setDoc, updateDoc, addDoc, collection, onSnapshot, query, orderBy, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  TravisConfig, TravisKnowledgeEntry, DEFAULT_TRAVIS_CONFIG,
  MessageChannel,
} from '@/types/messaging';
import {
  Bot, Save, RefreshCw, Send, Plus, Edit2, Trash2, Check, X,
  AlertCircle, Zap, BookOpen,
  Settings, MessageSquare, Phone, Globe,
  ThumbsUp, ThumbsDown, Sparkles,
  ToggleLeft, ToggleRight, Clock,
} from 'lucide-react';

// Inline SVG para íconos de redes sociales no disponibles en lucide-react v1.x
const Instagram = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <circle cx="12" cy="12" r="4"/>
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
  </svg>
);
const Facebook = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
  </svg>
);

// ─── Channel status badge ─────────────────────────────────────────────────────

const CHANNEL_CONFIG = [
  { key: 'whatsapp' as MessageChannel, label: 'WhatsApp', icon: Phone, color: 'emerald', desc: 'Integrado via ManyChat. Requiere API Token activo.' },
  { key: 'instagram' as MessageChannel, label: 'Instagram DM', icon: Instagram, color: 'pink', desc: 'Instagram Direct Messages via ManyChat Pro.' },
  { key: 'messenger' as MessageChannel, label: 'Messenger', icon: Facebook, color: 'blue', desc: 'Facebook Messenger via ManyChat.' },
  { key: 'web' as MessageChannel, label: 'Chat Web', icon: Globe, color: 'sky', desc: 'Widget de chat en las landing pages (ManyChat widget).' },
];

type TravisTab = 'prompt' | 'knowledge' | 'channels' | 'training';

// ─── System Prompt Tab ────────────────────────────────────────────────────────

function SystemPromptTab({ config, onSave }: { config: TravisConfig; onSave: (partial: Partial<TravisConfig>) => Promise<void> }) {
  const [prompt, setPrompt] = useState(config.systemPrompt);
  const [context, setContext] = useState(config.businessContext);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setPrompt(config.systemPrompt);
    setContext(config.businessContext);
  }, [config.systemPrompt, config.businessContext]);

  const handleSave = async () => {
    setSaving(true);
    await onSave({ systemPrompt: prompt, businessContext: context });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const VARIABLES = ['{nombre}', '{unidad_negocio}', '{puntos_rewards}', '{conductor}', '{eta}', '{destino}'];

  return (
    <div className="space-y-5">
      <div className="bg-sky-50 border border-sky-200 rounded-xl p-3 flex gap-2.5">
        <Sparkles className="h-4 w-4 text-tech-blue flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-semibold text-slate-700">¿Qué es el System Prompt?</p>
          <p className="text-xs text-slate-500 mt-0.5">
            Es la "personalidad" y las instrucciones base de Travis. Define cómo debe hablar, qué sabe y qué tiene que hacer en cada situación. Cuanto más detallado, mejor responderá.
          </p>
        </div>
      </div>

      {/* Variables disponibles */}
      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Variables disponibles</label>
        <div className="flex flex-wrap gap-1.5">
          {VARIABLES.map(v => (
            <button
              key={v}
              onClick={() => setPrompt(p => p + ' ' + v)}
              className="px-2 py-1 bg-slate-100 hover:bg-tech-blue/10 hover:text-tech-blue border border-slate-200 rounded-lg text-xs font-mono transition-colors"
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Context */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1.5">
          Contexto del Negocio
          <span className="ml-1 text-slate-400 font-normal">(breve descripción de TravelApp)</span>
        </label>
        <textarea
          value={context}
          onChange={e => setContext(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-tech-blue/20 resize-none"
          placeholder="Descripción del negocio..."
        />
      </div>

      {/* System prompt */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1.5">
          System Prompt Principal
          <span className="ml-1 text-slate-400 font-normal">({prompt.length} caracteres)</span>
        </label>
        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          rows={18}
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-tech-blue/20 resize-none font-mono leading-relaxed"
          placeholder="Instrucciones detalladas para Travis..."
        />
      </div>

      <button
        onClick={handleSave}
        disabled={saving || saved}
        className="flex items-center gap-2 px-5 py-2.5 bg-tech-blue hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-70"
      >
        {saved ? <><Check className="h-4 w-4" /> ¡Guardado!</> : saving ? <><RefreshCw className="h-4 w-4 animate-spin" /> Guardando...</> : <><Save className="h-4 w-4" /> Guardar System Prompt</>}
      </button>
    </div>
  );
}

// ─── Knowledge Base Tab ───────────────────────────────────────────────────────

function KnowledgeBaseTab({ config, onSave }: { config: TravisConfig; onSave: (partial: Partial<TravisConfig>) => Promise<void> }) {
  const [entries, setEntries] = useState<TravisKnowledgeEntry[]>(config.knowledgeBase || []);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editCategory, setEditCategory] = useState<TravisKnowledgeEntry['category']>('General');
  const [addingNew, setAddingNew] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setEntries(config.knowledgeBase || []);
  }, [config.knowledgeBase]);

  const CATEGORIES: TravisKnowledgeEntry['category'][] = ['TravelCab', 'Experiences', 'Rewards', 'General', 'Drivers'];
  const CATEGORY_COLORS: Record<string, string> = {
    TravelCab: 'bg-blue-100 text-blue-700',
    Experiences: 'bg-emerald-100 text-emerald-700',
    Rewards: 'bg-amber-100 text-amber-700',
    General: 'bg-slate-100 text-slate-600',
    Drivers: 'bg-orange-100 text-orange-700',
  };

  const saveEntry = async (isNew: boolean) => {
    setSaving(true);
    let updated: TravisKnowledgeEntry[];
    if (isNew) {
      const newEntry: TravisKnowledgeEntry = {
        id: `kb_${Date.now()}`,
        title: editTitle,
        content: editContent,
        category: editCategory,
        createdAt: Date.now(),
      };
      updated = [...entries, newEntry];
    } else {
      updated = entries.map(e => e.id === editingId ? { ...e, title: editTitle, content: editContent, category: editCategory } : e);
    }
    await onSave({ knowledgeBase: updated });
    setEntries(updated);
    setEditingId(null);
    setAddingNew(false);
    setEditTitle('');
    setEditContent('');
    setSaving(false);
  };

  const deleteEntry = async (id: string) => {
    const updated = entries.filter(e => e.id !== id);
    await onSave({ knowledgeBase: updated });
    setEntries(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">
            Agregá artículos de conocimiento para que Travis pueda responder con información específica y precisa sobre TravelApp.
          </p>
        </div>
        <button
          onClick={() => { setAddingNew(true); setEditTitle(''); setEditContent(''); setEditCategory('General'); }}
          className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-tech-blue text-white text-xs font-bold rounded-lg"
        >
          <Plus className="h-3.5 w-3.5" /> Nuevo Artículo
        </button>
      </div>

      {/* New/Edit form */}
      {(addingNew || editingId) && (
        <div className="bg-white border border-tech-blue/30 rounded-xl p-4 shadow-sm space-y-3">
          <h4 className="text-sm font-bold text-slate-800">{addingNew ? 'Nuevo Artículo' : 'Editar Artículo'}</h4>
          <input
            value={editTitle}
            onChange={e => setEditTitle(e.target.value)}
            placeholder="Título del artículo (ej: Tarifas TravelCab)"
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-tech-blue/20"
          />
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setEditCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border ${editCategory === cat ? 'border-tech-blue bg-tech-blue/10 text-tech-blue' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
              >
                {cat}
              </button>
            ))}
          </div>
          <textarea
            value={editContent}
            onChange={e => setEditContent(e.target.value)}
            rows={6}
            placeholder="Contenido del artículo. Podés usar Markdown (**negrita**, listas, etc.)"
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-tech-blue/20 resize-none font-mono"
          />
          <div className="flex gap-2">
            <button
              onClick={() => saveEntry(addingNew)}
              disabled={saving || !editTitle.trim() || !editContent.trim()}
              className="px-4 py-2 bg-tech-blue text-white text-sm font-bold rounded-lg disabled:opacity-50"
            >
              {saving ? 'Guardando...' : <><Save className="h-3.5 w-3.5 inline mr-1" /> Guardar</>}
            </button>
            <button onClick={() => { setEditingId(null); setAddingNew(false); }} className="px-4 py-2 border border-slate-200 text-slate-600 text-sm rounded-lg">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Entries list */}
      {entries.length === 0 && !addingNew ? (
        <div className="text-center py-10 text-slate-400">
          <BookOpen className="h-10 w-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Sin artículos. Agregá el primero para entrenar a Travis.</p>
          <p className="text-xs mt-1">Ej: "Tarifas TravelCab", "¿Cómo funciona Rewards?", "Requisitos para conductores"</p>
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map(entry => (
            <div key={entry.id} className="bg-white border border-slate-200 rounded-xl p-3 hover:border-slate-300 transition-colors">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-800 text-sm">{entry.title}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${CATEGORY_COLORS[entry.category] || 'bg-slate-100 text-slate-500'}`}>
                      {entry.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{entry.content}</p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button
                    onClick={() => { setEditingId(entry.id); setAddingNew(false); setEditTitle(entry.title); setEditContent(entry.content); setEditCategory(entry.category); }}
                    className="p-1.5 hover:bg-slate-100 rounded-lg"
                  >
                    <Edit2 className="h-3.5 w-3.5 text-slate-400" />
                  </button>
                  <button onClick={() => deleteEntry(entry.id)} className="p-1.5 hover:bg-red-50 rounded-lg">
                    <Trash2 className="h-3.5 w-3.5 text-red-400" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Channels Tab ─────────────────────────────────────────────────────────────

function ChannelsTab({ config, onSave }: { config: TravisConfig; onSave: (partial: Partial<TravisConfig>) => Promise<void> }) {
  const [activeChannels, setActiveChannels] = useState(config.activeChannels);
  const [autoReply, setAutoReply] = useState(config.autoReplyEnabled);
  const [handoffTriggers, setHandoffTriggers] = useState(config.handoffTriggers.join(', '));
  const [outOfHours, setOutOfHours] = useState(config.outOfHoursMessage);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const manyChatTokenSet = process.env.NEXT_PUBLIC_APP_URL !== undefined; // always true, just showing config

  const handleSave = async () => {
    setSaving(true);
    await onSave({
      activeChannels,
      autoReplyEnabled: autoReply,
      handoffTriggers: handoffTriggers.split(',').map(t => t.trim()).filter(Boolean),
      outOfHoursMessage: outOfHours,
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const COLOR_MAP: Record<string, string> = {
    emerald: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    pink: 'bg-pink-100 text-pink-700 border-pink-200',
    blue: 'bg-blue-100 text-blue-700 border-blue-200',
    sky: 'bg-sky-100 text-sky-700 border-sky-200',
  };

  return (
    <div className="space-y-5">
      {/* Auto-reply toggle */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-bold text-slate-800 text-sm">Respuesta Automática (Travis)</h4>
            <p className="text-xs text-slate-400 mt-0.5">Cuando está activo, Travis responde automáticamente a todos los mensajes entrantes.</p>
          </div>
          <button onClick={() => setAutoReply(!autoReply)} className="flex-shrink-0">
            {autoReply
              ? <ToggleRight className="h-8 w-8 text-tech-blue" />
              : <ToggleLeft className="h-8 w-8 text-slate-300" />}
          </button>
        </div>
      </div>

      {/* Channel status */}
      <div>
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Estado de Canales</h4>
        <div className="space-y-2">
          {CHANNEL_CONFIG.map(ch => {
            const Icon = ch.icon;
            const isActive = activeChannels[ch.key as keyof typeof activeChannels];
            return (
              <div key={ch.key} className={`flex items-center gap-3 p-3 rounded-xl border ${COLOR_MAP[ch.color]} bg-opacity-50`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isActive ? `bg-${ch.color}-100` : 'bg-slate-100'}`}>
                  <Icon className={`h-4 w-4 ${isActive ? `text-${ch.color}-600` : 'text-slate-300'}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-800">{ch.label}</span>
                    {isActive
                      ? <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">✅ Activo</span>
                      : <span className="text-[10px] bg-slate-100 text-slate-400 px-2 py-0.5 rounded-full font-bold">⭕ Inactivo</span>}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">{ch.desc}</p>
                </div>
                <button
                  onClick={() => setActiveChannels(prev => ({ ...prev, [ch.key]: !isActive }))}
                  className="flex-shrink-0"
                >
                  {isActive ? <ToggleRight className="h-6 w-6 text-tech-blue" /> : <ToggleLeft className="h-6 w-6 text-slate-300" />}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Handoff triggers */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1.5">
          Palabras que escalan al operador humano
        </label>
        <p className="text-xs text-slate-400 mb-2">Cuando un usuario escribe estas palabras, Travis detiene sus respuestas y avisa al equipo. Separalas con comas.</p>
        <textarea
          value={handoffTriggers}
          onChange={e => setHandoffTriggers(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-tech-blue/20 resize-none"
          placeholder="hablar con una persona, urgente, reclamo, emergencia..."
        />
      </div>

      {/* Out of hours message */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1.5">
          Mensaje fuera de horario
        </label>
        <textarea
          value={outOfHours}
          onChange={e => setOutOfHours(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-tech-blue/20 resize-none"
        />
      </div>

      <button
        onClick={handleSave}
        disabled={saving || saved}
        className="flex items-center gap-2 px-5 py-2.5 bg-tech-blue hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-70"
      >
        {saved ? <><Check className="h-4 w-4" /> ¡Guardado!</> : saving ? <><RefreshCw className="h-4 w-4 animate-spin" /> Guardando...</> : <><Save className="h-4 w-4" /> Guardar Configuración</>}
      </button>
    </div>
  );
}

// ─── Training Tab (Test Chat) ─────────────────────────────────────────────────

interface TrainMessage {
  role: 'user' | 'travis';
  content: string;
  feedback?: 'good' | 'bad' | null;
  businessUnit?: string;
}

function TrainingTab() {
  const [messages, setMessages] = useState<TrainMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [businessUnit, setBusinessUnit] = useState<string>('General');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);
    try {
      const history = messages.map(m => ({ role: m.role === 'travis' ? 'assistant' : 'user', content: m.content }));
      const res = await fetch('/api/travis/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, businessUnit, history }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, {
        role: 'travis',
        content: data.response || 'Error al obtener respuesta.',
        feedback: null,
        businessUnit: data.businessUnit,
      }]);
    } catch {
      setMessages(prev => [...prev, { role: 'travis', content: 'Error de conexión con Travis.', feedback: null }]);
    }
    setLoading(false);
  };

  const setFeedback = (idx: number, feedback: 'good' | 'bad') => {
    setMessages(prev => prev.map((m, i) => i === idx ? { ...m, feedback } : m));
  };

  const BUS = ['General', 'TravelCab', 'Experiences', 'Rewards'];

  return (
    <div className="flex flex-col h-[calc(100vh-280px)]">
      <div className="bg-sky-50 border border-sky-200 rounded-xl p-3 mb-3 flex gap-2">
        <Bot className="h-4 w-4 text-tech-blue flex-shrink-0 mt-0.5" />
        <div className="text-xs text-slate-600">
          <strong>Chat de Entrenamiento:</strong> Probá cómo responde Travis. Marcá cada respuesta con 👍 o 👎 para identificar qué mejorar en el System Prompt o la Base de Conocimiento.
        </div>
      </div>

      {/* Business unit selector */}
      <div className="flex gap-1.5 mb-3 flex-wrap">
        <span className="text-xs text-slate-400 self-center">Simular como:</span>
        {BUS.map(b => (
          <button
            key={b}
            onClick={() => setBusinessUnit(b)}
            className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${businessUnit === b ? 'bg-tech-blue text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
          >
            {b}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
            <Bot className="h-10 w-10 opacity-30" />
            <p className="text-sm">Escribí un mensaje para probar a Travis</p>
          </div>
        )}
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${msg.role === 'travis' ? 'bg-gradient-to-br from-tech-blue to-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
              {msg.role === 'travis' ? <Bot className="h-4 w-4" /> : 'TU'}
            </div>
            <div className={`max-w-[75%] flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`px-3 py-2 rounded-2xl text-sm ${msg.role === 'travis' ? 'bg-gradient-to-br from-tech-blue to-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-800'}`}>
                {msg.content}
              </div>
              {msg.role === 'travis' && msg.feedback !== undefined && (
                <div className="flex items-center gap-2">
                  {msg.businessUnit && (
                    <span className="text-[10px] text-slate-400">→ {msg.businessUnit}</span>
                  )}
                  <button onClick={() => setFeedback(idx, 'good')} className={`p-1 rounded-lg transition-all ${msg.feedback === 'good' ? 'bg-emerald-100 text-emerald-600' : 'hover:bg-slate-100 text-slate-300'}`}>
                    <ThumbsUp className="h-3 w-3" />
                  </button>
                  <button onClick={() => setFeedback(idx, 'bad')} className={`p-1 rounded-lg transition-all ${msg.feedback === 'bad' ? 'bg-red-100 text-red-500' : 'hover:bg-slate-100 text-slate-300'}`}>
                    <ThumbsDown className="h-3 w-3" />
                  </button>
                  {msg.feedback === 'bad' && (
                    <span className="text-[10px] text-red-500">Mejorá el System Prompt o la Base de Conocimiento ↗</span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-tech-blue to-indigo-600 flex items-center justify-center flex-shrink-0">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <div className="bg-slate-100 rounded-2xl px-3 py-2 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="mt-3 flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          placeholder="Escribí como si fueras un cliente de WhatsApp..."
          className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-tech-blue/20"
        />
        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          className="p-2.5 bg-tech-blue hover:bg-blue-700 text-white rounded-xl transition-colors disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>

      {messages.filter(m => m.feedback === 'bad').length > 0 && (
        <div className="mt-2 bg-amber-50 border border-amber-200 rounded-lg p-2.5 flex gap-2">
          <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700">
            Tenés {messages.filter(m => m.feedback === 'bad').length} respuesta(s) marcadas como malas. Revisá el System Prompt o agregá artículos a la Base de Conocimiento.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TravisSettingsPage() {
  const [config, setConfig] = useState<TravisConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TravisTab>('prompt');

  useEffect(() => {
    async function loadConfig() {
      try {
        const d = await getDoc(doc(db, 'travisConfig', 'main'));
        if (d.exists()) {
          setConfig(d.data() as TravisConfig);
        } else {
          const defaultConfig: TravisConfig = { ...DEFAULT_TRAVIS_CONFIG, updatedAt: Date.now() };
          await setDoc(doc(db, 'travisConfig', 'main'), defaultConfig);
          setConfig(defaultConfig);
        }
      } catch (err) {
        console.error('Error loading Travis config:', err);
        setConfig({ ...DEFAULT_TRAVIS_CONFIG, updatedAt: Date.now() });
      }
      setLoading(false);
    }
    loadConfig();
  }, []);

  const handleSave = async (partial: Partial<TravisConfig>) => {
    try {
      await updateDoc(doc(db, 'travisConfig', 'main'), { ...partial, updatedAt: Date.now() });
      setConfig(prev => prev ? { ...prev, ...partial } : prev);
    } catch (err) {
      console.error('Error saving Travis config:', err);
    }
  };

  const TABS = [
    { key: 'prompt' as TravisTab, label: 'System Prompt', icon: Sparkles, desc: 'Personalidad y reglas de Travis' },
    { key: 'knowledge' as TravisTab, label: 'Conocimiento', icon: BookOpen, desc: 'Artículos de información' },
    { key: 'channels' as TravisTab, label: 'Canales', icon: Settings, desc: 'WhatsApp, IG, Messenger, Web' },
    { key: 'training' as TravisTab, label: 'Entrenar', icon: Bot, desc: 'Probar y mejorar respuestas' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        Cargando configuración de Travis...
      </div>
    );
  }

  return (
    <div className="flex gap-6 h-[calc(100vh-120px)]">
      {/* Left sidebar - tabs */}
      <div className="w-56 flex-shrink-0">
        <div className="bg-white rounded-2xl border border-slate-200 p-2 space-y-1">
          <div className="px-3 py-2 mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-tech-blue to-indigo-600 flex items-center justify-center">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div>
                <div className="font-black text-slate-800 text-sm">Travis IA</div>
                <div className="text-[10px] text-emerald-500 font-semibold">● En línea</div>
              </div>
            </div>
          </div>
          {TABS.map(t => {
            const Icon = t.icon;
            const isActive = activeTab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all ${isActive ? 'bg-tech-blue text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <div>
                  <div className="text-xs font-bold">{t.label}</div>
                  <div className={`text-[10px] ${isActive ? 'text-white/70' : 'text-slate-400'}`}>{t.desc}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Status card */}
        <div className="mt-3 bg-emerald-50 border border-emerald-200 rounded-2xl p-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-emerald-700">Travis Activo</span>
          </div>
          <div className="space-y-1 text-[11px] text-emerald-600">
            <div className="flex justify-between">
              <span>Auto-reply</span>
              <span className="font-bold">{config?.autoReplyEnabled ? 'ON' : 'OFF'}</span>
            </div>
            <div className="flex justify-between">
              <span>Canales activos</span>
              <span className="font-bold">
                {config ? Object.values(config.activeChannels).filter(Boolean).length : 0}/4
              </span>
            </div>
            <div className="flex justify-between">
              <span>Artículos KB</span>
              <span className="font-bold">{config?.knowledgeBase?.length || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200 p-6 overflow-y-auto">
        <div className="mb-5">
          <h2 className="text-lg font-black text-slate-800">
            {TABS.find(t => t.key === activeTab)?.label}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {TABS.find(t => t.key === activeTab)?.desc}
          </p>
        </div>

        {config && (
          <>
            {activeTab === 'prompt' && <SystemPromptTab config={config} onSave={handleSave} />}
            {activeTab === 'knowledge' && <KnowledgeBaseTab config={config} onSave={handleSave} />}
            {activeTab === 'channels' && <ChannelsTab config={config} onSave={handleSave} />}
            {activeTab === 'training' && <TrainingTab />}
          </>
        )}
      </div>
    </div>
  );
}
