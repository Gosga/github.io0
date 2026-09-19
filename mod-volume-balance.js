// ================================================================= 
// [НОВЫЙ МОДУЛЬ v5.0 — БАЛАНСИРОВЩИК ОБЪЁМА ПОДСОБКИ]
// Встаёт ПОСЛЕДНИМ в конвейере перед рендером.
// Отвечает за три задачи:
//   1. Контроль недельного объёма по мышечным группам (диапазон по стажу)
//   2. Компенсация выпавшего объёма ног (замена на дефицитную группу)
//   3. Коррекция эффективного объёма для коротких тренировок (×0.7 если все дни short)
// =================================================================

// Целевые диапазоны подходов в неделю на мышечную группу (подсобка)
const VOLUME_TARGETS = {
    "новичок":      { min: 6,  max: 10 },
    "средний":      { min: 10, max: 14 },
    "продвинутый":  { min: 12, max: 18 }
};

// Весовые коэффициенты типов подходов (для подсчёта эффективного объёма)
const SET_WEIGHT = {
    myo:    1.3,
    drop:   1.5,
    super:  1.2,
    normal: 1.0
};

// Маппинг слота → мышечная группа
function slotToMuscleGroup(slot) {
    if (slot.includes("chest"))  return "chest";
    if (slot.includes("back"))   return "back";
    if (slot.includes("legs"))   return "legs";
    if (slot.includes("bic"))    return "biceps";
    if (slot.includes("tri"))    return "triceps";
    if (slot.includes("delt"))   return "delts";
    if (slot.includes("calves")) return "calves";
    if (slot.includes("traps"))  return "traps";
    return null;
}

// Считает эффективное число подходов одного упражнения с учётом типа (мио/дроп/супер)
function countEffectiveSets(ex) {
    let rawCount = 1;
    if (!isNaN(parseInt(ex.sets))) {
        rawCount = parseInt(ex.sets);
    } else if (typeof ex.sets === "string" && ex.sets.includes("<br>")) {
        rawCount = ex.sets.split("<br>").length;
    }

    // Определяем тип подхода по note/sets строке
    let note = (ex.note || "").toLowerCase();
    let weight = SET_WEIGHT.normal;
    if (note.includes("мио") || note.includes("myo"))       weight = SET_WEIGHT.myo;
    else if (note.includes("дроп") || note.includes("drop")) weight = SET_WEIGHT.drop;
    else if (note.includes("супер") || note.includes("super")) weight = SET_WEIGHT.super;

    return rawCount * weight;
}

