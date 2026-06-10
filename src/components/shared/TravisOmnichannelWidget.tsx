"use client";

import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Send, Phone, MessageCircle, ChevronUp } from "lucide-react";

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <circle cx="12" cy="12" r="4"/>
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
  </svg>
);

interface TravisOmnichannelWidgetProps {
  businessUnit: "TravelCab" | "Experiences" | "Rewards" | "General";
  whatsappUrl?: string;
  messengerUrl?: string;
  instagramUrl?: string;
  primaryColor?: string; // Hex color code (e.g. #ff7b1a)
  brandName?: string;
  isOpenExternal?: boolean;
  onCloseExternal?: () => void;
}

export const TravisOmnichannelWidget: React.FC<TravisOmnichannelWidgetProps> = ({
  businessUnit,
  whatsappUrl = "https://wa.me/5493814188106",
  messengerUrl = "https://m.me/travelapp",
  instagramUrl = "https://instagram.com/travelapp.ar",
  primaryColor = "#ff6b00", // Default orange
  brandName = "TravelApp",
  isOpenExternal,
  onCloseExternal,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showChat, setShowChat] = useState(false);
  
  const isChatOpen = isOpenExternal !== undefined ? isOpenExternal : showChat;
  const setIsChatOpen = (val: boolean) => {
    if (!val && onCloseExternal) {
      onCloseExternal();
    }
    setShowChat(val);
  };
  const [currentMessage, setCurrentMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  
  // Initial message based on business unit
  const getInitialMessage = () => {
    switch (businessUnit) {
      case "TravelCab":
        return "¡Hola! 👋 Soy Travis, el asistente de TravelCab. 🚕 ¿En qué puedo ayudarte hoy? Consultame sobre tarifas, traslados urbanos o cómo pedir un móvil.";
      case "Experiences":
        return "¡Hola! 🌟 Soy Travis, asistente de TravelExperiences. 🗺️ Te puedo brindar información sobre destinos, transportes turísticos, hoteles o reseñas. ¿Qué destino te gustaría explorar hoy?";
      case "Rewards":
        return "¡Hola! 🎁 Soy Travis, de TravelRewards. 🏆 ¿Querés saber cuántos puntos tenés, cómo sumarlos o ver el catálogo de canjes del ecosistema?";
      default:
        return "¡Hola! Soy Travis, el asistente virtual de TravelApp. 🤖 ¿En qué te puedo ayudar hoy? Podés consultarme sobre traslados (TravelCab), tours (Experiences) o puntos de fidelidad (Rewards).";
    }
  };

  const [messages, setMessages] = useState<Array<{ sender: "user" | "travis"; text: string; time: string }>>([
    {
      sender: "travis",
      text: getInitialMessage(),
      time: new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages list changes
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMessage.trim() || isTyping) return;
    
    const userMsg = currentMessage.trim();
    setCurrentMessage("");
    const now = new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
    
    setMessages((prev) => [...prev, { sender: "user", text: userMsg, time: now }]);
    setIsTyping(true);

    try {
      const res = await fetch("/api/travis/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg, businessUnit }),
      });
      
      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [
          ...prev,
          {
            sender: "travis",
            text: data.response || "No he podido procesar tu solicitud en este momento.",
            time: new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
      } else {
        throw new Error();
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          sender: "travis",
          text: "Disculpame, estoy teniendo un inconveniente técnico para responderte. Si querés podés escribirme a WhatsApp.",
          time: new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const finalWhatsappUrl = `${whatsappUrl}?text=Hola%20Travis!%20Vengo%20de%20la%20landing%20de%20${brandName}.`;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isChatOpen && (
        <div 
          className="mb-4 w-full max-w-[360px] sm:max-w-[400px] h-[520px] bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden transition-all duration-300 transform scale-100 origin-bottom-right"
          style={{ animation: "scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)" }}
        >
          {/* Header */}
          <div 
            className="text-white p-4 flex items-center justify-between shadow-md relative"
            style={{ backgroundColor: "#0a2a5b" }} // Keep unified navy theme or custom colors
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="h-10 w-10 rounded-full bg-white overflow-hidden border border-white/20">
                  <img src="/assets/travis_perfil.svg" alt="Travis" className="h-full w-full object-cover scale-110" />
                </div>
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-[#0a2a5b]" />
              </div>
              <div className="text-left">
                <p className="font-black text-sm">Travis IA</p>
                <p className="text-[10px] text-orange-400 font-bold tracking-wider uppercase">Asistente Virtual</p>
              </div>
            </div>
            <button
              onClick={() => setIsChatOpen(false)}
              className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto bg-slate-50 space-y-3 flex flex-col">
            {messages.map((msg, idx) => {
              const isTravis = msg.sender === "travis";
              return (
                <div
                  key={idx}
                  className={`flex flex-col max-w-[85%] ${
                    isTravis ? "self-start items-start" : "self-end items-end"
                  }`}
                >
                  <div
                    className={`rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                      isTravis
                        ? "bg-white text-slate-700 shadow-sm border border-slate-100 rounded-tl-none whitespace-pre-wrap text-left"
                        : "text-white rounded-tr-none text-left"
                    }`}
                    style={!isTravis ? { backgroundColor: primaryColor } : {}}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[9px] text-slate-400 mt-1 px-1 font-medium">{msg.time}</span>
                </div>
              );
            })}
            
            {/* Typing Indicator */}
            {isTyping && (
              <div className="self-start flex flex-col items-start max-w-[85%]">
                <div className="bg-white text-slate-455 rounded-2xl px-4 py-3 shadow-sm border border-slate-100 rounded-tl-none flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Form Input */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-100 bg-white flex gap-2 items-center">
            <input
              required
              type="text"
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              placeholder="Preguntale algo a Travis..."
              className="flex-1 rounded-2xl border border-slate-200 px-4 py-2.5 text-xs outline-none focus:border-slate-300 transition-all bg-slate-50/50"
              disabled={isTyping}
            />
            <button
              type="submit"
              disabled={!currentMessage.trim() || isTyping}
              className="h-9 w-9 rounded-xl text-white flex items-center justify-center hover:brightness-110 disabled:opacity-40 transition-all cursor-pointer shrink-0"
              style={{ backgroundColor: primaryColor }}
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}

      {/* 📁 Menu Options (WhatsApp, Messenger, Instagram, ChatWeb) */}
      {menuOpen && !isChatOpen && (
        <div 
          className="absolute bottom-16 right-0 mb-2 w-48 rounded-2xl bg-white border border-slate-100 shadow-2xl p-2 flex flex-col gap-1 z-40 text-slate-800"
          style={{ animation: "scaleIn 0.2s ease-out" }}
        >
          {/* Chat Web Button */}
          <button
            onClick={() => {
              setIsChatOpen(true);
              setMenuOpen(false);
            }}
            className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold hover:bg-slate-50 transition-colors text-left w-full cursor-pointer"
          >
            <MessageSquare className="h-4 w-4" style={{ color: primaryColor }} />
            Chat Web (IA)
          </button>

          {/* WhatsApp Button */}
          <a
            href={finalWhatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold hover:bg-slate-50 transition-colors"
          >
            <MessageCircle className="h-4 w-4 text-emerald-500" />
            WhatsApp
          </a>

          {/* Messenger Button */}
          <a
            href={messengerUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold hover:bg-slate-50 transition-colors"
          >
            <svg className="h-4 w-4 fill-[#0084FF]" viewBox="0 0 24 24">
              <path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.652V24l4.088-2.242c1.092.3 2.246.464 3.443.464C18.627 22.222 24 17.247 24 11.111 24 4.974 18.627 0 12 0zm1.191 14.963l-3.055-3.26-5.963 3.26L10.732 8l3.131 3.26L19.752 8l-6.561 6.963z"/>
            </svg>
            Messenger
          </a>

          {/* Instagram Button */}
          <a
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold hover:bg-slate-50 transition-colors"
          >
            <InstagramIcon className="h-4 w-4 text-pink-500" />
            Instagram
          </a>
        </div>
      )}

      {/* 🔘 Main Float Floating Button */}
      {!isChatOpen && (
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="h-14 w-14 rounded-full text-white flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer border border-white/20 relative"
          style={{ backgroundColor: primaryColor }}
        >
          <div className="h-11 w-11 rounded-full overflow-hidden flex items-center justify-center">
            <img src="/assets/travis_perfil.svg" alt="Hablar con Travis" className="h-full w-full object-cover scale-110" />
          </div>
          
          {/* Active Status Badge */}
          <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-emerald-400 border-2 border-white flex items-center justify-center">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-700 animate-pulse" />
          </span>
        </button>
      )}

      {/* CSS Styles injection to ensure animations work nicely */}
      <style jsx global>{`
        @keyframes scaleIn {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};
