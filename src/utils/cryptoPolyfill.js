import * as Crypto from 'expo-crypto';

// Polyfill para crypto.getRandomValues en Expo
if (typeof global.crypto === 'undefined') {
  global.crypto = {
    getRandomValues: function(buffer) {
      const array = new Uint8Array(buffer.length);
      for (let i = 0; i < buffer.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
      buffer.set(array);
      return buffer;
    },
    randomBytes: function(size) {
      const buffer = new Uint8Array(size);
      return global.crypto.getRandomValues(buffer);
    }
  };
}

export default global.crypto;
