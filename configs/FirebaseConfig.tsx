// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {
  getAuth,
  initializeAuth,
  //@ts-ignore
  getReactNativePersistence,
} from "firebase/auth";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAIa7Qv_ODZsdLMP5hJ2QJQIPz4y2KduMA",
  authDomain: "univercity-event-app.firebaseapp.com",
  projectId: "univercity-event-app",
  storageBucket: "univercity-event-app.firebasestorage.app",
  messagingSenderId: "46603945998",
  appId: "1:46603945998:web:f155b00f8a61294b96945f",
  measurementId: "G-G7WX9WLDN1",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});
//const analytics = getAnalytics(app);
