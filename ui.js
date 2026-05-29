// ==================== TOAST ====================
    function showToast(msg, type = '') {
      const t = document.getElementById('toast');
      t.textContent = msg;
      t.className = 'toast' + (type ? ' ' + type : '');
      t.classList.add('show');
      setTimeout(() => t.classList.remove('show'), 2800);
    }

    // ==================== ADMIN ====================
    function togglePredictions() {
      if (!predictionsRunning) {
        // Trying to START — need credits
        if (credits < 1) {
          showToast('Credit nahi hai! Ad dekho ya share karo 💸', 'red');
          setTab('credits');
          return;
        }
      }
      predictionsRunning = !predictionsRunning;
      localStorage.setItem('nx_pred_running', JSON.stringify(predictionsRunning));
      updateAdminUI();
      renderCards(allPredictions);
      showToast(predictionsRunning ? '▶ Predictions STARTED' : '⏹ Predictions STOPPED', predictionsRunning ? 'green' : 'red');
    }

    function checkCreditAutoStop() {
      if (vipState.active) return; // VIP users ke liye auto-stop nahi
      if (credits <= 0 && predictionsRunning) {
        predictionsRunning = false;
        localStorage.setItem('nx_pred_running', JSON.stringify(false));
        updateAdminUI();
        renderCards(allPredictions);
        showToast('Credit khatam! Predictions band ho gayi 💸', 'red');
      }
    }

    function updateAdminUI() {
      const btn = document.getElementById('start-stop-btn');
      const txt = document.getElementById('prediction-status-text');
      if (predictionsRunning) {
        btn.textContent = '⏹ STOP';
        btn.className = 'start-stop-btn running';
        txt.textContent = 'Predictions: Running ▶';
      } else {
        btn.textContent = '▶ START';
        btn.className = 'start-stop-btn stopped';
        txt.textContent = 'Predictions: Stopped ⏹';
      }
    }

    // ==================== SETTINGS ====================
    function saveSettings() {
      localStorage.setItem('nx_settings', JSON.stringify({
        sound: document.getElementById('toggle-sound').checked,
        notif: document.getElementById('toggle-notif').checked
      }));
    }

    function setConf(val, el) {
      confFilter = val;
      localStorage.setItem('nx_conf', val);
      document.querySelectorAll('.conf-chip').forEach(c => c.classList.remove('active'));
      el.classList.add('active');
      renderCards(allPredictions);
    }

    function setTab(tab) {
      currentTab = tab;
      document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      document.getElementById('page-' + tab).classList.add('active');
      const navEl = document.getElementById('nav-' + tab);
      if (navEl) navEl.classList.add('active');
      // Stats bar sirf signals page pe dikhe
      const statsBar = document.getElementById('main-stats-bar');
      if (statsBar) statsBar.style.display = (tab === 'signals') ? '' : 'none';
      if (tab === 'stats') { updateStats(); renderNotifLog(); }
      if (tab === 'alerts') renderNotifLog();
      if (tab === 'spin') { updateSpinUI(); setTimeout(initWheel, 50); }
      if (tab === 'credits') { updateCreditUI(); updateDailyBtnState(); updateShareBtnState(); updateVipBadgeUI(); }
      if (tab === 'vip') { syncVipPage(); }
      if (tab === 'leaderboard') {
        startLbCountdown();
        loadLeaderboard();
      }
    }

    function updateDailyBtnState() {
      const btn = document.getElementById('daily-earn-btn');
      if (btn) btn.disabled = (serverState.lastLogin === new Date().toDateString());
    }

    function updateAdBtnState() {
      const b1 = document.getElementById('ad-earn-btn');
      const b2 = document.getElementById('ad-header-btn');
      // Panel already open hai toh button state change mat karo
      const panelOpen = !!document.getElementById('ad-watch-panel');
      if (b1) { b1.disabled = panelOpen; b1.textContent = panelOpen ? '⏱ Ad chal raha hai...' : '▶ Watch Ad'; }
      if (b2) { b2.disabled = panelOpen; b2.textContent = panelOpen ? '⏱ Ad chal raha hai...' : '▶ Watch Ad'; }
    }

    // ==================== HELPERS ====================
    function formatTime(ts) {
      return new Date(ts * 1000).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    }

    function formatDate(ts) {
      const d = new Date(ts * 1000), today = new Date();
      if (d.toDateString() === today.toDateString()) return 'Today';
      const y = new Date(today); y.setDate(today.getDate()-1);
      if (d.toDateString() === y.toDateString()) return 'Yesterday';
      return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    }

    function autoDetectResult(text) {
      const t = text.toLowerCase();
      // Result message se detect karo
      const isResultMsg = t.includes('result');
      if (isResultMsg) {
        if (t.includes('agli baar') || t.includes('gli baar')) return 'auto-loss';
        if (t.includes('loss') || t.includes('l o s s') || t.includes('❌')) return 'auto-loss';
        if (t.includes('win') && !t.includes('wingo')) return 'auto-win';
        if (t.includes('✅')) return 'auto-win';
        return null;
      }
      return null;
    }

    // Ek prediction ka result fetch karo Telegram se - exist karta hai ya delete hua
    async function checkPredictionDeleted(msgId) {
      try {
        const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getMessages?chat_id=@${CHANNEL_USERNAME}&message_ids=${msgId}`);
        const data = await res.json();
        // Agar message exist nahi karta ya empty array aaya → deleted → LOSS
        if (data.ok && (!data.result || data.result.length === 0)) return true;
        return false;
      } catch(e) { return false; }
    }

    function extractPeriod(text) {
      // ...1187 ya period: 1187 format se period number nikalo
      const m = text.match(/\.\.\.?(\d+)/);
      if (m) return m[1];
      const m2 = text.match(/period[:\s]+[\.]*(\d+)/i);
      if (m2) return m2[1];
      return null;
    }

    function extractConfidence(text) {
      const m = text.match(/confidence[:\s]+(\d+)%/i) || text.match(/(\d+)%/);
      return m ? parseInt(m[1]) : 0;
    }

    function getSignal(text) {
      const t = text.toLowerCase();
      if (t.includes('big') || t.includes('🔴')) return 'hot';
      if (t.includes('small') || t.includes('🟢')) return 'safe';
      return 'active';
    }

    function signalHTML(type) {
      const map = { hot: ['signal-hot','🔥','HIGH SIGNAL'], safe: ['signal-safe','✅','SAFE ZONE'], active: ['signal-active','⚡','ACTIVE'] };
      const [cls, icon, label] = map[type] || map.active;
      return `<span class="signal-badge ${cls}">${icon} ${label}</span>`;
    }

    function isPromoMessage(text) {
      const t = text.toLowerCase();
      // Prediction message check — naye aur purane dono formats support karo
      const hasPeriod = t.includes('period') || t.includes('round') ||
                        /\.\.\.\d+/.test(t) || // ...1174 format
                        t.includes('wingo') || t.includes('win go') || t.includes('1m') || t.includes('5m') || t.includes('3m');
      const hasPrediction = t.includes('big') || t.includes('small') ||
                            t.includes('b i g') || t.includes('s m a l l') ||
                            t.includes('confidence') || t.includes('lucky');
      const isPrediction = hasPeriod && hasPrediction;
      // Result message check
      const isResult = t.includes('result') && (t.includes('period') || t.includes('number') ||
                       t.includes('colour') || t.includes('color') || t.includes('size') || /\.\.\.\d+/.test(t));
      return !isPrediction && !isResult;
    }

    function cleanPrediction(text) {
      const blocked = [
        'open game link','t.me','http','join now','join karo','telegram.me',
        'subscribe','channel join','free mein','earning','help desk','vip tips',
        'daily free','win rate','latest updates','next level','premium bot','automation',
        'click to join','click here','join here','join us','abhi join','channel ko join',
        'tap to join','press to join','follow us','whatsapp','invite',
        'ny prediction bot','prediction bot','@ny_auto','@auto_predict'
      ];
      const lines = text.split('\n').filter(line => {
        const l = line.toLowerCase().trim();
        if (!l) return false;
        // Box drawing characters wali lines hide karo (decorative only)
        if (/^[╔╚║╗┌└│┐├┤▰▱◄►═\-\s\u2500-\u257F]+$/.test(line.trim())) return false;
        return !blocked.some(kw => l.includes(kw));
      });
      while (lines.length && !lines[lines.length-1].trim()) lines.pop();
      return lines.join('\n').trim();
    }

    function escapeHtml(t) {
      return t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    // (unlock per-card removed — credit deducts automatically per new prediction)

    // ==================== STATS ====================
    function updateStats() {
      // Sirf actual prediction messages count karo (result/promo nahi)
      const onlyPreds = allPredictions.filter(p => {
        const t = (p.text || '').toLowerCase();
        const hasPeriod = t.includes('period') || t.includes('round') || t.includes('wingo') || t.includes('win go') || /\.\.\.\d+/.test(t);
        const hasPred = t.includes('big') || t.includes('small') || t.includes('b i g') || t.includes('s m a l l') || t.includes('confidence') || t.includes('lucky');
        return hasPeriod && hasPred;
      });
      const total = onlyPreds.length;
      const today = new Date().toDateString();
      const todayPreds = onlyPreds.filter(p => new Date(p.date*1000).toDateString() === today);

      let wins = 0, losses = 0;
      allPredictions.forEach(p => {
        const t = (p.text || '').toLowerCase();
        const isPred = (t.includes('wingo') || t.includes('period') || t.includes('...')) &&
                       (t.includes('big') || t.includes('small') || t.includes('b i g') || t.includes('s m a l l') || t.includes('confidence'));
        if (!isPred) return;
        // Game API se result check karo
        const gameRes = window._resultMap && window._resultMap[String(p.message_id)];
        if (gameRes === 'win') wins++;
        else if (gameRes === 'loss') losses++;
      });
      // Win/loss game API se — 100% accurate

      const rated = wins + losses;
      const acc = rated > 0 ? Math.round((wins / rated) * 100) : 0;

      document.getElementById('acc-pct').textContent = rated > 0 ? acc + '%' : '—%';
      document.getElementById('acc-pct').style.color = acc >= 70 ? 'var(--green)' : acc >= 50 ? 'var(--gold)' : 'var(--red)';
      document.getElementById('acc-sub').textContent = rated > 0 ? `${wins} wins · ${losses} losses · ${rated} rated` : 'Auto-detecting from signals...';
      document.getElementById('acc-bar').style.width = acc + '%';
      document.getElementById('win-count').textContent = wins;
      document.getElementById('loss-count').textContent = losses;

      let streak = 0, streakType = '';
      for (let p of allPredictions) {
        const t = (p.text || '').toLowerCase();
        const isPred = (t.includes('wingo') || t.includes('period') || t.includes('...')) &&
                       (t.includes('big') || t.includes('small') || t.includes('b i g') || t.includes('s m a l l') || t.includes('confidence'));
        if (!isPred) continue;
        const gameRes = window._resultMap && window._resultMap[String(p.message_id)];
        if (!gameRes) break;
        const isWin = gameRes === 'win';
        if (streak === 0) { streakType = isWin ? 'W' : 'L'; streak = 1; }
        else if ((isWin && streakType === 'W') || (!isWin && streakType === 'L')) streak++;
        else break;
      }
      document.getElementById('streak-val').textContent = streak > 0 ? `${streak} ${streakType === 'W' ? '✅' : '❌'}` : '—';

      let tWins = 0, tLoss = 0;
      todayPreds.forEach(p => {
        const gameRes = window._resultMap && window._resultMap[String(p.message_id)];
        if (gameRes === 'win') tWins++;
        else if (gameRes === 'loss') tLoss++;
      });
      document.getElementById('today-count-s').textContent = todayPreds.length;
      const tRated = tWins + tLoss;
      document.getElementById('today-acc').textContent = tRated > 0 ? Math.round((tWins/tRated)*100) + '%' : '—%';
      // Total: sirf prediction count
      document.getElementById('stat-total').textContent = total;
      // Accuracy: overall win/loss se
      const rated = wins + losses;
      const accPct = rated > 0 ? Math.round((wins / rated) * 100) : null;
      const statToday = document.getElementById('stat-today');
      if (accPct !== null) {
        statToday.textContent = accPct + '%';
        statToday.style.color = accPct >= 70 ? 'var(--green)' : accPct >= 50 ? 'var(--gold)' : 'var(--red)';
      } else {
        statToday.textContent = '—%';
        statToday.style.color = 'var(--green)';
      }
    }

    // ==================== NOTIF LOG ====================
    function renderNotifLog() {
      const el = document.getElementById('notif-log');
      if (!notifLog.length) { el.innerHTML = '<div class="empty-alerts">📭 Koi notification abhi tak nahi</div>'; return; }
      el.innerHTML = notifLog.slice(0,30).map(n => {
        const isWin = n.icon === '✅';
        const isLoss = n.icon === '❌';
        const isBig = n.icon === '🔴';
        const isSmall = n.icon === '🟢';
        let titleColor = 'rgba(255,255,255,0.85)';
        if (isWin || isSmall) titleColor = 'var(--green)';
        else if (isLoss || isBig) titleColor = 'var(--red)';
        return `
        <div class="notif-item">
          <div class="notif-icon">${n.icon || '📡'}</div>
          <div style="flex:1">
            <div style="font-family:'Orbitron',sans-serif;font-size:12px;font-weight:700;color:${titleColor};">${escapeHtml(n.title || '')}</div>
            <div style="font-size:12px;color:rgba(255,255,255,0.45);margin-top:2px;">${escapeHtml(n.sub || '')}</div>
            <div class="notif-time">${n.time}</div>
          </div>
        </div>`;
      }).join('');
    }

    function extractNotifInfo(rawText) {
      const t = rawText || '';
      const tl = t.toLowerCase();

      // Period number extract karo
      const periodMatch = t.match(/period\s*[:\s]+[.]*(\d+)/i) || t.match(/\.\.\.(\d+)/);
      const period = periodMatch ? periodMatch[1] : '';

      // Result message check — WIN/LOSS dono properly detect karo
      const isResult = tl.includes('result') || tl.includes('l o s s') || tl.includes('w i n');
      const isLoss = tl.includes('❌') || tl.includes('loss') || tl.includes('l o s s') || tl.includes('agli baar');
      const isWin = !isLoss && (tl.includes('✅') || ((tl.includes('win') || tl.includes('w i n')) && !tl.includes('wingo')));

      if (isResult && (isWin || isLoss)) {
        // Result msg: WIN/LOSS clearly show karo
        return {
          icon: isWin ? '✅' : '❌',
          title: isWin ? '✅ WIN' : '❌ LOSS',
          sub: period ? `Period: ...${period}` : 'Result aaya'
        };
      } else if (!isResult || (!isWin && !isLoss && tl.includes('result'))) {
        // Prediction msg: BIG/SMALL + Period
        const isBig = tl.includes('b i g') || (tl.includes('big') && !tl.includes('result'));
        const isSmall = tl.includes('s m a l l') || (tl.includes('small') && !tl.includes('result'));
        const call = isBig ? '🔴 BIG' : isSmall ? '🟢 SMALL' : '📡 Signal';
        // Confidence
        const confMatch = t.match(/(\d+)%/);
        const conf = confMatch ? ` · ${confMatch[1]}% conf` : '';
        return {
          icon: isBig ? '🔴' : isSmall ? '🟢' : '📡',
          title: call,
          sub: (period ? `Period: ...${period}` : 'Naya signal') + conf
        };
      } else {
        // Fallback
        return { icon: '📋', title: '📋 RESULT', sub: period ? `Period: ...${period}` : 'Result aaya' };
      }
    }

    function addNotif(rawText, icon) {
      const now = new Date();
      const info = extractNotifInfo(rawText);
      notifLog.unshift({
        icon: info.icon,
        title: info.title,
        sub: info.sub,
        time: formatDate(now.getTime()/1000) + ' · ' + formatTime(now.getTime()/1000)
      });
      notifLog = notifLog.slice(0,50);
      localStorage.setItem('nx_notifs', JSON.stringify(notifLog));
      const badge = document.getElementById('alert-badge');
      badge.textContent = notifLog.length;
      badge.style.display = 'inline';
    }

    // predictions.js ke liye global expose karo
    window.updateStats = updateStats;
    window.addNotif = addNotif;
    window.cleanPrediction = cleanPrediction;
    window.escapeHtml = escapeHtml;
    window.showToast = showToast;
    window.playAlert = playAlert;
    window.isPromoMessage = isPromoMessage;
    window.extractPeriod = extractPeriod;
    window.extractConfidence = extractConfidence;
    window.autoDetectResult = autoDetectResult;
    window.renderNotifLog = renderNotifLog;

    // ==================== NOTIFICATIONS ====================
    async function requestNotifPermission() {
      if (!('Notification' in window)) return;
      if (Notification.permission === 'default') {
        await Notification.requestPermission();
      }
    }

    function handleNotifToggle() {
      const on = document.getElementById('toggle-notif')?.checked;
      if (on) requestNotifPermission();
    }

    function sendPushNotif(title, body) {
      if (!('Notification' in window) || Notification.permission !== 'granted') return;
      // Service Worker ready hone par notification bhejo
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(reg => {
          // Controller se try karo pehle
          if (navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({ type: 'SHOW_NOTIFICATION', title, body });
          } else {
            // Directly registration se dikhao
            reg.showNotification(title, {
              body, icon: 'icon-192.png', badge: 'icon-192.png',
              tag: 'nexus-signal', renotify: true,
              vibrate: [200, 100, 200],
              data: { url: location.origin }
            });
          }
        }).catch(() => {
          // Fallback: direct notification
          try { new Notification(title, { body, icon: 'icon-192.png', tag: 'nexus-signal', renotify: true }); } catch(e) {}
        });
        return;
      }
      // Non-SW fallback
      try {
        new Notification(title, {
          body, icon: 'icon-192.png', badge: 'icon-192.png',
          tag: 'nexus-signal', renotify: true
        });
      } catch(e) {}
    }

    function playAlert(msgText) {
      const soundOn = document.getElementById('toggle-sound')?.checked;
      const notifOn = document.getElementById('toggle-notif')?.checked ?? true;
      if (!notifOn) return; // User ne notification band kiya hai

      if (soundOn) {
        try {
          const ctx = new (window.AudioContext || window.webkitAudioContext)();
          [600, 800, 1000].forEach((freq, i) => {
            const o = ctx.createOscillator(), g = ctx.createGain();
            o.connect(g); g.connect(ctx.destination);
            o.frequency.value = freq; o.type = 'sine';
            g.gain.setValueAtTime(0.15, ctx.currentTime + i*0.1);
            g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i*0.1 + 0.2);
            o.start(ctx.currentTime + i*0.1);
            o.stop(ctx.currentTime + i*0.1 + 0.2);
          });
        } catch(e) {}
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
      }
      // Signal text se period aur prediction extract karo
      let notifBody = 'Naya signal aaya!';
      if (msgText) {
        const lines = msgText.split('\n').map(l => l.trim()).filter(Boolean);
        let period = '', prediction = '';
        for (const line of lines) {
          const ll = line.toLowerCase();
          if (!period && (ll.includes('period') || ll.includes('round'))) {
            period = line.includes(':') ? line.split(':').slice(1).join(':').trim() : line.replace(/period|round/gi,'').trim();
          }
          if (!prediction) {
            if (ll.includes('b i g') || (ll.includes('big') && (line.includes('🔴') || line.includes('>>>')))) prediction = '🔴 BIG';
            else if (ll.includes('s m a l l') || (ll.includes('small') && (line.includes('🟢') || line.includes('>>>')))) prediction = '🟢 SMALL';
          }
        }
        if (period && prediction) notifBody = `Period: ${period} — ${prediction}`;
        else if (period) notifBody = `Period: ${period}`;
        else if (prediction) notifBody = prediction;
        else notifBody = msgText.substring(0, 80) + (msgText.length > 80 ? '...' : '');
      }
      sendPushNotif('🎯 Nexus Prediction — New Signal!', notifBody);
    }
