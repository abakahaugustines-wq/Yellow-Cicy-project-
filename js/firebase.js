import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";


import {
    getFirestore
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


import {
    getAuth
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";


import {
    getStorage
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-storage.js";


// =====================================================
// FIREBASE CONFIG
// =====================================================

const firebaseConfig = {

    apiKey:
        "AIzaSyDL1ceMycRzMgXMcIyZ6mgjzpLpsEd4Flc",

    authDomain:
        "yellow-cicy.firebaseapp.com",

    projectId:
        "yellow-cicy",

    storageBucket:
        "yellow-cicy.firebasestorage.app",

    messagingSenderId:
        "638250349686",

    appId:
        "1:638250349686:web:03b204634e1db560059b57"

};


// =====================================================
// INITIALIZE FIREBASE
// =====================================================

const app =
    initializeApp(firebaseConfig);


// =====================================================
// FIRESTORE
// =====================================================

const db =
    getFirestore(app);


// =====================================================
// AUTHENTICATION
// =====================================================

const auth =
    getAuth(app);


// =====================================================
// STORAGE
// =====================================================

const storage =
    getStorage(app);


// =====================================================
// EXPORT
// =====================================================

export {
    app,
    db,
    auth,
    storage
};
