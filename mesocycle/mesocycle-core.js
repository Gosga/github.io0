// ================================================================= 
// [МЕЗОЦИКЛ v3.0 — ИНТЕГРАЦИЯ С СИСТЕМОЙ АТАК]
// =================================================================
// Генерация 4-недельной программы на основе твоего конвейера
// v3.0: расчёт реальных кг из введённых ПМ, советы тренера, падежи целей

let globalMesocycleCache = null; // Хранилище 4 недель

// ===== СЛОВАРЬ ПАДЕЖЕЙ ДЛЯ ЦЕЛЕЙ (КОСМЕТИКА) =====
// "сила" -> "СИЛУ", "масса" -> "МАССУ", "сушка" -> "СУШКУ"
function getGoalAccusativeLocal(goal) {
    let map = {
        "сила": "СИЛУ",
        "масса": "МАССУ",
        "сушка": "СУШКУ"
    };
    return map[goal] || (goal ? goal.toUpperCase() : "ТРЕНИРОВКИ");
}

// ===== ГЛАВНАЯ ФУНКЦИЯ ГЕНЕРАЦИИ МЕЗОЦИКЛА =====
function generateMesocycleLocal() {
    console.log("🔥 [МЕЗОЦИКЛ] Запуск генерации 4 недель...");
    
    if (!globalGeneratedStructureCache) {
        alert("⚠️ Сначала сгенерируй недельную программу!");
        return null;
    }
    
    // Считываем введённые пользователем ПМ из верхней таблицы (та самая "АКТИВАЦИЯ КИЛОГРАММОВ")
    let liveWeightsMap = collectLiveWeightsMapLocal();
    
    let weeks = [];
    
    for (let weekNum = 1; weekNum <= 4; weekNum++) {
        console.log(`📅 Генерация недели ${weekNum}/4...`);
        
        let weekStructure = JSON.parse(JSON.stringify(globalGeneratedStructureCache));
        
        applyWeekProgressionLocal(weekStructure, weekNum, liveWeightsMap);
        
        weeks.push({
            weekNumber: weekNum,
            structure: weekStructure
        });
    }
    
    globalMesocycleCache = { weeks, userContext, liveWeightsMap };
    console.log("✅ [МЕЗОЦИКЛ] Генерация завершена!");
    return globalMesocycleCache;
}

// ===== СБОР ВЕСОВ ПМ ИЗ ВЕРХНЕЙ ТАБЛИЦЫ "АКТИВАЦИЯ КИЛОГРАММОВ ПРОГРАММЫ" =====
// Копирует ту же логику, что и recalculateLiveWeightsMatrixLocal() в quiz-core.js,
// чтобы вес в мезоцикле совпадал с тем, что пользователь ввёл в верхней таблице
function collectLiveWeightsMapLocal() {
    let liveWeightsMap = {};
    let container = document.getElementById('dynamicFinalInputsContainer');
    if (!container || !globalGeneratedStructureCache) return liveWeightsMap;
    
    let uniqueExercisesNames = [];
    globalGeneratedStructureCache.days.forEach(day => {
        day.exercises.forEach(ex => {
            if (ex && ex.name && !uniqueExercisesNames.includes(ex.name)) {
                uniqueExercisesNames.push(ex.name);
            }
        });
    });
    
    let inputs = container.querySelectorAll('input');
    inputs.forEach((input, idx) => {
        let val = parseFloat(input.value) || 0;
        let exName = uniqueExercisesNames[idx];
        if (exName) liveWeightsMap[exName] = val;
    });
    
    return liveWeightsMap;
}

// ===== ПЕРЕВОД "75% ПМ" В РЕАЛЬНЫЙ КГ, ЕСЛИ ПОЛЬЗОВАТЕЛЬ ВВЁЛ СВОЙ МАКСИМУМ =====
// weightToken — одна ступень веса из строки, например "75% ПМ"
function convertWeightTokenToKgLocal(weightToken, exName, liveWeightsMap) {
    if (!weightToken) return weightToken;
    
    let match = weightToken.match(/(\d+)\s*%/);
    if (!match) return weightToken; // не процентная запись — не трогаем (например, "Вес тела")
    
    let userPm = liveWeightsMap ? (liveWeightsMap[exName] || 0) : 0;
    if (userPm <= 0) return weightToken; // ПМ не введён — оставляем как есть ("75% ПМ")
    
    let pct = parseInt(match[1]);
    
    // Упражнения со своим весом / без веса — по логике твоего калькулятора считаем иначе
    if (exName.includes("со своим весом") || exName.includes("под столом") || exName.includes("Отжимания от пола") || exName.includes("без веса")) {
        return "Вес тела";
    }
    
    if (userPm <= 5) {
        return "Вес тела / Легкий";
    }
    
    let kg = Math.round((userPm * pct) / 100 * 2) / 2; // округление до 0.5 кг
    return kg + " кг";
}

