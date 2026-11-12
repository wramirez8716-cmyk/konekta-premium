import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Switch, Alert, Image, ScrollView, Share } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { signOut } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../src/config/firebaseConfig';
import { useTheme, THEMES } from '../../src/context/ThemeContext';
import { uploadImageToCloudinary } from '../../src/utils/cloudinary';

// ⚠️ IMPORTANTE: Reemplaza este link con el enlace público de tu APK (Drive, GitHub Releases, etc.)
const APK_DOWNLOAD_LINK = 'https://github.com/wramirez8716-cmyk/konekta-premium/releases/download/V1.0.0/application-14bdc0fe-8e47-48ec-ba56-bbf0dc5c9ffe.apk'; 

export default function ProfileScreen({ onBack, currentUser, biometricEnabled, setBiometricEnabled }) {
  const { theme, themeColor, changeTheme } = useTheme();
  const [isEnabled, setIsEnabled] = useState(biometricEnabled);
  const [photoURL, setPhotoURL] = useState(currentUser?.photoURL || null);
  const [uploading, setUploading] = useState(false);

  const toggleSwitch = async (value) => {
    setIsEnabled(value);
    setBiometricEnabled(value);
    await AsyncStorage.setItem('biometricEnabled', value.toString());
    Alert.alert('Configuración guardada', value ? 'Se pedirá huella digital al abrir la app.' : 'La app se abrirá directamente.');
  };

  const pickAndUploadImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setUploading(true);
      try {
        const imageUrl = await uploadImageToCloudinary(result.assets[0].uri);
        await updateDoc(doc(db, 'users', currentUser.uid), { photoURL: imageUrl });
        setPhotoURL(imageUrl);
        Alert.alert('Éxito', 'Foto de perfil actualizada');
      } catch (error) {
        Alert.alert('Error', 'No se pudo subir la imagen');
      } finally {
        setUploading(false);
      }
    }
  };

  const handleInvite = async () => {
    try {
      await Share.share({
        message: `¡Hola! Te invito a usar Konekta Premium, mi app de chat segura y personalizable. Descárgala aquí: ${APK_DOWNLOAD_LINK}`,
        title: 'Invitación a Konekta Premium'
      });
    } catch (error) {
      Alert.alert('Error', 'No se pudo compartir la invitación');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      Alert.alert('Error', 'No se pudo cerrar sesión');
    }
  };

  const renderColorOption = (colorKey, colorValue) => (
    <TouchableOpacity
      key={colorKey}
      style={[
        styles.colorOption,
        { backgroundColor: colorValue.primary },
        themeColor === colorKey && styles.colorOptionSelected
      ]}
      onPress={() => changeTheme(colorKey)}
    >
      {themeColor === colorKey && <Text style={styles.checkMark}>✓</Text>}
    </TouchableOpacity>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border || '#333' }]}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={{ fontSize: 24, color: theme.primary }}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Ajustes</Text>
        <View style={{ width: 40 }} /> 
      </View>

      <View style={styles.content}>
        <View style={[styles.card, { backgroundColor: theme.surface, alignItems: 'center', padding: 30 }]}>
          <TouchableOpacity onPress={pickAndUploadImage} disabled={uploading}>
            {photoURL ? (
              <Image source={{ uri: photoURL }} style={styles.profileImage} />
            ) : (
              <View style={[styles.profilePlaceholder, { backgroundColor: theme.primary }]}>
                <Text style={[styles.profileText, { color: theme.background }]}>
                  {currentUser?.email?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
            )}
            <Text style={[styles.changePhotoText, { color: theme.primary }]}>
              {uploading ? 'Subiendo...' : 'Cambiar foto'}
            </Text>
          </TouchableOpacity>
          <Text style={[styles.userEmail, { color: theme.textSecondary, marginTop: 10 }]}>
            {currentUser?.email}
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: theme.surface, marginTop: 20 }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Color del Tema</Text>
          <View style={styles.colorContainer}>
            {Object.entries(THEMES).map(([key, value]) => renderColorOption(key, value))}
          </View>
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

        {/* Botón Invitar */}
        <TouchableOpacity 
          style={[styles.inviteBtn, { backgroundColor: theme.primary }]} 
          onPress={handleInvite}
          activeOpacity={0.8}
        >
          <Text style={[styles.inviteText, { color: theme.background }]}>📩 Invitar a un amigo</Text>
        </TouchableOpacity>

        {/* Botón Cerrar Sesión */}
        <TouchableOpacity 
          style={[styles.logoutBtn, { backgroundColor: '#ff5252' }]} 
          onPress={handleLogout}
        >
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>
        
        <View style={{ height: 40 }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, paddingTop: 50, borderBottomWidth: 1 },
  backButton: { padding: 10 },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  content: { padding: 20 },
  card: { padding: 20, borderRadius: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  profileImage: { width: 100, height: 100, borderRadius: 50, marginBottom: 10 },
  profilePlaceholder: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  profileText: { fontSize: 40, fontWeight: 'bold' },
  changePhotoText: { fontSize: 14, fontWeight: 'bold', textAlign: 'center' },
  userEmail: { fontSize: 14, textAlign: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 15 },
  colorContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  colorOption: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginBottom: 10, borderWidth: 2, borderColor: 'transparent' },
  colorOptionSelected: { borderColor: '#ffffff', transform: [{ scale: 1.1 }] },
  checkMark: { color: '#ffffff', fontSize: 24, fontWeight: 'bold' },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  settingInfo: { flex: 1, marginRight: 15 },
  settingTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  settingDesc: { fontSize: 13 },
  inviteBtn: { marginTop: 20, padding: 18, borderRadius: 12, alignItems: 'center', marginBottom: 10 },
  inviteText: { fontSize: 16, fontWeight: 'bold' },
  logoutBtn: { padding: 18, borderRadius: 12, alignItems: 'center' },
  logoutText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
