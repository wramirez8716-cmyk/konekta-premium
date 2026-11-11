import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Switch, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { signOut } from 'firebase/auth';
import { auth } from '../../src/config/firebaseConfig';
import { useTheme } from '../../src/context/ThemeContext';

export default function ProfileScreen({ onBack, currentUser, biometricEnabled, setBiometricEnabled }) {
  const { theme } = useTheme();
  const [isEnabled, setIsEnabled] = useState(biometricEnabled);

  const toggleSwitch = async (value) => {
    setIsEnabled(value);
    setBiometricEnabled(value);
    await AsyncStorage.setItem('biometricEnabled', value.toString());
    Alert.alert(
      'Configuración guardada',
      value ? 'Se pedirá huella digital al abrir la app.' : 'La app se abrirá directamente.'
    );
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // Opcional: limpiar la preferencia al cerrar sesión
      // await AsyncStorage.removeItem('biometricEnabled');
    } catch (error) {
      Alert.alert('Error', 'No se pudo cerrar sesión');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header Profesional */}
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={{ fontSize: 24, color: theme.primary }}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Ajustes</Text>
        <View style={{ width: 40 }} /> 
      </View>

      {/* Contenido del Perfil */}
      <View style={styles.content}>
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <Text style={[styles.userName, { color: theme.text }]}>
            {currentUser?.email || 'Usuario'}
          </Text>
          <Text style={[styles.userEmail, { color: theme.textSecondary }]}>
            Cuenta Premium Activa
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: theme.surface, marginTop: 20 }]}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: theme.text }]}>Bloqueo con Huella</Text>
              <Text style={[styles.settingDesc, { color: theme.textSecondary }]}>
                Protege el acceso a la aplicación
              </Text>
            </View>
            <Switch
              trackColor={{ false: '#767577', true: theme.primary + '60' }}
              thumbColor={isEnabled ? theme.primary : '#f4f3f4'}
              ios_backgroundColor="#3e3e3e"
              onValueChange={toggleSwitch}
              value={isEnabled}
            />
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.logoutBtn, { backgroundColor: '#ff5252' }]} 
          onPress={handleLogout}
        >
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, paddingTop: 50, borderBottomWidth: 1 },
  backButton: { padding: 10 },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  content: { padding: 20 },
  card: { padding: 20, borderRadius: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  userName: { fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
  userEmail: { fontSize: 14 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  settingInfo: { flex: 1, marginRight: 15 },
  settingTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  settingDesc: { fontSize: 13 },
  logoutBtn: { marginTop: 40, padding: 18, borderRadius: 12, alignItems: 'center' },
  logoutText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
