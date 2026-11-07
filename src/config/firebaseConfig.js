import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDy-4cKMs22jKxWZiSkf9I86JfdfqrwBng",
  authDomain: "konekta-premium.firebaseapp.com",
  projectId: "konekta-premium",
  storageBucket: "konekta-premium.firebasestorage.app",
  messagingSenderId: "232660950477",
  appId: "1:232660950477:web:f6ed7190c69f14c62df884"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Exportar servicios
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
