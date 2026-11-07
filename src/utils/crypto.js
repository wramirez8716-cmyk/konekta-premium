import CryptoJS from 'crypto-js';

// Clave secreta para cifrar (en producción vendría de un servidor seguro)
const SECRET_KEY = 'konekta-premium-2026-secret-key';

// Cifrar un mensaje
export const encryptMessage = (text) => {
  return CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
};

// Descifrar un mensaje
export const decryptMessage = (cipherText) => {
  try {
    const bytes = CryptoJS.AES.decrypt(cipherText, SECRET_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    return '[Mensaje cifrado]';
  }
};
