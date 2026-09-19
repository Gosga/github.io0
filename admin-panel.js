// ================================================================= 
// [ЦЕНТР УПРАВЛЕНИЯ ТРЕНЕРА — ОБЛАЧНАЯ CRM-ПАНЕЛЬ «СИСТЕМА АТАК» v4.0]
// =================================================================

const ADMIN_SECRET_PASSWORD_HASH = "matrix2026"; 
const FIREBASE_DB_URL = "https://firebaseio.com"; 

// Глобальный репозиторий упражнений
let globalExercisesRepository = [
    { id: "ex_jim_1", name: "Жим штанги лежа", category: "chest", gym: true, weights: true, spine: true },
    { id: "ex_jim_2", name: "Жим гантелей под углом 30 градусов", category: "chest", gym: true, weights: true, spine: true },
    { id: "ex_prised_1", name: "Приседания со штангой на плечах", category: "legs", gym: true, weights: true, spine: true },
    { id: "ex_pull_1", name: "Подтягивания на турнике с весом", category: "back", gym: true, weights: false, spine: true },
    { id: "ex_row_1", name: "Тяга штанги к поясу в наклоне", category: "back", gym: true, weights: true, spine: true },
    { id: "ex_row_2", name: "Тяга Т-грифа с упором в грудь", category: "back", gym: true, weights: true, spine: false },
    { id: "ex_bic_1", name: "Подъем штанги на бицепс стоя", category: "arms_bic", gym: true, weights: true, spine: true },
    { id: "ex_tri_1", name: "Разгибания рук на блоке с косичкой", category: "arms_tri", gym: true, weights: false, spine: false },
    { id: "ex_delt_1", name: "Разведения гантелей стоя (Махи)", category: "delts", gym: true, weights: true, spine: false },
    { id: "ex_calf_1", name: "Подъемы на икры стоя в тренажере", category: "calves", gym: true, weights: false, spine: false },
    { id: "ex_fore_1", name: "Сгибания кистей на предплечья сидя", category: "forearms", gym: true, weights: true, spine: false },
    { id: "ex_trap_1", name: "Шраги со штангой или гантелями", category: "traps", gym: true, weights: true, spine: true }
];

let globalTrainerConfig = {
    modifierNoviceBase: 5,
    modifierPlateauDeload: 50,
    tricepsMinReps: 6,
    cutIsoSetsReduction: true,
    noviceIsoSetsReduction: true,
    schemesStrength: ["2х4 RIR1 + 2х6 RIR2", "2х2 RIR1 + 2х8 RIR3", "3х5 RIR1 + 1х10 RIR3", "Лестница разминки + 100% ПМ (В один слот)", "Классическая схема 4х4 RIR1"],
    schemesMass: ["3х10 RIR2 + 2х6 RIR0 (ОТКАЗ)", "2х12 RIR2 + 2х8 RIR2", "1х10 RIR5 + 2х8 RIR0 + 2х12 RIR2", "Скрытый волновой дожим 90% ПМ на 2 повтора", "Золотой стандарт гипертрофии 4х8 RIR1-2"],
    schemesCutting: ["2х10 RIR2 + 2х14 RIR4", "3х8 RIR2 + 1х10 RIR0 (ОТКАЗ)", "2х12 RIR1 + 3х8 RIR2", "Формула распределения повторов (50/20/20/10)", "Рельефный многоповторный дожим 4х12 RIR2-3"]
};

let globalAuthorProgramsLogs = {};
let currentSimulatedKey = "";
let currentSimulatedData = null;

// [ОБЛАЧНАЯ СИНХРОНИЗАЦИЯ] Загрузка логов при входе
function loadAllDataFromFirebaseLocal() {
    fetch(FIREBASE_DB_URL + "config.json").then(res => res.json()).then(data => { if (data) globalTrainerConfig = data; });
    fetch(FIREBASE_DB_URL + "exercises.json").then(res => res.json()).then(data => { if (data && Array.isArray(data)) globalExercisesRepository = data; });
    fetch(FIREBASE_DB_URL + "author_programs.json").then(res => res.json()).then(data => { if (data) globalAuthorProgramsLogs = data; });
}

function saveExercisesRepositoryToFirebaseLocal() {
    fetch(FIREBASE_DB_URL + "exercises.json", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(globalExercisesRepository) });
}

