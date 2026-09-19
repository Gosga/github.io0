/* ============================================================================
   YourGym — NUTRITION  * ЕДИНЫЙ ФАЙЛ v2.1 *
   ----------------------------------------------------------------------------
   ЭТО ОДИН ФАЙЛ ВМЕСТО ДВУХ. Внутри: математика + интерфейс.
   Подключать в index.html только его:

       <script src="mesocycle/nutrition.js"></script>

   ЧТО ВНУТРИ:
     • Калории и БЖУ по Mifflin-St Jeor под цель (масса / сила / сушка)
     • Меню на 28 дней: продукты ротируются, повторов внутри дня нет
     • Список покупок, варианты замен, время приёмов
     • Превью калорий видно ВСЕГДА, меню — за замком до покупки
     • Кнопка в замке открывает окно с двумя тарифами (нужен paywall-modal.js)

   КАК ПРОВЕРИТЬ, ЧТО ЗАГРУЗИЛСЯ ИМЕННО ОН:
     1) В левом нижнем углу появится значок "NUTRITION v2.1"
     2) В консоли — зелёная плашка "NUTRITION UI v2.1 (build 3)"
     3) Вторая строка этого файла — v2.1 (открой в Блокноте, посмотри начало)

   Если значка нет — в браузер попал старый файл.
   Убрать значок: YourGymNutritionUI_hideBadge()

   НЕ трогает: расчёты тренировок, mod-*.js, mesocycle-core.js,
               template-builder, pipeline-dispatcher, HTML, CSS.
   ============================================================================ */

/* ============================================================================
   YourGym — NUTRITION CORE v2.0
   ----------------------------------------------------------------------------
   ЧИСТАЯ МАТЕМАТИКА. Никакого DOM. Отдаёт объект с расчётом.

   Что нового против v1:
     • Продукты НЕ повторяются внутри дня (ротация по дню + приёму пищи).
     • Приёмы пищи тематические: яйца/творог на завтрак, творог на ночь,
       рыба на ужин — а не одна говядина пять раз подряд.
     • Углеводы делятся на ДВА источника в приёме — порции выглядят живыми.
     • В каждом приёме есть варианты замены («заменить можно на...»).
     • Указано время приёма и короткое пояснение по каждому.
     • Продукты ротируются по неделям — 28 дней без повторов.

   Формула BMR: Mifflin-St Jeor (современный стандарт).
   НЕ трогает: квиз, mod-*.js, mesocycle-core.js, template-builder,
               pipeline-dispatcher, HTML, CSS.
   ============================================================================ */

