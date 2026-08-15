import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, Alert, ScrollView,
} from 'react-native';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, updateProfile } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { Colors } from '../lib/constants';
import { TravelExperienceLogo } from '../components/BrandLogos';
import { Ionicons } from '@expo/vector-icons';

const MASTER_ADMIN_EMAILS = [
  'fernando@travelapp.ar',
  'ferincola@gmail.com',
  'edgar@travelapp.ar',
  'carlos@travelapp.ar',
];

export default function LoginScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgot, setIsForgot] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Campos de autenticación
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    const trimmedEmail = email.trim().toLowerCase();

    if (isForgot) {
      if (!trimmedEmail || !trimmedEmail.includes('@')) {
        return Alert.alert('Campo requerido', 'Ingresá tu email para restablecer la contraseña.');
      }
      setLoading(true);
      try {
        await sendPasswordResetEmail(auth, trimmedEmail);
        Alert.alert('Correo enviado', 'Te enviamos las instrucciones para restablecer tu contraseña de Partner.');
        setIsForgot(false);
        setIsLogin(true);
      } catch (err: any) {
        Alert.alert('Error', 'No se pudo enviar el correo de recuperación. Verificá los datos.');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!trimmedEmail || !password) {
      return Alert.alert('Campos requeridos', 'Ingresá tus credenciales de socio comercial.');
    }

    setLoading(true);
    try {
      const isMasterAdmin = MASTER_ADMIN_EMAILS.includes(trimmedEmail);

      if (isLogin) {
        try {
          await signInWithEmailAndPassword(auth, trimmedEmail, password);
        } catch (err: any) {
          if (isMasterAdmin && (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential')) {
            await createUserWithEmailAndPassword(auth, trimmedEmail, password);
          } else {
            throw err;
          }
        }
      } else {
        if (!name || !phone) {
          setLoading(false);
          return Alert.alert('Campos requeridos', 'Completá el nombre de tu agencia/nombre y teléfono.');
        }
        const cred = await createUserWithEmailAndPassword(auth, trimmedEmail, password);
        if (cred.user) {
          await updateProfile(cred.user, { displayName: name });
        }
      }
    } catch (err: any) {
      console.warn('Affiliate Login error:', err);
      let msg = 'Email o contraseña incorrectos.';
      if (err.code === 'auth/user-not-found') {
        msg = 'El usuario partner no está registrado.';
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        msg = 'Contraseña incorrecta. Verificá tu clave o presioná "¿Olvidaste tu contraseña?".';
      } else if (err.code === 'auth/email-already-in-use') {
        msg = 'Este email ya está registrado en el programa de afiliados.';
      } else if (err.message) {
        msg = err.message;
      }
      Alert.alert('Error de Autenticación', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.inner}>
          
          {/* Logo Central */}
          <View style={styles.logoContainer}>
            <TravelExperienceLogo size={200} />
            <Text style={styles.subtitle}>Portal de Afiliados & Embajadores</Text>
          </View>

          {/* Tarjeta Informativa Travis AI */}
          <View style={styles.travisCard}>
            <View style={styles.travisAvatar}>
              <Ionicons name="ribbon" size={24} color={Colors.white} />
            </View>
            <View style={styles.travisBubble}>
              <Text style={styles.travisText}>
                {isForgot 
                  ? 'Ingresá tu correo corporativo para recuperar el acceso a tu cuenta de Afiliado.'
                  : isLogin 
                    ? '¡Bienvenido Socio! Accedé a tu panel de comisiones y herramientas de venta:'
                    : '¡Sumate como Embajador o Agencia! Completá tus datos para activar tu código de comisión:'}
              </Text>
            </View>
          </View>

          {/* Formulario de Login / Registro */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {isForgot ? 'Recuperar Acceso' : isLogin ? 'Ingresar como Partner' : 'Registrar Agencia / Embajador'}
            </Text>

            <View style={styles.form}>
              {!isLogin && !isForgot && (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Nombre de Agencia o Nombre Completo</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Agencia de Viajes / Juan Pérez"
                      placeholderTextColor="#94A3B8"
                      value={name}
                      onChangeText={setName}
                      autoCapitalize="words"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Teléfono WhatsApp de contacto</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="+5491100000000"
                      placeholderTextColor="#94A3B8"
                      value={phone}
                      onChangeText={setPhone}
                      keyboardType="phone-pad"
                    />
                  </View>
                </>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Correo electrónico corporativo</Text>
                <TextInput
                  style={styles.input}
                  placeholder="afiliado@agencia.com"
                  placeholderTextColor="#94A3B8"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {!isForgot && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Contraseña</Text>
                  <View style={styles.passwordWrapper}>
                    <TextInput
                      style={styles.passwordInput}
                      placeholder="••••••••"
                      placeholderTextColor="#94A3B8"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.eyeBtn}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={20}
                        color="#64748B"
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {isLogin && !isForgot && (
                <TouchableOpacity onPress={() => { setIsForgot(true); setIsLogin(false); }} style={styles.forgotBtn}>
                  <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity style={styles.button} onPress={handleAuth} disabled={loading}>
                {loading ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <Text style={styles.buttonText}>
                    {isForgot ? 'Enviar Instrucciones' : isLogin ? 'Iniciar Sesión' : 'Activar Cuenta de Afiliado'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Switchers en Footer */}
          <View style={styles.footerLinks}>
            {isForgot ? (
              <TouchableOpacity onPress={() => { setIsForgot(false); setIsLogin(true); }}>
                <Text style={styles.footerLinkText}>Volver al Login</Text>
              </TouchableOpacity>
            ) : isLogin ? (
              <TouchableOpacity onPress={() => setIsLogin(false)}>
                <Text style={styles.footerLinkText}>
                  ¿Querés ser Afiliado? <Text style={styles.footerLinkBold}>Registrate acá</Text>
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={() => setIsLogin(true)}>
                <Text style={styles.footerLinkText}>
                  ¿Ya tenés cuenta de Partner? <Text style={styles.footerLinkBold}>Iniciá sesión</Text>
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1E1B4B' },
  scrollContent: { flexGrow: 1, justifyContent: 'center' },
  inner: { padding: 24, gap: 16 },
  logoContainer: { alignItems: 'center', marginBottom: 4 },
  subtitle: { fontSize: 13, fontFamily: 'Quicksand-Medium', color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  
  travisCard: { flexDirection: 'row', gap: 12, alignItems: 'center', marginVertical: 4 },
  travisAvatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#6366F1',
    alignItems: 'center', justifyContent: 'center',
  },
  travisBubble: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 16,
    padding: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  travisText: { color: Colors.white, fontSize: 12, fontFamily: 'Quicksand-Medium', lineHeight: 17 },

  card: {
    backgroundColor: Colors.white, borderRadius: 24, padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, elevation: 8,
  },
  cardTitle: { fontSize: 18, fontFamily: 'Quicksand-Bold', color: '#0F172A', marginBottom: 14 },
  form: { gap: 12 },
  inputGroup: { gap: 4 },
  label: { fontSize: 12, fontFamily: 'Quicksand-Bold', color: '#475569' },
  input: {
    backgroundColor: '#F8FAFC', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 12,
    fontSize: 14, fontFamily: 'Quicksand-Regular', color: '#0F172A',
    borderWidth: 1.5, borderColor: '#E2E8F0',
  },
  passwordWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F8FAFC', borderRadius: 12,
    borderWidth: 1.5, borderColor: '#E2E8F0',
  },
  passwordInput: {
    flex: 1, paddingHorizontal: 16, paddingVertical: 12,
    fontSize: 14, fontFamily: 'sans-serif', color: '#0F172A',
  },
  eyeBtn: { paddingHorizontal: 14, paddingVertical: 12 },
  forgotBtn: { alignSelf: 'flex-end', paddingVertical: 4 },
  forgotText: { fontSize: 12, fontFamily: 'Quicksand-Bold', color: '#6366F1' },
  button: {
    backgroundColor: '#6366F1', borderRadius: 14,
    paddingVertical: 14, alignItems: 'center', marginTop: 6,
  },
  buttonText: { color: Colors.white, fontSize: 15, fontFamily: 'Quicksand-Bold' },
  footerLinks: { alignItems: 'center', marginTop: 12 },
  footerLinkText: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontFamily: 'Quicksand-Medium' },
  footerLinkBold: { color: '#818CF8', fontFamily: 'Quicksand-Bold', textDecorationLine: 'underline' },
});
