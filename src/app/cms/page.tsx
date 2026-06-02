'use client';

import React, { useState, useEffect } from 'react';
import { 
  FileText, Save, Image, Link as LinkIcon, Shield, Sparkles, 
  Trash2, Plus, ArrowRight, Eye, CheckCircle2, AlertCircle, RefreshCw,
  Upload, X, HelpCircle
} from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Helper function to compress images using Canvas to bypass Firestore 1MB limits
const compressImage = (file: File, maxWidth = 800, maxHeight = 600, quality = 0.7): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        const compressedBase64 = canvas.toDataURL("image/jpeg", quality);
        resolve(compressedBase64);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

// Optimized text input component to prevent typing lag by maintaining local state
const CMSInput = ({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  className
}: {
  label?: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  type?: string;
  className?: string;
}) => {
  const [localVal, setLocalVal] = useState(value);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      setLocalVal(value);
    }
  }, [value, isFocused]);

  return (
    <div className="w-full">
      {label && <label className="block text-xs font-bold text-slate-600 mb-1.5">{label}</label>}
      <input
        type={type}
        value={localVal || ''}
        onChange={(e) => setLocalVal(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => {
          setIsFocused(false);
          onChange(localVal);
        }}
        placeholder={placeholder}
        className={className || "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none"}
      />
    </div>
  );
};

// Optimized textarea component to prevent typing lag by maintaining local state
const CMSTextarea = ({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
  className
}: {
  label?: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
}) => {
  const [localVal, setLocalVal] = useState(value);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      setLocalVal(value);
    }
  }, [value, isFocused]);

  return (
    <div className="w-full">
      {label && <label className="block text-xs font-bold text-slate-600 mb-1.5">{label}</label>}
      <textarea
        rows={rows}
        value={localVal || ''}
        onChange={(e) => setLocalVal(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => {
          setIsFocused(false);
          onChange(localVal);
        }}
        placeholder={placeholder}
        className={className || "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none"}
      />
    </div>
  );
};

