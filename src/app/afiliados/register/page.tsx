'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sparkles, ArrowRight, Check, Award, Shield, User, Mail, Phone,
  CreditCard, MapPin, Plus, Trash2, Calendar, FileText, CheckCircle2, AlertCircle, X
} from 'lucide-react';
import { ARGENTINA_PROVINCES } from '@/types/partners';

export default function AfiliadosRegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [ageError, setAgeError] = useState<string | null>(null);

  // Dynamic publication links (up to 5)
  const [publicationLinks, setPublicationLinks] = useState<string[]>(['']);

  const [formData, setFormData] = useState({
    fullName: '',
    dniCuit: '',
    dob: '',
    email: '',
    phone: '',
    province: 'Tucumán',
    city: 'San Miguel de Tucumán',
    category: 'Aventura & Turismo',
    socialChannels: '',
    motivationText: '',
    payoutMethod: 'mp_instant' as 'mp_instant' | 'cbu_weekly',
    cbuCvu: '',
    alias: '',
    accountHolder: '',
  });

  const handleAddPublicationLink = () => {
    if (publicationLinks.length < 5) {
      setPublicationLinks([...publicationLinks, '']);
    }
  };

  const handleRemovePublicationLink = (index: number) => {
    setPublicationLinks(publicationLinks.filter((_, i) => i !== index));
  };

  const handlePublicationLinkChange = (index: number, value: string) => {
    const updated = [...publicationLinks];
    updated[index] = value;
    setPublicationLinks(updated);
  };

  // Age calculation helper (Must be 18+ years old)
  const validateAge = (birthDateString: string): boolean => {
    if (!birthDateString) return false;
    const birthDate = new Date(birthDateString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 18;
  };

  const handleDobChange = (dobValue: string) => {
    setFormData({ ...formData, dob: dobValue });
    if (dobValue && !validateAge(dobValue)) {
      setAgeError('Debes tener al menos 18 años para operar en el programa de afiliados (manejo legal de comisiones).');
    } else {
      setAgeError(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check 18+ age validation
    if (!validateAge(formData.dob)) {
      setAgeError('Debes tener al menos 18 años para operar en el programa de afiliados.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setShowConfirmationModal(true);
    }, 800);
  };

  const handleCloseModalAndProceed = () => {
    setShowConfirmationModal(false);
    router.push('/experiences/creator-portal');
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-3xl bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-6 relative overflow-hidden my-8">
        
        {/* Brand Header Con Logo Real de TravelApp Experience sobre fondo claro */}
        <div className="text-center space-y-3">
          <Link href="/afiliados" className="inline-flex items-center gap-3 group">
            <img
              src="/assets/experience_original.svg"
              alt="TravelApp Experience"
              className="h-10 w-auto group-hover:scale-105 transition-transform"
            />
            <span className="text-[10px] uppercase font-black tracking-widest px-2.5 py-0.5 rounded-full bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/30">
              Partners
            </span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-[#0A2A5B]">Postulación & Registro de Embajadores</h1>
          <p className="text-xs text-slate-500 font-medium">Completá tus datos personales, canales de difusión y cuenta de cobro para solicitar tu código exclusivo.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 text-xs font-sans">
          
          {/* SECCIÓN 1: DATOS PERSONALES & FISCALES */}
          <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200 space-y-4">
            <h3 className="text-xs font-black text-[#0A2A5B] uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4 text-[#EF4444]" /> 1. Datos Personales & Identificación
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. María Florencia Rossi"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#EF4444] font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">DNI / CUIT</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. 34567890 o 20-34567890-9"
                  value={formData.dniCuit}
                  onChange={(e) => setFormData({ ...formData, dniCuit: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#EF4444] font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Fecha de Nacimiento (+18 años)</label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="date"
                    required
                    value={formData.dob}
                    onChange={(e) => handleDobChange(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#EF4444]"
                  />
                </div>
                {ageError && (
                  <p className="text-[11px] text-red-600 font-bold mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {ageError}
                  </p>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">WhatsApp de Contacto</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    required
                    placeholder="+54 9 381 1234567"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#EF4444]"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Correo Electrónico</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="tu@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#EF4444]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: UBICACIÓN & PERFIL DE CONTENIDO */}
          <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200 space-y-4">
            <h3 className="text-xs font-black text-[#0A2A5B] uppercase tracking-wider flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#EF4444]" /> 2. Ubicación & Categoría Principal
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Provincia</label>
                <select
                  value={formData.province}
                  onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#EF4444] font-semibold"
                >
                  {ARGENTINA_PROVINCES.map((prov) => (
                    <option key={prov} value={prov}>{prov}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Localidad / Ciudad</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. San Miguel de Tucumán"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#EF4444]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Categoría Principal</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#EF4444] font-semibold"
                >
                  <option value="Aventura & Turismo">Aventura & Turismo</option>
                  <option value="Lujo & Bodegas">Lujo & Bodegas</option>
                  <option value="Gastronomía & Salidas">Gastronomía & Salidas</option>
                  <option value="LifeStyle & Vlogs">LifeStyle & Vlogs</option>
                  <option value="Cultura & Patrimonio">Cultura & Patrimonio</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECCIÓN 3: CANALES DE DIFUSIÓN & PUBLICACIONES (HASTA 5) */}
          <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200 space-y-4">
            <h3 className="text-xs font-black text-[#0A2A5B] uppercase tracking-wider flex items-center gap-2">
              <Award className="w-4 h-4 text-[#EF4444]" /> 3. Redes Sociales & Portafolio (Hasta 5 enlaces)
            </h3>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Link directo a cuenta/s de promoción (Instagram / TikTok / YouTube / Blog / FB)</label>
              <input
                type="text"
                required
                placeholder="https://instagram.com/tu_usuario, https://tiktok.com/@tu_usuario"
                value={formData.socialChannels}
                onChange={(e) => setFormData({ ...formData, socialChannels: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#EF4444]"
              />
            </div>

            {/* Links de mejores publicaciones (Carga dinámica hasta 5) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block font-bold text-slate-700">Link/s de tus mejores publicaciones (Máximo 5)</label>
                <span className="text-[11px] font-bold text-[#EF4444]">{publicationLinks.length} / 5</span>
              </div>

              {publicationLinks.map((link, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="url"
                    placeholder={`Link de publicación ${idx + 1} (ej. Reel, Video o Post de viajes)`}
                    value={link}
                    onChange={(e) => handlePublicationLinkChange(idx, e.target.value)}
                    className="flex-1 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#EF4444] text-xs"
                  />
                  {publicationLinks.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemovePublicationLink(idx)}
                      className="p-2 rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}

              {publicationLinks.length < 5 && (
                <button
                  type="button"
                  onClick={handleAddPublicationLink}
                  className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-[#EF4444] hover:text-red-700 bg-red-50 px-3 py-1.5 rounded-lg border border-red-200"
                >
                  <Plus className="w-3.5 h-3.5" /> Agregar otro link de publicación
                </button>
              )}
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">¿Por qué te gustaría ser la voz de TravelApp Experience?</label>
              <textarea
                rows={3}
                required
                placeholder="Contanos brevemente sobre tu contenido, tu audiencia y por qué querés recomendar nuestros viajes..."
                value={formData.motivationText}
                onChange={(e) => setFormData({ ...formData, motivationText: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#EF4444]"
              />
            </div>
          </div>

          {/* SECCIÓN 4: DATOS DE COBRO (MERCADO PAGO O CBU/CVU) */}
          <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200 space-y-4">
            <h3 className="text-xs font-black text-[#0A2A5B] uppercase tracking-wider flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-[#EF4444]" /> 4. Configuración Inicial de Cuenta de Cobro
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, payoutMethod: 'mp_instant' })}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  formData.payoutMethod === 'mp_instant'
                    ? 'border-sky-500 bg-sky-50 text-[#0A2A5B] ring-1 ring-sky-400'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <p className="font-bold text-xs flex items-center justify-between">
                  ⚡ Split Mercado Pago
                  {formData.payoutMethod === 'mp_instant' && <Check className="w-4 h-4 text-sky-600" />}
                </p>
                <p className="text-[10px] text-slate-500 mt-1">Cobro automático al venderse la reserva (OAuth MP).</p>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, payoutMethod: 'cbu_weekly' })}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  formData.payoutMethod === 'cbu_weekly'
                    ? 'border-amber-500 bg-amber-50 text-[#0A2A5B] ring-1 ring-amber-400'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <p className="font-bold text-xs flex items-center justify-between">
                  🗓️ CBU / CVU Semanal
                  {formData.payoutMethod === 'cbu_weekly' && <Check className="w-4 h-4 text-amber-600" />}
                </p>
                <p className="text-[10px] text-slate-500 mt-1">Transferencia bancaria todos los Lunes.</p>
              </button>
            </div>

            {formData.payoutMethod === 'cbu_weekly' && (
              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">CBU o CVU (22 dígitos)</label>
                  <input
                    type="text"
                    placeholder="0000003100084592019482"
                    value={formData.cbuCvu}
                    onChange={(e) => setFormData({ ...formData, cbuCvu: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Alias CBU</label>
                    <input
                      type="text"
                      placeholder="FLOR.TRAVEL.MP"
                      value={formData.alias}
                      onChange={(e) => setFormData({ ...formData, alias: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Titular de la Cuenta</label>
                    <input
                      type="text"
                      placeholder="María Florencia Rossi"
                      value={formData.accountHolder}
                      onChange={(e) => setFormData({ ...formData, accountHolder: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* BOTÓN POSTULARSE CON ROJO CORAL CORPORATIVO */}
          <button
            type="submit"
            disabled={loading || !!ageError}
            className="w-full py-4 rounded-2xl bg-[#EF4444] hover:bg-[#DC2626] text-white font-black text-sm shadow-xl shadow-[#EF4444]/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {loading ? 'Enviando Postulación...' : 'Postularme como Embajador / Creator'}
            <ArrowRight className="w-4 h-4 text-amber-300" />
          </button>

        </form>

        {/* MODAL DE CONFIRMACIÓN CON LEYENDA OFICIAL */}
        {showConfirmationModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-md p-4 animate-fadeIn font-sans">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-lg w-full text-center space-y-5 shadow-2xl relative">
              
              <button
                onClick={handleCloseModalAndProceed}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-16 h-16 rounded-full bg-[#EF4444] p-0.5 mx-auto shadow-lg flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-white" />
              </div>

              <h3 className="text-xl font-black text-[#0A2A5B]">¡Postulación Recibida con Éxito!</h3>

              {/* LEYENDA OFICIAL SOLICITADA POR EL USUARIO */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-700 leading-relaxed font-medium shadow-inner">
                "¡Buenísimo! Ya recibimos tus datos y tu cuenta de cobro quedó registrada. Nuestro equipo va a revisar tu perfil para cuidar la calidad de la comunidad. Te avisamos por acá o por WhatsApp en menos de 48 hs. ¡Ojalá te sumes pronto a la familia TravelApp!"
              </div>

              <button
                onClick={handleCloseModalAndProceed}
                className="w-full py-3.5 rounded-xl bg-[#EF4444] hover:bg-[#DC2626] text-white font-black text-xs shadow-md transition-all"
              >
                Entrar a mi Portal de Creador
              </button>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
