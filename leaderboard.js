// ==================== LEADERBOARD HELPERS ====================
    // Week key — Monday se Sunday (ISO week)
    function getCurrentWeekKey() {
      const now = new Date();
      const day = now.getDay(); // 0=Sun
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
      const monday = new Date(now.setDate(diff));
      return monday.toISOString().split('T')[0]; // YYYY-MM-DD
    }

    // Week end time (Sunday 23:59:59)
    function getWeekEndTime() {
      const now = new Date();
      const day = now.getDay();
      const daysUntilSunday = day === 0 ? 0 : 7 - day;
      const sunday = new Date();
      sunday.setDate(sunday.getDate() + daysUntilSunday);
      sunday.setHours(23, 59, 59, 999);
      return sunday;
    }

    function formatCountdown(ms) {
      if (ms <= 0) return '00:00:00';
      const totalSec = Math.floor(ms / 1000);
      const d = Math.floor(totalSec / 86400);
      const h = Math.floor((totalSec % 86400) / 3600);
      const m = Math.floor((totalSec % 3600) / 60);
      const s = totalSec % 60;
      if (d > 0) return d + 'd ' + String(h).padStart(2,'0') + ':' + String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0');
      return String(h).padStart(2,'0') + ':' + String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0');
    }

    // Countdown ticker
    let _lbCountdownTicker = null;
    function startLbCountdown() {
      if (_lbCountdownTicker) return;
      _lbCountdownTicker = setInterval(() => {
        const el = document.getElementById('lb-countdown');
        if (!el) return;
        const remaining = getWeekEndTime() - Date.now();
        el.textContent = formatCountdown(remaining);
        if (remaining <= 0) {
          clearInterval(_lbCountdownTicker);
          _lbCountdownTicker = null;
          el.textContent = '🎉 Week Ended!';
          checkWeekWinners();
        }
      }, 1000);
    }

    // ==================== WEEK PRIZE DISTRIBUTION ====================
    // Yeh sirf admin ke browser se chalega — Firestore rules mein admin ko special write access dena hoga
    async function checkWeekWinners() {
      if (!window.currentUser) return;
      try {
        const colRef = window.fbCollection(window.fbDb, 'users');
        const snap = await window.fbGetDocs(colRef);
        const entries = [];
        snap.forEach(d => {
          const data = d.data();
          if ((data.adWatchCount || 0) > 0) {
            entries.push({ uid: d.id, name: data.displayName || 'User', count: data.adWatchCount || 0 });
          }
        });
        entries.sort((a, b) => b.count - a.count);
        const myUid = window.currentUser.uid;
        const myIdx = entries.findIndex(e => e.uid === myUid);

        // Agar admin login hai — prizes do
        if (adminUnlocked && entries.length > 0) {
          await distributePrizes(entries);
        }

        // Sirf current user ka notification
        if (myIdx === 0) showToast('🥇 Aap #1 hain! Prize processing... 👑', 'green');
        else if (myIdx === 1) showToast('🥈 Aap #2 hain! Prize processing... 💰', 'green');
        else if (myIdx === 2) showToast('🥉 Aap #3 hain! Prize processing... 🪙', 'green');
      } catch(e) {
        console.error('Week check error:', e);
      }
    }

    // Admin ke browser se prizes distribute karo
    async function distributePrizes(entries) {
      const weekKey = getCurrentWeekKey();
      const prizeWeekField = 'prizeGiven_' + weekKey;

      for (let i = 0; i < Math.min(entries.length, 3); i++) {
        const winner = entries[i];
        const userRef = window.fbDoc(window.fbDb, 'users', winner.uid);

        // Check karo is week prize already diya ya nahi
        const snap = await window.fbGetDoc(userRef);
        if (snap.exists() && snap.data()[prizeWeekField]) continue; // Already diya

        try {
          if (i === 0) {
            // 1st: 1 Month VIP
            const now = new Date();
            const end = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
            await window.fbSetDoc(userRef, {
              vip: { plan: 'vip-1m', startDate: now.toISOString(), endDate: end.toISOString() },
              [prizeWeekField]: '1st-vip-1m',
              prizeNotify: '🥇 Aapne 1st prize jeeta! 1 Month VIP active ho gaya! 👑'
            }, { merge: true });
            console.log('✅ 1st prize given to:', winner.name);

          } else if (i === 1) {
            // 2nd: 1000 credits
            const cur = snap.exists() ? (snap.data().credits || 0) : 0;
            await window.fbSetDoc(userRef, {
              credits: cur + 1000,
              [prizeWeekField]: '2nd-1000-credits',
              prizeNotify: '🥈 Aapne 2nd prize jeeta! +1000 Credits mile! 💰'
            }, { merge: true });
            console.log('✅ 2nd prize given to:', winner.name);

          } else if (i === 2) {
            // 3rd: 500 credits
            const cur = snap.exists() ? (snap.data().credits || 0) : 0;
            await window.fbSetDoc(userRef, {
              credits: cur + 500,
              [prizeWeekField]: '3rd-500-credits',
              prizeNotify: '🥉 Aapne 3rd prize jeeta! +500 Credits mile! 🪙'
            }, { merge: true });
            console.log('✅ 3rd prize given to:', winner.name);
          }
        } catch(e) {
          console.error('Prize error for', winner.name, e);
        }
      }
      showToast('✅ Prizes distribute ho gaye!', 'green');
    }

    // ===== ATOMIC AD COUNT — race condition free =====
    async function atomicAdCount() {
      if (!window.currentUser) return;
      try {
        const userRef = window.fbDoc(window.fbDb, 'users', window.currentUser.uid);
        await window.fbSetDoc(userRef, {
          adWatchCount: window.fbIncrement(1),
          weekKey: getCurrentWeekKey(),
          displayName: window.currentUser.displayName || '',
          photoURL: window.currentUser.photoURL || '',
          email: window.currentUser.email || '',
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch(e) {
        console.error('atomicAdCount err:', e);
      }
    }

    async function loadLeaderboard() {
      const listEl = document.getElementById('lb-list');
      const myRankCard = document.getElementById('lb-my-rank-card');
      if (!listEl) return;
      listEl.innerHTML = '<div class="lb-empty"><div class="loader" style="width:28px;height:28px;"></div></div>';
      try {
        const colRef = window.fbCollection(window.fbDb, 'users');
        const snap = await window.fbGetDocs(colRef);
        const entries = [];

        snap.forEach(doc => {
          const d = doc.data();
          // Sabhi registered users dikhao — adWatchCount 0 wale bhi
          if (d.displayName || d.email) {
            entries.push({
              uid: doc.id,
              name: d.displayName || 'Anonymous',
              photoURL: d.photoURL || '',
              count: d.adWatchCount || 0
            });
          }
        });

        // Ad count ke hisaab se sort
        entries.sort((a, b) => b.count - a.count);
        const top100 = entries.slice(0, 100);

        // Mera rank dikhao
        const myUid = window.currentUser ? window.currentUser.uid : null;
        const myIdx = myUid ? entries.findIndex(e => e.uid === myUid) : -1;
        if (myRankCard) {
          if (myIdx >= 0) {
            myRankCard.style.display = 'block';
            document.getElementById('lb-my-rank-num').textContent = '#' + (myIdx + 1);
            document.getElementById('lb-my-ad-count').textContent = entries[myIdx].count;
          } else if (adWatchCount > 0) {
            myRankCard.style.display = 'block';
            document.getElementById('lb-my-rank-num').textContent = '#' + (entries.length + 1);
            document.getElementById('lb-my-ad-count').textContent = adWatchCount;
          } else {
            myRankCard.style.display = 'none';
          }
        }

        if (!top100.length) {
          listEl.innerHTML = '<div class="lb-empty">📭 Abhi koi user nahi — login karo aur credits kamao!</div>';
          return;
        }

        const rankEmoji = ['🥇','🥈','🥉'];
        listEl.innerHTML = top100.map((e, i) => {
          const rank = i + 1;
          const isMe = myUid && e.uid === myUid;
          const rankClass = rank <= 3 ? 'rank-' + rank : '';
          const meClass = isMe ? 'lb-me' : '';
          const rankDisplay = rank <= 3
            ? `<span style="font-size:20px;">${rankEmoji[i]}</span>`
            : `<span class="lb-rank" style="color:${rank<=10?'var(--gold)':'rgba(255,255,255,0.35)'}">#${rank}</span>`;
          const avatarHTML = e.photoURL
            ? `<img src="${e.photoURL}" alt="" onerror="this.parentElement.textContent='👤'">`
            : '👤';
          // Prize tag top 3 ke liye
          const prizeTag = rank === 1
            ? `<span style="font-size:9px;background:rgba(255,215,0,0.15);border:1px solid rgba(255,215,0,0.4);color:var(--gold);padding:2px 7px;border-radius:20px;font-family:'Orbitron',sans-serif;letter-spacing:1px;">👑 VIP 1M</span>`
            : rank === 2
            ? `<span style="font-size:9px;background:rgba(192,192,192,0.1);border:1px solid rgba(192,192,192,0.3);color:#C0C0C0;padding:2px 7px;border-radius:20px;font-family:'Orbitron',sans-serif;letter-spacing:1px;">+1000 🪙</span>`
            : rank === 3
            ? `<span style="font-size:9px;background:rgba(205,127,50,0.1);border:1px solid rgba(205,127,50,0.3);color:#CD7F32;padding:2px 7px;border-radius:20px;font-family:'Orbitron',sans-serif;letter-spacing:1px;">+500 🪙</span>`
            : '';
          return `<div class="lb-item ${rankClass} ${meClass}">
            ${rankDisplay}
            <div class="lb-avatar">${avatarHTML}</div>
            <div class="lb-info">
              <div class="lb-name">${escapeHtml(e.name)}${isMe ? ' <span style="font-size:10px;color:var(--neon);">(You)</span>' : ''}</div>
              <div style="margin-top:3px;">${prizeTag}</div>
            </div>
            <div style="text-align:right;flex-shrink:0;">
              <div class="lb-count">${e.count}</div>
              <div style="font-size:9px;color:rgba(255,255,255,0.3);letter-spacing:1px;">ADS</div>
            </div>
          </div>`;
        }).join('');

      } catch(e) {
        listEl.innerHTML = '<div class="lb-empty">⚠️ Load error. Retry karo.</div>';
        console.error('Leaderboard error:', e);
      }
    }

    // Server state - Firestore se aata hai, localStorage pe depend nahi
    let serverState = {
      lastLogin: '',
      lastShare: '',
      lastAdClaim: '',
      usedCodes: [],
      instaFollowed: false,
      tgJoined: false
    };

    // ==================== LOAD SAVED ====================
    try { results = JSON.parse(localStorage.getItem('nx_results') || '{}'); } catch(e) {}
    try { notifLog = JSON.parse(localStorage.getItem('nx_notifs') || '[]'); } catch(e) {}
    try { confFilter = parseInt(localStorage.getItem('nx_conf') || '0'); } catch(e) {}
    // Credits loaded from Firestore only - localStorage not trusted
    credits = 0;
    try { transactions = JSON.parse(localStorage.getItem('nx_txns') || '[]'); } catch(e) {}
    try { unlockedCards = new Set(JSON.parse(localStorage.getItem('nx_unlocked') || '[]')); } catch(e) {}
    try { predictionsRunning = JSON.parse(localStorage.getItem('nx_pred_running') !== null ? localStorage.getItem('nx_pred_running') : 'true'); } catch(e) {}
    try { lastAdTime = parseInt(localStorage.getItem('nx_last_ad') || '0'); } catch(e) {}
    try {
      const s = JSON.parse(localStorage.getItem('nx_settings') || '{}');
      if (s.sound !== undefined) document.getElementById('toggle-sound').checked = s.sound;
      if (s.notif !== undefined) document.getElementById('toggle-notif').checked = s.notif;
    } catch(e) {}

    if (confFilter > 0) {
      document.querySelectorAll('.conf-chip').forEach(c => {
        c.classList.remove('active');
        if (c.textContent === confFilter+'%+') c.classList.add('active');
      });
    }
