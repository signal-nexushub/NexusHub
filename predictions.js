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

      // Pehle promo filter karo
      let filtered = predictions.filter(p => !isPromoMessage(p.text || ''));
      if (confFilter > 0) {
        filtered = filtered.filter(p => extractConfidence(p.text || '') >= confFilter);
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
        // Win detect hua toh _lossSet se remove karo (win result message aaya = not a loss)
        if (autoRes === 'auto-win' && window._lossSet && window._lossSet.has(String(msgId))) {
          window._lossSet.delete(String(msgId));
          localStorage.setItem('nx_loss_set', JSON.stringify([...window._lossSet]));
        }
        // Loss check: _lossSet mein hai toh loss (timer expire + message deleted)
        const isLost = window._lossSet && window._lossSet.has(String(msgId));
        const finalResult = isLost ? 'auto-loss' : autoRes;

        if (isResultCard) {
          resultHTML = '';
        } else if (finalResult === 'auto-win') {
          resultHTML = `<span class="result-tag auto-win">✅ WIN</span>`;
        } else if (finalResult === 'auto-loss') {
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

    // ==================== PREDICTION CARD TIMER ENGINE ====================
    // Loss detection set — jinhe loss mark kiya gaya
    window._lossSet = window._lossSet || new Set(JSON.parse(localStorage.getItem('nx_loss_set') || '[]'));

    // _lossSet ko allPredictions ke win results se reconcile karo
    function reconcileLossSet() {
      if (!window._lossSet || window._lossSet.size === 0) return;
      let changed = false;
      window._lossSet.forEach(msgId => {
        // Koi bhi prediction jiska win result hai usse remove karo
        const pred = allPredictions.find(p => String(p.message_id) === msgId);
        if (!pred) return;
        const period = extractPeriod(pred.text || '');
        if (!period) return;
        const hasWin = allPredictions.some(p => {
          const t = (p.text || '').toLowerCase();
          return t.includes('result') && t.includes(period) && (t.includes('win') || t.includes('✅'));
        });
        if (hasWin) {
          window._lossSet.delete(msgId);
          changed = true;
        }
      });
      if (changed) localStorage.setItem('nx_loss_set', JSON.stringify([...window._lossSet]));
    }

    // Telegram se message exist check karo
    async function checkMsgExists(msgId) {
      try {
        const chatId = CHANNEL.replace('@', '');
        const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/forwardMessage?chat_id=${chatId}&from_chat_id=${chatId}&message_id=${msgId}`);
        const data = await res.json();
        // agar 400 "message to forward not found" → deleted → loss
        if (!data.ok && data.description && data.description.includes('not found')) return false;
        return true;
      } catch(e) { return true; } // network error pe assume exists
    }

    (function startTimerEngine() {
      setInterval(async () => {
        const timers = document.querySelectorAll('.pred-timer[data-born]');
        timers.forEach(async el => {
          const born = parseInt(el.getAttribute('data-born'));
          const interval = parseInt(el.getAttribute('data-interval') || '300000');
          const nextTime = born + interval;
          const remaining = Math.max(0, nextTime - Date.now());
          const txt = el.querySelector('.timer-txt');
          if (!txt) return;
          if (remaining <= 0) {
            el.classList.remove('timer-urgent');
            el.classList.add('timer-done');
            el.removeAttribute('data-born');
            txt.textContent = '⏱ Checking...';

            // Timer expire hua — check karo prediction still pending hai ya win/loss hua
            const msgId = el.getAttribute('data-msgid');
            if (msgId && !window._lossSet.has(String(msgId))) {
              // Sirf tab check karo jab result tag pending ho
              const card = document.querySelector(`.pred-card[data-msgid="${msgId}"]`);
              const pendingTag = card && card.querySelector('.result-tag.pending');
              if (pendingTag) {
                // Pehle check karo - allPredictions mein is period ka win result hai?
                const thisCard = allPredictions.find(p => p.message_id == msgId);
                const thisPeriod = thisCard ? extractPeriod(thisCard.text || '') : null;
                const hasWinResult = thisPeriod && allPredictions.some(p => {
                  const t = (p.text || '').toLowerCase();
                  return t.includes('result') && t.includes(thisPeriod) && (t.includes('win') || t.includes('✅'));
                });
                if (hasWinResult) {
                  // Win result aa gaya - pending hatao, win dikhao
                  pendingTag.className = 'result-tag auto-win';
                  pendingTag.textContent = '✅ WIN';
                  card.classList.add('result-win');
                  return;
                }
                // Telegram se check karo — agar message delete hua toh loss
                const exists = await checkMsgExists(parseInt(msgId));
                if (!exists) {
                  // Message delete hua = LOSS
                  window._lossSet.add(String(msgId));
                  localStorage.setItem('nx_loss_set', JSON.stringify([...window._lossSet]));
                  // Card update karo
                  if (pendingTag) {
                    pendingTag.className = 'result-tag auto-loss';
                    pendingTag.textContent = '❌ LOSS';
                    card.classList.add('result-loss');
                  }
                  // History update
                  addNotif('❌ LOSS — SIG-' + String(msgId).slice(-4), '❌');
                } else {
                  txt.textContent = '⏱ Next soon';
                }
              } else {
                txt.textContent = '⏱ Next soon';
              }
            }
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
              brandNew.forEach(p => addNotif(cleanPrediction(p.text || ''), '📡'));
              playAlert(cleanPrediction(brandNew[0]?.text || ""));
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
        document.getElementById('stat-status').textContent = 'ERR';
        document.getElementById('stat-status').style.color = 'var(--red)';
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
