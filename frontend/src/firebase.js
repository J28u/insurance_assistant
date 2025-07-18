// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAawLYrxP4ANSmZXF2CIRG3XB-MKF1d8ZQ",
  authDomain: "insurance-assistant-42c33.firebaseapp.com",
  projectId: "insurance-assistant-42c33",
  storageBucket: "insurance-assistant-42c33.firebasestorage.app",
  messagingSenderId: "129288485042",
  appId: "1:129288485042:web:4d0e7552db94f2cd55f1ab",
  measurementId: "G-1CEZ8B8EDK",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export default app;
