(() => {
  const MAX_TURNS = 6;
  const AI_STORAGE_KEY = 'rizz_lab_ai_cfg';

  const state = {
    persona: null,
    sympathy: 35,
    turn: 0,
    history: [],
    messageLogs: [],
    usedReplies: new Set(),
    isTyping: false,
    ended: false,
    diffFilter: 'all',
    searchQuery: '',
    aiConfig: loadAiConfig()
  };

  const screens = {
    select: document.getElementById('selectScreen'),
    chat: document.getElementById('chatScreen'),
    report: document.getElementById('reportScreen')
  };

  const el = {
    backHomeBtn: document.getElementById('backHomeBtn'),
    personasGrid: document.getElementById('personasGrid'),
    difficultyFilters: document.getElementById('difficultyFilters'),
    searchInput: document.getElementById('searchInput'),

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
    turnNum: document.getElementById('turnNum'),
    turnMax: document.getElementById('turnMax'),

    mhAvatar: document.getElementById('mhAvatar'),
    mhName: document.getElementById('mhName'),
    mhStatus: document.getElementById('mhStatus'),
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
    chooseAnotherBtn: document.getElementById('chooseAnotherBtn')
  };

  function loadAiConfig() {
    try {
      const raw = localStorage.getItem(AI_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }

  function updateAiBtnLabel() {
    el.aiSettingsBtn.textContent =
      state.aiConfig && state.aiConfig.apiKey ? '🤖 ИИ-режим: ВКЛ' : '⚙️ ИИ-режим';
  }

  function init() {
    updateAiBtnLabel();
    renderPersonas();
    bindEvents();
  }

  function showScreen(name) {
    Object.values(screens).forEach((s) => s.classList.remove('active'));
    screens[name].classList.add('active');
    el.backHomeBtn.classList.toggle('hidden', name === 'select');
  }

  function renderPersonas() {
    el.personasGrid.innerHTML = '';
    const q = state.searchQuery.trim().toLowerCase();

    const filtered = window.PERSONAS.filter((p) => {
      const diffMatch = state.diffFilter === 'all' || p.difficulty === state.diffFilter;
      if (!diffMatch) return false;
      if (!q) return true;
      const hay = `${p.name} ${p.tagline} ${p.bio} ${p.interests.join(' ')}`.toLowerCase();
      return hay.includes(q);
    });

    if (filtered.length === 0) {
      el.personasGrid.innerHTML = `<p style="color: var(--text-muted); grid-column: 1/-1; text-align:center;">Никого не найдено по запросу «${escapeHtml(state.searchQuery)}»</p>`;
      return;
    }

    filtered.forEach((p) => {
      const card = document.createElement('article');
      card.className = 'persona-card';
      card.innerHTML = `
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

  function bindEvents() {
    el.backHomeBtn.addEventListener('click', () => showScreen('select'));
    el.chooseAnotherBtn.addEventListener('click', () => showScreen('select'));
    el.retrySameBtn.addEventListener('click', () => {
      if (state.persona) startChat(state.persona);
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

    el.chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (state.isTyping || state.ended) return;
      const text = el.messageInput.value.trim();
      if (!text) return;
      el.messageInput.value = '';
      handleUserMessage(text);
    });
  }

  function startChat(persona) {
    state.persona = persona;
    state.sympathy = persona.startSympathy;
    state.turn = 0;
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

    state.sympathy = Math.max(0, Math.min(100, state.sympathy + analysis.sympathyDelta));
    state.history.push({ role: 'user', text });
    state.messageLogs.push({ text, analysis });

    appendUserMessage(text, analysis);
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
      } catch (_) {
        // Fallback silently to built-in NLU reply
      }
    } else {
      await new Promise((r) => setTimeout(r, 650 + Math.random() * 500));
    }

    typingEl.remove();
    state.isTyping = false;
    el.mhStatus.textContent = 'онлайн';

    state.history.push({ role: 'bot', text: replyText });
    appendBotMessage(replyText);

    if (forceEnd) {
      state.ended = true;
      el.messageInput.disabled = true;
      setTimeout(() => finishAndShowReport(), 1400);
    }
  }

  function appendUserMessage(text, analysis) {
    const row = document.createElement('div');
    row.className = 'msg-row user';

    const delta = analysis.sympathyDelta;
    const fbClass = delta >= 8 ? 'good' : delta < 0 ? 'bad' : 'warn';
    const sign = delta >= 0 ? '+' : '';

    row.innerHTML = `
      <div class="msg-bubble">${escapeHtml(text)}</div>
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

    el.verdictEmoji.textContent = report.verdictEmoji;
    el.verdictBadge.textContent = report.verdictBadge;
    el.verdictBadge.className =
      'verdict-badge' +
      (report.verdictType === 'mid' ? ' mid' : report.verdictType === 'fail' ? ' fail' : '');
    el.verdictTitle.textContent = report.verdictTitle;
    el.verdictSummary.textContent = report.verdictSummary;

    // Rank & Breakdown
    el.rankBadge.textContent = report.rank.letter;
    el.rankBadge.style.color = report.rank.color;
    el.rankTitle.textContent = report.rank.title;
    el.bdDiff.textContent = report.scoreBreakdown.difficulty;
    el.bdDepth.textContent = report.scoreBreakdown.depthLabel;
    el.bdStrong.textContent = report.scoreBreakdown.strongMoves;
    el.bdFlags.textContent = report.scoreBreakdown.redFlags;
    el.mainAdviceBox.textContent = `💡 ${report.scoreBreakdown.mainAdvice}`;

    // Animate Radial Gauge + Score Counter
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