// Авторизация тренера
function verifyAdminPasswordLocal() {
    let input = document.getElementById('adminPasswordInput').value;
    if (input === ADMIN_SECRET_PASSWORD_HASH) {
        document.getElementById('adminAuthWindow').style.display = 'none';
        let center = document.getElementById('trainerControlCenter');
        if (center) {
            center.style.display = 'block';
            center.className = "quiz-container neon-glow-border fade-in-active";
            center.style.maxWidth = "1100px"; 
            center.style.width = "95vw";
            renderTrainerControlCenter();
        }
    } else {
        alert("ACCESS DENIED: Неверный ключ матрицы!");
    }
}
// Функция добавления нового упражнения в глобальный репозиторий через экран админки
function addCustomExerciseLocal() {
    let nameInput = document.getElementById('newExName');
    let catSelect = document.getElementById('newExCat');
    if (!nameInput || !nameInput.value.trim()) {
        alert("Введи название упражнения!");
        return;
    }
    let newId = "ex_custom_" + Date.now();
    globalExercisesRepository.push({
        id: newId,
        name: nameInput.value.trim(),
        category: catSelect.value,
        gym: document.getElementById('newExGym').checked,
        weights: document.getElementById('newExWeights').checked,
        spine: document.getElementById('newExSpine').checked
    });
    nameInput.value = "";
    saveExercisesRepositoryToFirebaseLocal();
    renderTrainerControlCenter();
}

// Удаление упражнения из глобальной базы
function deleteExerciseLocal(id) {
    if (confirm("Удалить это упражнение из глобальной базы навсегда?")) {
        globalExercisesRepository = globalExercisesRepository.filter(item => item.id !== id);
        saveExercisesRepositoryToFirebaseLocal();
        renderTrainerControlCenter();
    }
}

