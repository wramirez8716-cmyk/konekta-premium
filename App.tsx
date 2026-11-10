import React, { useState, useEffect } from 'react';
import { StatusBar, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './src/config/firebaseConfig';
import { authenticateWithBiometrics } from './src/utils/biometrics';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import AuthScreen from './app/auth/index';
import ChatListScreen from './app/chat/List';
import PrivateChatScreen from './app/chat/Private';
import ContactsScreen from './app/contacts/index';
import ProfileScreen from './app/profile';

function AppContent() {
  const { theme } = useTheme();
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
      <View style={[styles.lockScreen, { backgroundColor: theme.background }]}>
        <Text style={styles.lockIcon}>🔒</Text>
        <Text style={[styles.lockTitle, { color: theme.primary }]}>Konekta Premium</Text>
        <Text style={[styles.lockSubtitle, { color: theme.textSecondary }]}>Toca para desbloquear con tu huella o PIN</Text>
        <TouchableOpacity style={[styles.unlockBtn, { backgroundColor: theme.primary }]} onPress={handleRetryBiometrics}>
          <Text style={[styles.unlockText, { color: theme.background }]}>Desbloquear</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const openPrivateChat = (uid, name) => {
    setSelectedChat({ uid, name });
    setCurrentScreen('privateChat');
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
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
    </View>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  lockScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  lockIcon: { fontSize: 60, marginBottom: 20 },
  lockTitle: { fontSize: 28, fontWeight: 'bold', marginBottom: 10 },
  lockSubtitle: { fontSize: 16, textAlign: 'center', marginBottom: 30 },
  unlockBtn: { paddingVertical: 15, paddingHorizontal: 40, borderRadius: 30 },
  unlockText: { fontSize: 18, fontWeight: 'bold' },
});
