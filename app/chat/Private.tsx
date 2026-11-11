import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../../src/config/firebaseConfig';
import { useTheme } from '../../src/context/ThemeContext';
import Header from '../../src/components/Header';

export default function PrivateChatScreen({ otherUid, otherName, onBack }: any) {
  const { theme } = useTheme();
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [otherPhoto, setOtherPhoto] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser || !otherUid) return;

    const loadOtherUser = async () => {
      const userDoc = await getDoc(doc(db, 'users', otherUid));
      if (userDoc.exists()) setOtherPhoto(userDoc.data().photoURL || null);
    };
    loadOtherUser();

    const chatId = [currentUser.uid, otherUid].sort().join('_');
    const q = query(collection(db, `chats/${chatId}/messages`), orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
      setLoading(false);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    });

    return unsubscribe;
  }, [currentUser, otherUid]);

  const sendMessage = async () => {
    if (!inputText.trim() || !currentUser) return;
    const chatId = [currentUser.uid, otherUid].sort().join('_');
    try {
      await addDoc(collection(db, `chats/${chatId}/messages`), {
        text: inputText.trim(), senderId: currentUser.uid, timestamp: serverTimestamp(), status: 'sent',
      });
      await addDoc(collection(db, 'chats'), {
        id: chatId, participants: [currentUser.uid, otherUid], lastMessage: inputText.trim(), lastMessageTime: serverTimestamp(),
      });
      setInputText('');
    } catch (error) { console.error('Error enviando:', error); }
  };

  const deleteMessage = async (messageId: string) => {
    Alert.alert('Eliminar mensaje', '¿Estás seguro de que quieres borrar este mensaje?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive',
        onPress: async () => {
          try {
            const chatId = [currentUser!.uid, otherUid].sort().join('_');
            await deleteDoc(doc(db, `chats/${chatId}/messages`, messageId));
          } catch (error) { Alert.alert('Error', 'No se pudo eliminar'); }
        },
      },
    ]);
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = ({ item }: any) => {
    const isMe = item.senderId === currentUser?.uid;
    return (
      <TouchableOpacity
        style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther, { backgroundColor: isMe ? theme.primary : theme.surface }]}
        onLongPress={() => isMe && deleteMessage(item.id)}
        activeOpacity={0.8}
      >
        <Text style={[styles.messageText, { color: isMe ? '#fff' : theme.text }]}>{item.text}</Text>
        <View style={styles.messageFooter}>
          <Text style={[styles.timeText, { color: isMe ? 'rgba(255,255,255,0.8)' : theme.textSecondary }]}>{formatTime(item.timestamp)}</Text>
          {isMe && <Text style={[styles.checkText, { color: item.status === 'sent' ? 'rgba(255,255,255,0.8)' : '#4fc3f7' }]}>✓✓</Text>}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) return <View style={[styles.container, { backgroundColor: theme.background }]}><ActivityIndicator size="large" color={theme.primary} /></View>;

  return (
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: theme.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <Header title={otherName} subtitle="En línea" onBack={onBack} avatarUri={otherPhoto} avatarInitial={otherName.charAt(0).toUpperCase()} />
      <FlatList ref={flatListRef} data={messages} keyExtractor={(item) => item.id} renderItem={renderMessage} contentContainerStyle={styles.messagesList} onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })} />
      <View style={[styles.inputContainer, { backgroundColor: theme.surface, borderTopColor: theme.border || '#333' }]}>
        <TextInput style={[styles.input, { color: theme.text, backgroundColor: theme.background }]} placeholder="Escribe un mensaje..." placeholderTextColor={theme.textSecondary} value={inputText} onChangeText={setInputText} multiline />
        <TouchableOpacity style={[styles.sendBtn, { backgroundColor: theme.primary }]} onPress={sendMessage}>
          <Text style={[styles.sendText, { color: theme.background }]}>➤</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  messagesList: { padding: 15, flexGrow: 1 },
  bubble: { maxWidth: '80%', padding: 10, borderRadius: 15, marginBottom: 8 },
  bubbleMe: { alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  bubbleOther: { alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
  messageText: { fontSize: 15, lineHeight: 20, marginBottom: 4 },
  messageFooter: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' },
  timeText: { fontSize: 11, marginRight: 4 },
  checkText: { fontSize: 14, fontWeight: 'bold' },
  inputContainer: { flexDirection: 'row', alignItems: 'flex-end', padding: 10, borderTopWidth: 1 },
  input: { flex: 1, maxHeight: 100, minHeight: 40, borderRadius: 20, paddingHorizontal: 15, paddingVertical: 10, fontSize: 15 },
  sendBtn: { width: 45, height: 45, borderRadius: 22.5, justifyContent: 'center', alignItems: 'center', marginLeft: 8, marginBottom: 2 },
  sendText: { fontSize: 20, fontWeight: 'bold' },
});
