import CryptoJS from 'crypto-js';

// Clave secreta fija para cifrado (en producción usar una mejor)
const SECRET_KEY = 'konekta-premium-secret-key-2026';

// Cifrar un mensaje
export const encryptMessage = (text) => {
  try {
    return CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
  } catch (error) {
    console.error('Error cifrando:', error);
    return text; // Si falla, devolver sin cifrar
  }
};

// Descifrar un mensaje
export const decryptMessage = (cipherText) => {
  try {
    const bytes = CryptoJS.AES.decrypt(cipherText, SECRET_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return decrypted || cipherText;
  } catch (error) {
    console.error('Error descifrando:', error);
    return cipherText; // Si falla, devolver el texto original
  }
};
