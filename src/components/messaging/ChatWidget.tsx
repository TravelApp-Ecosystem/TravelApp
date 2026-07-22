'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bot, MessageSquare, Send, X, Sparkles, RefreshCw } from 'lucide-react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface ChatMessage {
  id: string;
  sender: { id: string; name: string; role: string };
  content: string;
  timestamp: number;
}

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize or load conversation ID from localStorage
  useEffect(() => {
    let savedId = localStorage.getItem('travis_web_conv_id');
    if (!savedId) {
      savedId = `web_chat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      localStorage.setItem('travis_web_conv_id', savedId);
    }
    setConversationId(savedId);
  }, []);

  // Listen to Firestore real-time messages for this conversation
  useEffect(() => {
    if (!conversationId) return;

    const q = query(
      collection(db, `conversations/${conversationId}/messages`),
      orderBy('timestamp', 'asc')
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const msgs: ChatMessage[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ChatMessage));
      setMessages(msgs);
    });

    return () => unsub();
  }, [conversationId]);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || !conversationId || sending) return;

    const userText = input.trim();
    setInput('');
    setSending(true);

    try {
      await fetch('/api/messages/web', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          userMessage: userText,
          userName: 'Visitante Web'
        })
      });
    } catch (err) {
      console.error('Error sending message to web Travis API:', err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2.5 bg-gradient-to-r from-slate-900 via-tech-blue to-indigo-600 text-white px-5 py-3.5 rounded-full shadow-2xl hover:scale-105 transition-all duration-300 group border border-white/20"
        >
          <div className="relative flex items-center justify-center">
            <Bot className="h-6 w-6 text-white group-hover:rotate-12 transition-transform" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>
          <span className="text-xs font-black tracking-wide">Consultar a Travis IA</span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="w-[360px] sm:w-[400px] h-[520px] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 via-tech-blue to-indigo-700 text-white p-4 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center w-9 h-9 rounded-2xl bg-white/10 border border-white/20">
                <Bot className="h-5 w-5 text-white" />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-slate-900 rounded-full"></span>
              </div>
              <div>
                <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                  Travis IA <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                </h3>
                <p className="text-[10px] text-slate-300">Asistente Virtual de Concorde 360</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-300 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3 text-slate-400">
                <div className="w-12 h-12 rounded-full bg-tech-blue/10 flex items-center justify-center text-tech-blue">
                  <Bot className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-700">¡Hola! Soy Travis IA</p>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-[220px]">
                    ¿Buscás información sobre tours, viajes o reservas? Consultame lo que necesites.
                  </p>
                </div>
              </div>
            ) : (
              messages.map(m => {
                const isUser = m.sender?.role === 'customer' || m.sender?.id === 'web_user';
                return (
                  <div key={m.id} className={`flex gap-2 ${isUser ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold ${
                      isUser ? 'bg-slate-200 text-slate-700' : 'bg-gradient-to-br from-tech-blue to-indigo-600 text-white'
                    }`}>
                      {isUser ? 'TÚ' : <Bot className="h-3.5 w-3.5" />}
                    </div>
                    <div className={`max-w-[78%] p-3 rounded-2xl text-xs leading-relaxed ${
                      isUser
                        ? 'bg-tech-blue text-white rounded-tr-none shadow-sm'
                        : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-sm'
                    }`}>
                      {m.content}
                    </div>
                  </div>
                );
              })
            )}

            {sending && (
              <div className="flex gap-2 items-center text-slate-400 text-[11px]">
                <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center">
                  <Bot className="h-3 w-3 text-slate-600" />
                </div>
                <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input */}
          <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-100 flex gap-2 items-center">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Escribí tu mensaje..."
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-tech-blue focus:bg-white transition-all"
            />
            <button
              type="submit"
              disabled={!input.trim() || sending}
              className="p-2.5 bg-tech-blue hover:bg-tech-blue/90 text-white rounded-xl transition-all disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>

        </div>
      )}
    </div>
  );
}
