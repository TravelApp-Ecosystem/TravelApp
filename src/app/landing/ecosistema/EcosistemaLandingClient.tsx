"use client";

import React, { useState, useEffect, useRef } from "react";
import { TravisOmnichannelWidget } from "@/components/shared/TravisOmnichannelWidget";
import {
  ArrowRight,
  ChevronDown,
  Menu,
  X,
  Phone,
  MapPin,
  Star,
  Shield,
  Globe,
  Users,
  Car,
  Compass,
  Gift,
  Award,
  CheckCircle,
  ChevronRight,
  Sparkles,
  Download,
  Send,
  Briefcase,
  Upload,
  Play,
  Loader2,
  Zap,
  Mail,
} from "lucide-react";
import { doc, onSnapshot, collection, addDoc } from "firebase/firestore";
import {
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
import { db, storage } from "@/lib/firebase";

// Inline SVG para íconos de redes sociales no disponibles en lucide-react v1.x
const Instagram = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <circle cx="12" cy="12" r="4"/>
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
  </svg>
);
const Facebook = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
  </svg>
);
const Linkedin = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
  </svg>
);
const Youtube = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.518 3.5 12 3.5 12 3.5s-7.518 0-9.388.503a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11C4.482 20.5 12 20.5 12 20.5s7.518 0 9.388-.503a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);
const Tiktok = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.525.02c1.31-.032 2.61-.019 3.91-.006.03 1.56.7 2.92 1.94 3.79.79.56 1.7.93 2.65 1.11.01 1.41-.01 2.82.003 4.23-.88-.13-1.74-.46-2.52-.94-.85-.52-1.55-1.24-2.02-2.11v6.92c-.01 1.43-.37 2.85-1.07 4.09-.76 1.34-1.92 2.4-3.32 2.99-1.57.66-3.37.76-5.02.26-1.5-.45-2.83-1.46-3.69-2.82-1-1.58-1.28-3.56-.78-5.38.48-1.76 1.7-3.26 3.34-4.08 1.15-.58 2.44-.81 3.72-.66v4.3c-.76-.23-1.61-.13-2.3.29-.63.39-1.05 1.05-1.16 1.79-.17.99.31 2.05 1.17 2.53.69.39 1.54.43 2.26.11.83-.37 1.39-1.19 1.44-2.1.03-3.64.01-7.28.02-10.93.01-.13.01-.26.01-.39z"/>
  </svg>
);

/* ══════════════════════════════════════════════════════════════════
   STATIC UNIT CONFIG — logos & routes (not CMS-driven)
   ══════════════════════════════════════════════════════════════════ */
const UNIT_CONFIG: Record<
  string,
  {
    logo: string;
    logoBlanco: string;
    color: string;
    gradientFrom: string;
    gradientTo: string;
    glow: string;
    border: string;
    landingUrl: string;
  }
> = {
  experience: {
    logo: "/assets/experience_original.svg",
    logoBlanco: "/assets/experience_blanco.svg",
    color: "#3b82f6",
    gradientFrom: "from-blue-600",
    gradientTo: "to-blue-950",
    glow: "shadow-blue-500/25 hover:shadow-blue-500/50",
    border: "border-blue-200 hover:border-blue-400",
    landingUrl: "/landing/experience",
  },
  rewards: {
    logo: "/assets/rewards_original.svg",
    logoBlanco: "/assets/rewards_blanco.svg",
    color: "#84cc16",
    gradientFrom: "from-lime-500",
    gradientTo: "to-lime-900",
    glow: "shadow-lime-500/25 hover:shadow-lime-500/50",
    border: "border-lime-200 hover:border-lime-400",
    landingUrl: "/landing/rewards",
  },
  travelcab: {
    logo: "/assets/travelcab_original.svg",
    logoBlanco: "/assets/travelcab_blanco.svg",
    color: "#ff6b00",
    gradientFrom: "from-orange-500",
    gradientTo: "to-orange-950",
    glow: "shadow-orange-500/25 hover:shadow-orange-500/50",
    border: "border-orange-200 hover:border-orange-400",
    landingUrl: "/landing/travelcab",
  },
};

/* ══════════════════════════════════════════════════════════════════
   DEFAULT CMS DATA — used on first render & as fallback
   ══════════════════════════════════════════════════════════════════ */
const DEFAULT_CMS: any = {
  hero: {
    mediaType: "image",
    mediaUrl:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1920&q=80",
    overlayOpacity: 72,
    badge: "✦ EL ECOSISTEMA DE VIAJES MÁS COMPLETO DE ARGENTINA",
    title: "Un Ecosistema Diseñado\npara el Viajero Moderno",
    subtitle:
      "Experiencias auténticas, movilidad segura y recompensas que crecen con cada aventura. Todo conectado, todo en un solo lugar.",
    ctaText: "Descubrí el Ecosistema",
    whatsappUrl: "https://wa.me/5493814188106",
    whatsappText: "Hablá con Nosotros",
    playStoreUrl: "",
    appStoreUrl: "",
  },
  unidades: [
    {
      id: "experience",
      nombre: "TravelApp Experience",
      descripcionBreve:
        "Descubrí Argentina como nunca la viviste. Excursiones curadas, guías certificados y destinos únicos en el NOA, Cuyo y la Patagonia.",
      descripcionExtendida:
        "TravelApp Experience es nuestra unidad de turismo premium. Diseñamos circuitos exclusivos, experiencias gastronómicas, aventura y cultura. Cada itinerario es curado por expertos locales e incluye seguros, traslados y soporte 24/7. Acumulás puntos Rewards en cada reserva.",
      imagenUrl:
        "https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=1200&q=80",
    },
    {
      id: "rewards",
      nombre: "TravelApp Rewards",
      descripcionBreve:
        "Cada viaje suma puntos. Canjéalos por traslados gratuitos, descuentos en experiencias o beneficios exclusivos con nuestros partners.",
      descripcionExtendida:
        "TravelApp Rewards es el corazón del ecosistema. Un programa de fidelización cruzado que conecta todas las unidades. Viajás en TravelCab → ganás puntos. Reservás una experiencia → ganás puntos. Y los podés canjear en cualquier producto del ecosistema sin restricciones.",
      imagenUrl:
        "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=1200&q=80",
    },
    {
      id: "travelcab",
      nombre: "TravelCab",
      descripcionBreve:
        "La movilidad urbana reinventada. Choferes certificados, tarifas transparentes y monitoreo satelital en tiempo real para cada traslado.",
      descripcionExtendida:
        "TravelCab es nuestra unidad de transporte premium. Una flota de vehículos certificados, choferes con antecedentes verificados y un modelo único: elegís entre comisión por viaje o membresía fija mensual. Tecnología de geolocalización, seguridad y confort en cada kilómetro.",
      imagenUrl:
        "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=1200&q=80",
    },
  ],
  quienesSomos: {
    badge: "Nuestra Historia",
    titulo: "Construyendo el Futuro del Turismo Argentino",
    mision:
      "Conectar a los viajeros con experiencias auténticas, movilidad confiable y un programa de recompensas que hace que cada viaje valga más.",
    vision:
      "Ser el ecosistema de viajes de referencia en Argentina, expandiendo nuestras fronteras hacia toda Latinoamérica.",
    valores:
      "Transparencia total, excelencia en el servicio, innovación constante e impacto positivo en las comunidades donde operamos.",
    imagenUrl:
      "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80",
  },
  stats: [
    { valor: "10.000+", label: "Viajes Realizados", icono: "Car" },
    { valor: "500+", label: "Experiencias Únicas", icono: "Compass" },
    { valor: "25.000+", label: "Miembros Rewards", icono: "Users" },
    { valor: "12", label: "Ciudades Activas", icono: "MapPin" },
  ],
  apps: {
    playStoreUrl: "",
    appStoreUrl: "",
    titulo: "Llevá el Ecosistema en tu Bolsillo",
    subtitulo:
      "Descargá la app de TravelApp y gestioná tus viajes, puntos y experiencias desde cualquier lugar.",
  },
  trabajaNosotros: {
    titulo: "Sumate al Equipo TravelApp",
    subtitulo:
      "Buscamos personas apasionadas por los viajes, la tecnología y el servicio de excelencia.",
    puestos: [
      "Conductor Socio TravelCab",
      "Guía de Experiencias",
      "Atención al Cliente",
      "Desarrollo de Software",
      "Marketing Digital",
      "Operaciones",
      "Ventas B2B",
      "Otro",
    ],
  },
  legales: {
    razonSocial: "TravelApp s.a.s.",
    cuit: "30-XXXXXXXX-X",
    domicilio: "San Miguel de Tucumán, Argentina",
    terminos:
      "Al utilizar nuestros servicios, el usuario acepta los términos y condiciones vigentes de TravelApp s.a.s. Todos los servicios son prestados conforme a la legislación argentina aplicable.",
    privacidad:
      "TravelApp s.a.s. garantiza la protección de datos personales de conformidad con la Ley 25.326. Los datos recopilados son utilizados únicamente para la prestación de los servicios contratados.",
  },
  redesSociales: {
    facebook: "https://facebook.com/travelapp.ar",
    instagram: "https://instagram.com/travelapp.ar",
    whatsapp: "https://wa.me/5493814188106",
    linkedin: "",
  },
  showStats: false,
};

