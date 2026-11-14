(() => {
  const MAX_TURNS = 6;
  const AI_STORAGE_KEY = 'rizz_lab_ai_cfg';
  const PROGRESS_KEY = 'rizz_lab_progress_v3';

  const ACHIEVEMENTS = [
    { id: 'first_win', icon: '💘', name: 'Первый контакт', desc: 'Покори свою первую девушку' },
    { id: 'hardcore_win', icon: '👑', name: 'Покоритель Хардкора', desc: 'Закадри девушку сложности Хардкор' },
    { id: 's_rank', icon: '🌟', name: 'S-Ранг', desc: 'Набери 88+ Индекса Харизмы за диалог' },
    { id: 'combo_3', icon: '🔥', name: 'В потоке', desc: 'Собери комбо x3 из сильных сообщений подряд' },
    { id: 'sniper', icon: '🎯', name: 'Снайпер анкеты', desc: 'Попади в 2+ интереса из анкеты в одном сообщении' },
    { id: 'collector_5', icon: '💎', name: 'Сердцеед', desc: 'Покори 5 разных девушек' },
    { id: 'collector_12', icon: '🏆', name: 'Мастер Rizz', desc: 'Покори 12 разных девушек' }
  ];

  const state = {
    persona: null,
    sympathy: 35,
    turn: 0,
    combo: 0,
    wingmanLeft: 2,
    history: [],
    messageLogs: [],
    usedReplies: new Set(),
    isTyping: false,
    ended: false,
    diffFilter: 'all',
    searchQuery: '',
    lastReport: null,
    aiConfig: loadJson(AI_STORAGE_KEY, null),
    progress: loadJson(PROGRESS_KEY, { conquered: [], bestScores: {}, achievements: [] })
  };

  const screens = {
    select: document.getElementById('selectScreen'),
    chat: document.getElementById('chatScreen'),
    report: document.getElementById('reportScreen')
  };

  const el = {
    toastContainer: document.getElementById('toastContainer'),
    playerRankText: document.getElementById('playerRankText'),
    conqueredCount: document.getElementById('conqueredCount'),
    achievementsBtn: document.getElementById('achievementsBtn'),
    soundBtn: document.getElementById('soundBtn'),
    backHomeBtn: document.getElementById('backHomeBtn'),
    randomMatchBtn: document.getElementById('randomMatchBtn'),
    personasGrid: document.getElementById('personasGrid'),
    difficultyFilters: document.getElementById('difficultyFilters'),
    searchInput: document.getElementById('searchInput'),

    achModal: document.getElementById('achModal'),
    achGrid: document.getElementById('achGrid'),
    closeAchBtn: document.getElementById('closeAchBtn'),

    aiSettingsBtn: document.getElementById('aiSettingsBtn'),
    aiModal: document.getElementById('aiModal'),
    aiEndpointInput: document.getElementById('aiEndpointInput'),
    aiKeyInput: document.getElementById('aiKeyInput'),
    aiModelInput: document.getElementById('aiModelInput'),
    saveAiBtn: document.getElementById('saveAiBtn'),
    clearAiBtn: document.getElementById('clearAiBtn'),
    closeAiBtn: document.getElementById('closeAiBtn'),

    profileAvatar: document.getElementById('profileAvatar'),
    profileMoodBadge: document.getElementById('profileMoodBadge'),
    profileName: document.getElementById('profileName'),
    profileTagline: document.getElementById('profileTagline'),
    profileBio: document.getElementById('profileBio'),
    profileInterests: document.getElementById('profileInterests'),
    sympathyPct: document.getElementById('sympathyPct'),
    sympathyBar: document.getElementById('sympathyBar'),
    comboBadge: document.getElementById('comboBadge'),
    turnNum: document.getElementById('turnNum'),
    turnMax: document.getElementById('turnMax'),

    mhAvatar: document.getElementById('mhAvatar'),
    mhName: document.getElementById('mhName'),
    mhStatus: document.getElementById('mhStatus'),
    wingmanBtn: document.getElementById('wingmanBtn'),
    wingmanCharges: document.getElementById('wingmanCharges'),
    wingmanDrawer: document.getElementById('wingmanDrawer'),
    wingmanList: document.getElementById('wingmanList'),
    closeWingmanBtn: document.getElementById('closeWingmanBtn'),
    finishEarlyBtn: document.getElementById('finishEarlyBtn'),
    chatFeed: document.getElementById('chatFeed'),
    chatForm: document.getElementById('chatForm'),
    messageInput: document.getElementById('messageInput'),

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
    if (count >= 18) rank = 'Легенда';
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

  function init() {
    updateAiBtnLabel();
    updateHeaderStats();
    renderPersonas();
    bindEvents();
  }

  function showScreen(name) {
    Object.values(screens).forEach((s) => s.classList.remove('active'));
    screens[name].classList.add('active');
    el.backHomeBtn.classList.toggle('hidden', name === 'select');
    if (name === 'select') {
      updateHeaderStats();
      renderPersonas();
    }
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
      const card = document.createElement('article');
      card.className = 'persona-card' + (isConquered ? ' conquered' : '');
      card.innerHTML = `
        ${isConquered ? `<span class="conquered-badge">💘 Покорена${best ? ` (${best}/100)` : ''}</span>` : ''}
        <div class="persona-top">
          <div class="persona-emoji">${p.avatar}</div>
          <div>
            <h3 class="persona-title">${p.name}</h3>
            <span class="persona-diff">Сложность: ${p.difficulty}</span>
          </div>
        </div>
        <p class="persona-bio">${p.bio}</p>
        <div class="tags-wrap">
          ${p.interests.map((tag) => `<span class="tag">#${tag}</span>`).join('')}
        </div>
        <button class="btn-primary" data-id="${p.id}">💬 Начать диалог</button>
      `;

      card.querySelector('button').addEventListener('click', () => startChat(p));
      el.personasGrid.appendChild(card);
    });
  }

  function renderAchievementsModal() {
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

  function bindEvents() {
    el.backHomeBtn.addEventListener('click', () => showScreen('select'));
    el.chooseAnotherBtn.addEventListener('click', () => showScreen('select'));
    el.retrySameBtn.addEventListener('click', () => {
      if (state.persona) startChat(state.persona);
    });

    el.soundBtn.addEventListener('click', () => {
      window.rizzSound.muted = !window.rizzSound.muted;
      el.soundBtn.textContent = window.rizzSound.muted ? '🔇' : '🔊';
    });

    el.achievementsBtn.addEventListener('click', () => {
      renderAchievementsModal();
      el.achModal.classList.remove('hidden');
    });
    el.closeAchBtn.addEventListener('click', () => el.achModal.classList.add('hidden'));

    el.randomMatchBtn.addEventListener('click', () => {
      const un = window.PERSONAS.filter((p) => !state.progress.conquered.includes(p.id));
      const pool = un.length > 0 ? un : window.PERSONAS;
      const pick = pool[Math.floor(Math.random() * pool.length)];
      startChat(pick);
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

    // Wingman
    el.wingmanBtn.addEventListener('click', () => {
      if (state.wingmanLeft <= 0 || state.ended || state.isTyping) return;
      const suggestions = window.RizzEvaluator.getWingmanSuggestions(state.persona);
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
      handleUserMessage(text);
    });
  }

  function startChat(persona) {
    state.persona = persona;
    state.sympathy = persona.startSympathy;
    state.turn = 0;
    state.combo = 0;
    state.wingmanLeft = 2;
    state.history = [];
    state.messageLogs = [];
    state.usedReplies = new Set();
    state.isTyping = false;
    state.ended = false;

    el.profileAvatar.textContent = persona.avatar;
    el.profileName.textContent = persona.name;
    el.profileTagline.textContent = persona.tagline;
    el.profileBio.textContent = persona.bio;
    el.profileInterests.innerHTML = persona.interests
      .map((i) => `<span class="tag">#${i}</span>`)
      .join('');

    el.mhAvatar.textContent = persona.avatar;
    el.mhName.textContent = persona.name.split(',')[0];
    el.mhStatus.textContent = 'онлайн';
    el.turnMax.textContent = MAX_TURNS;
    el.wingmanCharges.textContent = state.wingmanLeft;
    el.wingmanBtn.disabled = false;
    el.wingmanDrawer.classList.add('hidden');

    el.chatFeed.innerHTML = '';
    el.messageInput.disabled = false;
    el.messageInput.focus();

    updateSympathyUI();
    state.history.push({ role: 'bot', text: persona.openingMsg });
    appendBotMessage(persona.openingMsg);
    showScreen('chat');
  }

  async function handleUserMessage(text) {
    state.turn++;
    const analysis = window.RizzEvaluator.analyzeMessage(text, state.persona, state.history);

    // Combo system
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

    const nluResult = window.RizzEvaluator.generateSmartReply(
      text,
      state.persona,
      analysis,
      state.sympathy,
      state.turn,
      MAX_TURNS,
      state.usedReplies
    );

    let replyText = nluResult.text;
    const forceEnd = nluResult.forceEnd;

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
      await new Promise((r) => setTimeout(r, 600 + Math.random() * 450));
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
      setTimeout(() => finishAndShowReport(), 1400);
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
    const report = window.RizzEvaluator.buildFinalReport(
      state.persona,
      state.messageLogs,
      state.sympathy
    );
    state.lastReport = report;

    // Save progress & check achievements
    const prevBest = state.progress.bestScores[state.persona.id] || 0;
    if (report.totalScore > prevBest) {
      state.progress.bestScores[state.persona.id] = report.totalScore;
    }

    if (report.verdictType === 'win') {
      window.rizzSound.win();
      if (!state.progress.conquered.includes(state.persona.id)) {
        state.progress.conquered.push(state.persona.id);
      }
      unlockAchievement('first_win');
      if (state.persona.difficulty === 'Хардкор') unlockAchievement('hardcore_win');
      if (state.progress.conquered.length >= 5) unlockAchievement('collector_5');
      if (state.progress.conquered.length >= 12) unlockAchievement('collector_12');
    } else if (report.verdictType === 'fail') {
      window.rizzSound.fail();
    }

    if (report.totalScore >= 88) unlockAchievement('s_rank');
    saveProgress();
    updateHeaderStats();

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

  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  init();
})();
