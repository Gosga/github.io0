// ================================================================= 
// [ГЛАВНЫЙ ДИСПЕТЧЕР КОНВЕЙЕРА v4.3 — ЧИСТАЯ 4-КОЛОНОЧНАЯ ТАБЛИЦА]
// =================================================================

// Чистая 4-колоночная неоновая разметка по твоему закону!
function createTableBlock(dayTitle, rowsHtml) {
    return '<div class="program-table-wrapper"><table class="program-table"><thead><tr class="table-day-row"><td colspan="4" class="table-day-title">' + dayTitle + '</td></tr><tr><th class="align-left" style="width: 45%;">Упражнение</th><th style="width: 15%;">Подход</th><th style="width: 25%;">Вес / Интенсивность</th><th style="width: 15%;">Повторы</th></tr></thead><tbody>' + rowsHtml + '</tbody></table></div>';
}

function runCorePipelineLocal(w) {
    console.log("🚀 Начало сборки тренировочного плана...");
    
    // Шаг 1: Создаем чистую сетку дней с пошаговой подневной плотностью
    let programStructure = generateBaseTemplateSkeletonLocal(userContext.days, userContext.legs_allowed);
    
    // Шаг 2: Прогоняем её поочередно через все независимые файлы-модификаторы
    if (typeof applyModifierGoalLocal === "function") programStructure = applyModifierGoalLocal(programStructure, w);
    if (typeof applyModifierInventoryLocal === "function") programStructure = applyModifierInventoryLocal(programStructure);
    if (typeof applyModifierExperienceLocal === "function") programStructure = applyModifierExperienceLocal(programStructure);
    if (typeof applyModifierSpineLocal === "function") programStructure = applyModifierSpineLocal(programStructure);
    if (typeof applyModifierLegsLocal === "function") programStructure = applyModifierLegsLocal(programStructure);
    if (typeof applyModifierPlateauLocal === "function") programStructure = applyModifierPlateauLocal(programStructure, w);
    if (typeof applyModifierDurationLocal === "function") programStructure = applyModifierDurationLocal(programStructure);
    if (typeof applyModifierSpecializationLocal === "function") programStructure = applyModifierSpecializationLocal(programStructure, w);
	if (typeof applyModifierVolumeBalanceLocal === "function") programStructure = applyModifierVolumeBalanceLocal(programStructure);

    // Скрытый алгоритм перемешивания подсобных слоев (50% шанс структуры)
    programStructure.days.forEach(day => {
        if (day.exercises.length > 2 && Math.random() <= 0.5) {
            let firstBaseEx = day.exercises[0];
            let secondaryPool = day.exercises.slice(1);
            
            for (let i = secondaryPool.length - 1; i > 0; i--) {
                let j = Math.floor(Math.random() * (i + 1));
                let temp = secondaryPool[i];
                secondaryPool[i] = secondaryPool[j];
                secondaryPool[j] = temp;
            }
            day.exercises = [firstBaseEx].concat(secondaryPool);
        }
    });

    // Шаг 3: Переводим готовую структуру в HTML-код премиальных построчных таблиц
    renderPipelineOutputToUILocal(programStructure);
}

function renderPipelineOutputToUILocal(programStructure) {
    let tableContent = "";
    
    programStructure.days.forEach(day => {
        let rowsHtml = "";
        
        day.exercises.forEach(ex => {
            if (!ex) return;
            
            let cleanNote = ex.note ? ex.note.toString().replace(/💥|⚙️|🪵|🪙|🛍️|\(Кубик рандома.*?\)/g, "").trim() : "";
            
            let setsArray = ex.sets.toString().split(/<br\s*\/?>|\n/gi);
            let repsArray = ex.reps.toString().split(/<br\s*\/?>/gi);
            let weightArray = ex.weight ? ex.weight.toString().split(/<br\s*\/?>/gi) : [];
            let rirArray = ex.rir ? ex.rir.toString().split(/<br\s*\/?>/gi) : [];

            let actualSetsCount = Math.max(setsArray.length, repsArray.length, weightArray.length, rirArray.length);
            if (actualSetsCount === 1 && !isNaN(parseInt(ex.sets))) {
                actualSetsCount = parseInt(ex.sets);
            }

            // Построчный рендеринг в аккуратные 4 колонки
            for (let s = 0; s < actualSetsCount; s++) {
                let currentRep = repsArray[s] || repsArray[0] || "8";
                let currentWeight = weightArray[s] || weightArray[0] || ex.weight || "";
                let currentRir = rirArray[s] || rirArray[0] || ex.rir || "RIR 2";

                // По умолчанию пишем чистый RIR, а при расчете — вес с RIR в скобках
                let finalWeightDisplay = currentWeight;
                if (!finalWeightDisplay) {
                    finalWeightDisplay = currentRir; 
                }

                let exerciseTitleCell = "";
                if (s === 0) {
                    exerciseTitleCell = '<td class="align-left" rowspan="' + actualSetsCount + '" style="vertical-align: middle; background: #0e1117; border-bottom: 1px solid rgba(255,255,255,0.08);">' + ex.icon + ' <b>' + ex.name + '</b>' + (cleanNote ? '<br><span style="font-size:10px; color:var(--text-muted); font-weight:400;">' + cleanNote + '</span>' : '') + '</td>';
                }

                rowsHtml += '<tr>' +
                            exerciseTitleCell +
                            '<td style="color: var(--accent-color); font-weight:600; font-family:var(--font-header);">СЕТ ' + (s + 1) + '</td>' +
                            '<td style="font-weight: 600; color: #fff;">' + finalWeightDisplay + '</td>' +
                            '<td style="color: #fff; font-weight:700;">' + currentRep + '</td>' +
                            '</tr>';
            }
        });
        
        tableContent += createTableBlock(day.title, rowsHtml);
    });

    document.getElementById('resProgramTable').innerHTML = tableContent;
    
    // Вшивание индивидуальных тренировочных советов в подвал
    if (programStructure.disclaimerText && document.getElementById('resDisclaimerText')) {
        document.getElementById('resDisclaimerText').innerText = programStructure.disclaimerText;
    }
}