(function (global) {
    'use strict';

    /* ======================= 1. БАЗА ПРОДУКТОВ =======================
       p / f / c — граммы БЖУ на 100 г.
       Для круп, макарон и бобовых — СУХОЙ вес.
       goals: для каких целей продукт подходит ('all' = для всех).
       kind:  к какой группе относится (для списка покупок).
    ================================================================== */

    var FOOD = {
        /* --- БЕЛОК --- */
        chicken_breast: { name: 'Куриная грудка',            p: 23.6, f: 1.9,  c: 0.4, kind: 'protein', goals: ['all'] },
        chicken_thigh:  { name: 'Куриное бедро без кожи',    p: 19.0, f: 7.0,  c: 0.0, kind: 'protein', goals: ['масса', 'сила'] },
        turkey:         { name: 'Индейка, филе',             p: 19.2, f: 2.0,  c: 0.0, kind: 'protein', goals: ['all'] },
        beef_lean:      { name: 'Говядина нежирная',         p: 20.2, f: 7.0,  c: 0.0, kind: 'protein', goals: ['масса', 'сила'] },
        cod:            { name: 'Треска',                    p: 16.0, f: 0.6,  c: 0.0, kind: 'protein', goals: ['all'] },
        pollock:        { name: 'Минтай',                    p: 15.9, f: 0.9,  c: 0.0, kind: 'protein', goals: ['all'] },
        salmon:         { name: 'Лосось',                    p: 19.8, f: 6.3,  c: 0.0, kind: 'protein', goals: ['масса', 'сила'] },
        mackerel:       { name: 'Скумбрия',                  p: 18.0, f: 13.2, c: 0.0, kind: 'protein', goals: ['масса', 'сила'] },
        tuna_can:       { name: 'Тунец в собственном соку',  p: 22.0, f: 1.0,  c: 0.0, kind: 'protein', goals: ['all'] },
        eggs:           { name: 'Яйца',                      p: 12.7, f: 11.5, c: 0.7, kind: 'protein', goals: ['all'],
                          unit: 'шт', gramsPerUnit: 55 },
        egg_white:      { name: 'Яичный белок',              p: 11.0, f: 0.2,  c: 0.0, kind: 'protein', goals: ['сушка'] },
        cottage5:       { name: 'Творог 5%',                 p: 17.0, f: 5.0,  c: 3.0, kind: 'protein', goals: ['all'] },
        cottage2:       { name: 'Творог 2%',                 p: 18.0, f: 2.0,  c: 1.5, kind: 'protein', goals: ['all'] },
        greek_yogurt:   { name: 'Греческий йогурт 2%',       p: 9.0,  f: 2.0,  c: 4.0, kind: 'protein', goals: ['all'] },
        kefir:          { name: 'Кефир 1%',                  p: 3.0,  f: 1.0,  c: 4.0, kind: 'protein', goals: ['all'] },
        cheese45:       { name: 'Сыр 45%',                   p: 25.0, f: 27.0, c: 0.0, kind: 'protein', goals: ['масса', 'сила'] },
        whey:           { name: 'Протеин (сыворотка)',       p: 80.0, f: 5.0,  c: 7.0, kind: 'protein', goals: ['all'] },
        tofu:           { name: 'Тофу',                      p: 8.0,  f: 4.5,  c: 2.0, kind: 'protein', goals: ['all'] },
        lentils:        { name: 'Чечевица (сухая)',          p: 24.0, f: 1.5,  c: 60.0, kind: 'protein', goals: ['all'] },

        /* --- УГЛЕВОДЫ --- */
        buckwheat:      { name: 'Гречка (сухая)',            p: 12.6, f: 3.3,  c: 62.0, kind: 'carb', goals: ['all'] },
        rice_white:     { name: 'Рис белый (сухой)',         p: 6.7,  f: 0.7,  c: 78.0, kind: 'carb', goals: ['all'] },
        rice_brown:     { name: 'Рис бурый (сухой)',         p: 7.5,  f: 2.0,  c: 72.0, kind: 'carb', goals: ['all'] },
        oats:           { name: 'Овсянка (сухая)',           p: 13.0, f: 7.0,  c: 60.0, kind: 'carb', goals: ['all'] },
        bulgur:         { name: 'Булгур (сухой)',            p: 12.0, f: 1.5,  c: 63.0, kind: 'carb', goals: ['all'] },
        couscous:       { name: 'Кускус (сухой)',            p: 12.8, f: 0.6,  c: 72.0, kind: 'carb', goals: ['all'] },
        pasta:          { name: 'Паста твёрдых сортов (сухая)', p: 12.5, f: 1.5, c: 70.0, kind: 'carb', goals: ['масса', 'сила'] },
        potato:         { name: 'Картофель',                 p: 2.0,  f: 0.4,  c: 17.0, kind: 'carb', goals: ['all'] },
        sweet_potato:   { name: 'Батат',                     p: 1.6,  f: 0.2,  c: 20.0, kind: 'carb', goals: ['all'] },
        banana:         { name: 'Банан',                     p: 1.5,  f: 0.2,  c: 21.0, kind: 'carb', goals: ['all'] },
        apple:          { name: 'Яблоко',                    p: 0.4,  f: 0.4,  c: 10.0, kind: 'carb', goals: ['all'] },
        bread_wg:       { name: 'Хлеб цельнозерновой',       p: 8.5,  f: 3.5,  c: 45.0, kind: 'carb', goals: ['all'] },
        honey:          { name: 'Мёд',                       p: 0.5,  f: 0.0,  c: 80.0, kind: 'carb', goals: ['масса', 'сила'] },
        beans_red:      { name: 'Фасоль красная (сухая)',    p: 21.0, f: 1.5,  c: 47.0, kind: 'carb', goals: ['all'] },

        /* --- ЖИРЫ --- */
        olive_oil:      { name: 'Оливковое масло',           p: 0.0,  f: 100.0, c: 0.0, kind: 'fat', goals: ['all'] },
        sesame_oil:     { name: 'Кунжутное масло',           p: 0.0,  f: 99.0,  c: 0.0, kind: 'fat', goals: ['all'] },
        walnuts:        { name: 'Грецкие орехи',             p: 15.0, f: 65.0,  c: 7.0, kind: 'fat', goals: ['all'] },
        almond:         { name: 'Миндаль',                   p: 21.0, f: 49.0,  c: 13.0, kind: 'fat', goals: ['all'] },
        avocado:        { name: 'Авокадо',                   p: 2.0,  f: 15.0,  c: 6.0, kind: 'fat', goals: ['all'] },
        butter:         { name: 'Сливочное масло 82%',       p: 0.5,  f: 82.0,  c: 0.8, kind: 'fat', goals: ['масса', 'сила'] },
        peanut_butter:  { name: 'Арахисовая паста',          p: 25.0, f: 50.0,  c: 13.0, kind: 'fat', goals: ['масса', 'сила'] },
        flax:           { name: 'Семена льна',               p: 18.0, f: 42.0,  c: 29.0, kind: 'fat', goals: ['all'] },
        olives:         { name: 'Оливки',                    p: 0.8,  f: 11.0,  c: 6.0, kind: 'fat', goals: ['all'] }
    };

    var VEG = ['Брокколи', 'Огурцы', 'Помидоры', 'Салат листовой', 'Кабачки',
               'Капуста белокочанная', 'Перец болгарский', 'Шпинат',
               'Стручковая фасоль', 'Цветная капуста', 'Редис', 'Морковь'];

    /* ======================= 2. КОЭФФИЦИЕНТЫ ПОД ЦЕЛЬ ======================= */

    var GOAL_CONFIG = {
        'масса': { kcalShift: +0.12, proteinPerKg: 2.0, fatPerKg: 1.0, meals: 5 },
        'сила':  { kcalShift: +0.08, proteinPerKg: 2.0, fatPerKg: 1.0, meals: 4 },
        'сушка': { kcalShift: -0.18, proteinPerKg: 2.4, fatPerKg: 0.9, meals: 4 }
    };

    var ACTIVITY_BY_DAYS = { '1': 1.375, '2': 1.45, '3': 1.50, '4': 1.55 };
    var DEFAULT_ACTIVITY = 1.45;

    var PHASE_SHIFT = [
        { carb: 1.00, fat: 1.00 },
        { carb: 1.00, fat: 1.00 },
        { carb: 1.05, fat: 1.00 },
        { carb: 0.92, fat: 1.08 }
    ];

    var PHASE_LABEL = ['Адаптация', 'Накопление', 'Пик объёма', 'Разгрузка'];
    var PHASE_NOTE = [
        null,
        null,
        'Пик объёма: углеводы +5% — энергии на максимальные подходы.',
        'Разгрузка: углеводы ниже, жиры выше — восстановление перед новым циклом.'
    ];

    /* ======================= 3. СХЕМЫ ПРИЁМОВ ПИЩИ =======================
       Тематические приёмы: завтрак — яйца/творог, перед сном — творог,
       на ужин — рыба/мясо. Никакой говядины в 6 утра.
    ====================================================================== */

    var MEAL_SCHEMES = {
        4: [
            { time: '08:00', name: 'Завтрак', share: 0.27,
              protein: ['eggs', 'cottage5', 'cheese45', 'whey', 'tofu'],
              carb:    ['oats', 'bread_wg', 'banana', 'buckwheat'],
              fat:     ['butter', 'peanut_butter', 'walnuts', 'olive_oil'],
              note:    'Белковый завтрак запускает синтез белка после ночного голодания.' },
            { time: '13:00', name: 'Обед', share: 0.29,
              protein: ['chicken_breast', 'beef_lean', 'turkey', 'chicken_thigh', 'tuna_can', 'lentils'],
              carb:    ['buckwheat', 'rice_white', 'bulgur', 'pasta', 'rice_brown', 'couscous'],
              fat:     ['olive_oil', 'avocado', 'sesame_oil'],
              note:    'Плотный приём в середине дня — основная энергия на активность.' },
            { time: '16:30', name: 'Перекус', share: 0.17,
              protein: ['greek_yogurt', 'cottage2', 'whey', 'kefir', 'eggs'],
              carb:    ['banana', 'apple', 'bread_wg', 'beans_red'],
              fat:     ['almond', 'walnuts', 'olives'],
              note:    'Небольшой приём, чтобы не уйти в сплошное чувство голода.' },
            { time: '20:00', name: 'Ужин', share: 0.27,
              protein: ['cod', 'pollock', 'salmon', 'mackerel', 'chicken_breast', 'beef_lean'],
              carb:    ['rice_white', 'potato', 'sweet_potato', 'buckwheat'],
              fat:     ['olive_oil', 'avocado', 'flax'],
              note:    'Если в этот день тренировка — это основной восстановительный приём.' }
        ],
        5: [
            { time: '08:00', name: 'Завтрак', share: 0.22,
              protein: ['eggs', 'cottage5', 'cheese45', 'whey', 'tofu'],
              carb:    ['oats', 'bread_wg', 'banana', 'buckwheat'],
              fat:     ['butter', 'peanut_butter', 'walnuts'],
              note:    'Белковый завтрак запускает синтез белка после ночного голодания.' },
            { time: '12:00', name: 'Обед', share: 0.25,
              protein: ['chicken_breast', 'beef_lean', 'turkey', 'chicken_thigh', 'lentils'],
              carb:    ['buckwheat', 'rice_white', 'bulgur', 'pasta', 'rice_brown'],
              fat:     ['olive_oil', 'avocado', 'sesame_oil'],
              note:    'Плотный приём в середине дня — основная энергия на активность.' },
            { time: '16:00', name: 'Перекус (до тренировки)', share: 0.14,
              protein: ['whey', 'greek_yogurt', 'cottage2', 'kefir'],
              carb:    ['banana', 'apple', 'honey', 'bread_wg'],
              fat:     ['almond', 'walnuts'],
              note:    'За 1.5–2 часа до тренировки: быстрые углеводы как топливо.' },
            { time: '20:00', name: 'Ужин (после тренировки)', share: 0.27,
              protein: ['beef_lean', 'chicken_breast', 'salmon', 'mackerel', 'tuna_can', 'turkey'],
              carb:    ['rice_white', 'buckwheat', 'potato', 'sweet_potato', 'couscous'],
              fat:     ['olive_oil', 'avocado'],
              note:    'Основной восстановительный приём: белок + углеводы на ресинтез гликогена.' },
            { time: '22:30', name: 'Перед сном', share: 0.12,
              protein: ['cottage5', 'cottage2', 'greek_yogurt', 'kefir'],
              carb:    [],
              fat:     ['flax', 'walnuts', 'almond'],
              note:    'Медленный белок на ночь — поддерживает синтез до утра.' }
        ]
    };

    /* ============================ 4. УТИЛИТЫ ============================ */

    function round5(x) { return Math.max(0, Math.round(x / 5) * 5); }
    function round10(x) { return Math.max(0, Math.round(x / 10) * 10); }
    function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }

    function isAllowed(food, goal) {
        if (!food || !food.goals) return true;
        return food.goals.indexOf('all') !== -1 || food.goals.indexOf(goal) !== -1;
    }

    /**
     * Выбор продукта с защитой от повторов.
     * seed      — номер ротации (день + приём + неделя)
     * used      — набор уже использованных id за день (мутируется)
     */
    function pick(ids, goal, seed, used) {
        var list = [], i;

        for (i = 0; i < ids.length; i++) {
            if (FOOD[ids[i]] && isAllowed(FOOD[ids[i]], goal)) list.push(ids[i]);
        }
        if (!list.length) {
            for (i = 0; i < ids.length; i++) if (FOOD[ids[i]]) list.push(ids[i]);
        }
        if (!list.length) return null;

        var fresh = list.filter(function (id) { return !used[id]; });
        var pool = fresh.length ? fresh : list;
        var chosen = pool[Math.abs(seed) % pool.length];

        used[chosen] = true;
        return chosen;
    }

    function alternativesFor(ids, goal, excludeId, n) {
        var out = [];
        for (var i = 0; i < ids.length; i++) {
            var id = ids[i];
            if (id === excludeId) continue;
            var f = FOOD[id];
            if (!f || !isAllowed(f, goal)) continue;
            out.push(f.name);
            if (out.length >= n) break;
        }
        return out;
    }

    function gramsFor(targetGrams, per100) {
        if (!per100 || per100 <= 0) return 0;
        return round5(targetGrams / (per100 / 100));
    }

    /* ====================== 5. РАСЧЁТ КАЛОРИЙ И БЖУ ====================== */

    function calcTargets(body, ctx) {
        body = body || {};
        ctx = ctx || {};

        var sex = body.sex === 'f' ? 'f' : 'm';
        var weight = Number(body.weight) || 0;
        var height = Number(body.height) || 0;
        var age = Number(body.age) || 0;

        if (weight <= 0 || height <= 0 || age <= 0) {
            throw new Error('Нужны вес, рост и возраст — без них расчёт калорий невозможен.');
        }

        var goal = GOAL_CONFIG[ctx.goal] ? ctx.goal : 'сила';
        var cfg = GOAL_CONFIG[goal];

        var bmr = 10 * weight + 6.25 * height - 5 * age + (sex === 'm' ? 5 : -161);
        var activity = ACTIVITY_BY_DAYS[String(ctx.days)] || DEFAULT_ACTIVITY;
        var tdee = bmr * activity;
        var kcal = tdee * (1 + cfg.kcalShift);

        var protein = cfg.proteinPerKg * weight;
        var fat = cfg.fatPerKg * weight;
        var carbs = Math.max(0, (kcal - protein * 4 - fat * 9) / 4);

        var warning = null;
        if (kcal < bmr * 1.05) {
            kcal = bmr * 1.05;
            carbs = Math.max(0, (kcal - protein * 4 - fat * 9) / 4);
            warning = 'Дефицит скорректирован: калорийность поднята до безопасного ' +
                      'минимума (уровень базового метаболизма).';
        }

        return {
            goal: goal,
            sex: sex,
            weight: weight,
            bmr: Math.round(bmr),
            tdee: Math.round(tdee),
            activity: activity,
            kcal: round10(kcal),
            protein: Math.round(protein),
            fat: Math.round(fat),
            carbs: Math.round(carbs),
            fiber: Math.round(clamp(kcal / 1000 * 12, 25, 45)),
            waterMl: Math.round(weight * 33 / 100) * 100,
            meals: cfg.meals,
            trainingDays: clamp(Number(ctx.days) || 3, 1, 6),
            warning: warning
        };
    }

    /* ============ 6. РОТАЦИЯ УГЛЕВОДОВ ПО ДНЯМ (тренировка / отдых) ============ */

    function buildDayMultipliers(trainingDays) {
        var t = clamp(Number(trainingDays) || 3, 1, 6);
        var rest = 7 - t;

        var rawT = 1.15, rawR = 0.85;
        var k = 7 / (t * rawT + rest * rawR);

        return { training: rawT * k, rest: rawR * k };
    }

    /* ====================== 7. СБОРКА ОДНОГО ПРИЁМА ПИЩИ ====================== */

    function buildMeal(def, mealIndex, dayIndex, weekIndex, dayTargets, goal, used) {
        var tP = dayTargets.protein * def.share;
        var tC = dayTargets.carbs * def.share;
        var tF = dayTargets.fat * def.share;

        // свой сдвиг на каждый приём + ротация по неделям (28 дней без повторов)
        var seed = weekIndex * 101 + dayIndex * 17 + mealIndex * 7 + 3;

        var items = [];
        var swaps = [];
        var macros = { p: 0, f: 0, c: 0 };

        /* ---------- БЕЛОК ---------- */
        var pId = pick(def.protein, goal, seed, used);
        if (pId) {
            var pFood = FOOD[pId];
            var pGrams = gramsFor(tP, pFood.p);
            var pieces = null;

            if (pFood.unit === 'шт' && pFood.gramsPerUnit) {
                pieces = Math.max(1, Math.round(pGrams / pFood.gramsPerUnit));
                pGrams = pieces * pFood.gramsPerUnit;
            }

            if (pGrams > 0) {
                macros.p += pGrams * pFood.p / 100;
                macros.f += pGrams * pFood.f / 100;
                macros.c += pGrams * pFood.c / 100;

                items.push({
                    id: pId, kind: 'protein', name: pFood.name, grams: pGrams,
                    display: pieces
                        ? pFood.name + ' — ' + pieces + ' шт (~' + pGrams + ' г)'
                        : pFood.name + ' — ' + pGrams + ' г'
                });
            }

            var pAlt = alternativesFor(def.protein, goal, pId, 2);
            if (pAlt.length) swaps.push({ kind: 'Белок', names: pAlt });
        }

        /* ---------- УГЛЕВОДЫ (два источника, 65% / 35%) ---------- */
        if (def.carb && def.carb.length && tC > 0) {
            var c1Id = pick(def.carb, goal, seed + 11, used);
            var c1Food = c1Id ? FOOD[c1Id] : null;

            if (c1Food) {
                var c1Grams = gramsFor(tC * 0.65, c1Food.c);
                if (c1Grams > 0) {
                    macros.p += c1Grams * c1Food.p / 100;
                    macros.f += c1Grams * c1Food.f / 100;
                    macros.c += c1Grams * c1Food.c / 100;

                    items.push({
                        id: c1Id, kind: 'carb', name: c1Food.name, grams: c1Grams,
                        display: c1Food.name + ' — ' + c1Grams + ' г'
                    });
                }
            }

            // второй источник — другой продукт, чтобы не было монотонности
            var rest2 = def.carb.filter(function (id) { return id !== c1Id; });
            var c2Id = rest2.length ? pick(rest2, goal, seed + 23, used) : null;
            var c2Food = c2Id ? FOOD[c2Id] : null;

            if (c2Food) {
                var c2Grams = gramsFor(tC * 0.35, c2Food.c);
                if (c2Grams > 0) {
                    macros.p += c2Grams * c2Food.p / 100;
                    macros.f += c2Grams * c2Food.f / 100;
                    macros.c += c2Grams * c2Food.c / 100;

                    items.push({
                        id: c2Id, kind: 'carb', name: c2Food.name, grams: c2Grams,
                        display: c2Food.name + ' — ' + c2Grams + ' г'
                    });
                }
            }

            var cAlt = alternativesFor(def.carb, goal, c1Id, 3);
            if (cAlt.length) swaps.push({ kind: 'Углеводы', names: cAlt });
        }

        /* ---------- ЖИРЫ (добираем остаток) ---------- */
        var fatLeft = Math.max(0, tF - macros.f);
        var fId = pick(def.fat, goal, seed + 37, used);

        if (fId && fatLeft > 1) {
            var fFood = FOOD[fId];
            var fGrams = gramsFor(fatLeft, fFood.f);

            if (fGrams > 0) {
                macros.f += fGrams * fFood.f / 100;
                macros.p += fGrams * fFood.p / 100;
                macros.c += fGrams * fFood.c / 100;

                items.push({
                    id: fId, kind: 'fat', name: fFood.name, grams: fGrams,
                    display: fFood.name + ' — ' + fGrams + ' г'
                });
            }

            var fAlt = alternativesFor(def.fat, goal, fId, 2);
            if (fAlt.length) swaps.push({ kind: 'Жиры', names: fAlt });
        }

        /* ---------- ОВОЩИ ---------- */
        var vegName = VEG[(weekIndex * 5 + dayIndex * 3 + mealIndex) % VEG.length];
        var vegGrams = goal === 'сушка' ? 200 : 150;

        items.push({
            id: 'veg_' + vegName, kind: 'veg', name: vegName, grams: vegGrams,
            display: vegName + ' — ' + vegGrams + ' г'
        });

        var kcal = Math.round(macros.p * 4 + macros.f * 9 + macros.c * 4);

        return {
            name: def.name,
            time: def.time,
            share: Math.round(def.share * 100) + '%',
            note: def.note || null,
            items: items,
            swaps: swaps,
            approx: {
                kcal: kcal,
                p: Math.round(macros.p),
                f: Math.round(macros.f),
                c: Math.round(macros.c)
            }
        };
    }

    /* ====================== 8. ДЕНЬ ПИТАНИЯ ====================== */

    function buildDayPlan(baseTargets, dayType, dayIndex, weekIndex, phase) {
        phase = phase || { carb: 1, fat: 1 };

        var mult = buildDayMultipliers(baseTargets.trainingDays);
        var carbMul = (dayType === 'training' ? mult.training : mult.rest) * phase.carb;

        var dayTargets = {
            protein: baseTargets.protein,
            fat: baseTargets.fat * phase.fat,
            carbs: baseTargets.carbs * carbMul
        };

        var kcal = dayTargets.protein * 4 + dayTargets.carbs * 4 + dayTargets.fat * 9;

        var scheme = MEAL_SCHEMES[baseTargets.meals] || MEAL_SCHEMES[4];
        var used = {};   // защита от повторов продуктов внутри дня

        var meals = scheme.map(function (def, i) {
            return buildMeal(def, i, dayIndex, weekIndex, dayTargets,
                             baseTargets.goal, used);
        });

        return {
            dayType: dayType,
            label: dayType === 'training' ? 'Тренировочный день' : 'День отдыха',
            kcal: round10(kcal),
            protein: Math.round(dayTargets.protein),
            fat: Math.round(dayTargets.fat),
            carbs: Math.round(dayTargets.carbs),
            note: dayType === 'training'
                ? 'Углеводы повышены — топливо для работы. Калории за неделю не растут.'
                : 'Углеводы ниже, белок и овощи те же. Средние калории за неделю сохранены.',
            meals: meals
        };
    }

    /* ====================== 9. НЕДЕЛЯ ====================== */

    function buildWeekPlan(baseTargets, weekIndex) {
        var phase = PHASE_SHIFT[clamp(weekIndex, 0, 3)];
        var trainingDays = clamp(Number(baseTargets.trainingDays) || 3, 1, 6);

        var pattern = {
            1: [0], 2: [0, 3], 3: [0, 2, 4], 4: [0, 1, 3, 4],
            5: [0, 1, 2, 4, 5], 6: [0, 1, 2, 3, 4, 5]
        }[trainingDays] || [0, 2, 4];

        var dayNames = ['Понедельник', 'Вторник', 'Среда', 'Четверг',
                        'Пятница', 'Суббота', 'Воскресенье'];

        var days = [];
        for (var d = 0; d < 7; d++) {
            var isTraining = pattern.indexOf(d) !== -1;
            var plan = buildDayPlan(baseTargets, isTraining ? 'training' : 'rest',
                                    d, weekIndex, phase);
            plan.dayName = dayNames[d];
            days.push(plan);
        }

        var avgKcal = Math.round(days.reduce(function (s, x) { return s + x.kcal; }, 0) / 7);

        return {
            weekNumber: weekIndex + 1,
            phaseLabel: PHASE_LABEL[clamp(weekIndex, 0, 3)],
            phaseNote: PHASE_NOTE[clamp(weekIndex, 0, 3)],
            avgKcal: avgKcal,
            days: days
        };
    }

    /* ====================== 10. СПИСОК ПОКУПОК ====================== */

    function buildShoppingList(weekPlan) {
        var map = {};

        weekPlan.days.forEach(function (day) {
            day.meals.forEach(function (meal) {
                meal.items.forEach(function (it) {
                    if (!it.grams) return;
                    if (!map[it.name]) {
                        map[it.name] = { name: it.name, grams: 0, kind: it.kind };
                    }
                    map[it.name].grams += it.grams;
                });
            });
        });

        var groups = { 'Белок': [], 'Углеводы': [], 'Жиры': [], 'Овощи': [] };

        Object.keys(map).forEach(function (k) {
            var e = map[k];
            var g = e.kind === 'protein' ? 'Белок'
                  : e.kind === 'carb'    ? 'Углеводы'
                  : e.kind === 'fat'     ? 'Жиры'
                  : 'Овощи';

            groups[g].push({
                name: e.name,
                grams: e.grams,
                display: e.grams >= 1000
                    ? (Math.round(e.grams / 100) / 10) + ' кг'
                    : e.grams + ' г'
            });
        });

        return groups;
    }

    /* ====================== 11. ПУБЛИЧНЫЙ API ====================== */

    var API = {
        VERSION: '2.1',
        BUILD: 2,
        calcTargets: calcTargets,
        buildWeekPlan: buildWeekPlan,
        buildDayPlan: buildDayPlan,
        buildShoppingList: buildShoppingList,
        getMealTemplate: function (n) { return MEAL_SCHEMES[n] || MEAL_SCHEMES[4]; },
        FOOD: FOOD,
        FOOD_DB: FOOD,
        GOAL_CONFIG: GOAL_CONFIG,
        VEG: VEG,

        /**
         * Полный план на месяц (4 недели), синхронизированный с мезоциклом.
         */
        buildMonthPlan: function (body, ctx) {
            var base = calcTargets(body, ctx);

            var weeks = [];
            for (var w = 0; w < 4; w++) {
                weeks.push(buildWeekPlan(base, w));
            }

            return {
                targets: base,
                weeks: weeks,
                shoppingList: buildShoppingList(weeks[0]),
                disclaimer: 'Расчёт по формуле Mifflin-St Jeor. Это общие ' +
                            'рекомендации, а не медицинское назначение. При ' +
                            'хронических заболеваниях, беременности или ' +
                            'расстройствах пищевого поведения — только с врачом.'
            };
        }
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = API;   // для тестов в Node
    }
    global.YourGymNutrition = API;

})(typeof window !== 'undefined' ? window : globalThis);


