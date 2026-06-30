import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, Alert, ScrollView, Image,
} from 'react-native';
import { auth, db } from '../lib/firebase';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { Colors } from '../lib/constants';
import { TravelCabLogo } from '../components/BrandLogos';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgot, setIsForgot] = useState(false);

  // Campos de inicio de sesión / registro
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    if (isForgot) {
      if (!email) return Alert.alert('Campo requerido', 'Ingresá tu email para restablecer la contraseña.');
      setLoading(true);
      try {
        await auth.sendPasswordResetEmail(email);
        Alert.alert('Correo enviado', 'Te enviamos las instrucciones para restablecer tu contraseña.');
        setIsForgot(false);
        setIsLogin(true);
      } catch (err: any) {
        Alert.alert('Error', 'No se pudo enviar el correo de recuperación. Verificá los datos.');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!email || !password) {
      return Alert.alert('Campos requeridos', 'Ingresá tus credenciales.');
    }

    setLoading(true);
    try {
      if (isLogin) {
        await auth.signInWithEmailAndPassword(email, password);
      } else {
        if (!name || !phone) {
          return Alert.alert('Campos requeridos', 'Completá tu nombre y teléfono.');
        }
        const cred = await auth.createUserWithEmailAndPassword(email, password);
        if (cred.user) {
          await cred.user.updateProfile({
            displayName: name,
          });
          // Guardamos el documento del usuario en Firestore para sincronización con el Dashboard
          await setDoc(doc(db, 'users', cred.user.uid), {
            customerName: name,
            email: email,
            phone: phone,
            customerLevel: 1,
            customerStatus: 'Cliente',
            rewardsPoints: 0,
            walletBalance: 0,
            hasPurchasedOrganizedTrip: false,
            createdAt: Timestamp.now()
          });
        }
      }
    } catch (err: any) {
      const msg = err.code === 'auth/invalid-credential' ? 'Email o contraseña incorrectos.'
        : err.code === 'auth/email-already-in-use' ? 'Este email ya está registrado.'
        : err.code === 'auth/weak-password' ? 'La contraseña debe tener al menos 6 caracteres.'
        : 'Ocurrió un error. Intentá nuevamente.';
      Alert.alert('Error', msg);
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
            <TravelCabLogo size={65} textColor={Colors.white} isAccentColor={false} />
            <Text style={styles.subtitle}>Tu portal de traslados urbanos</Text>
          </View>

          {/* Tarjeta de Travis AI */}
          <View style={styles.travisCard}>
            <View style={styles.travisAvatar}>
              <Image source={require('../../assets/travis_casual.png')} style={styles.travisAvatarImg} />
            </View>
            <View style={styles.travisBubble}>
              <Text style={styles.travisText}>
                {isForgot 
                  ? '¡No te preocupes! Ingresá tu correo para recuperar el acceso a tu cuenta.'
                  : isLogin 
                    ? '¡Hola! Soy Travis 🤖 Bienvenido a TravelCab. Ingresá tus credenciales para continuar:'
                    : '¡Qué bueno tenerte de socio pasajero! Completá tus datos para registrarte:'}
              </Text>
            </View>
          </View>

          {/* Card del Formulario */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {isForgot ? 'Recuperar Cuenta' : isLogin ? 'Ingresar' : 'Registrarse'}
            </Text>

            <View style={styles.form}>
              {!isLogin && !isForgot && (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Nombre completo</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Juan Pérez"
                      placeholderTextColor={Colors.textMuted}
                      value={name}
                      onChangeText={setName}
                      autoCapitalize="words"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Teléfono celular</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="+5491100000000"
                      placeholderTextColor={Colors.textMuted}
                      value={phone}
                      onChangeText={setPhone}
                      keyboardType="phone-pad"
                    />
                  </View>
                </>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email / Correo electrónico</Text>
                <TextInput
                  style={styles.input}
                  placeholder="ejemplo@email.com"
                  placeholderTextColor={Colors.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {!isForgot && (
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
                    {isForgot ? 'Enviar Correo' : isLogin ? 'Ingresar' : 'Crear Cuenta'}
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
                  ¿No tenés cuenta? <Text style={styles.footerLinkBold}>Registrate acá</Text>
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={() => setIsLogin(true)}>
                <Text style={styles.footerLinkText}>
                  ¿Ya tenés cuenta? <Text style={styles.footerLinkBold}>Iniciá sesión</Text>
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
  container: { flex: 1, backgroundColor: Colors.primary },
  scrollContent: { flexGrow: 1, justifyContent: 'center' },
  inner: { padding: 24, gap: 16 },
  logoContainer: { alignItems: 'center', marginBottom: 8 },
  subtitle: { fontSize: 13, fontFamily: 'Quicksand-Medium', color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  
  // Travis AI bubble
  travisCard: { flexDirection: 'row', gap: 12, alignItems: 'center', marginVertical: 8 },
  travisAvatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, elevation: 3,
  },
  travisAvatarImg: {
    width: 44, height: 44, borderRadius: 22,
  },
  travisBubble: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 16,
    padding: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  travisText: { color: Colors.white, fontSize: 13, fontFamily: 'Quicksand-Medium', lineHeight: 18 },

  // Card Form
  card: {
    backgroundColor: Colors.white, borderRadius: 24, padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, elevation: 8,
  },
  cardTitle: { fontSize: 20, fontFamily: 'Quicksand-Bold', color: Colors.textPrimary, marginBottom: 16 },
  form: { gap: 14 },
  inputGroup: { gap: 6 },
  label: { fontSize: 12, fontFamily: 'Quicksand-Bold', color: Colors.textSecondary },
  input: {
    backgroundColor: Colors.background, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 12,
    fontSize: 14, fontFamily: 'Quicksand-Regular', color: Colors.textPrimary,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  forgotBtn: { alignSelf: 'flex-end', paddingVertical: 4 },
  forgotText: { fontSize: 12, fontFamily: 'Quicksand-Bold', color: Colors.accent },
  button: {
    backgroundColor: Colors.accent, borderRadius: 14,
    paddingVertical: 15, alignItems: 'center', marginTop: 6,
  },
  buttonText: { color: Colors.white, fontSize: 15, fontFamily: 'Quicksand-Bold' },
  footerLinks: { alignItems: 'center', marginTop: 16 },
  footerLinkText: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontFamily: 'Quicksand-Medium' },
  footerLinkBold: { color: Colors.accent, fontFamily: 'Quicksand-Bold', textDecorationLine: 'underline' },
});