// ===== ПРИМЕНЕНИЕ НЕДЕЛЬНОЙ ПРОГРЕССИИ =====
function applyWeekProgressionLocal(weekStructure, weekNum, liveWeightsMap) {
    let goal = userContext.goal;
    let plateau = userContext.plateau;
    
    let weekConfig = getWeekConfigLocal(goal, plateau, weekNum);
    
    console.log(`📊 Неделя ${weekNum}: интенсивность ${weekConfig.intensityMod > 0 ? '+' : ''}${weekConfig.intensityMod}%, объём ${weekConfig.volumeMod > 0 ? '+' : ''}${weekConfig.volumeMod}, RIR ${weekConfig.rirMod > 0 ? '+' : ''}${weekConfig.rirMod}`);
    
    weekStructure.days.forEach(day => {
        day.exercises.forEach(ex => {
            transformExerciseForWeekLocal(ex, weekConfig, weekNum);
            
            // Переводим итоговые "% ПМ" строки в реальные кг, если пользователь их ввёл
            if (ex.weight && ex.weight.includes("%")) {
                let tokens = ex.weight.split(/<br\s*\/?>/gi);
                let convertedTokens = tokens.map(t => convertWeightTokenToKgLocal(t, ex.name, liveWeightsMap));
                ex.weight = convertedTokens.join("<br>");
            }
        });
    });
    
    weekStructure.programName = `НЕДЕЛЯ ${weekNum} — ${getWeekDescriptionLocal(weekNum, userContext)}`;
    weekStructure.trainerAdvice = getTrainerAdviceLocal(weekNum, userContext);
}

// ===== КОНФИГ ПРОГРЕССИИ ПО ЦЕЛЯМ =====
function getWeekConfigLocal(goal, plateau, weekNum) {
    if (plateau === "plateau_over") {
        let configs = [
            { intensityMod: -25, volumeMod: -1, rirMod: +2, deloadFactor: 0.5, peakIntensity: null },
            { intensityMod: -10, volumeMod: 0, rirMod: +1, deloadFactor: null, peakIntensity: null },
            { intensityMod: 0, volumeMod: 0, rirMod: 0, deloadFactor: null, peakIntensity: null },
            { intensityMod: +5, volumeMod: 0, rirMod: -1, deloadFactor: null, peakIntensity: 100 }
        ];
        return configs[weekNum - 1];
    }
    
    if (goal === "сила") {
        let configs = [
            { intensityMod: 0, volumeMod: 0, rirMod: 0, deloadFactor: null, peakIntensity: null },
            { intensityMod: +3, volumeMod: 0, rirMod: -1, deloadFactor: null, peakIntensity: null },
            { intensityMod: +6, volumeMod: 0, rirMod: -1, deloadFactor: null, peakIntensity: null },
            { intensityMod: +8, volumeMod: -1, rirMod: 0, deloadFactor: null, peakIntensity: 105 }
        ];
        return configs[weekNum - 1];
    }
    
    if (goal === "масса") {
        let configs = [
            { intensityMod: 0, volumeMod: 0, rirMod: 0, deloadFactor: null, peakIntensity: null },
            { intensityMod: -3, volumeMod: 0, rirMod: +1, deloadFactor: null, peakIntensity: null },
            { intensityMod: +5, volumeMod: +1, rirMod: -1, deloadFactor: null, peakIntensity: null },
            { intensityMod: +8, volumeMod: 0, rirMod: 0, deloadFactor: null, peakIntensity: 105 }
        ];
        return configs[weekNum - 1];
    }
    
    if (goal === "сушка") {
        let configs = [
            { intensityMod: 0, volumeMod: 0, rirMod: 0, deloadFactor: null, peakIntensity: null },
            { intensityMod: +2, volumeMod: +1, rirMod: 0, deloadFactor: null, peakIntensity: null },
            { intensityMod: +3, volumeMod: +1, rirMod: 0, deloadFactor: null, peakIntensity: null },
            { intensityMod: +2, volumeMod: -1, rirMod: +1, deloadFactor: 0.85, peakIntensity: null }
        ];
        return configs[weekNum - 1];
    }
    
    return { intensityMod: 0, volumeMod: 0, rirMod: 0, deloadFactor: null, peakIntensity: null };
}