// Отрисовка ультимативного двухпанельного интерфейса Центра Управления
function renderTrainerControlCenter() {
    let center = document.getElementById('trainerControlCenter');
    if (!center) return;

    let html = '<h1 class="matrix-text-glow" style="color: var(--accent-color); font-size: 22px; text-align: center; margin-bottom: 25px; font-family: var(--font-header);">🏛️ ЦЕНТР УПРАВЛЕНИЯ СИСТЕМЫ АТАК v4.0</h1>' +
               '<div style="display: flex; gap: 30px; align-items: flex-start; flex-wrap: wrap;">' +
               
               // === ЛЕВАЯ ПАНЕЛЬ: УПРАВЛЕНИЕ БАЗАМИ И СИМУЛЯТОР МОДИФИКАЦИЙ ===
               '<div style="flex: 1; min-width: 450px; display: flex; flex-direction: column; gap: 20px;">' +
               
               // Блок 1: Глобальный репозиторий упражнений
               '<div class="final-premium-box neon-box-border" style="text-align: left; max-height: 400px; overflow-y: auto; padding-right: 10px;">' +
               '<span class="recommendation-title">📂 Вкладка 1: Глобальный репозиторий упражнений (' + globalExercisesRepository.length + ')</span>' +
               '<div style="display: flex; gap: 6px; margin-bottom: 15px; flex-wrap: wrap; border-bottom: 1px dashed var(--border-color); padding-bottom: 15px;">' +
               '<input type="text" id="newExName" class="pm-field" placeholder="Название движения" style="flex: 1; min-width: 150px; font-size: 13px; padding: 8px 12px;">' +
               '<select id="newExCat" class="pm-field" style="width: auto; font-size: 13px; padding: 8px 12px; background-color: #1a1d26;">' +
               '<option value="chest">Грудь</option><option value="back">Спина</option><option value="legs">Ноги</option><option value="arms_bic">Бицепс</option><option value="arms_tri">Трицепс</option><option value="delts">Дельты</option><option value="calves">Икры</option><option value="forearms">Предплечья</option><option value="traps">Трапеции</option>' +
               '</select>' +
               '<div style="display: flex; align-items: center; gap: 10px; font-size: 11px; color: var(--text-muted); margin: 5px 0; width: 100%;">' +
               '<label><input type="checkbox" id="newExGym" checked> Только зал</label>' +
               '<label><input type="checkbox" id="newExWeights" checked> Свободный вес</label>' +
               '<label><input type="checkbox" id="newExSpine" checked> Осевая нагрузка</label>' +
               '</div>' +
               '<button class="pay-btn" onclick="addCustomExerciseLocal()" style="padding: 10px 20px; font-size: 12px; width: 100%;">➕ ДОБАВИТЬ В БАЗУ</button>' +
               '</div>' +
               '<div style="display: flex; flex-direction: column; gap: 6px;">';
               
    globalExercisesRepository.forEach(ex => {
        let catLabels = { chest: "Грудь", back: "Спина", legs: "Ноги", arms_bic: "Бицепс", arms_tri: "Трицепс", delts: "Дельты", calves: "Икры", forearms: "Предплечья", traps: "Трапеции" };
        html += '<div style="display: flex; justify-content: space-between; align-items: center; background: #161922; padding: 8px 12px; border-radius: 6px; border: 1px solid var(--border-color); font-size: 13px;">' +
                '<div><b>' + ex.name + '</b> <span style="font-size: 10px; color: var(--accent-color); background: var(--accent-muted); padding: 2px 6px; border-radius: 4px; margin-left: 6px;">' + (catLabels[ex.category] || ex.category) + '</span>' +
                '<br><span style="font-size: 10px; color: var(--text-muted);">' + (ex.gym ? 'Зал' : 'Дом') + ' | ' + (ex.weights ? 'Веса' : 'Свой вес') + ' | ' + (ex.spine ? 'Осевая ⚠️' : 'Спина безопасна ✅') + '</span></div>' +
                '<button onclick="deleteExerciseLocal(\'' + ex.id + '\')" style="background: transparent; border: none; color: #ff0055; cursor: pointer; font-size: 16px;">❌</button>' +
                '</div>';
    });
    html += '</div></div>' +

               // Блок 2: Коэффициенты и Настройки ползунков
               '<div class="final-premium-box neon-box-border" style="text-align: left;">' +
               '<span class="recommendation-title">🎛️ Вкладка 2: Системные ползунки и коэффициенты</span>' +
               '<div class="pm-input-group"><label>Разгрузка новичков в базе (в % снижения веса от ПМ):</label><input type="number" id="admNoviceBase" class="pm-field" style="padding: 8px 12px;" value="' + globalTrainerConfig.modifierNoviceBase + '"></div>' +
               '<div class="pm-input-group"><label>Разгрузка перетрена ЦНС при плато (в % урезания веса):</label><input type="number" id="admDeload" class="pm-field" style="padding: 8px 12px;" value="' + globalTrainerConfig.modifierPlateauDeload + '"></div>' +
               '<div class="pm-input-group"><label>Ограничитель трицепса (минимальное число повторов):</label><input type="number" id="admTriReps" class="pm-field" style="padding: 8px 12px;" value="' + globalTrainerConfig.tricepsMinReps + '"></div>' +
               '<div style="display: flex; flex-direction: column; gap: 8px; margin-top: 12px; font-size: 13px;">' +
               '<label><input type="checkbox" id="admCutReduction" ' + (globalTrainerConfig.cutIsoSetsReduction ? 'checked' : '') + '> Минус 1 подход в подсобке на сушке</label>' +
               '<label><input type="checkbox" id="admNoviceReduction" ' + (globalTrainerConfig.noviceIsoSetsReduction ? 'checked' : '') + '> Минус 1 подход в подсобке у новичков</label>' +
               '</div>' +
               '</div>' +

               // Блок 3: Тест-Драйв Модификаций (Конструктор уникального ID ключа программы)
               '<div class="final-premium-box neon-box-border" style="text-align: left;">' +
               '<span class="recommendation-title">🔬 Вкладка 3: Симулятор-тест модификаций квиза</span>' +
               '<span class="result-tag" style="margin-bottom: 12px;">Выбери параметры для симуляции таблицы программы:</span>' +
               '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 13px;">' +
               '<div><label>Цель:</label><select id="simGoal" class="pm-field" style="padding: 6px 10px; background:#181b24;"><option value="масса">Масса</option><option value="сила">Сила</option><option value="сушка">Сушка</option></select></div>' +
               '<div><label>Стаж:</label><select id="simExp" class="pm-field" style="padding: 6px 10px; background:#181b24;"><option value="новичок">Новичок</option><option value="средний">Опытный</option><option value="продвинутый">Профи</option></select></div>' +
               '<div><label>Дни тренинга:</label><select id="simDays" class="pm-field" style="padding: 6px 10px; background:#181b24;"><option value="3">3 дня</option><option value="4">4 дня</option><option value="2">2 дня</option><option value="1">1 день</option></select></div>' +
               '<div><label>Время сессии:</label><select id="simTime" class="pm-field" style="padding: 6px 10px; background:#181b24;"><option value="normal">90 минут</option><option value="long">120+ минут</option><option value="short">45 минут</option></select></div>' +
               '<div><label>Позвоночник:</label><select id="simSpine" class="pm-field" style="padding: 6px 10px; background:#181b24;"><option value="yes">Здоров (Осевая)</option><option value="no">Грыжи (Без осевой)</option></select></div>' +
               '<div><label>Тренинг ног:</label><select id="simLegs" class="pm-field" style="padding: 6px 10px; background:#181b24;"><option value="yes">Да (С ногами)</option><option value="no">Нет (Отказ от ног)</option></select></div>' +
               '<div><label>Узкая Специализация:</label><select id="simSpec" class="pm-field" style="padding: 6px 10px; background:#181b24;"><option value="skip">Баланс (Нет специализации)</option><option value="arms">Руки (Бицепс+Трицепс)</option><option value="chest">Грудь (Жим)</option><option value="back">Спина (Подтягивания)</option></select></div>' +
               '<div><label>⚡ Состояние ПЛАТО (ЦНС):</label><select id="simPlateau" class="pm-field" style="padding: 6px 10px; background:#181b24;"><option value="progress">Стабильный прогресс</option><option value="plateau_over">Перетренированность (-50% вес)</option><option value="plateau_under">Недотренированность (RIR 0 Отказ)</option></select></div>' +
               '</div>' +
               '<button class="pay-btn" onclick="runTrainerSimulationLocal()" style="margin-top: 15px; background: linear-gradient(135deg, #00bfff, #00ff88);">🔬 СИМУЛИРОВАТЬ И ОТКРЫТЬ ПРОГРАММУ</button>' +
               '</div></div>';
               // === ПРАВАЯ ПАНЕЛЬ: ЖИВАЯ ТАБЛИЦА-РЕДАКТОР WYSIWYG И ЛОГ ПРОГРАММ ===
               html += '<div style="flex: 1.5; min-width: 500px; display: flex; flex-direction: column; gap: 20px;" id="adminRightPanel">' +
                       
                       // Блок 1: Лог статуса готовности программ
                       '<div class="final-premium-box neon-box-border" style="text-align: left; padding: 15px;">' +
                       '<span class="recommendation-title">📊 Вкладка 4: Лог учета статуса готовности программ тренера</span>' +
                       '<div style="font-size: 11px; max-height: 80px; overflow-y: auto; display: flex; flex-wrap: wrap; gap: 6px;" id="adminProgramsLogBlock"></div>' +
                       '</div>' +

                       // Блок 2: Контейнер для живой таблицы-редактора
                       '<div class="final-premium-box neon-box-border" style="text-align: left; display: none;" id="simulationResultBlock">' +
                       '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">' +
                       '<span class="recommendation-title" style="margin-bottom:0;">✍️ Вкладка 5: Живой WYSIWYG-редактор тренировки</span>' +
                       '<div style="display: flex; gap: 10px;">' +
                       '<button class="pay-btn" onclick="rerollSimulationRundomLocal()" style="background:#00bfff; padding:6px 12px; font-size:11px; width:auto;">🎲 ПЕРЕБРОСИТЬ КУБИК</button>' +
                       '<button class="pay-btn" onclick="saveActiveProgramToCloudLocal()" style="background:var(--accent-color); color:#000; padding:6px 12px; font-size:11px; width:auto;">💾 ЗАПИСАТЬ В ОБЛАКО</button>' +
                       '</div>' +
                       '</div>' +
                       '<div id="adminInteractiveTableBox" class="neon-table-glow"></div>' +
                       '</div>' +

                       // Заглушка, если симуляция еще не запущена
                       '<div class="final-premium-box neon-box-border" style="text-align: center; padding: 50px 20px; color: var(--text-muted);" id="simulationPlaceholderBlock">' +
                       '🛸 Настрой модификации слева и нажми кнопку симуляции, чтобы открыть живую интерактивную таблицу.' +
                       '</div>' +

                       '</div>' + // Конец Правой панели
                       '</div>';  // Конец флекс-лайаута

    center.innerHTML = html;
    updateAdminProgramsLogUI(); // Отрисовываем индикаторы статусов
}

