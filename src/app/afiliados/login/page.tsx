'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock, Mail, AlertCircle, Sparkles, ArrowRight, ShieldAlert, CheckCircle2, Clock, Fingerprint } from 'lucide-react';
import { isBiometricsAvailable, verifyBiometric, registerBiometric, getSavedBiometricEmail } from '@/lib/biometrics';

export default function AfiliadosLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accountStatus, setAccountStatus] = useState<'idle' | 'pending' | 'suspended' | 'active'>('idle');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [biometricsAvailable, setBiometricsAvailable] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedEmail = getSavedBiometricEmail() || localStorage.getItem('travelapp_last_email');
      if (savedEmail) setEmail(savedEmail);
      isBiometricsAvailable().then(setBiometricsAvailable);
    }
  }, []);

  const handleBiometricLogin = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      const res = await verifyBiometric();
      if (res.success && res.email) {
        document.cookie = "ta_session=1; path=/; max-age=31536000; SameSite=Lax";
        setAccountStatus('active');
        setTimeout(() => router.push('/afiliados/portal'), 300);
      } else {
        if (email.trim()) {
          await registerBiometric(email.trim());
        }
        setError('No se pudo validar la biometría. Por favor ingresá tu contraseña.');
      }
    } catch {
      setError('Error al procesar biometría.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setAccountStatus('idle');
    setIsSubmitting(true);

    const trimmedEmail = email.trim().toLowerCase();
    if (typeof window !== 'undefined') {
      localStorage.setItem('travelapp_last_email', trimmedEmail);
      if (window.PublicKeyCredential) registerBiometric(trimmedEmail).catch(() => {});
    }

    setTimeout(() => {
      setIsSubmitting(false);

      // Simulación de estados para prueba
      if (trimmedEmail.includes('pendiente') || trimmedEmail.includes('nuevo')) {
        setAccountStatus('pending');
        return;
      }

      if (trimmedEmail.includes('suspendido') || trimmedEmail.includes('bloqueado')) {
        setAccountStatus('suspended');
        return;
      }

      // Si es un embajador habilitado / activo
      document.cookie = "ta_session=1; path=/; max-age=31536000; SameSite=Lax";
      setAccountStatus('active');
      router.push('/afiliados/portal');
    }, 800);
  };

  return (
    <div className="relative flex min-h-screen overflow-hidden font-sans bg-slate-50">
      
      {/* ── COLUMNA IZQUIERDA: IMAGEN DEL SPLASH FOTOGRÁFICO CON OVERLAY AZUL TECH (IDENTICO A ADMIN LOGIN) ── */}
      <div className="hidden w-1/2 flex-col items-center justify-between py-16 px-12 lg:flex relative overflow-hidden">
        {/* Imagen de Fondo del Splash */}
        <img
          src="/assets/splash_bg.png"
          alt="TravelApp Experience Creators"
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Overlay Azul Tech Semitransparente */}
        <div className="absolute inset-0 bg-[#0A2A5B]/85 backdrop-blur-xs" />

        {/* Top Spacer */}
        <div className="relative z-10 h-4" />

        {/* Branding Central */}
        <div className="relative z-10 max-w-md text-center space-y-6">
          <div className="flex justify-center">
            <img
              src="/assets/experience_blanco.svg"
              alt="TravelApp Experience Partners"
              className="h-14 w-auto drop-shadow-lg"
            />
          </div>

          <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest px-3.5 py-1 rounded-full bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/40">
            <Sparkles className="w-4 h-4 text-amber-300" /> Portal Exclusivo de Embajadores
          </span>

          <h1 className="text-3xl font-black leading-tight text-white">
            Monetizá tu audiencia recomendando experiencias inolvidables
          </h1>
          
          <p className="text-sm font-medium leading-relaxed text-blue-100">
            Accedé a tu panel personalizado de comisiones en cuotas, marketplace de viajes, cupones de descuento y biblioteca de contenidos promocionales.
          </p>
        </div>

        {/* Marcas Integradas abajo */}
        <div className="relative z-10 w-full max-w-sm text-center space-y-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-blue-200/70">
            Ecosistema de Servicios TravelApp
          </p>
          <div className="flex items-center justify-center gap-6 border-t border-white/10 pt-4">
            <img
              src="/assets/travelapp_blanco.svg"
              alt="TravelApp"
              className="h-5 w-auto opacity-70 hover:opacity-100 transition-opacity"
            />
            <img
              src="/assets/travelcab_blanco.svg"
              alt="TravelCab"
              className="h-5 w-auto opacity-70 hover:opacity-100 transition-opacity"
            />
            <img
              src="/assets/rewards_blanco.svg"
              alt="Rewards"
              className="h-5 w-auto opacity-70 hover:opacity-100 transition-opacity"
            />
          </div>
        </div>
      </div>

      {/* ── COLUMNA DERECHA: FORMULARIO DE LOGIN ── */}
      <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 lg:px-20 xl:px-28 bg-white">
        <div className="mx-auto w-full max-w-md space-y-8">
          
          {/* Mobile Header Logo */}
          <div className="text-center lg:text-left space-y-2">
            <Link href="/afiliados" className="inline-block">
              <img
                src="/assets/experience_original.svg"
                alt="TravelApp Experience"
                className="h-10 w-auto"
              />
            </Link>
            <h2 className="text-2xl font-black tracking-tight text-[#0A2A5B]">
              Iniciar Sesión de Embajador
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Ingresá tu correo y contraseña para acceder a tu panel de creador.
            </p>
          </div>

          {/* ALERTA DE ESTADO: SI ESTÁ PENDIENTE */}
          {accountStatus === 'pending' && (
            <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900 space-y-2 shadow-sm animate-fadeIn">
              <div className="flex items-center gap-2 font-black text-amber-800 text-sm">
                <Clock className="w-5 h-5 text-amber-600 shrink-0" />
                Postulación en Proceso de Revisión
              </div>
              <p className="leading-relaxed">
                "¡Buenísimo! Ya recibimos tus datos y tu cuenta de cobro quedó registrada. Nuestro equipo va a revisar tu perfil para cuidar la calidad de la comunidad. Te avisamos por acá o por WhatsApp en menos de 48 hs. Tu acceso al portal y app móvil se habilitará una vez aprobada tu cuenta."
              </p>
            </div>
          )}

          {/* ALERTA DE ESTADO: SI ESTÁ SUSPENDIDA */}
          {accountStatus === 'suspended' && (
            <div className="rounded-2xl border border-red-300 bg-red-50 p-4 text-xs text-red-900 space-y-2 shadow-sm animate-fadeIn">
              <div className="flex items-center gap-2 font-black text-red-800 text-sm">
                <ShieldAlert className="w-5 h-5 text-red-600 shrink-0" />
                Cuenta de Embajador Suspendida
              </div>
              <p className="leading-relaxed">
                Tu cuenta de embajador se encuentra pausada temporalmente por administración. Por favor contactate con el equipo de soporte de TravelApp.
              </p>
            </div>
          )}

          {/* Error general */}
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs font-bold text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-5 text-xs font-sans">
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                Correo Electrónico Registrado
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#EF4444] font-medium"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block font-bold text-slate-700">
                  Contraseña
                </label>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#EF4444]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-xl bg-[#0A2A5B] hover:bg-[#0A2A5B]/90 text-white font-black text-xs shadow-lg shadow-[#0A2A5B]/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Verificando Habilitación...' : 'Ingresar a mi Portal de Creador'}
              <ArrowRight className="w-4 h-4 text-[#EF4444]" />
            </button>

            {biometricsAvailable && (
              <button
                type="button"
                onClick={handleBiometricLogin}
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 py-3 text-xs font-black uppercase text-slate-700 transition-all cursor-pointer shadow-sm"
              >
                <Fingerprint className="w-4 h-4 text-[#EF4444]" />
                Ingresar con Huella / Face ID
              </button>
            )}
          </form>

          {/* Footer del login */}
          <div className="pt-4 border-t border-slate-100 text-center space-y-2">
            <p className="text-xs text-slate-500">
              ¿Aún no tenés tu cuenta de embajador?{' '}
              <Link href="/afiliados/register" className="font-bold text-[#EF4444] hover:underline">
                Postulate gratis aquí
              </Link>
            </p>
            <p className="text-[11px] text-slate-400">
              © 2026 TravelApp Ecosistema. Todos los derechos reservados.
            </p>
          </div>

        </div>
      </div>

    </div>
  );
}
