// ================================================================= 
// [МЕЗОЦИКЛ v3.0 — ГЕНЕРАЦИЯ 4-НЕДЕЛЬНОЙ ПРОГРАММЫ]
// =================================================================

let globalMesocycleCache = null;

// ===== СЛОВАРЬ ПАДЕЖЕЙ ДЛЯ ЦЕЛЕЙ =====
function getGoalAccusativeCase(goal) {
    const map = {
        "масса": "МАССУ",
        "сила": "СИЛУ",
        "сушка": "СУШКУ"
    };
    return map[goal] || (goal ? goal.toUpperCase() : "ТРЕНИРОВКИ");
}

// ===== СБОР ВЕСОВ ПМ ИЗ ВЕРХНЕЙ ТАБЛИЦЫ =====
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

// ===== ПЕРЕВОД "75% ПМ" В КГ =====
function convertWeightTokenToKgLocal(weightToken, exName, liveWeightsMap) {
    if (!weightToken) return weightToken;
    
    let match = weightToken.match(/(\d+)\s*%/);
    if (!match) return weightToken;
    
    let userPm = liveWeightsMap ? (liveWeightsMap[exName] || 0) : 0;
    if (userPm <= 0) return weightToken;
    
    let pct = parseInt(match[1]);
    
    if (exName.includes("со своим весом") || exName.includes("под столом") || exName.includes("Отжимания") || exName.includes("без веса")) {
        return "Вес тела";
    }
    
    if (userPm <= 5) {
        return "Вес тела / Легкий";
    }
    
    let kg = Math.round((userPm * pct) / 100 * 2) / 2;
    return kg + " кг";
}

// ===== ГЛАВНАЯ ФУНКЦИЯ ГЕНЕРАЦИИ МЕЗОЦИКЛА =====
function generateMesocycleLocal() {
    console.log("🔥 [МЕЗОЦИКЛ v3.0] Запуск генерации 4 недель...");
    
    if (!globalGeneratedStructureCache) {
        alert("⚠️ Сначала сгенерируй недельную программу!");
        return null;
    }
    
    let liveWeightsMap = collectLiveWeightsMapLocal();
    let weeks = [];
    
    for (let weekNum = 1; weekNum <= 4; weekNum++) {
        let weekStructure = JSON.parse(JSON.stringify(globalGeneratedStructureCache));
        
        applyWeekProgressionLocal(weekStructure, weekNum, liveWeightsMap);
        
        weeks.push({
            weekNumber: weekNum,
            structure: weekStructure
        });
    }
    
    globalMesocycleCache = { weeks, userContext, liveWeightsMap };
    console.log("✅ [МЕЗОЦИКЛ v3.0] Генерация завершена!");
    return globalMesocycleCache;
}

