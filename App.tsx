import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './src/config/firebaseConfig';
import './src/utils/cryptoPolyfill';
import AuthScreen from './app/auth/index';
import ChatListScreen from './app/chat/List';
import PrivateChatScreen from './app/chat/Private';
import ContactsScreen from './app/contacts/index';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentScreen, setCurrentScreen] = useState('chatList');
  const [selectedChat, setSelectedChat] = useState({ uid: null, name: '' });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (!currentUser) setCurrentScreen('chatList');
    });
    return unsubscribe;
  }, []);

  if (loading) return null;
  if (!user) return <AuthScreen />;

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
      <StatusBar style="light" />
    </>
  );
}
