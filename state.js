// ==================== CONFIG ====================
    const BOT_TOKEN = "8832791200:AAH04nOTrPDbeSAinaHtX7oersZhjMz0sr4";
    const CHANNEL = "@tgvilenxedit";
    const AD_DURATION = 15; // seconds for ad timer

    // ==================== STATE ====================
    let allPredictions = [];
    let results = {};
    let updateOffset = null;
    let isFirstLoad = true;
    let newCount = 0;
    let confFilter = 0;
    let notifLog = [];
    let currentTab = 'signals';
    let predictionsRunning = true;
    let unlockedCards = new Set();
    let credits = 0;
    let spinTokens = 0;
    let freeSpinUsed = false;
    let spinAnimating = false; // starting credits
    let transactions = [];
    let adTimer = null;
    let adEligible = true;
    let lastAdTime = 0;
    const AD_COOLDOWN = 60 * 1000; // 1 min cooldown between ads

    // VIP Pass state
    let vipState = {
      active: false,
      plan: '',       // 'vip-1m', 'vip-3m', 'vip-1y'
      startDate: '',  // ISO string
      endDate: '',    // ISO string
      daysLeft: 0
    };

    // Ad Watch Leaderboard
    let adWatchCount = 0; // Current week ka count
