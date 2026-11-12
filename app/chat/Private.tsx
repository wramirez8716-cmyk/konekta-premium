import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Image, Modal } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../../src/config/firebaseConfig';
import { useTheme } from '../../src/context/ThemeContext';
import Header from '../../src/components/Header';
import { uploadImageToCloudinary } from '../../src/utils/cloudinary';
import { sendPushNotification } from '../../src/utils/notifications';

export default function PrivateChatScreen({ otherUid, otherName, onBack }: any) {
  const { theme } = useTheme();
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [otherPhoto, setOtherPhoto] = useState<string | null>(null);
  const [otherPushToken, setOtherPushToken] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser || !otherUid) return;
    const loadOtherUser = async () => {
      const userDoc = await getDoc(doc(db, 'users', otherUid));
      if (userDoc.exists()) {
        setOtherPhoto(userDoc.data().photoURL || null);
        setOtherPushToken(userDoc.data().pushToken || null);
      }
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

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setUploading(true);
      try {
        const imageUrl = await uploadImageToCloudinary(result.assets[0].uri);
        await sendImageMessage(imageUrl);
      } catch (error) {
        Alert.alert('Error', 'No se pudo subir la imagen');
      } finally {
        setUploading(false);
      }
    }
  };

  const sendImageMessage = async (imageUrl: string) => {
    if (!currentUser) return;
    const chatId = [currentUser.uid, otherUid].sort().join('_');
    try {
      await addDoc(collection(db, `chats/${chatId}/messages`), {
        type: 'image', imageUrl, senderId: currentUser.uid, timestamp: serverTimestamp(), status: 'sent',
      });
      await addDoc(collection(db, 'chats'), {
        id: chatId, participants: [currentUser.uid, otherUid], lastMessage: '📷 Imagen', lastMessageTime: serverTimestamp(),
      });
      if (otherPushToken) await sendPushNotification(otherPushToken, currentUser.displayName || 'Nuevo mensaje', '📷 Te envió una imagen');
    } catch (error) { console.error('Error enviando imagen:', error); }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || !currentUser) return;
    const chatId = [currentUser.uid, otherUid].sort().join('_');
    try {
      await addDoc(collection(db, `chats/${chatId}/messages`), {
        type: 'text', text: inputText.trim(), senderId: currentUser.uid, timestamp: serverTimestamp(), status: 'sent',
      });
      await addDoc(collection(db, 'chats'), {
        id: chatId, participants: [currentUser.uid, otherUid], lastMessage: inputText.trim(), lastMessageTime: serverTimestamp(),
      });
      // Enviar notificación push
      if (otherPushToken) {
        await sendPushNotification(otherPushToken, currentUser.displayName || 'Nuevo mensaje', inputText.trim());
      }
      setInputText('');
    } catch (error) { console.error('Error enviando:', error); }
  };

  const deleteMessage = async (messageId: string) => {
    Alert.alert('Eliminar mensaje', '¿Estás seguro?', [
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
        onPress={() => item.type === 'image' && setSelectedImage(item.imageUrl)}
      >
        {item.type === 'image' ? (
          <Image source={{ uri: item.imageUrl }} style={styles.messageImage} />
        ) : (
          <Text style={[styles.messageText, { color: isMe ? '#fff' : theme.text }]}>{item.text}</Text>
        )}
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
      
      {uploading && (
        <View style={styles.uploadingOverlay}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={{ color: theme.text, marginTop: 10 }}>Subiendo imagen...</Text>
        </View>
      )}

      <View style={[styles.inputContainer, { backgroundColor: theme.surface, borderTopColor: theme.border || '#333' }]}>
        <TouchableOpacity style={[styles.attachBtn, { backgroundColor: theme.surface }]} onPress={pickImage}>
          <Text style={{ fontSize: 24, color: theme.primary }}>📎</Text>
        </TouchableOpacity>
        <TextInput style={[styles.input, { color: theme.text, backgroundColor: theme.background }]} placeholder="Escribe un mensaje..." placeholderTextColor={theme.textSecondary} value={inputText} onChangeText={setInputText} multiline />
        <TouchableOpacity style={[styles.sendBtn, { backgroundColor: theme.primary }]} onPress={sendMessage}>
          <Text style={[styles.sendText, { color: theme.background }]}>➤</Text>
        </TouchableOpacity>
      </View>

      {selectedImage && (
        <Modal visible={true} transparent={true} onRequestClose={() => setSelectedImage(null)}>
          <View style={styles.modalContainer}>
            <TouchableOpacity style={styles.modalClose} onPress={() => setSelectedImage(null)}>
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
            <Image source={{ uri: selectedImage }} style={styles.modalImage} resizeMode="contain" />
          </View>
        </Modal>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  messagesList: { padding: 15, flexGrow: 1 },
  bubble: { maxWidth: '80%', padding: 10, borderRadius: 15, marginBottom: 8, overflow: 'hidden' },
  bubbleMe: { alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  bubbleOther: { alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
  messageImage: { width: 200, height: 200, borderRadius: 10, marginBottom: 5 },
  messageText: { fontSize: 15, lineHeight: 20, marginBottom: 4 },
  messageFooter: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' },
  timeText: { fontSize: 11, marginRight: 4 },
  checkText: { fontSize: 14, fontWeight: 'bold' },
  inputContainer: { flexDirection: 'row', alignItems: 'flex-end', padding: 10, borderTopWidth: 1 },
  attachBtn: { width: 45, height: 45, borderRadius: 22.5, justifyContent: 'center', alignItems: 'center', marginRight: 8, marginBottom: 2 },
  input: { flex: 1, maxHeight: 100, minHeight: 40, borderRadius: 20, paddingHorizontal: 15, paddingVertical: 10, fontSize: 15 },
  sendBtn: { width: 45, height: 45, borderRadius: 22.5, justifyContent: 'center', alignItems: 'center', marginLeft: 8, marginBottom: 2 },
  sendText: { fontSize: 20, fontWeight: 'bold' },
  uploadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  modalClose: { position: 'absolute', top: 50, right: 20, zIndex: 10 },
  modalCloseText: { color: '#fff', fontSize: 30, fontWeight: 'bold' },
  modalImage: { width: '90%', height: '70%' },
});