/* =========================================================================
   ЧАСТЬ 2 ИЗ 2 — ИНТЕРФЕЙС
   ========================================================================= */

/* ============================================================================
   YourGym — NUTRITION UI v2.0
   ----------------------------------------------------------------------------
   ИСПРАВЛЕНО против v1:
     1) Карточка больше НЕ пропадает после перерисовки/перезахода.
        Убрана блокировка cardBuilt — теперь сравнение по «отпечатку» плана.
     2) Оффер объединяет ПРОГРАММУ и ПИТАНИЕ (программа — первым, как главный
        товар). Дублирующая кнопка «...ЗА 199 ₽» скрывается, когда карточка
        на месте — чтобы не было двух офферов на экране.
     3) Покупка фиксируется в localStorage: после перезахода планы остаются
        открытыми, кнопка «ИЗМЕНИТЬ ОТВЕТЫ» убирается (защита от абуза).
     4) Чиню вёрстку: ссылка «на консультацию» больше не липнет к кнопке —
        кнопка и ссылка встают в столбик по центру.
     5) Снимок сессии: можно вернуть результат после F5 (чип «Продолжить»).

   НЕ трогает: расчёты тренировок, mod-*.js, mesocycle-core.js, template-builder,
               pipeline-dispatcher, CSS сайта, HTML.

   Зависимости: nutrition-core.js + paywall-modal.js
   Установка:   <script src="mesocycle/nutrition-ui.js"></script>  — ПОСЛЕДНИМ
   ============================================================================ */

