// ==================== ADMIN UNLOCK ====================
    let adminTapCount = 0;
    let adminTapTimer = null;
    let adminUnlocked = localStorage.getItem('nx_admin') === 'true';

    function initAdmin() {
      // Admin sirf specific UID ke liye - hardcoded admin UID
      // Pehli baar aap login karo, apna UID console mein dikhega
      const ADMIN_UID = localStorage.getItem('nx_admin_uid') || '';
      const currentUID = window.currentUser ? window.currentUser.uid : '';
      
      if (currentUID && ADMIN_UID && currentUID === ADMIN_UID) {
        adminUnlocked = true;
        const codeBtn = document.getElementById('admin-code-btn');
        if (codeBtn) codeBtn.style.display = 'block';
      } else {
        adminUnlocked = false;
        localStorage.removeItem('nx_admin');
        const codeBtn = document.getElementById('admin-code-btn');
        if (codeBtn) codeBtn.style.display = 'none';
      }
    }

    function adminTap() {
      adminTapCount++;
      clearTimeout(adminTapTimer);
      if (adminTapCount >= 5) {
        adminTapCount = 0;
        showAdminLogin();
      } else {
        adminTapTimer = setTimeout(() => { adminTapCount = 0; }, 2000);
      }
    }

    function showAdminLogin() {
      if (adminUnlocked) {
        const codeBtn = document.getElementById('admin-code-btn');
        if (codeBtn) codeBtn.style.display = codeBtn.style.display === 'none' ? 'block' : 'none';
        return;
      }
      const overlay = document.createElement('div');
      overlay.id = 'admin-login-overlay';
      overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;';
      overlay.innerHTML = `
        <div style="background:#0d0d1a;border:1px solid rgba(123,47,255,0.4);border-radius:20px;padding:28px 24px;max-width:300px;width:100%;text-align:center;">
          <div style="font-size:32px;margin-bottom:12px;">🔐</div>
          <div style="font-family:'Orbitron',sans-serif;font-size:13px;font-weight:700;color:#7B2FFF;letter-spacing:2px;margin-bottom:20px;">ADMIN ACCESS</div>
          <input id="admin-pass-input" type="password" placeholder="Password enter karo"
            style="width:100%;background:rgba(255,255,255,0.05);border:1px solid rgba(123,47,255,0.3);border-radius:12px;padding:12px 14px;color:white;font-size:14px;outline:none;margin-bottom:16px;text-align:center;"/>
          <div style="display:flex;gap:10px;">
            <button onclick="document.getElementById('admin-login-overlay').remove()"
              style="flex:1;padding:12px;border-radius:12px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.05);color:rgba(255,255,255,0.5);font-family:'Rajdhani',sans-serif;font-size:14px;font-weight:700;cursor:pointer;">
              Cancel
            </button>
            <button onclick="checkAdminPass()"
              style="flex:1;padding:12px;border-radius:12px;border:none;background:linear-gradient(135deg,#7B2FFF,#5500cc);color:white;font-family:'Rajdhani',sans-serif;font-size:14px;font-weight:700;cursor:pointer;">
              Enter
            </button>
          </div>
          <div id="admin-pass-msg" style="font-size:12px;color:var(--red);margin-top:10px;display:none;">❌ Wrong password!</div>
        </div>`;
      document.body.appendChild(overlay);
      document.getElementById('admin-pass-input').addEventListener('keydown', e => {
        if (e.key === 'Enter') checkAdminPass();
      });
    }

    function hashPass(str) {
      let h = 0;
      for (let i = 0; i < str.length; i++) {
        h = Math.imul(31, h) + str.charCodeAt(i) | 0;
      }
      return (h >>> 0).toString(16).toUpperCase().padStart(8, '0');
    }

    function checkAdminPass() {
      const pass = document.getElementById('admin-pass-input').value;
      if (hashPass(pass) === '51A79B76') {
        document.getElementById('admin-login-overlay').remove();
        adminUnlocked = true;
        const uid = window.currentUser ? window.currentUser.uid : '';
        localStorage.setItem('nx_admin', 'true');
        localStorage.setItem('nx_admin_uid', uid);
        const codeBtn = document.getElementById('admin-code-btn');
        if (codeBtn) codeBtn.style.display = 'block';
        showToast('✅ Admin mode ON!', 'green');
      } else {
        document.getElementById('admin-pass-msg').style.display = 'block';
      }
    }

    // ==================== CODE GENERATOR (ADMIN ONLY) ====================
    function showCodeGenerator() {
      const overlay = document.createElement('div');
      overlay.id = 'code-gen-overlay';
      overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;overflow-y:auto;';
      overlay.innerHTML = `
        <div style="background:#0d0d1a;border:1px solid rgba(255,215,0,0.35);border-radius:20px;padding:24px 20px;max-width:340px;width:100%;margin:auto;">
          <div style="font-family:'Orbitron',sans-serif;font-size:13px;font-weight:700;color:var(--gold);letter-spacing:2px;margin-bottom:20px;text-align:center;">🎟️ GENERATE CODE</div>

          <!-- Credit Codes -->
          <div style="font-size:11px;color:rgba(255,255,255,0.4);margin-bottom:6px;letter-spacing:1px;">CREDIT CODES:</div>
          <div style="display:flex;gap:8px;margin-bottom:16px;">
            <button onclick="genCode(100)" style="flex:1;padding:10px;border-radius:10px;border:1px solid rgba(255,215,0,0.3);background:rgba(255,215,0,0.08);color:var(--gold);font-family:'Orbitron',sans-serif;font-size:11px;font-weight:700;cursor:pointer;">100</button>
            <button onclick="genCode(400)" style="flex:1;padding:10px;border-radius:10px;border:1px solid rgba(0,245,255,0.3);background:rgba(0,245,255,0.08);color:var(--neon);font-family:'Orbitron',sans-serif;font-size:11px;font-weight:700;cursor:pointer;">400</button>
            <button onclick="genCode(1000)" style="flex:1;padding:10px;border-radius:10px;border:1px solid rgba(255,215,0,0.5);background:rgba(255,215,0,0.12);color:var(--gold);font-family:'Orbitron',sans-serif;font-size:11px;font-weight:700;cursor:pointer;">1000</button>
          </div>

          <!-- VIP Pass Codes -->
          <div style="font-size:11px;color:rgba(255,215,0,0.6);margin-bottom:6px;letter-spacing:1px;font-weight:700;">👑 VIP PASS CODES:</div>
          <div style="display:flex;gap:8px;margin-bottom:16px;">
            <button onclick="genVipCode('VIP-1M')" style="flex:1;padding:9px 4px;border-radius:10px;border:1px solid rgba(255,215,0,0.35);background:rgba(255,215,0,0.1);color:var(--gold);font-family:'Orbitron',sans-serif;font-size:9px;font-weight:700;cursor:pointer;line-height:1.3;">1M<br><span style="font-size:8px;opacity:0.7;">30 days</span></button>
            <button onclick="genVipCode('VIP-3M')" style="flex:1;padding:9px 4px;border-radius:10px;border:1px solid rgba(0,245,255,0.35);background:rgba(0,245,255,0.08);color:var(--neon);font-family:'Orbitron',sans-serif;font-size:9px;font-weight:700;cursor:pointer;line-height:1.3;">3M<br><span style="font-size:8px;opacity:0.7;">90 days</span></button>
            <button onclick="genVipCode('VIP-1Y')" style="flex:1;padding:9px 4px;border-radius:10px;border:1px solid rgba(255,215,0,0.6);background:rgba(255,215,0,0.15);color:var(--gold);font-family:'Orbitron',sans-serif;font-size:9px;font-weight:700;cursor:pointer;line-height:1.3;">1Y<br><span style="font-size:8px;opacity:0.7;">365 days</span></button>
          </div>

          <div id="gen-result" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:16px;margin-bottom:16px;text-align:center;display:none;">
            <div style="font-size:11px;color:rgba(255,255,255,0.3);letter-spacing:2px;margin-bottom:8px;">GENERATED CODE</div>
            <div id="gen-code-text" style="font-family:'Orbitron',sans-serif;font-size:14px;font-weight:900;color:var(--gold);letter-spacing:1px;word-break:break-all;"></div>
            <button id="gen-copy-btn" onclick="copyGenCode()" style="margin-top:12px;padding:8px 20px;border-radius:10px;border:1px solid rgba(255,215,0,0.3);background:rgba(255,215,0,0.1);color:var(--gold);font-family:'Rajdhani',sans-serif;font-size:13px;font-weight:700;cursor:pointer;">📋 Copy</button>
          </div>

          <button onclick="document.getElementById('code-gen-overlay').remove()"
            style="width:100%;padding:12px;border-radius:12px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.05);color:rgba(255,255,255,0.5);font-family:'Rajdhani',sans-serif;font-size:14px;font-weight:700;cursor:pointer;">
            Close
          </button>
        </div>`;
      document.body.appendChild(overlay);
    }

    function genVipCode(plan) {
      const code = generateAdminVipCode(plan);
      document.getElementById('gen-result').style.display = 'block';
      document.getElementById('gen-code-text').textContent = code;
      document.getElementById('gen-copy-btn').textContent = '📋 Copy';
    }

    function genCode(credits) {
      const code = generateAdminCode(credits);
      document.getElementById('gen-result').style.display = 'block';
      document.getElementById('gen-code-text').textContent = code;
      document.getElementById('gen-copy-btn').textContent = '📋 Copy';
    }

    function copyGenCode() {
      const code = document.getElementById('gen-code-text').textContent;
      navigator.clipboard.writeText(code).then(() => {
        document.getElementById('gen-copy-btn').textContent = '✅ Copied!';
      });
    }

    // ==================== REDEEM CODE SYSTEM ====================
    // Secret codes — admin generates these
    // Format: NEXUS-{CREDITS}-{RANDOM4}
    // Codes are stored in localStorage after use (to prevent reuse)

    // ==================== CODE SECURITY SYSTEM ====================
    // Secret key — multi-layer obfuscated, runtime mein reconstruct hota hai
    // 4 parts ko XOR + reverse ke saath combine kiya — DevTools mein directly readable nahi
    const _s1 = [78,88,50,48,50,52];          // part A
    const _s2 = [74,65,76,87,65,57,51];        // part B (reversed)
    const _s3 = [0x4e,0x58,0x53,0x45,0x43];   // part C (hex)
    const _s4 = [113,105,108,109,110,107];     // part D (XOR'd with 1)
    function _ks() {
      const a = _s1.map(c => String.fromCharCode(c)).join('');
      const b = _s2.map(c => String.fromCharCode(c)).reverse().join('');
      const c = _s3.map(c => String.fromCharCode(c ^ 0x01)).join('');
      const d = _s4.map(c => String.fromCharCode(c ^ 1)).join('');
      return a + b + c + d;
    }

    // Strong hash — FNV-1a 32-bit, much better avalanche than djb2
    function _fnv32(str) {
      let h = 0x811c9dc5;
      for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 0x01000193) >>> 0;
      }
      return h;
    }

    // Double-round hash — run FNV-1a twice with different salt to increase entropy
    function generateCodeHash(credits, r2) {
      const secret = _ks();
      const round1 = _fnv32(credits + '||' + r2 + '||' + secret);
      const round2 = _fnv32(secret + '||' + round1.toString(16) + '||' + r2);
      // Take 4 chars from base-36 — gives 36^4 = 1,679,616 combinations
      return ((round1 ^ round2) >>> 0).toString(36).toUpperCase().padStart(6, '0').substring(0, 4);
    }

    function generateVipCodeHash(plan, r2) {
      const secret = _ks();
      const round1 = _fnv32('VIP||' + plan + '||' + r2 + '||' + secret);
      const round2 = _fnv32(secret + '||' + plan + '||' + round1.toString(16));
      return ((round1 ^ round2) >>> 0).toString(36).toUpperCase().padStart(6, '0').substring(0, 4);
    }

    function isValidCode(credits, random4) {
      if (!random4 || random4.length !== 4) return false;
      const r2 = random4.substring(0, 2);
      const h2 = random4.substring(2, 4);
      const expected = generateCodeHash(credits, r2).substring(0, 2);
      // Constant-time comparison (anti-timing attack)
      if (h2.length !== expected.length) return false;
      let diff = 0;
      for (let i = 0; i < h2.length; i++) diff |= h2.charCodeAt(i) ^ expected.charCodeAt(i);
      return diff === 0;
    }

    function isValidVipCode(plan, random4) {
      if (!random4 || random4.length !== 4) return false;
      const r2 = random4.substring(0, 2);
      const h2 = random4.substring(2, 4);
      const expected = generateVipCodeHash(plan, r2).substring(0, 2);
      let diff = 0;
      for (let i = 0; i < h2.length; i++) diff |= h2.charCodeAt(i) ^ expected.charCodeAt(i);
      return diff === 0;
    }

    function generateAdminVipCode(plan) {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let r2 = '';
      for (let i = 0; i < 2; i++) r2 += chars[Math.floor(Math.random() * chars.length)];
      const h4 = generateVipCodeHash(plan, r2);
      const h2 = h4.substring(0, 2);
      return 'NEXUS-' + plan + '-' + r2 + h2;
    }

    function generateAdminCode(credits) {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let r2 = '';
      for (let i = 0; i < 2; i++) r2 += chars[Math.floor(Math.random() * chars.length)];
      const h4 = generateCodeHash(credits, r2);
      const h2 = h4.substring(0, 2);
      return 'NEXUS-' + credits + '-' + r2 + h2;
    }

    async function redeemCode() {
      const input = document.getElementById('redeem-input');
      const msgEl = document.getElementById('redeem-msg');
      const redeemBtn = document.querySelector('[onclick="redeemCode()"]');
      const code = (input.value || '').trim().toUpperCase();

      function showMsg(text, color) {
        msgEl.style.display = 'block';
        msgEl.style.color = color === 'green' ? 'var(--green)' : color === 'red' ? 'var(--red)' : 'var(--gold)';
        msgEl.textContent = text;
      }

      if (!code) { showMsg('Code enter karo!', 'red'); return; }

      // VIP Pass code format: NEXUS-VIP-1M-XXXX / NEXUS-VIP-3M-XXXX / NEXUS-VIP-1Y-XXXX
      const vipMatch = code.match(/^NEXUS-(VIP-(?:1M|3M|1Y))-([A-Z0-9]{4})$/);
      if (vipMatch) {
        const vipPlan = vipMatch[1]; // e.g. 'VIP-1M'
        const vipRand = vipMatch[2];

        // Validate VIP code hash
        if (!isValidVipCode(vipPlan, vipRand)) {
          showMsg('❌ Invalid ya expired VIP code!', 'red'); return;
        }

        if (redeemBtn) { redeemBtn.disabled = true; redeemBtn.textContent = 'Checking...'; }
        showMsg('⏳ VIP Pass verify ho raha hai...', 'gold');

        try {
          const globalRef = window.fbDoc(window.fbDb, 'redeemedCodes', code);
          const globalSnap = await window.fbGetDoc(globalRef);
          if (globalSnap.exists()) {
            showMsg('❌ Yeh VIP code already use ho chuka hai!', 'red');
            if (redeemBtn) { redeemBtn.disabled = false; redeemBtn.textContent = 'REDEEM'; }
            return;
          }
          // Mark globally used
          await window.fbSetDoc(globalRef, {
            usedBy: window.currentUser.uid,
            usedByEmail: window.currentUser.email || '',
            usedAt: new Date().toISOString(),
            type: 'vip',
            plan: vipPlan
          });
          // Activate VIP
          serverState.usedCodes.push(code);
          const planName = await activateVipPass(vipPlan, code);
          input.value = '';
          showMsg(`✅ ${planName} VIP Pass active ho gaya! 👑 Unlimited credits!`, 'green');
          showToast(`👑 VIP Pass active! ${vipState.daysLeft} days unlimited credits!`, 'green');
          setTimeout(() => { msgEl.style.display = 'none'; }, 5000);
        } catch(e) {
          showMsg('❌ Network error, dobara try karo', 'red');
          console.error('VIP Redeem error:', e);
        } finally {
          if (redeemBtn) { redeemBtn.disabled = false; redeemBtn.textContent = 'REDEEM'; }
        }
        return;
      }

      // Normal credit code format: NEXUS-{CREDITS}-XXXX
      const parts = code.split('-');
      if (parts.length !== 3 || parts[0] !== 'NEXUS') {
        showMsg('❌ Invalid code format!', 'red'); return;
      }

      const codeCredits = parseInt(parts[1]);
      const random4 = parts[2];

      if (isNaN(codeCredits) || codeCredits <= 0) {
        showMsg('❌ Invalid code!', 'red'); return;
      }

      // Hash validation
      if (random4.length !== 4 || !isValidCode(codeCredits, random4)) {
        showMsg('❌ Invalid ya expired code!', 'red'); return;
      }

      // Loading state
      if (redeemBtn) { redeemBtn.disabled = true; redeemBtn.textContent = 'Checking...'; }
      showMsg('⏳ Verify ho raha hai...', 'gold');

      try {
        // GLOBAL check — Firestore mein dekho koi aur account pe use hua ya nahi
        const globalRef = window.fbDoc(window.fbDb, 'redeemedCodes', code);
        const globalSnap = await window.fbGetDoc(globalRef);

        if (globalSnap.exists()) {
          showMsg('❌ Yeh code already use ho chuka hai!', 'red');
          if (redeemBtn) { redeemBtn.disabled = false; redeemBtn.textContent = 'REDEEM'; }
          return;
        }

        // Code valid aur unused — global mark karo
        await window.fbSetDoc(globalRef, {
          usedBy: window.currentUser.uid,
          usedByEmail: window.currentUser.email || '',
          usedAt: new Date().toISOString(),
          credits: codeCredits
        });

        // User ke record mein bhi save karo
        serverState.usedCodes.push(code);
        _ac(codeCredits, '🎟️ Code Redeemed: ' + code);
        input.value = '';
        showMsg('✅ ' + codeCredits + ' Credits mil gaye!', 'green');
        setTimeout(() => { msgEl.style.display = 'none'; }, 3000);

      } catch(e) {
        showMsg('❌ Network error, dobara try karo', 'red');
        console.error('Redeem error:', e);
      } finally {
        if (redeemBtn) { redeemBtn.disabled = false; redeemBtn.textContent = 'REDEEM'; }
      }
    }

    // ==================== LUCKY SPIN ====================
    const SPIN_SEGMENTS = [
      { label: '5',    credits: 5,    color: '#FF2D55', prob: 42.9 },
      { label: '10',   credits: 10,   color: '#FF6B35', prob: 30.0 },
      { label: '20',   credits: 20,   color: '#FFD700', prob: 18.0 },
      { label: '50',   credits: 50,   color: '#00F5FF', prob: 7.0  },
      { label: '100',  credits: 100,  color: '#7B2FFF', prob: 2.0  },
      { label: '1000', credits: 1000, color: '#00FF88', prob: 0.1  },
    ];
    let currentWheelAngle = 0;

    function drawWheel(angle) {
      const canvas = document.getElementById('spin-canvas');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const cx = canvas.width / 2, cy = canvas.height / 2;
      const r = cx - 4;
      const total = SPIN_SEGMENTS.length;
      const sliceAngle = (2 * Math.PI) / total;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      SPIN_SEGMENTS.forEach((seg, i) => {
        const startAngle = angle + i * sliceAngle;
        const endAngle = startAngle + sliceAngle;

        // Segment fill
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, r, startAngle, endAngle);
        ctx.closePath();
        ctx.fillStyle = seg.color;
        ctx.fill();

        // Segment border
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, r, startAngle, endAngle);
        ctx.closePath();
        ctx.strokeStyle = 'rgba(0,0,0,0.35)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Text
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(startAngle + sliceAngle / 2);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#fff';
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 6;

        // Credit emoji
        ctx.font = 'bold 13px Orbitron, sans-serif';
        ctx.fillText('🪙', r - 14, 5);

        // Credit number
        const fontSize = seg.label.length > 3 ? 12 : 15;
        ctx.font = `900 ${fontSize}px Orbitron, sans-serif`;
        ctx.fillText(seg.label, r - 28, 5);

        ctx.restore();
      });

      // Outer ring
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, 2 * Math.PI);
      ctx.strokeStyle = 'rgba(255,215,0,0.5)';
      ctx.lineWidth = 4;
      ctx.stroke();
    }

    function initWheel() {
      currentWheelAngle = -Math.PI / 2; // start from top
      drawWheel(currentWheelAngle);
    }

    function updateSpinUI() {
      const display = document.getElementById('spin-token-display');
      const sub = document.getElementById('spin-token-sub');
      const badge = document.getElementById('spin-badge');
      const fabBadge = document.getElementById('spin-fab-badge');
      const fabBtn = document.getElementById('spin-fab-btn');
      const fabIcon = document.getElementById('spin-fab-icon');
      const btn = document.getElementById('spin-btn');
      const watchAdBtn = document.getElementById('spin-watch-ad-btn');
      const msg = document.getElementById('spin-msg');

      if (display) display.textContent = spinTokens;
      if (sub) sub.textContent = spinTokens > 0 ? 'READY TO SPIN' : 'NO TOKENS';

      if (badge) { badge.textContent = spinTokens; badge.style.display = spinTokens > 0 ? 'inline' : 'none'; }
      if (fabBadge) { fabBadge.textContent = spinTokens; fabBadge.style.display = spinTokens > 0 ? 'inline' : 'none'; }
      if (fabBtn) {
        if (spinTokens > 0) { fabBtn.classList.add('has-tokens'); if (fabIcon) fabIcon.style.animation = 'spinFabRotate 2s linear infinite'; }
        else { fabBtn.classList.remove('has-tokens'); if (fabIcon) fabIcon.style.animation = 'none'; }
      }

      if (spinTokens > 0) {
        if (btn) { btn.disabled = false; btn.style.opacity = '1'; btn.style.cursor = 'pointer'; btn.textContent = '🎰 SPIN NOW'; }
        if (watchAdBtn) watchAdBtn.style.display = 'none';
        if (msg) { msg.textContent = spinTokens + ' spin' + (spinTokens > 1 ? 's' : '') + ' available'; msg.style.color = 'rgba(0,255,136,0.6)'; }
      } else {
        if (btn) { btn.disabled = true; btn.style.opacity = '0.35'; btn.style.cursor = 'not-allowed'; btn.textContent = '🎰 SPIN NOW'; }
        if (watchAdBtn) watchAdBtn.style.display = 'block';
        if (msg) { msg.textContent = 'Ad dekho aur spin token pao! 🎯'; msg.style.color = 'rgba(255,165,0,0.6)'; }
      }
    }

    function getSpinResult() {
      const rand = Math.random() * 100;
      let cumulative = 0;
      for (const seg of SPIN_SEGMENTS) {
        cumulative += seg.prob;
        if (rand < cumulative) return seg;
      }
      return SPIN_SEGMENTS[0];
    }

    function doSpin() {
      if (spinAnimating || spinTokens <= 0) return;
      spinAnimating = true;
      spinTokens--;
      if (!freeSpinUsed) freeSpinUsed = true;

      const btn = document.getElementById('spin-btn');
      const msg = document.getElementById('spin-msg');
      const canvas = document.getElementById('spin-canvas');
      if (btn) { btn.disabled = true; btn.textContent = '🎰 Spinning...'; }
      if (msg) { msg.textContent = 'Good luck! 🍀'; msg.style.color = 'var(--gold)'; }

      const prize = getSpinResult();
      const prizeIndex = SPIN_SEGMENTS.indexOf(prize);
      const sliceAngle = (2 * Math.PI) / SPIN_SEGMENTS.length;

      // Calculate target angle - pointer at top (angle = 0), target segment center at top
      const extraRotations = (5 + Math.floor(Math.random() * 5)) * 2 * Math.PI;
      const targetSegmentCenter = prizeIndex * sliceAngle + sliceAngle / 2;
      const targetAngle = extraRotations - targetSegmentCenter - Math.PI / 2;

      // Animate with requestAnimationFrame
      const duration = 4000;
      const startTime = performance.now();
      const startAngle = currentWheelAngle;

      function animate(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        const angle = startAngle + (targetAngle - startAngle) * eased;
        currentWheelAngle = angle;
        drawWheel(angle);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          // Done!
          spinAnimating = false;
          currentWheelAngle = angle;
          _ac(prize.credits, '🎰 Lucky Spin: +' + prize.credits + ' Credits');
          saveToFirestore();
          updateSpinUI();

          // Result popup
          const overlay = document.createElement('div');
          overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.8);backdrop-filter:blur(8px);z-index:9999;display:flex;align-items:center;justify-content:center;';
          overlay.innerHTML = `
            <div style="background:linear-gradient(135deg,#1a0a2e,#0d0818);border:1px solid ${prize.color};border-radius:24px;padding:36px 28px;text-align:center;max-width:300px;width:90%;box-shadow:0 0 60px ${prize.color}40,0 20px 60px rgba(0,0,0,0.5);">
              <div style="font-size:52px;margin-bottom:12px;">🎉</div>
              <div style="font-family:'Orbitron',sans-serif;font-size:11px;color:rgba(255,255,255,0.4);letter-spacing:3px;margin-bottom:8px;">YOU WON</div>
              <div style="font-family:'Orbitron',sans-serif;font-size:52px;font-weight:900;color:${prize.color};line-height:1;text-shadow:0 0 30px ${prize.color}80;">+${prize.credits}</div>
              <div style="font-family:'Orbitron',sans-serif;font-size:14px;color:var(--gold);letter-spacing:2px;margin-top:6px;">CREDITS</div>
              <div style="height:1px;background:rgba(255,255,255,0.08);margin:20px 0;"></div>
              <button onclick="this.closest('div[style*=fixed]').remove()" style="width:100%;padding:13px;border-radius:12px;border:none;background:linear-gradient(135deg,${prize.color},${prize.color}99);color:#000;font-family:'Orbitron',sans-serif;font-size:12px;font-weight:900;letter-spacing:2px;cursor:pointer;">
                🎰 AWESOME!
              </button>
            </div>`;
          document.body.appendChild(overlay);
          setTimeout(() => overlay.remove(), 4000);
        }
      }
      requestAnimationFrame(animate);
    }

    // Spin Ad Modal
    let spinAdTimer = null;
    const SPIN_AD_DURATION = 20;
    let _spinAdWatching = false;
    let _spinAdListener = null;

    function openSpinAdModal() {
      // Cleanup any previous session
      _spinAdWatching = false;
      if (spinAdTimer) { clearInterval(spinAdTimer); spinAdTimer = null; }
      if (_spinAdListener) { document.removeEventListener('visibilitychange', _spinAdListener); _spinAdListener = null; }

      let elapsed = 0;
      let isOnAdTab = false;

      const overlay = document.createElement('div');
      overlay.id = 'spin-ad-overlay';
      overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);backdrop-filter:blur(8px);z-index:9999;display:flex;align-items:flex-end;justify-content:center;';
      overlay.innerHTML = `
        <div style="width:100%;max-width:480px;background:#0d0818;border:1px solid rgba(0,245,255,0.2);border-radius:24px 24px 0 0;padding:24px 20px 40px;">
          <div style="width:36px;height:4px;background:rgba(255,255,255,0.1);border-radius:2px;margin:0 auto 20px;"></div>
          <div style="font-family:'Orbitron',sans-serif;font-size:13px;font-weight:700;color:var(--neon);letter-spacing:2px;text-align:center;margin-bottom:20px;">📺 WATCH AD · GET SPIN TOKEN</div>
          <div style="background:rgba(0,245,255,0.05);border:1px solid rgba(0,245,255,0.15);border-radius:16px;padding:28px;text-align:center;margin-bottom:16px;">
            <div style="font-size:36px;margin-bottom:10px;">🎰</div>
            <div style="font-size:14px;color:rgba(255,255,255,0.6);">Ad poora dekho aur<br/>1 Spin Token pao!</div>
          </div>
          <div style="background:rgba(255,255,255,0.04);border-radius:10px;height:6px;overflow:hidden;margin-bottom:8px;">
            <div id="spin-ad-bar" style="height:100%;width:0%;background:linear-gradient(90deg,var(--neon),#0088ff);border-radius:10px;transition:width 0.2s linear;"></div>
          </div>
          <div id="spin-ad-label" style="text-align:center;font-size:11px;color:rgba(255,255,255,0.3);margin-bottom:16px;">0s / ${SPIN_AD_DURATION}s</div>
          <button id="spin-ad-claim-btn" style="width:100%;padding:14px;border-radius:14px;border:1px solid rgba(0,245,255,0.3);background:rgba(0,245,255,0.08);color:var(--neon);font-family:'Orbitron',sans-serif;font-size:12px;font-weight:700;letter-spacing:2px;cursor:not-allowed;opacity:0.4;">Pehle poora dekho...</button>
        </div>`;
      document.body.appendChild(overlay);

      const getBtn = () => document.getElementById('spin-ad-claim-btn');
      const getBar = () => document.getElementById('spin-ad-bar');
      const getLabel = () => document.getElementById('spin-ad-label');

      function setRetryMode() {
        const left = SPIN_AD_DURATION - elapsed;
        const btn = getBtn();
        if (getLabel()) getLabel().textContent = `⏱ ${left}s baaki`;
        if (btn) {
          btn.disabled = false;
          btn.style.opacity = '1';
          btn.style.cursor = 'pointer';
          btn.textContent = '📺 Dobara Ad Dekho';
          btn.style.background = 'rgba(255,165,0,0.15)';
          btn.style.borderColor = 'rgba(255,165,0,0.4)';
          btn.style.color = 'var(--gold)';
          btn.onclick = function() {
            elapsed = 0;
            isOnAdTab = false;
            btn.disabled = true;
            btn.style.opacity = '0.4';
            btn.style.cursor = 'not-allowed';
            btn.textContent = 'Pehle poora dekho...';
            btn.style.background = 'rgba(0,245,255,0.08)';
            btn.style.borderColor = 'rgba(0,245,255,0.3)';
            btn.style.color = 'var(--neon)';
            btn.onclick = null;
            window.open('https://omg10.com', '_blank');
            // Polling dobara start karo
            if (spinAdTimer) { clearInterval(spinAdTimer); spinAdTimer = null; }
            spinAdTimer = setInterval(pollFn, 1000);
          };
        }
      }

      function setClaimMode() {
        const btn = getBtn();
        if (spinAdTimer) { clearInterval(spinAdTimer); spinAdTimer = null; }
        _spinAdWatching = true;
        if (getBar()) getBar().style.width = '100%';
        if (getLabel()) getLabel().textContent = '✅ Claim karo!';
        if (btn) {
          btn.disabled = false;
          btn.style.opacity = '1';
          btn.style.cursor = 'pointer';
          btn.textContent = '🎰 Claim Spin Token!';
          btn.style.background = 'rgba(0,245,255,0.18)';
          btn.style.borderColor = 'rgba(0,245,255,0.3)';
          btn.style.color = 'var(--neon)';
          btn.onclick = claimSpinAd;
        }
      }

      // Polling function - named taaki restart ho sake
      function pollFn() {
        const hidden = document.hidden || document.webkitHidden;
        if (hidden && !isOnAdTab) isOnAdTab = true;
        if (hidden) {
          elapsed++;
          const pct = Math.min((elapsed / SPIN_AD_DURATION) * 100, 100);
          if (getBar()) getBar().style.width = pct + '%';
          if (getLabel()) getLabel().textContent = elapsed + 's / ' + SPIN_AD_DURATION + 's';
          if (elapsed >= SPIN_AD_DURATION) setClaimMode();
        } else if (isOnAdTab) {
          if (elapsed < SPIN_AD_DURATION) {
            clearInterval(spinAdTimer);
            spinAdTimer = null;
            setRetryMode();
          }
        }
      }

      spinAdTimer = setInterval(pollFn, 1000);

      // Ad kholo
      window.open('https://omg10.com', '_blank');
    }

    function claimSpinAd() {
      if (!_spinAdWatching) {
        console.warn('Ad poora dekho pehle!');
        return;
      }
      if (spinAdTimer) { clearInterval(spinAdTimer); spinAdTimer = null; }
      if (_spinAdListener) { document.removeEventListener('visibilitychange', _spinAdListener); _spinAdListener = null; }
      _spinAdWatching = false;
      const overlay = document.getElementById('spin-ad-overlay');
      if (overlay) overlay.remove();
      spinTokens++;
      adWatchCount++;
      // _ac credits add karta hai aur saveToFirestore call karta hai
      // saveToFirestore mein adWatchCount bhi hai — sab ek saath save hoga
      _ac(5, '📺 Spin Ad Watch Reward');
      updateSpinUI();
      showToast('+1 Spin Token + 5 Credits! 🎰', 'green');
    }
