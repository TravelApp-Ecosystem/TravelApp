"use client";

import React, { useState } from 'react';
import { MessageSquare, X, Send } from 'lucide-react';

export const WebChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/webhooks/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: formData.name,
          phone: formData.phone,
          source: 'Web',
          message: formData.message,
        }),
      });

      if (response.ok) {
        setSubmitted(true);
        setFormData({ name: '', phone: '', message: '' });
      } else {
        console.error('Error enviando el mensaje');
      }
    } catch (error) {
      console.error('Error de red:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="mb-4 w-80 overflow-hidden rounded-2xl border border-white/10 bg-slate-50/80 backdrop-blur-md shadow-2xl transition-all duration-300">
          <div className="bg-tech-blue/20 p-4 border-b border-white/5 flex justify-between items-center">
            <div>
              <h3 className="text-tech-blue font-bold text-sm">Soporte TravelCab</h3>
              <p className="text-blue-400 text-xs mt-0.5">Te responderemos pronto</p>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-slate-500 hover:text-tech-blue transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="p-4">
            {submitted ? (
              <div className="py-8 text-center">
                <div className="mx-auto w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mb-3">
                  <Send className="h-6 w-6 text-green-500" />
                </div>
                <h4 className="text-tech-blue font-medium mb-1">¡Mensaje enviado!</h4>
                <p className="text-slate-500 text-sm">Nos pondremos en contacto contigo a la brevedad.</p>
                <button 
                  onClick={() => setSubmitted(false)}
                  className="mt-4 text-blue-400 text-sm hover:text-blue-300 transition-colors"
                >
                  Enviar otro mensaje
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <input 
                    type="text" 
                    required
                    placeholder="Tu nombre" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full rounded-lg border border-slate-200 bg-white/50 px-3 py-2 text-sm text-tech-blue placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <input 
                    type="tel" 
                    placeholder="Tu teléfono" 
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full rounded-lg border border-slate-200 bg-white/50 px-3 py-2 text-sm text-tech-blue placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <textarea 
                    required
                    placeholder="¿En qué podemos ayudarte?" 
                    rows={3}
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    className="w-full rounded-lg border border-slate-200 bg-white/50 px-3 py-2 text-sm text-tech-blue placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center space-x-2 rounded-lg bg-tech-blue px-4 py-2 text-sm font-medium text-tech-blue hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Enviando...</span>
                  ) : (
                    <>
                      <span>Enviar mensaje</span>
                      <Send className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-tech-blue text-tech-blue shadow-lg shadow-blue-900/50 hover:bg-tech-blue hover:scale-105 transition-all duration-300"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
      </button>
    </div>
  );
};
