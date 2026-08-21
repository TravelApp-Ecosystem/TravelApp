import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { Colors } from '../lib/constants';

interface FamilyMember {
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

const TABS = [
  { id: 'identity', label: 'Identidad', icon: 'card-outline' },
  { id: 'family', label: 'Familia', icon: 'people-outline' },
  { id: 'fiscal', label: 'Facturación', icon: 'receipt-outline' },
  { id: 'medical', label: 'Salud & Seg.', icon: 'medkit-outline' },
  { id: 'prefs', label: 'VIP / Viajes', icon: 'airplane-outline' },
];

export default function CompleteProfileScreen() {
  const navigation = useNavigation<any>();
  const user = auth.currentUser;

  const [activeTab, setActiveTab] = useState('identity');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 1. Identidad & Documentación
  const [fullName, setFullName] = useState('');
  const [docType, setDocType] = useState<'DNI' | 'Pasaporte' | 'Otro'>('DNI');
  const [docNumber, setDocNumber] = useState('');
  const [passportNumber, setPassportNumber] = useState('');
  const [passportExpiry, setPassportExpiry] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState<'M' | 'F' | 'X' | ''>('');
  const [nationality, setNationality] = useState('Argentina');
  const [occupation, setOccupation] = useState('');

  // 2. Domicilio & Facturación AFIP
  const [street, setStreet] = useState('');
  const [streetNumber, setStreetNumber] = useState('');
  const [apartment, setApartment] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [taxCondition, setTaxCondition] = useState<'Consumidor Final' | 'Responsable Inscripto' | 'Monotributista' | 'Exento'>('Consumidor Final');
  const [cuitCuil, setCuitCuil] = useState('');
  const [businessName, setBusinessName] = useState('');

  // 3. Ficha Médica & Contacto Emergencia
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [emergencyRelation, setEmergencyRelation] = useState('');
  const [dietary, setDietary] = useState('');
  const [allergies, setAllergies] = useState('');
  const [medicalConditions, setMedicalConditions] = useState('');
  const [mobilityAssistance, setMobilityAssistance] = useState(false);
  const [hasInsurance, setHasInsurance] = useState(false);
  const [insuranceCompany, setInsuranceCompany] = useState('');

  // 4. Grupo Familiar
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [familyModalVisible, setFamilyModalVisible] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);

  // Form familiar modal
  const [mName, setMName] = useState('');
  const [mRel, setMRel] = useState('Hijo/a');
  const [mDocType, setMDocType] = useState<'DNI' | 'Pasaporte'>('DNI');
  const [mDocNum, setMDocNum] = useState('');
  const [mPassportExp, setMPassportExp] = useState('');
  const [mDob, setMDob] = useState('');
  const [mGender, setMGender] = useState<'M' | 'F' | 'X'>('M');
  const [mDietary, setMDietary] = useState('');

  // 5. Preferencias VIP
  const [seatPref, setSeatPref] = useState<'Ventana' | 'Pasillo' | 'Adelante' | 'Indistinto'>('Indistinto');
  const [roomPref, setRoomPref] = useState<'Matrimonial' | 'Camas Twin' | 'Familiar' | 'Piso Alto'>('Matrimonial');
  const [frequentFlyerProgram, setFrequentFlyerProgram] = useState('');
  const [frequentFlyerNumber, setFrequentFlyerNumber] = useState('');

