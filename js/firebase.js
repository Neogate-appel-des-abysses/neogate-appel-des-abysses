import{initializeApp}from"https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import{getDatabase,ref,get,set}from"https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
const firebaseConfig={apiKey:"AIzaSyDtIVe0n5-8t4p-QKKWwVKtzvZust8VbbE",authDomain:"base-de-donnee-neogate.firebaseapp.com",databaseURL:"https://base-de-donnee-neogate-default-rtdb.europe-west1.firebasedatabase.app",projectId:"base-de-donnee-neogate",storageBucket:"base-de-donnee-neogate.firebasestorage.app",messagingSenderId:"855513667145",appId:"1:855513667145:web:8ddda36260c5d8bf4ad198"};
const app=initializeApp(firebaseConfig);const db=getDatabase(app);
export async function readCounter(name){const s=await get(ref(db,name));return s.val()||0}
export async function setCounter(name,value){await set(ref(db,name),value)}
export async function incrementCounter(name){const v=await readCounter(name);await setCounter(name,v+1);return v+1}