function applyModifierVolumeBalanceLocal(structure) {
    let experience = userContext.experience || "средний";
    let target = VOLUME_TARGETS[experience] || VOLUME_TARGETS["средний"];

    // Коэффициент длительности: если ВСЕ дни short → ×0.7
    let allShort = structure.days.every(day => userContext.time === "short");
    let durationCoeff = allShort ? 0.7 : 1.0;

    let adjustedMin = Math.round(target.min * durationCoeff);
    let adjustedMax = Math.round(target.max * durationCoeff);

    // =============================================================
    // ШАГ 1: Считаем текущий недельный объём по каждой группе
    // =============================================================
    let weeklyVolume = {}; // { muscleGroup: эффективные подходы }

    structure.days.forEach(day => {
        day.exercises.forEach(ex => {
            let group = slotToMuscleGroup(ex.slot);
            if (!group) return;
            if (!weeklyVolume[group]) weeklyVolume[group] = 0;
            weeklyVolume[group] += countEffectiveSets(ex);
        });
    });

    // =============================================================
    // ШАГ 2: Компенсация выпавшего объёма ног
    // Смотрим, у какой группы наибольший относительный дефицит,
    // и добавляем туда подсобный слот в день с наименьшей нагрузкой
    // =============================================================
    let totalRemovedLegsSets = 0;
    structure.days.forEach(day => {
        if (day._removedLegsSets) totalRemovedLegsSets += day._removedLegsSets;
    });

    if (totalRemovedLegsSets > 0) {
        // Считаем относительный дефицит (% от минимума) для каждой группы подсобки
        let accessoryGroups = ["biceps", "triceps", "delts", "calves", "traps"];
        let deficits = accessoryGroups.map(g => {
            let current = weeklyVolume[g] || 0;
            let deficit  = Math.max(0, adjustedMin - current);
            let relDeficit = adjustedMin > 0 ? deficit / adjustedMin : 0;
            return { group: g, deficit, relDeficit };
        });

        // Сортируем по относительному дефициту — самый голодный первый
        deficits.sort((a, b) => b.relDeficit - a.relDeficit);
        let targetGroup = deficits[0].group;

        // Находим слот для целевой группы
        let slotForGroup = {
            biceps:  "iso_bic",
            triceps: "iso_tri",
            delts:   "iso_delt",
            calves:  "calves",
            traps:   "traps"
        }[targetGroup] || "iso_delt";

        // Добавляем компенсирующий слот в день с наименьшим числом упражнений
        let lightestDay = structure.days.reduce((min, day) =>
            day.exercises.length < min.exercises.length ? day : min
        , structure.days[0]);

        lightestDay.exercises.push({
            slot:   slotForGroup,
            icon:   "🔄",
            name:   "Компенсирующая подсобка (замена ног)",
            sets:   "3",
            weight: "",
            reps:   "12",
            rir:    "RIR 2",
            note:   `Объём перенесён с ног → ${targetGroup} (наибольший дефицит недели)`
        });

        // Обновляем недельный объём
        if (!weeklyVolume[targetGroup]) weeklyVolume[targetGroup] = 0;
        weeklyVolume[targetGroup] += 3;

        console.log(`🔄 [БАЛАНС ОБЪЁМА]: Компенсация ног (${totalRemovedLegsSets} сет.) → ${targetGroup} (${slotForGroup})`);
    }

    // =============================================================
    // ШАГ 3: Общий баланс подсобки — добираем дефицит / срезаем излишки
    // Работаем только с подсобными группами (не с базой)
    // =============================================================
    let accessoryGroupsFull = ["biceps", "triceps", "delts", "calves", "traps"];

    accessoryGroupsFull.forEach(group => {
        let current = weeklyVolume[group] || 0;

        // ДЕФИЦИТ: добираем подходы к существующим слотам этой группы
        if (current < adjustedMin) {
            let deficit = adjustedMin - current;
            let added   = 0;

            // Проходим по всем упражнениям всех дней, ищем слоты этой группы
            outerLoop:
            for (let day of structure.days) {
                for (let ex of day.exercises) {
                    if (slotToMuscleGroup(ex.slot) !== group) continue;
                    if (added >= deficit) break outerLoop;

                    // Добавляем 1 подход к этому упражнению (не больше 5 подходов суммарно)
                    let currentSets = parseInt(ex.sets);
                    if (!isNaN(currentSets) && currentSets < 5) {
                        ex.sets = (currentSets + 1).toString();
                        ex.note += " (+1 сет баланса объёма)";
                        added++;
                        weeklyVolume[group]++;
                    }
                }
            }
        }

        // ИЗЛИШЕК: срезаем лишние подходы с последних слотов группы
        if (current > adjustedMax) {
            let excess = current - adjustedMax;
            let removed = 0;

            // Проходим в обратном порядке — срезаем с конца
            outerLoop:
            for (let dayIdx = structure.days.length - 1; dayIdx >= 0; dayIdx--) {
                let day = structure.days[dayIdx];
                for (let exIdx = day.exercises.length - 1; exIdx >= 0; exIdx--) {
                    let ex = day.exercises[exIdx];
                    if (slotToMuscleGroup(ex.slot) !== group) continue;
                    if (removed >= excess) break outerLoop;

                    let currentSets = parseInt(ex.sets);
                    if (!isNaN(currentSets) && currentSets > 2) {
                        ex.sets = (currentSets - 1).toString();
                        ex.note += " (−1 сет: лимит объёма)";
                        removed++;
                        weeklyVolume[group]--;
                    }
                }
            }
        }
    });

    // Чистим служебные метки
    structure.days.forEach(day => {
        delete day._removedLegsSets;
    });

    console.log("✅ [БАЛАНС ОБЪЁМА v5.0]: Недельный объём по группам выровнен. Диапазон:", adjustedMin, "—", adjustedMax, "подходов.");
    return structure;
}
