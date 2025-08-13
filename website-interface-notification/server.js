// code for the javascript

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDeCrbgFf6M_fl22DYnawUNY_yDqbkQWy4",
  authDomain: "dump-wall-e-tipes.firebaseapp.com",
  databaseURL: "https://dump-wall-e-tipes-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "dump-wall-e-tipes",
  storageBucket: "dump-wall-e-tipes.firebasestorage.app",
  messagingSenderId: "1051766967584",
  appId: "1:1051766967584:web:b4addd978f7810b9c15b45",
  measurementId: "G-M2QB9XXGZJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);