// code for the javascript

// Import the functions you need from the SDKs you need
// Mengimpor fungsi yang dibutuhkan dari Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js";
// Catatan: getAnalytics tidak diperlukan untuk fungsi ini, jadi bisa diabaikan.

// Your web app's Firebase configuration
// Konfigurasi Firebase untuk aplikasi web Anda
const firebaseConfig = {
  apiKey: "AIzaSyDeCrbgFf6M_fl22DYnawUNY_yDqbkQWy4",
  authDomain: "dump-wall-e-tipes.firebaseapp.com",
  databaseURL: "https://dump-wall-e-tipes-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "dump-wall-e-tipes",
  storageBucket: "dump-wall-e-tipes.appspot.com",
  messagingSenderId: "1051766967584",
  appId: "1:1051766967584:web:b4addd978f7810b9c15b45",
  measurementId: "G-M2QB9XXGZJ"
};

// Initialize Firebase
// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);
// Dapatkan referensi ke Realtime Database
const database = getDatabase(app);

// --- KODE UNTUK MERESPON DAN MENGUPDATE UI ---

// Pastikan skrip berjalan setelah seluruh dokumen HTML dimuat
document.addEventListener('DOMContentLoaded', () => {

  // Dapatkan referensi ke elemen div indikator di dalam kartu utama
  // Catatan: Berdasarkan HTML Anda, kelasnya adalah 'light-indicator', bukan 'light-indicator'.
  const statusIndicator = document.querySelector('.trash-card .light-indicator');

  if (!statusIndicator) {
    console.error("Elemen '.light-indicator' tidak ditemukan di dalam '.trash-card'. Pastikan kelas HTML sudah benar.");
    return;
  }

  // Tentukan path di database yang akan didengarkan
  const trashStatusRef = ref(database, 'trash/01/status');

  // Fungsi ini akan berjalan setiap kali ada data baru di path tersebut
  onValue(trashStatusRef, (snapshot) => {
    const status = snapshot.val();
    console.log("Status baru diterima dari Firebase:", status);

    // 1. Hapus semua kelas warna dan animasi sebelumnya untuk me-reset
    statusIndicator.className = 'light-indicator';

    // 2. Tambahkan kelas yang sesuai berdasarkan status yang diterima
    switch (status) {
      case 'green':
        // Jika LED hijau
        statusIndicator.classList.add('green');
        break;
      case 'yellow_blink':
        // Jika LED kuning blip
        statusIndicator.classList.add('yellow', 'blink');
        break;
      case 'red_blink':
        // Jika LED Merah blip
        statusIndicator.classList.add('red', 'blink');
        break;
      case 'red':
        // Jika LED Merah full
        statusIndicator.classList.add('red');
        break;
      default:
        console.warn("Status tidak dikenal:", status);
        // Anda bisa menambahkan kelas default jika status tidak dikenali, misalnya abu-abu
        // statusIndicator.classList.add('grey'); 
        break;
    }
  });

});