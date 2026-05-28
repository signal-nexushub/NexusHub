// Firebase Config
    import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
    import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
    import { getFirestore, doc, getDoc, setDoc, updateDoc, increment, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

    const firebaseConfig = {
      apiKey: "AIzaSyC9c7Mnbeq_jiKxSJhvvpkF-MAEr32IRT0",
      authDomain: "nexushub-c3647.firebaseapp.com",
      projectId: "nexushub-c3647",
      storageBucket: "nexushub-c3647.firebasestorage.app",
      messagingSenderId: "787252674435",
      appId: "1:787252674435:web:9ee624e8455f2dff2140b6"
    };

    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);

    window.fbAuth = auth;
    window.fbDb = db;
    window.fbDoc = doc;
    window.fbGetDoc = getDoc;
    window.fbSetDoc = setDoc;
    window.fbUpdateDoc = updateDoc;
    window.fbIncrement = increment;
    window.fbCollection = collection;
    window.fbGetDocs = getDocs;
    window.fbGoogleProvider = new GoogleAuthProvider();
    window.fbSignInWithPopup = signInWithPopup;
    window.fbSignInWithRedirect = signInWithRedirect;
    window.fbGetRedirectResult = getRedirectResult;
    window.fbSignOut = signOut;
    window.fbOnAuthStateChanged = onAuthStateChanged;

    // Handle redirect result on page load
    getRedirectResult(auth).then(async (result) => {
      if (result && result.user) {
        window.currentUser = result.user;
        await window.onUserLoggedIn(result.user);
      }
    }).catch((e) => {
      console.error('Redirect error:', e);
    });

    // ===== INSTALL POPUP =====
    function showInstallPopup() {
      // PWA installed check - standalone mode mein hai toh nahi dikhao
      if (window.matchMedia('(display-mode: standalone)').matches ||
          window.navigator.standalone === true) return;

      // Is session mein pehle dismiss kiya tha toh nahi dikhao
      if (sessionStorage.getItem('nx_popup_dismissed')) return;

      // Splash hatne ke 1 sec baad dikhao
      setTimeout(() => {
        const popup = document.getElementById('install-popup');
        if (popup) popup.style.display = 'flex';
      }, 1000);
    }

    function dismissInstallPopup(installed) {
      const popup = document.getElementById('install-popup');
      if (!popup) return;
      // Sirf is baar ke liye band karo - session mein dobara nahi aayega
      sessionStorage.setItem('nx_popup_dismissed', 'true');
      popup.classList.add('hide');
      setTimeout(() => { popup.style.display = 'none'; popup.classList.remove('hide'); }, 350);
    }

    // Splash hide function
    function hideSplash() {
      const splash = document.getElementById('nx-splash');
      if (!splash || splash.classList.contains('hide')) return;
      const status = document.getElementById('splash-status');
      if (status) status.textContent = 'LOADING COMPLETE ✦';
      setTimeout(() => {
        splash.classList.add('hide');
        setTimeout(() => { if (splash.parentNode) splash.remove(); }, 700);
      }, 400);
      // Splash hatne ke baad install popup check karo
      setTimeout(showInstallPopup, 1500);
    }
    setTimeout(hideSplash, 8000); // Fallback

    // Auth state listener
    onAuthStateChanged(auth, async (user) => {
      setTimeout(hideSplash, 7000);
      if (user) {
        window.currentUser = user;
        await window.onUserLoggedIn(user);
      } else {
        window.currentUser = null;
        window.onUserLoggedOut();
      }
    });
