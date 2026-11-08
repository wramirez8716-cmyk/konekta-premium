import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Alert } from 'react-native';
import { signOut } from 'firebase/auth';
import { collection, addDoc, query, orderBy, onSnapshot, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../src/config/firebaseConfig';
import { getChatId } from '../../src/utils/chatId';
import { encryptMessage, decryptMessage } from '../../src/utils/crypto';

export default function PrivateChatScreen({ otherUid, otherName, onBack }: any) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [sending, setSending] = useState(false);
  const currentUser = auth.currentUser;
  const chatId = currentUser ? getChatId(currentUser.uid, otherUid) : null;

  useEffect(() => {
    if (!chatId || !currentUser) return;
    
    setDoc(doc(db, 'chats', chatId), {
      participants: [currentUser.uid, otherUid],
      createdAt: serverTimestamp(),
    }, { merge: true }).catch(err => console.log('Error creando chat:', err));

    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('createdAt', 'asc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((docSnap: any) => ({
        id: docSnap.id,
        ...docSnap.data(),
        decryptedText: decryptMessage(docSnap.data().encryptedText),
      }));
      setMessages(msgs);
    }, (error: any) => {
      console.error('Error en snapshot:', error);
      Alert.alert('Error de conexión', error.message);
    });
    
    return () => unsubscribe();
  }, [chatId, currentUser, otherUid]);

  const sendMessage = async () => {
    if (!message.trim() || !chatId || !currentUser) {
      Alert.alert('Error', 'Faltan datos para enviar');
      return;
    }
    
    setSending(true);
    try {
      const encrypted = encryptMessage(message);
      
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        encryptedText: encrypted,
        senderUid: currentUser.uid,
        createdAt: serverTimestamp(),
      });
      
      await setDoc(doc(db, 'chats', chatId), {
        participants: [currentUser.uid, otherUid],
        lastMessage: message,
        lastMessageTime: serverTimestamp(),
      }, { merge: true });
      
      setMessage('');
    } catch (error: any) {
      Alert.alert('Error al enviar', error.message || 'Error desconocido');
    } finally {
      setSending(false);
    }
  };

  const handleLogout = async () => {
    try { await signOut(auth); } catch (error) { Alert.alert('Error', 'No se pudo cerrar sesión'); }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{otherName || 'Usuario'}</Text>
          <Text style={styles.encryptedBadge}>🔒 Cifrado</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Salir</Text>
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={messages}
        keyExtractor={(item: any) => item.id}
        renderItem={({ item }: any) => (
          <View style={[
            styles.messageBubble,
            item.senderUid === currentUser?.uid ? styles.myMessage : styles.otherMessage
          ]}>
            <Text style={styles.messageText}>{item.decryptedText}</Text>
          </View>
        )}
        contentContainerStyle={styles.messagesList}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Escribe un mensaje cifrado..."
          placeholderTextColor="#8696a0"
          value={message}
          onChangeText={setMessage}
          editable={!sending}
        />
        <TouchableOpacity 
          style={[styles.sendBtn, sending && styles.sendBtnDisabled]} 
          onPress={sendMessage}
          disabled={sending}
        >
          <Text style={styles.sendText}>{sending ? '...' : 'Enviar'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: '#1a1a1a', borderBottomWidth: 1, borderBottomColor: '#333' },
  backBtn: { marginRight: 10 },
  backText: { color: '#25D366', fontSize: 24, fontWeight: 'bold' },
  headerInfo: { flex: 1 },
  headerTitle: { color: '#25D366', fontSize: 18, fontWeight: 'bold' },
  encryptedBadge: { color: '#8696a0', fontSize: 11, marginTop: 2 },
  logoutBtn: { backgroundColor: '#ff4444', padding: 8, borderRadius: 8 },
  logoutText: { color: '#fff', fontWeight: 'bold' },
  messagesList: { padding: 10, flexGrow: 1 },
  messageBubble: { padding: 12, borderRadius: 12, marginBottom: 8, maxWidth: '80%' },
  myMessage: { backgroundColor: '#25D366', alignSelf: 'flex-end' },
  otherMessage: { backgroundColor: '#1a1a1a', alignSelf: 'flex-start' },
  messageText: { fontSize: 15, color: '#fff' },
  inputContainer: { flexDirection: 'row', padding: 10, backgroundColor: '#1a1a1a', borderTopWidth: 1, borderTopColor: '#333' },
  input: { flex: 1, backgroundColor: '#0a0a0a', color: '#fff', padding: 12, borderRadius: 20, marginRight: 10 },
  sendBtn: { backgroundColor: '#25D366', paddingHorizontal: 20, justifyContent: 'center', borderRadius: 20 },
  sendBtnDisabled: { opacity: 0.5 },
  sendText: { color: '#0a0a0a', fontWeight: 'bold' },
});
