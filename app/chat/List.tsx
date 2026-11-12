import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Image, Alert, TextInput } from 'react-native';
import { collection, query, where, onSnapshot, doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { auth, db } from '../../src/config/firebaseConfig';
import { useTheme } from '../../src/context/ThemeContext';
import Header from '../../src/components/Header';

export default function ChatListScreen({ onOpenChat, onNavigateContacts, onNavigateProfile }: any) {
  const { theme } = useTheme();
  const [conversations, setConversations] = useState<any[]>([]);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentUserData, setCurrentUserData] = useState<any>(null);
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser) return;
    const loadUserData = async () => {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) setCurrentUserData(userDoc.data());
    };
    loadUserData();

    const q = query(collection(db, 'chats'), where('participants', 'array-contains', currentUser.uid));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const convos = [];
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const participants = data.participants || [];
        const otherUid = participants.find((uid: string) => uid !== currentUser.uid);
        if (!otherUid || otherUid === currentUser.uid) continue;

        const hiddenFor = data.hiddenFor || [];
        if (hiddenFor.includes(currentUser.uid)) continue;

        let otherName = 'Usuario';
        let otherPhoto = null;
        try {
          const userDoc = await getDoc(doc(db, 'users', otherUid));
          if (userDoc.exists()) {
            otherName = userDoc.data().displayName || 'Usuario';
            otherPhoto = userDoc.data().photoURL;
          }
        } catch (e) {}

        convos.push({ id: docSnap.id, otherUid, otherName, otherPhoto, lastMessage: data.lastMessage || '' });
      }
      setConversations(convos);
      setLoading(false);
    });
    return unsubscribe;
  }, [currentUser]);

  // Filtrar conversaciones por nombre o último mensaje
  const filteredConversations = conversations.filter(item =>
    item.otherName.toLowerCase().includes(searchText.toLowerCase()) ||
    (item.lastMessage && item.lastMessage.toLowerCase().includes(searchText.toLowerCase()))
  );

  const deleteConversation = (chatId: string, otherName: string) => {
    Alert.alert(
      'Eliminar conversación',
      `¿Seguro que quieres eliminar el chat con ${otherName}? (Solo se borrará de tu vista)`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await updateDoc(doc(db, 'chats', chatId), {
                hiddenFor: arrayUnion(currentUser.uid)
              });
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar');
            }
          },
        },
      ]
    );
  };

  if (loading) return <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}><ActivityIndicator size="large" color={theme.primary} /></View>;

  const renderProfileIcon = () => {
    if (currentUserData?.photoURL) return <Image source={{ uri: currentUserData.photoURL }} style={styles.profilePhoto} />;
    return (
      <View style={[styles.profilePlaceholder, { backgroundColor: theme.primary }]}>
        <Text style={[styles.profileText, { color: theme.background }]}>{currentUser?.displayName?.charAt(0).toUpperCase() || 'U'}</Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Header 
        title="💬 Mis Chats" 
        rightIcon={renderProfileIcon()} 
        onRightPress={onNavigateProfile}
      />

      {/* Barra de Búsqueda */}
      <View style={[styles.searchContainer, { backgroundColor: theme.surface }]}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="Buscar chat o mensaje..."
          placeholderTextColor={theme.textSecondary}
          value={searchText}
          onChangeText={setSearchText}
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={() => setSearchText('')}>
            <Text style={{ color: theme.textSecondary, fontSize: 16 }}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Botón flotante de Contactos */}
      <TouchableOpacity 
        style={[styles.floatingContactsBtn, { backgroundColor: theme.primary }]}
        onPress={onNavigateContacts}
        activeOpacity={0.8}
      >
        <Text style={styles.floatingContactsText}>👥 Contactos</Text>
      </TouchableOpacity>

      {filteredConversations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: theme.text }]}>
            {searchText ? 'No se encontraron resultados' : 'Aún no tienes conversaciones'}
          </Text>
          {!searchText && (
            <TouchableOpacity onPress={onNavigateContacts}>
              <Text style={[styles.emptySubtext, { color: theme.primary }]}>Ve a Contactos e inicia un chat</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList 
          data={filteredConversations} 
          keyExtractor={(item) => item.id} 
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={[styles.chatItem, { borderBottomColor: theme.border || '#222' }]} 
              onPress={() => onOpenChat(item.otherUid, item.otherName)}
              onLongPress={() => deleteConversation(item.id, item.otherName)}
              activeOpacity={0.7}
            >
              {item.otherPhoto ? <Image source={{ uri: item.otherPhoto }} style={styles.avatar} /> : <View style={[styles.avatar, { backgroundColor: theme.primary }]}><Text style={[styles.avatarText, { color: theme.background }]}>{item.otherName.charAt(0).toUpperCase()}</Text></View>}
              <View style={styles.chatInfo}>
                <Text style={[styles.chatName, { color: theme.text }]}>{item.otherName}</Text>
                <Text style={[styles.lastMessage, { color: theme.textSecondary }]} numberOfLines={1}>{item.lastMessage || 'Inicia la conversación'}</Text>
              </View>
              <Text style={[styles.arrow, { color: theme.primary }]}>›</Text>
            </TouchableOpacity>
          )} 
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyText: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  emptySubtext: { fontSize: 14, textAlign: 'center' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#222' },
  searchIcon: { fontSize: 18, marginRight: 10 },
  searchInput: { flex: 1, fontSize: 15, paddingVertical: 8 },
  chatItem: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1 },
  avatar: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { fontSize: 22, fontWeight: 'bold' },
  chatInfo: { flex: 1 },
  chatName: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  lastMessage: { fontSize: 14 },
  arrow: { fontSize: 28, fontWeight: 'bold' },
  profilePhoto: { width: 35, height: 35, borderRadius: 17.5, borderWidth: 2, borderColor: '#25D366' },
  profilePlaceholder: { width: 35, height: 35, borderRadius: 17.5, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#25D366' },
  profileText: { fontSize: 16, fontWeight: 'bold' },
  floatingContactsBtn: { position: 'absolute', bottom: 20, right: 20, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 25, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 8, zIndex: 100 },
  floatingContactsText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
});