const DEFAULT_CMS_DATA = {
  pasajeroHero: {
    badge: "✓ EL ESTÁNDAR MÁS ALTO EN MOVILIDAD URBANA",
    title: "La Ciudad a tu Ritmo",
    subtitle: "Viajes urbanos premium con el soporte local más confiable. Disfruta de seguridad monitoreada 24/7, choferes profesionales certificados y la tarifa más justa del mercado.",
    backgroundImage: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=1920&q=80",
    opacity: 55
  },
  conductorHero: {
    badge: "✓ ÚNETE A LA RED DE MOVILIDAD MÁS GRANDE DE TUCUMÁN",
    title: "Conduce y Gana Bajo tus Propios Términos",
    subtitle: "Sé tu propio jefe y maximiza tus ingresos reales con el modelo híbrido único. Retén el 100% de tus viajes con una membresía fija o paga una baja comisión por viaje.",
    backgroundImage: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1920&q=80",
    ctaText: "Registrarme como Conductor",
    opacity: 55
  },
  servicios: [
    {
      id: "standard",
      name: "TravelCab Standard",
      description: "Sedán moderno, climatizado, ideal para tus traslados diarios de forma rápida.",
      subTag: "Servicio Urbano",
      ctaText: "Cotizar Standard",
      eta: "3 - 5 min",
      imageUrl: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=600&q=80"
    },
    {
      id: "premium",
      name: "TravelCab Premium",
      description: "Auto de gama alta, máximo confort, chofer corporativo bilingüe y espacio extra.",
      subTag: "Servicio Corporativo",
      ctaText: "Cotizar Premium",
      eta: "2 - 4 min",
      imageUrl: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=600&q=80"
    }
  ],
  tiposTrabajo: {
    title: "Elige tu Esquema de Trabajo",
    subtitle: "Un modelo adaptado a cada ritmo de vida, garantizando transparencia total.",
    comisionTitulo: "Esquema por Comisión",
    comisionTexto: "Paga únicamente un 15% de comisión por viaje realizado. Ideal para conductores eventuales que buscan ingresos complementarios.",
    membresiaTitulo: "Membresía Fija",
    membresiaTexto: "Retén el 100% del valor de tus viajes pagando una suscripción mensual plana. Excelente para choferes de dedicación completa."
  },
  resumenRewards: {
    title: "Tus Viajes Tienen Premio",
    subtitle: "Acumula puntos automáticamente en cada trayecto que realizas. Canjéalos por viajes gratis, prioridades y beneficios en todo el ecosistema de TravelApp.",
    pointsText: "300 pts de Bienvenida",
    badgeText: "PROGRAMA REWARDS",
    imageUrl: "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=800&q=80"
  },
  redesSociales: {
    facebook: "https://facebook.com/travelcab",
    instagram: "https://instagram.com/travelcab.ar",
    messenger: "https://m.me/travelcab",
    whatsapp: "https://wa.me/5493814188106"
  },
  sellosLegales: {
    arcaQrUrl: "https://www.afip.gob.ar/images/f960/DATAWEB.jpg",
    baseDatosSelloUrl: "https://www.argentina.gob.ar/sites/default/files/aaip-logo-sello.png"
  },
  faq: {
    title: "Preguntas Frecuentes",
    subtitle: "Todo lo que necesitas saber sobre el servicio de movilidad premium",
    items: [
      {
        question: "¿Cómo funciona el Despachador Web Inteligente?",
        answer: "El despachador te permite ingresar origen y destino, calcular una tarifa estimada instantáneamente y elegir tu categoría. Al confirmar, te redirigirá a WhatsApp con un mensaje pre-configurado para que nuestra central asigne el chofer más cercano en segundos."
      },
      {
        question: "¿Qué es el 'Modelo Híbrido' para conductores (Membresía vs. Comisión)?",
        answer: "Es un esquema flexible único. Como conductor, puedes optar por pagar una membresía mensual fija (retienes el 100% del valor de tus viajes) o bien operar bajo el esquema tradicional de comisión baja (15%) por cada traslado realizado."
      },
      {
        question: "¿Qué métodos de pago puedo utilizar?",
        answer: "Ofrecemos flexibilidad total. Puedes abonar en efectivo directo al chofer, realizar transferencias instantáneas mediante Mercado Pago o billeteras virtuales, o registrar de forma segura tarjetas de débito/crédito corporativas."
      },
      {
        question: "¿Cómo se garantiza la seguridad de mi viaje?",
        answer: "Todos nuestros traslados son monitoreados satelitalmente las 24 horas. Además, nuestros choferes pasan por rigurosas pruebas de antecedentes penales, análisis psicofísicos y validación de vehículos de forma presencial."
      },
      {
        question: "¿Qué requisitos debe cumplir un vehículo para ser aceptado?",
        answer: "El vehículo debe ser modelo 2018 o posterior, contar con 4 puertas, aire acondicionado en óptimas condiciones, seguro comercial al día y pasar una revisión técnica e higiénica presencial en nuestras oficinas locales."
      },
      {
        question: "¿Ofrecen soluciones de movilidad corporativa para empresas?",
        answer: "Sí, contamos con un área dedicada para cuentas corporativas. Ofrecemos facturación mensual unificada, paneles de control para administrar traslados del personal y tarifas corporativas especiales."
      },
      {
        question: "¿Cómo funciona el sistema de Puntos Rewards?",
        answer: "Cada kilómetro recorrido en TravelCab acumula puntos automáticamente en tu perfil del ecosistema. Estos puntos pueden ser canjeados por descuentos en tus próximos viajes o beneficios exclusivos con partners."
      },
      {
        question: "¿Qué es el servicio de Auto Rural Compartido (ARC)?",
        answer: "ARC es una alternativa económica diseñada para viajes interurbanos o rurales. Permite a varios pasajeros compartir un mismo trayecto planificado, reduciendo el costo del viaje hasta en un 35% por persona."
      },
      {
        question: "¿Quién es la IA 'Travis' y cómo me ayuda?",
        answer: "Travis es nuestro asistente virtual inteligente disponible las 24 horas en WhatsApp. Está capacitado para cotizar tarifas, responder dudas sobre los servicios y guiar de forma rápida a los conductores en su proceso de registro."
      },
      {
        question: "¿Los conductores reciben capacitación antes de empezar?",
        answer: "Absolutamente. Todos los choferes de la red completan de manera obligatoria una inducción integral en servicio de atención premium al cliente, normas de seguridad vial, conducción defensiva y uso del despachador digital."
      }
    ]
  },
  legales: {
    quienesSomos: "### Quiénes Somos en TravelCab\n\nSomos una empresa de movilidad y transporte premium nacida con la misión de conectar a personas con choferes altamente calificados de forma segura, puntual y transparente.\n\nContamos con un soporte local dedicado las 24 horas y soporte inteligente de IA a través de Travis en WhatsApp. Creemos en esquemas justos para nuestros conductores asociados a través de nuestro modelo híbrido de comisión o membresía fija y en premiar la fidelidad de nuestros usuarios con el sistema Rewards.",
    terminosCondiciones: "### Términos y Condiciones Generales de Uso de TravelCab\n\nBienvenido a TravelCab. Al acceder y utilizar nuestros servicios de transporte y movilidad, usted acepta de manera incondicional estar sujeto a los siguientes términos y condiciones de uso:\n\n1. **Naturaleza del Servicio:** TravelCab es una plataforma de tecnología de movilidad premium que conecta a pasajeros con choferes profesionales locales.\n2. **Uso de la Plataforma:** El usuario se compromete a hacer uso de los traslados y el despachador web únicamente con fines lícitos. Queda terminantemente prohibido cualquier tipo de conducta que atente contra la seguridad del chofer o la flota.\n3. **Tarifas y Estimaciones:** Las tarifas visualizadas en el Despachador Inteligente son estimaciones y pueden ser modificadas por tráfico congestionado, horarios especiales o condiciones climáticas adversas.\n4. **Monitoreo Satelital:** Con fines de seguridad, todos los trayectos son grabados y geolocalizados en tiempo real por nuestra central operativa de seguridad 24/7.",
    politicasPrivacidad: "### Políticas de Privacidad y Protección de Datos Personales\n\nEn TravelCab estamos plenamente comprometidos con el resguardo, confidencialidad y protección de los datos de nuestros pasajeros y conductores. Al registrarse en la plataforma, usted acepta el tratamiento de su información conforme a lo siguiente:\n\n1. **Recolección de Información:** Al registrarse como pasajero o conductor, almacenamos sus datos personales identificativos (Nombre, Apellido, Email, Teléfono, Ubicación y en el caso de conductores, licencias y habilitaciones oficiales).\n2. **Uso del Perfil y Gamificación:** Los datos provistos por los pasajeros se utilizan para habilitar su cuenta y el programa de fidelización Rewards, otorgando el incentivo inicial de 300 puntos más 150 puntos extra al completar su fotografía de perfil.\n3. **Uso de las Imágenes:** La foto de perfil cargada se almacena únicamente con fines de verificación de identidad del pasajero para asegurar traslados tranquilos para toda la flota.\n4. **No divulgación:** TravelCab garantiza que en ningún caso comercializará o transferirá sus datos de carácter personal a terceras empresas sin su expreso consentimiento escrito previo."
  }
};