// ===== ТРАНСФОРМАЦИЯ УПРАЖНЕНИЯ ПОД НЕДЕЛЮ =====
function transformExerciseForWeekLocal(ex, weekConfig, weekNum) {
    let isBase = ex.slot.includes("base");
    
    if (isBase) {
        if (weekConfig.volumeMod !== 0) {
            let setsArray = ex.sets.toString().split(/<br\s*\/?>|\n/gi);
            let currentSets = setsArray.length > 1 ? setsArray.length : parseInt(ex.sets) || 4;
            let newSets = Math.max(2, currentSets + weekConfig.volumeMod);
            
            if (setsArray.length > 1) {
                if (weekConfig.volumeMod > 0) {
                    setsArray.push("1");
                } else if (weekConfig.volumeMod < 0 && setsArray.length > 2) {
                    setsArray.pop();
                }
                ex.sets = setsArray.join("<br>");
            } else {
                ex.sets = newSets.toString();
            }
        }
        
        if (ex.weight && ex.weight.includes("%")) {
            ex.weight = modifyWeightStringLocal(ex.weight, weekConfig.intensityMod, weekConfig.deloadFactor);
        }
        
        if (ex.rir) {
            ex.rir = modifyRIRStringLocal(ex.rir, weekConfig.rirMod);
        }
        
        if (weekNum === 4 && weekConfig.peakIntensity) {
            if (!ex._peakAssigned && shouldGetPeakLocal(ex)) {
                applyPeakIntensityLocal(ex, weekConfig.peakIntensity, userContext.goal);
                ex._peakAssigned = true;
            }
        }
    }
    else {
        if (ex.weight && ex.weight.includes("%") && weekConfig.intensityMod !== 0) {
            let isoIntensityMod = Math.round(weekConfig.intensityMod * 0.5);
            ex.weight = modifyWeightStringLocal(ex.weight, isoIntensityMod, weekConfig.deloadFactor);
        }
        
        if (ex.rir && weekConfig.rirMod !== 0) {
            let isoRirMod = Math.round(weekConfig.rirMod * 0.5);
            ex.rir = modifyRIRStringLocal(ex.rir, isoRirMod);
        }
    }
}

// ===== МОДИФИКАЦИЯ ВЕСА (СТРОКОВЫЙ ФОРМАТ, % ПМ) =====
function modifyWeightStringLocal(weightStr, delta, deloadFactor) {
    let lines = weightStr.split(/<br\s*\/?>|\n/gi);
    let modified = lines.map(line => {
        let match = line.match(/(\d+)%/);
        if (!match) return line;
        
        let pct = parseInt(match[1]);
        
        if (deloadFactor) {
            pct = Math.round(pct * deloadFactor);
        }
        
        pct = Math.max(30, Math.min(110, pct + delta));
        
        return line.replace(/\d+%/, pct + "%");
    });
    
    return modified.join("<br>");
}

// ===== МОДИФИКАЦИЯ RIR =====
function modifyRIRStringLocal(rirStr, delta) {
    let lines = rirStr.split(/<br\s*\/?>/gi);
    let modified = lines.map(line => {
        let match = line.match(/RIR\s*(\d+)/i);
        if (!match) return line;
        
        let rir = parseInt(match[1]);
        rir = Math.max(0, Math.min(5, rir + delta));
        
        return line.replace(/RIR\s*\d+/i, "RIR " + rir);
    });
    
    return modified.join("<br>");
}

// ===== ОПРЕДЕЛЕНИЕ УПРАЖНЕНИЯ ДЛЯ ПИКА =====
function shouldGetPeakLocal(ex) {
    let bigLifts = ["жим", "присед", "тяга", "подтягивания"];
    let isBigLift = bigLifts.some(keyword => ex.name.toLowerCase().includes(keyword));
    
    if (!isBigLift) return false;
    
    if (userContext.spec && userContext.spec !== "skip") {
        if (userContext.spec === "chest" && ex.slot.includes("chest")) return true;
        if (userContext.spec === "back" && ex.slot.includes("back")) return true;
        if (userContext.spec === "arms" && (ex.slot.includes("bic") || ex.slot.includes("tri"))) return true;
    }
    
    return true;
}

