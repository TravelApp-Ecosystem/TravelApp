'use client';

import React, { useState, useEffect } from 'react';
import {
  Radio, Compass, MapPin, MessageSquare, Plus, Trash2, ShieldAlert,
  Send, Users, Landmark, AlertCircle, RefreshCw, CheckCircle
} from 'lucide-react';
import { collection, onSnapshot, doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface GroupTrip {
  id: string;
  title: string;
  destination: string;
  departureDate: string;
  coordinatorName: string;
  totalSeats: number;
  availableSeats: number;
  passengers?: any[];
  roomingList?: { roomNumber: string; guests: string[] }[];
}

interface GroupMessage {
  id: string;
  sender: string;
  senderRole: string;
  text: string;
  timestamp: number;
}

export default function CoordinatorAppDashboardPage() {
  const [contractedTrips, setContractedTrips] = useState<GroupTrip[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<GroupTrip | null>(null);
  const [groupMessages, setGroupMessages] = useState<GroupMessage[]>([]);
  const [loading, setLoading] = useState(true);

  // Input states
  const [adminMsgText, setAdminMsgText] = useState('');
  const [newRoomNumber, setNewRoomNumber] = useState('');
  const [newRoomGuests, setNewRoomGuests] = useState('');

  // 1. Sync group trips in real-time
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'contracted_trips'), (snapshot) => {
      const list: GroupTrip[] = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        list.push({
          id: docSnap.id,
          title: data.title || 'Viaje Grupal',
          destination: data.destination || '',
          departureDate: data.departureDate || '',
          coordinatorName: data.coordinatorName || 'Coordinador Principal',
          totalSeats: Number(data.totalSeats || 40),
          availableSeats: Number(data.availableSeats || 40),
          passengers: data.passengers || [],
          roomingList: data.roomingList || []
        });
      });
      setContractedTrips(list);
      
      // Keep selected trip updated
      if (selectedTrip) {
        const updated = list.find(t => t.id === selectedTrip.id);
        if (updated) setSelectedTrip(updated);
      } else if (list.length > 0) {
        setSelectedTrip(list[0]);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error loading contracted trips:", error);
      setLoading(false);
    });
    return () => unsub();
  }, [selectedTrip]);

  // 2. Sync group messages when selected trip changes
  useEffect(() => {
    if (!selectedTrip) {
      setGroupMessages([]);
      return;
    }

    const unsub = onSnapshot(
      collection(db, 'contracted_trips', selectedTrip.id, 'group_messages'),
      (snapshot) => {
        const list: GroupMessage[] = [];
        snapshot.forEach(docSnap => {
          const data = docSnap.data();
          list.push({
            id: docSnap.id,
            sender: data.sender || 'Sistema',
            senderRole: data.senderRole || 'sistema',
            text: data.text || '',
            timestamp: Number(data.timestamp || Date.now())
          });
        });
        // Sort by timestamp asc
        list.sort((a, b) => a.timestamp - b.timestamp);
        setGroupMessages(list);
      }
    );
    return () => unsub();
  }, [selectedTrip]);

  const handleSendAdminMessage = async () => {
    const text = adminMsgText.trim();
    if (!text || !selectedTrip) return;
    try {
      const msgRef = doc(collection(db, 'contracted_trips', selectedTrip.id, 'group_messages'), `msg_admin_${Date.now()}`);
      await setDoc(msgRef, {
        sender: "Administración Central",
        senderRole: "sistema",
        text,
        timestamp: Date.now()
      });
      setAdminMsgText('');
    } catch (err) {
      console.error("Error sending admin message:", err);
    }
  };

  const handleAddRoom = async () => {
    if (!newRoomNumber.trim() || !newRoomGuests.trim() || !selectedTrip) return;
    
    const guestsArray = newRoomGuests.split(',').map(g => g.trim()).filter(Boolean);
    const newRoom = { roomNumber: newRoomNumber.trim(), guests: guestsArray };
    const updatedRoomingList = [...(selectedTrip.roomingList || []), newRoom];

    try {
      await updateDoc(doc(db, 'contracted_trips', selectedTrip.id), {
        roomingList: updatedRoomingList
      });
      setNewRoomNumber('');
      setNewRoomGuests('');
    } catch (err) {
      console.error("Error adding room:", err);
    }
  };

  const handleDeleteRoom = async (roomIndex: number) => {
    if (!selectedTrip || !selectedTrip.roomingList) return;
    const updatedRoomingList = selectedTrip.roomingList.filter((_, idx) => idx !== roomIndex);

    try {
      await updateDoc(doc(db, 'contracted_trips', selectedTrip.id), {
        roomingList: updatedRoomingList
      });
    } catch (err) {
      console.error("Error deleting room:", err);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-8 bg-slate-50 space-y-6">
      
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-tech-blue flex items-center gap-2">
            <Radio className="h-7 w-7 text-green-500 animate-pulse" />
            Gestión de App Coordinador
          </h1>
          <p className="mt-1.5 text-sm text-slate-500 font-medium">Monitoreo de geolocalización, chat de contingentes y asignación de habitaciones en tiempo real.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Columna Izquierda: Listado de Contingentes */}
        <div className="lg:col-span-1 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Contingentes Activos</h3>
          {loading ? (
            <div className="text-slate-400 text-xs font-medium py-6">Cargando contingentes...</div>
          ) : contractedTrips.length > 0 ? (
            <div className="space-y-3">
              {contractedTrips.map(trip => (
                <button
                  key={trip.id}
                  onClick={() => setSelectedTrip(trip)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    selectedTrip?.id === trip.id
                      ? 'border-green-500 bg-green-500/5 ring-1 ring-green-500/20'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100/70'
                  }`}
                >
                  <p className="font-bold text-tech-blue text-sm line-clamp-1">{trip.title}</p>
                  <p className="text-[10px] text-slate-400 font-medium mt-1">Guía: {trip.coordinatorName}</p>
                  <p className="text-[10px] text-slate-400 font-medium">{trip.destination} · {trip.departureDate}</p>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic py-6">No hay contingentes registrados en el catálogo.</p>
          )}
        </div>

        {/* Columna Derecha: Consola Operativa del Contingente Seleccionado */}
        <div className="lg:col-span-2 space-y-6">
          {selectedTrip ? (
            <>
              {/* Box 1: Telemetría y Estado de App Coordinador */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="font-black text-tech-blue text-base">{selectedTrip.title}</h2>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">Destino: {selectedTrip.destination}</p>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 font-bold text-emerald-700 text-[10px] uppercase animate-pulse">
                    <CheckCircle className="h-3 w-3" /> Telemetría GPS Conectada
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-slate-100 text-xs">
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Guía / Coordinador</p>
                    <p className="font-bold text-slate-700 mt-1">{selectedTrip.coordinatorName}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Conexión App</p>
                    <p className="font-bold text-emerald-600 mt-1">Activo hace 2 min</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Pasajeros a Bordo</p>
                    <p className="font-bold text-slate-700 mt-1">{selectedTrip.passengers?.length || 0} personas</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Geolocalización</p>
                    <p className="font-semibold text-[#FF7A00] mt-1 flex items-center gap-0.5"><MapPin className="h-3.5 w-3.5" /> En Ruta</p>
                  </div>
                </div>
              </div>

              {/* Box 2: Asignación de Habitaciones (Rooming List) */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Asignación de Habitaciones (Rooming List)</h3>
                
                {/* Formulario */}
                <div className="flex flex-col md:flex-row gap-3 items-end">
                  <div className="flex flex-col gap-1 w-full md:w-1/4">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Nro. Habitación</label>
                    <input
                      type="text"
                      placeholder="Ej: 101"
                      value={newRoomNumber}
                      onChange={e => setNewRoomNumber(e.target.value)}
                      className="text-xs border border-slate-200 rounded px-2.5 py-1.5 text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-tech-blue"
                    />
                  </div>
                  <div className="flex flex-col gap-1 flex-1 w-full">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Pasajeros (Separados por coma)</label>
                    <input
                      type="text"
                      placeholder="Ej: Laura Gómez, Martín Cardozo"
                      value={newRoomGuests}
                      onChange={e => setNewRoomGuests(e.target.value)}
                      className="text-xs border border-slate-200 rounded px-2.5 py-1.5 text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-tech-blue"
                    />
                  </div>
                  <button
                    onClick={handleAddRoom}
                    className="bg-tech-blue hover:bg-tech-blue/90 text-white font-bold py-1.5 px-4 rounded text-xs transition-all h-[34px] flex items-center gap-1.5 shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" /> Asignar Habitación
                  </button>
                </div>

                {/* Lista */}
                {selectedTrip.roomingList && selectedTrip.roomingList.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                    {selectedTrip.roomingList.map((room, idx) => (
                      <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex justify-between items-center text-xs shadow-sm">
                        <div>
                          <p className="font-bold text-slate-800">Habitación {room.roomNumber}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{room.guests?.join(' & ') || 'Sin Huéspedes'}</p>
                        </div>
                        <button
                          onClick={() => handleDeleteRoom(idx)}
                          className="text-red-500 hover:text-red-600 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic py-2">No hay habitaciones asignadas en este hotel para el contingente.</p>
                )}
              </div>

              {/* Box 3: Chat Grupal & Envío de Alertas Críticas */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col min-h-[350px]">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Monitoreo del Chat del Viaje</h3>
                
                <div className="flex-1 border border-slate-250 rounded-xl flex flex-col bg-slate-50 overflow-hidden">
                  {/* Historial */}
                  <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3 text-xs max-h-[220px]">
                    {groupMessages.length > 0 ? (
                      groupMessages.map(msg => {
                        const isSystem = msg.senderRole === 'sistema';
                        const isCoord = msg.senderRole === 'coordinador';
                        return (
                          <div
                            key={msg.id}
                            className={`max-w-[80%] p-2.5 rounded-xl flex flex-col gap-0.5 ${
                              isSystem
                                ? 'bg-amber-50 border border-amber-100 text-amber-800 self-center text-center max-w-[90%]'
                                : isCoord
                                ? 'bg-tech-blue/10 border border-tech-blue/20 text-tech-blue self-start'
                                : 'bg-white border border-slate-200 text-slate-700 self-end'
                            }`}
                          >
                            <span className="text-[9px] font-bold opacity-60">
                              {msg.sender} ({msg.senderRole})
                            </span>
                            <p className="text-xs font-semibold">{msg.text}</p>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center text-slate-400 py-10">No hay mensajes registrados en este chat.</div>
                    )}
                  </div>

                  {/* Input Box */}
                  <div className="p-3 bg-white border-t border-slate-200 flex gap-2">
                    <input
                      type="text"
                      value={adminMsgText}
                      onChange={e => setAdminMsgText(e.target.value)}
                      placeholder="Escribí un aviso importante del sistema para enviar a todo el grupo..."
                      className="flex-1 bg-slate-100 rounded-xl px-4 py-2 text-xs border border-slate-200 focus:outline-none focus:border-tech-blue"
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleSendAdminMessage();
                      }}
                    />
                    <button
                      onClick={handleSendAdminMessage}
                      className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow transition-colors"
                    >
                      Enviar Aviso
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-400">
              Selecciona un contingente de la lista lateral para monitorear la aplicación del coordinador.
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
