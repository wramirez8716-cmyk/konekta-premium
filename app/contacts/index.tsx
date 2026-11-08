import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, Linking, ActivityIndicator } from 'react-native';
import * as Contacts from 'expo-contacts';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { db } from '../../src/config/firebaseConfig';
import { getChatId } from '../../src/utils/chatId';

export default function ContactsScreen({ onNavigateChat, onOpenPrivateChat, currentUser }: any) {
  const [contacts, setContacts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Contacts.requestPermissionsAsync();
        if (status === 'granted') {
          const { data } = await Contacts.getContactsAsync({
            fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Name],
          });
          setContacts(data || []);
        } else {
          Alert.alert('Permiso denegado', 'Necesitamos acceso a tus contactos.');
        }
      } catch (e) {
        console.log('Error contactos:', e);
      }
      
      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        const usersList = usersSnap.docs
          .map(d => ({ uid: d.id, ...d.data() }))
          .filter(u => u.uid !== currentUser?.uid);
        setUsers(usersList);
      } catch (e) {
        console.log('Error usuarios:', e);
      }
      
      setLoading(false);
    })();
  }, [currentUser]);

  const inviteContact = (phoneNumber: string | undefined) => {
    const message = "¡Hola! Únete a Konekta Premium, mi nueva app de chat segura y cifrada.";
    if (phoneNumber) {
      const clean = phoneNumber.replace(/\D/g, '');
      const url = `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
      Linking.openURL(url).catch(() => {
        Linking.openURL(`sms:${phoneNumber}?body=${encodeURIComponent(message)}`);
      });
    } else {
      Alert.alert('Sin número', 'Este contacto no tiene número.');
    }
  };

  const startChatWithUser = async (user: any) => {
    if (!currentUser) return;
    const chatId = getChatId(currentUser.uid, user.uid);
    
    await setDoc(doc(db, 'chats', chatId), {
      participants: [currentUser.uid, user.uid],
      createdAt: new Date(),
    }, { merge: true });
    
    onOpenPrivateChat(user.uid, user.displayName);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#25D366" />
        <Text style={styles.loadingText}>Cargando contactos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onNavigateChat} style={styles.backBtn}>
          <Text style={styles.backText}>← Chats</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>📱 Contactos</Text>
      </View>

      {users.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🟢 Usuarios de Konekta</Text>
          {users.map(user => (
            <TouchableOpacity
              key={user.uid}
              style={styles.userItem}
              onPress={() => startChatWithUser(user)}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{(user.displayName || 'U').charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{user.displayName || 'Usuario'}</Text>
                <Text style={styles.userEmail}>{user.email}</Text>
              </View>
              <Text style={styles.chatBtn}>💬 Chatear</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📋 Todos mis contactos</Text>
        <FlatList
          data={contacts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const phone = item.phoneNumbers && item.phoneNumbers.length > 0 ? item.phoneNumbers[0].number : null;
            const contactName = item.name || 'Sin nombre';
            return (
              <View style={styles.contactItem}>
                <View style={styles.contactInfo}>
                  <Text style={styles.contactName}>{contactName}</Text>
                  {phone && <Text style={styles.contactPhone}>{phone}</Text>}
                </View>
                <TouchableOpacity style={styles.inviteBtn} onPress={() => inviteContact(phone)}>
                  <Text style={styles.inviteText}>Invitar</Text>
                </TouchableOpacity>
              </View>
            );
          }}
        />
      </View>
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
  headerTitle: { color: '#25D366', fontSize: 20, fontWeight: 'bold' },
  section: { padding: 10 },
  sectionTitle: { color: '#25D366', fontSize: 14, fontWeight: 'bold', marginBottom: 8, marginLeft: 5 },
  userItem: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#1a1a1a', borderRadius: 10, marginBottom: 8 },
  avatar: { width: 45, height: 45, borderRadius: 22, backgroundColor: '#25D366', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { color: '#0a0a0a', fontSize: 20, fontWeight: 'bold' },
  userInfo: { flex: 1 },
  userName: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  userEmail: { color: '#8696a0', fontSize: 12, marginTop: 2 },
  chatBtn: { color: '#25D366', fontWeight: 'bold', fontSize: 14 },
  contactItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: '#222' },
  contactInfo: { flex: 1 },
  contactName: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  contactPhone: { color: '#8696a0', fontSize: 14, marginTop: 2 },
  inviteBtn: { backgroundColor: '#25D366', padding: 8, borderRadius: 8 },
  inviteText: { color: '#0a0a0a', fontWeight: 'bold' },
});