// Обновление логов-индикаторов готовности программ
function updateAdminProgramsLogUI() {
    let container = document.getElementById('adminProgramsLogBlock');
    if (!container) return;
    
    let keys = Object.keys(globalAuthorProgramsLogs);
    if (keys.length === 0) {
        container.innerHTML = '<span style="color: var(--text-muted);">Все программы пока работают на стандартных кубиках рандома. Авторских фиксаций нет.</span>';
        return;
    }
    
    let html = "";
    keys.forEach(k => {
        html += '<span style="background: rgba(0,255,163,0.1); border: 1px solid var(--accent-color); color: var(--accent-color); padding: 2px 6px; border-radius: 4px; font-size: 10px;">' + k + ' [ЗАПЕРТО В ОБЛАКЕ]</span>';
    });
    container.innerHTML = html;
}

// Запуск симулятора модификаций и сборка ID-ключа
function runTrainerSimulationLocal() {
    let goal = document.getElementById('simGoal').value;
    let exp = document.getElementById('simExp').value;
    let days = document.getElementById('simDays').value;
    let time = document.getElementById('simTime').value;
    let spine = document.getElementById('simSpine').value;
    let legs = document.getElementById('simLegs').value;
    let spec = document.getElementById('simSpec').value;
    let plateau = document.getElementById('simPlateau').value;

    currentSimulatedKey = goal + "_" + exp + "_" + days + "d_legs" + legs + "_spine" + spine + "_spec" + spec;
    
    document.getElementById('simulationPlaceholderBlock').style.display = 'none';
    document.getElementById('simulationResultBlock').style.display = 'block';

    if (globalAuthorProgramsLogs[currentSimulatedKey]) {
        currentSimulatedData = globalAuthorProgramsLogs[currentSimulatedKey];
        console.log("Загружена готовая авторская программа из облака!");
        renderInteractiveTableUI();
    } else {
        generateFreshRandomSimulationData(goal, exp, days, time, spine, legs, spec, plateau);
    }
}

