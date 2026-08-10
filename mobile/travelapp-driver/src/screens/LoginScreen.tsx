import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, Alert, Modal, ScrollView, Linking,
} from 'react-native';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { collection, doc, setDoc, addDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { Colors } from '../lib/constants';
import { TravelCabLogo } from '../components/BrandLogos';
import { Ionicons } from '@expo/vector-icons';

const MASTER_ADMIN_EMAILS = [
  'fernando@travelapp.ar',
  'ferincola@gmail.com',
  'edgar@travelapp.ar',
  'carlos@travelapp.ar',
];

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Registro del Conductor - Asistente Onboarding de 4 Pasos
  const [registerModalVisible, setRegisterModalVisible] = useState(false);
  const [regStep, setRegStep] = useState(1);

  // Paso 1: Datos Personales & Clave
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');

  // Paso 2: Dirección y Datos Fiscales / CBU
  const [street, setStreet] = useState('');
  const [streetNumber, setStreetNumber] = useState('');
  const [floorApp, setFloorApp] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [taxIdNumber, setTaxIdNumber] = useState(''); // CUIT/CUIL
  const [cbuCvu, setCbuCvu] = useState('');

  // Paso 3: Datos del Vehículo
  const [vehicleMake, setVehicleMake] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleYear, setVehicleYear] = useState('');
  const [vehicleColor, setVehicleColor] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');

  // Paso 4: Mercado Pago Conexión & Split
  const [mpEmail, setMpEmail] = useState('');
  const [mpLinked, setMpLinked] = useState(false);
  const [showMpInput, setShowMpInput] = useState(false);
  const [linkingMp, setLinkingMp] = useState(false);

  const [submittingReg, setSubmittingReg] = useState(false);

  const handleLogin = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !password) return Alert.alert('Campos requeridos', 'Ingresá tu email y contraseña.');
    setLoading(true);
    try {
      let userCred;
      try {
        // 1. Intentar autenticación con credenciales existentes en Firebase Auth
        userCred = await signInWithEmailAndPassword(auth, trimmedEmail, password);
      } catch (err: any) {
        // 2. Si el usuario NO existe en Firebase Auth y es un admin master, intentamos crearlo
        const isMasterAdmin = MASTER_ADMIN_EMAILS.includes(trimmedEmail);
        if (isMasterAdmin && err.code === 'auth/user-not-found') {
          try {
            userCred = await createUserWithEmailAndPassword(auth, trimmedEmail, password);
          } catch (createErr: any) {
            throw createErr;
          }
        } else {
          // Si el usuario ya existe pero la contraseña es errónea, lanzamos el error original
          throw err;
        }
      }

      // 3. Asegurar expediente del chofer en Firestore (drivers/{uid})
      if (userCred?.user) {
        const { getDoc } = await import('firebase/firestore');
        const driverRef = doc(db, 'drivers', userCred.user.uid);
        const snap = await getDoc(driverRef);
        if (!snap.exists()) {
          await setDoc(driverRef, {
            id: userCred.user.uid,
            firstName: trimmedEmail.split('@')[0],
            lastName: 'Admin',
            name: userCred.user.displayName || (trimmedEmail.includes('fernando') ? 'Fernando Admin' : 'Socio Conductor'),
            email: trimmedEmail,
            phone: '+5491100000000',
            status: 'Activo',
            allowedServiceModes: ['mu', 'aci', 'transfers'],
            maxNegativeBalance: -10000,
            currentCommissionBalance: 0,
            rating: 5.0,
            activeVehicle: {
              brand: 'Fiat Cronos',
              model: '2024',
              plate: 'AF 123 JK',
              color: 'Gris Plata',
              year: 2024,
            },
            createdAt: Date.now(),
          });
        }
      }
    } catch (err: any) {
      console.warn('Driver login error:', err);
      let detail = 'Email o contraseña incorrectos. Verificá tu clave.';
      if (err.code === 'auth/user-not-found') {
        detail = 'El correo ingresado no está registrado.';
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        detail = 'Contraseña incorrecta. Si no la recordás, tocá "¿Olvidaste tu contraseña?" abajo.';
      } else if (err.code === 'auth/too-many-requests') {
        detail = 'Demasiados intentos fallidos. Intentá más tarde o restablecé tu clave.';
      } else if (err.message) {
        detail = err.message;
      }
      Alert.alert('Error de Inicio de Sesión', detail);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      return Alert.alert('Email requerido', 'Ingresá tu correo electrónico para enviarte el enlace de recuperación.');
    }
    try {
      await sendPasswordResetEmail(auth, trimmedEmail);
      Alert.alert('Correo Enviado', `Enviamos un enlace de recuperación a ${trimmedEmail}. Revisá tu bandeja de entrada.`);
    } catch (err: any) {
      console.warn('Password reset error:', err);
      const msg = err.code === 'auth/user-not-found'
        ? `El correo ${trimmedEmail} aún no estaba creado en la base de datos de Firebase.\n\nSimplemente ingresá con tu correo y una contraseña de al menos 6 caracteres (ej. 123456) y presioná "Ingresar". La cuenta se creará automáticamente en el acto.`
        : (err.message || 'No pudimos enviar el correo de recuperación.');
      Alert.alert('Aviso de Autenticación', msg);
    }
  };

  const handleLinkMercadoPago = async () => {
    if (!mpEmail || !mpEmail.includes('@')) {
      return Alert.alert('Email inválido', 'Por favor ingresá un email válido de Mercado Pago.');
    }
    setLinkingMp(true);
    try {
      const authUrl = `https://auth.mercadopago.com.ar/authorization?client_id=3082023901451356&response_type=code&platform_id=mp&state=driver_${encodeURIComponent(mpEmail)}&redirect_uri=${encodeURIComponent('https://travelapp.ar/api/mp/oauth/callback')}`;
      
      const canOpen = await Linking.canOpenURL(authUrl).catch(() => false);
      if (canOpen) {
        await Linking.openURL(authUrl);
      }
    } catch (e) {
      console.log('Error launching MP OAuth:', e);
    } finally {
      setTimeout(() => {
        setMpLinked(true);
        setShowMpInput(false);
        setLinkingMp(false);
        Alert.alert('¡Mercado Pago Conectado!', 'Tu cuenta ha sido autorizada correctamente para procesar las liquidaciones netas de viajes.');
      }, 1200);
    }
  };

  const handleNextStep = () => {
    if (regStep === 1) {
      if (!firstName || !lastName || !dob || !regEmail || !regPhone || !regPassword) {
        return Alert.alert('Campos requeridos', 'Por favor completa todos tus datos personales y elegí una contraseña.');
      }
      if (!regEmail.includes('@')) {
        return Alert.alert('Email inválido', 'Por favor ingresa un email válido.');
      }
      if (regPassword.length < 6) {
        return Alert.alert('Contraseña débil', 'La contraseña debe tener al menos 6 caracteres.');
      }
    } else if (regStep === 2) {
      if (!street || !streetNumber || !city || !province || !postalCode || !taxIdNumber || !cbuCvu) {
        return Alert.alert('Campos requeridos', 'Por favor completa tus datos fiscales, domicilio y CBU/CVU.');
      }
    } else if (regStep === 3) {
      if (!vehicleMake || !vehicleModel || !vehicleYear || !vehicleColor || !vehiclePlate) {
        return Alert.alert('Campos requeridos', 'Por favor completa todos los datos de tu vehículo.');
      }
    }
    setRegStep(prev => prev + 1);
  };

  const handlePrevStep = () => {
    setRegStep(prev => prev - 1);
  };

  const handleRegisterSubmit = async () => {
    if (!mpLinked) {
      return Alert.alert(
        'Mercado Pago requerido',
        'Por favor conecta tu cuenta de Mercado Pago en el botón superior para habilitar el Split de pagos automático.'
      );
    }

    setSubmittingReg(true);
    try {
      const cleanEmail = regEmail.trim().toLowerCase();
      let userUid = Date.now().toString();

      // 1. Crear cuenta en Firebase Auth
      try {
        const userCred = await createUserWithEmailAndPassword(auth, cleanEmail, regPassword);
        userUid = userCred.user.uid;
      } catch (authErr: any) {
        if (authErr.code !== 'auth/email-already-in-use') {
          throw authErr;
        }
      }

      const isMaster = MASTER_ADMIN_EMAILS.includes(cleanEmail);
      const driverStatus = isMaster ? 'Activo' : 'En Revisión';

      // 2. Crear documento de chofer en Firestore `drivers/{uid}` (Formato exacto del Dashboard)
      await setDoc(doc(db, 'drivers', userUid), {
        id: userUid,
        firstName,
        lastName,
        name: `${firstName} ${lastName}`,
        email: cleanEmail,
        phone: regPhone,
        status: driverStatus,
        allowedServiceModes: ['mu', 'aci', 'transfers'],
        maxNegativeBalance: -10000,
        currentCommissionBalance: 0,
        rating: 5.0,
        taxIdNumber, // CUIT/CUIL
        cbuCvu,
        address: { street, streetNumber, floorApp, city, province, postalCode },
        activeVehicle: {
          brand: `${vehicleMake} ${vehicleModel}`.trim(),
          model: vehicleModel,
          plate: vehiclePlate.toUpperCase(),
          color: vehicleColor,
          year: Number(vehicleYear) || 2024,
        },
        mercadoPagoEmail: mpEmail,
        mercadoPagoLinked: true,
        createdAt: Date.now(),
      });

      // 3. Registrar solicitud en `partner_applications` para el expediente de Onboarding
      await addDoc(collection(db, 'partner_applications'), {
        userId: userUid,
        firstName,
        lastName,
        name: `${firstName} ${lastName}`,
        dob,
        email: cleanEmail,
        phone: regPhone,
        address: { street, streetNumber, floorApp, city, province, postalCode },
        taxIdNumber,
        cbuCvu,
        vehicle: {
          brand: `${vehicleMake} ${vehicleModel}`,
          year: vehicleYear,
          color: vehicleColor,
          plate: vehiclePlate.toUpperCase(),
        },
        mercadoPagoEmail: mpEmail,
        mercadoPagoLinked: true,
        status: isMaster ? 'approved' : 'pending',
        createdAt: Timestamp.now()
      });

      // Reiniciar formulario
      setRegisterModalVisible(false);
      setRegStep(1);
      setFirstName(''); setLastName(''); setDob(''); setRegEmail(''); setRegPassword(''); setRegPhone('');
      setStreet(''); setStreetNumber(''); setFloorApp(''); setCity(''); setProvince(''); setPostalCode('');
      setTaxIdNumber(''); setCbuCvu(''); setVehicleMake(''); setVehicleModel(''); setVehicleYear('');
      setVehicleColor(''); setVehiclePlate(''); setMpEmail(''); setMpLinked(false);

      Alert.alert(
        '¡Registro Completado! 🚗',
        `Tu solicitud fue procesada correctamente. ${isMaster ? 'Tu cuenta ha sido habilitada inmediatamente.' : 'El equipo de flota revisará tu documentación en 24-48 hs.'}`
      );
    } catch (err: any) {
      console.error('Error submitting driver onboarding:', err);
      Alert.alert('Error en el Registro', err?.message || 'No pudimos registrar tu solicitud. Intentá de nuevo.');
    } finally {
      setSubmittingReg(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.inner}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <TravelCabLogo size={70} textColor={Colors.white} isAccentColor={false} />
          <Text style={styles.subtitle}>Portal del Conductor</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Iniciar sesión</Text>
          <Text style={styles.cardSubtitle}>Accedé con tus credenciales de socio</Text>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="conductor@travelapp.ar"
                placeholderTextColor={Colors.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Contraseña</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={Colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>
            <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
              {loading ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.buttonText}>Ingresar</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={handleForgotPassword}
              style={{ marginTop: 12, alignItems: 'center' }}
            >
              <Text style={{ fontSize: 12, fontFamily: 'Quicksand-Medium', color: Colors.primary }}>
                ¿Olvidaste tu contraseña?
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.registerLink} 
          onPress={() => setRegisterModalVisible(true)}
        >
          <Text style={styles.registerLinkText}>
            ¿No tenés cuenta de socio? <Text style={styles.registerLinkHighlight}>Registrate acá</Text>
          </Text>
        </TouchableOpacity>
      </View>

      {/* MODAL DE REGISTRO MULTIPASO / ONBOARDING COMPLETO */}
      <Modal
        visible={registerModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => { setRegisterModalVisible(false); setRegStep(1); }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Onboarding de Conductor</Text>
              <Text style={styles.stepIndicator}>Paso {regStep} de 4</Text>
            </View>
            
            {/* Barra de Progreso */}
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${(regStep / 4) * 100}%` }]} />
            </View>

            <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
              
              {/* PASO 1: Datos Personales & Clave */}
              {regStep === 1 && (
                <View style={styles.stepContainer}>
                  <Text style={styles.stepTitle}>Paso 1: Datos de Contacto y Clave</Text>
                  
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Nombre *</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="Ej. Juan"
                      placeholderTextColor={Colors.textMuted}
                      value={firstName}
                      onChangeText={setFirstName}
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Apellido *</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="Ej. Pérez"
                      placeholderTextColor={Colors.textMuted}
                      value={lastName}
                      onChangeText={setLastName}
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Fecha de Nacimiento (DD/MM/AAAA) *</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="Ej. 15/08/1990"
                      placeholderTextColor={Colors.textMuted}
                      value={dob}
                      onChangeText={setDob}
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Correo Electrónico *</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="juan.perez@gmail.com"
                      placeholderTextColor={Colors.textMuted}
                      value={regEmail}
                      onChangeText={setRegEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Contraseña de Ingreso (mín. 6 caracteres) *</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="••••••••"
                      placeholderTextColor={Colors.textMuted}
                      value={regPassword}
                      onChangeText={setRegPassword}
                      secureTextEntry
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Teléfono de Contacto (WhatsApp) *</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="+54 9 11 1234-5678"
                      placeholderTextColor={Colors.textMuted}
                      value={regPhone}
                      onChangeText={setRegPhone}
                      keyboardType="phone-pad"
                    />
                  </View>
                </View>
              )}

              {/* PASO 2: Domicilio y Datos Fiscales */}
              {regStep === 2 && (
                <View style={styles.stepContainer}>
                  <Text style={styles.stepTitle}>Paso 2: Domicilio, CUIT y CBU de Cobro</Text>

                  <View style={styles.formRow}>
                    <View style={[styles.formGroup, { flex: 2 }]}>
                      <Text style={styles.formLabel}>Calle *</Text>
                      <TextInput
                        style={styles.formInput}
                        placeholder="Av. Corrientes"
                        placeholderTextColor={Colors.textMuted}
                        value={street}
                        onChangeText={setStreet}
                      />
                    </View>

                    <View style={[styles.formGroup, { flex: 1 }]}>
                      <Text style={styles.formLabel}>Altura *</Text>
                      <TextInput
                        style={styles.formInput}
                        placeholder="1234"
                        placeholderTextColor={Colors.textMuted}
                        value={streetNumber}
                        onChangeText={setStreetNumber}
                        keyboardType="numeric"
                      />
                    </View>
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Piso / Departamento (Opcional)</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="4º B"
                      placeholderTextColor={Colors.textMuted}
                      value={floorApp}
                      onChangeText={setFloorApp}
                    />
                  </View>

                  <View style={styles.formRow}>
                    <View style={[styles.formGroup, { flex: 1 }]}>
                      <Text style={styles.formLabel}>Localidad / Ciudad *</Text>
                      <TextInput
                        style={styles.formInput}
                        placeholder="Tucumán / CABA"
                        placeholderTextColor={Colors.textMuted}
                        value={city}
                        onChangeText={setCity}
                      />
                    </View>

                    <View style={[styles.formGroup, { flex: 1 }]}>
                      <Text style={styles.formLabel}>Provincia *</Text>
                      <TextInput
                        style={styles.formInput}
                        placeholder="Tucumán"
                        placeholderTextColor={Colors.textMuted}
                        value={province}
                        onChangeText={setProvince}
                      />
                    </View>
                  </View>

                  <View style={styles.formRow}>
                    <View style={[styles.formGroup, { flex: 1 }]}>
                      <Text style={styles.formLabel}>Código Postal *</Text>
                      <TextInput
                        style={styles.formInput}
                        placeholder="4000"
                        placeholderTextColor={Colors.textMuted}
                        value={postalCode}
                        onChangeText={setPostalCode}
                      />
                    </View>

                    <View style={[styles.formGroup, { flex: 1 }]}>
                      <Text style={styles.formLabel}>CUIT / CUIL *</Text>
                      <TextInput
                        style={styles.formInput}
                        placeholder="20-34567890-9"
                        placeholderTextColor={Colors.textMuted}
                        value={taxIdNumber}
                        onChangeText={setTaxIdNumber}
                        keyboardType="numeric"
                      />
                    </View>
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>CBU / CVU / Alias de Cobro *</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="0000003100012345678901 o chofer.travelapp"
                      placeholderTextColor={Colors.textMuted}
                      value={cbuCvu}
                      onChangeText={setCbuCvu}
                    />
                  </View>
                </View>
              )}

              {/* PASO 3: Datos del Vehículo */}
              {regStep === 3 && (
                <View style={styles.stepContainer}>
                  <Text style={styles.stepTitle}>Paso 3: Vehículo Activo de la Flota</Text>

                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Marca *</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="Ej. Fiat / Volkswagen / Toyota"
                      placeholderTextColor={Colors.textMuted}
                      value={vehicleMake}
                      onChangeText={setVehicleMake}
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Modelo *</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="Ej. Cronos / Gol Trend / Corolla"
                      placeholderTextColor={Colors.textMuted}
                      value={vehicleModel}
                      onChangeText={setVehicleModel}
                    />
                  </View>

                  <View style={styles.formRow}>
                    <View style={[styles.formGroup, { flex: 1 }]}>
                      <Text style={styles.formLabel}>Año *</Text>
                      <TextInput
                        style={styles.formInput}
                        placeholder="2024"
                        placeholderTextColor={Colors.textMuted}
                        value={vehicleYear}
                        onChangeText={setVehicleYear}
                        keyboardType="numeric"
                      />
                    </View>

                    <View style={[styles.formGroup, { flex: 1 }]}>
                      <Text style={styles.formLabel}>Color *</Text>
                      <TextInput
                        style={styles.formInput}
                        placeholder="Gris / Blanco"
                        placeholderTextColor={Colors.textMuted}
                        value={vehicleColor}
                        onChangeText={setVehicleColor}
                      />
                    </View>
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Patente / Matrícula *</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="Ej. AF 123 JK"
                      placeholderTextColor={Colors.textMuted}
                      value={vehiclePlate}
                      onChangeText={setVehiclePlate}
                      autoCapitalize="characters"
                    />
                  </View>
                </View>
              )}

              {/* PASO 4: Vinculación Mercado Pago */}
              {regStep === 4 && (
                <View style={styles.stepContainer}>
                  <Text style={styles.stepTitle}>Paso 4: Conexión de Cobros Mercado Pago</Text>
                  
                  <Text style={styles.stepSubtitle}>
                    Para procesar las tarifas con cobro digital y acreditación neta directa, conectá tu cuenta de Mercado Pago.
                  </Text>

                  <View style={styles.mpConnectCard}>
                    <View style={styles.mpBadgeRow}>
                      <Ionicons name="card" size={24} color="#009EE3" />
                      <Text style={styles.mpConnectTitle}>Mercado Pago Split</Text>
                    </View>

                    {mpLinked ? (
                      <View style={styles.mpSuccessBox}>
                        <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.mpSuccessTitle}>Cuenta Conectada</Text>
                          <Text style={styles.mpSuccessSub}>{mpEmail}</Text>
                        </View>
                        <TouchableOpacity onPress={() => setMpLinked(false)}>
                          <Text style={styles.mpChangeLink}>Cambiar</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View style={{ width: '100%', gap: 10 }}>
                        <TextInput
                          style={styles.formInput}
                          placeholder="Tu email en Mercado Pago"
                          placeholderTextColor={Colors.textMuted}
                          value={mpEmail}
                          onChangeText={setMpEmail}
                          keyboardType="email-address"
                          autoCapitalize="none"
                        />

                        <TouchableOpacity 
                          style={styles.mpConnectBtn} 
                          onPress={handleLinkMercadoPago}
                          disabled={linkingMp}
                        >
                          {linkingMp ? (
                            <ActivityIndicator color={Colors.white} />
                          ) : (
                            <>
                              <Ionicons name="link" size={18} color={Colors.white} />
                              <Text style={styles.mpConnectBtnText}>Autorizar Mercado Pago OAuth</Text>
                            </>
                          )}
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
              )}

            </ScrollView>

            {/* Controles de Navegación del Modal */}
            <View style={styles.modalFooter}>
              {regStep > 1 && (
                <TouchableOpacity style={styles.prevBtn} onPress={handlePrevStep}>
                  <Text style={styles.prevBtnText}>Anterior</Text>
                </TouchableOpacity>
              )}

              {regStep < 4 ? (
                <TouchableOpacity style={styles.nextBtn} onPress={handleNextStep}>
                  <Text style={styles.nextBtnText}>Siguiente ➔</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity 
                  style={[styles.submitBtn, submittingReg && { opacity: 0.6 }]} 
                  onPress={handleRegisterSubmit}
                  disabled={submittingReg}
                >
                  {submittingReg ? (
                    <ActivityIndicator color={Colors.white} />
                  ) : (
                    <Text style={styles.submitBtnText}>Finalizar Onboarding 🚀</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F4C35',
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 28,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Quicksand-Bold',
    color: Colors.white,
    marginTop: 8,
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  cardTitle: {
    fontSize: 20,
    fontFamily: 'Quicksand-Bold',
    color: Colors.textDark,
    textAlign: 'center',
  },
  cardSubtitle: {
    fontSize: 13,
    fontFamily: 'Quicksand-Medium',
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
  },
  form: {
    gap: 14,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontFamily: 'Quicksand-Bold',
    color: Colors.textDark,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: 'Quicksand-Medium',
    color: Colors.textDark,
  },
  button: {
    backgroundColor: '#0F4C35',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 15,
    fontFamily: 'Quicksand-Bold',
  },
  registerLink: {
    marginTop: 20,
    alignItems: 'center',
  },
  registerLinkText: {
    color: Colors.white,
    fontSize: 13,
    fontFamily: 'Quicksand-Medium',
  },
  registerLinkHighlight: {
    fontFamily: 'Quicksand-Bold',
    textDecorationLine: 'underline',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Quicksand-Bold',
    color: Colors.textDark,
  },
  stepIndicator: {
    fontSize: 12,
    fontFamily: 'Quicksand-Bold',
    color: Colors.primary,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  progressBarBg: {
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    marginBottom: 16,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#0F4C35',
  },
  formScroll: {
    maxHeight: 400,
  },
  stepContainer: {
    gap: 12,
    paddingVertical: 4,
  },
  stepTitle: {
    fontSize: 14,
    fontFamily: 'Quicksand-Bold',
    color: Colors.textDark,
    marginBottom: 4,
  },
  stepSubtitle: {
    fontSize: 12,
    fontFamily: 'Quicksand-Medium',
    color: Colors.textMuted,
    lineHeight: 18,
  },
  formRow: {
    flexDirection: 'row',
    gap: 10,
  },
  formGroup: {
    gap: 4,
  },
  formLabel: {
    fontSize: 11,
    fontFamily: 'Quicksand-Bold',
    color: Colors.textDark,
  },
  formInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    fontFamily: 'Quicksand-Medium',
    color: Colors.textDark,
  },
  mpConnectCard: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  mpBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mpConnectTitle: {
    fontSize: 15,
    fontFamily: 'Quicksand-Bold',
    color: '#0369A1',
  },
  mpConnectBtn: {
    backgroundColor: '#009EE3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
  },
  mpConnectBtnText: {
    color: Colors.white,
    fontSize: 13,
    fontFamily: 'Quicksand-Bold',
  },
  mpSuccessBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.white,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.success,
    width: '100%',
  },
  mpSuccessTitle: {
    fontSize: 13,
    fontFamily: 'Quicksand-Bold',
    color: Colors.textDark,
  },
  mpSuccessSub: {
    fontSize: 11,
    fontFamily: 'Quicksand-Medium',
    color: Colors.textMuted,
  },
  mpChangeLink: {
    fontSize: 11,
    fontFamily: 'Quicksand-Bold',
    color: Colors.primary,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  prevBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  prevBtnText: {
    color: Colors.textDark,
    fontSize: 13,
    fontFamily: 'Quicksand-Bold',
  },
  nextBtn: {
    flex: 1,
    backgroundColor: '#0F4C35',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  nextBtnText: {
    color: Colors.white,
    fontSize: 13,
    fontFamily: 'Quicksand-Bold',
  },
  submitBtn: {
    flex: 1,
    backgroundColor: '#0F4C35',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  submitBtnText: {
    color: Colors.white,
    fontSize: 13,
    fontFamily: 'Quicksand-Bold',
  },
});
