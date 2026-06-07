import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { auth } from '../lib/firebase';
import { Colors } from '../lib/constants';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

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

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.inner}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoIcon}>🚗</Text>
          </View>
          <Text style={styles.brand}>TravelCab</Text>
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

        <Text style={styles.footer}>
          ¿No tenés cuenta de socio? Contactá a{'\n'}socios@travelapp.ar
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },
  inner: { flex: 1, justifyContent: 'center', padding: 24 },
  logoContainer: { alignItems: 'center', marginBottom: 32 },
  logoCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  logoIcon: { fontSize: 38 },
  brand: { fontSize: 28, fontWeight: '900', color: Colors.white },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  card: {
    backgroundColor: Colors.white, borderRadius: 24, padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, elevation: 10,
  },
  cardTitle: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary, marginBottom: 4 },
  cardSubtitle: { fontSize: 13, color: Colors.textSecondary, marginBottom: 24 },
  form: { gap: 16 },
  inputGroup: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  input: {
    backgroundColor: Colors.background, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 13,
    fontSize: 15, color: Colors.textPrimary,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  button: {
    backgroundColor: Colors.primary, borderRadius: 14,
    paddingVertical: 16, alignItems: 'center', marginTop: 4,
  },
  buttonText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  footer: { textAlign: 'center', color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 24, lineHeight: 18 },
});