function rerollSimulationRundomLocal() {
    let goal = document.getElementById('simGoal').value;
    let exp = document.getElementById('simExp').value;
    let days = document.getElementById('simDays').value;
    let time = document.getElementById('simTime').value;
    let spine = document.getElementById('simSpine').value;
    let legs = document.getElementById('simLegs').value;
    let spec = document.getElementById('simSpec').value;
    let plateau = document.getElementById('simPlateau').value;

    generateFreshRandomSimulationData(goal, exp, days, time, spine, legs, spec, plateau);
}
// Умный Pipeline-мост: генерация на основе сквозного прогона через файлы-модификаторы сайта
function generateFreshRandomSimulationData(goal, exp, days, time, spine, legs, spec, plateau) {
    userContext.goal = goal;
    userContext.experience = exp;
    userContext.days = days;
    userContext.time = time;
    userContext.spine = spine;
    userContext.legs_allowed = legs;
    userContext.spec = spec;
    userContext.plateau = plateau;
    userContext.location = "gym"; 
    userContext.biceps_type = "supination";

    let mockWeights = {
        j_100: 100, j_90: 90, j_85: 85, j_80: 80, j_75: 75, j_70: 70, j_50: 50,
        p_100: 120, p_90: 108, p_85: 102, p_80: 96, p_75: 90, p_70: 84
    };

    let programStructure = generateBaseTemplateSkeletonLocal(days, legs);
    
    if (typeof applyModifierGoalLocal === "function") programStructure = applyModifierGoalLocal(programStructure, mockWeights);
    if (typeof applyModifierInventoryLocal === "function") programStructure = applyModifierInventoryLocal(programStructure);
    if (typeof applyModifierExperienceLocal === "function") programStructure = applyModifierExperienceLocal(programStructure);
    if (typeof applyModifierSpineLocal === "function") programStructure = applyModifierSpineLocal(programStructure);
    if (typeof applyModifierLegsLocal === "function") programStructure = applyModifierLegsLocal(programStructure);
    if (typeof applyModifierPlateauLocal === "function") programStructure = applyModifierPlateauLocal(programStructure, mockWeights);
    if (typeof applyModifierDurationLocal === "function") programStructure = applyModifierDurationLocal(programStructure);
    if (typeof applyModifierSpecializationLocal === "function") programStructure = applyModifierSpecializationLocal(programStructure, mockWeights);

    currentSimulatedData = { days: [] };
    
    programStructure.days.forEach(day => {
        let dayNode = { title: day.title, exercises: [] };
        day.exercises.forEach(ex => {
            let setsArray = ex.sets.toString().split(/<br\s*\/?>|\n/gi);
            let repsArray = ex.reps.toString().split(/<br\s*\/?>/gi);
            let weightArray = ex.weight ? ex.weight.toString().split(/<br\s*\/?>/gi) : [];
            let rirArray = ex.rir ? ex.rir.toString().split(/<br\s*\/?>/gi) : [];

            let actualSetsCount = Math.max(setsArray.length, repsArray.length, weightArray.length, rirArray.length);
            if (actualSetsCount === 1 && !isNaN(parseInt(ex.sets))) actualSetsCount = parseInt(ex.sets);

            // Превращаем каждый подход в независимый элемент массива для админ-панели (Построчно)
            for (let s = 0; s < actualSetsCount; s++) {
                let currentRep = repsArray[s] || repsArray || "8";
                let currentWeight = weightArray[s] || weightArray || ex.weight || "Подобрать";
                let currentRir = rirArray[s] || rirArray || ex.rir || "RIR 2";

                let finalWeightDisplay = currentWeight;
                if (!finalWeightDisplay.includes("RIR") && !finalWeightDisplay.includes("Отказ")) {
                    finalWeightDisplay += " (" + currentRir.replace(/<[^>]*>/g, '') + ")";
                }

                dayNode.exercises.push({
                    id: "ex_cloud_" + Math.random().toString(36).substr(2, 9),
                    name: ex.name,
                    setIndex: (s + 1),
                    weight: finalWeightDisplay,
                    reps: currentRep,
                    isFirstInGroup: (s === 0),
                    groupSize: actualSetsCount
                });
            }
        });
        currentSimulatedData.days.push(dayNode);
    });

    renderInteractiveTableUI();
}

