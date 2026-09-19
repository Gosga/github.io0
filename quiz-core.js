// ================================================================= 
// [ГЛАВНЫЙ ДИСПЕТЧЕР НАВИГАЦИИ И КАРТЫ ВЕСОВ v4.3 — ЧАСТЬ 1]
// =================================================================

let currentStepIndexLocal = 0; // На каком из 9 шагов находится атлет
let globalGeneratedStructureCache = null; // Буфер структуры для мгновенного пересчета килограммов

// Автоматический запуск квиза при старте страницы
document.addEventListener("DOMContentLoaded", function() {
    console.log("🧩 [QUIZ-CORE]: Инициализация главного исполнительного движка квиза...");
    renderCurrentStepLocal();
});

// Отрисовка текущего вопроса на экране
function renderCurrentStepLocal() {
    let container = document.getElementById('quiz-screens-container');
    if (!container) return;

    // Полностью сбрасываем старые классы анимации с контейнера, убирая залипания!
    container.className = "fade-in-active";
    container.style.display = 'block';

    let totalSteps = quizStepsData.length; 
    let progressPercent = (currentStepIndexLocal / totalSteps) * 100;
    
    document.getElementById('progressText').innerText = "Вопрос " + (currentStepIndexLocal + 1) + " из " + totalSteps;
    document.getElementById('progressBar').style.width = progressPercent + "%";

    let step = quizStepsData[currentStepIndexLocal];
    let optionsHtml = "";
    
    step.options.forEach(opt => {
        let activeClass = (userContext[step.id] === opt.value) ? "active-selected" : "";
        optionsHtml += '<button class="option-btn ' + activeClass + '" onclick="handleOptionSelectLocal(\'' + step.id + '\', \'' + opt.value + '\')">' +
                       '<span>' + opt.text + '</span>' +
                       '<span class="neon-link-glow">SELECT ❯</span>' +
                       '</button>';
    });

    let navHtml = '<div class="nav-actions" style="margin-top: 25px;">';
    if (currentStepIndexLocal > 0) {
        navHtml += '<button class="back-btn" onclick="goBackLocal()">← Назад</button>';
    }
    navHtml += '</div>';

    container.innerHTML = '<div class="quiz-screen">' +
                          '<h2 class="question-title">Шаг ' + (currentStepIndexLocal + 1) + ': ' + step.title + '</h2>' +
                          '<div style="margin-top: 20px;">' + optionsHtml + '</div>' +
                          navHtml +
                          '</div>';
}

function handleOptionSelectLocal(stepId, selectedValue) {
    userContext[stepId] = selectedValue;
    let container = document.getElementById('quiz-screens-container');
    if (container) {
        // Меняем класс анимации на плавный выход
        container.className = "fade-out-exit";
    }

    setTimeout(function() {
        currentStepIndexLocal++;
        if (currentStepIndexLocal >= quizStepsData.length) {
            submitQuizAndBuildPipelineLocal();
        } else {
            renderCurrentStepLocal();
        }
    }, 250);
}

// 🔥 ИСПРАВЛЕННЫЙ БАГ НАВИГАЦИИ НАЗАД: Экраны больше не застывают! 🔥
function goBackLocal() {
    if (currentStepIndexLocal > 0) {
        let container = document.getElementById('quiz-screens-container');
        if (container) {
            container.className = "fade-out-exit";
        }

        setTimeout(function() {
            currentStepIndexLocal--;
            renderCurrentStepLocal(); // Рендерит предыдущий слайд, принудительно очищая классы
        }, 250);
    }
}

