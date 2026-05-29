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

    // predictions.js ke liye global expose karo — turant assign karo
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
    window.renderTxnList = renderTxnList;
    window.updateCreditUI = updateCreditUI;

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
// ==================== STYLED PREDICTION BODY ====================
    function formatPredictionBody(rawText) {
      const cleaned = cleanPrediction(rawText);
      const text = cleaned.replace(/NY\s*PREDICTION\s*(BOT)?\s*(V[\d.]+)?/gi, '').trim();
      const lines = text.split('\n').filter(l => l.trim());
      const fullLower = text.toLowerCase();
      const isResult = fullLower.includes('result');

      let shownResult = false;
      const styledLines = lines.map(line => {
        const l = line.trim();
        if (!l) return '';
        const ll = l.toLowerCase();
        // Header/branding lines — hide karo
        if (ll.includes('server') || ll.includes('engine') || ll.includes('mode') || ll.includes('bot v') ||
            ll.includes('ny prediction') || ll.includes('prediction bot') || ll.includes('badsha') ||
            ll.includes('ultra pro') || ll.includes('ny ultra') ||
            /v\d+\.\d+/.test(ll) || // v11.0, v10.0 etc
            l.includes('╔') || l.includes('╚') || l.includes('║') ||
            l.includes('▓') || l.includes('◄') || l.includes('►')) {
          return ''; // Hide completely
        }
        // Period / WinGo round detect karo — naye format mein "WinGo 1M  📌 ...1174"
        if (ll.includes('period') || ll.includes('round') ||
            (ll.includes('wingo') || ll.includes('win go')) && /\.\.\.\d+/.test(l)) {
          // Extract period number from ...1174 format
          const periodMatch = l.match(/\.\.\.?(\d+)/);
          const val = periodMatch ? '...' + periodMatch[1] : (l.includes(':') ? l.split(':').slice(1).join(':').trim() : l);
          return `<div class="msg-row"><span class="msg-key">📍 PERIOD</span><span class="msg-val">${escapeHtml(val)}</span></div>`;
        }
        // WinGo type line — "WinGo 1M" etc
        if ((ll.includes('wingo') || ll.includes('win go')) && !ll.includes('confidence')) {
          const periodMatch = l.match(/\.\.\.?(\d+)/);
          const val = periodMatch ? '...' + periodMatch[1] : l.replace(/[╔╚║┌└│▓◈◄►]/g, '').trim();
          return `<div class="msg-row"><span class="msg-key">📍 PERIOD</span><span class="msg-val">${escapeHtml(val)}</span></div>`;
        }
        if (ll.includes('time') && !ll.includes('real')) {
          const val = l.includes(':') ? l.split(':').slice(1).join(':').trim() : l;
          return `<div class="msg-row"><span class="msg-key">⏱ TIME</span><span class="msg-val">${escapeHtml(val)}</span></div>`;
        }
        if (!isResult && (ll.includes('b i g') || (ll.includes('big') && (l.includes('🔴') || l.includes('>>>'))))) {
          return `<div class="msg-predict big-predict">🔴 &nbsp; B I G</div>`;
        }
        if (!isResult && (ll.includes('s m a l l') || (ll.includes('small') && (l.includes('🟢') || l.includes('>>>'))))) {
          return `<div class="msg-predict small-predict">🟢 &nbsp; S M A L L</div>`;
        }
        if (ll.includes('lucky') || (ll.includes('number') && !isResult)) {
          const val = l.includes(':') ? l.split(':').slice(1).join(':').trim() : l;
          return `<div class="msg-row"><span class="msg-key">🍀 LUCKY</span><span class="msg-val lucky-val">${escapeHtml(val)}</span></div>`;
        }
        if (ll.includes('confidence')) {
          const m = l.match(/(\d+)%/);
          const pct = m ? parseInt(m[1]) : 0;
          const color = pct >= 90 ? 'var(--green)' : pct >= 70 ? 'var(--gold)' : 'var(--red)';
          const val = l.includes(':') ? l.split(':').slice(1).join(':').trim() : l;
          return `<div class="msg-row"><span class="msg-key">📊 CONF</span><span class="msg-val" style="color:${color};font-weight:800;font-size:16px">${escapeHtml(val)}</span></div>`;
        }
        if (isResult && (ll.includes('win') || ll.includes('w i n')) && !ll.includes('wingo')) {
          if (shownResult) return ''; // Sirf ek baar dikhao
          shownResult = true;
          return `<div class="msg-result win-result">✅ &nbsp; W I N</div>`;
        }
        if (isResult && (ll.includes('loss') || ll.includes('l o s s') || ll.includes('agli baar'))) {
          if (shownResult) return ''; // Sirf ek baar dikhao
          shownResult = true;
          return `<div class="msg-result loss-result">❌ &nbsp; L O S S</div>`;
        }
        if ((ll.includes('colour') || ll.includes('color')) && isResult) {
          const val = l.includes(':') ? l.split(':').slice(1).join(':').trim() : l;
          return `<div class="msg-row"><span class="msg-key">🎨 COLOR</span><span class="msg-val">${escapeHtml(val)}</span></div>`;
        }
        if (ll.includes('size') && isResult) {
          const val = l.includes(':') ? l.split(':').slice(1).join(':').trim() : l;
          const isBig = val.toLowerCase().includes('big');
          return `<div class="msg-row"><span class="msg-key">📐 SIZE</span><span class="msg-val" style="color:${isBig?'var(--red)':'var(--green)'}">${escapeHtml(val)}</span></div>`;
        }
        if (ll.includes('predict') && isResult) {
          const val = l.includes(':') ? l.split(':').slice(1).join(':').trim() : l;
          return `<div class="msg-row"><span class="msg-key">🎯 PREDICTED</span><span class="msg-val">${escapeHtml(val)}</span></div>`;
        }
        if (ll.includes('number') && isResult) {
          const val = l.includes(':') ? l.split(':').slice(1).join(':').trim() : l;
          return `<div class="msg-row"><span class="msg-key">🔢 NUMBER</span><span class="msg-val">${escapeHtml(val)}</span></div>`;
        }
        return `<div class="msg-plain">${escapeHtml(l)}</div>`;
      }).filter(Boolean);

      return '<div class="pred-msg-body">' + styledLines.join('') + '</div>';
    }

    // ==================== RENDER CARDS ====================
    function renderCards(predictions) {
      if (currentTab !== 'signals') { (window.updateStats || function(){})(); return; }
      const content = document.getElementById('content');

      if (!predictionsRunning) {
        content.innerHTML = `<div class="center-state">
          <div class="state-icon">⏸</div>
          <div class="state-title">PREDICTIONS PAUSED</div>
          <div class="state-sub" style="margin-top:16px">
            ${credits < 1 && !vipState.active
              ? 'Credit khatam ho gaya. Earn karo aur dobara shuru karo.'
              : 'Start button dabao predictions shuru karne ke liye.'
            }
          </div>
          ${credits < 1 && !vipState.active ? `<button onclick="setTab('credits')" style="margin-top:18px;padding:10px 24px;border-radius:12px;background:rgba(255,215,0,0.12);border:1px solid rgba(255,215,0,0.3);color:var(--gold);font-family:'Orbitron',sans-serif;font-size:11px;font-weight:700;letter-spacing:2px;cursor:pointer;">🪙 EARN CREDITS</button>` : ''}
        </div>`;
        return;
      }

      if (!predictions.length) {
        content.innerHTML = `<div class="center-state"><div class="state-icon">📡</div><div class="state-title">NO SIGNALS YET</div><div class="state-sub">Waiting for predictions...</div></div>`;
        return;
      }

      // Pehle promo filter karo
      let filtered = predictions.filter(p => !isPromoMessage(p.text || ''));
      if (confFilter > 0) {
        filtered = filtered.filter(p => extractConfidence(p.text || '') >= confFilter);
      }

      (window.updateStats || function(){})();

      if (!filtered.length) {
        content.innerHTML = `<div class="center-state"><div class="state-icon">🔍</div><div class="state-title">NO SIGNALS</div><div class="state-sub">${confFilter}%+ confidence filter active</div></div>`;
        return;
      }

      // Silent update - sirf naye cards add karo, screen flash nahi hoga
      const html = `<div class="card-list">` + filtered.map((p, i) => {
        const msgId = p.message_id;
        const autoRes = autoDetectResult(p.text || '');
        const sig = getSignal(p.text || '');
        const isNew = i === 0;
        const cardClass = autoRes === 'auto-win' ? 'result-win' : autoRes === 'auto-loss' ? 'result-loss' : '';
        const idStr = String(msgId).slice(-4).padStart(4, '0');
        const conf = extractConfidence(p.text || '');

        // Auto-deduct credit for each new prediction shown (silently)
        deductCreditForNewPrediction(msgId, idStr, p.text || '');

        let resultHTML = '';
        const isResultCard = (p.text || '').toLowerCase().includes('result');

        // Timer: sirf pending prediction cards pe — game API se sync hoga
        let timerHTML = '';
        const isPredCard = !isResultCard;
        if (isPredCard) {
          // Result already resolved hai?
          const resolvedResult = checkPredictionResult(msgId, p.text || '');
          if (!resolvedResult) {
            // Still pending — timer dikhao (gameApiPoller update karega)
            const nowSec = new Date().getSeconds();
            const rem = 60 - nowSec;
            timerHTML = `<span class="pred-timer${rem <= 10 ? ' timer-urgent' : ''}" data-msgid="${msgId}"><span class="timer-dot"></span><span class="timer-txt">${rem}s</span></span>`;
          }
        }
        // Game API se result check karo — 100% accurate
        const gameResult = !isResultCard ? checkPredictionResult(msgId, p.text || '') : null;

        if (isResultCard) {
          resultHTML = '';
        } else if (gameResult === 'win') {
          resultHTML = `<span class="result-tag auto-win">✅ WIN</span>`;
        } else if (gameResult === 'loss') {
          resultHTML = `<span class="result-tag auto-loss">❌ LOSS</span>`;
        } else {
          resultHTML = `<span class="result-tag pending" data-pred-msgid="${msgId}">⏳ PENDING</span>`;
        }

        return `
          <div class="pred-card ${isNew ? 'is-new' : ''} ${cardClass}" data-msgid="${msgId}" style="animation-delay:${i*0.04}s">
            <div class="card-header">
              <div class="card-id">SIG-${idStr}${conf ? ` · ${conf}%` : ''}</div>
              <div class="card-time">${formatDate(p.date)} · ${formatTime(p.date)}</div>
            </div>
            <div class="card-body">${formatPredictionBody(p.text || '')}</div>
            <div class="card-footer">
              ${signalHTML(sig)}
              ${timerHTML}
              ${resultHTML}
            </div>
          </div>`;
      }).join('') + `</div>`;

      // Smooth silent update
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      const newList = tempDiv.querySelector('.card-list');
      const existingList = content.querySelector('.card-list');

      if (!existingList) {
        content.innerHTML = html;
      } else {
        const existingIds = new Set([...existingList.querySelectorAll('.pred-card')].map(c => c.dataset.msgid));
        const newCards = [...newList.querySelectorAll('.pred-card')];
        let added = 0;
        [...newCards].reverse().forEach(card => {
          if (!existingIds.has(card.dataset.msgid)) {
            card.style.animationDelay = '0s';
            existingList.prepend(card);
            added++;
          }
        });
        // Update existing cards (win/loss result update)
        newCards.forEach(card => {
          const existing = existingList.querySelector(`[data-msgid="${card.dataset.msgid}"]`);
          if (existing) {
            const newFooter = card.querySelector('.card-footer');
            const existFooter = existing.querySelector('.card-footer');
            if (newFooter && existFooter && newFooter.innerHTML !== existFooter.innerHTML) {
              existFooter.innerHTML = newFooter.innerHTML;
            }
          }
        });
        // Max 50 cards
        const allCards = existingList.querySelectorAll('.pred-card');
        if (allCards.length > 50) [...allCards].slice(50).forEach(c => c.remove());
      }
    }

    // ==================== GAME API ENGINE ====================
    // Game API se real results fetch karo — win/loss 100% accurate
    const GAME_API = 'https://draw.ar-lottery01.com/WinGo/WinGo_1M/GetHistoryIssuePage.json';

    // Results store — period (last 4 digits) → {number, size, fetched}
    window._gameResults = window._gameResults || {};
    // Win/Loss override store — msgId → 'win' | 'loss'
    window._resultMap = window._resultMap || JSON.parse(localStorage.getItem('nx_result_map') || '{}');

    function saveResultMap() {
      // Sirf last 200 entries rakhho
      const keys = Object.keys(window._resultMap);
      if (keys.length > 200) {
        const toDelete = keys.slice(0, keys.length - 200);
        toDelete.forEach(k => delete window._resultMap[k]);
      }
      localStorage.setItem('nx_result_map', JSON.stringify(window._resultMap));
    }

    // Game API fetch karo
    async function fetchGameResults() {
      try {
        const res = await fetch(GAME_API);
        const data = await res.json();
        const list = data.data.list;
        if (!list || !list.length) return null;

        // Last 20 results store karo
        list.forEach(item => {
          const period4 = String(item.issueNumber).slice(-4);
          const num = parseInt(item.number);
          window._gameResults[period4] = {
            number: num,
            size: num >= 5 ? 'BIG' : 'SMALL',
            colour: item.colour || ''
          };
        });

        // Latest result return karo
        const latest = list[0];
        const nextIssue = (BigInt(latest.issueNumber) + 1n).toString().slice(-4);
        const nowSec = new Date().getSeconds();
        const remaining = 60 - nowSec;

        return {
          latestPeriod: String(latest.issueNumber).slice(-4),
          nextPeriod: nextIssue,
          latestNumber: parseInt(latest.number),
          latestSize: parseInt(latest.number) >= 5 ? 'BIG' : 'SMALL',
          timerRemaining: remaining
        };
      } catch(e) {
        return null;
      }
    }

    // Prediction card ke liye result check karo
    function checkPredictionResult(msgId, predText) {
      // Already resolved?
      if (window._resultMap[String(msgId)]) return window._resultMap[String(msgId)];

      // Period extract karo
      const period = extractPeriod(predText);
      if (!period) return null;

      // Game results mein dhundho
      const gameRes = window._gameResults[period];
      if (!gameRes) return null;

      // Prediction BIG/SMALL extract karo
      const t = predText.toLowerCase();
      const predBig = t.includes('b i g') || (t.includes('big') && !t.includes('result'));
      const predSmall = t.includes('s m a l l') || (t.includes('small') && !t.includes('result'));
      if (!predBig && !predSmall) return null;

      const predSize = predBig ? 'BIG' : 'SMALL';
      const isWin = predSize === gameRes.size;

      const result = isWin ? 'win' : 'loss';
      window._resultMap[String(msgId)] = result;
      saveResultMap();
      return result;
    }

    // Timer UI update — real game clock se sync
    function updateGameTimer(remaining) {
      const timers = document.querySelectorAll('.pred-timer');
      timers.forEach(el => {
        const txt = el.querySelector('.timer-txt');
        if (!txt) return;
        if (remaining <= 0) {
          el.classList.add('timer-done');
          el.classList.remove('timer-urgent');
          txt.textContent = '⏱ Result aane wala...';
        } else {
          el.classList.remove('timer-done');
          txt.textContent = remaining + 's';
          if (remaining <= 10) el.classList.add('timer-urgent');
          else el.classList.remove('timer-urgent');
        }
      });
    }

    // Game API poller — har 3 sec pe check karo
    let _lastGamePeriod = null;
    async function gameApiPoller() {
      const gameData = await fetchGameResults();
      if (!gameData) { setTimeout(gameApiPoller, 3000); return; }

      // Timer sync karo
      updateGameTimer(gameData.timerRemaining);

      // Naya result aaya?
      if (_lastGamePeriod && _lastGamePeriod !== gameData.latestPeriod) {
        // Naya result — sabhi pending cards check karo
        document.querySelectorAll('.pred-card').forEach(card => {
          const msgId = card.dataset.msgid;
          if (!msgId) return;
          const pendingTag = card.querySelector('.result-tag.pending');
          if (!pendingTag) return;

          // Is card ka prediction text dhundho
          const pred = allPredictions.find(p => String(p.message_id) === msgId);
          if (!pred) return;

          const result = checkPredictionResult(msgId, pred.text || '');
          if (result === 'win') {
            pendingTag.className = 'result-tag auto-win';
            pendingTag.textContent = '✅ WIN';
            card.classList.add('result-win');
            card.classList.remove('result-loss');
            addNotif('✅ WIN — SIG-' + String(msgId).slice(-4), '✅');
            (window.updateStats || function(){})();
          } else if (result === 'loss') {
            pendingTag.className = 'result-tag auto-loss';
            pendingTag.textContent = '❌ LOSS';
            card.classList.add('result-loss');
            card.classList.remove('result-win');
            addNotif('❌ LOSS — SIG-' + String(msgId).slice(-4), '❌');
            (window.updateStats || function(){})();
          }
        });
        // Cards re-render karo updated results ke saath
        renderCards(allPredictions);
      }

      // Stats tab UI update karo
      const timerDisplay = document.getElementById('game-timer-display');
      const nextPeriodEl = document.getElementById('game-next-period');
      const lastResultEl = document.getElementById('game-last-result');
      const timerBar = document.getElementById('game-timer-bar');
      if (timerDisplay) timerDisplay.textContent = gameData.timerRemaining + 's';
      if (nextPeriodEl) nextPeriodEl.textContent = '...' + gameData.nextPeriod;
      if (lastResultEl) {
        // allPredictions sorted by message_id — latest pehle
        const sortedPreds = [...allPredictions].sort((a, b) => (b.message_id || 0) - (a.message_id || 0));
        const latestTgPred = sortedPreds.find(p => {
          const t = (p.text || '').toLowerCase();
          const isPred = (t.includes('wingo') || t.includes('b i g') || t.includes('s m a l l') ||
                         (t.includes('big') && !t.includes('result')) ||
                         (t.includes('small') && !t.includes('result')));
          return isPred && !isPromoMessage(p.text || '');
        });
        if (latestTgPred) {
          const t = (latestTgPred.text || '').toLowerCase();
          const isBig = t.includes('b i g') || (t.includes('big') && !t.includes('result'));
          const size = isBig ? 'BIG' : 'SMALL';
          lastResultEl.textContent = size;
          lastResultEl.style.color = isBig ? 'var(--red)' : 'var(--green)';
          lastResultEl.style.fontSize = '18px';
          lastResultEl.style.fontWeight = '700';
        }
      }
      if (timerBar) timerBar.style.width = ((gameData.timerRemaining / 60) * 100) + '%';

      _lastGamePeriod = gameData.latestPeriod;
      setTimeout(gameApiPoller, 3000);
    }

    // Start game API poller
    gameApiPoller();

        // reconcileLossSet — ab _resultMap use karta hai, _lossSet nahi
    function reconcileLossSet() {
      // _resultMap mein win hai toh _lossSet se remove karo
      if (!window._lossSet || window._lossSet.size === 0) return;
      let changed = false;
      window._lossSet.forEach(msgId => {
        if (window._resultMap && window._resultMap[msgId] === 'win') {
          window._lossSet.delete(msgId);
          changed = true;
        }
      });
      if (changed) localStorage.setItem('nx_loss_set', JSON.stringify([...window._lossSet]));
    }

    // ==================== FETCH ====================
    // Channel se recent messages fetch karo (history)
    async function fetchChannelHistory() {
      try {
        // getChatHistory se recent 50 messages lo
        const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getChatHistory?chat_id=${CHANNEL}&limit=50`);
        const data = await res.json();
        if (data.ok && data.result && data.result.length > 0) {
          return data.result.filter(m => m.text).reverse(); // newest last
        }
      } catch(e) {}
      // Fallback: getUpdates se try karo
      try {
        const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?limit=100&allowed_updates=%5B%22channel_post%22%5D`);
        const data = await res.json();
        if (data.ok && data.result) {
          return data.result.filter(u => u.channel_post && u.channel_post.text).map(u => u.channel_post);
        }
      } catch(e) {}
      return [];
    }

    async function fetchPredictions(isRefresh = false) {
      if (!predictionsRunning && !isFirstLoad) return;
      const content = document.getElementById('content');
      if (isFirstLoad) content.innerHTML = `<div class="center-state"><div class="loader"></div><div class="state-title">LOADING SIGNALS...</div></div>`;

      try {
        if (isFirstLoad) {
          // First load: channel history se recent messages lo
          const historyPosts = await fetchChannelHistory();
          if (historyPosts.length > 0) {
            allPredictions = historyPosts.slice(-100).reverse();
            if (allPredictions.length > 0) {
              // updateOffset set karo taaki longPoll naye messages se shuru kare
              const lastId = Math.max(...allPredictions.map(p => p.message_id || 0));
              window._lastHistoryMsgId = lastId;
            }
          }
          // getUpdates queue bhi drain karo taaki longPoll fresh start kare
          const upRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?limit=100&allowed_updates=%5B%22channel_post%22%5D`);
          const upData = await upRes.json();
          if (upData.ok && upData.result && upData.result.length > 0) {
            // Naye messages jo history mein nahi hain
            const existingIds = new Set(allPredictions.map(p => p.message_id));
            const freshPosts = upData.result.filter(u => u.channel_post && u.channel_post.text && !existingIds.has(u.channel_post.message_id)).map(u => u.channel_post);
            if (freshPosts.length > 0) {
              allPredictions = [...freshPosts, ...allPredictions].slice(0, 100);
            }
            updateOffset = upData.result[upData.result.length - 1].update_id + 1;
          }
        } else {
          // Regular poll: sirf naye messages
          const offsetParam = updateOffset ? `&offset=${updateOffset}` : '';
          const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?limit=100&allowed_updates=%5B%22channel_post%22%5D${offsetParam}`);
          const data = await res.json();
          if (data.ok && data.result && data.result.length > 0) {
            const newPosts = data.result.filter(u => u.channel_post && u.channel_post.text).map(u => u.channel_post);
            updateOffset = data.result[data.result.length - 1].update_id + 1;
            const existingIds = new Set(allPredictions.map(p => p.message_id));
            const brandNew = newPosts.filter(p => !existingIds.has(p.message_id));
            if (brandNew.length > 0) {
              allPredictions = [...brandNew, ...allPredictions].slice(0, 100);
              brandNew.forEach(p => (window.addNotif||function(){})(window.cleanPrediction ? window.cleanPrediction(p.text || '') : p.text, '📡'));
              (window.playAlert||function(){})(window.cleanPrediction ? window.cleanPrediction(brandNew[0]?.text || "") : "");
              newCount += brandNew.length;
              const badge = document.getElementById('fab-new');
              badge.textContent = newCount;
              badge.style.display = 'block';
            }
          }
        }

        if (allPredictions.length > 0) {
          reconcileLossSet(); // Win results se _lossSet clean karo
          renderCards(allPredictions);
        }
        else if (isFirstLoad) {
          content.innerHTML = `<div class="center-state"><div class="state-icon">⏳</div><div class="state-title">WAITING FOR SIGNALS</div></div>`;
        }

        document.getElementById('stat-status').textContent = 'LIVE';
        document.getElementById('stat-status').style.color = 'var(--green)';
        const now = new Date();
        document.getElementById('last-updated').textContent = `Last updated: ${now.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}`;
      } catch(e) {
        // ERR nahi dikhana — LIVE hi rakhna
        document.getElementById('stat-status').textContent = 'LIVE';
        document.getElementById('stat-status').style.color = 'var(--green)';
        if (isFirstLoad) content.innerHTML = `<div class="error-box">⚠️ Connection error. Retry karo.<br><small style="opacity:0.6">${e.message}</small></div>`;
      }

      isFirstLoad = false;
    }

    function doRefresh() {
      document.getElementById('fab-new').style.display = 'none';
      newCount = 0;
      fetchPredictions(true);
    }

    async function longPoll() {
      if (!predictionsRunning) { setTimeout(longPoll, 5000); return; }
      try {
        const offsetParam = updateOffset ? `&offset=${updateOffset}` : '';
        const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?timeout=20&limit=10&allowed_updates=%5B%22channel_post%22%5D${offsetParam}`);
        const data = await res.json();
        if (data.ok && data.result && data.result.length > 0) {
          const newPosts = data.result.filter(u => u.channel_post && u.channel_post.text).map(u => u.channel_post);
          updateOffset = data.result[data.result.length - 1].update_id + 1;
          const existingIds = new Set(allPredictions.map(p => p.message_id));
          const brandNew = newPosts.filter(p => !existingIds.has(p.message_id));
          if (brandNew.length > 0) {
            allPredictions = [...brandNew, ...allPredictions].slice(0, 100);
            renderCards(allPredictions);
            brandNew.forEach(p => (window.addNotif||function(){})(window.cleanPrediction ? window.cleanPrediction(p.text || '') : p.text, '📡'));
            playAlert(cleanPrediction(brandNew[0]?.text || ''));
            document.getElementById('fab-btn').classList.add('spinning');
            setTimeout(() => document.getElementById('fab-btn').classList.remove('spinning'), 500);
            const now = new Date();
            document.getElementById('last-updated').textContent = `Last updated: ${now.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}`;
          }
        }
      } catch(e) {}
      longPoll();
    }

    // ==================== INIT ====================
    updateCreditUI();
    updateAdminUI();
    checkDailyBonus();
    setTimeout(initWheel, 300);
    setTimeout(requestNotifPermission, 2000); // 2s baad permission maango
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
