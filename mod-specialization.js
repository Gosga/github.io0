// ================================================================= 
// [ГЛАВНЫЙ МОД СПЕЦИАЛИЗАЦИЙ v5.0: ПОСЛОЙНЫЙ ПИРОГ РУК — ФИКС ПОТЕРИ БАЗ]
// =================================================================

function applyModifierSpecializationLocal(structure, w) {

    // ВАРИАНТ А: УЗКАЯ ЦЕЛЕВАЯ СПЕЦИАЛИЗАЦИЯ НА РУКИ
    if (userContext.spec === "arms") {
        structure.days.forEach(day => {
            // ФИКС: find берёт только первую базу из трёх.
            // Собираем ВСЕ базы и ВСЕ bic/tri отдельными массивами,
            // а otherAccessory — всё остальное (дельты, икры, трапеции и т.д.)
            let allBases     = day.exercises.filter(ex => ex && ex.slot.includes("base"));
            let bicExArr     = day.exercises.filter(ex => ex && ex.slot.includes("bic"));
            let triExArr     = day.exercises.filter(ex => ex && ex.slot.includes("tri"));
            let otherAccessory = day.exercises.filter(ex =>
                ex &&
                !ex.slot.includes("bic") &&
                !ex.slot.includes("tri") &&
                !ex.slot.includes("base")
            );

            // Насыщаем схемы бицепса
            bicExArr.forEach(bicEx => {
                bicEx.icon  = "🪙";
                bicEx.sets  = "3<br>2";
                bicEx.weight = "75% ПМ бицепса<br>85% ПМ бицепса";
                bicEx.reps  = "10<br>6";
                bicEx.rir   = "RIR 2<br>RIR 0 (ОТКАЗ)";
                bicEx.note  = "Приоритет ЦНС: Волновой дожим бицепса от личного ПМ";

                if (userContext.spine === "no") {
                    bicEx.name = "Подъём гантелей/штанги на бицепс на скамье Скотта (Спина изолирована)";
                }
            });

            // Насыщаем схемы трицепса
            triExArr.forEach(triEx => {
                triEx.icon  = "⚙️";
                triEx.sets  = "2<br>2";
                triEx.weight = "70% ПМ жима<br>75% ПМ жима";
                triEx.reps  = "12<br>6";
                triEx.rir   = "RIR 2<br>RIR 1";
                triEx.note  = "Изолированный дожим длинной головки трицепса";
            });

            // Жёсткий послойный пирог: bic → все базы → tri → остальная подсобка
            let layered = [];
            bicExArr.forEach(b => layered.push(b));
            allBases.forEach(b => layered.push(b));
            triExArr.forEach(t => layered.push(t));
            otherAccessory.forEach(o => layered.push(o));

            day.exercises = layered;

            // Финальная добивка по Понедельникам или в День А
            if (day.title.includes("ПОНЕДЕЛЬНИК") || day.title.includes("ДЕНЬ А")) {
                let rirValue = (userContext.experience === "новичок") ? "RIR 1" : "RIR 0 (ОТКАЗ)";
                day.exercises.push({
                    slot:   "spec_arms_finish",
                    icon:   "🪙",
                    name:   "Концентрированный подъём на бицепс на скамье Скотта",
                    sets:   "2",
                    weight: "60% ПМ бицепса",
                    reps:   "12",
                    rir:    rirValue,
                    note:   "Добивочный изолирующий слой рук"
                });
            }
        });

        // Специализация "Руки" разводится от СРЕДЫ на два других дня
        // (в скелете среда уже получила iso_bic+iso_tri как обязательные —
        //  spec_arms_finish и повышенные схемы уходят на Пн и Пт)
        // Логика уже реализована выше: добивка только на ПОНЕДЕЛЬНИК / ДЕНЬ А,
        // а в другие дни руки идут через обычный слой с повышенными схемами.
    }

    // ВАРИАНТ Б: СПЕЦИАЛИЗАЦИЯ НА ГРУДНЫЕ МЫШЦЫ
    else if (userContext.spec === "chest") {
        structure.days.forEach(day => {
            let weeklySpecEx = day.exercises.find(ex => ex && ex.slot === "spec_extra_weekly");

            if (weeklySpecEx) {
                weeklySpecEx.icon   = "🏛️";
                weeklySpecEx.name   = "Жим гантелей на наклонной скамье 30 градусов (Шоковый вектор)";
                weeklySpecEx.sets   = "3";
                weeklySpecEx.weight = "78% ПМ";
                weeklySpecEx.reps   = "8";
                weeklySpecEx.rir    = "RIR 0 (ОТКАЗ)";
                weeklySpecEx.note   = "Выделенный высокоинтенсивный элемент специализации груди";
            }

            day.exercises.forEach(ex => {
                if (ex && ex.slot.includes("chest") && ex.slot !== "spec_extra_weekly") {
                    ex.icon = "🏛️";
                    ex.note = "Приоритетный жимовой вектор";
                }
            });
        });
    }

    // ВАРИАНТ В: СПЕЦИАЛИЗАЦИЯ НА СПИНУ
    else if (userContext.spec === "back") {
        structure.days.forEach(day => {
            let weeklySpecEx = day.exercises.find(ex => ex && ex.slot === "spec_extra_weekly");

            if (weeklySpecEx) {
                weeklySpecEx.icon   = "🧗‍♂️";
                weeklySpecEx.name   = "Тяга горизонтального блока к поясу сидя (Выжигающий вектор)";
                weeklySpecEx.sets   = "3";
                weeklySpecEx.weight = "75% ПМ";
                weeklySpecEx.reps   = "10";
                weeklySpecEx.rir    = "RIR 0 (ОТКАЗ)";
                weeklySpecEx.note   = "Выделенный высокоинтенсивный элемент специализации спины";
            }

            day.exercises.forEach(ex => {
                if (ex && ex.slot.includes("back") && ex.slot !== "spec_extra_weekly") {
                    ex.icon = "🧗‍♂️";
                    ex.note = "Приоритетный тяговый вектор";
                }
            });
        });
    }

    return structure;
}
console.log("📐 [КОНВЕЙЕР СПЕЦ-МОД v5.0]: Фикс потери баз при специализации рук — все базы сохранены через массив, не find.");
