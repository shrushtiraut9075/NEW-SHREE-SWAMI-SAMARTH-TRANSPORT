import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';

export const firebaseConfig = {
  projectId: "sinuous-engine-pcb1c",
  appId: "1:608542557423:web:8c1cbb2e69be1aecbf471a",
  apiKey: "AIzaSyCLUXh5JjvlmeOSbI-ttDuFQbeo6tkvCPw",
  authDomain: "sinuous-engine-pcb1c.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-newshreeswamisam-b1959ea5-7e2d-4115-af8c-3b3bab4eb2de",
  storageBucket: "sinuous-engine-pcb1c.firebasestorage.app",
  messagingSenderId: "608542557423",
  measurementId: "",
  oAuthClientId: "608542557423-31t29kc45fm5dco78odtfj069sir7rar.apps.googleusercontent.com",
  recaptchaSiteKey: ""
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Please check your Firebase configuration or network status.");
    }
  }
}

testConnection();
