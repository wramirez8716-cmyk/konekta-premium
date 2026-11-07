import React from 'react';
import { StatusBar } from 'expo-status-bar';
import AuthScreen from './app/auth/index';

export default function App() {
  return (
    <>
      <AuthScreen />
      <StatusBar style="light" />
    </>
  );
}
