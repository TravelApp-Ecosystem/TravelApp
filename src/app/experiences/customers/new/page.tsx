'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  UserPlus, Save, ArrowLeft, CheckCircle2,
  CreditCard, Users, Receipt, HeartPulse, Sparkles,
  UploadCloud, X, Plus, AlertCircle, Info, Calendar, ShieldCheck, Plane
} from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface FamilyMemberItem {
  id: string;
  fullName: string;
  relationship: string;
  documentType: 'DNI' | 'Pasaporte' | 'Otro';
  documentNumber: string;
  passportExpiryDate?: string;
  dob?: string;
  gender?: 'M' | 'F' | 'X';
  dietaryRestrictions?: string;
  medicalNotes?: string;
}

export default function NewCustomerPage() {
  const [activeTab, setActiveTab] = useState<'identity' | 'family' | 'fiscal' | 'medical' | 'vip'>('identity');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);

  // 1. Identidad & Documentación (IATA)
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [docType, setDocType] = useState<'DNI' | 'Pasaporte' | 'Otro'>('DNI');
  const [docNumber, setDocNumber] = useState('');
  const [passportNumber, setPassportNumber] = useState('');
  const [passportExpiry, setPassportExpiry] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState<'M' | 'F' | 'X' | ''>('M');
  const [nationality, setNationality] = useState('Argentina');
  const [occupation, setOccupation] = useState('');

  // Fotos de Documentación (Opcionales)
  const [dniFrontPhoto, setDniFrontPhoto] = useState<string | null>(null);
  const [dniBackPhoto, setDniBackPhoto] = useState<string | null>(null);
  const [passportPhoto, setPassportPhoto] = useState<string | null>(null);

  // 2. Grupo Familiar & Acompañantes
  const [familyMembers, setFamilyMembers] = useState<FamilyMemberItem[]>([]);
  const [famModalOpen, setFamModalOpen] = useState(false);
  const [famName, setFamName] = useState('');
  const [famRel, setFamRel] = useState('Cónyuge');
  const [famDocType, setFamDocType] = useState<'DNI' | 'Pasaporte' | 'Otro'>('DNI');
  const [famDocNum, setFamDocNum] = useState('');
  const [famPassExpiry, setFamPassExpiry] = useState('');
  const [famDob, setFamDob] = useState('');
  const [famGender, setFamGender] = useState<'M' | 'F' | 'X'>('M');
  const [famDietary, setFamDietary] = useState('');
  const [famMedical, setFamMedical] = useState('');

  // 3. Domicilio & Facturación AFIP
  const [street, setStreet] = useState('');
  const [streetNumber, setStreetNumber] = useState('');
  const [apartment, setApartment] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [taxCondition, setTaxCondition] = useState<'Consumidor Final' | 'Responsable Inscripto' | 'Monotributista' | 'Exento'>('Consumidor Final');
  const [cuitCuil, setCuitCuil] = useState('');
  const [businessName, setBusinessName] = useState('');

  // 4. Salud, Dietas & Emergencia (IATA Medical)
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [emergencyRelation, setEmergencyRelation] = useState('');
  const [dietary, setDietary] = useState('');
  const [allergies, setAllergies] = useState('');
  const [medicalConditions, setMedicalConditions] = useState('');
  const [mobilityAssistance, setMobilityAssistance] = useState(false);
  const [hasInsurance, setHasInsurance] = useState(false);
  const [insuranceCompany, setInsuranceCompany] = useState('');
  const [insurancePolicy, setInsurancePolicy] = useState('');

  // 5. Preferencias VIP & Fidelización
  const [seatPref, setSeatPref] = useState<'Ventana' | 'Pasillo' | 'Adelante' | 'Indistinto'>('Indistinto');
  const [roomPref, setRoomPref] = useState<'Matrimonial' | 'Camas Twin' | 'Familiar' | 'Piso Alto'>('Matrimonial');
  const [frequentFlyerProgram, setFrequentFlyerProgram] = useState('');
  const [frequentFlyerNumber, setFrequentFlyerNumber] = useState('');

  // Helper para convertir archivo de imagen a Data URL
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string | null) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen no debe superar los 5MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setter(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddFamilyMember = () => {
    if (!famName.trim() || !famDocNum.trim()) {
      alert('Por favor ingresá al menos el nombre y número de documento del acompañante.');
      return;
    }
    const newMember: FamilyMemberItem = {
      id: Date.now().toString(),
      fullName: famName.trim(),
      relationship: famRel,
      documentType: famDocType,
      documentNumber: famDocNum.trim(),
      passportExpiryDate: famPassExpiry || undefined,
      dob: famDob || undefined,
      gender: famGender,
      dietaryRestrictions: famDietary || undefined,
      medicalNotes: famMedical || undefined,
    };
    setFamilyMembers(prev => [...prev, newMember]);
    setFamName('');
    setFamDocNum('');
    setFamPassExpiry('');
    setFamDob('');
    setFamDietary('');
    setFamMedical('');
    setFamModalOpen(false);
  };

  const handleRemoveFamilyMember = (id: string) => {
    setFamilyMembers(prev => prev.filter(m => m.id !== id));
  };

  // Cálculo de completitud de la ficha
  const calculateProgress = () => {
    let score = 0;
    if (firstName && lastName) score += 20;
    if (email && phone) score += 20;
    if (docNumber || passportNumber) score += 20;
    if (taxCondition && (taxCondition === 'Consumidor Final' || cuitCuil)) score += 15;
    if (emergencyName || emergencyPhone) score += 15;
    if (familyMembers.length > 0) score += 10;
    return Math.min(100, score);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      alert('Por favor completá los campos obligatorios: Nombre, Apellido y Email.');
      setActiveTab('identity');
      return;
    }

    setSaving(true);
    try {
      const fullCustomerName = `${firstName.trim()} ${lastName.trim()}`;
      const progress = calculateProgress();

      const payload = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        displayName: fullCustomerName,
        customerName: fullCustomerName,
        name: fullCustomerName,
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        customerLevel: 2, // Ficha IATA Completa
        customerStatus: 'Cliente',
        profileCompletedPercentage: progress,

        // Identidad & Documentación IATA
        document: {
          type: docType,
          number: docNumber.trim(),
          expiryDate: passportExpiry || undefined,
          nationality: nationality || 'Argentina',
          frontUrl: dniFrontPhoto || undefined,
          backUrl: dniBackPhoto || undefined,
          passportUrl: passportPhoto || undefined,
        },
        passport: passportNumber.trim() || undefined,
        passportExpiryDate: passportExpiry || undefined,
        dob: dob || undefined,
        gender: gender || undefined,
        nationality: nationality || 'Argentina',
        occupation: occupation.trim() || undefined,

        // Domicilio & Facturación AFIP
        address: {
          street: street.trim(),
          number: streetNumber.trim(),
          apartment: apartment.trim(),
          city: city.trim(),
          province: province.trim(),
          postalCode: postalCode.trim(),
          country: nationality || 'Argentina',
        },
        taxData: {
          taxCondition,
          cuitCuil: cuitCuil.trim(),
          businessName: businessName.trim() || fullCustomerName,
          fiscalAddress: `${street} ${streetNumber} ${apartment}, ${city}, ${province}`.trim(),
        },

        // Salud, Dietas & Emergencia
        emergencyContact: {
          name: emergencyName.trim(),
          phone: emergencyPhone.trim(),
          relationship: emergencyRelation.trim(),
        },
        medicalSafety: {
          dietaryRestrictions: dietary.trim() || undefined,
          allergies: allergies.trim() || undefined,
          medicalConditions: medicalConditions.trim() || undefined,
          mobilityAssistance: Boolean(mobilityAssistance),
          hasTravelInsurance: Boolean(hasInsurance),
          insuranceCompany: insuranceCompany.trim() || undefined,
          insurancePolicyNumber: insurancePolicy.trim() || undefined,
        },
        dietaryRestrictions: dietary.trim() || undefined,
        medicalNotes: medicalConditions.trim() || undefined,
        allergies: allergies.trim() || undefined,

        // Grupo Familiar
        familyMembers,

        // Preferencias VIP
        preferences: {
          seatPreference: seatPref,
          roomPreference: roomPref,
          frequentFlyerProgram: frequentFlyerProgram.trim() || undefined,
          frequentFlyerNumber: frequentFlyerNumber.trim() || undefined,
        },

        // Auditoría
        createdAt: Date.now(),
        updatedAt: Date.now(),
        source: 'Concorde 360 Admin',
        origin: 'Web',
        businessUnit: 'Experiencias',
      };

      // Guardar en crm_customers y users para sincronización total del ecosistema
      const crmDoc = await addDoc(collection(db, 'crm_customers'), payload);
      await addDoc(collection(db, 'users'), { ...payload, crmCustomerId: crmDoc.id });

      setCreatedId(crmDoc.id);
      setSuccess(true);
    } catch (err) {
      console.error('Error creating customer:', err);
      alert('Error al registrar la ficha de cliente en Firestore.');
    } finally {
      setSaving(false);
    }
  };

  const handleResetForm = () => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhone('');
    setDocNumber('');
    setPassportNumber('');
    setPassportExpiry('');
    setDob('');
    setGender('M');
    setNationality('Argentina');
    setOccupation('');
    setDniFrontPhoto(null);
    setDniBackPhoto(null);
    setPassportPhoto(null);
    setFamilyMembers([]);
    setStreet('');
    setStreetNumber('');
    setApartment('');
    setCity('');
    setProvince('');
    setPostalCode('');
    setTaxCondition('Consumidor Final');
    setCuitCuil('');
    setBusinessName('');
    setEmergencyName('');
    setEmergencyPhone('');
    setEmergencyRelation('');
    setDietary('');
    setAllergies('');
    setMedicalConditions('');
    setMobilityAssistance(false);
    setHasInsurance(false);
    setInsuranceCompany('');
    setInsurancePolicy('');
    setSeatPref('Indistinto');
    setRoomPref('Matrimonial');
    setFrequentFlyerProgram('');
    setFrequentFlyerNumber('');
    setSuccess(false);
    setCreatedId(null);
    setActiveTab('identity');
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-8 bg-slate-50 space-y-6">
      
      {/* Barra Superior / Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link href="/crm/customers" className="flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-tech-blue transition-colors">
          <ArrowLeft className="h-4 w-4" /> Volver al Listado de Clientes
        </Link>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <Sparkles className="h-3.5 w-3.5" /> Ficha de Reserva &amp; Pasajero IATA
        </span>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-5 gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-tech-blue flex items-center gap-2.5">
            <UserPlus className="h-8 w-8 text-amber-500" />
            Crear Ficha de Cliente &amp; Grupo Familiar
          </h1>
          <p className="mt-1 text-sm text-slate-500 font-medium">
            Formulario unificado con estándar IATA, emisión aérea/hotelera, datos fiscales AFIP y adjuntos de documentación.
          </p>
        </div>

        {/* Medidor de Completitud */}
        <div className="bg-white border border-slate-200 rounded-2xl px-4 py-2.5 shadow-sm flex items-center gap-4">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Completitud Ficha</div>
            <div className="text-sm font-black text-tech-blue">{calculateProgress()}% Completado</div>
          </div>
          <div className="w-24 h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full transition-all duration-300"
              style={{ width: `${calculateProgress()}%` }}
            />
          </div>
        </div>
      </div>

      {/* Mensaje de Éxito */}
      {success && (
        <div className="bg-emerald-50 border-2 border-emerald-300 text-emerald-800 p-5 rounded-2xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-base font-bold">¡Ficha de Cliente Registrada con Éxito!</h4>
              <p className="text-xs text-emerald-700">El cliente ya está disponible en CRM, Experience y sincronizado con la App Móvil.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Link
              href="/crm/customers"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all text-center flex-1 sm:flex-initial"
            >
              Ver en CRM
            </Link>
            <button
              onClick={handleResetForm}
              className="px-4 py-2 bg-white border border-emerald-300 text-emerald-700 hover:bg-emerald-100 text-xs font-bold rounded-xl transition-all text-center flex-1 sm:flex-initial"
            >
              + Crear Otro Cliente
            </button>
          </div>
        </div>
      )}

      {/* Navegación por Pestañas (Exactamente idéntica a la app móvil) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200">
        {[
          { id: 'identity', label: '1. Identidad & Fotos', icon: CreditCard },
          { id: 'family', label: `2. Familia (${familyMembers.length})`, icon: Users },
          { id: 'fiscal', label: '3. Facturación AFIP', icon: Receipt },
          { id: 'medical', label: '4. Salud & Seguridad', icon: HeartPulse },
          { id: 'vip', label: '5. Preferencias VIP', icon: Plane },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                isActive
                  ? 'bg-tech-blue text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Formulario Principal */}
      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-3xl p-6 lg:p-8 shadow-sm space-y-8">
        
        {/* ======================================================== */}
        {/* PESTAÑA 1: IDENTIDAD, DOCUMENTACIÓN & FOTOS OPCIONALES */}
        {/* ======================================================== */}
        {activeTab === 'identity' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-amber-500" />
                  Identidad &amp; Emisión IATA
                </h3>
                <p className="text-xs text-slate-400">Datos tal como figuran en el documento de identidad / pasaporte oficial.</p>
              </div>
            </div>

            {/* Nombre y Apellido */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Nombre(s) Completos *</label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  placeholder="Ej: Fernando Gabriel"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-tech-blue focus:ring-1 focus:ring-tech-blue"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Apellido(s) Completos *</label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  placeholder="Ej: Incola"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-tech-blue focus:ring-1 focus:ring-tech-blue"
                />
              </div>
            </div>

            {/* Email y Teléfono */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Correo Electrónico *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="cliente@travelapp.ar"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-tech-blue focus:ring-1 focus:ring-tech-blue"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Teléfono / WhatsApp *</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+54 9 381 456-7890"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-tech-blue focus:ring-1 focus:ring-tech-blue"
                />
              </div>
            </div>

            {/* Documento, Pasaporte y Vencimiento */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Tipo de Documento</label>
                <select
                  value={docType}
                  onChange={e => setDocType(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-tech-blue bg-white"
                >
                  <option value="DNI">DNI (Documento Nacional)</option>
                  <option value="Pasaporte">Pasaporte Oficial</option>
                  <option value="Otro">Cédula Mercosur / Otro</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Número de DNI / Cédula</label>
                <input
                  type="text"
                  value={docNumber}
                  onChange={e => setDocNumber(e.target.value)}
                  placeholder="Ej: 35.123.456"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-tech-blue"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Número de Pasaporte</label>
                <input
                  type="text"
                  value={passportNumber}
                  onChange={e => setPassportNumber(e.target.value)}
                  placeholder="Ej: AAB 123456"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-tech-blue"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Vencimiento Pasaporte</label>
                <input
                  type="date"
                  value={passportExpiry}
                  onChange={e => setPassportExpiry(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-tech-blue"
                />
              </div>
            </div>

            {/* Nacimiento, Género, Nacionalidad y Profesión */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Fecha de Nacimiento</label>
                <input
                  type="date"
                  value={dob}
                  onChange={e => setDob(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-tech-blue"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Género (IATA)</label>
                <select
                  value={gender}
                  onChange={e => setGender(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-tech-blue bg-white"
                >
                  <option value="M">Masculino (M)</option>
                  <option value="F">Femenino (F)</option>
                  <option value="X">No Binario / Otro (X)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Nacionalidad</label>
                <input
                  type="text"
                  value={nationality}
                  onChange={e => setNationality(e.target.value)}
                  placeholder="Argentina"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-tech-blue"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Profesión / Ocupación</label>
                <input
                  type="text"
                  value={occupation}
                  onChange={e => setOccupation(e.target.value)}
                  placeholder="Ej: Empresario, Arquitecto"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-tech-blue"
                />
              </div>
            </div>

            {/* SECCIÓN DE CARGA DE FOTOS DE DNI Y PASAPORTE (OPCIONALES) */}
            <div className="border-t border-slate-100 pt-5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                    <UploadCloud className="h-4 w-4 text-tech-blue" />
                    Adjuntar Fotos de Documentos (Opcional)
                  </h4>
                  <p className="text-[11px] text-slate-400">Podés adjuntar fotos del DNI o Pasaporte para agilizar la validación de emisiones.</p>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500 px-2 py-0.5 rounded">
                  Opcional
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                {/* 1. Frente DNI */}
                <div className="border border-dashed border-slate-300 rounded-2xl p-4 bg-slate-50/70 hover:bg-slate-50 transition-colors flex flex-col items-center justify-center text-center relative min-h-[140px]">
                  {dniFrontPhoto ? (
                    <div className="relative w-full h-28 rounded-xl overflow-hidden group">
                      <img src={dniFrontPhoto} alt="DNI Frente" className="w-full h-full object-cover rounded-xl" />
                      <button
                        type="button"
                        onClick={() => setDniFrontPhoto(null)}
                        className="absolute top-1.5 right-1.5 p-1 bg-red-500 text-white rounded-full shadow hover:bg-red-600 transition-all"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                      <span className="absolute bottom-1.5 left-1.5 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded">DNI Frente</span>
                    </div>
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center gap-1.5 w-full h-full justify-center">
                      <UploadCloud className="h-6 w-6 text-slate-400" />
                      <span className="text-xs font-bold text-slate-700">DNI Frente</span>
                      <span className="text-[10px] text-slate-400">Clic para subir imagen (JPG/PNG)</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, setDniFrontPhoto)}
                      />
                    </label>
                  )}
                </div>

                {/* 2. Dorso DNI */}
                <div className="border border-dashed border-slate-300 rounded-2xl p-4 bg-slate-50/70 hover:bg-slate-50 transition-colors flex flex-col items-center justify-center text-center relative min-h-[140px]">
                  {dniBackPhoto ? (
                    <div className="relative w-full h-28 rounded-xl overflow-hidden group">
                      <img src={dniBackPhoto} alt="DNI Dorso" className="w-full h-full object-cover rounded-xl" />
                      <button
                        type="button"
                        onClick={() => setDniBackPhoto(null)}
                        className="absolute top-1.5 right-1.5 p-1 bg-red-500 text-white rounded-full shadow hover:bg-red-600 transition-all"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                      <span className="absolute bottom-1.5 left-1.5 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded">DNI Dorso</span>
                    </div>
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center gap-1.5 w-full h-full justify-center">
                      <UploadCloud className="h-6 w-6 text-slate-400" />
                      <span className="text-xs font-bold text-slate-700">DNI Dorso</span>
                      <span className="text-[10px] text-slate-400">Clic para subir imagen (JPG/PNG)</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, setDniBackPhoto)}
                      />
                    </label>
                  )}
                </div>

                {/* 3. Pasaporte Hoja Principal */}
                <div className="border border-dashed border-slate-300 rounded-2xl p-4 bg-slate-50/70 hover:bg-slate-50 transition-colors flex flex-col items-center justify-center text-center relative min-h-[140px]">
                  {passportPhoto ? (
                    <div className="relative w-full h-28 rounded-xl overflow-hidden group">
                      <img src={passportPhoto} alt="Pasaporte" className="w-full h-full object-cover rounded-xl" />
                      <button
                        type="button"
                        onClick={() => setPassportPhoto(null)}
                        className="absolute top-1.5 right-1.5 p-1 bg-red-500 text-white rounded-full shadow hover:bg-red-600 transition-all"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                      <span className="absolute bottom-1.5 left-1.5 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded">Pasaporte</span>
                    </div>
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center gap-1.5 w-full h-full justify-center">
                      <UploadCloud className="h-6 w-6 text-slate-400" />
                      <span className="text-xs font-bold text-slate-700">Hoja Pasaporte</span>
                      <span className="text-[10px] text-slate-400">Clic para subir imagen (JPG/PNG)</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, setPassportPhoto)}
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={() => setActiveTab('family')}
                className="px-6 py-2.5 rounded-xl bg-slate-800 text-white text-xs font-bold hover:bg-slate-900 transition-all"
              >
                Siguiente: Grupo Familiar →
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* PESTAÑA 2: GRUPO FAMILIAR & ACOMPAÑANTES */}
        {/* ======================================================== */}
        {activeTab === 'family' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                  <Users className="h-5 w-5 text-sky-500" />
                  Grupo Familiar &amp; Acompañantes Frecuentes
                </h3>
                <p className="text-xs text-slate-400">Registrá a los integrantes de la familia para emitir reservas grupales con 1-clic.</p>
              </div>
              <button
                type="button"
                onClick={() => setFamModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                <Plus className="h-4 w-4" /> Agregar Familiar
              </button>
            </div>

            {familyMembers.length === 0 ? (
              <div className="border-2 border-dashed border-slate-200 rounded-3xl p-8 text-center bg-slate-50/50">
                <Users className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-700">No hay familiares registrados aún</p>
                <p className="text-xs text-slate-400 mt-1 mb-4">Podés agregar cónyuges, hijos o acompañantes para automatizar la emisión de paquetes.</p>
                <button
                  type="button"
                  onClick={() => setFamModalOpen(true)}
                  className="px-4 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all"
                >
                  + Cargar Primer Familiar
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {familyMembers.map((member) => (
                  <div key={member.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 relative group hover:border-sky-300 transition-all">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-800">{member.fullName}</span>
                          <span className="bg-sky-100 text-sky-800 text-[10px] font-extrabold px-2 py-0.5 rounded-md">
                            {member.relationship}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          {member.documentType}: <span className="font-semibold text-slate-700">{member.documentNumber}</span>
                          {member.dob && ` · Nac: ${member.dob}`}
                        </p>
                        {member.dietaryRestrictions && (
                          <span className="inline-block mt-2 bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-200">
                            Dieta: {member.dietaryRestrictions}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFamilyMember(member.id)}
                        className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Modal / Sheet para Cargar Familiar */}
            {famModalOpen && (
              <div className="border border-sky-200 bg-sky-50/50 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-sky-900 uppercase tracking-wide">Nuevo Familiar / Acompañante</h4>
                  <button type="button" onClick={() => setFamModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Nombre Completo *</label>
                    <input
                      type="text"
                      value={famName}
                      onChange={e => setFamName(e.target.value)}
                      placeholder="Ej: Lucía Incola"
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs bg-white text-slate-800 outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Parentesco</label>
                    <select
                      value={famRel}
                      onChange={e => setFamRel(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs bg-white text-slate-800 outline-none focus:border-sky-500"
                    >
                      <option value="Cónyuge">Cónyuge</option>
                      <option value="Hijo/a">Hijo/a</option>
                      <option value="Padre/Madre">Padre/Madre</option>
                      <option value="Hermano/a">Hermano/a</option>
                      <option value="Amigo/a">Amigo/a</option>
                      <option value="Colega">Colega</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Documento / DNI *</label>
                    <input
                      type="text"
                      value={famDocNum}
                      onChange={e => setFamDocNum(e.target.value)}
                      placeholder="Ej: 42.999.888"
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs bg-white text-slate-800 outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Fecha de Nacimiento</label>
                    <input
                      type="date"
                      value={famDob}
                      onChange={e => setFamDob(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs bg-white text-slate-800 outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Vencimiento Pasaporte</label>
                    <input
                      type="date"
                      value={famPassExpiry}
                      onChange={e => setFamPassExpiry(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs bg-white text-slate-800 outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Restricción Dietaria</label>
                    <input
                      type="text"
                      value={famDietary}
                      onChange={e => setFamDietary(e.target.value)}
                      placeholder="Ej: Celíaco, Vegano"
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs bg-white text-slate-800 outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setFamModalOpen(false)}
                    className="px-4 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleAddFamilyMember}
                    className="px-4 py-1.5 rounded-xl bg-sky-600 text-white text-xs font-bold hover:bg-sky-700 shadow-sm"
                  >
                    Guardar Familiar
                  </button>
                </div>
              </div>
            )}

            <div className="flex justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveTab('identity')}
                className="px-5 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50"
              >
                ← Volver a Identidad
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('fiscal')}
                className="px-6 py-2.5 rounded-xl bg-slate-800 text-white text-xs font-bold hover:bg-slate-900 transition-all"
              >
                Siguiente: Facturación AFIP →
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* PESTAÑA 3: FACTURACIÓN & DOMICILIO FISCAL (AFIP) */}
        {/* ======================================================== */}
        {activeTab === 'fiscal' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-indigo-500" />
                  Facturación Fiscal (AFIP / ARCA)
                </h3>
                <p className="text-xs text-slate-400">Datos fiscales para emisión de Facturas A / B y comprobantes tributarios.</p>
              </div>
            </div>

            {/* Condición IVA, CUIT y Razón Social */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Condición frente al IVA</label>
                <select
                  value={taxCondition}
                  onChange={e => setTaxCondition(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-tech-blue bg-white"
                >
                  <option value="Consumidor Final">Consumidor Final</option>
                  <option value="Responsable Inscripto">Responsable Inscripto (Factura A)</option>
                  <option value="Monotributista">Monotributista</option>
                  <option value="Exento">Exento de IVA</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">CUIT / CUIL / CDI</label>
                <input
                  type="text"
                  value={cuitCuil}
                  onChange={e => setCuitCuil(e.target.value)}
                  placeholder="20-35123456-9"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-tech-blue"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Razón Social / Denominación</label>
                <input
                  type="text"
                  value={businessName}
                  onChange={e => setBusinessName(e.target.value)}
                  placeholder="Ej: Incola Desarrollos S.A."
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-tech-blue"
                />
              </div>
            </div>

            {/* Domicilio Fiscal */}
            <div className="border-t border-slate-100 pt-4 space-y-4">
              <h4 className="text-xs font-black text-slate-700 uppercase tracking-wide">Domicilio Fiscal &amp; Legal</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Calle</label>
                  <input
                    type="text"
                    value={street}
                    onChange={e => setStreet(e.target.value)}
                    placeholder="Ej: Av. Aconquija"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-tech-blue"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Número</label>
                  <input
                    type="text"
                    value={streetNumber}
                    onChange={e => setStreetNumber(e.target.value)}
                    placeholder="Ej: 1450"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-tech-blue"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Piso / Dpto</label>
                  <input
                    type="text"
                    value={apartment}
                    onChange={e => setApartment(e.target.value)}
                    placeholder="Ej: 4to B"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-tech-blue"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Ciudad</label>
                  <input
                    type="text"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    placeholder="Ej: Yerba Buena"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-tech-blue"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Provincia</label>
                  <input
                    type="text"
                    value={province}
                    onChange={e => setProvince(e.target.value)}
                    placeholder="Ej: Tucumán"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-tech-blue"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Código Postal</label>
                  <input
                    type="text"
                    value={postalCode}
                    onChange={e => setPostalCode(e.target.value)}
                    placeholder="4107"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-tech-blue"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveTab('family')}
                className="px-5 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50"
              >
                ← Volver a Familia
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('medical')}
                className="px-6 py-2.5 rounded-xl bg-slate-800 text-white text-xs font-bold hover:bg-slate-900 transition-all"
              >
                Siguiente: Salud &amp; Seguridad →
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* PESTAÑA 4: SALUD, DIETAS & SEGURIDAD (IATA MEDICAL) */}
        {/* ======================================================== */}
        {activeTab === 'medical' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                  <HeartPulse className="h-5 w-5 text-rose-500" />
                  Salud, Restricciones Dietarias &amp; Contacto de Emergencia
                </h3>
                <p className="text-xs text-slate-400">Requerimientos obligatorios para seguros de viaje y catering aéreo/terrestre.</p>
              </div>
            </div>

            {/* Contacto de Emergencia */}
            <div className="bg-rose-50/50 border border-rose-100 p-5 rounded-2xl space-y-3">
              <h4 className="text-xs font-black text-rose-900 uppercase tracking-wide flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-rose-600" /> Contacto de Emergencia (24/7)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Nombre y Apellido</label>
                  <input
                    type="text"
                    value={emergencyName}
                    onChange={e => setEmergencyName(e.target.value)}
                    placeholder="Ej: María Laura Gómez"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-800 bg-white outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Teléfono de Guardia</label>
                  <input
                    type="tel"
                    value={emergencyPhone}
                    onChange={e => setEmergencyPhone(e.target.value)}
                    placeholder="+54 9 381 555-1122"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-800 bg-white outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Parentesco</label>
                  <input
                    type="text"
                    value={emergencyRelation}
                    onChange={e => setEmergencyRelation(e.target.value)}
                    placeholder="Ej: Esposa / Madre"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-800 bg-white outline-none focus:border-rose-500"
                  />
                </div>
              </div>
            </div>

            {/* Dietas y Alergias */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Restricciones Dietarias / Menú Especial</label>
                <input
                  type="text"
                  value={dietary}
                  onChange={e => setDietary(e.target.value)}
                  placeholder="Ej: Sin TACC (Celíaco), Vegano, Kosher, Diabético"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-tech-blue"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Alergias Conocidas</label>
                <input
                  type="text"
                  value={allergies}
                  onChange={e => setAllergies(e.target.value)}
                  placeholder="Ej: Penicilina, Mariscos, Frutos secos"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-tech-blue"
                />
              </div>
            </div>

            {/* Condiciones Médicas & Medicación */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Condiciones Médicas Crónicas / Medicación</label>
              <textarea
                value={medicalConditions}
                onChange={e => setMedicalConditions(e.target.value)}
                placeholder="Ej: Hipertensión controlada con Losartán 50mg. Asma leve."
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-tech-blue h-20 resize-none"
              />
            </div>

            {/* Asistencia de Movilidad & Seguro */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <label className="flex items-center gap-3 p-4 rounded-2xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
                <input
                  type="checkbox"
                  checked={mobilityAssistance}
                  onChange={e => setMobilityAssistance(e.target.checked)}
                  className="w-4 h-4 text-tech-blue rounded focus:ring-tech-blue"
                />
                <div>
                  <span className="text-xs font-bold text-slate-800">Requiere Asistencia Especial (Silla de Ruedas)</span>
                  <p className="text-[11px] text-slate-400">Emisión de código IATA WCHR/WCHS en aeropuertos y traslados adaptados.</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-4 rounded-2xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
                <input
                  type="checkbox"
                  checked={hasInsurance}
                  onChange={e => setHasInsurance(e.target.checked)}
                  className="w-4 h-4 text-tech-blue rounded focus:ring-tech-blue"
                />
                <div>
                  <span className="text-xs font-bold text-slate-800">Posee Asistencia Médica Privada / Seguro</span>
                  <p className="text-[11px] text-slate-400">Universal Assistance, Assist Card o cobertura de tarjeta.</p>
                </div>
              </label>
            </div>

            {hasInsurance && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Compañía Aseguradora</label>
                  <input
                    type="text"
                    value={insuranceCompany}
                    onChange={e => setInsuranceCompany(e.target.value)}
                    placeholder="Ej: Universal Assistance"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 outline-none focus:border-tech-blue"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Nº de Póliza / Voucher</label>
                  <input
                    type="text"
                    value={insurancePolicy}
                    onChange={e => setInsurancePolicy(e.target.value)}
                    placeholder="Ej: POL-994883-AR"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 outline-none focus:border-tech-blue"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveTab('fiscal')}
                className="px-5 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50"
              >
                ← Volver a Facturación
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('vip')}
                className="px-6 py-2.5 rounded-xl bg-slate-800 text-white text-xs font-bold hover:bg-slate-900 transition-all"
              >
                Siguiente: Preferencias VIP →
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* PESTAÑA 5: PREFERENCIAS VIP & FIDELIZACIÓN */}
        {/* ======================================================== */}
        {activeTab === 'vip' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-500" />
                  Preferencias VIP &amp; Pasajero Frecuente
                </h3>
                <p className="text-xs text-slate-400">Detalles de confort para asignación automática de asientos, habitaciones y millas.</p>
              </div>
            </div>

            {/* Asiento & Habitación */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Asiento Preferido en Avión</label>
                <select
                  value={seatPref}
                  onChange={e => setSeatPref(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-tech-blue bg-white"
                >
                  <option value="Indistinto">Indistinto</option>
                  <option value="Ventana">Ventana</option>
                  <option value="Pasillo">Pasillo</option>
                  <option value="Adelante">Adelante</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Preferencia de Habitación Hotelera</label>
                <select
                  value={roomPref}
                  onChange={e => setRoomPref(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-tech-blue bg-white"
                >
                  <option value="Matrimonial">Cama Matrimonial (King / Queen)</option>
                  <option value="Camas Twin">Camas Separadas (Twin)</option>
                  <option value="Familiar">Habitación Familiar</option>
                  <option value="Piso Alto">Piso Alto / Vista Panorámica</option>
                </select>
              </div>
            </div>

            {/* Programa de Millas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Programa de Pasajero Frecuente</label>
                <input
                  type="text"
                  value={frequentFlyerProgram}
                  onChange={e => setFrequentFlyerProgram(e.target.value)}
                  placeholder="Ej: Aerolíneas Plus / LATAM Pass / Smiles"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-tech-blue"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Nº de Socio / Pasajero Frecuente</label>
                <input
                  type="text"
                  value={frequentFlyerNumber}
                  onChange={e => setFrequentFlyerNumber(e.target.value)}
                  placeholder="Ej: AR-123456789"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-tech-blue"
                />
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start gap-3">
              <Info className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900">
                <span className="font-bold">Nivel de Cliente: Nivel 2 (VIP - Ficha Completa).</span> Al registrar esta ficha, el cliente queda automáticamente habilitado para cotizaciones y reservas inmediatas sin necesidad de solicitar datos complementarios.
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveTab('medical')}
                className="px-5 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50"
              >
                ← Volver a Salud
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-tech-blue px-8 py-3 text-sm font-black text-white hover:bg-tech-blue/90 shadow-lg shadow-tech-blue/20 transition-all active:scale-[0.98]"
              >
                <Save className="h-5 w-5 text-amber-400" />
                {saving ? 'Guardando en Firestore...' : 'Guardar Ficha Completa'}
              </button>
            </div>
          </div>
        )}

      </form>

    </div>
  );
}
