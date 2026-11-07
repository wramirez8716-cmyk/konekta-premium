import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Alert } from 'react-native';
import { signOut } from 'firebase/auth';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../src/config/firebaseConfig';
import { getChatId } from '../../src/utils/chatId';
import { encryptMessage, decryptMessage } from '../../src/utils/crypto';

export default function PrivateChatScreen({ otherUid, otherName, onBack }: any) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const currentUser = auth.currentUser;
  
  // Generar ID único para esta conversación
  const chatId = currentUser ? getChatId(currentUser.uid, otherUid) : null;

  useEffect(() => {
    if (!chatId) return;
    
    // Escuchar mensajes de esta conversación específica
    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('createdAt', 'asc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data(),
        // Descifrar el mensaje al recibirlo
        decryptedText: decryptMessage(docSnap.data().encryptedText),
      }));
      setMessages(msgs);
    });
    
    return unsubscribe;
  }, [chatId]);

  const sendMessage = async () => {
    if (message.trim() === '' || !chatId) return;
    
    try {
      // Cifrar el mensaje ANTES de guardarlo
      const encrypted = encryptMessage(message);
      
      // Guardar en la subcolección de mensajes
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        encryptedText: encrypted,
        senderUid: currentUser?.uid,
        createdAt: serverTimestamp(),
      });
      
      // Actualizar el documento principal del chat con el último mensaje
      await updateDoc(doc(db, 'chats', chatId), {
        lastMessage: message,
        lastMessageTime: serverTimestamp(),
        participants: [currentUser?.uid, otherUid],
      });
      
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
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{otherName}</Text>
          <Text style={styles.encryptedBadge}>🔒 Cifrado</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Salir</Text>
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
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
        />
        <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
          <Text style={styles.sendText}>Enviar</Text>
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
  sendText: { color: '#0a0a0a', fontWeight: 'bold' },
});
