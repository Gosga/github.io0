// ================================================================= 
// [МОДУЛЬ КОНВЕЙЕРА №7 v5.0 — КОНТРОЛЬ МИНУТ: ТЕГИРОВАНИЕ ПО ПОДХОДАМ]
// =================================================================

function applyModifierDurationLocal(structure) {

    structure.days.forEach(day => {

        // -------------------------------------------------------
        // ВАРИАНТ А: КОРОТКАЯ ТРЕНИРОВКА (45 мин — силовой минимализм)
        // Переход на тегирование по ПОДХОДАМ, не по упражнению:
        //   70% подходов — мио-повторы
        //   15% подходов — дроп-сеты
        //   15% подходов — суперсеты
        //   10% подходов — обычная работа
        // Одно упражнение может сочетать разные типы подходов.
        // -------------------------------------------------------
        if (userContext.time === "short") {

            // Сначала собираем все подходы всех упражнений в плоский список
            // Каждый элемент: { exIndex, setIndex }
            let allSets = [];
            day.exercises.forEach((ex, exIdx) => {
                let setsCount = 1;
                if (ex.sets && !isNaN(parseInt(ex.sets))) {
                    setsCount = parseInt(ex.sets);
                } else if (typeof ex.sets === "string" && ex.sets.includes("<br>")) {
                    setsCount = ex.sets.split("<br>").length;
                }
                for (let s = 0; s < setsCount; s++) {
                    allSets.push({ exIdx, setIdx: s });
                }
            });

            let total = allSets.length;
            if (total === 0) return;

            // Перемешиваем порядок, чтобы типы не группировались по упражнениям
            allSets.sort(() => Math.random() - 0.5);

            // Распределяем типы по весам: 70 / 15 / 15 / 10
            // Но сначала гарантируем минимум 1 подход каждого типа если total >= 4
            let counts = { myo: 0, drop: 0, super: 0, normal: 0 };
            let weights = [
                { type: "myo",    w: 70 },
                { type: "drop",   w: 15 },
                { type: "super",  w: 15 },
                { type: "normal", w: 10 }
            ];

            // Назначаем тип каждому подходу по кумулятивному весу
            allSets.forEach((setRef, i) => {
                let roll = Math.random() * 100;
                let cumulative = 0;
                let chosenType = "myo";
                for (let wt of weights) {
                    cumulative += wt.w;
                    if (roll < cumulative) { chosenType = wt.type; break; }
                }
                setRef.type = chosenType;
                counts[chosenType]++;
            });

            // Группируем назначенные теги обратно по упражнениям
            // Для каждого упражнения строим массив типов подходов
            let exSetTypes = {};
            allSets.forEach(setRef => {
                if (!exSetTypes[setRef.exIdx]) exSetTypes[setRef.exIdx] = [];
                exSetTypes[setRef.exIdx][setRef.setIdx] = setRef.type;
            });

            // Применяем теги к упражнениям — переписываем sets/note/rir
            day.exercises.forEach((ex, exIdx) => {
                let types = exSetTypes[exIdx];
                if (!types || types.length === 0) return;

                let setLines   = [];
                let noteParts  = new Set();

                types.forEach((t, i) => {
                    let setNum = i + 1;
                    if (t === "myo") {
                        setLines.push(`Подход ${setNum}: Мио-повторы (15 + 5 + 5 с паузой)`);
                        noteParts.add("⚡ Мио-повторы: 15 основных, отдых 20с, добивка 5+5");
                    } else if (t === "drop") {
                        setLines.push(`Подход ${setNum}: Дроп-сет (-20% веса, без отдыха)`);
                        noteParts.add("📉 Дроп-сет: снять 20% веса сразу после отказа");
                    } else if (t === "super") {
                        setLines.push(`Подход ${setNum}: Суперсет (с антагонистом)`);
                        noteParts.add("🔁 Суперсет: с антагонистом без отдыха между");
                    } else {
                        setLines.push(`Подход ${setNum}: Обычная работа`);
                    }
                });

                ex.sets  = setLines.join("<br>");
                ex.rir   = "Отказ / около отказа в каждом интенсивном подходе";
                ex.note  = Array.from(noteParts).join(" | ") || ex.note;
            });

            // Добавляем общий дисклеймер к заголовку дня
            day.shortNote = `⚡ ЭКСПРЕСС-МИНИМАЛИЗМ 45 МИН: ${counts.myo} мио / ${counts.drop} дроп / ${counts.super} супер / ${counts.normal} обычных подходов`;
        }

        // -------------------------------------------------------
        // ВАРИАНТ Б: ДЛИТЕЛЬНЫЙ ТРЕНИНГ (120+ мин — бонус в конце)
        // -------------------------------------------------------
        else if (userContext.time === "long") {
            let usedNames = day.exercises.map(e => e.name);
            let bonusName = "Скручивания на пресс на наклонной скамье";

            if (usedNames.includes(bonusName)) {
                bonusName = "Сгибания кистей со штангой сидя (Прокачка хвата)";
            }

            day.exercises.push({
                slot:   "bonus_120",
                icon:   "💥",
                name:   bonusName,
                sets:   "4",
                weight: "Подобрать под RIR 2",
                reps:   "12-15",
                rir:    "RIR 2",
                note:   "🔥 БОНУС ВРЕМЕНИ 120+ МИНУТ"
            });
        }
    });

    return structure;
}
console.log("✅ [МОД ДЛИТЕЛЬНОСТИ v5.0]: Тегирование по подходам 70/15/15/10 — мио/дроп/супер/обычный. Одно упражнение может сочетать разные типы.");
