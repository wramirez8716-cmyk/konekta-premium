import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './src/config/firebaseConfig';
import AuthScreen from './app/auth/index';
import ChatScreen from './app/chat/index';
import ContactsScreen from './app/contacts/index';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentScreen, setCurrentScreen] = useState('chat');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (!currentUser) setCurrentScreen('chat');
    });
    return unsubscribe;
  }, []);

  if (loading) return null;
  if (!user) return <AuthScreen />;

  return (
    <>
      {currentScreen === 'chat' ? (
        <ChatScreen onNavigateContacts={() => setCurrentScreen('contacts')} />
      ) : (
        <ContactsScreen onNavigateChat={() => setCurrentScreen('chat')} />
      )}
      <StatusBar style="light" />
    </>
  );
}
