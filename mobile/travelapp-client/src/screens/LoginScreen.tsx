import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, Image, Alert,
} from 'react-native';
import { auth } from '../lib/firebase';
import { Colors } from '../lib/constants';

export default function LoginScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    if (!email || !password) return Alert.alert('Campos requeridos', 'Completá email y contraseña.');
    setLoading(true);
    try {
      if (isLogin) {
        await auth.signInWithEmailAndPassword(email, password);
      } else {
        if (!name) return Alert.alert('Nombre requerido', 'Ingresá tu nombre completo.');
        const cred = await auth.createUserWithEmailAndPassword(email, password);
        await cred.user?.updateProfile({ displayName: name });
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
      <View style={styles.inner}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>T</Text>
          </View>
          <Text style={styles.brand}>TravelApp</Text>
          <Text style={styles.tagline}>Tu ecosistema de viajes</Text>
        </View>

        {/* Toggle */}
        <View style={styles.toggle}>
          <TouchableOpacity
            style={[styles.toggleBtn, isLogin && styles.toggleActive]}
            onPress={() => setIsLogin(true)}>
            <Text style={[styles.toggleText, isLogin && styles.toggleTextActive]}>Ingresar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, !isLogin && styles.toggleActive]}
            onPress={() => setIsLogin(false)}>
            <Text style={[styles.toggleText, !isLogin && styles.toggleTextActive]}>Registrarse</Text>
          </TouchableOpacity>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {!isLogin && (
            <TextInput
              style={styles.input}
              placeholder="Nombre completo"
              placeholderTextColor={Colors.textMuted}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          )}
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={Colors.textMuted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Contraseña"
            placeholderTextColor={Colors.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <TouchableOpacity style={styles.button} onPress={handleAuth} disabled={loading}>
            {loading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.buttonText}>{isLogin ? 'Ingresar' : 'Crear cuenta'}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },
  inner: { flex: 1, justifyContent: 'center', padding: 28 },
  logoContainer: { alignItems: 'center', marginBottom: 40 },
  logoCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  logoText: { fontSize: 36, fontWeight: '900', color: Colors.white },
  brand: { fontSize: 28, fontWeight: '800', color: Colors.white },
  tagline: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  toggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12, padding: 4, marginBottom: 24,
  },
  toggleBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  toggleActive: { backgroundColor: Colors.white },
  toggleText: { color: 'rgba(255,255,255,0.8)', fontWeight: '600' },
  toggleTextActive: { color: Colors.primary },
  form: { gap: 12 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    color: Colors.white, fontSize: 15, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  button: {
    backgroundColor: Colors.accent,
    borderRadius: 12, paddingVertical: 16,
    alignItems: 'center', marginTop: 8,
  },
  buttonText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
});
