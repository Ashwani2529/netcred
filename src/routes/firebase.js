import { initializeApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"
const firebaseApp = initializeApp({
    apiKey: "AIzaSyCv_UsUIQS0fO0lnR--pRhZish2f0bR1eM",
    authDomain: "netcredential.firebaseapp.com",
    databaseURL: "https://netcredential.firebaseio.com",
    projectId: "netcredential",
    storageBucket: "netcredential.appspot.com",
    messagingSenderId: "931548393787",
    appId: "1:931548393787:web:9292befa0f9f5c6ab4c71e",
    measurementId: "G-PN3JJ7DZH4"
});

export const db = getFirestore();