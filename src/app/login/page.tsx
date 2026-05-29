"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Plane, Lock, Mail, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function LoginPage() {
  const { login, user, loading } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);

  // If already authenticated, redirect immediately
  useEffect(() => {
    if (!loading && user) {
      router.replace("/");
    }
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      await login(email.trim(), password);
      router.replace("/");
    } catch (err: unknown) {
      const code =
        err != null && typeof err === "object" && "code" in err
          ? (err as { code: unknown }).code
          : null;

      switch (code) {
        case "auth/invalid-credential":
        case "auth/user-not-found":
        case "auth/wrong-password":
          setError("Credenciales incorrectas. Verificá tu email y contraseña.");
          break;
        case "auth/too-many-requests":
          setError("Demasiados intentos fallidos. Intentá más tarde.");
          break;
        case "auth/network-request-failed":
          setError("Sin conexión a internet. Verificá tu red.");
          break;
        default:
          setError("Ocurrió un error al iniciar sesión. Intentá nuevamente.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError("Por favor, ingresá tu correo electrónico en la casilla para poder enviarte el enlace de recuperación.");
      setSuccess(null);
      return;
    }
    setError(null);
    setSuccess(null);
    setSendingReset(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setSuccess("¡Correo de recuperación enviado! Revisá tu bandeja de entrada y spam.");
    } catch (err: any) {
      console.error("Error resetting password:", err);
      setError("No pudimos enviar el correo de recuperación. Asegurate de que el correo esté registrado.");
    } finally {
      setSendingReset(false);
    }
  };

  // Show nothing while resolving auth state (avoid flash)
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#0a2a5b] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen overflow-hidden font-[var(--font-quicksand),_Arial,_sans-serif]">
      {/* ── Left panel – Tech Blue ── */}
      <div className="hidden w-1/2 flex-col items-center justify-between bg-[#0a2a5b] py-16 px-12 lg:flex">
        {/* Top dummy space to keep alignment */}
        <div className="h-4" />

        {/* Center content */}
        <div className="max-w-sm text-center">
          {/* White logo travelapp */}
          <div className="mb-8 flex justify-center">
            <img
              src="/assets/travelapp_blanco.svg"
              alt="TravelApp Ecosystem"
              className="h-16 w-auto drop-shadow-lg"
              onError={(e) => {
                // Fallback: show icon if asset is missing
                (e.target as HTMLImageElement).src = "/assets/travelapp_original.svg";
              }}
            />
          </div>

          <h1 className="mb-4 text-4xl font-black leading-tight tracking-tight text-white">
            Centro de Comando Global
          </h1>
          <p className="text-lg font-medium leading-relaxed text-blue-200">
            Gestión integral del ecosistema TravelApp. CRM, Logística,
            Experiencias y más, en un solo lugar.
          </p>

          {/* Decorative orbit rings */}
          <div className="relative mx-auto mt-12 h-40 w-40">
            <div className="absolute inset-0 rounded-full border border-blue-400/20 animate-[spin_20s_linear_infinite]" />
            <div className="absolute inset-4 rounded-full border border-blue-300/30 animate-[spin_15s_linear_infinite_reverse]" />
            <div className="absolute inset-8 rounded-full border border-blue-200/40 animate-[spin_10s_linear_infinite]" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Plane className="h-12 w-12 text-[#ff6b00] drop-shadow-glow" />
            </div>
          </div>
        </div>

        {/* Bottom ecosystem sublogos */}
        <div className="w-full max-w-sm text-center space-y-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-blue-300/60">
            Marcas Integradas del Ecosistema
          </p>
          <div className="flex items-center justify-center gap-6 border-t border-blue-400/10 pt-4">
            <img
              src="/assets/travelcab_blanco.svg"
              alt="TravelCab"
              className="h-6 w-auto opacity-70 hover:opacity-100 transition-opacity"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
            <img
              src="/assets/experience_blanco.svg"
              alt="Experiences"
              className="h-6 w-auto opacity-70 hover:opacity-100 transition-opacity"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
            <img
              src="/assets/rewards_blanco.svg"
              alt="Rewards"
              className="h-6 w-auto opacity-70 hover:opacity-100 transition-opacity"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          </div>
        </div>
      </div>

      {/* ── Right panel – Light ── */}
      <div className="flex w-full flex-col items-center justify-center bg-[#f8fafc] px-6 py-12 lg:w-1/2">
        {/* Mobile logo */}
        <div className="mb-8 flex justify-center lg:hidden">
          <img
            src="/assets/travelapp_original.svg"
            alt="TravelApp Ecosystem"
            className="h-12 w-auto"
          />
        </div>

        {/* Login card */}
        <div className="w-full max-w-md">
          <div className="rounded-3xl bg-white p-8 shadow-[0_8px_40px_rgba(10,42,91,0.12)] ring-1 ring-slate-100 sm:p-10">
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-black text-[#0a2a5b]">
                Iniciar Sesión
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Ingresá con tus credenciales corporativas
              </p>
            </div>

            {/* Alerts */}
            {error && (
              <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-6 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              {/* Email field */}
              <div>
                <label
                  htmlFor="login-email"
                  className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-slate-500"
                >
                  Correo Electrónico
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <Mail className="h-4 w-4" />
                  </span>
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ejemplo@empresa.com"
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-[#0a2a5b] focus:bg-white focus:ring-2 focus:ring-[#0a2a5b]/10"
                  />
                </div>
              </div>

              {/* Password field */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="login-password"
                    className="block text-xs font-bold uppercase tracking-widest text-slate-500"
                  >
                    Contraseña
                  </label>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={sendingReset}
                    className="text-xs font-bold text-[#ff6b00] hover:text-[#e05f00] hover:underline transition-colors disabled:opacity-50"
                  >
                    {sendingReset ? "Enviando..." : "¿Olvidaste tu contraseña?"}
                  </button>
                </div>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <Lock className="h-4 w-4" />
                  </span>
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-10 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-[#0a2a5b] focus:bg-white focus:ring-2 focus:ring-[#0a2a5b]/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
                    aria-label={
                      showPassword ? "Ocultar contraseña" : "Ver contraseña"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                id="login-submit-btn"
                type="submit"
                disabled={isSubmitting}
                className="relative mt-2 flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-[#ff6b00] py-3.5 text-sm font-black uppercase tracking-widest text-white shadow-lg shadow-orange-500/30 transition-all hover:bg-[#e05f00] hover:shadow-orange-500/50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Verificando...
                  </>
                ) : (
                  "Ingresar al Ecosistema"
                )}
              </button>
            </form>

            {/* Support section */}
            <div className="mt-6 text-center border-t border-slate-100 pt-4">
              <p className="text-xs text-slate-400">
                ¿Necesitás soporte? Contactanos en{" "}
                <a
                  href="mailto:soporte@travelapp.ar"
                  className="font-bold text-[#0a2a5b] hover:underline"
                >
                  soporte@travelapp.ar
                </a>
              </p>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-slate-400">
            © {new Date().getFullYear()} TravelApp s.a.s. · Todos los derechos reservados
          </p>
        </div>
      </div>
    </div>
  );
}