// ===== ПРИМЕНЕНИЕ ПИКОВОЙ ИНТЕНСИВНОСТИ (ПРОХОДКА) =====
function applyPeakIntensityLocal(ex, peakPct, goal) {
    if (goal === "сила") {
        ex.sets = "5";
        ex.weight = "50% ПМ<br>70% ПМ<br>85% ПМ<br>100% ПМ<br>" + peakPct + "% ПМ";
        ex.reps = "5<br>3<br>2<br>1<br>1";
        ex.rir = "RIR 5<br>RIR 3<br>RIR 1<br>RIR 0<br>RIR 0";
        ex.note = "⚡ ПРОХОДКА: пиковый сингл " + peakPct + "% ПМ!";
    }
    else if (goal === "масса") {
        ex.sets = "5";
        ex.weight = "70% ПМ<br>80% ПМ<br>90% ПМ<br>100% ПМ<br>" + peakPct + "% ПМ";
        ex.reps = "8<br>6<br>4<br>2<br>2";
        ex.rir = "RIR 3<br>RIR 2<br>RIR 1<br>RIR 0<br>RIR 0";
        ex.note = "⚡ ПИК ИНТЕНСИВНОСТИ: пирамида до " + peakPct + "% на 2 повтора!";
    }
}

// ===== ОПИСАНИЕ НЕДЕЛИ (заголовок над таблицами) =====
function getWeekDescriptionLocal(weekNum, ctx) {
    let goal = ctx.goal;
    let plateau = ctx.plateau;
    
    if (plateau === "plateau_over") {
        let descs = [
            "Делоад 50%: восстановление после перетрена",
            "Восстановление 65%: возвращаем форму",
            "Нормализация 80%: подход к рабочим весам",
            "Возврат 100%: проверка восстановления"
        ];
        return descs[weekNum - 1];
    }
    
    if (goal === "сила") {
        let descs = [
            "Стандартная неделя: адаптация",
            "Рост интенсивности: подход к рабочим весам",
            "Пиковая неделя: подготовка к проходке",
            "Проходка 105%: тест максимальной силы"
        ];
        return descs[weekNum - 1];
    }
    
    if (goal === "масса") {
        let descs = [
            "Стандартная неделя: техника и адаптация",
            "Лёгкая неделя: восстановление",
            "Пик объёма: максимальная гипертрофия",
            "Пик интенсивности: до 105% на базе"
        ];
        return descs[weekNum - 1];
    }
    
    if (goal === "сушка") {
        let descs = [
            "Стандартная неделя: сохранение массы",
            "Рост объёма: многоповторка",
            "Пиковая неделя: удержание объёма",
            "Делоад 85%: восстановление на дефиците"
        ];
        return descs[weekNum - 1];
    }
    
    return "Тренировочная неделя";
}

// ===== СОВЕТЫ ТРЕНЕРА ДЛЯ БЛОКА "ТРЕНИРОВОЧНЫЙ ИНСТРУКТАЖ ТРЕНЕРА" НА КАЖДУЮ НЕДЕЛЮ =====
function getTrainerAdviceLocal(weekNum, ctx) {
    let goal = ctx.goal;
    let plateau = ctx.plateau;
    
    if (plateau === "plateau_over") {
        let advices = [
            "Анализ адаптации ЦНС: обнаружен перетрен, запущен делоад 50%. Двигайся строго в указанных весах, не поддавайся желанию добавить — сейчас важнее нервная система, а не цифры на штанге.",
            "Анализ адаптации ЦНС: нервная система восстанавливается. Веса выросли до 65%, но RIR остаётся высоким — не гонись за отказом.",
            "Анализ адаптации ЦНС: показатели в норме, веса подняты до 80%. Можно начинать прислушиваться к своим ощущениям и работать чуть плотнее.",
            "Анализ адаптации ЦНС: восстановление завершено. Веса вернулись к 100%, добавлен контрольный пик — оцени, как организм отвечает на полную нагрузку."
        ];
        return advices[weekNum - 1];
    }
    
    if (goal === "сила") {
        let advices = [
            "Анализ адаптации ЦНС: первая неделя цикла на СИЛУ. Задача — закрепить технику на рабочих весах, не гнаться за рекордами.",
            "Анализ адаптации ЦНС: интенсивность подросла. Следи за скоростью штанги в подъёме — если начала заметно падать, снижай вес на 2-3%.",
            "Анализ адаптации ЦНС: пиковая неделя. Это последняя точка перед проходкой — используй её, чтобы прочувствовать веса, близкие к максимальным.",
            "Анализ адаптации ЦНС: неделя проходки на 105% от ПМ. Обязательно сделай разминку по всей пирамиде, не пропускай ступени. Если синглы даются тяжело — не насилуй сустав, оставь попытку на следующий цикл."
        ];
        return advices[weekNum - 1];
    }
    
    if (goal === "масса") {
        let advices = [
            "Анализ адаптации ЦНС: первая неделя цикла на МАССУ. Работаем в комфортном темпе, фокус на чувстве мышцы, а не только на весе.",
            "Анализ адаптации ЦНС: лёгкая неделя — вес немного снижен, RIR увеличен. Используй это время для отработки амплитуды и техники.",
            "Анализ адаптации ЦНС: пик объёма. Добавлен подход на базовых движениях — контролируй питание и сон, организму нужно больше ресурсов на восстановление.",
            "Анализ адаптации ЦНС: пик интенсивности недели. На одном из базовых упражнений — пирамида до 105% на 2 повтора. Это не сила на максимум, а стимул для роста — работай в контролируемой технике."
        ];
        return advices[weekNum - 1];
    }
    
    if (goal === "сушка") {
        let advices = [
            "Анализ адаптации ЦНС: первая неделя цикла на СУШКУ. На дефиците калорий важно сохранить рабочие веса — не позволяй им проседать.",
            "Анализ адаптации ЦНС: увеличен объём. На дефиците это будет ощущаться тяжелее обычного — контролируй отдых между подходами.",
            "Анализ адаптации ЦНС: пиковая неделя объёма на сушке. Если чувствуешь сильную усталость — это нормально при дефиците, но следи, чтобы техника не страдала.",
            "Анализ адаптации ЦНС: делоад неделя (85% от рабочих весов). На дефиците калорий это критично важная неделя для восстановления ЦНС и суставов — не пропускай её."
        ];
        return advices[weekNum - 1];
    }
    
    return "Анализ адаптации ЦНС: продолжай следовать плану, слушай своё тело.";
}

