
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyD1Kt-ekPfx89U6Rph3_-jc6Fz6TzBHwWo",
  authDomain: "pantrynote-41ad9.firebaseapp.com",
  projectId: "pantrynote-41ad9",
  storageBucket: "pantrynote-41ad9.firebasestorage.app",
  messagingSenderId: "84142387057",
  appId: "1:84142387057:web:610814f2032c5db0ed50d0",
  measurementId: "G-TRX88B3RMN"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);

// 匿名認証
export async function initializeAuth() {
  if (auth.currentUser) {
    return auth.currentUser;
  }

  const result = await signInAnonymously(auth);
  return result.user;
}
