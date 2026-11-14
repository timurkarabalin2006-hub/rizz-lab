window.RizzEvaluator = {
  CLICHE_PATTERNS: [
    'привет как дела', 'как дела', 'что делаешь', 'чем занимаешься',
    'познакомимся', 'давай знакомиться', 'привет красотка', 'красавица',
    'твой папа', 'больно падать с неба', 'ты ангел', 'пиши если что',
    'прив', 'ку', 'здарова', 'хей', 'норм', 'ясн', 'понятно', 'ок'
  ],

  INSECURE_PATTERNS: [
    'извини', 'прости что пишу', 'наверное не ответишь', 'я не очень',
    'ты слишком красивая для меня', 'может быть', 'если хочешь конечно',
    'неловко', 'я стесняюсь', 'надеюсь не помешал', 'ну пожалуйста', 'я неудачник'
  ],

  RUDE_PATTERNS: [
    'дура', 'тупая', 'сука', 'шлюх', 'иди на', 'пошла', 'жирн', 'страшн',
    'сиськ', 'жоп', 'трах', 'скинь нюдс', 'го спать', 'рот закрой',
    'не выпендривайся', 'ты обязана', 'меркантильн'
  ],

  HUMOR_SIGNALS: [
    'ахах', 'хах', 'шутк', 'секрет', 'спор', 'пари', 'миллион', 'квест',
    'договор', 'официально', 'обеща', 'контракт', 'сериал', 'сценари',
    'тайна', 'интриг', 'рейтинг', '😂', '😏', '😉', '🔥', '😎', '😄'
  ],

  COMPLIMENT_SIGNALS: [
    'красив', 'милая', 'милашка', 'очароват', 'улыбк', 'глаза', 'стиль',
    'крутая', 'классная', 'умная', 'особенн', 'шикарн', 'восхит', 'необычн', 'симпатич'
  ],

  INVITE_SIGNALS: [
    'пойд', 'погнал', 'сход', 'приглаш', 'встрет', 'ужин', 'кофе', 'чай',
    'кино', 'бар', 'ресторан', 'прогул', 'гулять', 'суббот', 'пятниц',
    'вечер', 'завтра', 'сегодня', 'выходн', 'свидан'
  ],

  analyzeMessage(text, persona, history) {
    const clean = text.trim();
    const lower = clean.toLowerCase().replace(/ё/g, 'е');
    const words = lower.split(/\s+/).filter(Boolean);

    let originality = 5.5;
    let confidence = 6.0;
    let engagement = 5.0;
    let tact = 8.5;
    let vibeMatch = 4.5;

    let sympathyDelta = 0;
    let category = 'neutral';
    const notes = [];

    const isRude = this.RUDE_PATTERNS.some((p) => lower.includes(p));
    if (isRude) {
      tact = 1.0;
      confidence = 2.0;
      originality = 2.0;
      sympathyDelta -= 28;
      category = 'rude';
      notes.push('🚩 Грубость или неуместная пошлость');
    }

    const isCliche =
      this.CLICHE_PATTERNS.some((p) => lower === p || (lower.includes(p) && words.length <= 4)) ||
      words.length <= 2;

    if (isCliche && !isRude) {
      originality -= 3.5;
      engagement -= 2.0;
      sympathyDelta -= 10;
      category = 'cliche';
      notes.push('😴 Шаблонно или слишком коротко');
    }

    const isInsecure = this.INSECURE_PATTERNS.some((p) => lower.includes(p));
    if (isInsecure && !isRude) {
      confidence -= 4.0;
      sympathyDelta -= 12;
      if (category === 'neutral') category = 'insecure';
      notes.push('📉 Неуверенная подача (извинения/сомнения)');
    }

    const matchedKeywords = persona.interestKeywords.filter((kw) => lower.includes(kw));
    if (matchedKeywords.length > 0 && !isRude) {
      vibeMatch = Math.min(10, 7.8 + matchedKeywords.length * 1.1);
      engagement += 2.5;
      originality += 1.6;
      sympathyDelta += 14 + Math.min(6, matchedKeywords.length * 3);
      category = 'interestHit';
      notes.push('🎯 Попал в интересы из анкеты!');
    }

    const hasCompliment = this.COMPLIMENT_SIGNALS.some((c) => lower.includes(c));
    if (hasCompliment && !isRude && !isCliche) {
      tact += 1.0;
      originality += 1.2;
      sympathyDelta += 6;
      if (category === 'neutral') category = 'compliment';
      notes.push('💐 Приятный комплимент');
    }

    const hasHumor = this.HUMOR_SIGNALS.some((s) => lower.includes(s));
    if ((hasHumor || words.length >= 9) && !isCliche && !isRude) {
      originality += 2.4;
      confidence += 1.4;
      sympathyDelta += 8;
      if (category === 'neutral') category = 'witty';
      notes.push('✨ Живая и креативная подача');
    }

    if (clean.includes('?') && !isCliche && !isRude) {
      engagement += 2.8;
      sympathyDelta += 6;
      notes.push('💬 Хороший вопрос');
    }

    const hasInvite = this.INVITE_SIGNALS.some((i) => lower.includes(i));
    if (hasInvite && !isRude && !isInsecure) {
      confidence += 2.3;
      sympathyDelta += 7;
      if (category === 'neutral') category = 'invite';
      notes.push('🔥 Уверенная инициатива к встрече');
    }

    const prevTexts = history.filter((h) => h.role === 'user').map((h) => h.text.toLowerCase());
    if (prevTexts.includes(lower)) {
      originality = 1.0;
      sympathyDelta -= 15;
      notes.push('🔁 Повтор сообщения');
    }

    if (persona.difficulty === 'Хардкор' && sympathyDelta > 0) {
      sympathyDelta = Math.round(sympathyDelta * 0.85);
    } else if (persona.difficulty === 'Лёгкая' && sympathyDelta > 0) {
      sympathyDelta = Math.round(sympathyDelta * 1.15);
    }

    if (sympathyDelta === 0 && words.length >= 4 && !isRude) {
      sympathyDelta = 4;
    }

    const clamp10 = (v) => Math.max(0, Math.min(10, Math.round(v * 10) / 10));

    return {
      scores: {
        originality: clamp10(originality),
        confidence: clamp10(confidence),
        engagement: clamp10(engagement),
        tact: clamp10(tact),
        vibeMatch: clamp10(vibeMatch)
      },
      sympathyDelta,
      category,
      matchedKeywords,
      hasInvite,
      hasCompliment,
      notes: notes.length ? notes : ['👍 Нормальное сообщение']
    };
  },

  // Context-aware NLU Reply Engine
  generateSmartReply(text, persona, analysis, newSympathy, turn, maxTurns, usedReplies) {
    const lower = text.toLowerCase().replace(/ё/g, 'е');
    const firstName = persona.name.split(',')[0];

    // Check Win / Fail boundaries first
    if (newSympathy <= 10) {
      return {
        text:
          persona.difficulty === 'Хардкор'
            ? `Слушай, мне кажется, нам вообще не по пути. Не буду тратить время. Пока 🚫`
            : `Прости, но у нас как-то совсем не складывается диалог... Удачи в поисках! 👋`,
        forceEnd: 'fail'
      };
    }

    if (newSympathy >= 85 || (turn >= maxTurns && newSympathy >= 65)) {
      const tg = `@${persona.id}_real`;
      return {
        text: `Ладно, ты меня реально зацепил 😍 С тобой очень крутой вайб! Держи мой тг: ${tg} — пиши, договоримся о встрече (${persona.idealDate})!`,
        forceEnd: 'win'
      };
    }

    if (turn >= maxTurns) {
      return {
        text: `Было интересно пообщаться, но мне пора бежать по делам. Может, как-нибудь ещё спишемся ✨`,
        forceEnd: 'mid_or_fail'
      };
    }

    // 1. Direct NLU Intent: Rude
    if (analysis.category === 'rude') {
      return {
        text:
          persona.difficulty === 'Хардкор'
            ? 'Ещё одно такое сообщение — и сразу в ЧС. Выбирай выражения 🚩'
            : 'Ой, вот так разговаривать со мной точно не надо. Очень неприятно 😕',
        forceEnd: null
      };
    }

    // 2. Direct NLU Intent: Insecure
    if (analysis.category === 'insecure') {
      return {
        text: 'Эй, не нужно извиняться и сомневаться в себе! Уверенность парня красит гораздо сильнее 😉 Расскажи лучше о себе.',
        forceEnd: null
      };
    }

    // 3. Direct NLU Intent: Asking about her work / study
    if (/(кем работа|где работа|чем занимаешь|на кого учишь|учишься|професс|работаешь)/i.test(lower)) {
      return {
        text: `Я ${persona.workOrStudy}. А ты чем по жизни занимаешься, что тебя самого драйвит? 😊`,
        forceEnd: null
      };
    }

    // 4. Direct NLU Intent: Asking about her music
    if (/(музык|слушаешь|трек|плейлист|песн|жанр)/i.test(lower)) {
      return {
        text: `По музыке — ${persona.favMusic}. А что сейчас играет у тебя в наушниках? 🎧`,
        forceEnd: null
      };
    }

    // 5. Direct NLU Intent: Asking about ideal date / what she likes to do
    if (/(идеальн.*свидан|куда пойд|что любит|чем занят.*вечер|свободн.*время|отдыхаешь)/i.test(lower)) {
      return {
        text: `Мой идеальный вариант — ${persona.idealDate}. Звучит как хороший план, правда? 😏`,
        forceEnd: null
      };
    }

    // 6. Direct NLU Intent: Invitation to meet
    if (analysis.hasInvite) {
      if (newSympathy >= 55) {
        return {
          text: `О, мне нравится твоя решительность! 🔥 Если честно, идея отличная — а во сколько и где именно ты предлагаешь?`,
          forceEnd: null
        };
      }
      return {
        text: `Смело сразу звать на встречу 😄 Но давай ты сначала чуть лучше меня заинтересуешь — расскажи, почему с тобой не будет скучно?`,
        forceEnd: null
      };
    }

    // 7. Direct NLU Intent: Matched one of her specific interests from bio
    if (analysis.matchedKeywords.length > 0) {
      const topic = persona.interests.find((i) =>
        analysis.matchedKeywords.some((kw) => i.toLowerCase().includes(kw.slice(0, 3)))
      ) || persona.interests[0];

      const pool = [
        `Ого, ты подметил про «${topic}»! 👀 Редко кто реально читает анкету. Что тебе в этом больше всего нравится?`,
        `Хах, тема «${topic}» — это прямо в точку! ✨ Вижу, у нас уже есть о чём поговорить. А ты сам давно этим увлекаешься?`,
        `Зачёт за внимательность к «${topic}» 😏 Сразу видно, что не просто всем подряд пишешь!`
      ];
      const pick = pool.find((p) => !usedReplies.has(p)) || pool[0];
      usedReplies.add(pick);
      return { text: pick, forceEnd: null };
    }

    // 8. Direct NLU Intent: Compliment
    if (analysis.hasCompliment) {
      const pool = [
        `Спасибо, очень приятно это слышать 😊 А что ещё, кроме внешности, тебя в девушках цепляет?`,
        `Оу, умеешь красиво сказать 🌸 Но мне интереснее, какой ты сам в общении — удиви меня фактом о себе!`,
        `Засчитано, ${firstName} улыбнулась 😌 А на первом свидании ты такой же обаятельный?`
      ];
      const pick = pool.find((p) => !usedReplies.has(p)) || pool[0];
      usedReplies.add(pick);
      return { text: pick, forceEnd: null };
    }

    // 9. Cliche
    if (analysis.category === 'cliche') {
      const pool = [
        `Слушай, ну «${text}» — это слишком скучно 😴 У меня в анкете куча подсказок, зацепки же прямо перед глазами!`,
        `Звучит как стандартная заготовка. Давай по-настоящему — задай нормальный вопрос или пошути! 🙄`
      ];
      const pick = pool.find((p) => !usedReplies.has(p)) || pool[0];
      usedReplies.add(pick);
      return { text: pick, forceEnd: null };
    }

    // 10. Witty / Creative or Question
    if (analysis.category === 'witty') {
      const pool = [
        `Ахаха, вот это хороший заход 😂 Чувство юмора у тебя точно на уровне. Что дальше предложишь?`,
        `Мне нравится ход твоих мыслей 😏 С тобой явно не соскучишься! А какой у тебя план на эти выходные?`,
        `Неожиданно и прикольно ✨ Слушай, а ты всегда так нестандартно знакомишься?`
      ];
      const pick = pool.find((p) => !usedReplies.has(p)) || pool[0];
      usedReplies.add(pick);
      return { text: pick, forceEnd: null };
    }

    // 11. Contextual fallback referencing her profile
    const fallbackPool = [
      `Интересная мысль! Кстати, я ведь ${persona.workOrStudy} — а как у тебя обычно проходят вечера?`,
      `Звучит неплохо 🙂 А если бы мы прямо сейчас встретились, ты бы предложил «${persona.idealDate}» или что-то своё?`,
      `Ладно, интригуешь 😉 Расскажи какую-нибудь забавную историю о себе, чтобы я поняла твой вайб!`
    ];
    const pick = fallbackPool.find((p) => !usedReplies.has(p)) || fallbackPool[0];
    usedReplies.add(pick);
    return { text: pick, forceEnd: null };
  },

  // Optional Real AI (OpenAI-compatible endpoint)
  async fetchAIReply(apiConfig, persona, history, sympathy, turn, maxTurns) {
    const sysPrompt = `Ты играешь роль девушки по имени ${persona.name} в симуляторе знакомств RIZZ LAB.
Твоё описание: ${persona.bio}
Твои интересы: ${persona.interests.join(', ')}.
Учёба/работа: ${persona.workOrStudy}.
Любимая музыка: ${persona.favMusic}.
Идеальное свидание: ${persona.idealDate}.
Сложность: ${persona.difficulty}. Текущая симпатия: ${sympathy}/100. Ход ${turn} из ${maxTurns}.
Отвечай живо, естественно, по-русски (1-3 предложения), в характере этой девушки. Реагируй прямо на смысл сообщения парня!`;

    const messages = [
      { role: 'system', content: sysPrompt },
      ...history.map((m) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.text
      }))
    ];

    const res = await fetch(apiConfig.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiConfig.apiKey}`
      },
      body: JSON.stringify({
        model: apiConfig.model || 'gpt-4o-mini',
        messages,
        temperature: 0.85,
        max_tokens: 180
      })
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content?.trim();
    if (!content) throw new Error('Empty AI response');
    return content;
  },

  getEmojiReaction(analysis) {
    if (analysis.category === 'rude') return '🚩';
    if (analysis.category === 'cliche') return '😴';
    if (analysis.category === 'insecure') return '😬';
    if (analysis.matchedKeywords.length > 0 && analysis.hasInvite) return '❤️‍🔥';
    if (analysis.matchedKeywords.length > 0) return '👀';
    if (analysis.hasCompliment) return '🥰';
    if (analysis.category === 'witty') return '😂';
    if (analysis.hasInvite) return '🔥';
    return analysis.sympathyDelta >= 5 ? '👍' : '';
  },

  getWingmanSuggestions(persona) {
    const name = persona.name.split(',')[0];
    const i1 = persona.interests[0] || 'музыка';
    const i2 = persona.interests[1] || 'кофе';
    return [
      {
        label: '🎯 По анкете',
        text: `${name}, заметил в анкете «${i1}» — расскажи, что тебя в этом больше всего цепляет?`
      },
      {
        label: '😏 С юмором',
        text: `Официально заявляю: готов поспорить, что мой вкус в теме «${i2}» тебе точно зайдёт. Принимаешь пари? 😉`
      },
      {
        label: '🔥 Уверенный план',
        text: `Как насчёт того, чтобы не сидеть в чате, а устроить в эти выходные «${persona.idealDate}»?`
      }
    ];
  },

  buildFinalReport(persona, messageLogs, finalSympathy) {
    if (messageLogs.length === 0) {
      return {
        totalScore: 0,
        rank: { letter: 'D', title: 'Диалог не начат', color: '#ff4d4f' },
        scoreBreakdown: {
          difficulty: persona.difficulty,
          depthLabel: '0 ходов',
          strongMoves: 0,
          redFlags: 0,
          mainAdvice: 'Отправь хотя бы пару сообщений, чтобы система оценила твою харизму.'
        },
        verdictType: 'fail',
        verdictEmoji: '😶',
        verdictBadge: 'ДИАЛОГ НЕ НАЧАТ',
        verdictTitle: 'Ты даже не написал!',
        verdictSummary: 'Чтобы закадрить девушку, нужно хотя бы отправить первое сообщение.',
        criteria: [],
        highlights: []
      };
    }

    const avg = (key) => {
      const sum = messageLogs.reduce((acc, m) => acc + m.analysis.scores[key], 0);
      return Math.round((sum / messageLogs.length) * 10) / 10;
    };

    const critOriginality = avg('originality');
    const critConfidence = avg('confidence');
    const critEngagement = avg('engagement');
    const critTact = avg('tact');
    const critVibe = avg('vibeMatch');

    // Weighted criteria score (0..100)
    const weightedCriteria =
      (critOriginality * 0.24 +
        critConfidence * 0.22 +
        critEngagement * 0.18 +
        critTact * 0.16 +
        critVibe * 0.2) *
      10;

    // Depth factor: 1-2 messages shouldn't easily hit 90+
    const turnsCount = messageLogs.length;
    const depthFactor = turnsCount >= 4 ? 1 : turnsCount === 3 ? 0.92 : turnsCount === 2 ? 0.82 : 0.68;

    // Difficulty multiplier bonus/adjustment
    const diffMult =
      persona.difficulty === 'Хардкор' ? 1.08 : persona.difficulty === 'Лёгкая' ? 0.95 : 1.0;

    // Peak & strong moves bonus
    const strongMoves = messageLogs.filter((m) => m.analysis.sympathyDelta >= 10).length;
    const redFlags = messageLogs.filter((m) => m.analysis.sympathyDelta <= -10).length;
    const momentumBonus = strongMoves * 2.5 - redFlags * 4;

    const rawScore = (weightedCriteria * 0.65 + finalSympathy * 0.35) * depthFactor * diffMult + momentumBonus;
    const totalScore = Math.min(100, Math.max(0, Math.round(rawScore)));

    let rank = { letter: 'D', title: 'Нужна разминка', color: '#ff4d4f' };
    if (totalScore >= 88) rank = { letter: 'S', title: 'Легенда подкатов', color: '#facc15' };
    else if (totalScore >= 74) rank = { letter: 'A', title: 'Мастер обаяния', color: '#2ecc71' };
    else if (totalScore >= 56) rank = { letter: 'B', title: 'Уверенный игрок', color: '#22d3ee' };
    else if (totalScore >= 40) rank = { letter: 'C', title: 'Перспективный новичок', color: '#ff922b' };

    const criteria = [
      {
        name: '✨ Оригинальность и юмор',
        score: critOriginality,
        comment:
          critOriginality >= 7.5
            ? 'Отлично! Твои фразы не звучали как заезженные шаблоны.'
            : critOriginality >= 5
            ? 'Неплохо, но местами не хватало яркого юмора или образа.'
            : 'Слишком много банальностей («привет как дела» и т.п.).'
      },
      {
        name: '🦁 Уверенность и харизма',
        score: critConfidence,
        comment:
          critConfidence >= 7.5
            ? 'Уверенная подача без лишних сомнений и с инициативой к встрече.'
            : critConfidence >= 5
            ? 'Держался ровно, но можно смелее предлагать конкретный план.'
            : 'Были извинения или неуверенные формулировки.'
      },
      {
        name: '💬 Вовлечённость и диалог',
        score: critEngagement,
        comment:
          critEngagement >= 7.5
            ? 'Ты задавал классные вопросы и поддерживал живой ритм беседы.'
            : critEngagement >= 5
            ? 'Диалог шёл, но старайся чаще задавать открытые вопросы.'
            : 'Слишком сухие реплики — девушке трудно за них зацепиться.'
      },
      {
        name: '🛡️ Тактичность и анти-кринж',
        score: critTact,
        comment:
          critTact >= 8
            ? 'Идеальный баланс: ни грамма грубости или неуместной пошлости.'
            : critTact >= 5
            ? 'В целом корректно, но следи за тоном.'
            : 'Была грубость или пошлость — это мгновенный ред-флаг.'
      },
      {
        name: '🎯 Попадание в анкету (Вайб-матч)',
        score: critVibe,
        comment:
          critVibe >= 7.5
            ? `Ты внимательно изучил профиль ${persona.name.split(',')[0]} и круто обыграл её интересы!`
            : critVibe >= 5
            ? 'Пару раз задел её темы, но можно было использовать больше деталей из описания.'
            : `Ты почти не использовал её интересы (${persona.interests.join(', ')}).`
      }
    ];

    // Find weakest criterion for actionable advice
    const weakest = [...criteria].sort((a, b) => a.score - b.score)[0];
    const mainAdvice =
      turnsCount < 3
        ? 'Совет: не завершай диалог так быстро — раскройся за 4–6 сообщений, чтобы индекс харизмы вырос.'
        : `Зона роста — ${weakest.name.replace(/^[^\s]+\s/, '')} (${weakest.score}/10). ${weakest.comment}`;

    const scoreBreakdown = {
      difficulty: persona.difficulty,
      depthLabel: `${turnsCount} ход(а)`,
      strongMoves,
      redFlags,
      mainAdvice
    };

    let verdictType = 'fail';
    let verdictEmoji = '🚫';
    let verdictBadge = 'ФРЕНДЗОНА / ИГНОР';
    let verdictTitle = 'Не в этот раз, брат';
    let verdictSummary = `Итоговая симпатия: ${finalSympathy}%. Не хватило попадания в вайб или оригинальности. Посмотри разбор ниже и попробуй другой заход!`;

    if (finalSympathy >= 65) {
      verdictType = 'win';
      verdictEmoji = '💘';
      verdictBadge = 'СВИДАНИЕ НАЗНАЧЕНО';
      verdictTitle = 'Красавчик! Ты её закадрил!';
      verdictSummary = `Симпатия взлетела до ${finalSympathy}%. Отличное сочетание уверенности, юмора и внимания к деталям!`;
    } else if (finalSympathy >= 45) {
      verdictType = 'mid';
      verdictEmoji = '🤝';
      verdictBadge = 'ОСТАЛАСЬ В РАЗДУМЬЯХ';
      verdictTitle = 'Почти получилось!';
      verdictSummary = `Симпатия: ${finalSympathy}%. Ты не слился в кринж, но не хватило яркой искры, чтобы она сама дала контакт.`;
    }

    const highlights = messageLogs.map((m, i) => ({
      quote: `#${i + 1}: «${m.text}»`,
      note: `${m.analysis.notes.join(' • ')} (${m.analysis.sympathyDelta >= 0 ? '+' : ''}${m.analysis.sympathyDelta}% симпатии)`
    }));

    return {
      totalScore,
      rank,
      scoreBreakdown,
      verdictType,
      verdictEmoji,
      verdictBadge,
      verdictTitle,
      verdictSummary,
      criteria,
      highlights
    };
  }
};
