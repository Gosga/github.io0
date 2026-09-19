// ================================================================= 
// [МОДУЛЬ КОНВЕЙЕРА №3 v5.0 — МАСШТАБИРОВАНИЕ ПОДХОДОВ НА ОСНОВЕ СТАЖА]
// =================================================================

function applyModifierExperienceLocal(structure) {
    structure.days.forEach(day => {
        day.exercises.forEach(ex => {

            // КОРРЕКЦИЯ ДЛЯ НОВИЧКОВ (снижение объёма, защита ЦНС)
            if (userContext.experience === "новичок") {
                if (ex.slot.includes("base") && ex.sets === "4") ex.sets = "3";
                if (ex.slot.includes("iso")) {
                    if (Math.random() > 0.5) {
                        ex.sets = "2";
                        ex.note += " (Разгрузка объёма новичка)";
                    }
                }

                // ФИКС: replace без /g/ меняет только первое вхождение в строке.
                // Используем функцию-замену с глобальным regex, чтобы смягчить
                // ВСЕ RIR 0 → RIR 1 и RIR 1 → RIR 2 во многострочных схемах.
                // Важен порядок: сначала 0→1, потом 1→2 (иначе 0 станет 2 за два прохода).
                if (typeof ex.rir === "string") {
                    ex.rir = ex.rir.replace(/RIR 0/g, "RIR 1");
                    ex.rir = ex.rir.replace(/RIR 1/g, "RIR 2");
                }
            }

            // КОРРЕКЦИЯ ДЛЯ ПРОДВИНУТЫХ ПРОФИ (наброс нагрузки)
            else if (userContext.experience === "продвинутый") {
                if (ex.slot.includes("base") && ex.sets === "3") ex.sets = "4";
                if (ex.slot.includes("iso") && ex.sets === "3") {
                    ex.sets = "4";
                    ex.note += " (+1 Профессиональный сет)";
                }
            }
        });
    });

    return structure;
}
console.log("✅ [МОД СТАЖА v5.0]: Фикс replace без /g/ — RIR-смягчение теперь полное для всех многострочных схем новичка.");
