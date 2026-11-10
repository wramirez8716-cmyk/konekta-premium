import React, { useState, useEffect } from 'react';
import { StatusBar, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './src/config/firebaseConfig';
import { authenticateWithBiometrics } from './src/utils/biometrics';
import AuthScreen from './app/auth/index';
import ChatListScreen from './app/chat/List';
import PrivateChatScreen from './app/chat/Private';
import ContactsScreen from './app/contacts/index';
import ProfileScreen from './app/profile';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentScreen, setCurrentScreen] = useState('chatList');
  const [selectedChat, setSelectedChat] = useState({ uid: null, name: '' });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (!currentUser) {
        setCurrentScreen('chatList');
        setIsAuthenticated(false);
      } else {
        checkBiometrics();
      }
    });
    return unsubscribe;
  }, []);

  const checkBiometrics = async () => {
    const result = await authenticateWithBiometrics();
    if (result.success) {
      setIsAuthenticated(true);
    }
  };

  const handleRetryBiometrics = () => {
    checkBiometrics();
  };

  if (loading) return null;
  if (!user) return <AuthScreen />;

  if (!isAuthenticated) {
    return (
      <View style={styles.lockScreen}>
        <Text style={styles.lockIcon}>🔒</Text>
        <Text style={styles.lockTitle}>Konekta Premium</Text>
        <Text style={styles.lockSubtitle}>Toca para desbloquear con tu huella o PIN</Text>
        <TouchableOpacity style={styles.unlockBtn} onPress={handleRetryBiometrics}>
          <Text style={styles.unlockText}>Desbloquear</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const openPrivateChat = (uid: string, name: string) => {
    setSelectedChat({ uid, name });
    setCurrentScreen('privateChat');
  };

  return (
    <>
      {currentScreen === 'chatList' && (
        <ChatListScreen
          onOpenChat={openPrivateChat}
          onBack={() => setCurrentScreen('contacts')}
        />
      )}
      {currentScreen === 'privateChat' && (
        <PrivateChatScreen
          otherUid={selectedChat.uid}
          otherName={selectedChat.name}
          onBack={() => setCurrentScreen('chatList')}
        />
      )}
      {currentScreen === 'contacts' && (
        <ContactsScreen
          onNavigateChat={() => setCurrentScreen('chatList')}
          onOpenPrivateChat={openPrivateChat}
          currentUser={user}
        />
      )}
      {currentScreen === 'profile' && (
        <ProfileScreen onBack={() => setCurrentScreen('chatList')} />
      )}
      <StatusBar style="light" />
    </>
  );
}

const styles = StyleSheet.create({
  lockScreen: { flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center', padding: 20 },
  lockIcon: { fontSize: 60, marginBottom: 20 },
  lockTitle: { color: '#25D366', fontSize: 28, fontWeight: 'bold', marginBottom: 10 },
  lockSubtitle: { color: '#8696a0', fontSize: 16, textAlign: 'center', marginBottom: 30 },
  unlockBtn: { backgroundColor: '#25D366', paddingVertical: 15, paddingHorizontal: 40, borderRadius: 30 },
  unlockText: { color: '#0a0a0a', fontSize: 18, fontWeight: 'bold' },
});