// ===== РЕНДЕР МЕЗОЦИКЛА В HTML =====
function renderMesocycleToHTMLLocal(mesocycle) {
    let html = '';
    
    let goalAccusative = getGoalAccusativeLocal(mesocycle.userContext.goal);
    
    html += '<div style="text-align: center; margin: 30px 0;">';
    html += '<h1 class="matrix-text-glow" style="color: var(--accent-color); font-size: 28px; font-family: var(--font-header);">🔥 ПРОГРАММА НА ' + goalAccusative + ' — 4 НЕДЕЛИ 🔥</h1>';
    html += '<p style="color: var(--text-muted); font-size: 14px;">Программа тренировок с прогрессией нагрузки</p>';
    html += '</div>';
    
    mesocycle.weeks.forEach((week, idx) => {
        html += '<div class="mesocycle-week-block" style="margin-bottom: 50px;">';
        
        html += '<div style="background: linear-gradient(135deg, #1a1d26 0%, #0d0f14 100%); border: 2px solid var(--accent-color); border-radius: 12px; padding: 20px; margin-bottom: 20px; text-align: center;">';
        html += '<h2 style="color: var(--accent-color); font-size: 24px; margin: 0; font-family: var(--font-header);">📅 НЕДЕЛЯ ' + (idx + 1) + '</h2>';
        
        let weekDesc = getWeekDescriptionLocal(idx + 1, mesocycle.userContext);
        html += '<p style="color: var(--text-muted); font-size: 13px; margin: 10px 0 0 0;">' + weekDesc + '</p>';
        html += '</div>';
        
        html += renderWeekTablesLocal(week.structure);
        
        // Блок с советом тренера под каждой неделей
        html += '<div style="background: #0e1117; border-left: 3px solid var(--accent-color); border-radius: 8px; padding: 18px 20px; margin-top: 15px;">';
        html += '<div style="color: #f0c419; font-weight: 600; font-size: 13px; margin-bottom: 8px;">⚠️ ТРЕНИРОВОЧНЫЙ ИНСТРУКТАЖ ТРЕНЕРА:</div>';
        html += '<div style="color: var(--text-muted); font-size: 13px; line-height: 1.5;">' + week.structure.trainerAdvice + '</div>';
        html += '</div>';
        
        html += '</div>';
    });
    
    html += '<div style="text-align: center; margin: 40px 0;">';
    html += '<button class="pay-btn" onclick="downloadMesocycleAsHTMLLocal()" style="padding: 15px 40px; font-size: 16px;">💾 СКАЧАТЬ ПРОГРАММУ (.HTML)</button>';
    html += '</div>';
    
    return html;
}

