import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Alert } from 'react-native';
import { signOut } from 'firebase/auth';
import { auth, db } from '../../src/config/firebaseConfig';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';

export default function ChatScreen() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const userEmail = auth.currentUser?.email || 'Usuario';

  useEffect(() => {
    const q = query(collection(db, 'messages'), orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
    });
    return unsubscribe;
  }, []);

  const sendMessage = async () => {
    if (message.trim() === '') return;
    try {
      await addDoc(collection(db, 'messages'), { text: message, user: userEmail, createdAt: serverTimestamp() });
      setMessage('');
    } catch (error) {
      Alert.alert('Error', 'No se pudo enviar el mensaje');
    }
  };

  const handleLogout = async () => {
    try { await signOut(auth); } catch (error) { Alert.alert('Error', 'No se pudo cerrar sesión'); }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>💬 KONEKTA CHAT</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}><Text style={styles.logoutText}>Salir</Text></TouchableOpacity>
      </View>
      <FlatList data={messages} keyExtractor={(item) => item.id} renderItem={({ item }) => (
        <View style={[styles.messageBubble, item.user === userEmail ? styles.myMessage : styles.otherMessage]}>
          <Text style={styles.messageUser}>{item.user}</Text>
          <Text style={styles.messageText}>{item.text}</Text>
        </View>
      )} contentContainerStyle={styles.messagesList} />
      <View style={styles.inputContainer}>
        <TextInput style={styles.input} placeholder="Escribe un mensaje..." placeholderTextColor="#8696a0" value={message} onChangeText={setMessage} />
        <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}><Text style={styles.sendText}>Enviar</Text></TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: '#1a1a1a', borderBottomWidth: 1, borderBottomColor: '#333' },
  headerTitle: { color: '#25D366', fontSize: 20, fontWeight: 'bold' },
  logoutBtn: { backgroundColor: '#ff4444', padding: 8, borderRadius: 8 },
  logoutText: { color: '#fff', fontWeight: 'bold' },
  messagesList: { padding: 10, flexGrow: 1 },
  messageBubble: { padding: 12, borderRadius: 12, marginBottom: 8, maxWidth: '80%' },
  myMessage: { backgroundColor: '#25D366', alignSelf: 'flex-end' },
  otherMessage: { backgroundColor: '#1a1a1a', alignSelf: 'flex-start' },
  messageUser: { fontSize: 11, color: '#0a0a0a', fontWeight: 'bold', marginBottom: 4 },
  messageText: { fontSize: 15, color: '#fff' },
  inputContainer: { flexDirection: 'row', padding: 10, backgroundColor: '#1a1a1a', borderTopWidth: 1, borderTopColor: '#333' },
  input: { flex: 1, backgroundColor: '#0a0a0a', color: '#fff', padding: 12, borderRadius: 20, marginRight: 10 },
  sendBtn: { backgroundColor: '#25D366', paddingHorizontal: 20, justifyContent: 'center', borderRadius: 20 },
  sendText: { color: '#0a0a0a', fontWeight: 'bold' },
});