  // Cargar datos actuales
  useEffect(() => {
    if (!user?.uid) return;

    const loadProfile = async () => {
      try {
        const userRef = doc(db, 'users', user.uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          const data = snap.data();
          setFullName(data.customerName || data.displayName || user.displayName || '');
          if (data.document) {
            setDocType(data.document.type || 'DNI');
            setDocNumber(data.document.number || '');
            setPassportExpiry(data.document.expiryDate || '');
            setNationality(data.document.nationality || 'Argentina');
          }
          if (data.passport) setPassportNumber(data.passport);
          if (data.dob) setDob(data.dob);
          if (data.gender) setGender(data.gender);
          if (data.occupation) setOccupation(data.occupation);

          if (data.address) {
            setStreet(data.address.street || '');
            setStreetNumber(data.address.number || '');
            setApartment(data.address.apartment || '');
            setCity(data.address.city || '');
            setProvince(data.address.province || '');
            setPostalCode(data.address.postalCode || '');
          }

          if (data.taxData) {
            setTaxCondition(data.taxData.taxCondition || 'Consumidor Final');
            setCuitCuil(data.taxData.cuitCuil || '');
            setBusinessName(data.taxData.businessName || '');
          }

          if (data.emergencyContact) {
            setEmergencyName(data.emergencyContact.name || '');
            setEmergencyPhone(data.emergencyContact.phone || '');
            setEmergencyRelation(data.emergencyContact.relationship || '');
          }

          if (data.medicalSafety) {
            setDietary(data.medicalSafety.dietaryRestrictions || '');
            setAllergies(data.medicalSafety.allergies || '');
            setMedicalConditions(data.medicalSafety.medicalConditions || '');
            setMobilityAssistance(Boolean(data.medicalSafety.mobilityAssistance));
            setHasInsurance(Boolean(data.medicalSafety.hasTravelInsurance));
            setInsuranceCompany(data.medicalSafety.insuranceCompany || '');
          } else {
            if (data.allergies) setAllergies(data.allergies);
            if (data.dietaryRestrictions) setDietary(data.dietaryRestrictions);
          }

          if (Array.isArray(data.familyMembers)) {
            setFamilyMembers(data.familyMembers);
          }

          if (data.preferences) {
            setSeatPref(data.preferences.seatPreference || 'Indistinto');
            setRoomPref(data.preferences.roomPreference || 'Matrimonial');
            setFrequentFlyerProgram(data.preferences.frequentFlyerProgram || '');
            setFrequentFlyerNumber(data.preferences.frequentFlyerNumber || '');
          }
        }
      } catch (err) {
        console.error('Error loading profile:', err);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user?.uid]);

  // Cálculo dinámico de progreso
  const calculateProgress = () => {
    let score = 0;
    if (fullName && (docNumber || passportNumber)) score += 30;
    if (dob && gender) score += 15;
    if (city && street) score += 15;
    if (emergencyName && emergencyPhone) score += 15;
    if (cuitCuil || taxCondition) score += 10;
    if (familyMembers.length > 0) score += 15;
    return Math.min(score, 100);
  };

  const progress = calculateProgress();

  // Guardar o Actualizar Miembro Familiar
  const handleSaveFamilyMember = () => {
    if (!mName.trim() || !mDocNum.trim()) {
      return Alert.alert('Campos requeridos', 'Ingresá nombre y documento del acompañante.');
    }

    if (editingMember) {
      setFamilyMembers((prev) =>
        prev.map((m) =>
          m.id === editingMember.id
            ? {
                ...m,
                fullName: mName,
                relationship: mRel,
                documentType: mDocType,
                documentNumber: mDocNum,
                passportExpiryDate: mPassportExp,
                dob: mDob,
                gender: mGender,
                dietaryRestrictions: mDietary,
              }
            : m
        )
      );
    } else {
      const newMember: FamilyMember = {
        id: `fam_${Date.now()}`,
        fullName: mName,
        relationship: mRel,
        documentType: mDocType,
        documentNumber: mDocNum,
        passportExpiryDate: mPassportExp,
        dob: mDob,
        gender: mGender,
        dietaryRestrictions: mDietary,
      };
      setFamilyMembers((prev) => [...prev, newMember]);
    }

    setFamilyModalVisible(false);
    setEditingMember(null);
    resetFamilyModal();
  };

  const resetFamilyModal = () => {
    setMName('');
    setMRel('Hijo/a');
    setMDocType('DNI');
    setMDocNum('');
    setMPassportExp('');
    setMDob('');
    setMGender('M');
    setMDietary('');
  };

  const openAddFamily = () => {
    resetFamilyModal();
    setEditingMember(null);
    setFamilyModalVisible(true);
  };

  const openEditFamily = (member: FamilyMember) => {
    setEditingMember(member);
    setMName(member.fullName);
    setMRel(member.relationship);
    setMDocType(member.documentType === 'Pasaporte' ? 'Pasaporte' : 'DNI');
    setMDocNum(member.documentNumber);
    setMPassportExp(member.passportExpiryDate || '');
    setMDob(member.dob || '');
    setMGender(member.gender || 'M');
    setMDietary(member.dietaryRestrictions || '');
    setFamilyModalVisible(true);
  };

  const removeFamilyMember = (id: string) => {
    Alert.alert('Eliminar familiar', '¿Deseas quitar este pasajero frecuente?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => setFamilyMembers((prev) => prev.filter((m) => m.id !== id)),
      },
    ]);
  };