// Отрисовка живой интерактивной таблицы WYSIWYG без колонки RIR (Все подходы построчно)
function renderInteractiveTableUI() {
    let box = document.getElementById('adminInteractiveTableBox');
    if (!box || !currentSimulatedData) return;

    let html = '<span style="font-size:11px; color:var(--accent-color); font-family:var(--font-header); margin-bottom:10px; display:block;">ID-КЛЮЧ ОБЛАКА: ' + currentSimulatedKey + '</span>';

    currentSimulatedData.days.forEach((day, dayIdx) => {
        let rowsHtml = '<table class="program-table" style="width:100%; border-collapse:collapse; margin-bottom:15px;">' +
                       '<thead><tr class="table-day-row"><td colspan="4" class="table-day-title">' + day.title + '</td></tr>' +
                       '<tr><th style="width:40%;">Упражнение</th><th style="width:15%;">Подход</th><th style="width:30%;">Вес (Интенсивность)</th><th style="width:15%;">Повторы</th></tr></thead><tbody>';
        
        day.exercises.forEach((ex, exIdx) => {
            let cleanName = ex.name.replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDC00-\uDFFF]/g, "").trim();
            
            let selectHtml = '<select class="pm-field" style="padding:4px; font-size:12px; background:#111318; border-color:var(--border-color); width: 100%;" onchange="updateSimCellLocal(' + dayIdx + ',' + exIdx + ',\'name\', this.value)">';
            let matchedAny = false;
            
            globalExercisesRepository.forEach(repoEx => {
                let selected = (cleanName.includes(repoEx.name) || repoEx.name.includes(cleanName)) ? "selected" : "";
                if (selected) matchedAny = true;
                selectHtml += '<option value="' + repoEx.name + '" ' + selected + '>' + repoEx.name + '</option>';
            });
            if (!matchedAny) {
                selectHtml += '<option value="' + cleanName + '" selected>' + cleanName + '</option>';
            }
            selectHtml += '</select>';

            let areaStyle = 'style="width:100%; background:#111318; border:1px solid var(--border-color); color:#fff; font-size:12px; text-align:center; resize:none; font-family:var(--font-main); padding:4px;" rows="1"';

            let nameCell = "";
            if (ex.isFirstInGroup) {
                nameCell = '<td rowspan="' + ex.groupSize + '" style="vertical-align:middle; background:#0e1117; padding:8px; border-right:1px solid rgba(255,255,255,0.08); border-bottom:1px solid rgba(255,255,255,0.08);">' + selectHtml + '</td>';
            }

            rowsHtml += '<tr>' +
                        nameCell +
                        '<td style="color:var(--accent-color); font-weight:600; vertical-align:middle; border-right:1px solid rgba(255,255,255,0.05); border-bottom:1px solid rgba(255,255,255,0.05);">СЕТ ' + ex.setIndex + '</td>' +
                        '<td style="vertical-align:middle; border-right:1px solid rgba(255,255,255,0.05); border-bottom:1px solid rgba(255,255,255,0.05);"><textarea ' + areaStyle + ' onchange="updateSimCellLocal(' + dayIdx + ',' + exIdx + ',\'weight\', this.value)">' + ex.weight + '</textarea></td>' +
                        '<td style="vertical-align:middle; border-bottom:1px solid rgba(255,255,255,0.05);"><textarea ' + areaStyle + ' onchange="updateSimCellLocal(' + dayIdx + ',' + exIdx + ',\'reps\', this.value)">' + ex.reps + '</textarea></td>' +
                        '</tr>';
        });

        rowsHtml += '</tbody></table>';
        html += rowsHtml;
    });

    box.innerHTML = html;
}

