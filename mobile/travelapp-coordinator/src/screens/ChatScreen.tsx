import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  FlatList, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { auth } from '../lib/firebase';
import { Colors, TRAVIS_WEBHOOK_URL } from '../lib/constants';

interface Message {
  id: string;
  role: 'user' | 'travis';
  text: string;
  time: string;
}

export default function ChatScreen() {
  const navigation = useNavigation<any>();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0', role: 'travis',
      text: '¡Hola! Soy Travis, tu asistente de TravelApp 🚀 ¿En qué te puedo ayudar hoy?',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const listRef = useRef<FlatList>(null);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const user = auth.currentUser;
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text, time: now };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(TRAVIS_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriber_id: user?.uid || 'app_user',
          message: text,
          first_name: user?.displayName?.split(' ')[0] || 'Usuario',
          channel: 'app_client',
        }),
      });
      const data = await res.json();
      const reply = data.messages?.[0]?.text || data.reply || 'En este momento no puedo responder. Intentá en unos minutos.';
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'travis', text: reply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'travis',
        text: 'Hubo un problema de conexión. Revisá tu internet e intentá de nuevo.',
        time: now,
      }]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages]);

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.travisInfo}>
          <View style={styles.travisAvatar}>
            <Text style={styles.travisAvatarText}>T</Text>
          </View>
          <View>
            <Text style={styles.travisName}>Travis</Text>
            <Text style={styles.travisStatus}>● En línea</Text>
          </View>
        </View>
      </View>

      {/* Mensajes */}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.messageList}
        renderItem={({ item }) => (
          <View style={[styles.bubble, item.role === 'user' ? styles.bubbleUser : styles.bubbleTravis]}>
            <Text style={[styles.bubbleText, item.role === 'user' && styles.bubbleTextUser]}>
              {item.text}
            </Text>
            <Text style={[styles.bubbleTime, item.role === 'user' && styles.bubbleTimeUser]}>
              {item.time}
            </Text>
          </View>
        )}
      />

      {loading && (
        <View style={styles.typingIndicator}>
          <Text style={styles.typingText}>Travis está escribiendo...</Text>
          <ActivityIndicator size="small" color={Colors.primary} />
        </View>
      )}

      {/* Input */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder="Escribile a Travis..."
          placeholderTextColor={Colors.textMuted}
          value={input}
          onChangeText={setInput}
          multiline
          maxLength={500}
          onSubmitEditing={sendMessage}
        />
        <TouchableOpacity style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]} onPress={sendMessage}>
          <Ionicons name="send" size={20} color={Colors.white} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4FF' },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingTop: 56, paddingHorizontal: 16, paddingBottom: 16,
    backgroundColor: Colors.white,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, elevation: 3,
  },
  backBtn: { width: 36 },
  travisInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  travisAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  travisAvatarText: { color: Colors.white, fontSize: 18, fontWeight: '800' },
  travisName: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  travisStatus: { fontSize: 12, color: Colors.success },
  messageList: { padding: 16, gap: 8, paddingBottom: 20 },
  bubble: {
    maxWidth: '80%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10, gap: 4,
  },
  bubbleTravis: { backgroundColor: Colors.white, alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
  bubbleUser: { backgroundColor: Colors.primary, alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  bubbleText: { fontSize: 15, color: Colors.textPrimary, lineHeight: 21 },
  bubbleTextUser: { color: Colors.white },
  bubbleTime: { fontSize: 10, color: Colors.textMuted, alignSelf: 'flex-end' },
  bubbleTimeUser: { color: 'rgba(255,255,255,0.7)' },
  typingIndicator: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 20, paddingVertical: 8,
  },
  typingText: { fontSize: 13, color: Colors.textSecondary, fontStyle: 'italic' },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    paddingHorizontal: 16, paddingVertical: 12, paddingBottom: 28,
    backgroundColor: Colors.white,
    shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.06, elevation: 5,
  },
  input: {
    flex: 1, backgroundColor: Colors.background, borderRadius: 22,
    paddingHorizontal: 16, paddingVertical: 10, fontSize: 15,
    color: Colors.textPrimary, maxHeight: 100,
    borderWidth: 1, borderColor: Colors.border,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: Colors.textMuted },
});
