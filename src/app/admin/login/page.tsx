"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Plane, Lock, Mail, AlertCircle, Fingerprint } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { isBiometricsAvailable, registerBiometric, verifyBiometric, getSavedBiometricEmail } from "@/lib/biometrics";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function AdminLoginPage() {
  const { login, user, loading } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
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
        setEmail(savedEmail);
      }
      isBiometricsAvailable().then((supported) => {
        setBiometricsAvailable(supported);
      });
    }
  }, []);

  useEffect(() => {
    if (!loading && user) {
      router.replace("/");
    }
  }, [user, loading, router]);

  const isCorporateEmail = (emailStr: string): boolean => {
    const normalized = emailStr.trim().toLowerCase();
    if (normalized === "ferincola@gmail.com") return true;
    return normalized.endsWith("@travelapp.ar") || normalized.endsWith("@travelcab.ar");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const trimmedEmail = email.trim().toLowerCase();

    if (!isCorporateEmail(trimmedEmail)) {
      setError(
        "Acceso Denegado. El Centro de Comando Global Concorde 360 es exclusivo para correos corporativos oficiales (@travelapp.ar o @travelcab.ar)."
      );
      return;
    }

    setIsSubmitting(true);

    try {
      await login(trimmedEmail, password);
      if (typeof window !== "undefined") {
        localStorage.setItem("travelapp_last_email", trimmedEmail);
        if (window.PublicKeyCredential) {
          registerBiometric(trimmedEmail).catch(() => {});
        }
      }
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

  const handleBiometricLogin = async () => {
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      const result = await verifyBiometric();
      if (result.success && result.email) {
        document.cookie = "ta_session=1; path=/; max-age=31536000; SameSite=Lax";
        setSuccess("¡Identidad biométrica confirmada! Ingresando...");
        setTimeout(() => {
          router.replace("/");
        }, 300);
      } else {
        if (email.trim()) {
          const registered = await registerBiometric(email.trim());
          if (registered) {
            setSuccess("¡Huella / Face ID registrado con éxito para este dispositivo!");
          } else {
            setError("No se pudo validar la biometría. Por favor ingresá tu contraseña.");
          }
        } else {
          setError("Ingresá tu correo electrónico para registrar o validar tu huella / Face ID.");
        }
      }
    } catch (err) {
      console.error("Biometrics error:", err);
      setError("Error al procesar la biometría en este dispositivo.");
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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#0a2a5b] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen overflow-hidden font-sans bg-slate-900 text-white">
      <div className="w-full flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white rounded-3xl p-8 sm:p-10 shadow-2xl text-slate-800">
          <div className="text-center mb-6">
            <span className="px-3 py-1 rounded-full bg-blue-100 text-[#0a2a5b] text-[10px] font-black uppercase tracking-widest">
              Acceso Restringido Interno
            </span>
            <h1 className="text-2xl font-black text-[#0a2a5b] mt-2">
              Concorde 360 · Staff
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Centro de Operaciones Global TravelApp
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 rounded-xl bg-green-50 border border-green-200 text-xs text-green-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Correo Corporativo (@travelapp.ar)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="operador@travelapp.ar"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold focus:bg-white focus:border-[#0a2a5b] outline-none transition"
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
                  className="text-[11px] font-bold text-[#ff6b00] hover:underline"
                >
                  ¿Olvidaste clave?
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
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold focus:bg-white focus:border-[#0a2a5b] outline-none transition"
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

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-[#0a2a5b] hover:bg-[#071d3f] text-white font-bold text-xs uppercase tracking-wider shadow-lg transition active:scale-[0.98] disabled:opacity-60"
            >
              {isSubmitting ? "Autenticando..." : "Ingresar a Concorde 360"}
            </button>

            {biometricsAvailable && (
              <button
                type="button"
                onClick={handleBiometricLogin}
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition"
              >
                <Fingerprint className="w-4 h-4 text-[#ff6b00]" />
                <span>Ingreso Biométrico</span>
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
