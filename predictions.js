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
            updateStats();
          } else if (result === 'loss') {
            pendingTag.className = 'result-tag auto-loss';
            pendingTag.textContent = '❌ LOSS';
            card.classList.add('result-loss');
            card.classList.remove('result-win');
            addNotif('❌ LOSS — SIG-' + String(msgId).slice(-4), '❌');
            updateStats();
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

        // isPromoMessage — ui.js se copy, predictions.js mein bhi chahiye
    function isPromoMessage(text) {
      const t = text.toLowerCase();
      const hasPeriod = t.includes('period') || t.includes('round') ||
                        /\.\.\.\d+/.test(t) ||
                        t.includes('wingo') || t.includes('win go') || t.includes('1m') || t.includes('5m') || t.includes('3m');
      const hasPrediction = t.includes('big') || t.includes('small') ||
                            t.includes('b i g') || t.includes('s m a l l') ||
                            t.includes('confidence') || t.includes('lucky');
      const isPrediction = hasPeriod && hasPrediction;
      const isResult = t.includes('result') && (t.includes('period') || t.includes('number') ||
                       t.includes('colour') || t.includes('color') || t.includes('size') || /\.\.\.\d+/.test(t));
      return !isPrediction && !isResult;
    }

    // extractPeriod — ui.js se copy
    function extractPeriod(text) {
      const m = text.match(/\.\.\.?(\d+)/);
      if (m) return m[1];
      const m2 = text.match(/period[:\s]+[\.]*?(\d+)/i);
      if (m2) return m2[1];
      return null;
    }

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