// ===== ПРИМЕНЕНИЕ ПРОГРЕССИИ ДЛЯ НЕДЕЛИ =====
function applyWeekProgressionLocal(weekStructure, weekNum, liveWeightsMap) {
    let goal = userContext.goal;
    let plateau = userContext.plateau;
    
    let weekConfig = getWeekConfigLocal(goal, plateau, weekNum);
    
    weekStructure.days.forEach(day => {
        day.exercises.forEach(ex => {
            transformExerciseForWeekLocal(ex, weekConfig, weekNum, liveWeightsMap);
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

// ===== ТРАНСФОРМАЦИЯ УПРАЖНЕНИЯ ДЛЯ НЕДЕЛИ =====
function transformExerciseForWeekLocal(ex, weekConfig, weekNum, liveWeightsMap) {
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
    
    // Перевод % в реальные кг, если ПМ введён
    if (ex.weight && ex.weight.includes("%")) {
        let tokens = ex.weight.split(/<br\s*\/?>/gi);
        let convertedTokens = tokens.map(t => convertWeightTokenToKgLocal(t, ex.name, liveWeightsMap));
        ex.weight = convertedTokens.join("<br>");
    }
}

// ===== МОДИФИКАЦИЯ ВЕСА =====
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

// ===== ПРИМЕНЕНИЕ ПИКОВОЙ ИНТЕНСИВНОСТИ =====
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

// ===== ОПИСАНИЕ НЕДЕЛИ =====
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

// ===== СОВЕТЫ ТРЕНЕРА НА КАЖДУЮ НЕДЕЛЮ =====
function getTrainerAdviceLocal(weekNum, ctx) {
    let goal = ctx.goal;
    let plateau = ctx.plateau;
    
    if (plateau === "plateau_over") {
        let advices = [
            "⚠️ АНАЛИЗ АДАПТАЦИИ ЦНС: Обнаружен перетрен. Запущен делоад 50%. Двигайся строго в указанных весах — сейчас важнее нервная система, а не цифры на штанге.",
            "⚠️ АНАЛИЗ АДАПТАЦИИ ЦНС: Нервная система восстанавливается. Веса выросли до 65%, но RIR остаётся высоким — не гонись за отказом.",
            "⚠️ АНАЛИЗ АДАПТАЦИИ ЦНС: Показатели в норме, веса подняты до 80%. Можно начинать прислушиваться к своим ощущениям и работать чуть плотнее.",
            "⚠️ АНАЛИЗ АДАПТАЦИИ ЦНС: Восстановление завершено. Веса вернулись к 100%, добавлен контрольный пик — оцени, как организм отвечает на полную нагрузку."
        ];
        return advices[weekNum - 1];
    }
    
    if (goal === "сила") {
        let advices = [
            "⚠️ АНАЛИЗ АДАПТАЦИИ ЦНС: Первая неделя цикла НА СИЛУ. Задача — закрепить технику на рабочих весах, не гнаться за рекордами.",
            "⚠️ АНАЛИЗ АДАПТАЦИИ ЦНС: Интенсивность подросла. Следи за скоростью штанги в подъёме — если падает, снижай вес на 2-3%.",
            "⚠️ АНАЛИЗ АДАПТАЦИИ ЦНС: Пиковая неделя. Это последняя точка перед проходкой — используй её, чтобы прочувствовать веса, близкие к максимальным.",
            "⚠️ АНАЛИЗ АДАПТАЦИИ ЦНС: Неделя проходки на 105% от ПМ. Обязательно разминка по всей пирамиде, не пропускай ступени. Если сложно — оставь попытку на следующий цикл."
        ];
        return advices[weekNum - 1];
    }
    
    if (goal === "масса") {
        let advices = [
            "⚠️ АНАЛИЗ АДАПТАЦИИ ЦНС: Первая неделя цикла НА МАССУ. Работаем в комфортном темпе, фокус на чувстве мышцы, а не только на весе.",
            "⚠️ АНАЛИЗ АДАПТАЦИИ ЦНС: Лёгкая неделя — вес снижен, RIR увеличен. Используй время для отработки амплитуды и техники.",
            "⚠️ АНАЛИЗ АДАПТАЦИИ ЦНС: Пик объёма. Добавлен подход на базовых движениях — контролируй питание и сон, организму нужно больше ресурсов.",
            "⚠️ АНАЛИЗ АДАПТАЦИИ ЦНС: Пик интенсивности недели. На одном из базовых упражнений — пирамида до 105% на 2 повтора. Это стимул для роста — работай в контролируемой технике."
        ];
        return advices[weekNum - 1];
    }
    
    if (goal === "сушка") {
        let advices = [
            "⚠️ АНАЛИЗ АДАПТАЦИИ ЦНС: Первая неделя цикла НА СУШКУ. На дефиците важно сохранить рабочие веса — не позволяй им проседать.",
            "⚠️ АНАЛИЗ АДАПТАЦИИ ЦНС: Увеличен объём. На дефиците это будет ощущаться тяжелее — контролируй отдых между подходами.",
            "⚠️ АНАЛИЗ АДАПТАЦИИ ЦНС: Пиковая неделя объёма на сушке. Если чувствуешь усталость — это нормально при дефиците, но следи за техникой.",
            "⚠️ АНАЛИЗ АДАПТАЦИИ ЦНС: Делоад неделя (85% от рабочих весов). На дефиците это критично важна для восстановления ЦНС и суставов — не пропускай!"
        ];
        return advices[weekNum - 1];
    }
    
    return "⚠️ АНАЛИЗ АДАПТАЦИИ ЦНС: Продолжай следовать плану, слушай своё тело.";
}

// ===== РЕНДЕР МЕЗОЦИКЛА В HTML =====
function renderMesocycleToHTMLLocal(mesocycle) {
    let html = '';
    let goalAccusative = getGoalAccusativeCase(mesocycle.userContext.goal);
    
    html += '<div style="text-align: center; margin: 30px 0;">';
    html += '<h1 class="matrix-text-glow" style="color: var(--accent-color); font-size: 28px; font-family: var(--font-header);">🔥 ПРОГРАММА НА ' + goalAccusative + ' — 4 НЕДЕЛИ 🔥</h1>';
    html += '<p style="color: var(--text-muted); font-size: 14px;">Программа с прогрессией нагрузки</p>';
    html += '</div>';
    
    mesocycle.weeks.forEach((week, idx) => {
        html += '<div class="mesocycle-week-block" style="margin-bottom: 50px;">';
        
        html += '<div style="background: linear-gradient(135deg, #1a1d26 0%, #0d0f14 100%); border: 2px solid var(--accent-color); border-radius: 12px; padding: 20px; margin-bottom: 20px; text-align: center;">';
        html += '<h2 style="color: var(--accent-color); font-size: 24px; margin: 0; font-family: var(--font-header);">📅 НЕДЕЛЯ ' + (idx + 1) + '</h2>';
        
        let weekDesc = getWeekDescriptionLocal(idx + 1, mesocycle.userContext);
        html += '<p style="color: var(--text-muted); font-size: 13px; margin: 10px 0 0 0;">' + weekDesc + '</p>';
        html += '</div>';
        
        html += renderWeekTablesLocal(week.structure);
        
        // Блок с советом тренера
        html += '<div style="background: #0e1117; border-left: 3px solid var(--accent-color); border-radius: 8px; padding: 18px 20px; margin-top: 15px;">';
        html += '<div style="color: var(--text-muted); font-size: 13px; line-height: 1.5;">' + week.structure.trainerAdvice + '</div>';
        html += '</div>';
        
        html += '</div>';
    });
    
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

console.log("✅ [МЕЗОЦИКЛ v3.0]: Модуль интегрирован с Системой Атак");
