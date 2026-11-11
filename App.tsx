import React, { useState, useEffect } from 'react';
import { StatusBar, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { onAuthStateChanged } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricError, setBiometricError] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (currentUser) {
        // Verificar si el usuario tiene activado el bloqueo
        const isLocked = await AsyncStorage.getItem('biometricEnabled');
        setBiometricEnabled(isLocked === 'true');
        
        if (isLocked === 'true') {
          checkBiometrics(); // Pedir huella si está activado
        } else {
          setIsAuthenticated(true); // Entrar directo si NO está activado
        }
      } else {
        setIsAuthenticated(false);
        setCurrentScreen('chatList');
      }
    });
    return unsubscribe;
  }, []);

  const checkBiometrics = async () => {
    setBiometricError('');
    const result = await authenticateWithBiometrics();
    if (result.success) {
      setIsAuthenticated(true);
    } else {
      setBiometricError(result.message || 'No se pudo verificar la identidad');
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (!user) return <AuthScreen />;

  if (biometricEnabled && !isAuthenticated) {
    return (
      <View style={[styles.lockScreen, { backgroundColor: theme.background }]}>
        <View style={[styles.lockCircle, { backgroundColor: theme.primary + '20' }]}>
          <Text style={styles.lockIcon}>🔒</Text>
        </View>
        <Text style={[styles.lockTitle, { color: theme.text }]}>Konekta Premium</Text>
        <Text style={[styles.lockSubtitle, { color: theme.textSecondary }]}>
          Verifica tu identidad para continuar
        </Text>
        {biometricError ? (
          <Text style={[styles.errorText, { color: '#ff5252' }]}>{biometricError}</Text>
        ) : null}
        <TouchableOpacity 
          style={[styles.unlockBtn, { backgroundColor: theme.primary }]} 
          onPress={checkBiometrics}
          activeOpacity={0.8}
        >
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
          onNavigateContacts={() => setCurrentScreen('contacts')}
          onNavigateProfile={() => setCurrentScreen('profile')}
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
          onBack={() => setCurrentScreen('chatList')}
          onOpenPrivateChat={openPrivateChat}
          currentUser={user}
        />
      )}
      {currentScreen === 'profile' && (
        <ProfileScreen 
          onBack={() => setCurrentScreen('chatList')} 
          currentUser={user}
          biometricEnabled={biometricEnabled}
          setBiometricEnabled={setBiometricEnabled}
        />
      )}
      <StatusBar barStyle="light-content" backgroundColor={theme.background} />
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
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  lockScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
  lockCircle: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 30 },
  lockIcon: { fontSize: 50 },
  lockTitle: { fontSize: 32, fontWeight: '800', marginBottom: 10, letterSpacing: 1 },
  lockSubtitle: { fontSize: 16, textAlign: 'center', marginBottom: 40, lineHeight: 22 },
  errorText: { fontSize: 14, marginBottom: 20, textAlign: 'center' },
  unlockBtn: { paddingVertical: 18, paddingHorizontal: 50, borderRadius: 30, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 5 },
  unlockText: { fontSize: 18, fontWeight: 'bold', letterSpacing: 0.5 },
});