// 🔥 ИСПРАВЛЕННАЯ ФУНКЦИЯ «ИЗМЕНИТЬ ОТВЕТЫ»: Возврат квиза без зависания страницы 🔥
function modifyUserAnswersBackLocal() {
    let resultScreen = document.getElementById('resultScreen');
    if (resultScreen) {
        resultScreen.style.display = 'none';
    }
    
    currentStepIndexLocal = quizStepsData.length - 1; // Силой откатываем на 9-й шаг
    
    let container = document.getElementById('quiz-screens-container');
    if (container) {
        container.style.display = 'block';
        renderCurrentStepLocal(); // Перерисовываем слайд и полностью сбрасываем анимационный кэш
    }
}
// Фиксация весов ПМ, скрытие квиза и запуск Pipeline-конвейера с обходом блокировок CORS
function submitQuizAndBuildPipelineLocal() {
    document.getElementById('quiz-screens-container').style.display = 'none';
    document.getElementById('progressBar').style.width = "100%";
    document.getElementById('progressText').innerText = "АНАЛИЗ МАТРИЦЫ ЗАВЕРШЕН";
    document.getElementById('resultScreen').style.display = 'block';

    let cloudKey = userContext.goal + "_" + userContext.experience + "_" + userContext.days + "d_legs" + userContext.legs_allowed + "_spine" + userContext.spine + "_spec" + userContext.spec;
    const FIREBASE_URL = "https://firebaseio.com";

    // ПРЕДОХРАНИТЕЛЬ ПРОТИВ БЛОКИРОВОК БРАУЗЕРА (file:///)
    if (window.location.protocol === 'file:') {
        console.log("🛸 [ЛОКАЛЬНЫЙ РЕЖИМ]: Запуск автономного конвейера без сетевых блокировок...");
        executeLocalBackupPipelineOnlyLocal();
        return;
    }

    fetch(FIREBASE_URL + "author_programs/" + cloudKey + ".json")
        .then(res => res.json())
        .then(cloudData => {
            if (cloudData && cloudData.days) {
                console.log("🔥 [ОБЛАЧНЫЙ ПЕРЕХВАТ]: Обнаружен авторский шаблон тренера для ключа " + cloudKey);
                globalGeneratedStructureCache = cloudData;
                renderDynamicFinalInputsBlockLocal(true);
            } else {
                executeLocalBackupPipelineOnlyLocal();
            }
        })
        .catch(err => {
            console.log("Облако временно недоступно. Запуск автономного конвейера.");
            executeLocalBackupPipelineOnlyLocal();
        });
}

// Выделенная изолированная функция сборки локальной программы в буфер кэша
function executeLocalBackupPipelineOnlyLocal() {
    let dummyWeights = { j_100: 0, p_100: 0, pull_95: 0, bic_100: 0 };
    let oldRender = renderPipelineOutputToUILocal;
    
    renderPipelineOutputToUILocal = function(programStructure) {
        globalGeneratedStructureCache = programStructure;
    };
    
    runCorePipelineLocal(dummyWeights);
    renderPipelineOutputToUILocal = oldRender;
    
    renderDynamicFinalInputsBlockLocal(false);
}

// Реактивный рендеринг полей ввода ПМ на основе выпавших упражнений программы
function renderDynamicFinalInputsBlockLocal(isAuthorProgram) {
    let container = document.getElementById('dynamicFinalInputsContainer');
    if (!container || !globalGeneratedStructureCache) return;

    let uniqueExercisesNames = [];
    globalGeneratedStructureCache.days.forEach(day => {
        day.exercises.forEach(ex => {
            if (ex && ex.name && !uniqueExercisesNames.includes(ex.name)) {
                uniqueExercisesNames.push(ex.name);
            }
        });
    });

    let html = "";
    uniqueExercisesNames.forEach((name, idx) => {
        let cleanId = "final_pm_input_" + idx;
        let placeholderText = "Введи 1 ПМ (кг)";
        
        // Интеллектуальный контроль подтягиваний: если подтягивается без веса — просим макс повторы
        if (name.includes("со своим весом") || name.includes("под столом") || name.includes("Отжимания от пола") || name.includes("без веса")) {
            placeholderText = "Макс повторы (раз)";
        }

        html += '<div class="pm-input-group" style="margin-bottom:0;">' +
                '<label style="font-size:11px; color:#fff;">' + name + ':</label>' +
                '<input type="number" id="' + cleanId + '" class="pm-field" style="padding:10px 14px; font-size:13px;" placeholder="' + placeholderText + '" oninput="recalculateLiveWeightsMatrixLocal()">' +
                '</div>';
    });

    container.innerHTML = html;
    recalculateLiveWeightsMatrixLocal();
}

