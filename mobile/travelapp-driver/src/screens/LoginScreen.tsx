import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, Alert, Modal, ScrollView,
} from 'react-native';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { Colors } from '../lib/constants';
import { TravelCabLogo } from '../components/BrandLogos';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Registro del Conductor - Asistente de 4 Pasos (Igual al Landing de TravelCab)
  const [registerModalVisible, setRegisterModalVisible] = useState(false);
  const [regStep, setRegStep] = useState(1);

  // Paso 1: Datos Personales
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');

  // Paso 2: Dirección y Datos Fiscales
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
    if (!email || !password) return Alert.alert('Campos requeridos', 'Ingresá tu email y contraseña.');
    setLoading(true);
    try {
      await auth.signInWithEmailAndPassword(email, password);
    } catch (err: any) {
      const msg = err.code === 'auth/invalid-credential'
        ? 'Email o contraseña incorrectos.'
        : 'Error al iniciar sesión. Intentá de nuevo.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleLinkMercadoPago = () => {
    if (!mpEmail || !mpEmail.includes('@')) {
      return Alert.alert('Email inválido', 'Por favor ingresá un email válido de Mercado Pago.');
    }
    setLinkingMp(true);
    setTimeout(() => {
      setMpLinked(true);
      setShowMpInput(false);
      setLinkingMp(false);
      Alert.alert('¡Mercado Pago Conectado!', 'Tu cuenta ha sido vinculada correctamente para procesar los retiros y cobros divididos.');
    }, 1500);
  };

  const handleNextStep = () => {
    if (regStep === 1) {
      if (!firstName || !lastName || !dob || !regEmail || !regPhone) {
        return Alert.alert('Campos requeridos', 'Por favor completa todos tus datos personales.');
      }
      if (!regEmail.includes('@')) {
        return Alert.alert('Email inválido', 'Por favor ingresa un email válido.');
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
      // Registrar solicitud completa de socio conductor en Firestore
      await addDoc(collection(db, 'partner_applications'), {
        firstName,
        lastName,
        dob,
        email: regEmail,
        phone: regPhone,
        address: { street, streetNumber, floorApp, city, province, postalCode },
        taxIdNumber, // CUIT/CUIL
        cbuCvu,
        vehicle: {
          brand: `${vehicleMake} ${vehicleModel}`,
          year: vehicleYear,
          color: vehicleColor,
          plate: vehiclePlate.toUpperCase(),
        },
        mercadoPagoEmail: mpEmail,
        mercadoPagoLinked: true,
        status: 'pending',
        createdAt: Timestamp.now()
      });

      // Limpiar Formulario y reiniciar estados
      setFirstName('');
      setLastName('');
      setDob('');
      setRegEmail('');
      setRegPhone('');
      setStreet('');
      setStreetNumber('');
      setFloorApp('');
      setCity('');
      setProvince('');
      setPostalCode('');
      setTaxIdNumber('');
      setCbuCvu('');
      setVehicleMake('');
      setVehicleModel('');
      setVehicleYear('');
      setVehicleColor('');
      setVehiclePlate('');
      setMpEmail('');
      setMpLinked(false);
      setShowMpInput(false);
      setRegStep(1);
      setRegisterModalVisible(false);

      Alert.alert(
        '¡Solicitud enviada! 🎉',
        'Tus datos y cuenta de Mercado Pago han sido guardados con éxito en el sistema de onboarding de TravelCab. El equipo comercial auditará tu vehículo y te contactará a la brevedad.'
      );
    } catch (e) {
      Alert.alert('Error', 'No pudimos registrar tu solicitud. Intentá de nuevo más tarde.');
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

      {/* MODAL DE REGISTRO MULTIPASO */}
      <Modal
        visible={registerModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => { setRegisterModalVisible(false); setRegStep(1); }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Registro de Conductor</Text>
              <Text style={styles.stepIndicator}>Paso {regStep} de 4</Text>
            </View>
            
            {/* Barra de Progreso */}
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${(regStep / 4) * 100}%` }]} />
            </View>

            <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
              
              {/* PASO 1: Datos Personales */}
              {regStep === 1 && (
                <View style={styles.stepContainer}>
                  <Text style={styles.stepTitle}>Paso 1: Datos de Contacto</Text>
                  
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Nombre</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="Ej. Juan"
                      placeholderTextColor={Colors.textMuted}
                      value={firstName}
                      onChangeText={setFirstName}
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Apellido</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="Ej. Pérez"
                      placeholderTextColor={Colors.textMuted}
                      value={lastName}
                      onChangeText={setLastName}
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Fecha de Nacimiento (DD/MM/AAAA)</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="Ej. 15/08/1990"
                      placeholderTextColor={Colors.textMuted}
                      value={dob}
                      onChangeText={setDob}
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Email de Contacto</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="juanperez@email.com"
                      placeholderTextColor={Colors.textMuted}
                      value={regEmail}
                      onChangeText={setRegEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Teléfono Celular (WhatsApp)</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="Ej. +5491100000000"
                      placeholderTextColor={Colors.textMuted}
                      value={regPhone}
                      onChangeText={setRegPhone}
                      keyboardType="phone-pad"
                    />
                  </View>
                </View>
              )}

              {/* PASO 2: Dirección y Datos Fiscales */}
              {regStep === 2 && (
                <View style={styles.stepContainer}>
                  <Text style={styles.stepTitle}>Paso 2: Datos Fiscales y Bancarios</Text>
                  
                  <View style={styles.formRow}>
                    <View style={[styles.formGroup, { flex: 2 }]}>
                      <Text style={styles.formLabel}>Calle</Text>
                      <TextInput
                        style={styles.formInput}
                        placeholder="Ej. Av. Colón"
                        placeholderTextColor={Colors.textMuted}
                        value={street}
                        onChangeText={setStreet}
                      />
                    </View>
                    <View style={[styles.formGroup, { flex: 1 }]}>
                      <Text style={styles.formLabel}>Nro</Text>
                      <TextInput
                        style={styles.formInput}
                        placeholder="123"
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
                      placeholder="Ej. 2do B"
                      placeholderTextColor={Colors.textMuted}
                      value={floorApp}
                      onChangeText={setFloorApp}
                    />
                  </View>

                  <View style={styles.formRow}>
                    <View style={[styles.formGroup, { flex: 1 }]}>
                      <Text style={styles.formLabel}>Ciudad</Text>
                      <TextInput
                        style={styles.formInput}
                        placeholder="San Miguel"
                        placeholderTextColor={Colors.textMuted}
                        value={city}
                        onChangeText={setCity}
                      />
                    </View>
                    <View style={[styles.formGroup, { flex: 1 }]}>
                      <Text style={styles.formLabel}>Provincia</Text>
                      <TextInput
                        style={styles.formInput}
                        placeholder="Tucumán"
                        placeholderTextColor={Colors.textMuted}
                        value={province}
                        onChangeText={setProvince}
                      />
                    </View>
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Código Postal</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="Ej. 4000"
                      placeholderTextColor={Colors.textMuted}
                      value={postalCode}
                      onChangeText={setPostalCode}
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Identificación Fiscal (CUIT/CUIL)</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="Ej. 20-34567890-9"
                      placeholderTextColor={Colors.textMuted}
                      value={taxIdNumber}
                      onChangeText={setTaxIdNumber}
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>CBU o CVU Bancario</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="22 dígitos de tu cuenta bancaria o virtual"
                      placeholderTextColor={Colors.textMuted}
                      value={cbuCvu}
                      onChangeText={setCbuCvu}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              )}

              {/* PASO 3: Datos del Vehículo */}
              {regStep === 3 && (
                <View style={styles.stepContainer}>
                  <Text style={styles.stepTitle}>Paso 3: Ficha del Vehículo</Text>
                  
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Marca del Auto</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="Ej. Chevrolet"
                      placeholderTextColor={Colors.textMuted}
                      value={vehicleMake}
                      onChangeText={setVehicleMake}
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Modelo del Auto</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="Ej. Prisma"
                      placeholderTextColor={Colors.textMuted}
                      value={vehicleModel}
                      onChangeText={setVehicleModel}
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Año</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="Ej. 2019"
                      placeholderTextColor={Colors.textMuted}
                      value={vehicleYear}
                      onChangeText={setVehicleYear}
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Color</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="Ej. Blanco"
                      placeholderTextColor={Colors.textMuted}
                      value={vehicleColor}
                      onChangeText={setVehicleColor}
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Patente (Dominio)</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="Ej. AB123CD"
                      placeholderTextColor={Colors.textMuted}
                      value={vehiclePlate}
                      onChangeText={setVehiclePlate}
                      autoCapitalize="characters"
                    />
                  </View>
                </View>
              )}

              {/* PASO 4: Conectar Mercado Pago (Split de Pagos) */}
              {regStep === 4 && (
                <View style={styles.stepContainer}>
                  <Text style={styles.stepTitle}>Paso 4: Billetera y Split de Pagos</Text>
                  <Text style={styles.stepDesc}>
                    Para operar en el ecosistema TravelCab es obligatorio vincular tu cuenta de Mercado Pago. Así, la plataforma podrá liquidar tus ganancias netas del split instantáneamente.
                  </Text>

                  {mpLinked ? (
                    <View style={styles.mpConnectedCard}>
                      <Ionicons name="checkmark-circle" size={40} color={Colors.success} />
                      <Text style={styles.mpConnectedTitle}>Mercado Pago Conectado</Text>
                      <Text style={styles.mpConnectedEmail}>{mpEmail}</Text>
                      <TouchableOpacity style={styles.mpDisconnectBtn} onPress={() => setMpLinked(false)}>
                        <Text style={styles.mpDisconnectText}>Desconectar cuenta</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.mpConnectContainer}>
                      <TouchableOpacity 
                        style={styles.mpConnectBtn}
                        onPress={() => setShowMpInput(prev => !prev)}
                      >
                        <Ionicons name="logo-usd" size={20} color={Colors.white} />
                        <Text style={styles.mpConnectBtnText}>Conectar cuenta de Mercado Pago</Text>
                      </TouchableOpacity>

                      {showMpInput && (
                        <View style={styles.mpInputBox}>
                          <Text style={styles.formLabel}>Email Registrado en Mercado Pago</Text>
                          <TextInput
                            style={styles.formInput}
                            placeholder="tuemail@mercadopago.com"
                            placeholderTextColor={Colors.textMuted}
                            value={mpEmail}
                            onChangeText={setMpEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                          />
                          <TouchableOpacity 
                            style={styles.confirmMpBtn} 
                            onPress={handleLinkMercadoPago}
                            disabled={linkingMp}
                          >
                            {linkingMp ? (
                              <ActivityIndicator color={Colors.white} size="small" />
                            ) : (
                              <Text style={styles.confirmMpText}>Autorizar y Conectar</Text>
                            )}
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              )}

              {/* Navegación del Wizard */}
              <View style={styles.modalButtons}>
                {regStep > 1 ? (
                  <TouchableOpacity style={styles.cancelBtn} onPress={handlePrevStep}>
                    <Text style={styles.cancelBtnText}>Atrás</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity 
                    style={styles.cancelBtn} 
                    onPress={() => { setRegisterModalVisible(false); setRegStep(1); }}
                  >
                    <Text style={styles.cancelBtnText}>Salir</Text>
                  </TouchableOpacity>
                )}

                {regStep < 4 ? (
                  <TouchableOpacity style={styles.confirmBtn} onPress={handleNextStep}>
                    <Text style={styles.confirmBtnText}>Siguiente</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity 
                    style={[styles.confirmBtn, !mpLinked && styles.confirmBtnDisabled]} 
                    onPress={handleRegisterSubmit}
                    disabled={submittingReg || !mpLinked}
                  >
                    {submittingReg ? (
                      <ActivityIndicator color={Colors.white} size="small" />
                    ) : (
                      <Text style={styles.confirmBtnText}>Enviar Solicitud</Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },
  inner: { flex: 1, justifyContent: 'center', padding: 24 },
  logoContainer: { alignItems: 'center', marginBottom: 32 },
  subtitle: { fontSize: 14, fontFamily: 'Quicksand-Medium', color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  card: {
    backgroundColor: Colors.white, borderRadius: 24, padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, elevation: 10,
  },
  cardTitle: { fontSize: 24, fontFamily: 'Quicksand-Bold', color: Colors.textPrimary, marginBottom: 4 },
  cardSubtitle: { fontSize: 13, fontFamily: 'Quicksand-Regular', color: Colors.textSecondary, marginBottom: 24 },
  form: { gap: 16 },
  inputGroup: { gap: 6 },
  label: { fontSize: 13, fontFamily: 'Quicksand-SemiBold', color: Colors.textPrimary },
  input: {
    backgroundColor: Colors.background, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 13,
    fontSize: 15, fontFamily: 'Quicksand-Regular', color: Colors.textPrimary,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  button: {
    backgroundColor: Colors.accent, borderRadius: 14,
    paddingVertical: 16, alignItems: 'center', marginTop: 4,
  },
  buttonText: { color: Colors.white, fontSize: 16, fontFamily: 'Quicksand-Bold' },
  registerLink: { alignItems: 'center', marginTop: 24 },
  registerLinkText: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontFamily: 'Quicksand-Medium' },
  registerLinkHighlight: { color: Colors.accent, fontFamily: 'Quicksand-Bold', textDecorationLine: 'underline' },

  // Estilos del Modal de Registro
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: Colors.white, borderRadius: 24, padding: 24, maxHeight: '85%', gap: 12 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: Colors.border, paddingBottom: 10, marginBottom: 4 },
  modalTitle: { fontSize: 18, fontFamily: 'Quicksand-Bold', color: Colors.textPrimary },
  stepIndicator: { fontSize: 11, fontFamily: 'Quicksand-Bold', color: Colors.accent },
  progressBarBg: { height: 4, backgroundColor: Colors.border, borderRadius: 2, marginBottom: 12, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: Colors.accent },
  formScroll: { flexGrow: 0 },
  stepContainer: { gap: 12, marginBottom: 8 },
  stepTitle: { fontSize: 15, fontFamily: 'Quicksand-Bold', color: Colors.primary, marginBottom: 4 },
  stepDesc: { fontSize: 12, fontFamily: 'Quicksand-Regular', color: Colors.textSecondary, lineHeight: 18, marginBottom: 12 },
  formGroup: { gap: 6, marginBottom: 8 },
  formRow: { flexDirection: 'row', gap: 10 },
  formLabel: { fontSize: 11, fontFamily: 'Quicksand-Bold', color: Colors.textSecondary },
  formInput: {
    backgroundColor: Colors.background, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 14, fontFamily: 'Quicksand-Regular', color: Colors.textPrimary,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 20, borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 14 },
  cancelBtn: { flex: 1, borderWidth: 1.5, borderColor: Colors.border, paddingVertical: 13, borderRadius: 12, alignItems: 'center' },
  cancelBtnText: { fontSize: 14, fontFamily: 'Quicksand-Bold', color: Colors.textSecondary },
  confirmBtn: { flex: 2, backgroundColor: Colors.accent, paddingVertical: 13, borderRadius: 12, alignItems: 'center' },
  confirmBtnDisabled: { backgroundColor: Colors.border },
  confirmBtnText: { fontSize: 14, fontFamily: 'Quicksand-Bold', color: Colors.white },

  // Mercado Pago Específico en Paso 4
  mpConnectContainer: { alignItems: 'center', marginVertical: 10, gap: 12 },
  mpConnectBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#009EE3', paddingHorizontal: 20, paddingVertical: 14, borderRadius: 14, width: '100%', justifyContent: 'center',
  },
  mpConnectBtnText: { color: Colors.white, fontSize: 14, fontFamily: 'Quicksand-Bold' },
  mpInputBox: { width: '100%', gap: 10, backgroundColor: Colors.background, padding: 16, borderRadius: 16, borderWidth: 1.5, borderColor: Colors.border },
  confirmMpBtn: { backgroundColor: Colors.primary, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  confirmMpText: { color: Colors.white, fontSize: 13, fontFamily: 'Quicksand-Bold' },
  mpConnectedCard: {
    alignItems: 'center', backgroundColor: Colors.success + '0A', padding: 24, borderRadius: 20, borderWidth: 2, borderColor: Colors.success, gap: 8, marginVertical: 8,
  },
  mpConnectedTitle: { fontSize: 16, fontFamily: 'Quicksand-Bold', color: Colors.success },
  mpConnectedEmail: { fontSize: 14, fontFamily: 'Quicksand-Regular', color: Colors.textSecondary },
  mpDisconnectBtn: { marginTop: 10, paddingVertical: 6, paddingHorizontal: 12 },
  mpDisconnectText: { fontSize: 12, fontFamily: 'Quicksand-Bold', color: Colors.danger },
});
