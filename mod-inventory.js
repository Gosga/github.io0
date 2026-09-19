// ================================================================= 
// [ИСПРАВЛЕННЫЙ МОДУЛЬ КОНВЕЙЕРА №2 — ТОТАЛЬНЫЙ ПЕРЕХВАТ И ЗАМЕНА НА УПРАЖНЕНИЯ]
// =================================================================

function applyModifierInventoryLocal(structure) {
    console.log("📦 [КОНВЕЙЕР]: Запущен жесткий перехват и подстановка реальных названий упражнений...");

    structure.days.forEach(day => {
        day.exercises.forEach(ex => {
            let slotKey = ex.slot;
            
            // Намертво сопоставляем кодовые маркеры конвейера с функциями твоих трех баз данных
            if (slotKey === "base_chest" || slotKey === "base_chest_light") slotKey = "exJim";
            if (slotKey === "iso_back" || slotKey === "base_back" || slotKey === "base_back_pull") slotKey = "exRow";
            if (slotKey === "base_legs" || slotKey === "base_legs_light" || slotKey === "base_legs_dense" || slotKey === "base_legs_pyramid" || slotKey === "iso_legs" || slotKey === "iso_legs_alt") slotKey = "exPrised";
            if (slotKey === "iso_bic" || slotKey === "iso_bic_alt") slotKey = "exBic";
            if (slotKey === "iso_tri") slotKey = "exTri";
            if (slotKey === "iso_delt" || slotKey === "iso_delt_alt") slotKey = "exDelt";
            if (slotKey === "calves") slotKey = "exCalves";
            if (slotKey === "traps") slotKey = "exTraps";

            // Вытягиваем строку из нужного файла-справочника на основе выбора инвентаря
            let realName = "Упражнение";
            
            if (userContext.location === 'gym' && typeof getGymExercise === "function") {
                realName = getGymExercise(slotKey, userContext.spine);
            } else if (userContext.location === 'home_weights' && typeof getHomeWeightsExercise === "function") {
                realName = getHomeWeightsExercise(slotKey, userContext.spine);
            } else if (userContext.location === 'home_none' && typeof getHomeBodyweightExercise === "function") {
                realName = getHomeBodyweightExercise(slotKey, userContext.spine);
            } else {
                // Если локация еще не определена (например, при симуляции в админке) — берем зал по дефолту
                if (typeof getGymExercise === "function") realName = getGymExercise(slotKey, userContext.spine);
            }

            // Перезаписываем техническое имя слота на красивое, понятное спортивное упражнение!
            ex.name = realName;
        });
    });

    return structure;
}
console.log("✅ [МОДУЛЬ ИНВЕНТАРЯ]: Ошибка заглушек ликвидирована. Тотальный перехват названий запущен.");
