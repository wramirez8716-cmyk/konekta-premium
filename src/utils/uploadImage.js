import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebaseConfig';

export const uploadProfileImage = async (userId, imageUri) => {
  try {
    // Convertir la URI a blob
    const response = await fetch(imageUri);
    const blob = await response.blob();
    
    // Crear referencia en Firebase Storage
    const storageRef = ref(storage, `profile-images/${userId}`);
    
    // Subir la imagen
    await uploadBytes(storageRef, blob);
    
    // Obtener la URL de descarga
    const downloadURL = await getDownloadURL(storageRef);
    
    return downloadURL;
  } catch (error) {
    console.error('Error subiendo imagen:', error);
    return null;
  }
};
