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
      if (currentTab !== 'signals') { updateStats(); return; }
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

      let filtered = predictions.filter(p => !isPromoMessage(p.text || ''));
      if (confFilter > 0) {
        filtered = predictions.filter(p => extractConfidence(p.text || '') >= confFilter);
      }

      updateStats();

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

        // Timer: sirf prediction cards pe (result cards pe nahi)
        let timerHTML = '';
        if (!isResultCard) {
          const cardTime = p.date * 1000; // ms
          // Next message aane ka time calculate karo — messages ke beech average interval se
          const onlyPredMsgs = predictions.filter(q => {
            const qt = (q.text || '').toLowerCase();
            return (qt.includes('period') || qt.includes('round')) &&
                   (qt.includes('big') || qt.includes('small') || qt.includes('confidence') || qt.includes('lucky') || qt.includes('wingo'));
          });
          // Sort by date ascending
          const sorted = [...onlyPredMsgs].sort((a, b) => a.date - b.date);
          let avgInterval = 5 * 60 * 1000; // default 5 min
          if (sorted.length >= 2) {
            const gaps = [];
            for (let k = 1; k < Math.min(sorted.length, 6); k++) {
              const gap = (sorted[k].date - sorted[k-1].date) * 1000;
              if (gap > 10000 && gap < 30 * 60 * 1000) gaps.push(gap); // 10s to 30min
            }
            if (gaps.length > 0) {
              avgInterval = gaps.reduce((a, b) => a + b, 0) / gaps.length;
            }
          }
          const nextMsgTime = cardTime + avgInterval;
          const remaining = Math.max(0, nextMsgTime - Date.now());
          const remSec = Math.round(remaining / 1000);
          if (remaining > 0) {
            timerHTML = `<span class="pred-timer" data-born="${cardTime}" data-interval="${Math.round(avgInterval)}" data-msgid="${msgId}"><span class="timer-dot"></span><span class="timer-txt">${remSec > 60 ? Math.ceil(remSec/60)+'m '+( remSec%60)+'s' : remSec+'s'}</span></span>`;
          } else {
            timerHTML = `<span class="pred-timer timer-done"><span class="timer-txt">⏱ Next soon</span></span>`;
          }
        }
        if (isResultCard) {
          // Result message — WIN/LOSS already shown inside card body, no footer tag needed
          resultHTML = '';
        } else if (autoRes === 'auto-win') {
          resultHTML = `<span class="result-tag auto-win">✅ WIN</span>`;
        } else if (autoRes === 'auto-loss') {
          resultHTML = `<span class="result-tag auto-loss">❌ LOSS</span>`;
        } else {
          resultHTML = `<span class="result-tag pending">⏳ PENDING</span>`;
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

    // ==================== PREDICTION CARD TIMER ENGINE ====================
    (function startTimerEngine() {
      setInterval(() => {
        const timers = document.querySelectorAll('.pred-timer[data-born]');
        timers.forEach(el => {
          const born = parseInt(el.getAttribute('data-born'));
          const interval = parseInt(el.getAttribute('data-interval') || '300000');
          const nextTime = born + interval;
          const remaining = Math.max(0, nextTime - Date.now());
          const txt = el.querySelector('.timer-txt');
          if (!txt) return;
          if (remaining <= 0) {
            el.classList.remove('timer-urgent');
            el.classList.add('timer-done');
            el.removeAttribute('data-born'); // stop updating
            txt.textContent = '⏱ Next soon';
          } else {
            const remSec = Math.ceil(remaining / 1000);
            if (remSec > 60) {
              const m = Math.floor(remSec / 60);
              const s = remSec % 60;
              txt.textContent = m + 'm ' + (s > 0 ? s + 's' : '');
            } else {
              txt.textContent = remSec + 's';
            }
            if (remSec <= 30) {
              el.classList.add('timer-urgent');
            } else {
              el.classList.remove('timer-urgent');
            }
          }
        });
      }, 1000);
    })();

    // ==================== FETCH ====================
    async function fetchPredictions(isRefresh = false) {
      if (!predictionsRunning && !isFirstLoad) return;
      const content = document.getElementById('content');
      const fab = document.getElementById('fab-btn');
      if (isFirstLoad) content.innerHTML = `<div class="center-state"><div class="loader"></div><div class="state-title">LOADING SIGNALS...</div></div>`;
      // Silent refresh - no spinning animation

      try {
        if (isFirstLoad) await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?offset=-1`);
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
            if (!isFirstLoad) {
              brandNew.forEach(p => addNotif(cleanPrediction(p.text || ''), '📡'));
              playAlert(cleanPrediction(brandNew[0]?.text || ""));
              newCount += brandNew.length;
              const badge = document.getElementById('fab-new');
              badge.textContent = newCount;
              badge.style.display = 'block';
            }
          }
        }

        if (allPredictions.length > 0) renderCards(allPredictions);
        else if (isFirstLoad) {
          if (predictionsRunning) {
            content.innerHTML = `<div class="center-state"><div class="state-icon">⏳</div><div class="state-title">WAITING FOR SIGNALS</div></div>`;
          }
        }

        document.getElementById('stat-status').textContent = 'LIVE';
        document.getElementById('stat-status').style.color = 'var(--green)';
        const now = new Date();
        document.getElementById('last-updated').textContent = `Last updated: ${now.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}`;
      } catch(e) {
        document.getElementById('stat-status').textContent = 'ERR';
        document.getElementById('stat-status').style.color = 'var(--red)';
        if (isFirstLoad) content.innerHTML = `<div class="error-box">⚠️ Connection error. Retry karo.<br><small style="opacity:0.6">${e.message}</small></div>`;
      }

      isFirstLoad = false;
      // Silent - no spinner
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
            brandNew.forEach(p => addNotif(cleanPrediction(p.text || ''), '📡'));
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