  // Guardar todo en Firebase
  const handleSaveAll = async () => {
    if (!user?.uid) return;
    setSaving(true);

    try {
      const payload: any = {
        customerName: fullName.trim() || user.displayName || 'Pasajero',
        displayName: fullName.trim() || user.displayName || 'Pasajero',
        customerLevel: 2, // Ascenso a VIP
        customerStatus: 'Cliente',
        profileCompletedPercentage: calculateProgress(),
        dob: dob.trim(),
        gender: gender || null,
        nationality: nationality.trim(),
        occupation: occupation.trim(),
        document: {
          type: docType,
          number: docNumber.trim(),
          expiryDate: passportExpiry.trim(),
          nationality: nationality.trim(),
        },
        passport: passportNumber.trim() || null,
        address: {
          street: street.trim(),
          number: streetNumber.trim(),
          apartment: apartment.trim(),
          city: city.trim(),
          province: province.trim(),
          postalCode: postalCode.trim(),
          country: 'Argentina',
        },
        taxData: {
          taxCondition,
          cuitCuil: cuitCuil.trim(),
          businessName: businessName.trim(),
        },
        emergencyContact: {
          name: emergencyName.trim(),
          phone: emergencyPhone.trim(),
          relationship: emergencyRelation.trim(),
        },
        allergies: allergies.trim(),
        dietaryRestrictions: dietary.trim(),
        medicalSafety: {
          allergies: allergies.trim(),
          dietaryRestrictions: dietary.trim(),
          medicalConditions: medicalConditions.trim(),
          mobilityAssistance,
          hasTravelInsurance: hasInsurance,
          insuranceCompany: insuranceCompany.trim(),
        },
        familyMembers,
        preferences: {
          seatPreference: seatPref,
          roomPreference: roomPref,
          frequentFlyerProgram: frequentFlyerProgram.trim(),
          frequentFlyerNumber: frequentFlyerNumber.trim(),
        },
        updatedAt: Date.now(),
      };

      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, payload).catch(async () => {
        await setDoc(userRef, payload, { merge: true });
      });

      // También sincronizar en crm_customers si existe
      try {
        const crmRef = doc(db, 'crm_customers', user.uid);
        await setDoc(crmRef, { ...payload, email: user.email, phone: user.phoneNumber || '' }, { merge: true });
      } catch (e) {
        // Ignorar si falla la sincronización secundaria
      }

      Alert.alert(
        '¡Perfil Guardado con Éxito!',
        'Tus datos de pasajero y grupo familiar están sincronizados. ¡Tu cuenta ahora es VIP Nivel 2!',
        [{ text: 'Aceptar', onPress: () => navigation.goBack() }]
      );
    } catch (err: any) {
      console.error('Error saving profile:', err);
      Alert.alert('Error al guardar', err.message || 'No se pudieron actualizar los datos.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.accent} />
        <Text style={styles.loadingText}>Cargando expediente de pasajero...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.headerTitle}>Ficha de Pasajero & Familia</Text>
          <Text style={styles.headerSubtitle}>Perfil Ampliado Nivel 2 VIP</Text>
        </View>
        <TouchableOpacity onPress={handleSaveAll} disabled={saving} style={styles.saveHeaderBtn}>
          {saving ? (
            <ActivityIndicator size="small" color={Colors.accent} />
          ) : (
            <Text style={styles.saveHeaderBtnText}>Guardar</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Progress Bar Card */}
      <View style={styles.progressCard}>
        <View style={styles.progressTopRow}>
          <View style={styles.progressTitleBox}>
            <Ionicons name="shield-checkmark" size={18} color={progress === 100 ? Colors.success : Colors.accent} />
            <Text style={styles.progressTitle}>
              {progress === 100 ? 'Perfil 100% Completo (VIP)' : `Perfil completado al ${progress}%`}
            </Text>
          </View>
          <Text style={styles.vipBadge}>VIP N2</Text>
        </View>
        <View style={styles.progressBarTrack}>
          <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabContent}>
          {TABS.map((tab) => {
            const isSelected = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                style={[styles.tabButton, isSelected && styles.tabButtonActive]}
              >
                <Ionicons
                  name={tab.icon as any}
                  size={18}
                  color={isSelected ? Colors.white : Colors.textSecondary}
                />
                <Text style={[styles.tabButtonText, isSelected && styles.tabButtonTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Scrollable Form Content */}
      <ScrollView contentContainerStyle={styles.formContent} showsVerticalScrollIndicator={false}>
        {/* ===================== TAB 1: IDENTIDAD ===================== */}
        {activeTab === 'identity' && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeading}>Datos Personales & Emisión IATA</Text>
            <Text style={styles.sectionSub}>Obligatorios para emisión de pasajes aéreos y reservas hoteleras.</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nombre Completo Legal (según DNI/Pasaporte) *</Text>
              <TextInput
                style={styles.textInput}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Ej: Juan Carlos Pérez"
                placeholderTextColor={Colors.textMuted}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Tipo de Doc. *</Text>
                <View style={styles.pillRow}>
                  {(['DNI', 'Pasaporte'] as const).map((t) => (
                    <TouchableOpacity
                      key={t}
                      onPress={() => setDocType(t)}
                      style={[styles.pillBtn, docType === t && styles.pillBtnActive]}
                    >
                      <Text style={[styles.pillBtnText, docType === t && styles.pillBtnTextActive]}>{t}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={[styles.inputGroup, { flex: 1.4 }]}>
                <Text style={styles.inputLabel}>N° Documento *</Text>
                <TextInput
                  style={styles.textInput}
                  value={docNumber}
                  onChangeText={setDocNumber}
                  placeholder="Ej: 35.888.999"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1.2 }]}>
                <Text style={styles.inputLabel}>N° Pasaporte (Opcional)</Text>
                <TextInput
                  style={styles.textInput}
                  value={passportNumber}
                  onChangeText={setPassportNumber}
                  placeholder="Ej: AAA998877"
                  placeholderTextColor={Colors.textMuted}
                  autoCapitalize="characters"
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Vto. Pasaporte</Text>
                <TextInput
                  style={styles.textInput}
                  value={passportExpiry}
                  onChangeText={setPassportExpiry}
                  placeholder="AAAA-MM-DD"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1.2 }]}>
                <Text style={styles.inputLabel}>Fecha de Nacimiento *</Text>
                <TextInput
                  style={styles.textInput}
                  value={dob}
                  onChangeText={setDob}
                  placeholder="AAAA-MM-DD (Ej: 1988-04-20)"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Género (GDS) *</Text>
                <View style={styles.pillRow}>
                  {(['M', 'F', 'X'] as const).map((g) => (
                    <TouchableOpacity
                      key={g}
                      onPress={() => setGender(g)}
                      style={[styles.pillBtnSmall, gender === g && styles.pillBtnActive]}
                    >
                      <Text style={[styles.pillBtnText, gender === g && styles.pillBtnTextActive]}>{g}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Nacionalidad</Text>
                <TextInput
                  style={styles.textInput}
                  value={nationality}
                  onChangeText={setNationality}
                  placeholder="Argentina"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Ocupación / Profesión</Text>
                <TextInput
                  style={styles.textInput}
                  value={occupation}
                  onChangeText={setOccupation}
                  placeholder="Ej: Ingeniero"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>
            </View>
          </View>
        )}

        {/* ===================== TAB 2: GRUPO FAMILIAR ===================== */}
        {activeTab === 'family' && (
          <View style={styles.sectionCard}>
            <View style={styles.headingWithAction}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionHeading}>Mi Grupo Familiar & Acompañantes</Text>
                <Text style={styles.sectionSub}>Gestioná pasajeros para autocompletar viajes en 1-Click.</Text>
              </View>
              <TouchableOpacity onPress={openAddFamily} style={styles.addBtn}>
                <Ionicons name="person-add" size={16} color={Colors.white} />
                <Text style={styles.addBtnText}>+ Agregar</Text>
              </TouchableOpacity>
            </View>

            {familyMembers.length === 0 ? (
              <View style={styles.emptyBox}>
                <Ionicons name="people-outline" size={44} color={Colors.textMuted} />
                <Text style={styles.emptyTitle}>No tenés acompañantes registrados</Text>
                <Text style={styles.emptyDesc}>
                  Agregá a tu pareja, hijos o amigos para reservar paquetes de viaje en grupo rápidamente.
                </Text>
                <TouchableOpacity onPress={openAddFamily} style={styles.emptyActionBtn}>
                  <Text style={styles.emptyActionBtnText}>+ Cargar Primer Familiar</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.familyList}>
                {familyMembers.map((member) => (
                  <View key={member.id} style={styles.familyCard}>
                    <View style={styles.familyAvatar}>
                      <Text style={styles.familyAvatarText}>
                        {member.fullName.substring(0, 2).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.familyInfo}>
                      <View style={styles.familyHeaderRow}>
                        <Text style={styles.familyName}>{member.fullName}</Text>
                        <Text style={styles.familyRelBadge}>{member.relationship}</Text>
                      </View>
                      <Text style={styles.familyDoc}>
                        {member.documentType}: {member.documentNumber}
                        {member.dob ? ` · Nac: ${member.dob}` : ''}
                      </Text>
                      {member.dietaryRestrictions ? (
                        <Text style={styles.familyDiet}>🥗 Dieta: {member.dietaryRestrictions}</Text>
                      ) : null}
                    </View>
                    <View style={styles.familyActions}>
                      <TouchableOpacity onPress={() => openEditFamily(member)} style={styles.iconBtn}>
                        <Ionicons name="pencil-outline" size={18} color={Colors.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => removeFamilyMember(member.id)} style={styles.iconBtn}>
                        <Ionicons name="trash-outline" size={18} color={Colors.danger} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* ===================== TAB 3: FACTURACIÓN & AFIP ===================== */}
        {activeTab === 'fiscal' && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeading}>Domicilio & Facturación Fiscal</Text>
            <Text style={styles.sectionSub}>Datos requeridos para pick-ups a domicilio y facturación AFIP/ARCA.</Text>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 2 }]}>
                <Text style={styles.inputLabel}>Calle / Dirección</Text>
                <TextInput
                  style={styles.textInput}
                  value={street}
                  onChangeText={setStreet}
                  placeholder="Ej: Av. Santa Fe"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>N°</Text>
                <TextInput
                  style={styles.textInput}
                  value={streetNumber}
                  onChangeText={setStreetNumber}
                  placeholder="1234"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Piso/Depto</Text>
                <TextInput
                  style={styles.textInput}
                  value={apartment}
                  onChangeText={setApartment}
                  placeholder="4B"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1.2 }]}>
                <Text style={styles.inputLabel}>Ciudad / Localidad</Text>
                <TextInput
                  style={styles.textInput}
                  value={city}
                  onChangeText={setCity}
                  placeholder="Ej: San Miguel de Tucumán"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Provincia</Text>
                <TextInput
                  style={styles.textInput}
                  value={province}
                  onChangeText={setProvince}
                  placeholder="Tucumán"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 0.8 }]}>
                <Text style={styles.inputLabel}>CP</Text>
                <TextInput
                  style={styles.textInput}
                  value={postalCode}
                  onChangeText={setPostalCode}
                  placeholder="4000"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>
            </View>

            <View style={styles.divider} />
            <Text style={styles.sectionSubHeading}>Condición Fiscal (IVA / CUIT)</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Condición frente al IVA</Text>
              <View style={styles.pillGrid}>
                {(['Consumidor Final', 'Monotributista', 'Responsable Inscripto', 'Exento'] as const).map((c) => (
                  <TouchableOpacity
                    key={c}
                    onPress={() => setTaxCondition(c)}
                    style={[styles.pillBtnChoice, taxCondition === c && styles.pillBtnActive]}
                  >
                    <Text style={[styles.pillBtnChoiceText, taxCondition === c && styles.pillBtnTextActive]}>
                      {c}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>CUIT / CUIL</Text>
                <TextInput
                  style={styles.textInput}
                  value={cuitCuil}
                  onChangeText={setCuitCuil}
                  placeholder="20-35888999-2"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Razón Social (opcional)</Text>
                <TextInput
                  style={styles.textInput}
                  value={businessName}
                  onChangeText={setBusinessName}
                  placeholder="Nombre de la empresa"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>
            </View>
          </View>
        )}

        {/* ===================== TAB 4: SALUD & SEGURIDAD ===================== */}
        {activeTab === 'medical' && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeading}>Ficha Médica & Contacto de Emergencia</Text>
            <Text style={styles.sectionSub}>Garantizamos tu bienestar en excursiones, traslados y vuelos.</Text>

            <Text style={styles.sectionSubHeading}>Contacto de Emergencia en Origen</Text>
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1.2 }]}>
                <Text style={styles.inputLabel}>Nombre del Contacto</Text>
                <TextInput
                  style={styles.textInput}
                  value={emergencyName}
                  onChangeText={setEmergencyName}
                  placeholder="Ej: María Pérez"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Teléfono</Text>
                <TextInput
                  style={styles.textInput}
                  value={emergencyPhone}
                  onChangeText={setEmergencyPhone}
                  placeholder="+54 9 381..."
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Vínculo / Parentesco</Text>
              <TextInput
                style={styles.textInput}
                value={emergencyRelation}
                onChangeText={setEmergencyRelation}
                placeholder="Ej: Cónyuge / Padre / Hermano"
                placeholderTextColor={Colors.textMuted}
              />
            </View>

            <View style={styles.divider} />
            <Text style={styles.sectionSubHeading}>Dietas & Restricciones Médicas</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Restricciones Alimentarias / Dietas Especiales</Text>
              <TextInput
                style={styles.textInput}
                value={dietary}
                onChangeText={setDietary}
                placeholder="Ej: Celíaco (Sin TACC), Vegano, Vegetariano, Kosher..."
                placeholderTextColor={Colors.textMuted}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Alergias o Medicación Habitual</Text>
              <TextInput
                style={[styles.textInput, { height: 60 }]}
                value={allergies}
                onChangeText={setAllergies}
                placeholder="Ej: Alérgico a penicilina, mariscos, frutos secos..."
                placeholderTextColor={Colors.textMuted}
                multiline
              />
            </View>

            <View style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.switchLabel}>¿Requiere Asistencia Especial / Silla de Ruedas?</Text>
                <Text style={styles.switchSub}>Asistencia en aeropuerto o vehículos adaptados.</Text>
              </View>
              <Switch
                value={mobilityAssistance}
                onValueChange={setMobilityAssistance}
                trackColor={{ false: Colors.border, true: Colors.accent }}
              />
            </View>

            <View style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.switchLabel}>¿Posee Seguro / Asistencia al Viajero propia?</Text>
                <Text style={styles.switchSub}>Universal Assistance, Assist Card, etc.</Text>
              </View>
              <Switch
                value={hasInsurance}
                onValueChange={setHasInsurance}
                trackColor={{ false: Colors.border, true: Colors.accent }}
              />
            </View>

            {hasInsurance && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Compañía & N° de Póliza</Text>
                <TextInput
                  style={styles.textInput}
                  value={insuranceCompany}
                  onChangeText={setInsuranceCompany}
                  placeholder="Ej: Assist Card - Póliza 98765432"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>
            )}
          </View>
        )}

        {/* ===================== TAB 5: PREFERENCIAS VIP ===================== */}
        {activeTab === 'prefs' && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeading}>Preferencias de Viaje & Programas VIP</Text>
            <Text style={styles.sectionSub}>Personalizá tu experiencia en vuelos, hoteles y transfers.</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Preferencia de Asiento en Avión / Bus</Text>
              <View style={styles.pillGrid}>
                {(['Ventana', 'Pasillo', 'Adelante', 'Indistinto'] as const).map((s) => (
                  <TouchableOpacity
                    key={s}
                    onPress={() => setSeatPref(s)}
                    style={[styles.pillBtnChoice, seatPref === s && styles.pillBtnActive]}
                  >
                    <Text style={[styles.pillBtnChoiceText, seatPref === s && styles.pillBtnTextActive]}>
                      {s}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Preferencia de Habitación en Hoteles</Text>
              <View style={styles.pillGrid}>
                {(['Matrimonial', 'Camas Twin', 'Familiar', 'Piso Alto'] as const).map((r) => (
                  <TouchableOpacity
                    key={r}
                    onPress={() => setRoomPref(r)}
                    style={[styles.pillBtnChoice, roomPref === r && styles.pillBtnActive]}
                  >
                    <Text style={[styles.pillBtnChoiceText, roomPref === r && styles.pillBtnTextActive]}>
                      {r}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.divider} />
            <Text style={styles.sectionSubHeading}>Programa de Pasajero Frecuente (Millas)</Text>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1.2 }]}>
                <Text style={styles.inputLabel}>Aerolínea / Programa</Text>
                <TextInput
                  style={styles.textInput}
                  value={frequentFlyerProgram}
                  onChangeText={setFrequentFlyerProgram}
                  placeholder="Ej: Aerolíneas Plus, LATAM..."
                  placeholderTextColor={Colors.textMuted}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>N° de Socio</Text>
                <TextInput
                  style={styles.textInput}
                  value={frequentFlyerNumber}
                  onChangeText={setFrequentFlyerNumber}
                  placeholder="12345678"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>
            </View>
          </View>
        )}

        {/* Save Button Footer */}
        <TouchableOpacity style={styles.mainSaveBtn} onPress={handleSaveAll} disabled={saving}>
          {saving ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={20} color={Colors.white} />
              <Text style={styles.mainSaveBtnText}>Guardar Ficha de Pasajero</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ===================== MODAL FAMILIAR ===================== */}
      <Modal visible={familyModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingMember ? 'Editar Acompañante' : 'Nuevo Acompañante Familiar'}
              </Text>
              <TouchableOpacity onPress={() => setFamilyModalVisible(false)}>
                <Ionicons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 450 }}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nombre Completo *</Text>
                <TextInput
                  style={styles.textInput}
                  value={mName}
                  onChangeText={setMName}
                  placeholder="Ej: Sofía Pérez"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Parentesco / Relación *</Text>
                <View style={styles.pillGrid}>
                  {['Cónyuge', 'Hijo/a', 'Padre/Madre', 'Hermano/a', 'Amigo/a', 'Colega'].map((rel) => (
                    <TouchableOpacity
                      key={rel}
                      onPress={() => setMRel(rel)}
                      style={[styles.pillBtnChoice, mRel === rel && styles.pillBtnActive]}
                    >
                      <Text style={[styles.pillBtnChoiceText, mRel === rel && styles.pillBtnTextActive]}>
                        {rel}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Documento</Text>
                  <View style={styles.pillRow}>
                    {(['DNI', 'Pasaporte'] as const).map((t) => (
                      <TouchableOpacity
                        key={t}
                        onPress={() => setMDocType(t)}
                        style={[styles.pillBtn, mDocType === t && styles.pillBtnActive]}
                      >
                        <Text style={[styles.pillBtnText, mDocType === t && styles.pillBtnTextActive]}>{t}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                <View style={[styles.inputGroup, { flex: 1.4 }]}>
                  <Text style={styles.inputLabel}>N° Documento *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={mDocNum}
                    onChangeText={setMDocNum}
                    placeholder="Ej: 42111222"
                    placeholderTextColor={Colors.textMuted}
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1.2 }]}>
                  <Text style={styles.inputLabel}>Fecha de Nacimiento</Text>
                  <TextInput
                    style={styles.textInput}
                    value={mDob}
                    onChangeText={setMDob}
                    placeholder="AAAA-MM-DD"
                    placeholderTextColor={Colors.textMuted}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Género</Text>
                  <View style={styles.pillRow}>
                    {(['M', 'F', 'X'] as const).map((g) => (
                      <TouchableOpacity
                        key={g}
                        onPress={() => setMGender(g)}
                        style={[styles.pillBtnSmall, mGender === g && styles.pillBtnActive]}
                      >
                        <Text style={[styles.pillBtnText, mGender === g && styles.pillBtnTextActive]}>{g}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Restricción Dietaria / Alergias</Text>
                <TextInput
                  style={styles.textInput}
                  value={mDietary}
                  onChangeText={setMDietary}
                  placeholder="Ej: Sin sal, vegetariano, etc."
                  placeholderTextColor={Colors.textMuted}
                />
              </View>
            </ScrollView>

            <TouchableOpacity style={styles.modalSaveBtn} onPress={handleSaveFamilyMember}>
              <Text style={styles.modalSaveBtnText}>
                {editingMember ? 'Actualizar Acompañante' : 'Guardar Acompañante'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
  loadingText: { marginTop: 12, fontSize: 14, color: Colors.textSecondary, fontWeight: '600' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 54,
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary },
  headerSubtitle: { fontSize: 11, fontWeight: '700', color: Colors.accent, marginTop: 1 },
  saveHeaderBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: Colors.accent + '15' },
  saveHeaderBtnText: { fontSize: 13, fontWeight: '800', color: Colors.accent },

  progressCard: {
    margin: 16,
    marginBottom: 8,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  progressTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  progressTitleBox: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  progressTitle: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
  vipBadge: {
    fontSize: 10,
    fontWeight: '800',
    backgroundColor: '#FEF3C7',
    color: '#D97706',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  progressBarTrack: { height: 6, backgroundColor: '#E2E8F0', borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: Colors.accent, borderRadius: 3 },

  tabBar: { backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tabContent: { paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.background,
  },
  tabButtonActive: { backgroundColor: Colors.primary },
  tabButtonText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  tabButtonTextActive: { color: Colors.white, fontWeight: '700' },

  formContent: { padding: 16 },
  sectionCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
    gap: 12,
  },
  sectionHeading: { fontSize: 16, fontWeight: '800', color: Colors.primary },
  sectionSub: { fontSize: 12, color: Colors.textSecondary, marginTop: -6, marginBottom: 6 },
  sectionSubHeading: { fontSize: 13, fontWeight: '800', color: Colors.textPrimary, marginTop: 4 },

  inputGroup: { gap: 4 },
  inputLabel: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.3 },
  textInput: {
    backgroundColor: Colors.background,
    borderWidth: 1.2,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  row: { flexDirection: 'row', gap: 10 },

  pillRow: { flexDirection: 'row', gap: 6 },
  pillBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: Colors.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pillBtnSmall: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: Colors.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pillBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  pillBtnText: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary },
  pillBtnTextActive: { color: Colors.white },

  pillGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pillBtnChoice: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pillBtnChoiceText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },

  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 8 },

  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  switchLabel: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
  switchSub: { fontSize: 11, color: Colors.textMuted },

  headingWithAction: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  addBtnText: { fontSize: 12, fontWeight: '800', color: Colors.white },

  emptyBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: 24, gap: 6 },
  emptyTitle: { fontSize: 14, fontWeight: '800', color: Colors.textPrimary },
  emptyDesc: { fontSize: 12, color: Colors.textMuted, textAlign: 'center', paddingHorizontal: 16 },
  emptyActionBtn: {
    marginTop: 8,
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  emptyActionBtnText: { fontSize: 12, fontWeight: '800', color: Colors.primary },

  familyList: { gap: 10, marginTop: 4 },
  familyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  familyAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  familyAvatarText: { fontSize: 14, fontWeight: '800', color: Colors.primary },
  familyInfo: { flex: 1, gap: 2 },
  familyHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  familyName: { fontSize: 14, fontWeight: '800', color: Colors.textPrimary },
  familyRelBadge: {
    fontSize: 10,
    fontWeight: '700',
    backgroundColor: Colors.accent + '20',
    color: Colors.accent,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  familyDoc: { fontSize: 11, color: Colors.textSecondary },
  familyDiet: { fontSize: 10, color: '#059669', fontWeight: '600' },
  familyActions: { flexDirection: 'row', gap: 6 },
  iconBtn: { padding: 6 },

  mainSaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.accent,
    borderRadius: 16,
    paddingVertical: 15,
    marginTop: 16,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  mainSaveBtnText: { fontSize: 16, fontWeight: '800', color: Colors.white },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    gap: 12,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  modalTitle: { fontSize: 17, fontWeight: '800', color: Colors.textPrimary },
  modalSaveBtn: {
    backgroundColor: Colors.accent,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  modalSaveBtnText: { fontSize: 15, fontWeight: '800', color: Colors.white },
});
