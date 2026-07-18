"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Bell, Info, AlertTriangle, CheckCircle, BellRing } from 'lucide-react';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AppNotification } from '@/types/notifications';

export const NotificationsPopover = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const popoverRef = useRef<HTMLDivElement>(null);
  const prevUnreadCountRef = useRef(0);

  // Play double beep sound using Web Audio API
  const playAudioAlert = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      
      // First beep
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, ctx.currentTime);
      gain1.gain.setValueAtTime(0.08, ctx.currentTime);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start();
      osc1.stop(ctx.currentTime + 0.15);

      // Second beep
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1200, ctx.currentTime + 0.2);
      gain2.gain.setValueAtTime(0.08, ctx.currentTime + 0.2);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(ctx.currentTime + 0.2);
      osc2.stop(ctx.currentTime + 0.35);
    } catch (err) {
      console.warn("Web Audio alert sound synthesis failed:", err);
    }
  };

  useEffect(() => {
    // Listen to real-time notifications
    const q = query(collection(db, 'notifications'), orderBy('timestamp', 'desc'), limit(10));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs: AppNotification[] = [];
      snapshot.forEach(doc => {
        notifs.push({ id: doc.id, ...doc.data() } as AppNotification);
      });
      setNotifications(notifs);
    });

    return () => unsubscribe();
  }, []);

  // Play audio alert on new unread notifications
  useEffect(() => {
    const unread = notifications.filter(n => !n.read).length;
    if (notifications.length > 0 && unread > prevUnreadCountRef.current) {
      playAudioAlert();
    }
    prevUnreadCountRef.current = unread;
  }, [notifications]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'info': return <Info className="h-4 w-4 text-tech-blue" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'alert': return <BellRing className="h-4 w-4 text-red-500" />;
      default: return <Info className="h-4 w-4 text-tech-blue" />;
    }
  };

  const formatTime = (timestamp: number) => {
    const minutes = Math.floor((Date.now() - timestamp) / 60000);
    if (minutes < 1) return 'Ahora';
    if (minutes < 60) return `Hace ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Hace ${hours} h`;
    return `Hace ${Math.floor(hours / 24)} d`;
  };

  return (
    <div className="relative" ref={popoverRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`relative rounded-full p-2 transition-all duration-300 ${
          unreadCount > 0 
            ? "text-red-500 bg-red-50 hover:bg-red-100 animate-pulse border border-red-200" 
            : "text-slate-500 hover:bg-slate-100 hover:text-tech-blue"
        }`}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 origin-top-right rounded-xl border border-slate-200 bg-white py-1 shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <h3 className="text-sm font-semibold text-tech-blue">Notificaciones</h3>
            <button className="text-xs text-tech-blue hover:text-blue-400">Marcar todo como leído</button>
          </div>
          
          <div className="max-h-96 overflow-y-auto custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-slate-500">
                No tienes notificaciones nuevas.
              </div>
            ) : (
              notifications.map(notif => (
                <div key={notif.id} className={`flex items-start gap-3 p-4 border-b border-slate-200/50 hover:bg-slate-100/50 transition-colors cursor-pointer ${!notif.read ? 'bg-blue-900/5' : ''}`}>
                  <div className="mt-0.5 shrink-0">
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className={`text-sm ${!notif.read ? 'font-semibold text-gray-200' : 'font-medium text-slate-500'}`}>
                      {notif.title}
                    </p>
                    <p className="text-xs text-slate-500">{notif.message}</p>
                    <p className="text-[10px] text-gray-600 font-medium">{formatTime(notif.timestamp)}</p>
                  </div>
                  {!notif.read && (
                    <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-tech-blue"></div>
                  )}
                </div>
              ))
            )}
          </div>
          
          <div className="border-t border-slate-200 p-2">
            <button className="w-full rounded-md px-3 py-2 text-center text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-tech-blue transition-colors">
              Ver todas las notificaciones
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
