'use client';

import React, { useState } from 'react';
import { User, Phone, Mail, Calendar, AlertCircle, CheckCircle2, X } from 'lucide-react';

interface PassengerRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const PassengerRegisterModal: React.FC<PassengerRegisterModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [dob, setDob] = useState('');
  const [ageError, setAgeError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  if (!isOpen) return null;

  // Age calculation helper (Must be 16+ years old)
  const validatePassengerAge = (birthDateString: string): boolean => {
    if (!birthDateString) return false;
    const birthDate = new Date(birthDateString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 16;
  };

  const handleDobChange = (dobValue: string) => {
    setDob(dobValue);
    if (dobValue && !validatePassengerAge(dobValue)) {
      setAgeError('Debes tener al menos 16 años para registrar una cuenta de usuario en TravelApp.');
    } else {
      setAgeError(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePassengerAge(dob)) {
      setAgeError('Debes tener al menos 16 años para registrarte.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccessMsg(true);
      setTimeout(() => {
        setSuccessMsg(false);
        onClose();
        if (onSuccess) onSuccess();
      }, 1500);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full text-slate-100 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6 space-y-1">
          <h3 className="text-xl font-black text-white">Registro de Cliente / Pasajero</h3>
          <p className="text-xs text-slate-400">Creá tu cuenta gratis para solicitar viajes y sumar puntos Rewards.</p>
        </div>

        {successMsg ? (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
            <h4 className="text-base font-bold text-white">¡Cuenta Creada con Éxito!</h4>
            <p className="text-xs text-slate-300">Ya podés empezar a viajar con TravelApp.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-300 mb-1">Nombre y Apellido</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="Ej. Juan Pérez"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-tech-blue"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">N° de Teléfono (WhatsApp)</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="tel"
                  required
                  placeholder="+54 9 381 1234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-tech-blue"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">Fecha de Nacimiento (No menores de 16 años)</label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="date"
                  required
                  value={dob}
                  onChange={(e) => handleDobChange(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-tech-blue"
                />
              </div>
              {ageError && (
                <p className="text-[11px] text-red-400 font-bold mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {ageError}
                </p>
              )}
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">Correo Electrónico</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  placeholder="juan@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-tech-blue"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !!ageError}
              className="w-full py-3.5 rounded-xl bg-tech-blue hover:brightness-110 text-white font-black text-xs shadow-md transition-all disabled:opacity-50 mt-2"
            >
              {loading ? 'Creando Cuenta...' : 'Registrarme'}
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