// ===== РЕНДЕР ТАБЛИЦ ОДНОЙ НЕДЕЛИ =====
function renderWeekTablesLocal(weekStructure) {
    let tableContent = "";

    weekStructure.days.forEach(day => {
        let rowsHtml = "";
        let exIndex = 0;

        day.exercises.forEach(ex => {
            if (!ex) return;
            exIndex++;

            let cleanNote = ex.note ? ex.note.toString().replace(/💥|⚙️|🪵|🪙|🛍️|\(Кубик рандома.*?\)/g, "").trim() : "";

            let setsArray = ex.sets.toString().split(/<br\s*\/?>|\n/gi);
            let repsArray = ex.reps.toString().split(/<br\s*\/?>/gi);
            let weightArray = ex.weight ? ex.weight.toString().split(/<br\s*\/?>/gi) : [];
            let rirArray = ex.rir ? ex.rir.toString().split(/<br\s*\/?>/gi) : [];

            let actualSetsCount = Math.max(setsArray.length, repsArray.length, weightArray.length, rirArray.length);
            if (actualSetsCount === 1 && !isNaN(parseInt(ex.sets))) {
                actualSetsCount = parseInt(ex.sets);
            }

            for (let s = 0; s < actualSetsCount; s++) {
                let currentRep = repsArray[s] || repsArray[0] || "8";
                let currentWeight = weightArray[s] || weightArray[0] || ex.weight || "";
                let currentRir = rirArray[s] || rirArray[0] || ex.rir || "RIR 2";
                let finalWeightDisplay = currentWeight || currentRir;

                let numberCell = "";
                let exerciseTitleCell = "";
                if (s === 0) {
                    numberCell = '<td class="ex-number-cell" rowspan="' + actualSetsCount + '" style="vertical-align:middle;text-align:center;width:36px;background:#0e1117;border-bottom:1px solid rgba(255,255,255,0.08);font-family:var(--font-header);font-size:13px;font-weight:700;color:var(--accent-color);text-shadow:0 0 8px var(--accent-glow);">' + exIndex + '</td>';
                    exerciseTitleCell = '<td class="align-left" rowspan="' + actualSetsCount + '" style="vertical-align:middle;background:#0e1117;border-bottom:1px solid rgba(255,255,255,0.08);">' + ex.icon + ' <b>' + ex.name + '</b>' + (cleanNote ? '<br><span style="font-size:10px;color:var(--text-muted);font-weight:400;">' + cleanNote + '</span>' : '') + '</td>';
                }

                rowsHtml += '<tr>' +
                            numberCell +
                            exerciseTitleCell +
                            '<td style="color:var(--accent-color);font-weight:600;font-family:var(--font-header);">СЕТ ' + (s + 1) + '</td>' +
                            '<td style="font-weight:600;color:#fff;">' + finalWeightDisplay + '</td>' +
                            '<td style="color:#fff;font-weight:700;">' + currentRep + '</td>' +
                            '</tr>';
            }
        });

        tableContent += createTableBlock(day.title, rowsHtml);
    });

    return tableContent;
}

// ===== СКАЧИВАНИЕ МЕЗОЦИКЛА КАК .HTML =====
function downloadMesocycleAsHTMLLocal() {
    if (!globalMesocycleCache) {
        alert("⚠️ Мезоцикл не сгенерирован!");
        return;
    }
    
    let container = document.getElementById('mesocycleOutputContainer');
    if (!container) {
        alert("⚠️ Контейнер мезоцикла не найден!");
        return;
    }
    
    let fullHTML = `<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Мезоцикл — Программа тренировок</title>
    <style>
        :root {
            --bg-dark: #0d0f14;
            --bg-card: #1a1d26;
            --accent-color: #00ffcc;
            --text-primary: #e0e6ed;
            --text-muted: #8a92a3;
            --border-color: #2a2e3a;
            --font-header: 'Orbitron', sans-serif;
        }
        body {
            background: var(--bg-dark);
            color: var(--text-primary);
            font-family: 'Inter', -apple-system, sans-serif;
            padding: 20px;
            line-height: 1.6;
        }
        .matrix-text-glow {
            text-shadow: 0 0 10px var(--accent-color), 0 0 20px var(--accent-color);
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
            background: var(--bg-card);
            border: 1px solid var(--border-color);
        }
        th, td {
            padding: 12px;
            text-align: left;
            border: 1px solid var(--border-color);
        }
        th {
            background: linear-gradient(135deg, #1a1d26 0%, #0d0f14 100%);
            color: var(--accent-color);
            font-weight: 600;
        }
        .mesocycle-week-block {
            margin-bottom: 50px;
            page-break-inside: avoid;
        }
    </style>
</head>
<body>
    ${container.innerHTML}
</body>
</html>`;
    
    let blob = new Blob([fullHTML], { type: 'text/html;charset=utf-8' });
    let link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'mesocycle_program_' + Date.now() + '.html';
    link.click();
    
    console.log("✅ Мезоцикл скачан как .html файл");
}