type ActiveTab = 'hero' | 'servicios' | 'conductores' | 'rewards' | 'faq' | 'legales';

export default function CMSPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('hero');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Cargar datos actuales de Firestore
  useEffect(() => {
    async function loadData() {
      try {
        const docRef = doc(db, 'cms', 'landing_travelcab');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setData({
            ...DEFAULT_CMS_DATA,
            ...docSnap.data()
          });
        } else {
          setData(DEFAULT_CMS_DATA);
        }
      } catch (err) {
        console.error("Error al leer CMS de Firestore:", err);
        setData(DEFAULT_CMS_DATA);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setStatusMsg(null);
    try {
      const docRef = doc(db, 'cms', 'landing_travelcab');
      await setDoc(docRef, data);
      setStatusMsg({ type: 'success', text: '¡Cambios guardados e implementados en tiempo real!' });
      setTimeout(() => setStatusMsg(null), 5000);
    } catch (err: any) {
      console.error("Error al guardar CMS en Firestore:", err);
      setStatusMsg({ type: 'error', text: `Error al guardar: ${err.message}` });
    } finally {
      setSaving(false);
    }
  };

  const updateField = (section: string, field: string, value: any) => {
    setData((prev: any) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const updateService = (idx: number, field: string, value: any) => {
    const updated = [...data.servicios];
    updated[idx] = { ...updated[idx], [field]: value };
    setData((prev: any) => ({ ...prev, servicios: updated }));
  };

  const deleteService = (idx: number) => {
    const updated = data.servicios.filter((_: any, i: number) => i !== idx);
    setData((prev: any) => ({ ...prev, servicios: updated }));
  };

  const addService = () => {
    const newSvc = {
      id: `service_${Date.now()}`,
      name: "Nueva Categoría",
      description: "Descripción de la categoría de transporte y comodidades del sedán.",
      subTag: "Servicio Premium",
      ctaText: "Cotizar Ahora",
      eta: "4 - 7 min",
      imageUrl: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=600&q=80"
    };
    setData((prev: any) => ({
      ...prev,
      servicios: [...prev.servicios, newSvc]
    }));
  };

  // Funciones específicas para FAQ
  const updateFaq = (idx: number, field: string, value: any) => {
    const items = [...data.faq.items];
    items[idx] = { ...items[idx], [field]: value };
    setData((prev: any) => ({
      ...prev,
      faq: {
        ...prev.faq,
        items
      }
    }));
  };

  const deleteFaq = (idx: number) => {
    const items = data.faq.items.filter((_: any, i: number) => i !== idx);
    setData((prev: any) => ({
      ...prev,
      faq: {
        ...prev.faq,
        items
      }
    }));
  };

  const addFaq = () => {
    const newFaq = {
      question: "¿Nueva Pregunta Frecuente?",
      answer: "Detalle o respuesta de la pregunta frecuente editable."
    };
    setData((prev: any) => ({
      ...prev,
      faq: {
        ...prev.faq,
        items: [...prev.faq.items, newFaq]
      }
    }));
  };

  // Componente de entrada reutilizable con opción de URL o Subida local (Base64)
  const ImageUploaderInput = ({ label, section, field, value }: { label: string; section: string; field: string; value: string }) => {
    const [localVal, setLocalVal] = useState(value);
    useEffect(() => {
      setLocalVal(value);
    }, [value]);

    return (
      <div className="space-y-1.5 bg-slate-50/50 p-3 rounded-xl border border-slate-200/50">
        <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wide">{label}</label>
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={localVal || ''}
              onChange={(e) => setLocalVal(e.target.value)}
              onBlur={() => updateField(section, field, localVal)}
              placeholder="Ingresa la URL de la foto..."
              className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-xs bg-white focus:outline-none"
            />
            <label className="flex cursor-pointer items-center justify-center gap-1 text-[11px] font-bold text-tech-blue border border-tech-blue bg-white hover:bg-tech-blue/5 px-3 py-2 rounded-lg transition-all shadow-sm">
              <Upload className="h-3.5 w-3.5" />
              Subir Archivo
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    try {
                      const compressed = await compressImage(file);
                      updateField(section, field, compressed);
                      setLocalVal(compressed);
                    } catch (err) {
                      console.error("Error compressing image, falling back to original:", err);
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        updateField(section, field, reader.result as string);
                        setLocalVal(reader.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }
                }}
              />
            </label>
          </div>
          {value && (
            <div className="relative w-24 h-16 rounded-lg border border-slate-200 overflow-hidden bg-slate-100 flex-shrink-0 group">
              <img src={value} alt="Preview" className="w-full h-full object-cover" />
              <button 
                type="button" 
                onClick={() => updateField(section, field, '')}
                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const ServiceImageUploader = ({ idx, value }: { idx: number; value: string }) => {
    const [localVal, setLocalVal] = useState(value);
    useEffect(() => {
      setLocalVal(value);
    }, [value]);

    return (
      <div className="space-y-1">
        <label className="block text-[10px] font-bold text-slate-500">Imagen de la Categoría</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={localVal || ''}
            onChange={(e) => setLocalVal(e.target.value)}
            onBlur={() => updateService(idx, 'imageUrl', localVal)}
            placeholder="Pegar URL de la imagen..."
            className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-[11px] bg-white focus:outline-none"
          />
          <label className="flex cursor-pointer items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-semibold text-slate-600 shadow-sm hover:bg-slate-50 transition-colors">
            <Upload className="h-3 w-3" />
            Subir
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) {
                  try {
                    const compressed = await compressImage(file);
                    updateService(idx, 'imageUrl', compressed);
                    setLocalVal(compressed);
                  } catch (err) {
                    console.error("Error compressing service image, falling back to original:", err);
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      updateService(idx, 'imageUrl', reader.result as string);
                      setLocalVal(reader.result as string);
                    };
                    reader.readAsDataURL(file);
                  }
                }
              }}
            />
          </label>
        </div>
      </div>
    );
  };

  const ServiceInput = ({ label, value, idx, field, placeholder, className }: { label: string; value: string; idx: number; field: string; placeholder?: string; className?: string }) => {
    const [localVal, setLocalVal] = useState(value);
    const [isFocused, setIsFocused] = useState(false);

    useEffect(() => {
      if (!isFocused) {
        setLocalVal(value);
      }
    }, [value, isFocused]);

    return (
      <div>
        <label className="block text-[10px] font-bold text-slate-500 mb-1">{label}</label>
        <input
          type="text"
          value={localVal || ''}
          placeholder={placeholder}
          onChange={(e) => setLocalVal(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
            updateService(idx, field, localVal);
          }}
          className={className || "w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs bg-white focus:outline-none"}
        />
      </div>
    );
  };

  const FaqInput = ({ label, value, idx, field }: { label: string; value: string; idx: number; field: string }) => {
    const [localVal, setLocalVal] = useState(value);
    const [isFocused, setIsFocused] = useState(false);

    useEffect(() => {
      if (!isFocused) {
        setLocalVal(value);
      }
    }, [value, isFocused]);

    return (
      <div>
        <label className="block text-[10px] font-bold text-slate-500 mb-1">{label}</label>
        <input
          type="text"
          value={localVal || ''}
          onChange={(e) => setLocalVal(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
            updateFaq(idx, field, localVal);
          }}
          className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs bg-white focus:outline-none"
        />
      </div>
    );
  };

  const FaqTextarea = ({ label, value, idx, field }: { label: string; value: string; idx: number; field: string }) => {
    const [localVal, setLocalVal] = useState(value);
    const [isFocused, setIsFocused] = useState(false);

    useEffect(() => {
      if (!isFocused) {
        setLocalVal(value);
      }
    }, [value, isFocused]);

    return (
      <div>
        <label className="block text-[10px] font-bold text-slate-500 mb-1">{label}</label>
        <textarea
          rows={3}
          value={localVal || ''}
          onChange={(e) => setLocalVal(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
            updateFaq(idx, field, localVal);
          }}
          className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs bg-white focus:outline-none"
        />
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center bg-slate-50 p-12 text-slate-500">
        <RefreshCw className="h-8 w-8 animate-spin text-tech-blue mb-3" />
        <p className="text-sm font-semibold tracking-wide">Cargando base de datos del CMS...</p>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col bg-slate-50 p-6 overflow-y-auto">
      
      {/* HEADER DEL CMS */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-tech-blue flex items-center gap-2">
            <FileText className="h-7 w-7 text-tech-blue" />
            Editor CMS — TravelCab Landing
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Administra visualmente y en tiempo real el contenido de tu Landing Page sin modificar código.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/landing/travelcab"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm hover:bg-slate-50 transition-all"
          >
            <Eye className="h-4 w-4" />
            Previsualizar Landing
          </a>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-lg bg-tech-blue px-5 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
            style={{ backgroundColor: '#ff6b00' }}
          >
            {saving ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" /> Guardando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" /> Guardar Cambios
              </>
            )}
          </button>
        </div>
      </div>

      {/* MENSAJES DE ESTADO */}
      {statusMsg && (
        <div className={`mb-6 rounded-xl border p-4 flex items-start gap-3 shadow-sm animate-fadeIn ${
          statusMsg.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {statusMsg.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
          )}
          <div>
            <p className="font-bold text-sm">{statusMsg.type === 'success' ? 'Éxito' : 'Error'}</p>
            <p className="text-xs mt-0.5">{statusMsg.text}</p>
          </div>
        </div>
      )}

      {/* PESTAÑAS DE EDICIÓN */}
      <div className="flex border-b border-slate-200 overflow-x-auto gap-2 bg-white px-4 pt-3 rounded-t-xl">
        {(['hero', 'servicios', 'conductores', 'rewards', 'faq', 'legales'] as ActiveTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all whitespace-nowrap ${
              activeTab === tab 
                ? 'border-tech-blue text-tech-blue bg-slate-50/50' 
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-200'
            }`}
          >
            {tab === 'hero' && '1. Heros y Portada'}
            {tab === 'servicios' && '2. Servicios & Categorías'}
            {tab === 'conductores' && '3. Híbrido Conductor'}
            {tab === 'rewards' && '4. Resumen Rewards'}
            {tab === 'faq' && '5. FAQ (Preguntas Frecuentes)'}
            {tab === 'legales' && '6. Legales & Redes'}
          </button>
        ))}
      </div>

      {/* CUERPO DEL EDITOR */}
      <div className="bg-white border border-slate-200 border-t-0 p-6 rounded-b-xl shadow-sm space-y-6">
        
        {/* PESTAÑA: HEROES */}
        {activeTab === 'hero' && (
          <div className="space-y-8">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-1.5">
                <Sparkles className="h-5 w-5 text-vial-orange" />
                Hero de Portada: Vista Pasajeros (Usuarios)
              </h3>
              <p className="text-xs text-slate-400 mt-1">Este bloque se muestra al cargar la landing con el enfoque en usuarios de pasajeros.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <CMSInput
                  label="Badge Superior"
                  value={data.pasajeroHero?.badge || ''}
                  onChange={(val) => updateField('pasajeroHero', 'badge', val)}
                />
              </div>
              <div>
                <CMSInput
                  label="Título Principal"
                  value={data.pasajeroHero?.title || ''}
                  onChange={(val) => updateField('pasajeroHero', 'title', val)}
                />
              </div>
              <div className="md:col-span-2">
                <CMSTextarea
                  label="Subtítulo Descriptivo"
                  rows={2}
                  value={data.pasajeroHero?.subtitle || ''}
                  onChange={(val) => updateField('pasajeroHero', 'subtitle', val)}
                />
              </div>
              <div className="md:col-span-2">
                <ImageUploaderInput 
                  label="Imagen de Fondo Pasajeros" 
                  section="pasajeroHero" 
                  field="backgroundImage" 
                  value={data.pasajeroHero?.backgroundImage || ''} 
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-600 mb-1.5 flex justify-between">
                  <span>Opacidad de la Capa Oscura (Transparencia)</span>
                  <span className="text-tech-blue font-black">{data.pasajeroHero?.opacity !== undefined ? data.pasajeroHero.opacity : 55}%</span>
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="10"
                    max="90"
                    value={data.pasajeroHero?.opacity !== undefined ? data.pasajeroHero.opacity : 55}
                    onChange={(e) => updateField('pasajeroHero', 'opacity', Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-tech-blue"
                  />
                  <span className="text-xs text-slate-400 font-bold min-w-[70px]">
                    {Number(data.pasajeroHero?.opacity || 55) <= 35 ? 'Muy Claro' : Number(data.pasajeroHero?.opacity || 55) >= 70 ? 'Muy Oscuro' : 'Equilibrado'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Un porcentaje menor hace que la imagen de fondo sea más visible, pero ten cuidado de que los textos en blanco sigan siendo legibles.</p>
              </div>
            </div>

            <div className="border-b border-slate-100 pb-4 pt-4">
              <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-1.5">
                <Sparkles className="h-5 w-5 text-vial-orange" />
                Hero de Portada: Vista Conductores (Socios)
              </h3>
              <p className="text-xs text-slate-400 mt-1">Este bloque se muestra de forma dedicada cuando la página se filtra por conductor.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <CMSInput
                  label="Badge Conductor"
                  value={data.conductorHero?.badge || ''}
                  onChange={(val) => updateField('conductorHero', 'badge', val)}
                />
              </div>
              <div>
                <CMSInput
                  label="Título Conductor"
                  value={data.conductorHero?.title || ''}
                  onChange={(val) => updateField('conductorHero', 'title', val)}
                />
              </div>
              <div className="md:col-span-2">
                <CMSTextarea
                  label="Subtítulo Conductor"
                  rows={2}
                  value={data.conductorHero?.subtitle || ''}
                  onChange={(val) => updateField('conductorHero', 'subtitle', val)}
                />
              </div>
              <div>
                <CMSInput
                  label="Texto Llamado a Acción (CTA)"
                  value={data.conductorHero?.ctaText || ''}
                  onChange={(val) => updateField('conductorHero', 'ctaText', val)}
                />
              </div>
              <div className="md:col-span-2">
                <ImageUploaderInput 
                  label="Imagen de Fondo Conductor" 
                  section="conductorHero" 
                  field="backgroundImage" 
                  value={data.conductorHero?.backgroundImage || ''} 
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-600 mb-1.5 flex justify-between">
                  <span>Opacidad de la Capa Oscura (Transparencia)</span>
                  <span className="text-tech-blue font-black">{data.conductorHero?.opacity !== undefined ? data.conductorHero.opacity : 55}%</span>
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="10"
                    max="90"
                    value={data.conductorHero?.opacity !== undefined ? data.conductorHero.opacity : 55}
                    onChange={(e) => updateField('conductorHero', 'opacity', Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-tech-blue"
                  />
                  <span className="text-xs text-slate-400 font-bold min-w-[70px]">
                    {Number(data.conductorHero?.opacity || 55) <= 35 ? 'Muy Claro' : Number(data.conductorHero?.opacity || 55) >= 70 ? 'Muy Oscuro' : 'Equilibrado'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Un porcentaje menor hace que la imagen de fondo sea más visible, pero ten cuidado de que los textos en blanco sigan siendo legibles.</p>
              </div>
            </div>
          </div>
        )}

        {/* PESTAÑA: SERVICIOS Y CATEGORÍAS */}
        {activeTab === 'servicios' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-800">Servicios y Categorías Activas</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Administra las tarjetas de los distintos traslados. Modifica el subtítulo y el texto del botón CTA.
                </p>
              </div>
              <button
                onClick={addService}
                className="inline-flex items-center gap-1.5 rounded-lg border border-tech-blue bg-tech-blue/5 px-3.5 py-2 text-xs font-bold text-tech-blue hover:bg-tech-blue hover:text-white transition-all"
              >
                <Plus className="h-3.5 w-3.5" /> Agregar Categoría
              </button>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {data.servicios?.map((svc: any, idx: number) => (
                <div key={svc.id} className="rounded-xl border border-slate-200 p-5 bg-slate-50/50 shadow-sm relative group space-y-4">
                  <button
                    onClick={() => deleteService(idx)}
                    className="absolute top-4 right-4 text-red-500 hover:text-red-700 bg-white hover:bg-red-50 p-2 rounded-lg border border-slate-200 shadow-sm transition-all"
                    title="Eliminar Categoría"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>

                  <div className="flex flex-col sm:flex-row gap-4 items-start">
                    {svc.imageUrl ? (
                      <img 
                        src={svc.imageUrl} 
                        alt={svc.name}
                        className="h-20 w-32 object-cover rounded-lg border border-slate-300 bg-slate-200 flex-shrink-0"
                      />
                    ) : (
                      <div className="h-20 w-32 rounded-lg border border-dashed border-slate-300 bg-slate-100 flex items-center justify-center text-slate-400 text-xs flex-shrink-0">
                        Sin imagen
                      </div>
                    )}
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                      <ServiceInput
                        label="Nombre del Servicio"
                        value={svc.name}
                        idx={idx}
                        field="name"
                      />
                      <ServiceInput
                        label="Subtítulo Descriptivo (Texto Libre)"
                        value={svc.subTag || 'Servicio Corporativo'}
                        idx={idx}
                        field="subTag"
                        placeholder="Ej: Servicio Corporativo"
                        className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs bg-white focus:outline-none font-bold"
                      />
                      <ServiceInput
                        label="Tiempo de Espera (ETA)"
                        value={svc.eta}
                        idx={idx}
                        field="eta"
                      />
                      <ServiceInput
                        label="Texto del Botón CTA (Acción)"
                        value={svc.ctaText || 'Cotizar'}
                        idx={idx}
                        field="ctaText"
                      />
                      <div className="sm:col-span-2">
                        <ServiceInput
                          label="Descripción de la Categoría"
                          value={svc.description}
                          idx={idx}
                          field="description"
                        />
                      </div>
                      <div className="sm:col-span-2 pt-1">
                        <ServiceImageUploader idx={idx} value={svc.imageUrl || ''} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {data.servicios?.length === 0 && (
                <p className="text-slate-400 text-center py-8 text-sm">No hay servicios cargados. Agrega uno con el botón superior.</p>
              )}
            </div>
          </div>
        )}

        {/* PESTAÑA: CONDUCTORES - MODELO HÍBRIDO */}
        {activeTab === 'conductores' && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-base font-extrabold text-slate-800">Sección: Modelo Híbrido de Trabajo</h3>
              <p className="text-xs text-slate-400 mt-1">Define los textos que explican el funcionamiento por Membresía Fija o Comisión tradicional.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <CMSInput
                  label="Título del Bloque"
                  value={data.tiposTrabajo?.title || ''}
                  onChange={(val) => updateField('tiposTrabajo', 'title', val)}
                />
              </div>
              <div>
                <CMSInput
                  label="Subtítulo del Bloque"
                  value={data.tiposTrabajo?.subtitle || ''}
                  onChange={(val) => updateField('tiposTrabajo', 'subtitle', val)}
                />
              </div>
              <div className="rounded-xl border border-slate-100 p-4 bg-slate-50/50 space-y-3">
                <p className="text-xs font-bold text-tech-blue uppercase tracking-wider">Esquema 1: Comisión</p>
                <div>
                  <CMSInput
                    label="Título de la Tarjeta"
                    value={data.tiposTrabajo?.comisionTitulo || ''}
                    onChange={(val) => updateField('tiposTrabajo', 'comisionTitulo', val)}
                  />
                </div>
                <div>
                  <CMSTextarea
                    label="Texto Descriptivo"
                    rows={3}
                    value={data.tiposTrabajo?.comisionTexto || ''}
                    onChange={(val) => updateField('tiposTrabajo', 'comisionTexto', val)}
                  />
                </div>
              </div>

              <div className="rounded-xl border border-slate-100 p-4 bg-slate-50/50 space-y-3">
                <p className="text-xs font-bold text-tech-blue uppercase tracking-wider">Esquema 2: Membresía</p>
                <div>
                  <CMSInput
                    label="Título de la Tarjeta"
                    value={data.tiposTrabajo?.membresiaTitulo || ''}
                    onChange={(val) => updateField('tiposTrabajo', 'membresiaTitulo', val)}
                  />
                </div>
                <div>
                  <CMSTextarea
                    label="Texto Descriptivo"
                    rows={3}
                    value={data.tiposTrabajo?.membresiaTexto || ''}
                    onChange={(val) => updateField('tiposTrabajo', 'membresiaTexto', val)}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PESTAÑA: REWARDS - PROGRAMA DE LEALTAD */}
        {activeTab === 'rewards' && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-base font-extrabold text-slate-800">Sección: Resumen de Programa Rewards</h3>
              <p className="text-xs text-slate-400 mt-1">Configura el texto e imágenes del bloque dinámico explicativo de fidelización y puntos.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <CMSInput
                  label="Título del Resumen"
                  value={data.resumenRewards?.title || ''}
                  onChange={(val) => updateField('resumenRewards', 'title', val)}
                />
              </div>
              <div>
                <CMSInput
                  label="Incentivo (Badge text)"
                  value={data.resumenRewards?.pointsText || ''}
                  onChange={(val) => updateField('resumenRewards', 'pointsText', val)}
                />
              </div>
              <div>
                <CMSInput
                  label="Etiqueta Superior"
                  value={data.resumenRewards?.badgeText || ''}
                  onChange={(val) => updateField('resumenRewards', 'badgeText', val)}
                />
              </div>
              <div className="md:col-span-2">
                <ImageUploaderInput 
                  label="Imagen del Bloque de Rewards" 
                  section="resumenRewards" 
                  field="imageUrl" 
                  value={data.resumenRewards?.imageUrl || ''} 
                />
              </div>
              <div className="md:col-span-2">
                <CMSTextarea
                  label="Subtítulo Descriptivo"
                  rows={3}
                  value={data.resumenRewards?.subtitle || ''}
                  onChange={(val) => updateField('resumenRewards', 'subtitle', val)}
                />
              </div>
            </div>
          </div>
        )}

        {/* PESTAÑA: PREGUNTAS FRECUENTES (FAQ DYNAMIC) */}
        {activeTab === 'faq' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-800">Preguntas Frecuentes (FAQ)</h3>
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                  <HelpCircle className="h-4 w-4 text-tech-blue" />
                  Administra las preguntas que se mostrarán en la sección de FAQ de la Landing Page. Puedes cargar al menos 10 preguntas.
                </p>
              </div>
              <button
                onClick={addFaq}
                className="inline-flex items-center gap-1.5 rounded-lg border border-tech-blue bg-tech-blue/5 px-3.5 py-2 text-xs font-bold text-tech-blue hover:bg-tech-blue hover:text-white transition-all animate-pulse"
              >
                <Plus className="h-3.5 w-3.5" /> Agregar Pregunta
              </button>
            </div>

            <div className="space-y-4">
              {data.faq?.items?.map((item: any, idx: number) => (
                <div key={idx} className="rounded-xl border border-slate-200 p-4 bg-slate-50/50 shadow-sm relative group space-y-3">
                  <button
                    onClick={() => deleteFaq(idx)}
                    className="absolute top-4 right-4 text-red-500 hover:text-red-700 bg-white hover:bg-red-50 p-2 rounded-lg border border-slate-200 shadow-sm transition-all"
                    title="Eliminar Pregunta"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  
                  <div className="grid grid-cols-1 gap-3 max-w-[90%]">
                    <FaqInput
                      label={`Pregunta Frecuente N° ${idx + 1}`}
                      value={item.question}
                      idx={idx}
                      field="question"
                    />
                    <FaqTextarea
                      label="Respuesta / Explicación"
                      value={item.answer}
                      idx={idx}
                      field="answer"
                    />
                  </div>
                </div>
              ))}
              {data.faq?.items?.length === 0 && (
                <p className="text-slate-400 text-center py-8 text-sm">No hay preguntas frecuentes cargadas. Agrega una con el botón superior.</p>
              )}
            </div>
          </div>
        )}

        {/* PESTAÑA: LEGALES Y REDES */}
        {activeTab === 'legales' && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-base font-extrabold text-slate-800">Enlaces de Redes Sociales (Independientes por Landing)</h3>
              <p className="text-xs text-slate-400 mt-1">Modifica los perfiles oficiales y el número de la flota de WhatsApp.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <CMSInput
                  label="Página de Facebook"
                  value={data.redesSociales?.facebook || ''}
                  onChange={(val) => updateField('redesSociales', 'facebook', val)}
                />
              </div>
              <div>
                <CMSInput
                  label="Página de Instagram"
                  value={data.redesSociales?.instagram || ''}
                  onChange={(val) => updateField('redesSociales', 'instagram', val)}
                />
              </div>
              <div>
                <CMSInput
                  label="Canal de Facebook Messenger"
                  value={data.redesSociales?.messenger || ''}
                  onChange={(val) => updateField('redesSociales', 'messenger', val)}
                />
              </div>
              <div>
                <CMSInput
                  label="Enlace / API WhatsApp (Travis chat)"
                  value={data.redesSociales?.whatsapp || ''}
                  onChange={(val) => updateField('redesSociales', 'whatsapp', val)}
                />
              </div>
            </div>

            <div className="border-b border-slate-100 pb-4 pt-4">
              <h3 className="text-base font-extrabold text-slate-800">Sellos Gubernamentales y de Registro</h3>
              <p className="text-xs text-slate-400 mt-1">Configura las URLs de imágenes oficiales que irán al pie de la página.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ImageUploaderInput 
                label="Sello QR ARCA (ex-AFIP)" 
                section="sellosLegales" 
                field="arcaQrUrl" 
                value={data.sellosLegales?.arcaQrUrl || ''} 
              />
              <ImageUploaderInput 
                label="Sello Registro Nacional de Base de Datos" 
                section="sellosLegales" 
                field="baseDatosSelloUrl" 
                value={data.sellosLegales?.baseDatosSelloUrl || ''} 
              />
            </div>

            <div className="border-b border-slate-100 pb-4 pt-4">
              <h3 className="text-base font-extrabold text-slate-800">Contenido Legal Integrado (Popups / Modales)</h3>
              <p className="text-xs text-slate-400 mt-1">Escribe las bases legales y Quiénes Somos. Se visualizarán dentro de la landing mediante ventanas emergentes premium.</p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <CMSTextarea
                  label="Quiénes Somos (Presentación de la Empresa)"
                  rows={4}
                  value={data.legales?.quienesSomos || ''}
                  onChange={(val) => updateField('legales', 'quienesSomos', val)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none font-mono"
                />
              </div>
              <div>
                <CMSTextarea
                  label="Términos y Condiciones Generales"
                  rows={5}
                  value={data.legales?.terminosCondiciones || ''}
                  onChange={(val) => updateField('legales', 'terminosCondiciones', val)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none font-mono"
                />
              </div>
              <div>
                <CMSTextarea
                  label="Políticas de Privacidad"
                  rows={5}
                  value={data.legales?.politicasPrivacidad || ''}
                  onChange={(val) => updateField('legales', 'politicasPrivacidad', val)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none font-mono"
                />
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
