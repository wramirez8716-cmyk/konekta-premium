import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../src/config/firebaseConfig';
import { useTheme } from '../../src/context/ThemeContext';

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

    // Cargar foto del otro usuario
    const loadOtherUser = async () => {
      const userDoc = await getDoc(doc(db, 'users', otherUid));
      if (userDoc.exists()) {
        setOtherPhoto(userDoc.data().photoURL || null);
      }
    };
    loadOtherUser();

    // Escuchar mensajes en tiempo real
    const chatId = [currentUser.uid, otherUid].sort().join('_');
    const q = query(
      collection(db, `chats/${chatId}/messages`),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMessages(msgs);
      setLoading(false);
      
      // Auto-scroll al final
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });

    return unsubscribe;
  }, [currentUser, otherUid]);

  const sendMessage = async () => {
    if (!inputText.trim() || !currentUser) return;

    const chatId = [currentUser.uid, otherUid].sort().join('_');
    
    try {
      await addDoc(collection(db, `chats/${chatId}/messages`), {
        text: inputText.trim(),
        senderId: currentUser.uid,
        timestamp: serverTimestamp(),
        status: 'sent',
      });
      
      // Actualizar último mensaje en la lista de chats
      await addDoc(collection(db, 'chats'), {
        id: chatId,
        participants: [currentUser.uid, otherUid],
        lastMessage: inputText.trim(),
        lastMessageTime: serverTimestamp(),
      });

      setInputText('');
    } catch (error) {
      console.error('Error enviando mensaje:', error);
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = ({ item }: any) => {
    const isMe = item.senderId === currentUser?.uid;
    
    return (
      <View style={[
        styles.bubble,
        isMe ? styles.bubbleMe : styles.bubbleOther,
        { backgroundColor: isMe ? theme.primary : theme.surface }
      ]}>
        <Text style={[styles.messageText, { color: isMe ? '#fff' : theme.text }]}>
          {item.text}
        </Text>
        <View style={styles.messageFooter}>
          <Text style={[styles.timeText, { color: isMe ? 'rgba(255,255,255,0.8)' : theme.textSecondary }]}>
            {formatTime(item.timestamp)}
          </Text>
          {isMe && (
            <Text style={[styles.checkText, { color: item.status === 'sent' ? 'rgba(255,255,255,0.8)' : '#4fc3f7' }]}>
              ✓✓
            </Text>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: '#333' }]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={[styles.backText, { color: theme.primary }]}>←</Text>
        </TouchableOpacity>
        {otherPhoto ? (
          <View style={styles.headerAvatar}>
            <Text style={{ fontSize: 20 }}>👤</Text> 
            {/* Nota: Aquí iría <Image source={{uri: otherPhoto}} /> si importas Image */}
          </View>
        ) : (
          <View style={[styles.headerAvatar, { backgroundColor: theme.primary }]}>
            <Text style={[styles.avatarText, { color: theme.background }]}>
              {otherName.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <View style={styles.headerInfo}>
          <Text style={[styles.headerName, { color: theme.text }]}>{otherName}</Text>
          <Text style={[styles.headerStatus, { color: theme.textSecondary }]}>En línea</Text>
        </View>
      </View>

      {/* Lista de mensajes */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      {/* Input de texto */}
      <View style={[styles.inputContainer, { backgroundColor: theme.surface, borderTopColor: '#333' }]}>
        <TextInput
          style={[styles.input, { color: theme.text, backgroundColor: theme.background }]}
          placeholder="Escribe un mensaje..."
          placeholderTextColor={theme.textSecondary}
          value={inputText}
          onChangeText={setInputText}
          multiline
        />
        <TouchableOpacity 
          style={[styles.sendBtn, { backgroundColor: theme.primary }]} 
          onPress={sendMessage}
        >
          <Text style={[styles.sendText, { color: theme.background }]}>➤</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1 },
  backBtn: { padding: 8, marginRight: 8 },
  backText: { fontSize: 24, fontWeight: 'bold' },
  headerAvatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  avatarText: { fontSize: 18, fontWeight: 'bold' },
  headerInfo: { flex: 1 },
  headerName: { fontSize: 16, fontWeight: 'bold' },
  headerStatus: { fontSize: 12 },
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
