// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCG055-SUa5OBXcewq44hLH9_vlgpGdr4c",
  authDomain: "itse-laptopshop-manageme-f73cd.firebaseapp.com",
  projectId: "itse-laptopshop-manageme-f73cd",
  storageBucket: "itse-laptopshop-manageme-f73cd.firebasestorage.app",
  messagingSenderId: "911829055483",
  appId: "1:911829055483:web:7cb26a90d05cc37f06fd5e",
  measurementId: "G-Z95TK1SG4V",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
