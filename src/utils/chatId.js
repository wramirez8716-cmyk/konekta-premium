import CryptoJS from 'crypto-js';

// Genera un ID único para el chat entre dos usuarios
// Siempre da el mismo resultado sin importar el orden de los UIDs
export const getChatId = (uid1, uid2) => {
  const sorted = [uid1, uid2].sort();
  const combined = sorted.join('_');
  return CryptoJS.SHA256(combined).toString();
};
