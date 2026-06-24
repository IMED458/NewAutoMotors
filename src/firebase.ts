import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyAkKUokKmzlOQGtke7YWYvhXEONlluVJ58',
  authDomain: 'newautomotors-e6ee3.firebaseapp.com',
  projectId: 'newautomotors-e6ee3',
  storageBucket: 'newautomotors-e6ee3.firebasestorage.app',
  messagingSenderId: '548400584874',
  appId: '1:548400584874:web:0d7e4820ebcc72101118d3',
  measurementId: 'G-2VHSFCKNSE',
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
