// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB5N7MqOYEjKJZ_IVZ3ThKjt4aBmYtR60c",
  authDomain: "share-pai.firebaseapp.com",
  projectId: "share-pai",
  storageBucket: "share-pai.appspot.com",
  messagingSenderId: "917351260903",
  appId: "1:917351260903:web:ad94b56113adfd47dd7842",
  measurementId: "G-78M0ZRKDVS",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const storage = firebase.storage();
