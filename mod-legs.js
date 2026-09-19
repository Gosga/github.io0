// ================================================================= 
// [МОДУЛЬ КОНВЕЙЕРА №5 v5.0 — КОНТРОЛЬ НОГ: ТОЛЬКО ФИЛЬТРАЦИЯ]
// Компенсация объёма перенесена в mod-volume-balance.js
// =================================================================

function applyModifierLegsLocal(structure) {
    if (userContext.legs_allowed === "no") {
        console.log("❌ [КОНВЕЙЕР]: Активирован отказ от тренировки ног. Стираем нижнюю базу.");

        structure.days.forEach(day => {
            // Считаем, сколько подходов выпало (для передачи в mod-volume-balance)
            let removedSets = 0;
            day.exercises.forEach(ex => {
                if (ex.slot.includes("legs") || ex.slot.includes("calves")) {
                    let setsNum = 0;
                    if (!isNaN(parseInt(ex.sets))) {
                        setsNum = parseInt(ex.sets);
                    } else if (typeof ex.sets === "string" && ex.sets.includes("<br>")) {
                        setsNum = ex.sets.split("<br>").length;
                    } else {
                        setsNum = 3; // дефолт если не распарсилось
                    }
                    removedSets += setsNum;
                }
            });

            // Фильтруем: вырезаем ноги и икры
            day.exercises = day.exercises.filter(ex => {
                return !ex.slot.includes("legs") && !ex.slot.includes("calves");
            });

            // Сохраняем метку выпавшего объёма для mod-volume-balance
            if (!day._removedLegsSets) day._removedLegsSets = 0;
            day._removedLegsSets += removedSets;
        });
    }
    return structure;
}
console.log("✅ [МОД НОГ v5.0]: Только фильтрация. Компенсация объёма делегирована в mod-volume-balance.js.");