/* ══════════════════════════════════════════════════════════════════
   ANIMATED COUNTER
   ══════════════════════════════════════════════════════════════════ */
function AnimatedCounter({
  target,
  animated,
}: {
  target: string;
  animated: boolean;
}) {
  const [displayed, setDisplayed] = useState("0");

  useEffect(() => {
    if (!animated) return;
    const numericStr = target.replace(/[^0-9]/g, "");
    const suffix = target.replace(/[0-9]/g, "");
    const targetNum = parseInt(numericStr, 10);
    if (isNaN(targetNum)) {
      setDisplayed(target);
      return;
    }
    let frame = 0;
    const totalFrames = 80;
    const timer = setInterval(() => {
      frame++;
      const progress = frame / totalFrames;
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(eased * targetNum);
      setDisplayed(`${current.toLocaleString("es-AR")}${suffix}`);
      if (frame >= totalFrames) clearInterval(timer);
    }, 20);
    return () => clearInterval(timer);
  }, [animated, target]);

  return <span>{displayed}</span>;
}

/* ══════════════════════════════════════════════════════════════════
   LEGAL MODAL
   ══════════════════════════════════════════════════════════════════ */
function LegalModal({
  title,
  content,
  onClose,
}: {
  title: string;
  content: string;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-3xl bg-white shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: "scaleIn 0.3s ease-out" }}
      >
        <div className="bg-tech-blue text-white p-6 flex items-center justify-between">
          <h3 className="font-black text-lg">{title}</h3>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-6 text-sm text-slate-600 leading-relaxed max-h-[60vh] overflow-y-auto">
          {content}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   MAIN PAGE
   ══════════════════════════════════════════════════════════════════ */
const RenderLegalSeal = ({ content, alt }: { content?: string; alt: string }) => {
  if (!content) return null;
  const trimmed = content.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith('<') || trimmed.includes('<script')) {
    return (
      <div 
        className="flex items-center justify-center min-h-[40px] max-h-16 overflow-hidden [&_img]:max-h-10 [&_img]:w-auto"
        dangerouslySetInnerHTML={{ __html: trimmed }} 
      />
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-slate-900 bg-slate-950 px-3 py-1.5 hover:border-slate-800 transition-colors">
      <img src={trimmed} alt={alt} className="h-6 w-auto object-contain" />
      <span className="text-[8px] font-bold text-slate-400 uppercase">{alt}</span>
    </div>
  );
};