// Запись изменений построчно из текстовых полей админки в буфер памяти
function updateSimCellLocal(dayIdx, exIdx, field, value) {
    if (field === 'name') {
        let currentGroupExName = currentSimulatedData.days[dayIdx].exercises[exIdx].name;
        currentSimulatedData.days[dayIdx].exercises.forEach(ex => {
            if (ex.name === currentGroupExName) ex.name = value;
        });
    } else {
        currentSimulatedData.days[dayIdx].exercises[exIdx][field] = value;
    }
}

// Намертво отправляем готовую построчную авторскую программу в облако Firebase Realtime Database
function saveActiveProgramToCloudLocal() {
    if (!currentSimulatedKey || !currentSimulatedData) return;
    
    // Перед упаковкой в Firebase, сжимаем построчные сеты обратно в волновые массивы для идеальной совместимости с сайтом!
    let compactedCloudData = { days: [] };
    
    currentSimulatedData.days.forEach(day => {
        let compactedDayNode = { title: day.title, exercises: [] };
        let trackedGroupNames = [];

        day.exercises.forEach(ex => {
            if (!trackedGroupNames.includes(ex.name)) {
                trackedGroupNames.push(ex.name);
                
                let allGroupSets = day.exercises.filter(e => e.name === ex.name);
                let weightsList = allGroupSets.map(e => e.weight).join("<br>");
                let repsList = allGroupSets.map(e => e.reps).join("<br>");
                
                compactedDayNode.exercises.push({
                    name: ex.name,
                    sets: allGroupSets.length.toString(),
                    weight: weightsList,
                    reps: repsList,
                    rir: "RIR 2" 
                });
            }
        });
        compactedCloudData.days.push(compactedDayNode);
    });

    globalAuthorProgramsLogs[currentSimulatedKey] = compactedCloudData;
    
    fetch(FIREBASE_DB_URL + "author_programs.json", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(globalAuthorProgramsLogs)
    })
    .then(res => {
        alert("🔥 ПРОГРАММА УСПЕШНО ЗАПЕРТА В ОБЛАКЕ! Авторская построчная версия " + currentSimulatedKey + " теперь транслируется абсолютно на все компьютеры пользователей в мире!");
        updateAdminProgramsLogUI();
    })
    .catch(err => alert("Ошибка сохранения правок в Firebase Database!"));
}