console.log("✅ [МЕЗОЦИКЛ v3.0]: Модуль интегрирован с Системой Атак");
// ================================================================= 
// [ИНТЕГРАЦИЯ МЕЗОЦИКЛА С СИСТЕМОЙ АТАК v3.0]
// =================================================================
// Связывает mod-mesocycle-v2.js с твоим конвейером

let mesocycleButtonAdded = false;
let mesocyclePurchased = false; // Флаг: программа уже куплена (скрываем повторные кнопки)

// ===== АЛИАС ДЛЯ СТАРОЙ КНОПКИ "ПОЛУЧИТЬ ПОЛНЫЙ ПЛАН НА 30 ДНЕЙ ЗА 199 ₽" =====
window.redirectToPayment = function redirectToPayment() {
    console.log("💳 [ОПЛАТА] Клик по кнопке '30 ДНЕЙ ЗА 199₽' → запуск мезоцикла...");
    if (typeof handleMesocyclePurchaseLocal === "function") {
        handleMesocyclePurchaseLocal();
    } else {
        alert("⚠️ Ошибка: модуль мезоцикла не загружен. Обнови страницу (Ctrl+F5).");
    }
};

// ===== РЕЗЕРВНЫЙ ОБРАБОТЧИК: находим кнопку "30 ДНЕЙ ЗА 199₽" по тексту =====
document.addEventListener("DOMContentLoaded", function () {
    let allButtons = document.querySelectorAll("button");
    allButtons.forEach(function (btn) {
        if (btn.textContent && btn.textContent.includes("30 ДНЕЙ ЗА 199")) {
            btn.id = btn.id || "oldPaymentButton30Days";
            btn.addEventListener("click", function (e) {
                console.log("💳 [РЕЗЕРВНЫЙ ОБРАБОТЧИК] Клик по кнопке '30 ДНЕЙ' пойман через addEventListener");
                window.redirectToPayment();
            });
        }
    });
    console.log("✅ [ИНТЕГРАЦИЯ v3.0] Обработчики кнопок подключены");
});

// ===== ДОБАВЛЕНИЕ КНОПКИ "ПОЛУЧИТЬ ПРОГРАММУ НА МЕСЯЦ" (второстепенная точка входа) =====
function addMesocycleButtonLocal() {
    if (mesocycleButtonAdded || mesocyclePurchased) return;
    
    let resultContainer = document.getElementById('resProgramTable');
    if (!resultContainer) {
        console.warn("⚠️ Контейнер resProgramTable не найден");
        return;
    }
    
    let buttonBlock = document.createElement('div');
    buttonBlock.id = 'mesocycleButtonBlock';
    buttonBlock.style.cssText = `
        text-align: center;
        margin: 40px auto;
        padding: 30px;
        background: linear-gradient(135deg, #1a1d26 0%, #0d0f14 100%);
        border: 2px solid var(--accent-color);
        border-radius: 16px;
        box-shadow: 0 0 30px rgba(0, 255, 204, 0.2);
        max-width: 800px;
    `;
    
    buttonBlock.innerHTML = `
        <h3 class="matrix-text-glow" style="color: var(--accent-color); font-size: 22px; margin-bottom: 15px; font-family: var(--font-header);">
            🚀 ХОЧЕШЬ БОЛЬШЕ?
        </h3>
        <p style="color: var(--text-muted); font-size: 14px; margin-bottom: 20px;">
            Получи <b>полную программу на месяц</b> с прогрессией нагрузки по неделям!<br>
            <span style="color: var(--accent-color);">✓ 4 недели тренировок</span> • 
            <span style="color: var(--accent-color);">✓ Рост интенсивности</span> • 
            <span style="color: var(--accent-color);">✓ Учёт перетрена</span> • 
            <span style="color: var(--accent-color);">✓ Проходки на пике</span>
        </p>
        <button 
            class="pay-btn" 
            onclick="handleMesocyclePurchaseLocal()" 
            style="padding: 18px 50px; font-size: 18px; background: linear-gradient(135deg, #00ffcc 0%, #00cc99 100%); color: #0d0f14; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 0 20px rgba(0, 255, 204, 0.5);"
        >
            💳 ПОЛУЧИТЬ ПРОГРАММУ НА МЕСЯЦ — 199₽
        </button>
        <p style="color: var(--text-muted); font-size: 11px; margin-top: 15px;">
            🔒 Безопасная оплата через ЮKassa
        </p>
    `;
    
    resultContainer.parentNode.insertBefore(buttonBlock, resultContainer.nextSibling);
    
    mesocycleButtonAdded = true;
    console.log("✅ Кнопка мезоцикла добавлена");
}

