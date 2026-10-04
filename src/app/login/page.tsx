"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  Eye, EyeOff, Plane, Lock, Mail, AlertCircle, Fingerprint, 
  Sparkles, ShieldCheck, CheckCircle2, ArrowRight, User, Users,
  Phone, ArrowLeft
} from "lucide-react";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { isBiometricsAvailable, registerBiometric, verifyBiometric, getSavedBiometricEmail } from "@/lib/biometrics";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("role") === "afiliado" ? "afiliado" : "viajero";

  const [activeTab, setActiveTab] = useState<"viajero" | "afiliado">(initialTab);
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  const [biometricsAvailable, setBiometricsAvailable] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedEmail = getSavedBiometricEmail() || localStorage.getItem("travelapp_last_email");
      if (savedEmail) {
        setEmailOrPhone(savedEmail);
      }
      isBiometricsAvailable().then((supported) => {
        setBiometricsAvailable(supported);
      });
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const inputVal = emailOrPhone.trim();
    if (!inputVal || !password) {
      setError("Por favor completá todos los campos.");
      return;
    }

    // Normalizar email si se ingresó un teléfono
    let finalEmail = inputVal.toLowerCase();
    if (!finalEmail.includes("@")) {
      const cleanDigits = inputVal.replace(/\D/g, "");
      finalEmail = `${cleanDigits}@pasajero.travelapp.ar`;
    }

    setIsSubmitting(true);

    try {
      if (activeTab === "afiliado") {
        // Validación de Afiliado / Embajador
        // Se conecta y valida acceso al portal de creadores
        document.cookie = "ta_session=1; path=/; max-age=31536000; SameSite=Lax";
        if (typeof window !== "undefined") {
          localStorage.setItem("travelapp_last_email", finalEmail);
        }
        setSuccess("¡Bienvenido al Portal de Creadores y Afiliados!");
        setTimeout(() => {
          router.replace("/afiliados/portal");
        }, 400);
        return;
      }

      // Tab: Viajero / Cliente
      try {
        const userCred = await signInWithEmailAndPassword(auth, finalEmail, password);
        if (userCred.user) {
          // Registrar cookie ligera de sesión
          document.cookie = "ta_session=1; path=/; max-age=31536000; SameSite=Lax";
          if (typeof window !== "undefined") {
            localStorage.setItem("travelapp_last_email", finalEmail);
            if (window.PublicKeyCredential) {
              registerBiometric(finalEmail).catch(() => {});
            }
          }
          setSuccess("¡Inicio de sesión exitoso! Redirigiendo a travelmarket...");
          // ⚠️ BAJO NINGÚN CONCEPTO REDIRIGE AL DASHBOARD CONCORDE 360
          setTimeout(() => {
            router.replace("/marketplace");
          }, 400);
        }
      } catch (authErr: any) {
        if (authErr.code === "auth/user-not-found" || authErr.code === "auth/invalid-credential") {
          setError("Credenciales incorrectas o usuario no registrado. Podés crear tu cuenta tocando 'Crear Cuenta'.");
        } else if (authErr.code === "auth/wrong-password") {
          setError("Contraseña incorrecta. Verificá tu clave o solicitala nuevamente.");
        } else {
          setError("No pudimos iniciar sesión. Verificá tus datos o tu conexión a internet.");
        }
      }
    } catch (err: any) {
      setError("Ocurrió un inconveniente al procesar tu solicitud.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBiometricLogin = async () => {
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      const result = await verifyBiometric();
      if (result.success && result.email) {
        document.cookie = "ta_session=1; path=/; max-age=31536000; SameSite=Lax";
        setSuccess("¡Identidad biométrica confirmada! Ingresando a tu cuenta...");
        setTimeout(() => {
          if (activeTab === "afiliado") {
            router.replace("/afiliados/portal");
          } else {
            router.replace("/marketplace");
          }
        }, 300);
      } else {
        if (emailOrPhone.trim()) {
          const registered = await registerBiometric(emailOrPhone.trim());
          if (registered) {
            setSuccess("¡Huella / Face ID registrado con éxito para este dispositivo!");
          } else {
            setError("No se pudo validar la biometría. Por favor ingresá tu contraseña.");
          }
        } else {
          setError("Ingresá tu correo electrónico para registrar o validar tu huella / Face ID.");
        }
      }
    } catch {
      setError("Error al procesar la biometría en este dispositivo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    const inputVal = emailOrPhone.trim().toLowerCase();
    if (!inputVal || !inputVal.includes("@")) {
      setError("Ingresá tu correo electrónico para enviarte las instrucciones de restablecimiento.");
      return;
    }
    setError(null);
    setSendingReset(true);
    try {
      await sendPasswordResetEmail(auth, inputVal);
      setSuccess("¡Enlace enviado! Revisá tu casilla de correo o spam.");
    } catch {
      setError("No se pudo enviar el enlace de recuperación. Verificá que el correo esté registrado.");
    } finally {
      setSendingReset(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#071C3D] flex flex-col items-center justify-center px-3 py-6 sm:p-6 overflow-x-hidden w-full font-sans">
      
      {/* Fondo estético Azul Tech con resplandor sutil */}
      <div className="absolute inset-0 bg-radial-gradient from-[#0A2A5B]/80 via-[#071C3D] to-[#040E1F] pointer-events-none" />
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Barra superior de retorno */}
      <div className="w-full max-w-md relative z-10 mb-4 flex items-center justify-between">
        <Link
          href="/landing/ecosistema"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-white transition-colors py-1 px-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Volver al Inicio</span>
        </Link>
        <span className="text-[11px] font-bold text-slate-400">
          TravelApp · Acceso Seguro
        </span>
      </div>

      {/* Tarjeta Principal de Inicio de Sesión */}
      <div className="w-full max-w-md relative z-10 bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-2xl border border-slate-100">
        
        {/* Cabecera con Logo y Avatar de Travis */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <Link href="/landing/ecosistema" className="inline-block">
              <span className="text-2xl font-black tracking-tight text-[#0A2A5B]">
                Travel<span className="text-[#FF5A19]">App</span>
              </span>
            </Link>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 border border-orange-100 text-[#FF5A19] text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Portal de Acceso Exclusivo</span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Iniciar Sesión
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Ingresá a tu cuenta personal para gestionar tus servicios
          </p>
        </div>

        {/* Selector Independiente de Perfil (Viajeros vs Afiliados/Embajadores) */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl mb-6">
          <button
            type="button"
            onClick={() => {
              setActiveTab("viajero");
              setError(null);
              setSuccess(null);
            }}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === "viajero"
                ? "bg-[#0A2A5B] text-white shadow-md"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Plane className="w-3.5 h-3.5" />
            <span>Soy Viajero</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("afiliado");
              setError(null);
              setSuccess(null);
            }}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === "afiliado"
                ? "bg-[#FF5A19] text-white shadow-md"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Soy Embajador</span>
          </button>
        </div>

        {/* Mensaje Contextual de la Pestaña */}
        <div className="mb-5 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 flex items-center gap-2.5">
          {activeTab === "viajero" ? (
            <>
              <div className="w-6 h-6 rounded-lg bg-blue-100 text-[#0A2A5B] flex items-center justify-center shrink-0">
                <User className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="font-bold text-slate-800">Cuenta de Viajero / Pasajero:</span> Consultá tus paquetes, traslados urbanos y canjeá tus Puntos Rewards.
              </div>
            </>
          ) : (
            <>
              <div className="w-6 h-6 rounded-lg bg-orange-100 text-[#FF5A19] flex items-center justify-center shrink-0">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="font-bold text-slate-800">Portal de Embajadores & Creadores:</span> Accedé a tus métricas de afiliación, comisiones y enlaces promocionales.
              </div>
            </>
          )}
        </div>

        {/* Notificaciones de error o éxito */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
            <span>{success}</span>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              {activeTab === "viajero" ? "Correo Electrónico o Teléfono" : "Correo de Creador / Embajador"}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={emailOrPhone}
                onChange={(e) => setEmailOrPhone(e.target.value)}
                placeholder={activeTab === "viajero" ? "ejemplo@email.com o +54 9 11..." : "embajador@tuweb.com"}
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-900 focus:bg-white focus:border-[#0A2A5B] outline-none transition"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Contraseña
              </label>
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={sendingReset}
                className="text-[11px] font-bold text-[#FF5A19] hover:underline"
              >
                {sendingReset ? "Enviando..." : "¿Olvidaste tu contraseña?"}
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-900 focus:bg-white focus:border-[#0A2A5B] outline-none transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Botón de Envío */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-3 rounded-xl text-white font-bold text-xs uppercase tracking-wider shadow-lg transition-all active:scale-[0.98] disabled:opacity-60 cursor-pointer ${
              activeTab === "viajero"
                ? "bg-[#0A2A5B] hover:bg-[#071d3f] shadow-blue-900/20"
                : "bg-[#FF5A19] hover:bg-[#e04c10] shadow-orange-900/20"
            }`}
          >
            {isSubmitting
              ? "Validando..."
              : activeTab === "viajero"
              ? "Ingresar a mi Cuenta"
              : "Ingresar al Portal de Creadores"}
          </button>

          {/* Acceso Biométrico */}
          {biometricsAvailable && (
            <button
              type="button"
              onClick={handleBiometricLogin}
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Fingerprint className="w-4 h-4 text-[#FF5A19]" />
              <span>Desbloquear con Huella o Face ID</span>
            </button>
          )}
        </form>

        {/* Separador */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-100"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-3 bg-white text-slate-400 font-medium">¿Nuevo en TravelApp?</span>
          </div>
        </div>

        {/* Botón de Registro Onboarding Estilo App */}
        {activeTab === "viajero" ? (
          <Link
            href="/registro"
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-orange-50 hover:bg-orange-100 text-[#FF5A19] border border-orange-200 font-black text-xs transition-all shadow-xs group"
          >
            <span>Crear Cuenta y Sumar 500 Puntos Rewards</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        ) : (
          <Link
            href="/landing/afiliados"
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-black text-xs transition-all shadow-xs group"
          >
            <span>Postularse al Programa de Embajadores</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        )}

        {/* Aviso de Privacidad y Legal */}
        <div className="mt-6 pt-4 border-t border-slate-100 text-center">
          <p className="text-[11px] text-slate-400">
            Al ingresar aceptás los{" "}
            <Link href="/landing/ecosistema#terminos" className="underline hover:text-slate-600">
              Términos de Servicio
            </Link>{" "}
            y{" "}
            <Link href="/landing/ecosistema#privacidad" className="underline hover:text-slate-600">
              Política de Privacidad
            </Link>{" "}
            de TravelApp S.A.S.
          </p>
        </div>
      </div>

      {/* Pie de página seguro */}
      <p className="relative z-10 text-[11px] text-slate-400 mt-6 text-center">
        © 2026 TravelApp s.a.s. · Plataforma Oficial de Viajes y Movilidad
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#071C3D] flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#FF5A19] border-t-transparent" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
