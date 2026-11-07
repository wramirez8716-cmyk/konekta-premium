import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, Linking, ActivityIndicator } from 'react-native';
import * as Contacts from 'expo-contacts';

export default function ContactsScreen({ onNavigateChat }: any) {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status === 'granted') {
        const { data } = await Contacts.getContactsAsync({
          fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Name],
        });
        if (data.length > 0) {
          setContacts(data);
        }
      } else {
        Alert.alert('Permiso denegado', 'Necesitamos acceso a tus contactos para encontrar amigos.');
      }
      setLoading(false);
    })();
  }, []);

  const inviteContact = (phoneNumber: string | undefined) => {
    const message = "¡Hola! Únete a Konekta Premium, mi nueva app de chat.";
    if (phoneNumber) {
      // Intenta abrir WhatsApp, si no, abre SMS
      const url = `https://wa.me/${phoneNumber.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
      Linking.openURL(url).catch(() => {
        Linking.openURL(`sms:${phoneNumber}?body=${encodeURIComponent(message)}`);
      });
    } else {
      Alert.alert('Sin número', 'Este contacto no tiene número de teléfono.');
    }
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
          <Text style={styles.backText}>← Chat</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>📱 Mis Contactos</Text>
      </View>
      
      <FlatList
        data={contacts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const phone = item.phoneNumbers && item.phoneNumbers.length > 0 ? item.phoneNumbers[0].number : null;
          return (
            <View style={styles.contactItem}>
              <View style={styles.contactInfo}>
                <Text style={styles.contactName}>{item.name || 'Desconocido'}</Text>
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
  contactItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#222' },
  contactInfo: { flex: 1 },
  contactName: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  contactPhone: { color: '#8696a0', fontSize: 14, marginTop: 2 },
  inviteBtn: { backgroundColor: '#25D366', padding: 8, borderRadius: 8 },
  inviteText: { color: '#0a0a0a', fontWeight: 'bold' },
});