// ===== ОБРАБОТЧИК НАЖАТИЯ КНОПКИ =====
function handleMesocyclePurchaseLocal() {
    console.log("💳 [ОПЛАТА] Инициация оплаты мезоцикла...");
    
    if (confirm("⚠️ РЕЖИМ РАЗРАБОТКИ\n\nОплата через ЮKassa ещё не подключена.\nСгенерировать мезоцикл бесплатно для теста?")) {
        generateAndShowMesocycleLocal();
    } else {
        alert("💡 После интеграции ЮKassa здесь будет редирект на платёжную форму.");
    }
}

// ===== ГЕНЕРАЦИЯ И ОТОБРАЖЕНИЕ МЕЗОЦИКЛА =====
function generateAndShowMesocycleLocal() {
    console.log("🔥 [МЕЗОЦИКЛ] Старт генерации...");
    
    if (!globalGeneratedStructureCache) {
        alert("⚠️ Ошибка: программа не найдена!\n\nСначала пройди квиз и получи недельную программу.");
        return;
    }
    
    if (typeof userContext === 'undefined' || !userContext) {
        alert("⚠️ Ошибка: анкета пользователя не найдена!");
        return;
    }
    
    try {
        let mesocycle = generateMesocycleLocal();
        let html = renderMesocycleToHTMLLocal(mesocycle);
        showMesocycleResultLocal(html);
        
        mesocyclePurchased = true;
        
        console.log("✅ [МЕЗОЦИКЛ] Генерация завершена успешно!");
        
    } catch (error) {
        console.error("❌ [МЕЗОЦИКЛ] Ошибка генерации:", error);
        alert("⚠️ Произошла ошибка при генерации мезоцикла:\n\n" + error.message);
    }
}

// ===== ОТОБРАЖЕНИЕ РЕЗУЛЬТАТА =====
function showMesocycleResultLocal(html) {
    // Скрываем ВСЕ кнопки покупки (и старую "30 ДНЕЙ", и новую "ПОЛУЧИТЬ ПРОГРАММУ НА МЕСЯЦ")
    hideAllPurchaseButtonsLocal();
    
    // Скрываем недельную программу и её таблицу с ПМ, чтобы не дублировать контент
    let weeklyResult = document.getElementById('resProgramTable');
    if (weeklyResult) {
        weeklyResult.style.display = 'none';
    }
    
    let pmInputsBlock = document.getElementById('dynamicFinalInputsContainer');
    if (pmInputsBlock && pmInputsBlock.closest('.quiz-container')) {
        // Прячем весь блок "АКТИВАЦИЯ КИЛОГРАММОВ ПРОГРАММЫ" целиком, если получится найти обёртку
        let wrapper = pmInputsBlock.closest('.quiz-container') || pmInputsBlock.parentElement;
        if (wrapper) wrapper.style.display = 'none';
    }
    
    let container = document.getElementById('mesocycleOutputContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'mesocycleOutputContainer';
        container.style.cssText = `
            max-width: 1200px;
            margin: 30px auto;
            padding: 0;
        `;
        
        let anchor = document.getElementById('mesocycleButtonBlock') || document.getElementById('oldPaymentButton30Days') || weeklyResult;
        if (anchor && anchor.parentNode) {
            anchor.parentNode.insertBefore(container, anchor.nextSibling);
        } else {
            document.body.appendChild(container);
        }
    }
    
    container.innerHTML = html;
    
    container.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ===== СКРЫТИЕ ВСЕХ КНОПОК ПОКУПКИ ПОСЛЕ УСПЕШНОЙ ГЕНЕРАЦИИ =====
function hideAllPurchaseButtonsLocal() {
    // Новая кнопка "ПОЛУЧИТЬ ПРОГРАММУ НА МЕСЯЦ"
    let buttonBlock = document.getElementById('mesocycleButtonBlock');
    if (buttonBlock) {
        buttonBlock.style.display = 'none';
    }
    
    // Старая кнопка "30 ДНЕЙ ЗА 199₽" (и её обёртка, если есть)
    let allButtons = document.querySelectorAll("button");
    allButtons.forEach(function (btn) {
        if (btn.textContent && btn.textContent.includes("30 ДНЕЙ ЗА 199")) {
            btn.style.display = 'none';
        }
    });
}

console.log("✅ [ИНТЕГРАЦИЯ v3.0]: Модуль мезоцикла готов к использованию");