(function () {
    'use strict';

    var TAG = '[YourGym NUTRITION]';

    var STYLE_ID  = 'ygNutriStyles';
    var LS_BODY   = 'yg_body_params_v1';
    var LS_STATE  = 'yg_purchase_state_v1';   // { unlocked, purchased, ts }
    var LS_SNAP   = 'yg_session_snapshot_v1'; // снимок квиза для возврата после F5

    var CALC_ID   = 'dynamicFinalInputsContainer';
    var CARD_ID   = 'ygNutritionCard';
    var FIELDS_ID = 'ygBodyFields';
    var CHIP_ID   = 'ygRestoreChip';

    // текст отдельной кнопки — показывается ТОЛЬКО если карточки нет
    var STANDALONE_BUTTON_TEXT = '📊 ПОЛУЧИТЬ ПРОГРАММУ — ОТ 299 ₽';

    var state = {
        sex: 'm', height: '', weight: '', age: '',
        unlocked: false,
        purchased: false,
        lastPlan: null,
        lastSig: '',
        restoreOffered: false
    };

    /* ===================== СОХРАНЕНИЕ / ЗАГРУЗКА ===================== */

    function loadSaved() {
        try {
            var b = JSON.parse(localStorage.getItem(LS_BODY) || '{}');
            state.sex    = b.sex === 'f' ? 'f' : 'm';
            state.height = b.height || '';
            state.weight = b.weight || '';
            state.age    = b.age    || '';
        } catch (e) {}

        try {
            var s = JSON.parse(localStorage.getItem(LS_STATE) || '{}');
            state.unlocked  = !!s.unlocked;
            state.purchased = !!s.purchased;
        } catch (e) {}
    }

    function saveBody() {
        try {
            localStorage.setItem(LS_BODY, JSON.stringify({
                sex: state.sex, height: state.height,
                weight: state.weight, age: state.age
            }));
        } catch (e) {}
    }

    function saveState() {
        try {
            localStorage.setItem(LS_STATE, JSON.stringify({
                unlocked: state.unlocked,
                purchased: state.purchased,
                ts: Date.now()
            }));
        } catch (e) {}
    }

    /* ============================== СТИЛИ ============================== */

    function injectStyles() {
        if (document.getElementById(STYLE_ID)) return;

        var css = ''

        /* ---------- блок параметров тела ---------- */
        + '#' + FIELDS_ID + '{margin:26px 0 22px;padding:22px 20px 18px;'
        + 'background:linear-gradient(165deg,#141824 0%,#0d0f14 100%);'
        + 'border:1px solid rgba(0,255,204,.28);border-radius:14px;'
        + 'box-shadow:0 0 26px rgba(0,255,204,.07);'
        + 'font-family:Arial,"DejaVu Sans",sans-serif;}'
        + '#' + FIELDS_ID + ' .ygn-head{display:flex;align-items:center;gap:9px;'
        + 'margin-bottom:6px;font-size:13px;font-weight:700;letter-spacing:.9px;'
        + 'color:#00ffcc;text-transform:uppercase;}'
        + '#' + FIELDS_ID + ' .ygn-hint{margin:0 0 18px;font-size:11.5px;'
        + 'line-height:1.55;color:#7d8798;}'
        + '#' + FIELDS_ID + ' .ygn-grid{display:grid;grid-template-columns:1fr 1fr;'
        + 'gap:14px 18px;}'
        + '#' + FIELDS_ID + ' label{display:block;margin-bottom:7px;font-size:12px;'
        + 'font-weight:700;line-height:1.35;color:#c8d2de;}'
        + '#' + FIELDS_ID + ' input,#' + FIELDS_ID + ' select{width:100%;'
        + 'box-sizing:border-box;padding:11px 13px;font:13px/1.2 Arial,sans-serif;'
        + 'color:#e8edf4;background:#1a1d26;'
        + 'border:1px solid rgba(255,255,255,.12);border-radius:9px;'
        + 'outline:none;transition:border-color .18s,box-shadow .18s;}'
        + '#' + FIELDS_ID + ' input::placeholder{color:#5f6875;}'
        + '#' + FIELDS_ID + ' input:focus,#' + FIELDS_ID + ' select:focus{'
        + 'border-color:rgba(0,255,204,.65);box-shadow:0 0 0 3px rgba(0,255,204,.11);}'
        + '#' + FIELDS_ID + ' select{appearance:none;cursor:pointer;}'
        + '#' + FIELDS_ID + ' .ygn-note{grid-column:1/-1;margin-top:2px;'
        + 'font-size:11px;line-height:1.5;color:#6b7480;}'

        /* ---------- служебный класс: скрыто ---------- */
        + '.yg-hidden{display:none !important;}'

        /* ---------- карточка ---------- */
        + '#' + CARD_ID + '{margin:26px 0;padding:24px 22px 20px;'
        + 'background:linear-gradient(165deg,#11151f 0%,#0d0f14 100%);'
        + 'border:1px solid rgba(0,255,204,.3);border-radius:16px;'
        + 'box-shadow:0 0 34px rgba(0,255,204,.09);'
        + 'font-family:Arial,"DejaVu Sans",sans-serif;color:#e8edf4;}'
        + '#' + CARD_ID + ' .ygc-title{margin:0 0 18px;font-size:15px;'
        + 'font-weight:700;letter-spacing:1.1px;color:#00ffcc;'
        + 'text-transform:uppercase;text-align:center;'
        + 'text-shadow:0 0 18px rgba(0,255,204,.4);}'

        + '#' + CARD_ID + ' .ygc-kcal{text-align:center;margin-bottom:4px;}'
        + '#' + CARD_ID + ' .ygc-kcal b{font-size:clamp(34px,6vw,46px);'
        + 'line-height:1;color:#fff;font-variant-numeric:tabular-nums;'
        + 'text-shadow:0 0 26px rgba(0,255,204,.35);}'
        + '#' + CARD_ID + ' .ygc-kcal span{font-size:13px;color:#8b95a5;margin-left:7px;}'
        + '#' + CARD_ID + ' .ygc-sub{text-align:center;font-size:11.5px;'
        + 'color:#7d8798;margin-bottom:20px;}'

        + '#' + CARD_ID + ' .ygc-macros{display:grid;gap:11px;margin-bottom:20px;}'
        + '#' + CARD_ID + ' .ygc-mrow{display:grid;grid-template-columns:34px 1fr 74px;'
        + 'align-items:center;gap:11px;}'
        + '#' + CARD_ID + ' .ygc-mlabel{font-size:12px;font-weight:700;color:#aab4c2;}'
        + '#' + CARD_ID + ' .ygc-bar{height:7px;border-radius:5px;'
        + 'background:rgba(255,255,255,.07);overflow:hidden;}'
        + '#' + CARD_ID + ' .ygc-bar i{display:block;height:100%;border-radius:5px;'
        + 'transition:width .7s cubic-bezier(.16,1,.3,1);}'
        + '#' + CARD_ID + ' .ygc-mval{font-size:12.5px;color:#e8edf4;'
        + 'text-align:right;font-variant-numeric:tabular-nums;}'

        + '#' + CARD_ID + ' .ygc-meta{display:flex;flex-wrap:wrap;gap:8px;'
        + 'justify-content:center;margin-bottom:22px;}'
        + '#' + CARD_ID + ' .ygc-chip{padding:6px 11px;border-radius:8px;'
        + 'background:rgba(255,255,255,.04);'
        + 'border:1px solid rgba(255,255,255,.08);font-size:11px;color:#98a2b0;}'
        + '#' + CARD_ID + ' .ygc-chip b{color:#00ffcc;}'

        + '#' + CARD_ID + ' .ygc-weeks{margin-bottom:20px;}'
        + '#' + CARD_ID + ' .ygc-wrow{display:flex;justify-content:space-between;'
        + 'align-items:center;gap:12px;padding:10px 13px;margin-bottom:6px;'
        + 'background:rgba(255,255,255,.022);border-radius:9px;'
        + 'border-left:3px solid rgba(0,255,204,.45);font-size:12px;flex-wrap:wrap;}'
        + '#' + CARD_ID + ' .ygc-wrow b{color:#e8edf4;font-weight:700;}'
        + '#' + CARD_ID + ' .ygc-wrow em{font-style:normal;color:#7d8798;}'
        + '#' + CARD_ID + ' .ygc-wkcal{color:#00ffcc;font-weight:700;'
        + 'font-variant-numeric:tabular-nums;white-space:nowrap;}'
        + '#' + CARD_ID + ' .ygc-wnote{width:100%;margin-top:5px;font-size:10.5px;'
        + 'line-height:1.5;color:#6b7480;font-style:italic;}'

        /* ---------- аккордеон ---------- */
        + '#' + CARD_ID + ' details{border:1px solid rgba(255,255,255,.08);'
        + 'border-radius:10px;margin-bottom:7px;background:rgba(255,255,255,.018);'
        + 'overflow:hidden;}'
        + '#' + CARD_ID + ' summary{cursor:pointer;padding:11px 14px;'
        + 'font-size:12.5px;font-weight:700;color:#c8d2de;list-style:none;'
        + 'display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;'
        + 'transition:background .18s;}'
        + '#' + CARD_ID + ' summary::-webkit-details-marker{display:none;}'
        + '#' + CARD_ID + ' summary:hover{background:rgba(0,255,204,.055);}'
        + '#' + CARD_ID + ' details[open] > summary{background:rgba(0,255,204,.06);}'

        + '#' + CARD_ID + ' .ygc-day{margin:0 12px 10px;padding:12px 13px;'
        + 'background:rgba(0,0,0,.3);border-radius:9px;}'
        + '#' + CARD_ID + ' .ygc-dayhead{display:flex;justify-content:space-between;'
        + 'flex-wrap:wrap;gap:8px;margin-bottom:10px;padding-bottom:8px;'
        + 'border-bottom:1px solid rgba(255,255,255,.07);}'
        + '#' + CARD_ID + ' .ygc-dayname{font-size:12.5px;font-weight:700;color:#00ffcc;}'
        + '#' + CARD_ID + ' .ygc-dayk{font-size:11.5px;color:#98a2b0;'
        + 'font-variant-numeric:tabular-nums;}'
        + '#' + CARD_ID + ' .ygc-daynote{margin-bottom:10px;font-size:10.5px;'
        + 'line-height:1.55;color:#6b7480;font-style:italic;}'

        /* ---------- приём пищи ---------- */
        + '#' + CARD_ID + ' .ygc-meal{margin-bottom:11px;padding-left:11px;'
        + 'border-left:2px solid rgba(0,255,204,.16);}'
        + '#' + CARD_ID + ' .ygc-mealhead{display:flex;justify-content:space-between;'
        + 'flex-wrap:wrap;gap:6px;margin-bottom:5px;}'
        + '#' + CARD_ID + ' .ygc-mealname{font-size:11.5px;font-weight:700;'
        + 'color:#aab4c2;}'
        + '#' + CARD_ID + ' .ygc-mealtime{font-size:10.5px;color:#00ffcc;'
        + 'font-variant-numeric:tabular-nums;opacity:.8;}'
        + '#' + CARD_ID + ' .ygc-mealk{font-size:10.5px;color:#6b7480;'
        + 'font-variant-numeric:tabular-nums;}'
        + '#' + CARD_ID + ' .ygc-items{margin:0 0 5px;padding-left:15px;list-style:none;}'
        + '#' + CARD_ID + ' .ygc-items li{position:relative;font-size:11.5px;'
        + 'color:#98a2b0;line-height:1.7;}'
        + '#' + CARD_ID + ' .ygc-items li:before{content:"•";position:absolute;'
        + 'left:-13px;color:rgba(0,255,204,.6);}'
        + '#' + CARD_ID + ' .ygc-swaps{font-size:10.5px;line-height:1.6;'
        + 'color:#5f6875;}'
        + '#' + CARD_ID + ' .ygc-swaps b{color:#8b95a5;font-weight:400;}'
        + '#' + CARD_ID + ' .ygc-mealnote{margin-top:4px;font-size:10.5px;'
        + 'line-height:1.55;color:#6b7480;font-style:italic;}'

        /* ---------- замок ---------- */
        + '#' + CARD_ID + ' .ygc-lockwrap{position:relative;margin-bottom:18px;'
        + 'border-radius:12px;overflow:hidden;}'
        + '#' + CARD_ID + ' .ygc-locked-content{filter:blur(5px);'
        + 'pointer-events:none;user-select:none;opacity:.45;}'
        + '#' + CARD_ID + ' .ygc-overlay{position:absolute;inset:0;'
        + 'display:flex;flex-direction:column;align-items:center;'
        + 'justify-content:center;gap:11px;text-align:center;padding:16px;'
        + 'background:linear-gradient(180deg,rgba(13,15,20,.3) 0%,'
        + 'rgba(13,15,20,.93) 55%,#0d0f14 100%);}'
        + '#' + CARD_ID + ' .ygc-lockicon{font-size:30px;'
        + 'filter:drop-shadow(0 0 14px rgba(0,255,204,.5));}'
        + '#' + CARD_ID + ' .ygc-locktext{font-size:12.5px;color:#c8d2de;'
        + 'line-height:1.55;max-width:340px;}'
        + '#' + CARD_ID + ' .ygc-locktext b{color:#00ffcc;}'



        + '#' + CARD_ID + ' .ygc-cta{width:100%;padding:16px 20px;border:0;'
        + 'border-radius:11px;cursor:pointer;position:relative;overflow:hidden;'
        + 'font:700 13.5px/1 Arial,sans-serif;letter-spacing:1.1px;'
        + 'text-transform:uppercase;color:#0d0f14;'
        + 'background:linear-gradient(135deg,#00ffcc 0%,#00cc99 100%);'
        + 'box-shadow:0 0 20px rgba(0,255,204,.4);'
        + 'transition:transform .18s,box-shadow .22s;}'
        + '#' + CARD_ID + ' .ygc-cta:hover{transform:translateY(-2px);'
        + 'box-shadow:0 0 32px rgba(0,255,204,.62);}'
        + '#' + CARD_ID + ' .ygc-cta:active{transform:scale(.985);}'
        + '#' + CARD_ID + ' .ygc-cta:after{content:"";position:absolute;top:0;'
        + 'left:-120%;width:60%;height:100%;'
        + 'background:linear-gradient(90deg,transparent,rgba(255,255,255,.5),transparent);'
        + 'transform:skewX(-22deg);animation:ygNShine 3.4s ease-in-out infinite;}'
        + '#' + CARD_ID + ' .ygc-cta.ghost{background:transparent;color:#00ffcc;'
        + 'border:1.5px solid rgba(0,255,204,.5);box-shadow:none;margin-top:9px;}'
        + '#' + CARD_ID + ' .ygc-cta.ghost:after{display:none;}'
        + '#' + CARD_ID + ' .ygc-cta.ghost:hover{background:rgba(0,255,204,.09);}'

        /* ---------- статус покупки ---------- */
        + '#' + CARD_ID + ' .ygc-owned{display:flex;align-items:center;gap:10px;'
        + 'padding:13px 15px;margin-bottom:16px;border-radius:11px;'
        + 'background:rgba(0,255,204,.09);border:1px solid rgba(0,255,204,.42);'
        + 'font-size:12.5px;color:#c8d2de;}'
        + '#' + CARD_ID + ' .ygc-owned b{color:#00ffcc;}'

        + '#' + CARD_ID + ' .ygc-foot{margin:16px 0 0;font-size:10.5px;'
        + 'line-height:1.6;color:#5f6875;text-align:center;}'
        + '#' + CARD_ID + ' .ygc-warn{padding:10px 13px;margin-bottom:16px;'
        + 'border-radius:9px;background:rgba(255,190,80,.07);'
        + 'border:1px solid rgba(255,190,80,.25);font-size:11.5px;'
        + 'line-height:1.55;color:#e0c48a;}'

        /* ---------- чип возврата после F5 ---------- */
        + '#' + CHIP_ID + '{position:fixed;left:50%;bottom:22px;'
        + 'transform:translateX(-50%);z-index:9998;display:flex;'
        + 'align-items:center;gap:11px;padding:12px 16px 12px 18px;'
        + 'background:linear-gradient(135deg,#141824,#0d0f14);'
        + 'border:1px solid rgba(0,255,204,.45);border-radius:14px;'
        + 'box-shadow:0 0 34px rgba(0,255,204,.2),0 16px 40px rgba(0,0,0,.6);'
        + 'font-family:Arial,"DejaVu Sans",sans-serif;font-size:12.5px;'
        + 'color:#c8d2de;animation:ygNSlide .4s cubic-bezier(.16,1,.3,1);}'
        + '#' + CHIP_ID + ' button{padding:9px 15px;border:0;border-radius:9px;'
        + 'cursor:pointer;font:700 11.5px/1 Arial,sans-serif;'
        + 'letter-spacing:.8px;text-transform:uppercase;color:#0d0f14;'
        + 'background:linear-gradient(135deg,#00ffcc,#00cc99);}'
        + '#' + CHIP_ID + ' .ygc-chipx{background:transparent;color:#7d8798;'
        + 'font-size:16px;padding:4px 8px;}'

        + '@keyframes ygNShine{0%{left:-120%;}55%,100%{left:130%;}}'
        + '@keyframes ygNSlide{from{opacity:0;transform:translate(-50%,20px);}'
        + 'to{opacity:1;transform:translate(-50%,0);}}'

        + '@media(max-width:640px){'
        + '#' + FIELDS_ID + ' .ygn-grid{grid-template-columns:1fr;}'
        + '#' + CARD_ID + ' .ygc-mrow{grid-template-columns:30px 1fr 68px;}'
        + '}'
        + '@media(prefers-reduced-motion:reduce){'
        + '#' + CARD_ID + ' *,#' + CHIP_ID + ' *{transition:none !important;'
        + 'animation:none !important;}'
        + '}';

        var s = document.createElement('style');
        s.id = STYLE_ID;
        s.textContent = css;
        document.head.appendChild(s);
    }

    /* ====================== 1. БЛОК ПАРАМЕТРОВ ТЕЛА ====================== */

    function buildFieldsBlock() {
        if (document.getElementById(FIELDS_ID)) return false;

        var calc = document.getElementById(CALC_ID);
        if (!calc) return false;

        var block = document.createElement('div');
        block.id = FIELDS_ID;
        block.innerHTML = ''
        + '<div class="ygn-head">📐 ПАРАМЕТРЫ ТЕЛА ДЛЯ РАСЧЁТА КАЛОРИЙ</div>'
        + '<p class="ygn-hint">Четыре цифры — и ты сразу видишь свои нормы БЖУ '
        + 'под цель. Расчёт идёт прямо в браузере, никуда не отправляется.</p>'
        + '<div class="ygn-grid">'
        +   '<div><label for="ygSex">Пол</label>'
        +     '<select id="ygSex">'
        +       '<option value="m">Мужской</option>'
        +       '<option value="f">Женский</option>'
        +     '</select></div>'
        +   '<div><label for="ygHeight">Рост, см</label>'
        +     '<input id="ygHeight" type="number" inputmode="numeric" '
        +     'placeholder="Например, 180" min="120" max="230"></div>'
        +   '<div><label for="ygWeight">Вес, кг</label>'
        +     '<input id="ygWeight" type="number" inputmode="decimal" '
        +     'placeholder="Например, 80" min="35" max="200" step="0.1"></div>'
        +   '<div><label for="ygAge">Возраст, лет</label>'
        +     '<input id="ygAge" type="number" inputmode="numeric" '
        +     'placeholder="Например, 25" min="14" max="90"></div>'
        +   '<div class="ygn-note">🔒 Данные остаются в браузере и никуда '
        +   'не отправляются.</div>'
        + '</div>';

        // ❗ ВСТАВЛЯЕМ ПЕРЕД калькулятором, НЕ внутрь:
        // collectLiveWeightsMapLocal() в mesocycle-core.js собирает ПМ по индексу
        // input'ов внутри контейнера — любое поле внутри сдвинет все веса.
        calc.parentNode.insertBefore(block, calc);

        var selSex = block.querySelector('#ygSex');
        var inpH   = block.querySelector('#ygHeight');
        var inpW   = block.querySelector('#ygWeight');
        var inpA   = block.querySelector('#ygAge');

        selSex.value = state.sex;
        inpH.value = state.height;
        inpW.value = state.weight;
        inpA.value = state.age;

        function onNum() {
            state.height = inpH.value.trim();
            state.weight = inpW.value.trim();
            state.age    = inpA.value.trim();
            saveBody();
            scheduleRefresh();
        }

        selSex.addEventListener('change', function () {
            state.sex = selSex.value;
            saveBody();
            scheduleRefresh();
        });
        [inpH, inpW, inpA].forEach(function (el) {
            el.addEventListener('input', onNum);
            el.addEventListener('change', onNum);
        });

        console.log(TAG, 'блок параметров тела вставлен ПЕРЕД калькулятором ПМ');
        return true;
    }

    /* ======================= 2. РАСЧЁТ ======================= */

    function readBody() {
        var w = parseFloat(state.weight);
        var h = parseFloat(state.height);
        var a = parseFloat(state.age);
        if (!(w > 0) || !(h > 0) || !(a > 0)) return null;
        if (h < 120 || h > 230 || w < 35 || w > 200 || a < 14 || a > 90) return null;
        return { sex: state.sex, weight: w, height: h, age: a };
    }

    function getCtx() {
        if (typeof window.userContext !== 'undefined' && window.userContext) {
            return window.userContext;
        }
        try {
            if (typeof userContext !== 'undefined' && userContext) return userContext;
        } catch (e) {}
        return {};
    }

    function computePlan() {
        var body = readBody();
        if (!body) return null;

        if (!window.YourGymNutrition || !window.YourGymNutrition.buildMonthPlan) {
            console.warn(TAG, 'nutrition-core.js не подключён');
            return null;
        }

        var ctx = getCtx();
        try {
            return window.YourGymNutrition.buildMonthPlan(body, {
                goal: ctx.goal || 'сила',
                days: ctx.days || 3
            });
        } catch (e) {
            console.error(TAG, 'ошибка расчёта:', e);
            return null;
        }
    }

    /* ======================= 3. РЕНДЕР ======================= */

    function esc(s) {
        return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function macroRow(label, grams, max, color) {
        var pct = Math.max(4, Math.min(100, Math.round(grams / max * 100)));
        return '<div class="ygc-mrow">'
            + '<span class="ygc-mlabel">' + label + '</span>'
            + '<span class="ygc-bar"><i style="width:' + pct + '%;background:'
            + color + '"></i></span>'
            + '<span class="ygc-mval">' + grams + ' г</span></div>';
    }

    function renderWeekRows(plan) {
        var html = '';
        plan.weeks.forEach(function (w) {
            html += '<div class="ygc-wrow">'
                + '<span><b>НЕДЕЛЯ ' + w.weekNumber + ' · ' + esc(w.phaseLabel) + '</b></span>'
                + '<span class="ygc-wkcal">' + w.avgKcal + ' ккал / день</span>'
                + (w.phaseNote
                    ? '<span class="ygc-wnote">' + esc(w.phaseNote) + '</span>' : '')
                + '</div>';
        });
        return html;
    }

    function renderMenu(plan) {
        var html = '';

        plan.weeks.forEach(function (week) {
            var daysHtml = '';

            week.days.forEach(function (day) {
                var mealsHtml = '';

                day.meals.forEach(function (meal) {
                    var items = meal.items.map(function (it) {
                        return '<li>' + esc(it.display) + '</li>';
                    }).join('');

                    var swaps = (meal.swaps || []).map(function (s) {
                        return '<b>' + esc(s.kind) + ':</b> ' + esc(s.names.join(', '));
                    }).join(' &nbsp;·&nbsp; ');

                    mealsHtml += '<div class="ygc-meal">'
                        + '<div class="ygc-mealhead">'
                        +   '<span class="ygc-mealname">' + esc(meal.name)
                        +     ' <span class="ygc-mealk">' + esc(meal.share) + '</span></span>'
                        +   '<span class="ygc-mealtime">' + esc(meal.time)
                        +     ' · ' + meal.approx.kcal + ' ккал</span>'
                        + '</div>'
                        + '<ul class="ygc-items">' + items + '</ul>'
                        + (swaps ? '<div class="ygc-swaps">Заменить: ' + swaps + '</div>' : '')
                        + (meal.note ? '<div class="ygc-mealnote">' + esc(meal.note) + '</div>' : '')
                        + '</div>';
                });

                var tagColor = day.dayType === 'training'
                    ? 'background:rgba(0,255,204,.13);color:#00ffcc;'
                    : 'background:rgba(255,255,255,.06);color:#8b95a5;';

                daysHtml += '<details class="ygc-day">'
                    + '<summary>'
                    +   '<span>' + esc(day.dayName) + ' <span class="ygc-hit" '
                    +     'style="' + tagColor + '">'
                    +     (day.dayType === 'training' ? 'ТРЕНИРОВКА' : 'ОТДЫХ') + '</span></span>'
                    +   '<span class="ygc-dayk">' + day.kcal + ' ккал · Б' + day.protein
                    +   ' Ж' + day.fat + ' У' + day.carbs + '</span>'
                    + '</summary>'
                    + '<div style="padding:10px 0 4px">'
                    +   (day.note ? '<div class="ygc-daynote">' + esc(day.note) + '</div>' : '')
                    +   mealsHtml
                    + '</div>'
                    + '</details>';
            });

            html += '<details>'
                + '<summary>'
                +   '<span>НЕДЕЛЯ ' + week.weekNumber + ' · ' + esc(week.phaseLabel) + '</span>'
                +   '<span class="ygc-dayk">' + week.avgKcal + ' ккал / день</span>'
                + '</summary>'
                + '<div style="padding:10px 0 6px">' + daysHtml + '</div>'
                + '</details>';
        });

        return html;
    }

    function renderShopping(plan) {
        if (!plan.shoppingList) return '';
        var html = '', any = false;

        Object.keys(plan.shoppingList).forEach(function (group) {
            var items = plan.shoppingList[group];
            if (!items || !items.length) return;
            any = true;
            html += '<div style="margin-bottom:14px">'
                + '<div class="ygc-mealname" style="margin-bottom:6px">'
                + esc(group) + '</div>'
                + '<ul class="ygc-items">'
                + items.map(function (i) {
                    return '<li>' + esc(i.name) + ' — ' + esc(i.display) + '</li>';
                }).join('')
                + '</ul></div>';
        });

        if (!any) return '';

        return '<details style="margin-top:10px">'
            + '<summary><span>🛒 СПИСОК ПОКУПОК НА НЕДЕЛЮ</span>'
            + '<span class="ygc-dayk">все продукты с граммовкой</span></summary>'
            + '<div style="padding:14px 16px 6px">' + html + '</div>'
            + '</details>';
    }


    function buildCardHtml(plan) {
        var t = plan.targets;
        var maxMacro = Math.max(t.protein, t.fat, t.carbs) || 1;

        var macros = ''
            + macroRow('Б', t.protein, maxMacro, 'linear-gradient(90deg,#00ffcc,#00cc99)')
            + macroRow('Ж', t.fat,     maxMacro, 'linear-gradient(90deg,#ffd166,#e6a800)')
            + macroRow('У', t.carbs,   maxMacro, 'linear-gradient(90deg,#7aa2ff,#4a6fe0)');

        var chips = ''
            + '<span class="ygc-chip">Базовый метаболизм <b>' + t.bmr + '</b> ккал</span>'
            + '<span class="ygc-chip">Расход <b>' + t.tdee + '</b> ккал</span>'
            + '<span class="ygc-chip">Приёмов пищи <b>' + t.meals + '</b></span>'
            + '<span class="ygc-chip">Вода <b>' + (t.waterMl / 1000).toFixed(1) + '</b> л</span>';

        var warn = t.warning
            ? '<div class="ygc-warn">⚠️ ' + esc(t.warning) + '</div>' : '';

        var goalLabel = { 'масса': 'НА МАССУ', 'сила': 'НА СИЛУ', 'сушка': 'НА СУШКУ' }[t.goal]
            || ('НА ' + String(t.goal).toUpperCase());

        /* --- доступ открыт: показываем меню --- */
        if (state.unlocked) {
            return ''
            + '<div class="ygc-title">🍽 ТВОИ ЦИФРЫ ПИТАНИЯ — ' + esc(goalLabel) + '</div>'
            + warn
            + '<div class="ygc-kcal"><b>' + t.kcal + '</b><span>ккал / день</span></div>'
            + '<div class="ygc-sub">Средняя норма. Тренировочные дни выше, дни отдыха '
            +   'ниже — сумма за неделю ровно в цель.</div>'
            + '<div class="ygc-macros">' + macros + '</div>'
            + '<div class="ygc-meta">' + chips + '</div>'
            + (state.purchased
                ? '<div class="ygc-owned">✅ <span><b>Доступ открыт.</b> '
                  + 'Планы ниже — на 30 дней вперёд.</span></div>'
                : '<div class="ygc-owned">🔓 <span><b>План разблокирован.</b> '
                  + 'Проверь меню ниже.</span></div>')
            + '<div class="ygc-weeks">' + renderMenu(plan) + '</div>'
            + renderShopping(plan)
            + '<button type="button" class="ygc-cta ghost" id="ygcPrintNutri">'
            +   '📥 СКАЧАТЬ ПЛАН ПИТАНИЯ В PDF</button>'
            + '<p class="ygc-foot">' + esc(plan.disclaimer) + '</p>';
        }

        /* --- доступ закрыт: превью + оффер --- */
        return ''
        + '<div class="ygc-title">🍽 ТВОИ ЦИФРЫ ПИТАНИЯ — ' + esc(goalLabel) + '</div>'
        + warn
        + '<div class="ygc-kcal"><b>' + t.kcal + '</b><span>ккал / день</span></div>'
        + '<div class="ygc-sub">Средняя норма. Тренировочные дни выше, дни отдыха '
        +   'ниже — сумма за неделю ровно в цель.</div>'
        + '<div class="ygc-macros">' + macros + '</div>'
        + '<div class="ygc-meta">' + chips + '</div>'
        + '<div class="ygc-lockwrap">'
        +   '<div class="ygc-locked-content">'
        +     '<div class="ygc-weeks">' + renderWeekRows(plan) + '</div>'
        +     '<div style="font-size:11.5px;color:#7d8798;line-height:1.7">'
        +       'Меню на 28 дней · ~140 приёмов пищи · точная граммовка продуктов · '
        +       'варианты замен · углеводная ротация по тренировкам · список покупок'
        +     '</div>'
        +   '</div>'
        +   '<div class="ygc-overlay">'
        +     '<div class="ygc-lockicon">🔒</div>'
        +     '<div class="ygc-locktext">План питания на месяц — <b>по твоим цифрам '
        +       'выше</b>. Меню, граммовки, замены и список покупок — внутри '
        +       'полного доступа.</div>'
        +     '<button type="button" class="ygc-cta" id="ygcUnlock">'
        +       '🔓 ОТКРЫТЬ ПРОГРАММУ И ПЛАН ПИТАНИЯ</button>'
        +   '</div>'
        + '</div>'
        + '<p class="ygc-foot">' + esc(plan.disclaimer) + '</p>';
    }

    /* ================== 4. РАЗМЕЩЕНИЕ / СИНХРОНИЗАЦИЯ ================== */

    function findStandaloneButton() {
        var btns = document.querySelectorAll('button');
        for (var i = 0; i < btns.length; i++) {
            var b = btns[i];
            if (b.closest && b.closest('#' + CARD_ID)) continue;
            if (b.id === 'ygcUnlock' || b.id === 'ygcPrintNutri') continue;

            var txt = (b.textContent || '').toUpperCase();
            if (txt.indexOf('30 ДНЕЙ') !== -1 ||
                txt.indexOf('ПОЛНЫЙ ПЛАН') !== -1 ||
                txt.indexOf('ПОЛУЧИТЬ ПРОГРАММУ') !== -1 ||
                (txt.indexOf('199') !== -1 && txt.indexOf('₽') !== -1) ||
                (txt.indexOf('299') !== -1 && txt.indexOf('₽') !== -1)) {
                return b;
            }
        }
        return null;
    }

    /**
     * Кнопка «Изменить ответы» — убираем после покупки.
     * Ищем по тексту: у тебя она подписана «← Изменить ответы».
     */
    function hideChangeAnswersButton() {
        var els = document.querySelectorAll('button, a, div, span');
        for (var i = 0; i < els.length; i++) {
            var el = els[i];
            if (el.closest && el.closest('#' + CARD_ID)) continue;
            if (el.children && el.children.length > 2) continue;

            var txt = (el.textContent || '').trim().toUpperCase();
            if (txt.indexOf('ИЗМЕНИТЬ ОТВЕТ') !== -1 ||
                txt.indexOf('ИЗМЕНИТЬ АНКЕТУ') !== -1) {
                el.classList.add('yg-hidden');
                el.style.display = 'none';
                console.log(TAG, 'кнопка «Изменить ответы» скрыта после покупки');
                return true;
            }
        }
        return false;
    }

    function restoreChangeAnswersButton() {
        var els = document.querySelectorAll('.yg-hidden');
        for (var i = 0; i < els.length; i++) {
            var el = els[i];
            var txt = (el.textContent || '').trim().toUpperCase();
            if (txt.indexOf('ИЗМЕНИТЬ ОТВЕТ') !== -1) {
                el.classList.remove('yg-hidden');
                el.style.removeProperty('display');
            }
        }
    }

    /**
     * Чиним вёрстку: ссылка «на консультацию» липнет к кнопке в одну строку.
     * Оборачиваем кнопку и соседей в вертикальный столбик.
     */
    function tidyButtonRow(btn) {
        if (!btn || !btn.parentNode) return;

        var box = btn.parentNode;
        if (box.dataset && box.dataset.ygtidy === '1') return;
        if (box.closest && box.closest('#' + CARD_ID)) return;

        var cs = window.getComputedStyle ? window.getComputedStyle(box) : null;
        if (cs && (cs.display === 'flex' && cs.flexDirection === 'row')) {
            box.style.flexDirection = 'column';
            box.style.alignItems = 'center';
            box.style.gap = '12px';
        } else if (cs && /inline/.test(cs.display)) {
            box.style.display = 'block';
            box.style.textAlign = 'center';
        }

        if (box.dataset) box.dataset.ygtidy = '1';
    }

    function ensureCard() {
        var card = document.getElementById(CARD_ID);
        if (!card) {
            card = document.createElement('div');
            card.id = CARD_ID;
            document.body.appendChild(card);
        }
        return card;
    }

    function placeCard(card) {
        // 1) хотим прямо НАД отдельной кнопкой покупки — лучшее место в воронке
        var btn = findStandaloneButton();
        if (btn) {
            var host = btn.parentElement || btn;
            if (host.tagName === 'A' && host.parentElement) host = host.parentElement;
            if (host.parentNode && card.nextElementSibling !== host) {
                host.parentNode.insertBefore(card, host);
                return;
            }
            return;
        }

        // 2) под таблицей программы
        var table = document.getElementById('resProgramTable');
        if (table && table.parentNode && card.previousElementSibling !== table) {
            table.parentNode.insertBefore(card, table.nextSibling);
            return;
        }

        // 3) под калькулятором ПМ
        var calc = document.getElementById(CALC_ID);
        if (calc && calc.parentNode && card.previousElementSibling !== calc) {
            calc.parentNode.insertBefore(card, calc.nextSibling);
        }
    }

    function bindCard(card) {
        var unlock = card.querySelector('#ygcUnlock');
        if (unlock && !unlock.dataset.bound) {
            unlock.dataset.bound = '1';
            unlock.addEventListener('click', function () {
                console.log(TAG, 'клик «Выбрать формат» → открываю тарифы');
                if (window.YourGymPaywall && window.YourGymPaywall.open) {
                    window.YourGymPaywall.open();
                } else {
                    alert('Окно тарифов не подключено.\n\n'
                        + 'Проверь, что paywall-modal.js есть в index.html.');
                }
            });
        }

        var print = card.querySelector('#ygcPrintNutri');
        if (print && !print.dataset.bound) {
            print.dataset.bound = '1';
            print.addEventListener('click', printNutritionPdf);
        }
    }

    /** Подпись состояния: меняем DOM только если реально что-то изменилось */
    function planSignature(plan) {
        if (!plan) return '';
        var t = plan.targets;
        return [t.kcal, t.protein, t.fat, t.carbs, t.goal,
                state.unlocked ? '1' : '0', state.purchased ? '1' : '0'].join('|');
    }

    function refreshCard() {
        var plan = computePlan();

        if (!plan) {
            var old = document.getElementById(CARD_ID);
            if (old && old.parentNode) old.parentNode.removeChild(old);
            state.lastPlan = null;
            state.lastSig = '';
            showStandaloneButton();
            if (!state.purchased) restoreChangeAnswersButton();
            return;
        }

        var sig = planSignature(plan);

        // ❗ ключевой фикс: если карточка исчезла с экрана — перерисовываем,
        //    даже когда содержимое не менялось
        var existing = document.getElementById(CARD_ID);
        if (existing && sig === state.lastSig && !state.forceRedraw) {
            return;
        }

        state.forceRedraw = false;
        state.lastPlan = plan;
        state.lastSig = sig;

        var card = ensureCard();
        card.innerHTML = buildCardHtml(plan);
        placeCard(card);
        bindCard(card);

        // карточка уже продаёт и программу, и питание → дублирующую кнопку прячем
        hideStandaloneButton();

        if (plan) tidyButtonRow(findStandaloneButton());
        if (state.purchased) hideChangeAnswersButton();

        console.log(TAG, 'карточка обновлена:', plan.targets.kcal, 'ккал | unlock:',
                    state.unlocked, '| purchased:', state.purchased);
    }

    function hideStandaloneButton() {
        var btn = findStandaloneButton();
        if (!btn) return;
        if (btn.dataset.yghidden === '1') return;

        btn.dataset.yghidden = '1';
        btn.classList.add('yg-hidden');
        btn.style.display = 'none';

        // прячем и обёртку со ссылкой на консультацию — оффер теперь в карточке
        var wrap = btn.parentElement;
        if (wrap && wrap !== document.body && !(wrap.id === CARD_ID)) {
            var siblings = wrap.children;
            if (siblings && siblings.length <= 3) {
                wrap.dataset.yghiddenwrap = '1';
                wrap.classList.add('yg-hidden');
                wrap.style.display = 'none';
            }
        }
        console.log(TAG, 'дублирующая кнопка покупки скрыта — оффер в карточке');
    }

    function showStandaloneButton() {
        var btn = findStandaloneButton();
        if (!btn || btn.dataset.yghidden !== '1') return;

        btn.dataset.yghidden = '0';
        btn.classList.remove('yg-hidden');
        btn.style.removeProperty('display');

        var wrap = btn.parentElement;
        if (wrap && wrap.dataset && wrap.dataset.yghiddenwrap === '1') {
            wrap.dataset.yghiddenwrap = '0';
            wrap.classList.remove('yg-hidden');
            wrap.style.removeProperty('display');
        }
    }

    /** Обновляем текст отдельной кнопки (когда карточки нет) */
    function fixButtonText() {
        var btn = findStandaloneButton();
        if (!btn) return;
        if (btn.dataset.ygtext === '1') return;

        btn.textContent = STANDALONE_BUTTON_TEXT;
        btn.dataset.ygtext = '1';
        console.log(TAG, 'текст отдельной кнопки обновлён');
    }

    function scheduleRefresh() {
        if (scheduleRefresh.timer) clearTimeout(scheduleRefresh.timer);
        scheduleRefresh.timer = setTimeout(function () {
            state.forceRedraw = true;
            refreshCard();
        }, 240);
    }

    /* ======================= 5. ЗАМОК ======================= */

    function unlock(fromPurchase, persist) {
        if (persist === undefined) persist = true;
        if (state.unlocked && !fromPurchase) return;

        state.unlocked = true;
        if (fromPurchase) state.purchased = true;
        if (persist) saveState();
        else {
            console.warn(TAG, '⚠️ предпросмотр — НЕ сохранён в память, ' +
                'после перезахода замок вернётся');
        }

        state.forceRedraw = true;

        if (state.lastPlan) {
            var card = ensureCard();
            card.innerHTML = buildCardHtml(state.lastPlan);
            bindCard(card);
            hideStandaloneButton();
        } else {
            refreshCard();
        }

        if (state.purchased) hideChangeAnswersButton();

        console.log(TAG, '🔓 доступ открыт | purchase:', state.purchased);
    }

    function lock() {
        state.unlocked = false;
        state.purchased = false;
        saveState();
        state.forceRedraw = true;
        refreshCard();
        restoreChangeAnswersButton();
        console.log(TAG, '🔒 доступ закрыт (режим отладки)');
    }

    /* Покупка в окне тарифов: тариф с питанием открывает меню */
    document.addEventListener('click', function (e) {
        var el = e.target;
        if (!el || !el.closest) return;

        var cta = el.closest('.yg-cta');
        if (!cta) return;

        var plan = cta.getAttribute('data-plan') || '';
        console.log(TAG, 'выбран тариф:', plan);

        if (plan.indexOf('nutrition') !== -1) {
            setTimeout(function () { unlock(true); }, 520);
        } else {
            // купил только программу — питание остаётся за замком,
            // но «изменить ответы» всё равно убираем
            setTimeout(function () {
                state.purchased = true;
                saveState();
                hideChangeAnswersButton();
            }, 520);
        }
    }, true);

    /* ================== 6. ВОЗВРАТ РЕЗУЛЬТАТА ПОСЛЕ F5 ================== */

    var SNAPSHOT_TICK = 0;

    function saveSnapshot() {
        if (SNAPSHOT_TICK++ % 15 !== 0) return;   // раз в ~3 секунды

        var ctx = getCtx();
        var struct = null;

        try {
            if (typeof window.globalGeneratedStructureCache !== 'undefined') {
                struct = window.globalGeneratedStructureCache;
            } else if (typeof globalGeneratedStructureCache !== 'undefined') {
                struct = globalGeneratedStructureCache;
            }
        } catch (e) { return; }

        if (!struct || !ctx || !ctx.goal) return;

        try {
            localStorage.setItem(LS_SNAP, JSON.stringify({
                userContext: ctx,
                structure: struct,
                ts: Date.now()
            }));
        } catch (e) {}
    }

    function getSnapshot() {
        try {
            var raw = localStorage.getItem(LS_SNAP);
            if (!raw) return null;
            var o = JSON.parse(raw);
            if (!o || !o.userContext || !o.structure) return null;
            if (Date.now() - o.ts > 7 * 24 * 3600 * 1000) return null;  // старше недели
            return o;
        } catch (e) { return null; }
    }

    /* ---------------------------------------------------------------------
       Кандидаты на рендер результата.
       Точное имя функции неизвестно, поэтому перебираем по убыванию
       вероятности, а потом — авто-поиском по всем window-функциям
       с подходящим названием.
    ---------------------------------------------------------------------- */
    var RENDER_CANDIDATES = [
        'renderPipelineOutputToUILocal',
        'renderDynamicFinalInputsBlockLocal',
        'renderProgramTable',
        'renderResultScreenLocal',
        'renderFinalScreenLocal',
        'renderResultLocal',
        'renderProgramLocal',
        'renderOutputLocal',
        'renderWeekProgramLocal',
        'executeLocalBackupPipelineOnlyLocal'
    ];

    /** Авто-поиск: любая window-функция, похожая на рендер результата */
    function findRenderFunction() {
        var keys;
        try { keys = Object.keys(window); } catch (e) { return null; }

        // приоритет: render*, потом *Output*, потом *Pipeline*
        var patterns = [/^render/i, /render/i, /output/i, /pipeline/i, /program/i];
        var skip = /nutrition|paywall|mesocycle|fixoverlay|yg/i;

        for (var p = 0; p < patterns.length; p++) {
            for (var i = 0; i < keys.length; i++) {
                var k = keys[i];
                if (skip.test(k)) continue;
                if (!patterns[p].test(k)) continue;
                try {
                    if (typeof window[k] !== 'function') continue;
                    // функции рендера обычно что-то делают с DOM и не требуют args
                    if (window[k].length > 2) continue;
                    return k;
                } catch (e) {}
            }
        }
        return null;
    }

    function tryRestoreResults() {
        var snap = getSnapshot();
        if (!snap) return false;

        // уже есть результат — ничего не делаем
        if (document.getElementById(CALC_ID)) return false;

        // переносим сохранённый userContext в текущий
        try {
            if (typeof window.userContext === 'object' && window.userContext) {
                Object.keys(snap.userContext).forEach(function (k) {
                    window.userContext[k] = snap.userContext[k];
                });
            }
        } catch (e) {}

        try { window.globalGeneratedStructureCache = snap.structure; } catch (e) {}

        var rendered = false;
        var tried = [];

        // 1) известные имена
        for (var i = 0; i < RENDER_CANDIDATES.length; i++) {
            var name = RENDER_CANDIDATES[i];
            var fn = window[name];
            if (typeof fn !== 'function') continue;

            try {
                fn(snap.structure);
                rendered = true;
                console.log(TAG, '✅ результат восстановлен через', name);
                break;
            } catch (e) {
                tried.push(name);
                console.warn(TAG, name, 'не сработал:', e.message);
            }
        }

        // 2) авто-поиск, если известные не подошли
        if (!rendered) {
            var auto = findRenderFunction();
            if (auto) {
                try {
                    window[auto](snap.structure);
                    rendered = true;
                    console.log(TAG, '✅ результат восстановлен авто-поиском:', auto);
                    console.log(TAG, '   чтобы закрепить — добавь "' + auto
                        + '" в RENDER_CANDIDATES');
                } catch (e) {
                    console.warn(TAG, 'авто-найденная', auto, 'не сработала:', e.message);
                }
            }
        }

        if (!rendered) {
            console.warn(TAG, 'восстановление не удалось.');
            if (tried.length) console.warn(TAG, 'пробовал:', tried.join(', '));
            console.log(TAG, 'Подсказка: открой консоль и выполни →');
            console.log("   Object.keys(window).filter(k => "
                + "/render|pipeline|result/i.test(k))");
            console.log(TAG, 'Скинь список — подставлю точное имя.');
            return false;
        }

        state.forceRedraw = true;
        setTimeout(refreshCard, 300);
        return true;
    }

    function showRestoreChip() {
        if (document.getElementById(CHIP_ID)) return;
        if (state.restoreOffered) return;
        if (!getSnapshot()) return;
        if (document.getElementById(CALC_ID)) return;

        state.restoreOffered = true;

        var chip = document.createElement('div');
        chip.id = CHIP_ID;
        chip.innerHTML = '<span>💾 Найдена прошлая программа. Вернуть?</span>'
            + '<button type="button" id="ygRestoreYes">ВЕРНУТЬ</button>'
            + '<button type="button" class="ygc-chipx" id="ygRestoreNo">✕</button>';

        document.body.appendChild(chip);

        chip.querySelector('#ygRestoreYes').addEventListener('click', function () {
            if (!tryRestoreResults()) {
                alert('Не удалось восстановить автоматически.\n\n'
                    + 'Пройди квиз заново — прошлый план всё равно сохранён, '
                    + 'он подтянется на экране результата.');
            }
            chip.remove();
        });

        chip.querySelector('#ygRestoreNo').addEventListener('click', function () {
            chip.remove();
        });
    }

    /* ======================= 7. PDF ПЛАНА ПИТАНИЯ ======================= */

    function printNutritionPdf() {
        var card = document.getElementById(CARD_ID);
        if (!card) return;

        var details = card.querySelectorAll('details');
        for (var i = 0; i < details.length; i++) details[i].open = true;

        var clone = card.cloneNode(true);
        var junk = clone.querySelectorAll('button, .ygc-offer, .ygc-overlay, .ygc-lockwrap');
        for (var j = 0; j < junk.length; j++) {
            if (junk[j].parentNode) junk[j].parentNode.removeChild(junk[j]);
        }

        var goal = (getCtx().goal || '').toUpperCase();

        var html = '<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8">'
            + '<title>ПЛАН ПИТАНИЯ' + (goal ? ' — ' + goal : '') + '</title><style>'
            + '@page{size:A4;margin:11mm;}'
            + 'body{margin:0;font-family:Arial,"DejaVu Sans",sans-serif;color:#111;font-size:11px;}'
            + '*{background:#fff !important;color:#111 !important;box-shadow:none !important;'
            + 'text-shadow:none !important;filter:none !important;}'
            + '.ygc-title{font-size:17px;font-weight:bold;text-align:center;margin:0 0 4px;}'
            + '.ygc-kcal{text-align:center;margin:8px 0 2px;}'
            + '.ygc-kcal b{font-size:26px;}.ygc-kcal span{font-size:12px;}'
            + '.ygc-sub,.ygc-foot{font-size:9.5px;color:#555 !important;text-align:center;}'
            + '.ygc-meta{display:flex;flex-wrap:wrap;gap:5px;justify-content:center;margin:8px 0;}'
            + '.ygc-chip{border:1px solid #ccc;border-radius:5px;padding:2px 7px;font-size:9.5px;}'
            + '.ygc-mrow{display:flex;align-items:center;gap:8px;margin-bottom:3px;font-size:10.5px;}'
            + '.ygc-mlabel{width:20px;font-weight:bold;}'
            + '.ygc-bar{flex:1;height:5px;background:#e5e5e5;border-radius:3px;}'
            + '.ygc-bar i{display:block;height:100%;background:#333;}'
            + '.ygc-mval{width:55px;text-align:right;}'
            + '.ygc-weeks{margin-top:10px;}'
            + 'details{border:1px solid #bbb;border-radius:5px;margin-bottom:4px;'
            + 'page-break-inside:avoid;}'
            + 'summary{padding:5px 8px;font-size:11px;font-weight:bold;'
            + 'display:flex;justify-content:space-between;}'
            + '.ygc-day{margin:0 7px 6px;}.ygc-daynote{font-size:9px;color:#666 !important;'
            + 'font-style:italic;margin-bottom:4px;}'
            + '.ygc-meal{border-left:2px solid #ccc;padding-left:7px;margin-bottom:6px;}'
            + '.ygc-mealhead{display:flex;justify-content:space-between;font-size:10px;}'
            + '.ygc-mealname{font-weight:bold;}'
            + '.ygc-items{margin:2px 0;padding-left:12px;font-size:10px;}'
            + '.ygc-swaps{font-size:9px;color:#666 !important;}'
            + '.ygc-mealnote{font-size:9px;color:#666 !important;font-style:italic;}'
            + '.ygc-hit{font-size:8.5px;border:1px solid #999;border-radius:3px;padding:1px 4px;}'
            + '.ygc-wnote{display:block;font-size:9px;color:#666 !important;font-style:italic;}'
            + '</style></head><body>'
            + '<div class="ygc-title">ПЛАН ПИТАНИЯ' + (goal ? ' — ' + goal : '')
            + ' · 4 НЕДЕЛИ</div>'
            + '<div class="ygc-sub">Сформировано ' + new Date().toLocaleDateString('ru-RU')
            + ' · YourGym · Система Атак</div>'
            + clone.innerHTML
            + '</body></html>';

        var frame = document.createElement('iframe');
        frame.setAttribute('aria-hidden', 'true');
        frame.style.cssText = 'position:fixed;right:0;bottom:0;width:1px;height:1px;'
            + 'border:0;opacity:0;';
        document.body.appendChild(frame);

        var doc = frame.contentWindow.document;
        doc.open(); doc.write(html); doc.close();

        setTimeout(function () {
            try {
                frame.contentWindow.focus();
                frame.contentWindow.print();
            } catch (err) {
                console.warn(TAG, 'печать не удалась', err);
            }
            setTimeout(function () {
                if (frame.parentNode) frame.parentNode.removeChild(frame);
            }, 60000);
        }, 420);
    }


    /* ==================== ЗНАЧОК ВЕРСИИ (диагностика) ====================
       Видно глазами в левом нижнем углу. Если значка нет — значит в браузер
       попал СТАРЫЙ файл, а не этот.
    ==================================================================== */

    function showVersionBadge() {
        if (document.getElementById('ygVersionBadge')) return;
        var b = document.createElement('div');
        b.id = 'ygVersionBadge';
        b.textContent = '\uD83E\uDD57 NUTRITION v2.1';
        b.style.cssText = 'position:fixed;left:10px;bottom:10px;z-index:99997;'
            + 'padding:6px 11px;border-radius:8px;'
            + 'background:rgba(0,255,204,.14);'
            + 'border:1px solid rgba(0,255,204,.5);'
            + 'color:#00ffcc;font:700 10.5px/1 Arial,sans-serif;'
            + 'letter-spacing:.7px;pointer-events:none;';
        document.body.appendChild(b);
    }

    window.YourGymNutritionUI_hideBadge = function () {
        var b = document.getElementById('ygVersionBadge');
        if (b) b.remove();
    };

    /* ======================= 8. НАБЛЮДЕНИЕ ======================= */

    var tickTimer = null;
    var ticks = 0;

    function tick() {
        ticks++;
        injectStyles();

        // калькулятор есть → строим поля и карточку
        var calc = document.getElementById(CALC_ID);
        if (calc) {
            buildFieldsBlock();

            // ❗ если карточку стёрли из DOM — поднимаем её снова
            if (!document.getElementById(CARD_ID) && state.lastPlan) {
                state.forceRedraw = true;
            }
            refreshCard();
            saveSnapshot();
        } else {
            // результата нет: показываем чип возврата (один раз)
            if (ticks % 10 === 0) showRestoreChip();
        }

        fixButtonText();
        if (state.purchased) hideChangeAnswersButton();

        if (ticks > 900 && tickTimer) {
            clearInterval(tickTimer);
            tickTimer = null;
            console.log(TAG, 'наблюдение завершено');
        }
    }

    function boot() {
        loadSaved();
        injectStyles();
        showVersionBadge();
        tick();
        tickTimer = setInterval(tick, 200);

        // ловим перерисовки экрана результата
        try {
            new MutationObserver(function () {
                if (!document.getElementById(CARD_ID) && state.lastPlan) {
                    state.forceRedraw = true;
                }
            }).observe(document.body, { childList: true, subtree: true });
        } catch (e) {}

        // вернуть результат, когда пользователь нажал чип, ещё раз проверим
        setTimeout(showRestoreChip, 1200);

        console.log('%c✅ YourGym NUTRITION UI v2.1 (build 3) запущен',
            'background:#00ffcc;color:#0d0f14;font-weight:700;padding:3px 8px;'
            + 'border-radius:4px');
        console.log('   unlocked:', state.unlocked, '| purchased:', state.purchased);
        console.log('   ядро:', (window.YourGymNutrition && window.YourGymNutrition.VERSION)
            ? ('v' + window.YourGymNutrition.VERSION + ' ✓') : 'НЕ ЗАГРУЖЕНО ✗');
        console.log('   для сброса состояния: YourGymNutritionUI.reset()');
        console.log('   предпросмотр без записи: YourGymNutritionUI.preview()');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }

    /* ======================= ПУБЛИЧНОЕ API ======================= */

    window.YourGymNutritionUI = {
        version: '2.1',
        build: 3,

        unlock: function () { unlock(true); },

        /** Ручное открытие БЕЗ записи в память — для теста */
        preview: function () { unlock(false, false); },

        lock: lock,

        refresh: function () { state.forceRedraw = true; refreshCard(); },

        restore: tryRestoreResults,

        clearSnapshot: function () {
            try { localStorage.removeItem(LS_SNAP); } catch (e) {}
            console.log(TAG, 'снимок сессии удалён');
        },

        /** Полный сброс: убирает купленное состояние и данные тела */
        reset: function (keepBody) {
            try {
                localStorage.removeItem(LS_STATE);
                if (!keepBody) localStorage.removeItem(LS_BODY);
            } catch (e) {}
            console.log(TAG, 'сброс выполнен. Перезагружаю...');
            setTimeout(function () { location.reload(); }, 300);
        },

        getPlan: function () { return state.lastPlan; },
        buttonText: STANDALONE_BUTTON_TEXT
    };

    // Отладка: Ctrl+Shift+U — открыть доступ, Ctrl+Shift+L — закрыть
    document.addEventListener('keydown', function (e) {
        if (!e.ctrlKey || !e.shiftKey) return;
        if (e.code === 'KeyU') { e.preventDefault(); unlock(true); }
        if (e.code === 'KeyL') { e.preventDefault(); lock(); }
    });

})();
