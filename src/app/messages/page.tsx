"use client";

import React, { useState } from 'react';
import { Search, Send, Bell, Hash, Users, Bot, MessageSquare } from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AppNotification } from '@/types/notifications';

const mockChannels = [
  { id: 'c1', name: '# Anuncios Globales', icon: Hash, unread: 0 },
  { id: 'c2', name: '# Soporte Travis', icon: Bot, unread: 2 },
  { id: 'c3', name: '# Ventas TravelCab', icon: Users, unread: 5 },
];

const mockDirectMessages = [
  { id: 'u1', name: 'Carlos Mendoza', role: 'Cliente VIP', status: 'online' },
  { id: 'u2', name: 'Laura Gómez', role: 'B2B Experiencias', status: 'offline' },
];

export default function MessagesPage() {
  const [activeChat, setActiveChat] = useState('c1');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMessage.trim()) return;
    
    setIsSending(true);
    try {
      const notification: Omit<AppNotification, 'id'> = {
        title: 'Mensaje Global del Admin',
        message: broadcastMessage,
        timestamp: Date.now(),
        read: false,
        type: 'alert'
      };
      
      await addDoc(collection(db, 'notifications'), notification);
      setBroadcastMessage('');
      alert('Broadcast enviado a todo el equipo.');
    } catch (error) {
      console.error("Error al enviar broadcast:", error);
      alert("Hubo un error al enviar el broadcast.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-slate-50">
      
      {/* Panel Izquierdo: Lista de Contactos / Canales */}
      <div className="w-80 flex-shrink-0 border-r border-slate-200 bg-white/50 flex flex-col">
        <div className="p-4 border-b border-slate-200">
          <h2 className="text-lg font-bold text-tech-blue flex items-center">
            <MessageSquare className="mr-2 h-5 w-5 text-tech-blue" /> Mensajería
          </h2>
          <div className="mt-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Buscar conversaciones..." 
              className="w-full rounded-md border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm text-tech-blue focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-6">
          {/* Canales */}
          <div>
            <h3 className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Canales</h3>
            <div className="space-y-1">
              {mockChannels.map(channel => {
                const Icon = channel.icon;
                return (
                  <button 
                    key={channel.id}
                    onClick={() => setActiveChat(channel.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeChat === channel.id ? 'bg-tech-blue/10 text-blue-400' : 'text-slate-500 hover:bg-slate-100 hover:text-gray-200'}`}
                  >
                    <div className="flex items-center">
                      <Icon className="mr-2 h-4 w-4" />
                      {channel.name}
                    </div>
                    {channel.unread > 0 && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-tech-blue text-[10px] text-tech-blue">
                        {channel.unread}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Mensajes Directos */}
          <div>
            <h3 className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Mensajes Directos</h3>
            <div className="space-y-1">
              {mockDirectMessages.map(user => (
                <button 
                  key={user.id}
                  onClick={() => setActiveChat(user.id)}
                  className={`w-full flex items-center px-3 py-2 rounded-md text-sm transition-colors ${activeChat === user.id ? 'bg-tech-blue/10' : 'hover:bg-slate-100'}`}
                >
                  <div className="relative mr-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 font-bold">
                      {user.name.charAt(0)}
                    </div>
                    <span className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-gray-900 ${user.status === 'online' ? 'bg-green-500' : 'bg-gray-500'}`}></span>
                  </div>
                  <div className="text-left">
                    <p className={`font-medium ${activeChat === user.id ? 'text-blue-400' : 'text-gray-200'}`}>{user.name}</p>
                    <p className="text-xs text-slate-500">{user.role}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Panel Derecho: Área de Chat / Broadcast */}
      <div className="flex-1 flex flex-col bg-slate-50">
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-6">
          <h3 className="font-bold text-tech-blue text-lg">
            {activeChat === 'c1' ? '# Anuncios Globales' : 'Conversación Privada'}
          </h3>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          {activeChat === 'c1' ? (
            <div className="flex h-full flex-col items-center justify-center text-center space-y-4">
              <div className="rounded-full bg-tech-blue/10 p-6">
                <Bell className="h-12 w-12 text-tech-blue" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-tech-blue">Broadcast Global</h2>
                <p className="mt-2 max-w-md text-sm text-slate-500">
                  Usa este canal para enviar alertas, noticias o notificaciones a todo el equipo. El mensaje aparecerá en la campana de notificaciones del ecosistema de todos los usuarios.
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center text-slate-500 mt-20">Selecciona un chat activo para ver el historial (Mock)</div>
          )}
        </div>

        {/* Input Area */}
        {activeChat === 'c1' && (
          <div className="p-4 border-t border-slate-200 bg-white/50">
            <form onSubmit={handleBroadcast} className="relative flex items-center">
              <input
                type="text"
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                placeholder="Escribe un anuncio global aquí..."
                disabled={isSending}
                className="w-full rounded-full border border-slate-300 bg-slate-50 py-3 pl-4 pr-12 text-sm text-tech-blue focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
              />
              <button 
                type="submit"
                disabled={!broadcastMessage.trim() || isSending}
                className="absolute right-2 flex h-8 w-8 items-center justify-center rounded-full bg-tech-blue text-tech-blue hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-500 transition-colors"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        )}
      </div>

    </div>
  );
}
