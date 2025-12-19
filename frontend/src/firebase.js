import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBxDu85A1Dnhr2jPVFWl92rW5tgVwZWfrc",
  authDomain: "ipl-mock-auction-1ee30.firebaseapp.com",
  databaseURL: "https://ipl-mock-auction-1ee30-default-rtdb.firebaseio.com",
  projectId: "ipl-mock-auction-1ee30",
  storageBucket: "ipl-mock-auction-1ee30.firebasestorage.app",
  messagingSenderId: "43038768018",
  appId: "1:43038768018:web:3fc4770c2af41cb1199f4b"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);

