import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../src/config/firebaseConfig';

export default function ChatListScreen({ onOpenChat, onBack }: any) {
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserData, setCurrentUserData] = useState<any>(null);
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser) return;

    // Cargar datos del usuario actual
    const loadUserData = async () => {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) {
        setCurrentUserData(userDoc.data());
      }
    };
    loadUserData();

    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const convos = [];
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const participants = data.participants || [];
        const otherUid = participants.find((uid: string) => uid !== currentUser.uid);
        
        if (!otherUid || otherUid === currentUser.uid) continue;
        
        let otherName = 'Usuario';
        let otherPhoto = null;
        try {
          const userDoc = await getDoc(doc(db, 'users', otherUid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            otherName = userData.displayName || 'Usuario';
            otherPhoto = userData.photoURL;
          }
        } catch (e) {}

        convos.push({
          id: docSnap.id,
          otherUid,
          otherName,
          otherPhoto,
          lastMessage: data.lastMessage || '',
        });
      }
      setConversations(convos);
      setLoading(false);
    });

    return unsubscribe;
  }, [currentUser]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#25D366" />
        <Text style={styles.loadingText}>Cargando conversaciones...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>← Contactos</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>💬 Mis Chats</Text>
        <TouchableOpacity onPress={() => onBack && onBack()} style={styles.profileBtn}>
          {currentUserData?.photoURL ? (
            <Image source={{ uri: currentUserData.photoURL }} style={styles.profilePhoto} />
          ) : (
            <View style={styles.profilePlaceholder}>
              <Text style={styles.profileText}>{currentUser?.displayName?.charAt(0).toUpperCase() || 'U'}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {conversations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Aún no tienes conversaciones</Text>
          <Text style={styles.emptySubtext}>Ve a Contactos e inicia un chat</Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.chatItem}
              onPress={() => onOpenChat(item.otherUid, item.otherName)}
            >
              {item.otherPhoto ? (
                <Image source={{ uri: item.otherPhoto }} style={styles.avatar} />
              ) : (
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{item.otherName.charAt(0).toUpperCase()}</Text>
                </View>
              )}
              <View style={styles.chatInfo}>
                <Text style={styles.chatName}>{item.otherName}</Text>
                <Text style={styles.lastMessage} numberOfLines={1}>
                  {item.lastMessage || 'Inicia la conversación'}
                </Text>
              </View>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0a' },
  loadingText: { color: '#25D366', marginTop: 10, fontSize: 16 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: '#1a1a1a', borderBottomWidth: 1, borderBottomColor: '#333' },
  backBtn: { marginRight: 15 },
  backText: { color: '#25D366', fontSize: 16, fontWeight: 'bold' },
  headerTitle: { color: '#25D366', fontSize: 20, fontWeight: 'bold', flex: 1 },
  profileBtn: { marginRight: 5 },
  profilePhoto: { width: 35, height: 35, borderRadius: 17.5, borderWidth: 2, borderColor: '#25D366' },
  profilePlaceholder: { width: 35, height: 35, borderRadius: 17.5, backgroundColor: '#25D366', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#25D366' },
  profileText: { color: '#0a0a0a', fontSize: 16, fontWeight: 'bold' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyText: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  emptySubtext: { color: '#8696a0', fontSize: 14, textAlign: 'center' },
  chatItem: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#222' },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#25D366', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { color: '#0a0a0a', fontSize: 22, fontWeight: 'bold' },
  chatInfo: { flex: 1 },
  chatName: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  lastMessage: { color: '#8696a0', fontSize: 14 },
  arrow: { color: '#25D366', fontSize: 28, fontWeight: 'bold' },
});
