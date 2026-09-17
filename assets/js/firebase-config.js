// Firebase web configuration for the Tanmoy Sarkar portfolio.
// Firebase web API keys identify the project; access is enforced by Authentication and Firestore Rules.
const firebaseConfig = {
  apiKey: "AIzaSyCK7ieIkysJ0EoLN_yiKA21GJiAfSrICyg",
  authDomain: "tanmoy-sarkar.firebaseapp.com",
  projectId: "tanmoy-sarkar",
  storageBucket: "tanmoy-sarkar.firebasestorage.app",
  messagingSenderId: "858747575931",
  appId: "1:858747575931:web:b5f68324446dee3704ccde"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

window.TS_FIREBASE = {
  auth: firebase.auth(),
  db: firebase.firestore(),
  contentRef: firebase.firestore().collection("siteContent").doc("main")
};