export default function EcosistemaLanding({ initialCms }: { initialCms?: any }) {
  const [cms, setCms] = useState<any>(initialCms ? { ...DEFAULT_CMS, ...initialCms } : DEFAULT_CMS);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const [activeUnitModal, setActiveUnitModal] = useState<any>(null);
  const [showJobModal, setShowJobModal] = useState(false);
  const [legalModal, setLegalModal] = useState<{ title: string; content: string } | null>(null);
  const [historyModal, setHistoryModal] = useState<{ title: string; text: string } | null>(null);
  const [countersAnimated, setCountersAnimated] = useState(false);
  const [jobForm, setJobForm] = useState({
    nombre: "",
    apellido: "",
    email: "",
    telefono: "",
    puesto: "",
    mensaje: "",
  });
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const statsRef = useRef<HTMLDivElement>(null);

  const getUrl = (id: string) => {
    if (typeof window === "undefined") return `/landing/${id}`;
    const isLocal = window.location.hostname.includes("localhost") || 
                    window.location.hostname.includes("127.0.0.1");
    if (isLocal) return `/landing/${id}`;
    if (id === "travelcab") return "https://travelcab.ar";
    if (id === "experience") return "https://experience.travelapp.ar";
    if (id === "rewards") return "https://rewards.travelapp.ar";
    return `/landing/${id}`;
  };

  // Estados interactivos para contacto y Travis Chat
  const [contactDropdownOpen, setContactDropdownOpen] = useState(false);
  const [travisDropdownOpen, setTravisDropdownOpen] = useState(false);
  const [showTravisChat, setShowTravisChat] = useState(false);
  const [travisMessages, setTravisMessages] = useState<Array<{ sender: "user" | "travis"; text: string; time: string }>>([
    {
      sender: "travis",
      text: "¡Hola! Soy Travis, el asistente virtual de TravelApp. 🤖\n\n¿En qué te puedo ayudar hoy? Podés preguntarme sobre traslados en TravelCab, guías y excursiones en Experience, o cómo acumular y canjear tus puntos en Rewards.",
      time: new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [currentTravisMessage, setCurrentTravisMessage] = useState("");
  const [isTravisTyping, setIsTravisTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [travisMessages]);

  const handleSendTravisMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTravisMessage.trim() || isTravisTyping) return;
    const userMsg = currentTravisMessage.trim();
    setCurrentTravisMessage("");
    const now = new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
    
    // Agregar mensaje del usuario
    setTravisMessages((prev) => [...prev, { sender: "user", text: userMsg, time: now }]);
    setIsTravisTyping(true);
    
    try {
      const res = await fetch("/api/travis/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg, businessUnit: "General" }),
      });
      if (res.ok) {
        const data = await res.json();
        setTravisMessages((prev) => [
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
      setTravisMessages((prev) => [
        ...prev,
        {
          sender: "travis",
          text: "Disculpame, estoy teniendo un inconveniente técnico para responderte. Si querés podés escribirme a WhatsApp.",
          time: new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsTravisTyping(false);
    }
  };

  /* ── Firestore real-time listener ── */
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "cms", "landing_ecosistema"), (snap) => {
      if (snap.exists()) {
        setCms((prev: any) => ({ ...prev, ...snap.data() }));
      }
    });
    return () => unsub();
  }, []);

  /* ── Header scroll effect ── */
  useEffect(() => {
    const handler = () => setHeaderScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  /* ── Counter IntersectionObserver ── */
  useEffect(() => {
    if (!statsRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !countersAnimated)
          setCountersAnimated(true);
      },
      { threshold: 0.4 }
    );
    observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, [countersAnimated]);

  /* ── Job form submit with Firebase Storage ── */
  const handleJobSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cvFile) {
      alert("Por favor adjuntá tu CV.");
      return;
    }
    setIsSubmitting(true);
    setUploadProgress(0);
    try {
      const ext = cvFile.name.split(".").pop();
      const fileName = `${Date.now()}_${jobForm.apellido}_${jobForm.nombre}.${ext}`;
      const cvRef = storageRef(storage, `cvs/${fileName}`);
      const uploadTask = uploadBytesResumable(cvRef, cvFile);

      const cvUrl = await new Promise<string>((resolve, reject) => {
        uploadTask.on(
          "state_changed",
          (snap) =>
            setUploadProgress(
              (snap.bytesTransferred / snap.totalBytes) * 100
            ),
          reject,
          async () => resolve(await getDownloadURL(uploadTask.snapshot.ref))
        );
      });

      await addDoc(collection(db, "job_applications"), {
        ...jobForm,
        cvUrl,
        cvFileName: cvFile.name,
        status: "Recibida",
        createdAt: Date.now(),
      });

      setSubmitStatus("success");
    } catch (err) {
      console.error("Error submitting application:", err);
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetJobModal = () => {
    setShowJobModal(false);
    setSubmitStatus("idle");
    setJobForm({ nombre: "", apellido: "", email: "", telefono: "", puesto: "", mensaje: "" });
    setCvFile(null);
    setUploadProgress(0);
  };

  /* ── Stats icon map ── */
  const STAT_ICONS: Record<string, React.ReactNode> = {
    Car: <Car className="h-7 w-7" />,
    Compass: <Compass className="h-7 w-7" />,
    Users: <Users className="h-7 w-7" />,
    MapPin: <MapPin className="h-7 w-7" />,
    Globe: <Globe className="h-7 w-7" />,
    Star: <Star className="h-7 w-7" />,
    Award: <Award className="h-7 w-7" />,
    Sparkles: <Sparkles className="h-7 w-7" />,
  };

  const heroLines = (cms.hero?.title ?? DEFAULT_CMS.hero.title).split("\n");

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 overflow-x-hidden font-sans">
      {/* ── Global Keyframe Animations ── */}
      <style>{`
        @keyframes floatA {
          0%,100% { transform: translateY(0) rotate(0deg) scale(1); }
          33%      { transform: translateY(-28px) rotate(4deg) scale(1.05); }
          66%      { transform: translateY(14px) rotate(-2deg) scale(0.97); }
        }
        @keyframes floatB {
          0%,100% { transform: translateY(0) rotate(0deg); }
          50%      { transform: translateY(-22px) rotate(-5deg); }
        }
        @keyframes pulseGlow {
          0%,100% { opacity: 0.25; transform: scale(1); }
          50%      { opacity: 0.55; transform: scale(1.12); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(36px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.92); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes scrollBounce {
          0%,100% { transform: translateY(0);   opacity: 0.7; }
          50%      { transform: translateY(9px); opacity: 0.3; }
        }
        @keyframes shimmerLine {
          0%   { background-position: -400px 0; }
          100% { background-position:  400px 0; }
        }
        .anim-float-a  { animation: floatA  9s ease-in-out infinite; }
        .anim-float-b  { animation: floatB  7s ease-in-out infinite; }
        .anim-glow     { animation: pulseGlow 3.5s ease-in-out infinite; }
        .anim-fiu      { opacity:0; animation: fadeInUp   0.8s ease-out forwards; }
        .anim-fid      { opacity:0; animation: fadeInDown 0.6s ease-out forwards; }
        .anim-scale    { opacity:0; animation: scaleIn    0.45s ease-out forwards; }
        .anim-scroll   { animation: scrollBounce 1.6s ease-in-out infinite; }
        .d100 { animation-delay: .10s; }
        .d200 { animation-delay: .20s; }
        .d300 { animation-delay: .30s; }
        .d400 { animation-delay: .40s; }
        .d500 { animation-delay: .50s; }
        .d600 { animation-delay: .60s; }
        .d700 { animation-delay: .70s; }
        .d800 { animation-delay: .80s; }
        .grad-text {
          background: linear-gradient(135deg,#ffffff 0%,#ff6b00 55%,#f97316 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .glass {
          background: rgba(255,255,255,0.08);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          border: 1px solid rgba(255,255,255,0.14);
        }
        .card-lift {
          transition: transform 0.4s cubic-bezier(.175,.885,.32,1.275),
                      box-shadow 0.4s ease;
        }
        .card-lift:hover { transform: translateY(-10px); }
      `}</style>

      {/* ════════════════════════════════════════════════════════════
          HEADER
          ════════════════════════════════════════════════════════════ */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          headerScrolled
            ? "bg-tech-blue/95 backdrop-blur-lg shadow-2xl shadow-tech-blue/30"
            : "bg-transparent"
        }`}
      >
        <div className="mx-auto max-w-7xl flex items-center justify-between px-6 py-4">
          {/* Logo */}
          <a href="#" className="flex items-center gap-3 group shrink-0">
            <img
              src="/assets/travelapp_blanco.svg"
              alt="TravelApp"
              className="h-12 w-auto object-contain"
            />
          </a>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-7 text-sm font-bold text-white/75">
            <a
              href="#unidades"
              className="hover:text-orange-500 transition-colors"
            >
              Servicios
            </a>
            <a
              href="#quienes-somos"
              className="hover:text-orange-500 transition-colors"
            >
              Quiénes Somos
            </a>
            <a href="#ecosistema" className="hover:text-orange-500 transition-colors">
              El Ecosistema
            </a>
            {(cms.apps?.playStoreUrl || cms.apps?.appStoreUrl) && (
              <a href="#app" className="hover:text-orange-500 transition-colors">
                La App
              </a>
            )}
            <button
              onClick={() => {
                setShowJobModal(true);
                setSubmitStatus("idle");
              }}
              className="hover:text-orange-500 transition-colors cursor-pointer"
            >
              Trabajá con Nosotros
            </button>
          </nav>

          {/* CTA */}
          <div className="hidden lg:flex items-center gap-6">
            <a href="tel:08102200018" className="text-white font-bold text-sm hover:text-orange-400 transition-colors flex items-center gap-2">
              <Phone className="h-4 w-4 text-orange-500" />
              0810-220-0018
            </a>
            <div className="relative">
              <button
                onClick={() => setContactDropdownOpen(!contactDropdownOpen)}
                className="inline-flex items-center gap-2 rounded-2xl bg-orange-500 hover:bg-orange-600 px-5 py-2.5 text-sm font-black text-white transition-all hover:scale-105 shadow-lg shadow-orange-500/20 cursor-pointer"
                style={{ backgroundColor: '#ff6b00' }}
              >
                Contactanos
                <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${contactDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {contactDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-white border border-slate-100 shadow-2xl p-2 flex flex-col gap-1 z-50 text-slate-800 animate-fadeIn" style={{ animation: "scaleIn 0.2s ease-out" }}>
                  <a
                    href={cms.hero?.whatsappUrl || DEFAULT_CMS.hero.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setContactDropdownOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold hover:bg-slate-50 transition-colors"
                  >
                    <Phone className="h-4 w-4 text-orange-500" />
                    WhatsApp
                  </a>
                  <a
                    href="mailto:hola@travelapp.ar"
                    onClick={() => setContactDropdownOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold hover:bg-slate-50 transition-colors"
                  >
                    <Mail className="h-4 w-4 text-orange-500" />
                    Correo Electrónico
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden h-10 w-10 rounded-xl border border-white/20 flex items-center justify-center text-white"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="lg:hidden bg-tech-blue/98 backdrop-blur-md border-t border-white/10 px-6 py-5 flex flex-col gap-1">
            {[
              { label: "Servicios", href: "#unidades" },
              { label: "Quiénes Somos", href: "#quienes-somos" },
              { label: "El Ecosistema", href: "#ecosistema" },
              { label: "La App", href: "#app" },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="font-bold text-white/85 py-3 border-b border-white/8 hover:text-orange-500 transition-colors"
              >
                {item.label}
              </a>
            ))}
            <button
              onClick={() => {
                setMobileOpen(false);
                setShowJobModal(true);
                setSubmitStatus("idle");
              }}
              className="text-left font-bold text-white/85 py-3 border-b border-white/8 hover:text-orange-500 transition-colors"
            >
              Trabajá con Nosotros
            </button>
            <div className="flex flex-col gap-3 mt-3">
              <a href="tel:08102200018" className="inline-flex items-center justify-center gap-2 text-white font-bold py-2 border border-white/20 rounded-2xl">
                <Phone className="h-4 w-4 text-orange-500" />
                0810-220-0018
              </a>
              <div className="flex flex-col gap-2 mt-1">
                <a
                  href={cms.hero?.whatsappUrl || DEFAULT_CMS.hero.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-orange-500 py-3 text-sm font-black text-white"
                  style={{ backgroundColor: '#ff6b00' }}
                >
                  <Phone className="h-4 w-4" /> WhatsApp
                </a>
                <a
                  href="mailto:hola@travelapp.ar"
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-white/20 bg-white/10 py-3 text-sm font-bold text-white"
                >
                  <Mail className="h-4 w-4 text-orange-500" /> Correo Electrónico
                </a>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ════════════════════════════════════════════════════════════
          HERO — Full Screen
          ════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background media */}
        {cms.hero?.mediaType === "video" ? (
          <video
            src={cms.hero.mediaUrl}
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url('${cms.hero?.mediaUrl || DEFAULT_CMS.hero.mediaUrl}')`,
            }}
          />
        )}

        {/* Dark overlay */}
        <div
          className="absolute inset-0 bg-tech-blue"
          style={{ opacity: (cms.hero?.overlayOpacity ?? 72) / 100 }}
        />
        {/* Gradient vignette */}
        <div className="absolute inset-0 bg-gradient-to-b from-tech-blue/20 via-transparent to-tech-blue/90" />

        {/* Animated background orbs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="anim-float-a anim-glow absolute top-[18%] left-[10%] h-[450px] w-[450px] rounded-full blur-3xl"
            style={{ background: "rgba(255,107,0,0.08)" }}
          />
          <div
            className="anim-float-b anim-glow absolute bottom-[20%] right-[8%] h-[350px] w-[350px] rounded-full blur-3xl"
            style={{ background: "rgba(59,130,246,0.09)", animationDelay: "2s" }}
          />
          <div
            className="anim-float-a absolute top-[55%] left-[38%] h-[250px] w-[250px] rounded-full blur-3xl"
            style={{ background: "rgba(255,107,0,0.06)", animationDelay: "4s" }}
          />
        </div>

        {/* Hero content */}
        <div className="relative z-10 mx-auto max-w-5xl px-6 text-center text-white pt-28 pb-16">
          {/* Animated badge */}
          <div className="anim-fid inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-5 py-2 text-[11px] font-black uppercase tracking-widest text-orange-500 mb-8 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-orange-50 animate-pulse" />
            {cms.hero?.badge || DEFAULT_CMS.hero.badge}
          </div>

          {/* Title */}
          <h1 className="anim-fiu d100 text-5xl sm:text-6xl md:text-7xl font-black leading-[1.05] tracking-tight mb-6">
            {heroLines[0]}
            {heroLines[1] && (
              <span className="grad-text block mt-2">{heroLines[1]}</span>
            )}
          </h1>

          {/* Subtitle */}
          <p className="anim-fiu d200 text-lg sm:text-xl text-slate-200 max-w-2xl mx-auto leading-relaxed mb-10 font-medium">
            {cms.hero?.subtitle || DEFAULT_CMS.hero.subtitle}
          </p>

          {/* CTA buttons */}
          <div className="anim-fiu d300 flex flex-col sm:flex-row items-center justify-center gap-4 mb-10 relative z-30">
            <a
              href="#unidades"
              className="inline-flex items-center gap-2 rounded-2xl bg-orange-500 hover:bg-orange-600 px-9 py-4 text-base font-black text-white transition-all duration-300 hover:-translate-y-1 shadow-2xl shadow-orange-500/30"
              style={{ backgroundColor: '#ff6b00' }}
            >
              {cms.hero?.ctaText || DEFAULT_CMS.hero.ctaText}
              <ArrowRight className="h-5 w-5" />
            </a>
            <div className="relative">
              <button
                onClick={() => setTravisDropdownOpen(!travisDropdownOpen)}
                className="inline-flex items-center gap-3 rounded-2xl border-2 border-white/22 bg-white/10 hover:bg-white/18 backdrop-blur-sm px-9 py-4 text-base font-bold text-white transition-all duration-300 hover:-translate-y-1 cursor-pointer"
              >
                <div className="h-7 w-7 rounded-full bg-white overflow-hidden flex items-center justify-center border border-white/20">
                  <img src="/assets/travis_perfil.svg" alt="Travis" className="h-full w-full object-cover scale-110" />
                </div>
                Hablar con Travis
                <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${travisDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {travisDropdownOpen && (
                <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-48 rounded-2xl bg-white border border-slate-100 shadow-2xl p-2 flex flex-col gap-1 z-50 text-slate-800 animate-fadeIn" style={{ animation: "scaleIn 0.2s ease-out" }}>
                  <a
                    href={cms.hero?.whatsappUrl || DEFAULT_CMS.hero.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setTravisDropdownOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold hover:bg-slate-50 transition-colors"
                  >
                    <Phone className="h-4 w-4 text-orange-500" />
                    WhatsApp
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      setTravisDropdownOpen(false);
                      setShowTravisChat(true);
                    }}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold hover:bg-slate-50 transition-colors text-left w-full cursor-pointer"
                  >
                    <Users className="h-4 w-4 text-orange-500" />
                    Chat Web (IA)
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* App badges (only if URLs set) */}
          {(cms.hero?.playStoreUrl || cms.hero?.appStoreUrl) && (
            <div className="anim-fiu d400 flex flex-wrap items-center justify-center gap-3 mb-10">
              {cms.hero?.playStoreUrl && (
                <a
                  href={cms.hero.playStoreUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-2xl border border-white/18 bg-white/10 hover:bg-white/18 backdrop-blur-sm px-5 py-3 transition-all hover:scale-105"
                >
                  <Play className="h-6 w-6 text-white fill-white flex-shrink-0" />
                  <div className="text-left">
                    <div className="text-[9px] text-white/55 uppercase tracking-wider font-semibold">
                      Disponible en
                    </div>
                    <div className="text-sm font-black text-white">
                      Google Play
                    </div>
                  </div>
                </a>
              )}
              {cms.hero?.appStoreUrl && (
                <a
                  href={cms.hero.appStoreUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-2xl border border-white/18 bg-white/10 hover:bg-white/18 backdrop-blur-sm px-5 py-3 transition-all hover:scale-105"
                >
                  <Download className="h-6 w-6 text-white flex-shrink-0" />
                  <div className="text-left">
                    <div className="text-[9px] text-white/55 uppercase tracking-wider font-semibold">
                      Disponible en
                    </div>
                    <div className="text-sm font-black text-white">
                      App Store
                    </div>
                  </div>
                </a>
              )}
            </div>
          )}

          {/* Mini unit preview cards */}
          <div className="anim-fiu d500 grid grid-cols-3 gap-3 max-w-md mx-auto mb-14">
            {[
              { logo: "/assets/experience_original.svg", label: "Experience" },
              { logo: "/assets/rewards_original.svg", label: "Rewards" },
              { logo: "/assets/travelcab_original.svg", label: "TravelCab" },
            ].map((u) => (
              <div
                key={u.label}
                className="bg-white/90 border border-white/50 backdrop-blur-md rounded-2xl p-4 flex flex-col items-center justify-center gap-3 hover:bg-white transition-all shadow-lg hover:scale-105 duration-300"
              >
                <div className="h-12 w-full flex items-center justify-center">
                  <img
                    src={u.logo}
                    alt={u.label}
                    className="h-10 w-auto object-contain"
                  />
                </div>
                <span className="text-[10px] font-extrabold text-tech-blue uppercase tracking-wider leading-tight">
                  {u.label}
                </span>
              </div>
            ))}
          </div>

          {/* Scroll indicator */}
          <div className="anim-scroll flex flex-col items-center gap-1.5 text-white/35">
            <span className="text-[9px] font-bold uppercase tracking-widest">
              Scroll
            </span>
            <ChevronDown className="h-5 w-5" />
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          BUSINESS UNITS
          ════════════════════════════════════════════════════════════ */}
      <section id="unidades" className="py-24 bg-white">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-16">
            <span className="text-xs font-black uppercase tracking-widest text-slate-400">
              Nuestras Unidades de Negocio
            </span>
            <h2 className="mt-3 text-4xl md:text-5xl font-black text-tech-blue leading-tight">
              Un Ecosistema,{" "}
              <span className="text-orange-500">Tres Experiencias</span>
            </h2>
            <p className="mt-5 text-slate-500 max-w-2xl mx-auto text-base leading-relaxed">
              Cada unidad fue diseñada para potenciar a las demás. Juntas,
              forman el sistema de viajes más completo del mercado argentino.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {(cms.unidades || DEFAULT_CMS.unidades).map(
              (unit: any, idx: number) => {
                const cfg = UNIT_CONFIG[unit.id];
                if (!cfg) return null;
                const unitImg = unit.imagenUrl || unit.imageUrl;
                return (
                  <div
                    key={unit.id}
                    className="card-lift group rounded-3xl overflow-hidden border border-slate-200/80 bg-white/70 backdrop-blur-md shadow-xl flex flex-col hover:border-orange-500/40 transition-all"
                  >
                    {/* Image space (completely clean) */}
                    <div className="relative h-60 overflow-hidden">
                      <img
                        src={unitImg}
                        alt={unit.nombre}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        style={{ imageRendering: 'auto' }}
                      />
                      {/* Index badge */}
                      <span className="absolute top-4 left-4 text-[10px] font-black text-slate-600/90 bg-white/90 backdrop-blur-md rounded-lg px-2.5 py-1 uppercase tracking-widest shadow-sm">
                        0{idx + 1}
                      </span>
                    </div>

                    {/* Card body */}
                    <div className="p-7 flex flex-col flex-1">
                      {/* Brand Logo replacing the text title (larger and centered) */}
                      <div className="h-16 flex items-center justify-center mb-5">
                        <img
                          src={cfg.logo}
                          alt={unit.nombre}
                          className="h-11 w-auto object-contain transition-transform duration-350 group-hover:scale-105"
                        />
                      </div>
                      <p className="text-slate-500 text-sm leading-relaxed flex-1 mb-7">
                        {unit.descripcionBreve}
                      </p>

                      {/* Buttons */}
                      <div className="flex flex-col gap-3 mt-auto">
                        <a
                          href={getUrl(unit.id)}
                          className="inline-flex items-center justify-center gap-2 rounded-xl py-3 px-5 text-sm font-black text-white transition-all hover:opacity-90 hover:shadow-lg shadow-md"
                          style={{ backgroundColor: cfg.color }}
                        >
                          Ir a la Plataforma
                          <ArrowRight className="h-4 w-4" />
                        </a>
                        <button
                          onClick={() => setActiveUnitModal(unit)}
                          className="inline-flex items-center justify-center gap-2 rounded-xl py-2.5 px-5 text-sm font-bold border-2 border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50 transition-all"
                        >
                          Leer Más
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          QUIÉNES SOMOS
          ════════════════════════════════════════════════════════════ */}
      <section id="quienes-somos" className="py-24 bg-slate-50">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Image */}
            <div className="relative">
              <div className="relative h-[520px] rounded-3xl overflow-hidden shadow-2xl shadow-tech-blue/10">
                <img
                  src={cms.quienesSomos?.imagenUrl || DEFAULT_CMS.quienesSomos.imagenUrl}
                  alt="Quiénes Somos TravelApp"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-tech-blue/50 to-transparent" />
              </div>
              {/* Floating badge */}
              <div className="absolute -bottom-6 -right-4 lg:-right-8 bg-white rounded-2xl shadow-xl shadow-slate-200 p-5 border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-tech-blue flex items-center justify-center flex-shrink-0">
                    <img
                      src="/assets/travelapp_blanco.svg"
                      alt="TravelApp"
                      className="h-8 w-auto"
                    />
                  </div>
                  <div>
                    <p className="text-xs font-black text-tech-blue uppercase tracking-wider">
                      TravelApp
                    </p>
                    <p className="text-xs text-slate-500">Tucumán, Argentina</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Text */}
            <div className="space-y-8">
              <div>
                <span className="text-xs font-black uppercase tracking-widest text-orange-600">
                  {cms.quienesSomos?.badge || DEFAULT_CMS.quienesSomos.badge}
                </span>
                <h2 className="mt-3 text-3xl md:text-4xl font-black text-tech-blue leading-tight">
                  {cms.quienesSomos?.titulo || DEFAULT_CMS.quienesSomos.titulo}
                </h2>
              </div>

              <div className="space-y-5">
                {[
                  {
                    icon: <Star className="h-5 w-5" />,
                    label: "Misión",
                    field: "mision",
                    bg: "bg-orange-50 border-orange-200",
                    ico: "text-orange-600",
                  },
                  {
                    icon: <Globe className="h-5 w-5" />,
                    label: "Visión",
                    field: "vision",
                    bg: "bg-blue-50 border-blue-200",
                    ico: "text-blue-600",
                  },
                  {
                    icon: <Shield className="h-5 w-5" />,
                    label: "Valores",
                    field: "valores",
                    bg: "bg-orange-50 border-orange-200",
                    ico: "text-orange-600",
                  },
                ].map((item) => {
                  const fullText = cms.quienesSomos?.[item.field] || DEFAULT_CMS.quienesSomos[item.field as keyof typeof DEFAULT_CMS.quienesSomos];
                  const truncateText = fullText.length > 90 ? fullText.substring(0, 90) + "..." : fullText;
                  return (
                    <div
                      key={item.label}
                      className={`rounded-2xl border p-5 ${item.bg} flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4`}
                    >
                      <div className="flex-1">
                        <div className={`flex items-center gap-2 mb-2 ${item.ico}`}>
                          {item.icon}
                          <h3 className="font-black text-sm uppercase tracking-wider">
                            {item.label}
                          </h3>
                        </div>
                        <p className="text-slate-600 text-sm leading-relaxed">
                          {truncateText}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setHistoryModal({ title: item.label, text: fullText })}
                        className={`inline-flex items-center gap-1 text-xs font-black uppercase tracking-wider px-3.5 py-2 rounded-xl border border-current bg-white hover:bg-slate-50 transition-all cursor-pointer flex-shrink-0 self-start sm:self-center ${item.ico}`}
                      >
                        Ver más
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          HOW THE ECOSYSTEM WORKS
          ════════════════════════════════════════════════════════════ */}
      <section id="ecosistema" className="py-24 bg-tech-blue relative overflow-hidden">
        {/* Bg decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="anim-glow absolute top-0 right-0 h-[500px] w-[500px] rounded-full blur-3xl" style={{ background: "rgba(255,107,0,0.06)" }} />
          <div className="anim-glow absolute bottom-0 left-0 h-[400px] w-[400px] rounded-full blur-3xl" style={{ background: "rgba(59,130,246,0.06)", animationDelay: "1.5s" }} />
        </div>

        <div className="mx-auto max-w-7xl px-6 relative z-10">
          <div className="text-center mb-16">
            <span className="text-xs font-black uppercase tracking-widest text-orange-400">
              Cómo Funciona
            </span>
            <h2 className="mt-3 text-3xl md:text-5xl font-black text-white leading-tight">
              El Ecosistema Conectado
            </h2>
            <p className="mt-4 text-slate-300 max-w-2xl mx-auto text-base">
              Cada unidad alimenta al sistema completo. Viajás, acumulás puntos
              y los usás donde y cuando quieras.
            </p>
          </div>

          {/* Flow diagram */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto items-stretch mb-14">
            {[
              {
                id: "travelcab",
                logo: "/assets/travelcab_blanco.svg",
                icon: <Car className="h-8 w-8" />,
                label: "TravelCab",
                action: "Pedís tu traslado",
                pts: "+150 pts/viaje",
                accent: "bg-orange-500",
                border: "border-orange-400/30",
                glow: "bg-orange-500/10",
              },
              {
                id: "rewards",
                logo: "/assets/rewards_blanco.svg",
                icon: <Award className="h-8 w-8" />,
                label: "Rewards Hub",
                action: "Acumulás y canjeás",
                pts: "Centro de Puntos",
                accent: "bg-orange-500",
                border: "border-orange-400/40",
                glow: "bg-orange-500/15",
                isCenter: true,
              },
              {
                id: "experience",
                logo: "/assets/experience_blanco.svg",
                icon: <Compass className="h-8 w-8" />,
                label: "Experience",
                action: "Reservás aventuras",
                pts: "+300 pts/reserva",
                accent: "bg-blue-500",
                border: "border-blue-400/30",
                glow: "bg-blue-500/10",
              },
            ].map((item) => {
              const ecoUnit = cms.unidades?.find((u: any) => u.id === item.id) || DEFAULT_CMS.unidades.find((u: any) => u.id === item.id);
              const unitImg = ecoUnit?.imagenUrl || ecoUnit?.imageUrl;
              return (
                <div
                  key={item.id}
                  className={`glass rounded-3xl border-2 overflow-hidden flex flex-col ${item.border} ${item.glow} ${
                    item.isCenter
                      ? "scale-105 md:scale-110 shadow-2xl shadow-orange-500/20 border-orange-400/50"
                      : ""
                  }`}
                >
                  {/* Photo at the top */}
                  <div className="h-32 relative overflow-hidden flex-shrink-0">
                    <img src={unitImg} alt={item.label} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-tech-blue via-transparent to-transparent opacity-85" />
                    {/* Float icon */}
                    <div className={`absolute bottom-3 right-3 h-10 w-10 rounded-xl ${item.accent} flex items-center justify-center text-white shadow-lg`}>
                      {item.icon}
                    </div>
                  </div>

                  <div className="p-6 text-center flex flex-col items-center justify-between flex-1 gap-4">
                    <img
                      src={item.logo}
                      alt={item.label}
                      className="h-14 object-contain opacity-90"
                    />
                    <div>
                      <p className="text-white font-black text-base mb-1">
                        {item.label}
                      </p>
                      <p className="text-slate-300 text-xs">{item.action}</p>
                    </div>
                    <span
                      className={`inline-block text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full border ${
                        item.isCenter
                          ? "bg-orange-400/20 text-orange-300 border-orange-400/30"
                          : "bg-white/8 text-white/50 border-white/10"
                      }`}
                    >
                      {item.pts}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Benefit pills */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {[
              {
                icon: <Zap className="h-5 w-5" />,
                text: "Cada viaje en TravelCab suma puntos automáticamente en tu cuenta Rewards.",
              },
              {
                icon: <Gift className="h-5 w-5" />,
                text: "Canjeá tus puntos por descuentos en Experiences o viajes gratis con TravelCab.",
              },
              {
                icon: <Sparkles className="h-5 w-5" />,
                text: "Mientras más usás el ecosistema, más beneficios exclusivos desbloqueás.",
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="glass rounded-2xl p-5 flex items-start gap-3"
              >
                <div className="h-9 w-9 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-500 flex-shrink-0">
                  {item.icon}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          STATS
          ════════════════════════════════════════════════════════════ */}
      {cms.showStats && (
        <section
          className="py-20 bg-white border-y border-slate-100"
          ref={statsRef}
        >
          <div className="mx-auto max-w-7xl px-6">
            <div className="text-center mb-14">
              <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                Nuestro Impacto
              </span>
              <h2 className="mt-2 text-3xl md:text-4xl font-black text-tech-blue">
                Números que Hablan por Sí Solos
              </h2>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {(cms.stats || DEFAULT_CMS.stats).map((stat: any, idx: number) => {
                const StatIcon =
                  STAT_ICONS[stat.icono] ?? <Star className="h-7 w-7" />;
                return (
                  <div key={idx} className="text-center group">
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-tech-blue/6 text-tech-blue mb-5 group-hover:bg-tech-blue group-hover:text-white transition-all duration-400 shadow-sm group-hover:shadow-xl group-hover:shadow-tech-blue/20">
                      {StatIcon}
                    </div>
                    <p className="text-4xl md:text-5xl font-black text-tech-blue mb-2 tabular-nums">
                      <AnimatedCounter
                        target={stat.valor}
                        animated={countersAnimated}
                      />
                    </p>
                    <p className="text-sm text-slate-500 font-semibold">
                      {stat.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}


      {/* ════════════════════════════════════════════════════════════
          APP DOWNLOAD (shown only when URLs are configured)
          ════════════════════════════════════════════════════════════ */}
      {(cms.apps?.playStoreUrl || cms.apps?.appStoreUrl) && (
        <section id="app" className="py-24 bg-slate-50">
          <div className="mx-auto max-w-6xl px-6">
            <div className="rounded-3xl bg-tech-blue overflow-hidden relative shadow-2xl shadow-tech-blue/20">
              <div className="absolute inset-0 pointer-events-none">
                <div className="anim-glow absolute -top-20 -right-20 h-80 w-80 rounded-full blur-3xl" style={{ background: "rgba(255,107,0,0.12)" }} />
                <div className="anim-glow absolute -bottom-20 -left-20 h-60 w-60 rounded-full blur-3xl" style={{ background: "rgba(59,130,246,0.1)", animationDelay: "2s" }} />
              </div>
              <div className="relative z-10 p-10 md:p-16 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                <div className="space-y-6 text-white">
                  <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-orange-500 border border-orange-500/20 bg-orange-500/10 px-3 py-1.5 rounded-full">
                    <Download className="h-3 w-3" /> Disponible Ahora
                  </span>
                  <h2 className="text-3xl md:text-4xl font-black leading-tight">
                    {cms.apps?.titulo || DEFAULT_CMS.apps.titulo}
                  </h2>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    {cms.apps?.subtitulo || DEFAULT_CMS.apps.subtitulo}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    {cms.apps?.playStoreUrl && (
                      <a
                        href={cms.apps.playStoreUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 rounded-2xl bg-white/10 hover:bg-white/18 border border-white/18 px-5 py-4 transition-all hover:scale-105"
                      >
                        <Play className="h-7 w-7 text-white fill-white flex-shrink-0" />
                        <div>
                          <div className="text-[9px] text-white/50 uppercase tracking-wider font-semibold">Disponible en</div>
                          <div className="text-sm font-black text-white">Google Play</div>
                        </div>
                      </a>
                    )}
                    {cms.apps?.appStoreUrl && (
                      <a
                        href={cms.apps.appStoreUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 rounded-2xl bg-white/10 hover:bg-white/18 border border-white/18 px-5 py-4 transition-all hover:scale-105"
                      >
                        <Download className="h-7 w-7 text-white flex-shrink-0" />
                        <div>
                          <div className="text-[9px] text-white/50 uppercase tracking-wider font-semibold">Disponible en</div>
                          <div className="text-sm font-black text-white">App Store</div>
                        </div>
                      </a>
                    )}
                  </div>
                </div>
                <div className="space-y-4">
                  {[
                    { icon: <Car className="h-5 w-5" />, title: "Pedí tu TravelCab", desc: "Traslados en segundos desde tu teléfono" },
                    { icon: <Compass className="h-5 w-5" />, title: "Explorá Experiences", desc: "Reservá tu próxima aventura con un tap" },
                    { icon: <Award className="h-5 w-5" />, title: "Gestioná tus Rewards", desc: "Mirá tus puntos y canjes en tiempo real" },
                  ].map((feat, i) => (
                    <div key={i} className="glass rounded-2xl p-4 flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-500 flex-shrink-0">
                        {feat.icon}
                      </div>
                      <div>
                        <p className="font-black text-white text-sm">{feat.title}</p>
                        <p className="text-xs text-slate-400">{feat.desc}</p>
                      </div>
                      <CheckCircle className="h-5 w-5 text-orange-500 ml-auto flex-shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ════════════════════════════════════════════════════════════
          TRABAJA CON NOSOTROS (Compacto / Menos relevante)
          ════════════════════════════════════════════════════════════ */}
      <section id="trabaja" className="py-12 bg-white relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-orange-50/40 blur-3xl opacity-60" />
          <div className="absolute bottom-0 left-0 w-60 h-60 rounded-full bg-blue-50/40 blur-3xl opacity-60" />
        </div>
        <div className="mx-auto max-w-3xl px-6 text-center relative z-10">
          <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-orange-600 border border-orange-200 bg-orange-50 px-3.5 py-1 rounded-full mb-3.5">
            <Briefcase className="h-3 w-3" />
            Empleo
          </span>
          <h2 className="text-2xl md:text-3xl font-black text-tech-blue leading-tight mb-3">
            {cms.trabajaNosotros?.titulo || DEFAULT_CMS.trabajaNosotros.titulo}
          </h2>
          <p className="text-slate-500 max-w-lg mx-auto text-xs md:text-sm mb-6 leading-relaxed">
            {cms.trabajaNosotros?.subtitulo || DEFAULT_CMS.trabajaNosotros.subtitulo}
          </p>

          {/* Roles grid */}
          <div className="flex flex-wrap gap-2 justify-center mb-6">
            {(cms.trabajaNosotros?.puestos || DEFAULT_CMS.trabajaNosotros.puestos).map(
              (p: string, i: number) => (
                <span
                  key={i}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-500 transition-colors cursor-default"
                >
                  {p}
                </span>
              )
            )}
          </div>

          <button
            onClick={() => {
              setShowJobModal(true);
              setSubmitStatus("idle");
            }}
            className="inline-flex items-center gap-2.5 rounded-2xl bg-tech-blue hover:bg-tech-blue/90 px-6 py-3.5 text-xs font-black text-white shadow-xl shadow-tech-blue/20 transition-all hover:-translate-y-0.5"
          >
            <Briefcase className="h-4 w-4" />
            Postularme Ahora
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          FOOTER
          ════════════════════════════════════════════════════════════ */}
      <footer className="bg-slate-950 text-slate-400 border-t border-slate-900">
        <div className="mx-auto max-w-7xl px-6 pt-16 pb-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-14">
            {/* Brand column */}
            <div className="space-y-5 lg:col-span-1">
              <div className="flex items-center gap-3">
                <div className="bg-white rounded-2xl p-2 inline-block border border-slate-800 flex-shrink-0 shadow-md">
                  <img
                    src="/assets/travelapp_original.svg"
                    alt="TravelApp"
                    className="h-8 w-auto object-contain"
                  />
                </div>
                <div>
                  <span className="font-black text-white text-lg block leading-none">
                    TravelApp
                  </span>
                  <span className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider block mt-1">
                    Ecosistema
                  </span>
                </div>
              </div>
              <p className="text-xs leading-relaxed text-slate-400">
                El ecosistema de viajes más completo de Argentina. Movilidad,
                experiencias y recompensas en un solo lugar.
              </p>
              <div className="flex gap-2.5">
                {cms.redesSociales?.facebook && (
                  <a
                    href={cms.redesSociales.facebook}
                    target="_blank"
                    rel="noreferrer"
                    className="h-9 w-9 rounded-xl bg-slate-850 hover:bg-blue-600 flex items-center justify-center transition-colors border border-slate-800"
                  >
                    <Facebook className="h-4 w-4 text-slate-400 hover:text-white" />
                  </a>
                )}
                {cms.redesSociales?.instagram && (
                  <a
                    href={cms.redesSociales.instagram}
                    target="_blank"
                    rel="noreferrer"
                    className="h-9 w-9 rounded-xl bg-slate-850 hover:bg-pink-650 flex items-center justify-center transition-colors border border-slate-800"
                  >
                    <Instagram className="h-4 w-4 text-slate-400 hover:text-white" />
                  </a>
                )}
                {cms.redesSociales?.linkedin && (
                  <a
                    href={cms.redesSociales.linkedin}
                    target="_blank"
                    rel="noreferrer"
                    className="h-9 w-9 rounded-xl bg-slate-850 hover:bg-blue-750 flex items-center justify-center transition-colors border border-slate-800"
                  >
                    <Linkedin className="h-4 w-4 text-slate-400 hover:text-white" />
                  </a>
                )}
                {cms.redesSociales?.whatsapp && (
                  <a
                    href={cms.redesSociales.whatsapp}
                    target="_blank"
                    rel="noreferrer"
                    className="h-9 w-9 rounded-xl bg-slate-850 hover:bg-green-650 flex items-center justify-center transition-colors border border-slate-800"
                  >
                    <Phone className="h-4 w-4 text-slate-400 hover:text-white" />
                  </a>
                )}
                {cms.redesSociales?.youtube && (
                  <a
                    href={cms.redesSociales.youtube}
                    target="_blank"
                    rel="noreferrer"
                    className="h-9 w-9 rounded-xl bg-slate-850 hover:bg-red-600 flex items-center justify-center transition-colors border border-slate-800"
                  >
                    <Youtube className="h-4 w-4 text-slate-400 hover:text-white" />
                  </a>
                )}
                {cms.redesSociales?.tiktok && (
                  <a
                    href={cms.redesSociales.tiktok}
                    target="_blank"
                    rel="noreferrer"
                    className="h-9 w-9 rounded-xl bg-slate-850 hover:bg-black flex items-center justify-center transition-colors border border-slate-800"
                  >
                    <Tiktok className="h-4 w-4 text-slate-400 hover:text-white" />
                  </a>
                )}
              </div>
            </div>

            {/* Units links */}
            <div>
              <h4 className="text-xs font-black text-white uppercase tracking-wider mb-5">
                Nuestros Servicios
              </h4>
              <ul className="space-y-3 text-xs">
                <li>
                  <a
                    href={getUrl("experience")}
                    className="flex items-center gap-2 hover:text-orange-500 transition-colors"
                  >
                    <img
                      src="/assets/experience_blanco.svg"
                      className="h-4 w-auto opacity-40"
                      alt=""
                    />
                    TravelApp Experience
                  </a>
                </li>
                <li>
                  <a
                    href={getUrl("rewards")}
                    className="flex items-center gap-2 hover:text-orange-500 transition-colors"
                  >
                    <img
                      src="/assets/rewards_blanco.svg"
                      className="h-4 w-auto opacity-40"
                      alt=""
                    />
                    TravelApp Rewards
                  </a>
                </li>
                <li>
                  <a
                    href={getUrl("travelcab")}
                    className="flex items-center gap-2 hover:text-orange-500 transition-colors"
                  >
                    <img
                      src="/assets/travelcab_blanco.svg"
                      className="h-4 w-auto opacity-40"
                      alt=""
                    />
                    TravelCab
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal info */}
            <div>
              <h4 className="text-xs font-black text-white uppercase tracking-wider mb-5">
                Información Legal
              </h4>
              <ul className="space-y-3 text-xs">
                <li className="text-slate-550">
                  {cms.legales?.razonSocial || DEFAULT_CMS.legales.razonSocial}
                </li>
                <li className="text-slate-550">
                  CUIT: {cms.legales?.cuit || DEFAULT_CMS.legales.cuit}
                </li>
                <li className="text-slate-550">
                  {cms.legales?.domicilio || DEFAULT_CMS.legales.domicilio}
                </li>
                <li>
                  <button
                    onClick={() =>
                      setLegalModal({
                        title: "Términos y Condiciones",
                        content:
                          cms.legales?.terminos || DEFAULT_CMS.legales.terminos,
                      })
                    }
                    className="hover:text-white transition-colors text-left"
                  >
                    Términos y Condiciones
                  </button>
                </li>
                <li>
                  <button
                    onClick={() =>
                      setLegalModal({
                        title: "Política de Privacidad",
                        content:
                          cms.legales?.privacidad ||
                          DEFAULT_CMS.legales.privacidad,
                      })
                    }
                    className="hover:text-white transition-colors text-left"
                  >
                    Política de Privacidad
                  </button>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-xs font-black text-white uppercase tracking-wider mb-5">
                Contacto
              </h4>
              <ul className="space-y-3 text-xs">
                <li>
                  <a
                    href={
                      cms.redesSociales?.whatsapp ||
                      DEFAULT_CMS.redesSociales.whatsapp
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-orange-500 hover:text-orange-400 transition-colors font-bold"
                  >
                    <Phone className="h-3.5 w-3.5" /> WhatsApp
                  </a>
                </li>
                <li>
                  <a
                    href="tel:08102200018"
                    className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors font-semibold"
                  >
                    <Phone className="h-3.5 w-3.5 text-orange-500" /> 0810-220-0018
                  </a>
                </li>
                <li>
                  <a
                    href="mailto:hola@travelapp.ar"
                    className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors font-semibold"
                  >
                    <Mail className="h-3.5 w-3.5 text-orange-500" /> hola@travelapp.ar
                  </a>
                </li>
                <li>
                  <button
                    onClick={() => {
                      setShowJobModal(true);
                      setSubmitStatus("idle");
                    }}
                    className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-left"
                  >
                    <Briefcase className="h-3.5 w-3.5" /> Trabajá con Nosotros
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-600">
            <p className="order-2 md:order-1 text-center md:text-left">
              © 2026{" "}
              {cms.legales?.razonSocial || DEFAULT_CMS.legales.razonSocial} —
              Todos los derechos reservados.
            </p>
            <div className="order-1 md:order-2 flex flex-wrap items-center justify-center gap-4">
              <RenderLegalSeal content={cms.sellosLegales?.arcaQr} alt="ARCA" />
              <RenderLegalSeal content={cms.sellosLegales?.baseDatosSello} alt="Base de Datos" />
            </div>
            <div className="order-3 flex gap-5">
              <button
                onClick={() =>
                  setLegalModal({
                    title: "Términos y Condiciones",
                    content:
                      cms.legales?.terminos || DEFAULT_CMS.legales.terminos,
                  })
                }
                className="hover:text-slate-300 transition-colors"
              >
                Términos de Servicio
              </button>
              <button
                onClick={() =>
                  setLegalModal({
                    title: "Política de Privacidad",
                    content:
                      cms.legales?.privacidad || DEFAULT_CMS.legales.privacidad,
                  })
                }
                className="hover:text-slate-300 transition-colors"
              >
                Privacidad
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* ════════════════════════════════════════════════════════════
          MODAL: UNIT DETAIL
          ════════════════════════════════════════════════════════════ */}
      {activeUnitModal && (() => {
        const cfg = UNIT_CONFIG[activeUnitModal.id];
        const modalImg = activeUnitModal.imagenUrl || activeUnitModal.imageUrl;
        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm"
            onClick={() => setActiveUnitModal(null)}
          >
            <div
              className="w-full max-w-xl rounded-3xl bg-white shadow-2xl overflow-hidden"
              style={{ animation: "scaleIn 0.35s ease-out" }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header image */}
              <div className="relative h-52 overflow-hidden">
                <img
                  src={modalImg}
                  alt={activeUnitModal.nombre}
                  className="w-full h-full object-cover"
                />
                <div
                  className={`absolute inset-0 bg-gradient-to-t ${cfg?.gradientFrom} ${cfg?.gradientTo} opacity-80`}
                />
                <button
                  onClick={() => setActiveUnitModal(null)}
                  className="absolute top-4 right-4 h-9 w-9 rounded-full bg-white/15 border border-white/20 text-white flex items-center justify-center backdrop-blur-sm"
                >
                  <X className="h-5 w-5" />
                </button>
                <div className="absolute bottom-5 left-6">
                  {cfg && (
                    <img
                      src={cfg.logoBlanco}
                      alt={activeUnitModal.nombre}
                      className="h-10 w-auto"
                    />
                  )}
                </div>
              </div>
              {/* Body */}
              <div className="p-8">
                <h3 className="text-2xl font-black text-tech-blue mb-4">
                  {activeUnitModal.nombre}
                </h3>
                <p className="text-slate-600 leading-relaxed text-sm mb-7">
                  {activeUnitModal.descripcionExtendida}
                </p>
                {cfg && (
                  <a
                    href={getUrl(activeUnitModal.id)}
                    className="inline-flex items-center gap-2 rounded-xl px-7 py-3 text-sm font-black text-white transition-all hover:opacity-90 hover:shadow-lg"
                    style={{ backgroundColor: cfg.color }}
                  >
                    Ir a la Plataforma
                    <ArrowRight className="h-4 w-4" />
                  </a>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ════════════════════════════════════════════════════════════
          MODAL: JOB APPLICATION
          ════════════════════════════════════════════════════════════ */}
      {showJobModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-8 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div
            className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl mb-8"
            style={{ animation: "scaleIn 0.35s ease-out" }}
          >
            {/* Modal header */}
            <div className="relative bg-tech-blue rounded-t-3xl p-8 text-white overflow-hidden">
              <div className="absolute inset-0 pointer-events-none">
                <div className="anim-glow absolute -top-16 -right-16 h-56 w-56 rounded-full blur-3xl" style={{ background: "rgba(132,204,22,0.15)" }} />
              </div>
              <button
                onClick={resetJobModal}
                className="absolute top-5 right-5 h-9 w-9 rounded-full bg-white/10 border border-white/20 flex items-center justify-center"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="relative">
                <span className="text-[10px] font-black uppercase tracking-widest text-orange-500">
                  Postulaciones Abiertas
                </span>
                <h3 className="text-2xl font-black mt-1 leading-snug">
                  {cms.trabajaNosotros?.titulo ||
                    DEFAULT_CMS.trabajaNosotros.titulo}
                </h3>
                <p className="text-sm text-slate-300 mt-2">
                  Completá el formulario y nuestro equipo de RRHH se pondrá en contacto con vos.
                </p>
              </div>
            </div>

            {/* Success state */}
            {submitStatus === "success" ? (
              <div className="p-12 text-center">
                <div className="h-20 w-20 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-5">
                  <CheckCircle className="h-11 w-11 text-orange-500" />
                </div>
                <h4 className="text-2xl font-black text-tech-blue mb-3">
                  ¡Postulación Recibida!
                </h4>
                <p className="text-slate-500 text-sm mb-8 max-w-sm mx-auto">
                  Tu CV fue enviado exitosamente al equipo de RRHH. Te
                  contactaremos a la brevedad. ¡Gracias por tu interés en
                  TravelApp!
                </p>
                <button
                  onClick={resetJobModal}
                  className="rounded-2xl bg-tech-blue text-white px-8 py-3 text-sm font-black hover:bg-tech-blue/90 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            ) : (
              /* Form */
              <form onSubmit={handleJobSubmit} className="p-8 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-slate-600 mb-1.5">
                      Nombre *
                    </label>
                    <input
                      required
                      type="text"
                      value={jobForm.nombre}
                      onChange={(e) =>
                        setJobForm((p) => ({ ...p, nombre: e.target.value }))
                      }
                      placeholder="Tu nombre"
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:border-tech-blue/40 focus:ring-2 focus:ring-tech-blue/10 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-600 mb-1.5">
                      Apellido *
                    </label>
                    <input
                      required
                      type="text"
                      value={jobForm.apellido}
                      onChange={(e) =>
                        setJobForm((p) => ({ ...p, apellido: e.target.value }))
                      }
                      placeholder="Tu apellido"
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:border-tech-blue/40 focus:ring-2 focus:ring-tech-blue/10 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-600 mb-1.5">
                      Email *
                    </label>
                    <input
                      required
                      type="email"
                      value={jobForm.email}
                      onChange={(e) =>
                        setJobForm((p) => ({ ...p, email: e.target.value }))
                      }
                      placeholder="tu@email.com"
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:border-tech-blue/40 focus:ring-2 focus:ring-tech-blue/10 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-600 mb-1.5">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      value={jobForm.telefono}
                      onChange={(e) =>
                        setJobForm((p) => ({ ...p, telefono: e.target.value }))
                      }
                      placeholder="+54 381..."
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:border-tech-blue/40 focus:ring-2 focus:ring-tech-blue/10 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-600 mb-1.5">
                    Área de Interés *
                  </label>
                  <select
                    required
                    value={jobForm.puesto}
                    onChange={(e) =>
                      setJobForm((p) => ({ ...p, puesto: e.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:border-tech-blue/40 focus:ring-2 focus:ring-tech-blue/10 transition-all"
                  >
                    <option value="">Seleccioná el área...</option>
                    {(
                      cms.trabajaNosotros?.puestos ||
                      DEFAULT_CMS.trabajaNosotros.puestos
                    ).map((p: string) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-600 mb-1.5">
                    ¿Por qué querés sumarte al equipo? *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={jobForm.mensaje}
                    onChange={(e) =>
                      setJobForm((p) => ({ ...p, mensaje: e.target.value }))
                    }
                    placeholder="Contanos sobre tu experiencia y por qué te gustaría trabajar con nosotros..."
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm resize-none focus:outline-none focus:border-tech-blue/40 focus:ring-2 focus:ring-tech-blue/10 transition-all"
                  />
                </div>

                {/* CV Upload dropzone */}
                <div>
                  <label className="block text-[10px] font-black text-slate-600 mb-1.5">
                    Curriculum Vitae (PDF o DOCX · máx. 5MB) *
                  </label>
                  <label
                    className={`flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-7 cursor-pointer transition-all ${
                      cvFile
                        ? "border-orange-500 bg-orange-50"
                        : "border-slate-200 bg-slate-50 hover:border-tech-blue/35 hover:bg-slate-100"
                    }`}
                  >
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        if (f.size > 5 * 1024 * 1024) {
                          alert("El archivo no puede superar 5MB.");
                          return;
                        }
                        setCvFile(f);
                      }}
                    />
                    {cvFile ? (
                      <>
                        <CheckCircle className="h-9 w-9 text-orange-500" />
                        <div className="text-center">
                          <p className="text-sm font-black text-orange-700">
                            {cvFile.name}
                          </p>
                          <p className="text-xs text-orange-600 mt-1">
                            {(cvFile.size / 1024).toFixed(1)} KB · Hacé click
                            para cambiar
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <Upload className="h-9 w-9 text-slate-400" />
                        <div className="text-center">
                          <p className="text-sm font-bold text-slate-600">
                            Arrastrá o hacé click para subir tu CV
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            PDF, DOC o DOCX · Máximo 5MB
                          </p>
                        </div>
                      </>
                    )}
                  </label>
                </div>

                {/* Upload progress */}
                {isSubmitting && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-semibold text-slate-600">
                      <span>Subiendo CV a Firebase Storage...</span>
                      <span>{Math.round(uploadProgress)}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-tech-blue rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Error state */}
                {submitStatus === "error" && (
                  <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600 font-semibold">
                    ❌ Hubo un error al enviar. Por favor intentá nuevamente.
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting || !cvFile}
                  className="w-full rounded-2xl bg-tech-blue hover:bg-tech-blue/90 disabled:opacity-55 disabled:cursor-not-allowed py-4 text-sm font-black text-white flex items-center justify-center gap-2 transition-all hover:scale-[1.02] shadow-xl shadow-tech-blue/20"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Enviando Postulación...
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5" />
                      Enviar Postulación
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Legal Modal */}
      {legalModal && (
        <LegalModal
          title={legalModal.title}
          content={legalModal.content}
          onClose={() => setLegalModal(null)}
        />
      )}

      {/* History Modal (Misión, Visión, Valores) */}
      {historyModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn"
          onClick={() => setHistoryModal(null)}
        >
          <div
            className="w-full max-w-lg rounded-3xl bg-white shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: "scaleIn 0.3s ease-out" }}
          >
            <div className="bg-tech-blue text-white p-6 flex items-center justify-between" style={{ backgroundColor: '#ff6b00' }}>
              <h3 className="font-black text-lg">{historyModal.title}</h3>
              <button
                onClick={() => setHistoryModal(null)}
                className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-8 text-slate-600 leading-relaxed max-h-[50vh] overflow-y-auto font-medium text-sm">
              {historyModal.text}
            </div>
            <div className="p-4 bg-slate-55 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setHistoryModal(null)}
                className="rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-2.5 text-xs font-black transition-all cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🤖 Travis Chat Web Widget (Flotante Omnicanal) */}
      <TravisOmnichannelWidget 
        businessUnit="General" 
        whatsappUrl={cms.hero?.whatsappUrl || "https://wa.me/5493814188106"}
        messengerUrl={cms.socials?.messenger || "https://m.me/travelapp"}
        instagramUrl={cms.socials?.instagram || "https://instagram.com/travelapp.ar"}
        primaryColor="#ff6b00"
        brandName="TravelApp Ecosistema"
        isOpenExternal={showTravisChat}
        onCloseExternal={() => setShowTravisChat(false)}
      />
    </div>
  );
}