// Математическое ядро RIR-интенсивности и живой построчный пересчет килограммов
function recalculateLiveWeightsMatrixLocal() {
    if (!globalGeneratedStructureCache) return;

    let container = document.getElementById('dynamicFinalInputsContainer');
    let inputs = container.querySelectorAll('input');
    let liveWeightsMap = {};

    let uniqueExercisesNames = [];
    globalGeneratedStructureCache.days.forEach(day => {
        day.exercises.forEach(ex => {
            if (ex && ex.name && !uniqueExercisesNames.includes(ex.name)) uniqueExercisesNames.push(ex.name);
        });
    });

    inputs.forEach((input, idx) => {
        let val = parseFloat(input.value) || 0;
        let exName = uniqueExercisesNames[idx];
        if (exName) liveWeightsMap[exName] = val;
    });

    // Функция перевода RIR и повторений в точный рабочий вес
    let calculateRirWeight = function(exName, repsStr, rirStr, originalWeightStr) {
        let userPm = liveWeightsMap[exName] || 0;
        
        // Если ПМ не введен, выводим чистый RIR без лишнего текста!
        if (userPm <= 0) {
            return rirStr.toString();
        }

        let reps = parseInt(repsStr) || 8;
        let rir = parseInt(rirStr.toString().replace(/[^0-9]/g, '')) || 2;
        if (rirStr.toString().includes("RIR 0")) rir = 0;

        // Если это упражнения со своим весом — считаем по формуле повторов от максимума раз
        if (exName.includes("со своим весом") || exName.includes("под столом") || exName.includes("Отжимания от пола") || exName.includes("без веса")) {
            // Закон 10 повторений: если максимум меньше 10 — вес тела, рабочие повторы на 75%
            return "Вес тела";
        }

        // Предохранитель Георгия: если вес ПМ слишком мал для схемы (например, 5кг на 1 ПМ), страхуем формулу
        if (userPm <= 5 && reps > 1) {
            return "Вес тела / Легкий";
        }

        let totalEffortReps = reps + rir; 
        let intensityPercent = 1.0 - (totalEffortReps * 0.025); 
        intensityPercent = Math.max(0.4, Math.min(1.0, intensityPercent));

        return Math.round(userPm * intensityPercent) + " кг";
    };

    // Динамическая сборка имени программы по простому закону Георгия: Сплит + Цель
    let splitName = "Программа";
    if (userContext.days === "3") splitName = "Фулбоди";
    if (userContext.days === "4") splitName = "Вверх-низ";
    if (userContext.days === "2") splitName = "Двухдневный сплит";
    if (userContext.days === "1") splitName = "Однодневный сплит";
    
    let finalProgramTitleText = (splitName + " на " + userContext.goal).toUpperCase();
    if (userContext.spec && userContext.spec !== "skip") {
        let specLabels = { arms: "акцент на руки", chest: "акцент на грудь", back: "акцент на спину" };
        finalProgramTitleText += " (" + (specLabels[userContext.spec] || "") + ")";
    }
    document.getElementById('resProgramName').innerText = finalProgramTitleText;

    let tableContent = "";
    globalGeneratedStructureCache.days.forEach(day => {
        let rowsHtml = "";
        
        day.exercises.forEach(ex => {
            if (!ex) return;
            let cleanNote = ex.note ? ex.note.toString().replace(/💥|⚙️|🪵|🪙|🛍️|\(Кубик рандома.*?\)/g, "").trim() : "";
            
            let setsArray = ex.sets.toString().split(/<br\s*\/?>|\n/gi);
            let repsArray = ex.reps.toString().split(/<br\s*\/?>/gi);
            let weightArray = ex.weight ? ex.weight.toString().split(/<br\s*\/?>/gi) : [];
            let rirArray = ex.rir ? ex.rir.toString().split(/<br\s*\/?>/gi) : [];

            let actualSetsCount = Math.max(setsArray.length, repsArray.length, weightArray.length, rirArray.length);
            if (actualSetsCount === 1 && !isNaN(parseInt(ex.sets))) actualSetsCount = parseInt(ex.sets);

            for (let s = 0; s < actualSetsCount; s++) {
                let currentRep = (repsArray[s] || repsArray[0] || "8").toString();
                let currentWeight = (weightArray[s] || weightArray[0] || ex.weight || "").toString();
                let currentRir = (rirArray[s] || rirArray[0] || ex.rir || "RIR 2").toString();

                let liveWeightResult = calculateRirWeight(ex.name, currentRep, currentRir, currentWeight);
                let finalWeightDisplay = liveWeightResult;
                
                // Если рассчитался вес в кг — красиво дописываем RIR в скобках, колонка RIR сохранена в верстке!
                if (!finalWeightDisplay.includes("RIR") && !finalWeightDisplay.includes("Отказ") && !finalWeightDisplay.includes("Вес тела")) {
                    finalWeightDisplay += " (" + currentRir.replace(/<[^>]*>/g, '') + ")";
                }

                let exerciseTitleCell = "";
                if (s === 0) {
                    exerciseTitleCell = '<td class="align-left" rowspan="' + actualSetsCount + '" style="vertical-align: middle; background: #0e1117; border-bottom: 1px solid rgba(255,255,255,0.08);">🏋️‍♂️ <b>' + ex.name + '</b>' + (cleanNote ? '<br><span style="font-size:10px; color:var(--text-muted); font-weight:400;">' + cleanNote + '</span>' : '') + '</td>';
                }

                rowsHtml += '<tr>' +
                            exerciseTitleCell +
                            '<td style="color: var(--accent-color); font-weight:600; font-family:var(--font-header);">СЕТ ' + (s + 1) + '</td>' +
                            '<td style="font-weight: 600;">' + finalWeightDisplay + '</td>' +
                            '<td style="color: #fff; font-weight:700;">' + currentRep + '</td>' +
                            '</tr>';
            }
        });
        
        tableContent += createTableBlock(day.title, rowsHtml);
    });

    document.getElementById('resProgramTable').innerHTML = tableContent;
}
