// ==================== VIP PASS SYSTEM ====================
    function checkVipExpiry() {
      if (!vipState.endDate) { vipState.active = false; return; }
      const now = new Date();
      const end = new Date(vipState.endDate);
      const diffMs = end - now;
      if (diffMs > 0) {
        vipState.active = true;
        vipState.daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      } else {
        vipState.active = false;
        vipState.daysLeft = 0;
        // Expired — clear from DB
        if (window.currentUser) {
          window.fbDoc && window.fbSetDoc(window.fbDoc(window.fbDb, 'users', window.currentUser.uid), { vip: null }, { merge: true }).catch(() => {});
        }
      }
    }

    function updateVipBadgeUI() {
      const banner = document.getElementById('vip-active-banner');
      const headerBadge = document.getElementById('header-vip-badge');
      const headerDays = document.getElementById('header-vip-days');
      const timeLeftText = document.getElementById('vip-time-left-text');
      const daysBadge = document.getElementById('vip-days-badge');
      const nonMemberSection = document.getElementById('vip-non-member-section');
      const earnWays = document.getElementById('earn-ways-section');
      const earnTitle = document.getElementById('ways-to-earn-title');
      const spinEarnCard = document.getElementById('spin-earn-card');

      checkVipExpiry();
      const headerCreditActions = document.getElementById('header-credit-actions');
      const headerActionBtns = document.getElementById('header-action-btns');
      const creditVipCta = document.getElementById('credits-vip-cta');
      if (vipState.active) {
        const d = vipState.daysLeft;
        const txt = d === 1 ? '1 day left' : d + ' days left';
        if (banner) banner.style.display = 'block';
        if (headerBadge) { headerBadge.style.display = 'inline-flex'; }
        if (headerDays) headerDays.textContent = txt;
        if (timeLeftText) timeLeftText.textContent = 'Aap ek VIP user hain — unlimited predictions, zero credit tension! 🚀';
        if (daysBadge) daysBadge.textContent = txt;
        // VIP users ke liye buy/earn section hide karo
        if (nonMemberSection) nonMemberSection.style.display = 'none';
        if (earnWays) earnWays.style.display = 'none';
        if (earnTitle) earnTitle.style.display = 'none';
        if (spinEarnCard) spinEarnCard.style.display = 'none';
        // Home page buttons hide karo — Watch Ad, Share, Earn, VIP Pass
        if (headerCreditActions) headerCreditActions.style.display = 'none';
        if (headerActionBtns) headerActionBtns.style.display = 'none';
        if (creditVipCta) creditVipCta.style.display = 'none';
        // Nav VIP button gold color
        const navVip = document.getElementById('nav-vip');
        if (navVip) navVip.style.color = 'var(--gold)';
      } else {
        if (banner) banner.style.display = 'none';
        if (headerBadge) headerBadge.style.display = 'none';
        if (nonMemberSection) nonMemberSection.style.display = 'block';
        if (earnWays) earnWays.style.display = 'flex';
        if (earnTitle) earnTitle.style.display = 'block';
        if (spinEarnCard) spinEarnCard.style.display = 'block';
        // Normal users ke liye buttons wapas dikhao
        if (headerCreditActions) headerCreditActions.style.display = 'flex';
        if (headerActionBtns) headerActionBtns.style.display = 'flex';
        if (creditVipCta) creditVipCta.style.display = 'flex';
      }
      updateCreditUI();
      if (currentTab === 'vip') syncVipPage();
    }

    // ==================== VIP PAGE SYNC ====================
    function syncVipPage() {
      checkVipExpiry();
      const activeBanner = document.getElementById('vip-page-active-banner');
      const buySection = document.getElementById('vip-page-buy-section');
      const daysBadge = document.getElementById('vip-page-days-badge');

      // Pehle sabhi cards ko default state mein reset karo
      const planKeys = ['1m', '3m', '1y'];
      const defaultBorders = {
        '1m': 'rgba(255,255,255,0.1)',
        '3m': 'rgba(0,245,255,0.25)',
        '1y': 'rgba(255,215,0,0.35)'
      };
      planKeys.forEach(k => {
        const badge = document.getElementById('vip-active-badge-' + k);
        const card = document.getElementById('vip-card-' + k);
        if (badge) badge.style.display = 'none';
        if (card) card.style.borderColor = defaultBorders[k];
        // mouseover/mouseout listeners reset (border color overridden by active state below)
      });

      if (vipState.active) {
        if (activeBanner) activeBanner.style.display = 'block';
        if (buySection) buySection.style.display = 'block';
        if (daysBadge) {
          const d = vipState.daysLeft;
          daysBadge.textContent = d === 1 ? '1 day left' : d + ' days left';
        }

        // Active plan detect karo
        const activePlanKey = vipState.plan; // 'vip-1m', 'vip-3m', 'vip-1y'
        const shortKey = activePlanKey ? activePlanKey.replace('vip-', '') : '';  // '1m', '3m', '1y'

        if (shortKey) {
          const activeBadge = document.getElementById('vip-active-badge-' + shortKey);
          const activeCard = document.getElementById('vip-card-' + shortKey);
          const subEl = document.getElementById('vip-card-' + shortKey + '-sub');

          if (activeBadge) activeBadge.style.display = 'block';
          if (activeCard) {
            // Green glow border for active card
            activeCard.style.borderColor = 'rgba(0,255,136,0.7)';
            activeCard.style.boxShadow = '0 0 18px rgba(0,255,136,0.18), inset 0 0 18px rgba(0,255,136,0.04)';
            // mouseover pe bhi green rakho
            activeCard.onmouseover = null;
            activeCard.onmouseout = null;
          }
          // Sub text mein days left dikhao
          if (subEl && vipState.daysLeft > 0) {
            subEl.innerHTML = '<span style="color:var(--green);font-weight:700;">⏳ ' + vipState.daysLeft + ' days left</span>';
          }
        }
      } else {
        if (activeBanner) activeBanner.style.display = 'none';
        if (buySection) buySection.style.display = 'block';
        // Cards reset already done above
      }
    }

    // VIP page ka apna redeem function (credits page wale se alag input)
    async function redeemCodeFromVipPage() {
      const input = document.getElementById('vip-page-redeem-input');
      const msg = document.getElementById('vip-page-redeem-msg');
      if (!input || !msg) return;
      // Credits page ke input mein bhi sync karo toh original redeemCode() kaam kare
      const codeInput = document.getElementById('redeem-input');
      if (codeInput) codeInput.value = input.value;
      const result = await redeemCode();
      // Copy message from original redeem-msg
      const origMsg = document.getElementById('redeem-msg');
      if (origMsg) {
        msg.style.display = origMsg.style.display;
        msg.style.color = origMsg.style.color;
        msg.textContent = origMsg.textContent;
      }
    }

    // VIP Pass redeem — called from redeemCode when NEXUS-VIP-* code detected
    async function activateVipPass(plan, code) {
      const planDays = { 'VIP-1M': 30, 'VIP-3M': 90, 'VIP-1Y': 365 };
      const days = planDays[plan] || 30;
      const planKey = plan === 'VIP-1M' ? 'vip-1m' : plan === 'VIP-3M' ? 'vip-3m' : 'vip-1y';

      const now = new Date();
      const end = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

      // Agar pehle se VIP active hai toh extend karo
      if (vipState.active && vipState.endDate) {
        const existingEnd = new Date(vipState.endDate);
        if (existingEnd > now) {
          end.setTime(existingEnd.getTime() + days * 24 * 60 * 60 * 1000);
        }
      }

      vipState.plan = planKey;
      vipState.startDate = now.toISOString();
      vipState.endDate = end.toISOString();
      vipState.active = true;
      vipState.daysLeft = days;

      await saveToFirestore();
      updateVipBadgeUI();
      updateCreditUI();

      const planNames = { 'VIP-1M': '1 Month', 'VIP-3M': '3 Months', 'VIP-1Y': '1 Year' };
      return planNames[plan] || plan;
    }

    // Console hack band - random key se lock hai
    const _ck = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
    function addCredit(amount, desc, _key) {
      if (_key !== _ck) return; // Direct console call block
      if (typeof amount !== 'number' || isNaN(amount)) return;
      if (amount > 1000) return;
      credits += amount;
      if (credits < 0) credits = 0;
      const txn = {
        amount, desc,
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
        date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
      };
      transactions.unshift(txn);
      saveCredits();
      showToast((amount > 0 ? '+' + amount : amount) + ' Credit ' + (amount > 0 ? '💰' : ''), amount > 0 ? 'green' : 'red');
    }
    // Internal wrapper - yahi use hoga har jagah
    function _ac(amount, desc) { addCredit(amount, desc, _ck); }

    function deductCreditForNewPrediction(msgId, idStr, msgText) {
      // Only deduct once per prediction message
      if (unlockedCards.has(msgId)) return;
      // VIP active hai toh credit deduct nahi hoga — mark as seen only
      if (vipState.active) {
        unlockedCards.add(msgId);
        return;
      }
      if (credits < 1) return;
      // Result messages pe credit deduct nahi hoga - sirf predictions pe
      const isResult = (msgText || '').toLowerCase().includes('result');
      if (isResult) {
        unlockedCards.add(msgId); // mark as seen but no deduct
        localStorage.setItem('nx_unlocked', JSON.stringify([...unlockedCards]));
        return;
      }
      unlockedCards.add(msgId);
      _ac(-1, '📡 Prediction SIG-' + idStr);
      checkCreditAutoStop();
    }

    function updateCreditUI() {
      if (vipState.active) {
        document.getElementById('header-credits').textContent = '∞';
        document.getElementById('header-credit-label').textContent = 'UNLIMITED';
        document.getElementById('header-coin').textContent = '👑';
      } else {
        document.getElementById('header-credits').textContent = credits;
        document.getElementById('header-credit-label').textContent = 'CREDITS';
        document.getElementById('header-coin').textContent = '🪙';
      }
      const bigEl = document.getElementById('credit-big');
      if (bigEl) bigEl.textContent = vipState.active ? '∞' : credits;
      renderTxnList();
    }

    function renderTxnList() {
      const el = document.getElementById('txn-list');
      if (!transactions.length) { el.innerHTML = '<div class="empty-txn">📭 Koi transaction abhi tak nahi</div>'; return; }
      el.innerHTML = transactions.slice(0, 30).map(t => `
        <div class="txn-item">
          <div>
            <div class="txn-desc">${escapeHtml(t.desc)}</div>
            <div class="txn-time">${t.date} · ${t.time}</div>
          </div>
          <div class="txn-amount ${t.amount > 0 ? 'plus' : 'minus'}">${t.amount > 0 ? '+' : ''}${t.amount}</div>
        </div>`).join('');
    }

    // ==================== DAILY BONUS ====================
    function checkDailyBonus() {
      const btn = document.getElementById('daily-earn-btn');
      if (btn) btn.disabled = (serverState.lastLogin === new Date().toDateString());
    }

    function claimDailyBonus() {
      const today = new Date().toDateString();
      if (serverState.lastLogin === today) {
        showToast('Aaj ka bonus le chuke ho! Kal aana 😊', 'red');
        return;
      }
      serverState.lastLogin = today;
      _ac(2, '🌅 Daily Login Bonus');
      document.getElementById('daily-earn-btn').disabled = true;
    }

    // ==================== AD MODAL ====================
    let _adTicker = null;
    let _adListener = null;

    function _cleanupAd() {
      if (_adTicker) { clearInterval(_adTicker); _adTicker = null; }
      if (_adListener) { document.removeEventListener('visibilitychange', _adListener); _adListener = null; }
    }

    function _updateAdBtns(text, disabled) {
      const b1 = document.getElementById('ad-earn-btn');
      const b2 = document.getElementById('ad-header-btn');
      if (b1) { b1.textContent = text; b1.disabled = disabled; }
      if (b2) { b2.textContent = text === '▶ Watch Ad' ? '▶ Watch Ad' : text; b2.disabled = disabled; }
    }

    function openAdModal() {
      const WAIT_SEC = 20;
      _cleanupAd();

      // ---- In-app floating panel banana ----
      let existing = document.getElementById('ad-watch-panel');
      if (existing) existing.remove();

      const panel = document.createElement('div');
      panel.id = 'ad-watch-panel';
      panel.style.cssText = [
        'position:fixed','bottom:90px','left:50%','transform:translateX(-50%)',
        'width:calc(100% - 32px)','max-width:448px',
        'background:linear-gradient(135deg,#0d0818,#020008)',
        'border:1.5px solid rgba(255,215,0,0.35)',
        'border-radius:20px','padding:18px 16px',
        'z-index:300','box-shadow:0 8px 40px rgba(0,0,0,0.7)',
        'transition:all 0.3s'
      ].join(';');
      panel.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
          <div style="font-family:'Orbitron',sans-serif;font-size:11px;font-weight:700;color:var(--gold);letter-spacing:2px;">📺 WATCH AD</div>
          <div id="adp-status" style="font-family:'Orbitron',sans-serif;font-size:12px;color:rgba(255,255,255,0.4);letter-spacing:1px;">⏱ 20s baaki</div>
        </div>
        <div style="background:rgba(255,255,255,0.05);border-radius:10px;height:8px;overflow:hidden;margin-bottom:12px;">
          <div id="adp-bar" style="height:100%;width:0%;background:linear-gradient(90deg,var(--purple),var(--neon));border-radius:10px;transition:width 0.9s linear;"></div>
        </div>
        <div style="display:flex;gap:10px;">
          <button id="adp-open-btn" onclick="window.open('https://omg10.com/4/11048781','_blank')" style="flex:1;padding:12px;border-radius:12px;border:1px solid rgba(0,245,255,0.3);background:rgba(0,245,255,0.08);color:var(--neon);font-family:'Orbitron',sans-serif;font-size:11px;font-weight:700;letter-spacing:1px;cursor:pointer;">🔗 Ad Kholo</button>
          <button id="adp-claim-btn" disabled style="flex:2;padding:12px;border-radius:12px;border:1px solid rgba(255,215,0,0.2);background:rgba(255,215,0,0.05);color:rgba(255,215,0,0.3);font-family:'Orbitron',sans-serif;font-size:12px;font-weight:700;letter-spacing:1px;cursor:not-allowed;">🔒 20s baad claim karo</button>
        </div>
        <div style="text-align:center;font-size:10px;color:rgba(255,255,255,0.2);margin-top:8px;letter-spacing:1px;">Ad tab mein 20s poore dekho — phir yahan Claim dabao</div>
      `;
      document.body.appendChild(panel);

      let _adViewed = 0;
      let _adReady = false;

      function updatePanel() {
        const pct = Math.min((_adViewed / WAIT_SEC) * 100, 100);
        const left = Math.max(0, WAIT_SEC - _adViewed);
        const bar = document.getElementById('adp-bar');
        const status = document.getElementById('adp-status');
        const claimBtn = document.getElementById('adp-claim-btn');
        if (bar) bar.style.width = pct + '%';
        if (status) status.textContent = left > 0 ? `⏱ ${left}s baaki` : '✅ Ready!';
        if (claimBtn) {
          if (_adReady) {
            claimBtn.disabled = false;
            claimBtn.style.cssText = 'flex:2;padding:12px;border-radius:12px;border:none;background:linear-gradient(135deg,var(--gold),var(--gold2));color:#000;font-family:Orbitron,sans-serif;font-size:13px;font-weight:900;letter-spacing:1px;cursor:pointer;animation:pulse 1s ease-in-out infinite;';
            claimBtn.textContent = '🎉 CLAIM +5 CREDITS';
            claimBtn.onclick = claimAdReward;
          } else {
            claimBtn.textContent = left > 0 ? `🔒 ${left}s baad claim karo` : '✅ Claim karo!';
          }
        }
      }

      // Global claim function
      window.claimAdReward = function() {
        if (!_adReady) { showToast('20s poore nahi hue! ⏱', 'red'); return; }
        _cleanupAd();
        const p = document.getElementById('ad-watch-panel');
        if (p) p.remove();
        // Pehle adWatchCount increment karo memory mein
        adWatchCount++;
        spinTokens++;
        freeSpinUsed = true;
        // _ac credits add karta hai aur saveToFirestore call karta hai
        // Ab saveToFirestore mein adWatchCount bhi hai — sab ek saath save hoga
        _ac(5, '📺 Ad Watch Reward');
        updateSpinUI();
        _updateAdBtns('▶ Watch Ad', false);
        showToast('🎉 +5 Credits + Leaderboard +1!', 'green');
      };

      function startTicking() {
        if (_adTicker) return;
        _adTicker = setInterval(() => {
          _adViewed++;
          updatePanel();
          if (_adViewed >= WAIT_SEC) {
            _cleanupAd();
            _adReady = true;
            updatePanel();
          }
        }, 1000);
      }

      _adListener = function() {
        if (document.hidden) {
          startTicking();
        } else {
          if (_adTicker) { clearInterval(_adTicker); _adTicker = null; }
          if (!_adReady) updatePanel();
        }
      };

      document.addEventListener('visibilitychange', _adListener);
      window.open('https://omg10.com/4/11048781', '_blank');
      _updateAdBtns('⏱ Ad chal raha hai...', true);

      setTimeout(() => { if (document.hidden) startTicking(); }, 300);

      return;
    }

    function closeAdModal(event) {
      if (event && event.target !== document.getElementById('ad-modal')) return;
      if (adTimer) clearInterval(adTimer);
      document.getElementById('ad-modal').classList.remove('open');
    }

    function claimAdReward() {
      if (adTimer) clearInterval(adTimer);
      document.getElementById('ad-modal').classList.remove('open');
      // Old modal - unused, no credit given here
    }

    // ==================== SHARE ====================
    function doShare() {
      const todayStr = new Date().toDateString();
      if (serverState.lastShare === todayStr) {
        showToast('Aaj share ho chuka hai! Kal dobara karo 📅', 'red');
        return;
      }
      const text = '🔥 Nexus Hub - Free Prediction App dekho! Live signals, high accuracy.\nhttps://signal-nexushub.github.io/NexusHub/';
      const MIN_SHARE_TIME = 3000; // 3 seconds — itne se kam mein share ho hi nahi sakta

      if (navigator.share) {
        const shareStart = Date.now();
        navigator.share({ title: 'Nexus Hub', text: text })
          .then(() => {
            const timeSpent = Date.now() - shareStart;
            if (timeSpent < MIN_SHARE_TIME) {
              // Bahut jaldi — share nahi kiya
              showToast('Pehle kisi ko actually share karo! 📤', 'red');
            } else {
              // Real share hua — credit do
              serverState.lastShare = todayStr;
              _ac(10, '🔗 App Share Reward');
              updateShareBtnState();
              showToast('Shared! +10 Credits 🎉 (Kal dobara milega)', 'green');
            }
          })
          .catch((err) => {
            if (err.name !== 'AbortError') {
              showToast('Share nahi hua 😅', 'red');
            }
          });
      } else {
        // Clipboard fallback — no credit without actual share
        navigator.clipboard.writeText(text)
          .then(() => showToast('Link copy hua! Kisi ko bhejo — credit share karne ke baad milega 📋', 'green'))
          .catch(() => showToast('Share nahi ho paya 😅', 'red'));
      }
    }

    function updateShareBtnState() {
      const btn = document.getElementById('share-earn-btn');
      if (!btn) return;
      const todayStr = new Date().toDateString();
      if (serverState.lastShare === todayStr) {
        btn.disabled = true;
        btn.style.opacity = '0.35';
        btn.style.cursor = 'not-allowed';
        btn.textContent = '✓ Shared';
      } else {
        btn.disabled = false;
        btn.style.opacity = '1';
        btn.style.cursor = 'pointer';
        btn.textContent = '↗ Share';
      }
    }

    // ==================== INSTAGRAM FOLLOW ====================
    const INSTA_WAIT_SEC = 2;
    let _instaTimer = null;
    let _instaElapsed = 0;
    let _instaOnTab = false;

    function updateInstaBtnState() {
      const btn = document.getElementById('insta-follow-btn');
      const wrap = document.getElementById('insta-timer-wrap');
      if (!btn) return;
      if (serverState.instaFollowed) {
        btn.disabled = true;
        btn.style.opacity = '0.45';
        btn.style.cursor = 'not-allowed';
        btn.textContent = '✓ Followed';
        if (wrap) { wrap.style.display = 'flex'; wrap.textContent = '✅ Credit Claimed'; wrap.style.color = 'rgba(0,255,136,0.6)'; }
      } else {
        btn.disabled = false;
        btn.style.opacity = '1';
        btn.style.cursor = 'pointer';
        btn.textContent = 'Follow';
      }
    }

    function doInstagramFollow() {
      if (serverState.instaFollowed) {
        showToast('Aap pehle hi follow kar chuke ho! Credit life mein ek baar milta hai 📸', 'red');
        return;
      }
      const wrap = document.getElementById('insta-timer-wrap');
      const btn = document.getElementById('insta-follow-btn');
      if (wrap) { wrap.style.display = 'flex'; wrap.textContent = '⏱ Instagram page pe jao, follow karo...'; wrap.style.color = 'rgba(225,48,108,0.7)'; }
      if (_instaTimer) { clearInterval(_instaTimer); _instaTimer = null; }
      _instaElapsed = 0;
      _instaOnTab = false;

      function giveInstaReward() {
        if (serverState.instaFollowed) return;
        if (_instaTimer) { clearInterval(_instaTimer); _instaTimer = null; }
        serverState.instaFollowed = true;
        _ac(5, '📸 Instagram Follow Reward');
        saveToFirestore();
        updateInstaBtnState();
        showToast('Instagram follow reward! +5 Credits 🎉', 'green');
      }

      function instaPoll() {
        const hidden = document.hidden || document.webkitHidden;
        if (hidden) {
          _instaOnTab = true;
          _instaElapsed++;
          const left = Math.max(0, INSTA_WAIT_SEC - _instaElapsed);
          if (wrap) wrap.textContent = `⏱ ${left}s baaki — follow karo aur wapas aao`;
          if (_instaElapsed >= INSTA_WAIT_SEC) { clearInterval(_instaTimer); _instaTimer = null; giveInstaReward(); }
        } else if (_instaOnTab) {
          clearInterval(_instaTimer); _instaTimer = null;
          if (_instaElapsed < INSTA_WAIT_SEC) {
            const left = INSTA_WAIT_SEC - _instaElapsed;
            if (wrap) wrap.textContent = `⏱ ${left}s baaki — wapas Instagram pe jao`;
            showToast(`${left}s baaki hai — Instagram follow karo ⏱`, 'red');
          }
        }
      }

      _instaTimer = setInterval(instaPoll, 1000);
      window.open('https://www.instagram.com/nexus.prediction?igsh=MTNwa3owOG56a29vMQ==', '_blank');
    }

    // ==================== TELEGRAM JOIN ====================
    const TG_WAIT_SEC = 2;
    let _tgTimer = null;
    let _tgElapsed = 0;
    let _tgOnTab = false;

    function updateTgBtnState() {
      const btn = document.getElementById('tg-join-btn');
      const wrap = document.getElementById('tg-timer-wrap');
      if (!btn) return;
      if (serverState.tgJoined) {
        btn.disabled = true;
        btn.style.opacity = '0.45';
        btn.style.cursor = 'not-allowed';
        btn.textContent = '✓ Joined';
        if (wrap) { wrap.style.display = 'flex'; wrap.textContent = '✅ Credit Claimed'; wrap.style.color = 'rgba(0,255,136,0.6)'; }
      } else {
        btn.disabled = false;
        btn.style.opacity = '1';
        btn.style.cursor = 'pointer';
        btn.textContent = 'Join';
      }
    }

    function doTelegramJoin() {
      if (serverState.tgJoined) {
        showToast('Aap pehle hi join kar chuke ho! Credit life mein ek baar milta hai ✈️', 'red');
        return;
      }
      const wrap = document.getElementById('tg-timer-wrap');
      const btn = document.getElementById('tg-join-btn');
      if (wrap) { wrap.style.display = 'flex'; wrap.textContent = '⏱ Telegram channel pe jao, join karo...'; wrap.style.color = 'rgba(41,182,246,0.7)'; }
      if (_tgTimer) { clearInterval(_tgTimer); _tgTimer = null; }
      _tgElapsed = 0;
      _tgOnTab = false;

      function giveTgReward() {
        if (serverState.tgJoined) return;
        if (_tgTimer) { clearInterval(_tgTimer); _tgTimer = null; }
        serverState.tgJoined = true;
        _ac(5, '✈️ Telegram Channel Join Reward');
        saveToFirestore();
        updateTgBtnState();
        showToast('Telegram join reward! +5 Credits 🎉', 'green');
      }

      function tgPoll() {
        const hidden = document.hidden || document.webkitHidden;
        if (hidden) {
          _tgOnTab = true;
          _tgElapsed++;
          const left = Math.max(0, TG_WAIT_SEC - _tgElapsed);
          if (wrap) wrap.textContent = `⏱ ${left}s baaki — channel join karo aur wapas aao`;
          if (_tgElapsed >= TG_WAIT_SEC) { clearInterval(_tgTimer); _tgTimer = null; giveTgReward(); }
        } else if (_tgOnTab) {
          clearInterval(_tgTimer); _tgTimer = null;
          if (_tgElapsed < TG_WAIT_SEC) {
            const left = TG_WAIT_SEC - _tgElapsed;
            if (wrap) wrap.textContent = `⏱ ${left}s baaki — wapas Telegram pe jao`;
            showToast(`${left}s baaki hai — Telegram join karo ⏱`, 'red');
          }
        }
      }

      _tgTimer = setInterval(tgPoll, 1000);
      window.open('https://telegram.me/nexuspredictionss', '_blank');
    }

    function showBuyMenu() {
      const overlay = document.createElement('div');
      overlay.id = 'buy-menu-overlay';
      overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.75);z-index:9999;display:flex;align-items:flex-end;justify-content:center;';
      overlay.innerHTML = `
        <div style="background:#0d0d1a;border:1px solid rgba(255,215,0,0.2);border-radius:20px 20px 0 0;padding:20px;width:100%;max-width:480px;">
          <div style="text-align:center;margin-bottom:4px;">
            <div style="font-family:'Orbitron',sans-serif;font-size:12px;font-weight:700;color:var(--gold);letter-spacing:2px;">👑 BUY VIP PASS</div>
            <div style="font-size:10px;color:rgba(255,45,85,0.8);letter-spacing:1px;font-weight:700;margin-top:4px;animation:pulse 1.5s ease-in-out infinite;">⏰ LIMITED TIME OFFER</div>
          </div>
          <div style="display:flex;flex-direction:column;gap:10px;margin:14px 0 16px;">
            <div onclick="showBuyPopup('vip-1m',99);document.getElementById('buy-menu-overlay').remove();" style="display:flex;align-items:center;justify-content:space-between;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:12px 14px;cursor:pointer;transition:all 0.2s;">
              <div style="display:flex;align-items:center;gap:10px;"><span style="font-size:20px;">🥉</span><div><div style="font-family:'Orbitron',sans-serif;font-size:13px;color:var(--gold);">1 Month VIP</div><div style="font-size:10px;color:rgba(0,255,136,0.7);">∞ Unlimited • 30 days</div></div></div>
              <div style="text-align:right;"><div style="font-size:11px;color:rgba(255,255,255,0.3);text-decoration:line-through;font-family:'Orbitron',sans-serif;">₹199</div><div style="font-family:'Orbitron',sans-serif;font-size:17px;font-weight:900;color:var(--green);">₹99</div></div>
            </div>
            <div onclick="showBuyPopup('vip-3m',199);document.getElementById('buy-menu-overlay').remove();" style="display:flex;align-items:center;justify-content:space-between;background:rgba(0,245,255,0.04);border:1px solid rgba(0,245,255,0.2);border-radius:14px;padding:12px 14px;cursor:pointer;transition:all 0.2s;position:relative;">
              <div style="position:absolute;top:-8px;left:12px;background:var(--neon);color:#000;font-family:'Orbitron',sans-serif;font-size:8px;font-weight:700;padding:2px 8px;border-radius:20px;">🔥 POPULAR</div>
              <div style="display:flex;align-items:center;gap:10px;"><span style="font-size:20px;">🥈</span><div><div style="font-family:'Orbitron',sans-serif;font-size:13px;color:var(--neon);">3 Month VIP</div><div style="font-size:10px;color:rgba(0,255,136,0.7);">∞ Unlimited • 90 days</div></div></div>
              <div style="text-align:right;"><div style="font-size:11px;color:rgba(255,255,255,0.3);text-decoration:line-through;font-family:'Orbitron',sans-serif;">₹599</div><div style="font-family:'Orbitron',sans-serif;font-size:17px;font-weight:900;color:var(--green);">₹199</div></div>
            </div>
            <div onclick="showBuyPopup('vip-1y',699);document.getElementById('buy-menu-overlay').remove();" style="display:flex;align-items:center;justify-content:space-between;background:rgba(255,215,0,0.04);border:1px solid rgba(255,215,0,0.2);border-radius:14px;padding:12px 14px;cursor:pointer;transition:all 0.2s;position:relative;">
              <div style="position:absolute;top:-8px;left:12px;background:var(--gold);color:#000;font-family:'Orbitron',sans-serif;font-size:8px;font-weight:700;padding:2px 8px;border-radius:20px;">👑 BEST VALUE</div>
              <div style="display:flex;align-items:center;gap:10px;"><span style="font-size:20px;">🥇</span><div><div style="font-family:'Orbitron',sans-serif;font-size:13px;color:var(--gold);">1 Year VIP</div><div style="font-size:10px;color:rgba(0,255,136,0.7);">∞ Unlimited • 365 days</div></div></div>
              <div style="text-align:right;"><div style="font-size:11px;color:rgba(255,255,255,0.3);text-decoration:line-through;font-family:'Orbitron',sans-serif;">₹1199</div><div style="font-family:'Orbitron',sans-serif;font-size:17px;font-weight:900;color:var(--green);">₹699</div></div>
            </div>
          </div>
          <button onclick="document.getElementById('buy-menu-overlay').remove()" style="width:100%;padding:12px;border-radius:12px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.05);color:rgba(255,255,255,0.4);font-family:'Rajdhani',sans-serif;font-size:14px;font-weight:700;cursor:pointer;">Cancel</button>
        </div>`;
      overlay.addEventListener('click', e => { if(e.target === overlay) overlay.remove(); });
      document.body.appendChild(overlay);
    }

    // ==================== BUY VIP PASS ====================
    function showBuyPopup(plan, price) {
      const upi = 'preregisterbgmi-1@oksbi';
      // Plan details
      const planMap = {
        'vip-1m': { label: '1 Month VIP Pass', days: 30, orig: 199, icon: '🥉', desc: '30 days • Unlimited Credits' },
        'vip-3m': { label: '3 Month VIP Pass', days: 90, orig: 599, icon: '🥈', desc: '90 days • Unlimited Credits' },
        'vip-1y': { label: '1 Year VIP Pass', days: 365, orig: 1199, icon: '🥇', desc: '365 days • Unlimited Credits' },
      };
      const info = planMap[plan] || { label: plan, days: 30, orig: price, icon: '👑', desc: '' };
      const overlay = document.createElement('div');
      overlay.id = 'buy-overlay';
      overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.8);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;';
      overlay.innerHTML = `
        <div style="background:#0d0d1a;border:1px solid rgba(255,215,0,0.3);border-radius:20px;padding:28px 24px;max-width:340px;width:100%;">
          <div style="text-align:center;margin-bottom:20px;">
            <div style="font-size:36px;margin-bottom:8px;">${info.icon}</div>
            <div style="font-family:'Orbitron',sans-serif;font-size:14px;font-weight:700;color:var(--gold);">${info.label}</div>
            <div style="font-size:12px;color:rgba(0,255,136,0.8);margin-top:4px;font-weight:600;">∞ ${info.desc}</div>
            <div style="display:flex;align-items:center;justify-content:center;gap:10px;margin-top:6px;">
              <div style="font-family:'Orbitron',sans-serif;font-size:14px;color:rgba(255,255,255,0.3);text-decoration:line-through;">₹${info.orig}</div>
              <div style="font-family:'Orbitron',sans-serif;font-size:26px;font-weight:900;color:var(--green);">₹${price}</div>
            </div>
          </div>

          <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:14px;padding:16px;margin-bottom:16px;">
            <div style="font-size:11px;color:rgba(255,255,255,0.3);letter-spacing:2px;margin-bottom:10px;font-family:'Orbitron',sans-serif;">PAYMENT STEPS</div>
            <div style="font-size:13px;color:rgba(255,255,255,0.65);line-height:1.8;">
              1️⃣ UPI se ₹${price} bhejo<br>
              2️⃣ Screenshot lo<br>
              3️⃣ Developer ko Telegram pe bhejo<br>
              4️⃣ VIP Pass code milega ✅
            </div>
          </div>

          <div style="background:rgba(255,215,0,0.05);border:1px solid rgba(255,215,0,0.2);border-radius:12px;padding:14px;margin-bottom:16px;">
            <div style="font-size:11px;color:rgba(255,215,0,0.5);letter-spacing:2px;margin-bottom:8px;font-family:'Orbitron',sans-serif;">UPI ID</div>
            <div style="font-size:15px;font-weight:700;color:white;letter-spacing:0.5px;">${upi}</div>
          </div>

          <div style="display:flex;gap:10px;">
            <button onclick="document.getElementById('buy-overlay').remove()"
              style="flex:1;padding:12px;border-radius:12px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.05);color:rgba(255,255,255,0.5);font-family:'Rajdhani',sans-serif;font-size:14px;font-weight:700;cursor:pointer;">
              Cancel
            </button>
            <a href="https://telegram.dog/NexusXedit" target="_blank"
              onclick="document.getElementById('buy-overlay').remove()"
              style="flex:1;padding:12px;border-radius:12px;border:1px solid rgba(0,136,204,0.4);background:rgba(0,136,204,0.12);color:#29b6f6;font-family:'Rajdhani',sans-serif;font-size:14px;font-weight:700;cursor:pointer;text-decoration:none;display:flex;align-items:center;justify-content:center;gap:6px;">
              ✈️ Contact
            </a>
          </div>
        </div>`;
      document.body.appendChild(overlay);
      overlay.addEventListener('click', e => { if(e.target === overlay) overlay.remove(); });
    }
