(() => {
  const MAX_TURNS = 6;
  const AI_STORAGE_KEY = 'rizz_lab_ai_cfg';
  const PROGRESS_KEY = 'rizz_lab_progress_v3';
  const USER_PROFILE_KEY = 'rizz_lab_user_profile_v4';
  const CUSTOM_GIRLS_KEY = 'rizz_lab_custom_girls_v4';

  const ACHIEVEMENTS = [
    { id: 'first_win', icon: '💘', name: 'Первый контакт', desc: 'Покори свою первую девушку' },
    { id: 'hardcore_win', icon: '👑', name: 'Покоритель Хардкора', desc: 'Закадри девушку сложности Хардкор' },
    { id: 's_rank', icon: '🌟', name: 'S-Ранг', desc: 'Набери 88+ Индекса Харизмы за диалог' },
    { id: 'combo_3', icon: '🔥', name: 'В потоке', desc: 'Собери комбо x3 из сильных сообщений подряд' },
    { id: 'sniper', icon: '🎯', name: 'Снайпер анкеты', desc: 'Попади в 2+ интереса из анкеты в одном сообщении' },
    { id: 'blitz_win', icon: '⚡', name: 'Молниеносный', desc: 'Выиграй диалог в Блиц-режиме на таймере' },
    { id: 'collector_5', icon: '💎', name: 'Сердцеед', desc: 'Покори 5 разных девушек' },
    { id: 'collector_12', icon: '🏆', name: 'Мастер Rizz', desc: 'Покори 12 разных девушек' }
  ];

  const MEME_STICKERS = [
    { label: '🐱 Кот с цветами', text: '🌷 (отправил мем: кот держит букет для тебя)' },
    { label: '😎 Сигма-улыбка', text: '😎 (отправил стикер: уверенный взгляд)' },
    { label: '🎮 Погнали в катку', text: '🎮 (отправил мем: «бросай всё, го в кооп»)' },
    { label: '☕ Зову на раф', text: '☕ (отправил стикер: горячий кофе и два билета)' },
    { label: '😂 АХАХА жиза', text: '😂 (отправил мем: смеётся до слёз)' }
  ];

  const OPENER_CASES = [
    {
      tag: 'КОФЕЙНЯ',
      title: 'Девушка в наушниках выбирает раф',
      desc: 'Она стоит у стойки в оверсайз-худи, на ноутбуке стикеры из аниме. Ты стоишь за ней.',
      keywords: ['кофе', 'раф', 'музык', 'трек', 'аниме', 'стикер', 'ноут', 'худи']
    },
    {
      tag: 'STEAM / DISCORD',
      title: 'Тиммейтка в лобби CS2 / Valorant',
      desc: 'Вы только что затащили катку 13:11, она на первом месте в табе и смеётся в войсе.',
      keywords: ['катка', 'таб', 'эйс', 'тиммейт', 'стим', 'дискорд', 'кс', 'валорант', 'дуо']
    },
    {
      tag: 'TIKTOK / СОЦСЕТИ',
      title: 'Девушка выложила эстетичный рилс',
      desc: 'В комментариях куча банальных «красотка 🔥». Нужно написать в личку так, чтобы она ответила.',
      keywords: ['вайб', 'монтаж', 'трек', 'рилс', 'тикток', 'сняла', 'идея', 'стиль']
    },
    {
      tag: 'ПРОГУЛКА / СКЕЙТПАРК',
      title: 'Блондинка сидит на лавочке со скейтом',
      desc: 'Вечер, закат, рядом стоит стакан бабл-ти. Смотрит в телефон.',
      keywords: ['скейт', 'бабл', 'закат', 'трюк', 'доск', 'вечер', 'прогул']
    }
  ];

  const state = {
    persona: null,
    sympathy: 35,
    turn: 0,
    combo: 0,
    wingmanLeft: 2,
    isBlitz: false,
    freeplay: false,
    blitzSeconds: 18,
    blitzTimerId: null,
    history: [],
    messageLogs: [],
    usedReplies: new Set(),
    lastTopic: null,
    isTyping: false,
    ended: false,
    diffFilter: 'all',
    searchQuery: '',
    openerIdx: 0,
    lastReport: null,
    aiConfig: loadJson(AI_STORAGE_KEY, null),
    userProfile: loadJson(USER_PROFILE_KEY, {
      avatar: '😎',
      name: 'Тимур',
      age: 20,
      work: 'Учусь и мучу проекты',
      bio: 'Люблю ночной город, игры в Steam, хороший юмор и движ',
      interests: ['genshin', 'resident evil 6', 'аниме', 'кофе', 'steam'],
      style: 'Уверенный'
    }),
    customGirls: loadJson(CUSTOM_GIRLS_KEY, []),
    progress: loadJson(PROGRESS_KEY, { conquered: [], bestScores: {}, achievements: [], logs: [] })
  };

  // Merge saved custom girls into window.PERSONAS
  if (Array.isArray(state.customGirls) && state.customGirls.length > 0) {
    window.PERSONAS = [...state.customGirls, ...window.PERSONAS];
  }

  const screens = {
    select: document.getElementById('selectScreen'),
    myprofile: document.getElementById('myprofileScreen'),
    blitz: document.getElementById('blitzScreen'),
    openers: document.getElementById('openersScreen'),
    history: document.getElementById('historyScreen'),
    achievements: document.getElementById('achievementsScreen'),
    chat: document.getElementById('chatScreen'),
    report: document.getElementById('reportScreen')
  };

  const el = {
    mainTabs: document.getElementById('mainTabs'),
    confettiCanvas: document.getElementById('confettiCanvas'),
    toastContainer: document.getElementById('toastContainer'),
    dailyBanner: document.getElementById('dailyBanner'),
    dailyTitle: document.getElementById('dailyTitle'),
    dailyAcceptBtn: document.getElementById('dailyAcceptBtn'),
    playerRankText: document.getElementById('playerRankText'),
    conqueredCount: document.getElementById('conqueredCount'),
    soundBtn: document.getElementById('soundBtn'),
    backHomeBtn: document.getElementById('backHomeBtn'),
    randomMatchBtn: document.getElementById('randomMatchBtn'),
    openCustomGirlBtn: document.getElementById('openCustomGirlBtn'),
    personasGrid: document.getElementById('personasGrid'),
    difficultyFilters: document.getElementById('difficultyFilters'),
    searchInput: document.getElementById('searchInput'),

    // My profile
    myProfileForm: document.getElementById('myProfileForm'),
    myAvatarPicker: document.getElementById('myAvatarPicker'),
    myNameInput: document.getElementById('myNameInput'),
    myAgeInput: document.getElementById('myAgeInput'),
    myWorkInput: document.getElementById('myWorkInput'),
    myBioInput: document.getElementById('myBioInput'),
    myInterestsInput: document.getElementById('myInterestsInput'),
    myStyleSelect: document.getElementById('myStyleSelect'),

    // Openers
    openerSituationTag: document.getElementById('openerSituationTag'),
    openerTargetName: document.getElementById('openerTargetName'),
    openerTargetDesc: document.getElementById('openerTargetDesc'),
    nextOpenerCaseBtn: document.getElementById('nextOpenerCaseBtn'),
    openerTestForm: document.getElementById('openerTestForm'),
    openerTestInput: document.getElementById('openerTestInput'),
    openerResultBox: document.getElementById('openerResultBox'),

    // History & Ach
    statsSummaryGrid: document.getElementById('statsSummaryGrid'),
    historyList: document.getElementById('historyList'),
    clearHistoryBtn: document.getElementById('clearHistoryBtn'),
    achGrid: document.getElementById('achGrid'),

    // Custom Girl Modal
    customGirlModal: document.getElementById('customGirlModal'),
    cgNameInput: document.getElementById('cgNameInput'),
    cgDiffInput: document.getElementById('cgDiffInput'),
    cgBioInput: document.getElementById('cgBioInput'),
    cgInterestsInput: document.getElementById('cgInterestsInput'),
    saveCustomGirlBtn: document.getElementById('saveCustomGirlBtn'),
    closeCustomGirlBtn: document.getElementById('closeCustomGirlBtn'),

    // AI Modal
    aiSettingsBtn: document.getElementById('aiSettingsBtn'),
    aiModal: document.getElementById('aiModal'),
    aiEndpointInput: document.getElementById('aiEndpointInput'),
    aiKeyInput: document.getElementById('aiKeyInput'),
    aiModelInput: document.getElementById('aiModelInput'),
    saveAiBtn: document.getElementById('saveAiBtn'),
    clearAiBtn: document.getElementById('clearAiBtn'),
    closeAiBtn: document.getElementById('closeAiBtn'),

    // Chat
    profileAvatar: document.getElementById('profileAvatar'),
    profileMoodBadge: document.getElementById('profileMoodBadge'),
    profileName: document.getElementById('profileName'),
    profileTagline: document.getElementById('profileTagline'),
    profileBio: document.getElementById('profileBio'),
    profileInterests: document.getElementById('profileInterests'),
    myMatchBonusBox: document.getElementById('myMatchBonusBox'),
    sympathyPct: document.getElementById('sympathyPct'),
    sympathyBar: document.getElementById('sympathyBar'),
    comboBadge: document.getElementById('comboBadge'),
    blitzTimerBadge: document.getElementById('blitzTimerBadge'),
    turnNum: document.getElementById('turnNum'),
    turnMax: document.getElementById('turnMax'),

    mhAvatar: document.getElementById('mhAvatar'),
    mhName: document.getElementById('mhName'),
    mhStatus: document.getElementById('mhStatus'),
    stickerBtn: document.getElementById('stickerBtn'),
    stickerDrawer: document.getElementById('stickerDrawer'),
    stickerList: document.getElementById('stickerList'),
    closeStickerBtn: document.getElementById('closeStickerBtn'),
    wingmanBtn: document.getElementById('wingmanBtn'),
    wingmanCharges: document.getElementById('wingmanCharges'),
    wingmanDrawer: document.getElementById('wingmanDrawer'),
    wingmanList: document.getElementById('wingmanList'),
    closeWingmanBtn: document.getElementById('closeWingmanBtn'),
    finishEarlyBtn: document.getElementById('finishEarlyBtn'),
    chatFeed: document.getElementById('chatFeed'),
    chatForm: document.getElementById('chatForm'),
    messageInput: document.getElementById('messageInput'),

    // Report
    verdictEmoji: document.getElementById('verdictEmoji'),
    verdictBadge: document.getElementById('verdictBadge'),
    verdictTitle: document.getElementById('verdictTitle'),
    verdictSummary: document.getElementById('verdictSummary'),
    totalScoreVal: document.getElementById('totalScoreVal'),
    gaugeRing: document.getElementById('gaugeRing'),
    rankBadge: document.getElementById('rankBadge'),
    rankTitle: document.getElementById('rankTitle'),
    bdDiff: document.getElementById('bdDiff'),
    bdDepth: document.getElementById('bdDepth'),
    bdStrong: document.getElementById('bdStrong'),
    bdFlags: document.getElementById('bdFlags'),
    mainAdviceBox: document.getElementById('mainAdviceBox'),
    criteriaList: document.getElementById('criteriaList'),
    highlightsList: document.getElementById('highlightsList'),
    continueChatBtn: document.getElementById('continueChatBtn'),
    retrySameBtn: document.getElementById('retrySameBtn'),
    copyReportBtn: document.getElementById('copyReportBtn'),
    chooseAnotherBtn: document.getElementById('chooseAnotherBtn')
  };

  function loadJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_) {
      return fallback;
    }
  }

  function saveProgress() {
    try {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(state.progress));
    } catch (_) {}
  }

  function updateHeaderStats() {
    const count = state.progress.conquered.length;
    el.conqueredCount.textContent = count;
    let rank = 'Новичок';
    if (count >= 40) rank = 'Бог Rizz';
    else if (count >= 18) rank = 'Легенда';
    else if (count >= 10) rank = 'Мастер Rizz';
    else if (count >= 5) rank = 'Сердцеед';
    else if (count >= 2) rank = 'Романтик';
    el.playerRankText.textContent = rank;
  }

  function updateAiBtnLabel() {
    el.aiSettingsBtn.textContent =
      state.aiConfig && state.aiConfig.apiKey ? '🤖 ИИ: ВКЛ' : '⚙️ ИИ';
  }

  function showToast(text) {
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = text;
    el.toastContainer.appendChild(t);
    setTimeout(() => t.remove(), 3500);
  }

  function unlockAchievement(id) {
    if (state.progress.achievements.includes(id)) return;
    state.progress.achievements.push(id);
    saveProgress();
    const ach = ACHIEVEMENTS.find((a) => a.id === id);
    if (ach) {
      window.rizzSound.combo();
      showToast(`🏆 Достижение: ${ach.icon} ${ach.name}!`);
    }
  }

  function updateDailyBanner() {
    const polinaBest = state.progress.bestScores['polina_18'] || 0;
    const polinaWin = state.progress.conquered.includes('polina_18');
    if (polinaWin && polinaBest >= 75) {
      el.dailyBanner.classList.add('done');
      el.dailyTitle.textContent = `✅ Вызов дня выполнен! Полина, 18 покорена (${polinaBest}/100)`;
      el.dailyAcceptBtn.textContent = '🔄 Сыграть ещё';
    } else {
      el.dailyBanner.classList.remove('done');
      el.dailyTitle.textContent = 'Закадри Полину, 18 (Хардкор) и набери 75+ Индекса Харизмы!';
      el.dailyAcceptBtn.textContent = '🔥 Принять вызов';
    }
  }

  function init() {
    updateAiBtnLabel();
    updateHeaderStats();
    updateDailyBanner();
    populateMyProfileForm();
    renderPersonas();
    renderOpenerCase();
    renderStickers();
    bindEvents();
  }

  function showScreen(name) {
    stopBlitzTimer();
    Object.values(screens).forEach((s) => s.classList.remove('active'));
    screens[name].classList.add('active');

    const isChatOrReport = name === 'chat' || name === 'report';
    el.mainTabs.classList.toggle('hidden', isChatOrReport);
    el.backHomeBtn.classList.toggle('hidden', !isChatOrReport);

    if (!isChatOrReport) {
      el.mainTabs.querySelectorAll('.tab-btn').forEach((b) => {
        b.classList.toggle('active', b.dataset.tab === name);
      });
    }

    if (name === 'select') {
      updateHeaderStats();
      updateDailyBanner();
      renderPersonas();
    } else if (name === 'history') {
      renderHistoryTab();
    } else if (name === 'achievements') {
      renderAchievementsTab();
    }
  }

  // --- MY PROFILE ---
  function populateMyProfileForm() {
    const p = state.userProfile;
    el.myNameInput.value = p.name || '';
    el.myAgeInput.value = p.age || 20;
    el.myWorkInput.value = p.work || '';
    el.myBioInput.value = p.bio || '';
    el.myInterestsInput.value = (p.interests || []).join(', ');
    el.myStyleSelect.value = p.style || 'Уверенный';
    el.myAvatarPicker.querySelectorAll('.av-opt').forEach((b) => {
      b.classList.toggle('active', b.dataset.av === p.avatar);
    });
  }

  // --- OPENER TRAINER ---
  function renderOpenerCase() {
    const c = OPENER_CASES[state.openerIdx % OPENER_CASES.length];
    el.openerSituationTag.textContent = `СИТУАЦИЯ: ${c.tag}`;
    el.openerTargetName.textContent = c.title;
    el.openerTargetDesc.textContent = c.desc;
    el.openerResultBox.classList.add('hidden');
  }

  // --- HISTORY & ACHIEVEMENTS TABS ---
  function renderHistoryTab() {
    const logs = state.progress.logs || [];
    const total = logs.length;
    const wins = logs.filter((l) => l.verdict === 'win').length;
    const avgScore = total ? Math.round(logs.reduce((s, l) => s + l.score, 0) / total) : 0;
    const bestScore = total ? Math.max(...logs.map((l) => l.score)) : 0;

    el.statsSummaryGrid.innerHTML = `
      <div class="stat-card"><div class="stat-val">${total}</div><div class="stat-lbl">Всего диалогов</div></div>
      <div class="stat-card"><div class="stat-val">${wins}</div><div class="stat-lbl">Успешных свиданий</div></div>
      <div class="stat-card"><div class="stat-val">${avgScore}</div><div class="stat-lbl">Средний индекс</div></div>
      <div class="stat-card"><div class="stat-val">${bestScore}</div><div class="stat-lbl">Рекорд харизмы</div></div>
    `;

    el.historyList.innerHTML = '';
    if (logs.length === 0) {
      el.historyList.innerHTML = `<p style="color:var(--text-muted)">Пока нет завершённых диалогов. Выбери девушку и начни!</p>`;
      return;
    }

    logs.slice(0, 30).forEach((item) => {
      const row = document.createElement('div');
      row.className = 'history-row';
      row.innerHTML = `
        <div class="history-left">
          <div class="history-av">${item.avatar}</div>
          <div>
            <div class="history-name">${escapeHtml(item.name)} ${item.isBlitz ? '⚡' : ''}</div>
            <div class="history-sub">${item.badge} • ${item.date}</div>
          </div>
        </div>
        <div class="history-score" style="color:${item.verdict === 'win' ? '#2ecc71' : item.verdict === 'mid' ? '#facc15' : '#ff4d4f'}">
          ${item.score}/100 (Ранг ${item.rank})
        </div>
      `;
      el.historyList.appendChild(row);
    });
  }

  function renderAchievementsTab() {
    el.achGrid.innerHTML = '';
    ACHIEVEMENTS.forEach((a) => {
      const unlocked = state.progress.achievements.includes(a.id);
      const div = document.createElement('div');
      div.className = 'ach-card' + (unlocked ? ' unlocked' : '');
      div.innerHTML = `
        <div class="ach-icon">${a.icon}</div>
        <div>
          <div class="ach-name">${a.name}</div>
          <div class="ach-desc">${a.desc}</div>
        </div>
      `;
      el.achGrid.appendChild(div);
    });
  }

  function renderStickers() {
    el.stickerList.innerHTML = '';
    MEME_STICKERS.forEach((st) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'sticker-item';
      btn.textContent = st.label;
      btn.addEventListener('click', () => {
        if (state.isTyping || state.ended) return;
        el.stickerDrawer.classList.add('hidden');
        handleUserMessage(st.text);
      });
      el.stickerList.appendChild(btn);
    });
  }

  function renderPersonas() {
    el.personasGrid.innerHTML = '';
    const q = state.searchQuery.trim().toLowerCase();

    const filtered = window.PERSONAS.filter((p) => {
      const isConquered = state.progress.conquered.includes(p.id);
      if (state.diffFilter === 'conquered' && !isConquered) return false;
      if (state.diffFilter !== 'all' && state.diffFilter !== 'conquered' && p.difficulty !== state.diffFilter) {
        return false;
      }
      if (!q) return true;
      const hay = `${p.name} ${p.tagline} ${p.bio} ${p.interests.join(' ')}`.toLowerCase();
      return hay.includes(q);
    });

    if (filtered.length === 0) {
      el.personasGrid.innerHTML = `<p style="color: var(--text-muted); grid-column: 1/-1; text-align:center;">Никого не найдено 😔</p>`;
      return;
    }

    filtered.forEach((p) => {
      const isConquered = state.progress.conquered.includes(p.id);
      const best = state.progress.bestScores[p.id];
      const diffKey = p.difficulty === 'Лёгкая' ? 'easy' : p.difficulty === 'Хардкор' ? 'hard' : 'medium';
      const diffIcon = p.difficulty === 'Лёгкая' ? '💚' : p.difficulty === 'Хардкор' ? '❤️‍🔥' : '💛';

      const card = document.createElement('article');
      card.className = `persona-card card-${diffKey}` + (isConquered ? ' conquered' : '');
      card.innerHTML = `
        ${isConquered ? `<span class="conquered-badge">💘 Покорена${best ? ` (${best}/100)` : ''}</span>` : ''}
        <div class="persona-top">
          <div class="persona-emoji">${p.avatar}</div>
          <div>
            <h3 class="persona-title">${p.name}</h3>
            <span class="persona-diff diff-${diffKey}">${diffIcon} ${p.difficulty}</span>
          </div>
        </div>
        <p class="persona-bio">${p.bio}</p>
        <div class="tags-wrap">
          ${p.interests.map((tag) => `<span class="tag">#${tag}</span>`).join('')}
        </div>
        <button class="btn-primary" data-id="${p.id}">💬 Начать диалог</button>
      `;

      card.querySelector('button').addEventListener('click', () => startChat(p, false));
      el.personasGrid.appendChild(card);
    });
  }

  function bindEvents() {
    el.mainTabs.querySelectorAll('.tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => showScreen(btn.dataset.tab));
    });

    el.backHomeBtn.addEventListener('click', () => showScreen('select'));
    el.chooseAnotherBtn.addEventListener('click', () => showScreen('select'));
    el.retrySameBtn.addEventListener('click', () => {
      if (state.persona) startChat(state.persona, state.isBlitz);
    });

    el.dailyAcceptBtn.addEventListener('click', () => {
      const target = window.PERSONAS.find((p) => p.id === 'polina_18') || window.PERSONAS[0];
      startChat(target, false);
    });

    el.continueChatBtn.addEventListener('click', () => {
      if (!state.persona) return;
      state.freeplay = true;
      state.ended = false;
      el.messageInput.disabled = false;
      el.turnMax.textContent = '∞';
      showScreen('chat');
      appendBotMessage('Режим свободного общения включён — болтаем без лимита ходов 😉');
      el.messageInput.focus();
    });

    el.soundBtn.addEventListener('click', () => {
      window.rizzSound.muted = !window.rizzSound.muted;
      el.soundBtn.textContent = window.rizzSound.muted ? '🔇' : '🔊';
    });

    el.randomMatchBtn.addEventListener('click', () => {
      const un = window.PERSONAS.filter((p) => !state.progress.conquered.includes(p.id));
      const pool = un.length > 0 ? un : window.PERSONAS;
      const pick = pool[Math.floor(Math.random() * pool.length)];
      startChat(pick, false);
    });

    // My Profile Form
    el.myAvatarPicker.querySelectorAll('.av-opt').forEach((btn) => {
      btn.addEventListener('click', () => {
        el.myAvatarPicker.querySelectorAll('.av-opt').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        state.userProfile.avatar = btn.dataset.av;
      });
    });

    el.myProfileForm.addEventListener('submit', (e) => {
      e.preventDefault();
      state.userProfile.name = el.myNameInput.value.trim() || 'Парень';
      state.userProfile.age = Number(el.myAgeInput.value) || 20;
      state.userProfile.work = el.myWorkInput.value.trim() || 'Занимаюсь своими проектами';
      state.userProfile.bio = el.myBioInput.value.trim() || '';
      state.userProfile.interests = el.myInterestsInput.value
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
      state.userProfile.style = el.myStyleSelect.value;
      localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(state.userProfile));
      window.rizzSound.combo();
      showToast('😎 Твоя анкета сохранена! Девушки теперь видят её.');
    });

    // Blitz buttons
    document.querySelectorAll('[data-blitz]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const diff = btn.dataset.blitz;
        const pool = window.PERSONAS.filter((p) => p.difficulty === diff);
        const pick = pool[Math.floor(Math.random() * pool.length)] || window.PERSONAS[0];
        startChat(pick, true);
      });
    });

    // Opener Trainer
    el.nextOpenerCaseBtn.addEventListener('click', () => {
      state.openerIdx++;
      renderOpenerCase();
    });

    el.openerTestForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = el.openerTestInput.value.trim();
      if (!text) return;
      const c = OPENER_CASES[state.openerIdx % OPENER_CASES.length];
      const fakePersona = {
        name: c.title,
        difficulty: 'Средняя',
        interests: c.keywords.slice(0, 4),
        interestKeywords: c.keywords
      };
      const res = window.RizzEvaluator.analyzeMessage(text, fakePersona, []);
      const avg = Math.round(
        ((res.scores.originality + res.scores.confidence + res.scores.engagement + res.scores.tact + res.scores.vibeMatch) / 5) * 10
      );
      el.openerResultBox.classList.remove('hidden');
      el.openerResultBox.innerHTML = `
        <div style="font-size:20px;font-weight:800;margin-bottom:8px;">Оценка захода: <span style="color:var(--pink)">${avg}/100</span></div>
        <div style="color:var(--text-muted);margin-bottom:10px;">${res.notes.join(' • ')}</div>
        <div class="breakdown-chips">
          <span class="b-chip">✨ Ориг: <strong>${res.scores.originality}</strong></span>
          <span class="b-chip">🦁 Уверен: <strong>${res.scores.confidence}</strong></span>
          <span class="b-chip">💬 Вовлеч: <strong>${res.scores.engagement}</strong></span>
          <span class="b-chip">🛡️ Такт: <strong>${res.scores.tact}</strong></span>
        </div>
      `;
    });

    // Clear history
    el.clearHistoryBtn.addEventListener('click', () => {
      state.progress.logs = [];
      saveProgress();
      renderHistoryTab();
    });

    // Custom Girl Modal
    el.openCustomGirlBtn.addEventListener('click', () => el.customGirlModal.classList.remove('hidden'));
    el.closeCustomGirlBtn.addEventListener('click', () => el.customGirlModal.classList.add('hidden'));
    el.saveCustomGirlBtn.addEventListener('click', () => {
      const name = el.cgNameInput.value.trim();
      const diff = el.cgDiffInput.value;
      const bio = el.cgBioInput.value.trim() || 'Любит интересное общение и чувство юмора.';
      const ints = el.cgInterestsInput.value
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
      if (!name) return;

      const newGirl = {
        id: `custom_${Date.now()}`,
        name,
        avatar: '✨',
        difficulty: diff,
        tagline: 'Своя анкета',
        bio,
        interests: ints.length ? ints : ['музыка', 'кофе'],
        workOrStudy: 'занимаюсь своими делами и увлечениями',
        favMusic: 'люблю классную музыку под настроение',
        idealDate: 'уютная встреча в классном месте',
        interestKeywords: ints.length ? ints : ['музык', 'кофе'],
        startSympathy: diff === 'Лёгкая' ? 42 : diff === 'Хардкор' ? 24 : 35,
        openingMsg: `Привет! Я ${name.split(',')[0]}. Удиви меня своим первым сообщением ✨`
      };
      state.customGirls.unshift(newGirl);
      localStorage.setItem(CUSTOM_GIRLS_KEY, JSON.stringify(state.customGirls));
      window.PERSONAS.unshift(newGirl);
      el.customGirlModal.classList.add('hidden');
      renderPersonas();
      showToast(`✨ Добавлена: ${name}`);
    });

    el.difficultyFilters.querySelectorAll('.filter-pill').forEach((btn) => {
      btn.addEventListener('click', () => {
        el.difficultyFilters.querySelectorAll('.filter-pill').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        state.diffFilter = btn.dataset.diff;
        renderPersonas();
      });
    });

    el.searchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value;
      renderPersonas();
    });

    // Stickers
    el.stickerBtn.addEventListener('click', () => {
      el.wingmanDrawer.classList.add('hidden');
      el.stickerDrawer.classList.toggle('hidden');
    });
    el.closeStickerBtn.addEventListener('click', () => el.stickerDrawer.classList.add('hidden'));

    // Wingman
    el.wingmanBtn.addEventListener('click', () => {
      if (state.wingmanLeft <= 0 || state.ended || state.isTyping) return;
      el.stickerDrawer.classList.add('hidden');
      const suggestions = window.RizzEvaluator.getWingmanSuggestions(
        state.persona,
        state.turn,
        state.sympathy
      );
      el.wingmanList.innerHTML = '';
      suggestions.forEach((s) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'wingman-item';
        btn.innerHTML = `<strong>${s.label}:</strong>${escapeHtml(s.text)}`;
        btn.addEventListener('click', () => {
          state.wingmanLeft--;
          el.wingmanCharges.textContent = state.wingmanLeft;
          if (state.wingmanLeft <= 0) el.wingmanBtn.disabled = true;
          el.messageInput.value = s.text;
          el.messageInput.focus();
          el.wingmanDrawer.classList.add('hidden');
        });
        el.wingmanList.appendChild(btn);
      });
      el.wingmanDrawer.classList.toggle('hidden');
    });
    el.closeWingmanBtn.addEventListener('click', () => el.wingmanDrawer.classList.add('hidden'));

    // AI Modal
    el.aiSettingsBtn.addEventListener('click', () => {
      el.aiEndpointInput.value =
        (state.aiConfig && state.aiConfig.endpoint) || 'https://api.openai.com/v1/chat/completions';
      el.aiKeyInput.value = (state.aiConfig && state.aiConfig.apiKey) || '';
      el.aiModelInput.value = (state.aiConfig && state.aiConfig.model) || 'gpt-4o-mini';
      el.aiModal.classList.remove('hidden');
    });
    el.closeAiBtn.addEventListener('click', () => el.aiModal.classList.add('hidden'));
    el.saveAiBtn.addEventListener('click', () => {
      const endpoint = el.aiEndpointInput.value.trim();
      const apiKey = el.aiKeyInput.value.trim();
      const model = el.aiModelInput.value.trim() || 'gpt-4o-mini';
      if (endpoint && apiKey) {
        state.aiConfig = { endpoint, apiKey, model };
        localStorage.setItem(AI_STORAGE_KEY, JSON.stringify(state.aiConfig));
      }
      updateAiBtnLabel();
      el.aiModal.classList.add('hidden');
    });
    el.clearAiBtn.addEventListener('click', () => {
      state.aiConfig = null;
      localStorage.removeItem(AI_STORAGE_KEY);
      updateAiBtnLabel();
      el.aiModal.classList.add('hidden');
    });

    el.finishEarlyBtn.addEventListener('click', () => {
      if (!state.isTyping) finishAndShowReport();
    });

    el.copyReportBtn.addEventListener('click', () => {
      if (!state.lastReport || !state.persona) return;
      const r = state.lastReport;
      const summary = `💘 RIZZ LAB — ${state.persona.name}\nРезультат: ${r.verdictBadge}\nИндекс харизмы: ${r.totalScore}/100 (Ранг ${r.rank.letter} — ${r.rank.title})`;
      navigator.clipboard?.writeText(summary).catch(() => {});
      const old = el.copyReportBtn.textContent;
      el.copyReportBtn.textContent = '✅ Скопировано!';
      setTimeout(() => (el.copyReportBtn.textContent = old), 1500);
    });

    el.chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (state.isTyping || state.ended) return;
      const text = el.messageInput.value.trim();
      if (!text) return;
      el.messageInput.value = '';
      el.wingmanDrawer.classList.add('hidden');
      el.stickerDrawer.classList.add('hidden');
      handleUserMessage(text);
    });
  }

  function stopBlitzTimer() {
    if (state.blitzTimerId) {
      clearInterval(state.blitzTimerId);
      state.blitzTimerId = null;
    }
    el.blitzTimerBadge.classList.add('hidden');
  }

  function startBlitzTurnTimer() {
    stopBlitzTimer();
    if (!state.isBlitz || state.ended) return;
    state.blitzSeconds = state.persona.difficulty === 'Хардкор' ? 15 : 18;
    el.blitzTimerBadge.textContent = `⏱️ ${state.blitzSeconds}с`;
    el.blitzTimerBadge.classList.remove('hidden');

    state.blitzTimerId = setInterval(() => {
      state.blitzSeconds--;
      el.blitzTimerBadge.textContent = `⏱️ ${state.blitzSeconds}с`;
      if (state.blitzSeconds <= 0) {
        stopBlitzTimer();
        state.sympathy = Math.max(0, state.sympathy - 10);
        updateSympathyUI();
        appendBotMessage('Эй, ты уснул там? Я не люблю ждать долго ⏳ (-10% симпатии)');
        if (state.sympathy <= 10) {
          state.ended = true;
          el.messageInput.disabled = true;
          setTimeout(() => finishAndShowReport(), 1000);
        } else {
          startBlitzTurnTimer();
        }
      }
    }, 1000);
  }

  function startChat(persona, isBlitz = false) {
    state.persona = persona;
    state.isBlitz = isBlitz;
    state.freeplay = false;

    // Check match bonus with User's own Anketa
    const userInts = (state.userProfile.interests || []).map((i) => i.toLowerCase());
    const shared = persona.interests.filter((pi) =>
      userInts.some((ui) => pi.toLowerCase().includes(ui) || ui.includes(pi.toLowerCase()))
    );
    const matchBonus = shared.length > 0 ? Math.min(10, shared.length * 5) : 0;

    state.sympathy = Math.min(90, persona.startSympathy + matchBonus);
    state.turn = 0;
    state.combo = 0;
    state.wingmanLeft = 2;
    state.history = [];
    state.messageLogs = [];
    state.usedReplies = new Set();
    state.lastTopic = null;
    state.isTyping = false;
    state.ended = false;

    el.profileAvatar.textContent = persona.avatar;
    el.profileName.textContent = persona.name;
    el.profileTagline.textContent = persona.tagline;
    el.profileBio.textContent = persona.bio;
    el.profileInterests.innerHTML = persona.interests
      .map((i) => `<span class="tag">#${i}</span>`)
      .join('');

    if (matchBonus > 0) {
      el.myMatchBonusBox.textContent = `✨ Совпадение с твоей анкетой (${state.userProfile.name}): +${matchBonus}% к старту (${shared.join(', ')})!`;
      el.myMatchBonusBox.classList.remove('hidden');
    } else {
      el.myMatchBonusBox.classList.add('hidden');
    }

    el.mhAvatar.textContent = persona.avatar;
    el.mhName.textContent = persona.name.split(',')[0] + (isBlitz ? ' ⚡ БЛИЦ' : '');
    el.mhStatus.textContent = 'онлайн';
    el.turnMax.textContent = MAX_TURNS;
    el.wingmanCharges.textContent = state.wingmanLeft;
    el.wingmanBtn.disabled = false;
    el.wingmanDrawer.classList.add('hidden');
    el.stickerDrawer.classList.add('hidden');

    el.chatFeed.innerHTML = '';
    el.messageInput.disabled = false;
    el.messageInput.focus();

    updateSympathyUI();
    state.history.push({ role: 'bot', text: persona.openingMsg });
    appendBotMessage(persona.openingMsg);
    showScreen('chat');
    if (isBlitz) startBlitzTurnTimer();
  }

  async function handleUserMessage(text) {
    stopBlitzTimer();
    state.turn++;
    const analysis = window.RizzEvaluator.analyzeMessage(text, state.persona, state.history);

    if (analysis.sympathyDelta >= 8) {
      state.combo++;
      if (state.combo >= 2) {
        analysis.sympathyDelta += 3;
        window.rizzSound.combo();
      } else {
        window.rizzSound.send();
      }
      if (state.combo >= 3) unlockAchievement('combo_3');
    } else {
      state.combo = 0;
      window.rizzSound.send();
    }

    if (analysis.matchedKeywords.length >= 2) {
      unlockAchievement('sniper');
    }

    state.sympathy = Math.max(0, Math.min(100, state.sympathy + analysis.sympathyDelta));
    state.history.push({ role: 'user', text });
    state.messageLogs.push({ text, analysis });

    const reaction = window.RizzEvaluator.getEmojiReaction(analysis);
    appendUserMessage(text, analysis, reaction);
    updateSympathyUI();

    state.isTyping = true;
    el.mhStatus.textContent = 'печатает...';
    const typingEl = appendTypingIndicator();

    const effectiveMaxTurns = state.freeplay ? 999 : MAX_TURNS;
    const nluResult = window.RizzEvaluator.generateSmartReply(
      text,
      state.persona,
      analysis,
      state.sympathy,
      state.turn,
      effectiveMaxTurns,
      state.usedReplies,
      { lastTopic: state.lastTopic, userProfile: state.userProfile }
    );
    state.lastTopic = nluResult.nextTopic || null;

    let replyText = nluResult.text;
    const forceEnd = state.freeplay ? null : nluResult.forceEnd;

    // Random live twist on turn 3
    if (!forceEnd && !state.freeplay && state.turn === 3 && Math.random() < 0.4 && state.persona.id !== 'polina_18') {
      const twists = [
        ' Кстати, ко мне тут подруга заглянула, спрашивает: «Он реально смешной или просто старается?» 😂',
        ' Ой, у меня тут мини-блиц: назови 1 вещь, которую в тебе сразу замечают люди!'
      ];
      replyText += twists[Math.floor(Math.random() * twists.length)];
    }

    if (state.aiConfig && state.aiConfig.apiKey && !forceEnd) {
      try {
        replyText = await window.RizzEvaluator.fetchAIReply(
          state.aiConfig,
          state.persona,
          state.history,
          state.sympathy,
          state.turn,
          MAX_TURNS
        );
      } catch (_) {}
    } else {
      await new Promise((r) => setTimeout(r, 550 + Math.random() * 400));
    }

    typingEl.remove();
    state.isTyping = false;
    el.mhStatus.textContent = 'онлайн';

    window.rizzSound.receive();
    state.history.push({ role: 'bot', text: replyText });
    appendBotMessage(replyText);

    if (forceEnd) {
      state.ended = true;
      el.messageInput.disabled = true;
      setTimeout(() => finishAndShowReport(), 1300);
    } else if (state.isBlitz) {
      startBlitzTurnTimer();
    }
  }

  function appendUserMessage(text, analysis, reaction) {
    const row = document.createElement('div');
    row.className = 'msg-row user';

    const delta = analysis.sympathyDelta;
    const fbClass = delta >= 8 ? 'good' : delta < 0 ? 'bad' : 'warn';
    const sign = delta >= 0 ? '+' : '';

    row.innerHTML = `
      <div class="msg-bubble-wrap">
        <div class="msg-bubble">${escapeHtml(text)}</div>
        ${reaction ? `<span class="msg-reaction">${reaction}</span>` : ''}
      </div>
      <div class="msg-feedback ${fbClass}">${sign}${delta}% • ${escapeHtml(analysis.notes[0])}</div>
    `;
    el.chatFeed.appendChild(row);
    el.chatFeed.scrollTop = el.chatFeed.scrollHeight;
  }

  function appendBotMessage(text) {
    const row = document.createElement('div');
    row.className = 'msg-row bot';
    row.innerHTML = `<div class="msg-bubble">${escapeHtml(text)}</div>`;
    el.chatFeed.appendChild(row);
    el.chatFeed.scrollTop = el.chatFeed.scrollHeight;
  }

  function appendTypingIndicator() {
    const row = document.createElement('div');
    row.className = 'msg-row bot';
    row.innerHTML = `<div class="typing-bubble">${state.persona.name.split(',')[0]} печатает...</div>`;
    el.chatFeed.appendChild(row);
    el.chatFeed.scrollTop = el.chatFeed.scrollHeight;
    return row;
  }

  function updateSympathyUI() {
    el.sympathyPct.textContent = `${state.sympathy}%`;
    el.sympathyBar.style.width = `${state.sympathy}%`;
    el.turnNum.textContent = Math.min(state.turn + 1, MAX_TURNS);

    if (state.combo >= 2) {
      el.comboBadge.textContent = `🔥 Комбо x${state.combo}`;
      el.comboBadge.classList.remove('hidden');
    } else {
      el.comboBadge.classList.add('hidden');
    }

    let mood = '😐 Присматривается';
    if (state.sympathy >= 80) mood = '😍 Влюблена!';
    else if (state.sympathy >= 60) mood = '😊 Заинтересована';
    else if (state.sympathy >= 40) mood = '🙂 Не против пообщаться';
    else if (state.sympathy <= 15) mood = '🚫 Почти в ЧС';
    else if (state.sympathy <= 25) mood = '🙄 Скучает / скепсис';

    el.profileMoodBadge.textContent = mood;
  }

  function finishAndShowReport() {
    stopBlitzTimer();
    const report = window.RizzEvaluator.buildFinalReport(
      state.persona,
      state.messageLogs,
      state.sympathy
    );
    state.lastReport = report;

    const prevBest = state.progress.bestScores[state.persona.id] || 0;
    if (report.totalScore > prevBest) {
      state.progress.bestScores[state.persona.id] = report.totalScore;
    }

    // Save to history logs
    if (state.messageLogs.length > 0) {
      state.progress.logs = state.progress.logs || [];
      state.progress.logs.unshift({
        name: state.persona.name,
        avatar: state.persona.avatar,
        score: report.totalScore,
        rank: report.rank.letter,
        verdict: report.verdictType,
        badge: report.verdictBadge,
        isBlitz: state.isBlitz,
        date: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
      });
      if (state.progress.logs.length > 50) state.progress.logs.length = 50;
    }

    if (report.verdictType === 'win') {
      window.rizzSound.win();
      launchConfetti(85);
      if (!state.progress.conquered.includes(state.persona.id)) {
        state.progress.conquered.push(state.persona.id);
      }
      unlockAchievement('first_win');
      if (state.isBlitz) unlockAchievement('blitz_win');
      if (state.persona.difficulty === 'Хардкор') unlockAchievement('hardcore_win');
      if (state.progress.conquered.length >= 5) unlockAchievement('collector_5');
      if (state.progress.conquered.length >= 12) unlockAchievement('collector_12');
    } else if (report.verdictType === 'fail') {
      window.rizzSound.fail();
    }

    el.continueChatBtn.classList.toggle('hidden', report.verdictType === 'fail');

    if (report.totalScore >= 88) unlockAchievement('s_rank');
    saveProgress();
    updateHeaderStats();
    updateDailyBanner();

    el.verdictEmoji.textContent = report.verdictEmoji;
    el.verdictBadge.textContent = report.verdictBadge;
    el.verdictBadge.className =
      'verdict-badge' +
      (report.verdictType === 'mid' ? ' mid' : report.verdictType === 'fail' ? ' fail' : '');
    el.verdictTitle.textContent = report.verdictTitle;
    el.verdictSummary.textContent = report.verdictSummary;

    el.rankBadge.textContent = report.rank.letter;
    el.rankBadge.style.color = report.rank.color;
    el.rankTitle.textContent = report.rank.title;
    el.bdDiff.textContent = report.scoreBreakdown.difficulty;
    el.bdDepth.textContent = report.scoreBreakdown.depthLabel;
    el.bdStrong.textContent = report.scoreBreakdown.strongMoves;
    el.bdFlags.textContent = report.scoreBreakdown.redFlags;
    el.mainAdviceBox.textContent = `💡 ${report.scoreBreakdown.mainAdvice}`;

    const circumference = 364.42;
    el.gaugeRing.style.strokeDashoffset = circumference;
    el.totalScoreVal.textContent = '0';
    requestAnimationFrame(() => {
      const offset = circumference - (report.totalScore / 100) * circumference;
      el.gaugeRing.style.strokeDashoffset = offset;
    });

    let cur = 0;
    const target = report.totalScore;
    const step = Math.max(1, Math.ceil(target / 28));
    const countTimer = setInterval(() => {
      cur = Math.min(target, cur + step);
      el.totalScoreVal.textContent = cur;
      if (cur >= target) clearInterval(countTimer);
    }, 22);

    el.criteriaList.innerHTML = '';
    report.criteria.forEach((c) => {
      const div = document.createElement('div');
      div.className = 'criterion-item';
      div.innerHTML = `
        <div class="crit-top">
          <span>${c.name}</span>
          <span class="crit-score">${c.score} / 10</span>
        </div>
        <div class="crit-bar-bg">
          <div class="crit-bar-fill" style="width: ${c.score * 10}%"></div>
        </div>
        <p class="crit-comment">${c.comment}</p>
      `;
      el.criteriaList.appendChild(div);
    });

    el.highlightsList.innerHTML = '';
    report.highlights.forEach((h) => {
      const div = document.createElement('div');
      div.className = 'highlight-item';
      div.innerHTML = `
        <div class="highlight-quote">${escapeHtml(h.quote)}</div>
        <div class="highlight-note">${escapeHtml(h.note)}</div>
      `;
      el.highlightsList.appendChild(div);
    });

    showScreen('report');
  }

  function launchConfetti(count = 75) {
    const canvas = el.confettiCanvas;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const colors = ['#ff3e8a', '#7c4dff', '#22d3ee', '#facc15', '#2ecc71'];
    const particles = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * 120,
      vx: (Math.random() - 0.5) * 6,
      vy: 3 + Math.random() * 5,
      size: 6 + Math.random() * 6,
      color: colors[Math.floor(Math.random() * colors.length)],
      rot: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 0.2
    }));

    let frames = 0;
    function frame() {
      frames++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vRot;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      });
      if (frames < 120) requestAnimationFrame(frame);
      else ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    requestAnimationFrame(frame);
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  init();
})();
