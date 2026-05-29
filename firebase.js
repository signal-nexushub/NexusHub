// ==================== FIREBASE AUTH & FIRESTORE ====================
    async function googleLogin() {
      const btn = document.getElementById('google-login-btn');
      const msg = document.getElementById('login-msg');
      btn.textContent = 'Signing in...';
      btn.disabled = true;
      try {
        await window.fbSignInWithPopup(window.fbAuth, window.fbGoogleProvider);
      } catch(e) {
        msg.style.display = 'block';
        msg.textContent = 'Login failed! Try again. (' + e.code + ')';
        btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg> Sign in with Google';
        btn.disabled = false;
      }
    }

    async function logoutUser() {
      await window.fbSignOut(window.fbAuth);
    }

    window.onUserLoggedIn = async function(user) {
      // Show main app, hide login
      document.getElementById('login-screen').style.display = 'none';
      document.getElementById('main-app').style.display = 'block';

      // Set user info in UI
      document.getElementById('user-name').textContent = user.displayName || 'User';
      document.getElementById('user-email').textContent = user.email || '';
      const avatar = document.getElementById('user-avatar');
      if (user.photoURL) { avatar.src = user.photoURL; avatar.style.display = 'block'; }

      // Load user data from Firestore
      await loadUserFromFirestore(user.uid);

      // Init app
      initAdmin();
      checkDailyBonus();
      fetchPredictions();
      setTimeout(longPoll, 2000);
      setInterval(() => fetchPredictions(true), 10000);
      // Week end check
      if (getWeekEndTime() - Date.now() < 0) checkWeekWinners();
    };

    window.onUserLoggedOut = function() {
      document.getElementById('login-screen').style.display = 'flex';
      document.getElementById('main-app').style.display = 'none';
    };

    async function loadUserFromFirestore(uid) {
      try {
        const userRef = window.fbDoc(window.fbDb, 'users', uid);
        const snap = await window.fbGetDoc(userRef);
        if (snap.exists()) {
          const data = snap.data();
          // Always use server value - localStorage is not trusted
          credits = data.credits ?? 0;
          transactions = data.transactions ?? [];
          results = data.results ?? {};
          const today = new Date().toDateString();
          // Server state mein store karo - yahi trusted source hai
          serverState.lastLogin = data.lastLogin || '';
          serverState.lastShare = data.lastShare || '';
          serverState.lastAdClaim = data.lastAdClaim || '';
          serverState.usedCodes = data.usedCodes || [];
          serverState.instaFollowed = data.instaFollowed || false;
          serverState.tgJoined = data.tgJoined || false;
          if (data.unlockedCards) unlockedCards = new Set(data.unlockedCards);
          spinTokens = data.spinTokens ?? 0;
          freeSpinUsed = data.freeSpinUsed ?? false;
          // Free spin pehli baar
          if (!freeSpinUsed) { spinTokens = Math.max(spinTokens, 1); }
          // AdWatchCount - week match karo
          const savedWeekKey = data.weekKey || '';
          const currentWK = getCurrentWeekKey();
          adWatchCount = (savedWeekKey === currentWK) ? (data.adWatchCount ?? 0) : 0;
          // VIP Pass load karo
          if (data.vip) {
            vipState.plan = data.vip.plan || '';
            vipState.startDate = data.vip.startDate || '';
            vipState.endDate = data.vip.endDate || '';
            checkVipExpiry();
          } else {
            vipState.active = false;
          }
          updateCreditUI();
          updateDailyBtnState();
          updateShareBtnState();
          updateAdBtnState();
          updateSpinUI();
          updateInstaBtnState();
          updateTgBtnState();
          updateVipBadgeUI();
          // Firestore load ke baad UI update karo — transactions fresh dikhenge
          updateCreditUI();
          // Prize notification check
          if (data.prizeNotify) {
            setTimeout(() => {
              showToast(data.prizeNotify, 'green');
              // Clear notification after showing
              window.fbSetDoc(window.fbDoc(window.fbDb, 'users', uid), { prizeNotify: null }, { merge: true }).catch(()=>{});
            }, 2000);
          }
        } else {
          // New user - give 5 credits + 1 free spin
          credits = 0;
          transactions = [];
          spinTokens = 1;
          freeSpinUsed = false;
          adWatchCount = 0;
          await saveToFirestore();
          _ac(0, '🎉 Welcome to Nexus Hub!');
        }
      } catch(e) {
        console.error('Firestore load error:', e);
        // Fallback - show 0, will retry
        credits = 0;
        showToast('Connection error - credits may not load', 'red');
      }
    }

    async function saveToFirestore() {
      if (!window.currentUser) return;
      try {
        const userRef = window.fbDoc(window.fbDb, 'users', window.currentUser.uid);
        // Server se current values padho - stale data se overwrite na ho
        const snap = await window.fbGetDoc(userRef);
        const serverAdCount = snap.exists() ? (snap.data().adWatchCount ?? 0) : 0;
        // adWatchCount sirf badhna chahiye — credits jo bhi local hai wahi sahi hai
        const safeAdCount = Math.max(adWatchCount, serverAdCount);
        await window.fbSetDoc(userRef, {
          credits: credits,
          transactions: transactions.slice(0, 50),
          results: results,
          lastLogin: serverState.lastLogin || '',
          lastShare: serverState.lastShare || '',
          lastAdClaim: serverState.lastAdClaim || '',
          usedCodes: serverState.usedCodes || [],
          instaFollowed: serverState.instaFollowed || false,
          tgJoined: serverState.tgJoined || false,
          unlockedCards: [...unlockedCards],
          spinTokens: spinTokens,
          freeSpinUsed: freeSpinUsed,
          adWatchCount: safeAdCount,
          vip: vipState.plan ? {
            plan: vipState.plan,
            startDate: vipState.startDate,
            endDate: vipState.endDate
          } : null,
          displayName: window.currentUser.displayName || '',
          email: window.currentUser.email || '',
          photoURL: window.currentUser.photoURL || '',
          weekKey: getCurrentWeekKey(),
          updatedAt: new Date().toISOString()
        }, { merge: true });
        // adWatchCount memory update karo
        adWatchCount = safeAdCount;
      } catch(e) {
        console.error('Firestore save error:', e);
      }
    }

    // ==================== CREDITS ====================
    function saveCredits() {
      saveToFirestore();
      updateCreditUI();
    }
