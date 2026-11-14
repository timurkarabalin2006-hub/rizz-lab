window.RizzEvaluator = {
  CLICHE_PATTERNS: [
    'привет как дела', 'как дела', 'что делаешь', 'чем занимаешься',
    'познакомимся', 'давай знакомиться', 'привет красотка', 'красавица',
    'твой папа', 'больно падать с неба', 'ты ангел', 'пиши если что',
    'прив', 'ку', 'здарова', 'хей', 'норм', 'ясн', 'понятно', 'ок', 'привет'
  ],

  INSECURE_PATTERNS: [
    'извини', 'прости что пишу', 'наверное не ответишь', 'я не очень',
    'ты слишком красивая для меня', 'может быть', 'если хочешь конечно',
    'неловко', 'я стесняюсь', 'надеюсь не помешал', 'ну пожалуйста', 'я неудачник'
  ],

  RUDE_PATTERNS: [
    'дура', 'тупая', 'сука', 'шлюх', 'иди на', 'пошла', 'жирн', 'страшн',
    'сиськ', 'жоп', 'трах', 'скинь нюдс', 'го спать', 'рот закрой',
    'не выпендривайся', 'ты обязана', 'меркантильн', 'телочка'
  ],

  HUMOR_SIGNALS: [
    'ахах', 'хах', 'шутк', 'секрет', 'спор', 'пари', 'миллион', 'квест',
    'договор', 'официально', 'обеща', 'контракт', 'сериал', 'сценари',
    'тайна', 'интриг', 'рейтинг', '😂', '😏', '😉', '🔥', '😎', '😄', '🤣'
  ],

  COMPLIMENT_SIGNALS: [
    'красив', 'милая', 'милашка', 'очароват', 'улыбк', 'глаза', 'стиль',
    'крутая', 'классная', 'умная', 'особенн', 'шикарн', 'восхит', 'необычн',
    'симпатич', 'блондин', 'образ', 'вайбов'
  ],

  INVITE_SIGNALS: [
    'пойд', 'погнал', 'сход', 'приглаш', 'встрет', 'ужин', 'кофе', 'чай',
    'кино', 'бар', 'ресторан', 'прогул', 'гулять', 'суббот', 'пятниц',
    'вечер', 'завтра', 'сегодня', 'выходн', 'свидан', 'залет', 'фест', 'каток'
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
      notes.push('🚩 Грубость или пошлость');
    }

    const isCliche =
      this.CLICHE_PATTERNS.some((p) => lower === p || (lower.includes(p) && words.length <= 3)) ||
      (words.length <= 2 && !/\d/.test(lower));

    if (isCliche && !isRude) {
      originality -= 3.5;
      engagement -= 2.0;
      sympathyDelta -= 10;
      category = 'cliche';
      notes.push('😴 Слишком сухо или шаблонно');
    }

    const isInsecure = this.INSECURE_PATTERNS.some((p) => lower.includes(p));
    if (isInsecure && !isRude) {
      confidence -= 4.0;
      sympathyDelta -= 12;
      if (category === 'neutral') category = 'insecure';
      notes.push('📉 Неуверенная подача');
    }

    const matchedKeywords = persona.interestKeywords.filter((kw) => lower.includes(kw));
    if (matchedKeywords.length > 0 && !isRude) {
      vibeMatch = Math.min(10, 7.8 + matchedKeywords.length * 1.1);
      engagement += 2.5;
      originality += 1.6;
      sympathyDelta += 14 + Math.min(6, matchedKeywords.length * 3);
      category = 'interestHit';
      notes.push('🎯 Попал в интересы!');
    }

    const hasCompliment = this.COMPLIMENT_SIGNALS.some((c) => lower.includes(c));
    if (hasCompliment && !isRude && !isCliche) {
      tact += 1.0;
      originality += 1.2;
      sympathyDelta += 6;
      if (category === 'neutral') category = 'compliment';
      notes.push('💐 Удачный комплимент');
    }

    const hasHumor = this.HUMOR_SIGNALS.some((s) => lower.includes(s));
    if ((hasHumor || words.length >= 9) && !isCliche && !isRude) {
      originality += 2.4;
      confidence += 1.4;
      sympathyDelta += 8;
      if (category === 'neutral') category = 'witty';
      notes.push('✨ Живая подача');
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
      notes.push('🔥 Инициатива к встрече');
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

    if (sympathyDelta === 0 && words.length >= 3 && !isRude) {
      sympathyDelta = 7;
      engagement = Math.max(engagement, 7.2);
      vibeMatch = Math.max(vibeMatch, 6.5);
      notes[0] = '💬 Живое поддержание диалога';
    } else if (words.length >= 6 && !isCliche && !isRude) {
      engagement = Math.max(engagement, 7.5);
      vibeMatch = Math.max(vibeMatch, 6.8);
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
      notes: notes.length ? notes : ['👍 Нормальный ход']
    };
  },

  // Exact personality & speech-style clone for Polina, 18
  generatePolinaRealReply(text, persona, analysis, newSympathy, turn, maxTurns, usedReplies, ctx = {}) {
    const lower = text.toLowerCase().replace(/ё/g, 'е');
    const pick = (pool) => {
      const choice = pool.find((p) => !usedReplies.has(p)) || pool[Math.floor(Math.random() * pool.length)];
      usedReplies.add(choice);
      return choice;
    };

    if (newSympathy <= 10) {
      return {
        text: 'Ну такое себе. Не вижу смысла продолжать, пока',
        forceEnd: 'fail',
        nextTopic: null
      };
    }

    if (newSympathy >= 85 || (turn >= maxTurns && newSympathy >= 65)) {
      return {
        text: 'Лан, просто знай — ты реально интересный человек, ценю время) Пиши в тг @polina_18_real, погнали',
        forceEnd: 'win',
        nextTopic: null
      };
    }

    if (turn >= maxTurns) {
      return {
        text: 'Ой все, я щас убегаю уже. Но поболтали норм, мб еще спишемся',
        forceEnd: 'mid_or_fail',
        nextTopic: null
      };
    }

    if (analysis.category === 'rude') {
      return {
        text: 'Че за бред ты несешь. Еще раз так напишешь — сразу в чс улетишь 🤨',
        forceEnd: null,
        nextTopic: null
      };
    }

    if (analysis.category === 'insecure') {
      return {
        text: 'Да не извиняйся ты, че как не уверенный. Нормально общайся и все',
        forceEnd: null,
        nextTopic: null
      };
    }

    if (ctx.lastTopic === 'asked_date_time' && /(\d|вечер|завтра|сегодня|пятниц|суббот|воскр|центр|кафе|парк|часов)/i.test(lower)) {
      return {
        text: 'О, ну вот это по делу. Погнали тогда, я как раз свободна буду',
        forceEnd: null,
        nextTopic: null
      };
    }

    if (/(геншин|genshin|примогем|баннер|ху тао|райдэн|фурин|архонт|бездн|акк)/i.test(lower)) {
      return {
        text: pick([
          'ХАХАХХА кста если сольешь диалог — я тебя в геншине удаляю) Кто у тебя мейн вообще?',
          'Оо шаришь. У меня там вечно 50/50 горит, но акк топовый. Какой ранг?'
        ]),
        forceEnd: null,
        nextTopic: 'asked_game'
      };
    }

    if (/(resident|резидент|re6|обитель|леон|ада|крис|джейк|шерри)/i.test(lower)) {
      return {
        text: pick([
          'Так че, в резидент пойдем или нет? Или ты только в чате смелый)',
          'Жиза, резидент топ. Только в коопе не тупи, я не люблю когда напарник падает каждые 5 минут ХАХАХ'
        ]),
        forceEnd: null,
        nextTopic: 'asked_game'
      };
    }

    if (/(косплей|парик|крафт|фест|аниме|манга|наруто|титан|бензопил)/i.test(lower)) {
      return {
        text: pick([
          'Ой да, я вспомню свою анимешную натуру) Только нормальные тайтлы, а не кринжовую романтику на 12 серий',
          'Кста косплей это кайф, тока времени жрет капец сколько. Ты сам бы замутил образ или чисто посмотреть?'
        ]),
        forceEnd: null,
        nextTopic: 'asked_hobby'
      };
    }

    if (/(тикток|тт|рилс|эдит|рекомендац|мем|видос)/i.test(lower)) {
      return {
        text: pick([
          'ХАХАХХАХВ реально, у меня в тиктоке такая дичь иногда в реках, я ору просто. Кидай че там смешного видел',
          'Ой, если у тебя видосы не прогружаются или мемы тухлые — сразу минус вайб'
        ]),
        forceEnd: null,
        nextTopic: null
      };
    }

    if (/(френдзон|дружб|парен|свободна|отношения)/i.test(lower)) {
      return {
        text: pick([
          'Такой дружбы быть не может кстати. Либо френдзона, либо норм движение, че юлить',
          'Пон. Но я не люблю пустые обещания, мне нужен чел который просто делает, а не воздух гоняет'
        ]),
        forceEnd: null,
        nextTopic: null
      };
    }

    if (/(шаурм|суши|ролл|бургер|пицц|еда|вкусн|кофе|чай|шоколад|слад)/i.test(lower)) {
      return {
        text: pick([
          'Ой да, щас бы дубайский шоколад или че-нибудь вкусное без заморочек 😭 Ты сам что любишь?',
          'Согл, еда это святое. Погнали тогда как-нибудь поедим, че в чате сидеть'
        ]),
        forceEnd: null,
        nextTopic: null
      };
    }

    if (/(кем работа|где работа|чем занимаешь|учишься|музык|слушаешь)/i.test(lower)) {
      return {
        text: `Да учусь, косплеем и играми занимаюсь по настроению. А ты сам чем живешь, кроме переписок?)`,
        forceEnd: null,
        nextTopic: 'asked_hobby'
      };
    }

    if (analysis.hasInvite) {
      if (newSympathy >= 50) {
        return {
          text: 'О, ну погнали. Во сколько и куда именно зовешь? Только конкретно, без «хз выбери сама»',
          forceEnd: null,
          nextTopic: 'asked_date_time'
        };
      }
      return {
        text: 'Эм, мы две минуты знакомы, че так сразу. Сначала заинтересуй нормально, а там посмотрим',
        forceEnd: null,
        nextTopic: null
      };
    }

    if (analysis.hasCompliment) {
      return {
        text: pick([
          'Спасибо) Но комплименты это база, ты лучше характером и юмором вывози',
          'Ой ладно, засчитано 😳 Но просто за красивые слова я не таю, если че'
        ]),
        forceEnd: null,
        nextTopic: null
      };
    }

    if (analysis.category === 'cliche') {
      return {
        text: pick([
          'Пон. Скучновато чет, придумай нормальный заход',
          'Че за шаблон, серьезно? Давай поживее, я люблю угар в жизни — так веселее'
        ]),
        forceEnd: null,
        nextTopic: null
      };
    }

    if (analysis.category === 'witty') {
      return {
        text: pick([
          'АХАХАХАХАХ бля, вот это реально смешно 😂 Ладно, зачет',
          'ХАХАХХВ ну ты выдал. С тобой хотя бы не душно, продолжай'
        ]),
        forceEnd: null,
        nextTopic: null
      };
    }

    return {
      text: pick([
        'Пон. Ну типа звучит норм, а ты в жизни такой же или чисто в тг смелый?',
        'Кста, расскажи че-нибудь угарное из жизни, а то я не люблю когда все слишком серьезно',
        'Хз, пока 50 на 50. Удиви еще чем-нибудь, посмотрим че из этого выйдет'
      ]),
      forceEnd: null,
      nextTopic: null
    };
  },

  // Realistic Context & Pop-Culture NLU Engine 2.0
  generateSmartReply(text, persona, analysis, newSympathy, turn, maxTurns, usedReplies, ctx = {}) {
    if (persona.id === 'polina_18') {
      return this.generatePolinaRealReply(text, persona, analysis, newSympathy, turn, maxTurns, usedReplies, ctx);
    }
    const lower = text.toLowerCase().replace(/ё/g, 'е');
    const firstName = persona.name.split(',')[0];
    const isHard = persona.difficulty === 'Хардкор';
    const isEasy = persona.difficulty === 'Лёгкая';

    const pickUnique = (pool) => {
      const choice = pool.find((p) => !usedReplies.has(p)) || pool[Math.floor(Math.random() * pool.length)];
      usedReplies.add(choice);
      return choice;
    };

    // Win / Fail checks
    if (newSympathy <= 10) {
      return {
        text: isHard
          ? `Слушай, мимо. У нас ноль коннекта, не трать ни моё, ни своё время. Пока 🚫`
          : `Прости, но как-то не складывается... Удачи в поисках! 👋`,
        forceEnd: 'fail',
        nextTopic: null
      };
    }

    if (newSympathy >= 85 || (turn >= maxTurns && newSympathy >= 65)) {
      const tg = `@${persona.id}_real`;
      return {
        text: isHard
          ? `Ладно, признаю — ты реально вывез 🔥 Редко кто так цепляет. Пиши в тг ${tg}, обсудим, когда замутим «${persona.idealDate}».`
          : `Вау, мне с тобой безумно комфортно и весело 😍 Держи мой тг: ${tg} — пиши скорее!`,
        forceEnd: 'win',
        nextTopic: null
      };
    }

    if (turn >= maxTurns) {
      return {
        text: `Слушай, мне пора убегать по делам, но поболтали прикольно ✨ Может, ещё пересечёмся!`,
        forceEnd: 'mid_or_fail',
        nextTopic: null
      };
    }

    // 1. Rude / Insecure
    if (analysis.category === 'rude') {
      return {
        text: isHard
          ? 'Ты серьёзно думаешь, что так можно общаться? Ещё один выпад — и ты в ЧС 🚩'
          : 'Эй, это уже перебор... Пожалуйста, общайся уважительно 😕',
        forceEnd: null,
        nextTopic: null
      };
    }

    if (analysis.category === 'insecure') {
      return {
        text: isHard
          ? 'Вот только без этих извинений и жалости к себе. Соберись, мне нравятся уверенные 😉'
          : 'Не нужно извиняться, ты мне совсем не мешаешь! Расскажи лучше, чем увлекаешься? 😊',
        forceEnd: null,
        nextTopic: 'asked_hobby'
      };
    }

    // 2. Follow-up to her PREVIOUS question (Context memory!)
    if (ctx.lastTopic === 'asked_date_time' && /(\d|вечер|завтра|сегодня|пятниц|суббот|воскр|центр|кафе|парк|часов)/i.test(lower)) {
      return {
        text: pickUnique([
          `О, конкретика мне нравится 🔥 Договорились — в это время я как раз свободна. А кто за кофе/еду платит, или по классике? 😏`,
          `Звучит как отличный план! Люблю, когда парень сам всё решает, а не «ну не знаю, выбери ты» 😉`
        ]),
        forceEnd: null,
        nextTopic: null
      };
    }

    if (ctx.lastTopic === 'asked_music' && text.length >= 4 && !text.includes('?')) {
      return {
        text: pickUnique([
          `Неплохой вкус! Надо будет как-нибудь обменяться плейлистами 🎧 А на живых концертах часто бываешь?`,
          `О, такое я тоже могу послушать под настроение! У тебя прям хороший вайб в музыке ✨`
        ]),
        forceEnd: null,
        nextTopic: null
      };
    }

    if (ctx.lastTopic === 'asked_hobby' && text.length >= 6 && !text.includes('?')) {
      return {
        text: pickUnique([
          `Ого, звучит прикольно! Мне нравится, когда у человека есть своё дело, а не только диван и тикток 😄`,
          `Круто! И давно ты этим занимаешься? Я вот в свободное время всё равно возвращаюсь к своим увлечениям (${persona.interests[0]}).`
        ]),
        forceEnd: null,
        nextTopic: null
      };
    }

    // 3. Specific Pop-Culture & Gaming Deep NLU
    if (/(геншин|genshin|примогем|баннер|ху тао|райдэн|фурин|архонт|бездн|50\/50)/i.test(lower)) {
      return {
        text: pickUnique([
          `Оо, шаришь за Геншин! 😍 Я как раз коплю крутки на новый баннер и вечно проигрываю 50/50. А кто у тебя мейн в отряде?`,
          `Наконец-то нормальный разговор 😂 Какой у тебя ранг приключений? Если поможешь закрыть бездну или боссов — плюс 100 к карме!`
        ]),
        forceEnd: null,
        nextTopic: 'asked_game'
      };
    }

    if (/(resident|резидент|re6|обитель|леон|ада|крис|джейк|шерри|зомби)/i.test(lower)) {
      return {
        text: pickUnique([
          `Вау, ты реально знаешь Resident Evil 6?! 🔥 Мне больше всего заходит кампания за Леона и Аду, в коопе вообще пушка. Потянешь напарника на сложности «Кошмар»?)`,
          `Респект за RE6! Там в коопе такой экшен, особенно когда патроны на нуле 😂 Ты за кого обычно играешь?`
        ]),
        forceEnd: null,
        nextTopic: 'asked_game'
      };
    }

    if (/(косплей|парик|крафт|фест|макима|2b|аниме|манга|наруто|титан|бензопил|магическ)/i.test(lower)) {
      return {
        text: pickUnique([
          `Обожаю тему аниме и косплея ✨ Столько времени уходит на укладку парика и детали, зато на фестах потом кайф. Какой твой любимый тайтл?`,
          `Ты бы заценил мой последний образ 😏 А сам бы пошёл на фест в парном косплее или стесняешься?)`
        ]),
        forceEnd: null,
        nextTopic: 'asked_hobby'
      };
    }

    if (/(стим|steam|кс|cs|дота|dota|валорант|valorant|дискорд|катка|ммр|ранг|фейсит)/i.test(lower)) {
      return {
        text: pickUnique([
          `Если не тильтуешь после первого слитого раунда, можем как-нибудь залететь в пати в Discord 🎮 На чём в основном играешь?`,
          `Хах, главное не говори, что ты токсик в войсе 😂 Кидай потом стим — посмотрим, кто кого тащить будет!`
        ]),
        forceEnd: null,
        nextTopic: 'asked_game'
      };
    }

    if (/(тикток|тт|рилс|эдит|рекомендац|capcut|тренд|мем)/i.test(lower)) {
      return {
        text: pickUnique([
          `Моя лента TikTok — это отдельный вид искусства 😂 Какие видео тебе обычно залетают в реки?`,
          `Осторожно, я могу закидать тебя мемами и эдитами в личке так, что телефон сядет 📱 У тебя какой юмор — чёрный или добрый?`
        ]),
        forceEnd: null,
        nextTopic: null
      };
    }

    // 4. Personal questions about her
    if (/(есть парень|свободна|отношения|встречаешь)/i.test(lower)) {
      return {
        text: pickUnique([
          `Если бы был парень, меня бы тут не было, логично? 😉 А ты сразу по делу проверяешь почву?`,
          `Свободна, но с характером. Так что просто за красивые глаза внимание не раздаю 😌`
        ]),
        forceEnd: null,
        nextTopic: null
      };
    }

    if (/(кем работа|где работа|чем занимаешь|на кого учишь|учишься|професс|работаешь)/i.test(lower)) {
      return {
        text: `Я ${persona.workOrStudy}. А ты сам чем занимаешься — учишься, работаешь или свои проекты мутишь?`,
        forceEnd: null,
        nextTopic: 'asked_hobby'
      };
    }

    if (/(музык|слушаешь|трек|плейлист|песн|жанр)/i.test(lower)) {
      return {
        text: `По музыке — ${persona.favMusic}. А у тебя что сейчас на репите в спотике или вк? 🎧`,
        forceEnd: null,
        nextTopic: 'asked_music'
      };
    }

    if (/(откуда|какой город|где живешь|район)/i.test(lower)) {
      return {
        text: `Живу в центре, так что выбраться куда-то вечером вообще не проблема 🙂 А ты с какого района?`,
        forceEnd: null,
        nextTopic: null
      };
    }

    if (/(идеальн.*свидан|куда пойд|что любит|чем занят.*вечер|свободн.*время)/i.test(lower)) {
      return {
        text: `Для меня кайф — ${persona.idealDate}. Что скажешь, потянешь такой сценарий? 😏`,
        forceEnd: null,
        nextTopic: null
      };
    }

    // 5. Invites
    if (analysis.hasInvite) {
      if (newSympathy >= 52) {
        return {
          text: `Мне нравится твоя решительность 🔥 Окей, звучит интересно — во сколько и где именно предлагаешь встретиться?`,
          forceEnd: null,
          nextTopic: 'asked_date_time'
        };
      }
      return {
        text: isHard
          ? `Слишком быстро зовёшь на встречу, мы даже 3 фразами не перекинулись. Заинтересуй сначала перепиской 😏`
          : `Смело! Но давай сначала немного пообщаемся здесь, чтобы я поняла, что ты не маньяк 😄 Расскажи что-нибудь о себе!`,
        forceEnd: null,
        nextTopic: 'asked_hobby'
      };
    }

    // 6. Matched interests from bio
    if (analysis.matchedKeywords.length > 0) {
      const topic =
        persona.interests.find((i) =>
          analysis.matchedKeywords.some((kw) => i.toLowerCase().includes(kw.slice(0, 3)))
        ) || persona.interests[0];

      return {
        text: pickUnique([
          `О, зацепил за «${topic}» 👀 Приятно, когда парень реально читает анкету, а не шлёт всем одно и то же. Что тебе в этом больше всего нравится?`,
          `Тема «${topic}» — это прямо в яблочко ✨ Вижу, у нас уже есть общий вайб. Расскажешь подробнее?`
        ]),
        forceEnd: null,
        nextTopic: null
      };
    }

    // 7. Compliment
    if (analysis.hasCompliment) {
      return {
        text: isHard
          ? pickUnique([
              `Ну, комплиментами меня заваливают каждый день 😌 Попробуй выделиться умом или юмором, а не просто «ты красивая».`,
              `Спасибо, конечно, но внешность — это база. Что в тебе самом интересного?`
            ])
          : pickUnique([
              `Оу, спасибо, мне очень приятно 😊 А что тебя вообще больше всего цепляет в людях?`,
              `Мило сказано 🌸 ${firstName} официально улыбнулась! А ты в жизни такой же галантный?`
            ]),
        forceEnd: null,
        nextTopic: null
      };
    }

    // 8. Cliche
    if (analysis.category === 'cliche') {
      return {
        text: pickUnique([
          `Серьёзно, «${text}»? 😴 Ну камон, в анкете куча зацепок, прояви хоть каплю фантазии!`,
          `Слишком сухо. С такими сообщениями диалог обычно умирает на второй минуте 🙄`
        ]),
        forceEnd: null,
        nextTopic: null
      };
    }

    // 8.5. Broad everyday life topics (beyond her bio!)
    if (/(шаурм|суши|ролл|бургер|пицц|еда|вкусн|готов|кушать|голод|кофе|чай|матч)/i.test(lower)) {
      return {
        text: pickUnique([
          `Ой, вот тема еды — это всегда попадание в сердце 😋 Я бы сейчас сама от чего-нибудь вкусного не отказалась. Ты больше за домашнюю кухню или ночную доставку?`,
          `Хороший вкус! А у тебя есть какое-то коронное блюдо, которое сам готовишь, или только заказываешь? 😄`
        ]),
        forceEnd: null,
        nextTopic: 'asked_hobby'
      };
    }

    if (/(как день|как вечер|как настроение|чем занят|скучно|устал|спать|бессонниц|погод|дожд|снег|холод)/i.test(lower)) {
      return {
        text: pickUnique([
          `День сегодня такой насыщенный, только к вечеру выдохнула ✨ А у тебя как проходит — бодро или уже на чилле?`,
          `Да вот сижу, ловлю вечерний вайб. Люблю, когда есть с кем поболтать перед сном вместо тупого скролла ленты 🙂`
        ]),
        forceEnd: null,
        nextTopic: null
      };
    }

    if (/(море|путешеств|страна|отпуск|мечт|цель|будущ|миллион|деньг|успех)/i.test(lower)) {
      return {
        text: pickUnique([
          `О, люблю людей, которые не сидят на месте и о чём-то большом мечтают 🔥 Куда бы рванул прямо завтра, если бы все дела отменились?`,
          `Красивые планы! Главное — не просто мечтать, а реально двигаться к этому. Ты из тех, кто всё планирует, или действуешь спонтанно?`
        ]),
        forceEnd: null,
        nextTopic: null
      };
    }

    if (/(кот|кошк|собак|пес|щен|питом|звер)/i.test(lower)) {
      return {
        text: pickUnique([
          `Животные — это вообще +100 к доброте 🐾 У тебя у самого есть питомец или только планируешь?`,
          `Милота! Мне кажется, по отношению к животным сразу видно, какой человек на самом деле 😊`
        ]),
        forceEnd: null,
        nextTopic: null
      };
    }

    if (/(или|спорим|представь|если бы|выбирай|правда или)/i.test(lower)) {
      return {
        text: pickUnique([
          `О, люблю такие вопросы на подумать! 😄 Заставляет включить фантазию. А ты сам бы что выбрал на моём месте?`,
          `Хах, интересная дилемма 😏 Но я сначала хочу услышать твой вариант, а потом скажу свой!`
        ]),
        forceEnd: null,
        nextTopic: null
      };
    }

    // 9. Witty / Telling about himself
    if (/(я работа|я учусь|я играю|люблю|обожаю|мне нрав|хочу|думаю)/i.test(lower)) {
      return {
        text: pickUnique([
          `Прикольно, что делишься 🙂 Мне нравится, когда в диалоге оба живые и настоящие. А что тебя в последнее время больше всего радует?`,
          `Зачётно! Похоже, скучно с тобой точно не будет 😏 И какой твой главный козырь в жизни?`
        ]),
        forceEnd: null,
        nextTopic: null
      };
    }

    if (analysis.category === 'witty') {
      return {
        text: pickUnique([
          `Ахаха, вот это хороший заход 😂 Чувство юмора у тебя реально на уровне. Продолжай!`,
          `Мне нравится твой настрой 😏 Неожиданно и с перчинкой. Что дальше скажешь?`
        ]),
        forceEnd: null,
        nextTopic: null
      };
    }

    // 10. Natural conversational fallback (doesn't force bio!)
    return {
      text: pickUnique([
        `Слушай, мне нравится, как ты формулируешь мысли 🙂 А ты в жизни тоже такой разговорчивый или только в переписке разошёлся?`,
        `Интересный взгляд! Расскажи какую-нибудь случайную, но забавную историю, которая с тобой недавно произошла 😄`,
        isHard
          ? `Ладно, ${firstName} тебя слышит 😏 Продолжай — посмотрим, чем ещё удивишь в этом диалоге.`
          : `Прикольно! С тобой реально легко общаться, даже не замечаю, как время летит ✨`
      ]),
      forceEnd: null,
      nextTopic: 'asked_hobby'
    };
  },

  async fetchAIReply(apiConfig, persona, history, sympathy, turn, maxTurns) {
    const polinaStyleNote =
      persona.id === 'polina_18'
        ? `\nОСОБЫЙ СТИЛЬ РЕЧИ (копия реальной Полины): пиши короткими живыми сообщениями (1-2 фразы), почти без эмодзи (максимум скобочка ")" в конце или редкие 🤨/😳/😭), используй её реальные словечки ("че", "пон", "кста", "хз", "щас", "мб", "тока", "ой да", "согл", "погнали"), смейся капсом ("ХАХАХХА"). Прямолинейная, гордая, любит угар ("так веселее"), не терпит пустых обещаний, ценит спокойного уверенного парня, который делает, а не разводит воду.`
        : '';

    const sysPrompt = `Ты общаешься в симуляторе знакомств от лица девушки: ${persona.name}.
Вайб и био: ${persona.bio}
Интересы: ${persona.interests.join(', ')}.
Учёба/работа: ${persona.workOrStudy}.
Музыка: ${persona.favMusic}.
Идеальное свидание: ${persona.idealDate}.
Сложность: ${persona.difficulty}. Симпатия сейчас: ${sympathy}/100. Ход ${turn} из ${maxTurns}.${polinaStyleNote}
Пиши максимально живо, естественно, как реальная девушка 18-24 лет в переписке (1-3 коротких предложения).`;

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
        temperature: 0.88,
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

  getWingmanSuggestions(persona, turn = 0, sympathy = 35) {
    const name = persona.name.split(',')[0];
    const i1 = persona.interests[0] || 'музыка';
    const i2 = persona.interests[1] || 'кофе';
    const i3 = persona.interests[2] || i1;

    if (turn === 0) {
      return [
        {
          label: `🎯 Зацепка за «${i1}»`,
          text: `${name}, увидел в профиле «${i1}» — звучит круто! Что тебя в этом больше всего цепляет?`
        },
        {
          label: `😏 Дерзкий заход`,
          text: `Официально заявляю: по теме «${i2}» я составлю тебе конкуренцию. Спорим, что докажу это за 5 минут? 😉`
        },
        {
          label: `✨ Свой вайб`,
          text: `Привет, ${name}! Если коротко: я тоже обожаю «${i3}», и у меня есть идеальная идея на вечер — интересно?)`
        }
      ];
    }

    if (sympathy >= 52) {
      return [
        {
          label: '🔥 Закрыть на встречу',
          text: `Слушай, ${name}, у нас отличный вайб! Погнали в эту пятницу в 19:00 устроим «${persona.idealDate}»?`
        },
        {
          label: `🎧 Про музыку`,
          text: `Кстати, какую музыку ты чаще всего включаешь, когда занимаешься «${i1}»?`
        },
        {
          label: '😏 Игривый вопрос',
          text: `Признавайся честно: какой у тебя главный ред-флаг у парней, и прошёл ли я проверку? 😄`
        }
      ];
    }

    return [
      {
        label: `🎯 Углубить «${i2}»`,
        text: `${name}, расскажи поподробнее про «${i2}» — с чего у тебя всё началось?`
      },
      {
        label: '💼 Про учёбу/дела',
        text: `А чем ты вообще занимаешься в жизни, кроме «${i1}» и «${i3}»?`
      },
      {
        label: '🔥 Идея свидания',
        text: `Мне кажется, вариант «${persona.idealDate}» звучит просто топ. Согласна?)`
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

    const weightedCriteria =
      (critOriginality * 0.24 +
        critConfidence * 0.22 +
        critEngagement * 0.18 +
        critTact * 0.16 +
        critVibe * 0.2) *
      10;

    const turnsCount = messageLogs.length;
    const depthFactor = turnsCount >= 4 ? 1 : turnsCount === 3 ? 0.92 : turnsCount === 2 ? 0.82 : 0.68;
    const diffMult = persona.difficulty === 'Хардкор' ? 1.08 : persona.difficulty === 'Лёгкая' ? 0.95 : 1.0;

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
