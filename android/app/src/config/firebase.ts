import { initializeApp } from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCvbCVPirFvUUoRayiXbEb0SOHS3VG7Uuk",
  authDomain: "disastour-88531.firebaseapp.com",
  projectId: "disastour-88531",
  storageBucket: "disastour-88531.firebasestorage.app",
  messagingSenderId: "705321789332",
  appId: "1:705321789332:web:8e7eb7baa1fdb876abd181",
  measurementId: "G-LFW9DX3X3E"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Enable offline persistence (optional but recommended)
firestore().settings({
  persistence: true,
});

export { auth, firestore, storage };
export default app;