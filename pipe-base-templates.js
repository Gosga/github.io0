// ================================================================= 
// [МАШИНА СБОРКИ v5.0: ТРИАДА БАЗЫ ФУЛБОДИ, ОБЯЗАТЕЛЬНЫЕ РУКИ, МИНИМАЛИЗМ]
// =================================================================

function generateBaseTemplateSkeletonLocal(days, legsAllowed) {
    let structure = {
        programName: "СИСТЕМА АТАК v5.0",
        disclaimerText: "",
        days: []
    };

    let numDays = parseInt(days) || 3;

    // =============================================================
    // 1. БАЗОВОЕ КОЛИЧЕСТВО УПРАЖНЕНИЙ ПО СТАЖУ
    // =============================================================
    let minExCount = 6; // средний стаж
    if (userContext.experience === "новичок")    minExCount = 5;
    if (userContext.experience === "продвинутый") minExCount = 7;

    // Флаг короткой тренировки
    let isShortDay = (userContext.time === "short");

    // При коротком дне — жёсткий потолок 5 упражнений для всех стажей, кубик не бросается
    if (isShortDay) minExCount = 5;

    // =============================================================
    // 2. ПЕРЕАДРЕСАЦИЯ: 4 ДНЯ + НЕТ НОГ → 4-ДНЕВНЫЙ ФУЛБАДИ
    //    Решается здесь, ДО разветвления на тип сплита
    // =============================================================
    let effectiveNumDays = numDays;
    let forceFourDayFullbody = (numDays === 4 && legsAllowed === "no");

    // Определение названий тренировочных дней
    let dayTitles = [];
    if (effectiveNumDays === 3) dayTitles = ["ПОНЕДЕЛЬНИК", "СРЕДА", "ПЯТНИЦА"];
    else if (effectiveNumDays === 4) dayTitles = ["ПОНЕДЕЛЬНИК", "ВТОРНИК", "ЧЕТВЕРГ", "ПЯТНИЦА"];
    else if (effectiveNumDays === 2) dayTitles = ["ДЕНЬ А", "ДЕНЬ Б"];
    else dayTitles = ["ТРЕНИРОВОЧНАЯ СЕССИЯ"];

    // Список обязательного недельного охвата подсобных мышечных групп
    let requiredAccessoryPool = ["iso_bic", "iso_tri", "iso_delt", "calves", "traps"];
    if (legsAllowed === "yes") {
        requiredAccessoryPool.push("iso_legs");
        requiredAccessoryPool.push("iso_legs_alt");
    }

    // =============================================================
    // 3. ГЕНЕРАЦИЯ МИКРОЦИКЛА
    // =============================================================
    for (let d = 0; d < effectiveNumDays; d++) {
        let dayNode = {
            title: dayTitles[d] || ("ДЕНЬ " + (d + 1)),
            exercises: [],
            isHeavyDay: true // флаг тяжёлого/умеренного дня для mod-goal и RIR
        };

        // Бросок кубика плотности (не для short, не для однодневного, не при перетрене)
        let dayExCount = minExCount;
        if (!isShortDay && numDays !== 1 && userContext.plateau !== "plateau_over" && Math.random() <= 0.5) {
            dayExCount += 1;
        }

        // Однодневный фулл-отказной сплит — строго 8 упражнений
        if (numDays === 1) {
            dayExCount = 8;
        }

        // =============================================================
        // КРИТИЧЕСКИЙ ПЕРЕХВАТ ПЕРЕТРЕНИРОВАННОСТИ (ДЕЛОАД)
        // =============================================================
        if (userContext.plateau === "plateau_over") {
            if (numDays === 3) {
                let activeBase = (d === 0) ? "base_chest" : (d === 1 && legsAllowed === "yes") ? "base_legs" : "base_back";
                dayNode.exercises.push({ slot: activeBase, icon: "🏋️‍♂️", name: "Базовая разгрузка", sets: "2", weight: "", reps: "8", rir: "RIR 4", note: "" });
            } else {
                dayNode.exercises.push({ slot: "base_chest", icon: "🏋️‍♂️", name: "Базовый жим", sets: "2", weight: "", reps: "8", rir: "RIR 4", note: "" });
                if (legsAllowed === "yes") dayNode.exercises.push({ slot: "base_legs", icon: "🏋️‍♂️", name: "Базовый присед", sets: "2", weight: "", reps: "8", rir: "RIR 4", note: "" });
            }
            structure.days.push(dayNode);
            continue;
        }

        let currentDayBases      = [];
        let currentDayAccessories = [];

        // -------------------------------------------------------
        // А) 3-ДНЕВНЫЙ ФУЛБАДИ (ТРИАДА БАЗЫ КАЖДЫЙ ДЕНЬ)
        // -------------------------------------------------------
        if (numDays === 3) {
            currentDayBases = ["base_chest", "base_legs", "base_back"];
            if (legsAllowed === "no") {
                currentDayBases = ["base_chest", "base_back", "base_chest_light"];
            }

            // Обязательные руки по дням:
            //   Пн (d=0): бицепс
            //   Ср (d=1): бицепс + трицепс
            //   Пт (d=2): трицепс
            if (d === 0) {
                // ПОНЕДЕЛЬНИК — жимовой акцент + бицепс (обязательно) + дельты + трапеции
                currentDayAccessories = ["iso_bic", "iso_delt", "traps"];
            } else if (d === 1) {
                // СРЕДА — ножной акцент + бицепс+трицепс (обязательно) + спец-слот
                currentDayAccessories = ["iso_bic", "iso_tri"];
                // spec_extra_weekly идёт в среду ТОЛЬКО если специализация НЕ на руки
                // (специализация рук разводится по другим дням в mod-specialization)
                if (userContext.spec && userContext.spec !== "skip" && userContext.spec !== "arms") {
                    currentDayAccessories.unshift("spec_extra_weekly");
                }
                if (legsAllowed === "yes") currentDayAccessories.push("iso_legs");
            } else {
                // ПЯТНИЦА — тяговый фокус + трицепс (обязательно) + дельты + икры
                currentDayAccessories = ["iso_tri", "iso_delt", "calves"];
            }

            // Для short-дня (минимализм): только база + специализация/изоляция, потолок 5
            if (isShortDay) {
                currentDayAccessories = [];
                if (userContext.spec && userContext.spec !== "skip") {
                    currentDayAccessories.push("spec_extra_weekly");
                } else {
                    // Добавляем одну изоляцию по остаточному принципу
                    if (d === 0) currentDayAccessories.push("iso_delt");
                    else if (d === 1) currentDayAccessories.push("iso_bic");
                    else currentDayAccessories.push("iso_tri");
                }
            }
        }
        // -------------------------------------------------------
        // Б) 4-ДНЕВНЫЙ СПЛИТ
        //    forceFourDayFullbody: верх/низ без ног → 4-дневный фулбади
        //    иначе: классический верх/низ
        // -------------------------------------------------------
        else if (numDays === 4) {
            if (forceFourDayFullbody) {
                // 4-ДНЕВНЫЙ ФУЛБАДИ (все дни — база верха, без ног)
                // Пн/Чт — грудь как главная база, Вт/Пт — спина как главная база
                if (d === 0 || d === 2) {
                    currentDayBases = ["base_chest", "base_back"];
                    currentDayAccessories = ["iso_delt", "iso_bic", "iso_tri", "traps"];
                    dayNode.isHeavyDay = (d === 0); // Пн тяжёлый, Чт умеренный
                } else {
                    currentDayBases = ["base_back", "base_chest_light"];
                    currentDayAccessories = ["iso_bic", "iso_tri", "iso_delt", "calves"];
                    dayNode.isHeavyDay = (d === 1); // Вт тяжёлый, Пт умеренный
                }
            } else {
                // КЛАССИЧЕСКИЙ ВЕРХ / НИЗ
                if (d === 0 || d === 2) {
                    // Пн/Чт — ВЕРХ
                    currentDayBases = (d === 0) ? ["base_chest"] : ["base_back"];
                    currentDayAccessories = ["iso_back", "iso_delt", "iso_bic", "iso_tri", "traps"];
                    dayNode.isHeavyDay = (d === 0); // Пн тяжёлый, Чт умеренный
                } else {
                    // Вт/Пт — НИЗ
                    currentDayBases = ["base_legs"]; // legsAllowed гарантированно "yes" здесь
                    currentDayAccessories = ["iso_legs", "iso_legs_alt", "calves"];
                    dayNode.isHeavyDay = (d === 1); // Вт тяжёлый, Пт умеренный
                }
            }
        }
        // -------------------------------------------------------
        // В) 2-ДНЕВНЫЙ СПЛИТ — обе базы тяжёлые
        // -------------------------------------------------------
        else if (numDays === 2) {
            if (d === 0) {
                // ДЕНЬ А — грудь + ноги (если разрешены) + подсобка верха
                currentDayBases = ["base_chest"];
                if (legsAllowed === "yes") currentDayBases.push("base_legs");
                currentDayAccessories = ["iso_back", "iso_bic", "iso_tri", "iso_delt"];
                dayNode.isHeavyDay = true;
            } else {
                // ДЕНЬ Б — спина (тяжёлая) + компенсирующее упражнение на непокрытую группу + подсобка
                currentDayBases = ["base_back"];
                currentDayAccessories = ["iso_bic", "calves", "traps", "iso_delt"];
                dayNode.isHeavyDay = true; // оба дня тяжёлые по базе

                // Компенсирующее упражнение: 3 подхода, умеренная интенсивность
                // Грудь покрыта в День А, поэтому здесь добавляем лёгкий жим или дельты
                currentDayAccessories.unshift("base_chest_compensate"); // отдельный слот умеренной базы
            }
        }
        // -------------------------------------------------------
        // Г) ОДНОДНЕВНЫЙ СПЛИТ НА МАКСИМУМ
        // -------------------------------------------------------
        else {
            currentDayBases = ["base_chest", "base_legs", "base_back"].filter(b => legsAllowed === "yes" || b !== "base_legs");
            currentDayAccessories = [...requiredAccessoryPool];
        }

        // Перемешиваем подсобку (кроме обязательных позиций, которые уже стоят первыми)
        // Для 3-дневного фулбади первые N слотов — обязательные руки, их не трогаем
        let mandatoryCount = 0;
        if (numDays === 3 && !isShortDay) {
            if (d === 0) mandatoryCount = 1; // iso_bic
            if (d === 1) mandatoryCount = 2; // iso_bic + iso_tri (+ возможно spec впереди)
            if (d === 2) mandatoryCount = 1; // iso_tri
        }
        let mandatorySlots = currentDayAccessories.slice(0, mandatoryCount);
        let shuffleSlots   = currentDayAccessories.slice(mandatoryCount);
        shuffleSlots.sort(() => Math.random() - 0.5);
        currentDayAccessories = mandatorySlots.concat(shuffleSlots);

        // =============================================================
        // ЖЁСТКИЙ ПРИОРИТЕТНЫЙ ФИЛЬТР ДЛЯ ЛИМИТА НОВИЧКА (5 упр, 3-дневный фулбади)
        // =============================================================
        let isNoviceLimit = (userContext.experience === "новичок" && dayExCount === 5 && !isShortDay);
        let hasWeeklySpec = currentDayAccessories.includes("spec_extra_weekly");

        if (isNoviceLimit && numDays === 3) {
            // 3 базы + обязательный слот руки + 1 доп подсобка (или спец если есть)
            dayNode.exercises.push({ slot: currentDayBases[0], icon: "🏋️‍♂️", name: "База 1", sets: "4", weight: "", reps: "8", rir: "RIR 2", note: "" });
            dayNode.exercises.push({ slot: currentDayBases[1], icon: "🏋️‍♂️", name: "База 2", sets: "4", weight: "", reps: "8", rir: "RIR 2", note: "" });
            dayNode.exercises.push({ slot: currentDayBases[2], icon: "🏋️‍♂️", name: "База 3", sets: "4", weight: "", reps: "8", rir: "RIR 2", note: "" });

            if (hasWeeklySpec) {
                // Спец-слот встаёт перед базами (unshift) — приоритет №1
                dayNode.exercises.unshift({ slot: "spec_extra_weekly", icon: "🔥", name: "Интенсивная специализация", sets: "4", weight: "", reps: "6", rir: "RIR 0", note: "" });
                // Теперь 4 упражнения, нужно ещё одно — обязательный слот руки дня
                let mandatoryArm = (d === 0 || d === 1) ? "iso_bic" : "iso_tri";
                // −50% подходов т.к. места мало (5-й слот, лимит)
                dayNode.exercises.push({ slot: mandatoryArm, icon: "🪙", name: "Обязательная подсобка (−50% объём)", sets: "2", weight: "", reps: "10", rir: "RIR 2", note: "Сжат до 50% подходов из-за лимита новичка" });
            } else {
                // Обязательный слот руки дня
                let mandatoryArm = (d === 0 || d === 1) ? "iso_bic" : "iso_tri";
                dayNode.exercises.push({ slot: mandatoryArm, icon: "🪙", name: "Обязательная подсобка", sets: "3", weight: "", reps: "10", rir: "RIR 2", note: "" });
                // 5-й слот: дополнительная подсобка (для среды — трицепс тоже обязателен)
                if (d === 1) {
                    // В среду оба обязательны — трицепс тоже, но уже −50% подходов (лимит)
                    dayNode.exercises.push({ slot: "iso_tri", icon: "⚙️", name: "Трицепс (−50% объём)", sets: "2", weight: "", reps: "10", rir: "RIR 2", note: "Сжат до 50% подходов из-за лимита новичка" });
                } else {
                    // Обычная доп. подсобка
                    let extraSlot = shuffleSlots[0] || "iso_delt";
                    dayNode.exercises.push({ slot: extraSlot, icon: "⚙️", name: "Подсобное упражнение", sets: "3", weight: "", reps: "12", rir: "RIR 2", note: "" });
                }
            }

        } else {
            // =============================================================
            // СТАНДАРТНАЯ НАРЕЗКА СЛОТОВ (Средний, Продвинутый, Short-день)
            // =============================================================
            let baseIndex = 0;
            for (let i = 0; i < dayExCount; i++) {
                if (baseIndex < currentDayBases.length) {
                    let baseSlot = currentDayBases[baseIndex++];
                    // Компенсирующий слот 2-дневного сплита — умеренная интенсивность
                    let isCompensate = (baseSlot === "base_chest_compensate");
                    dayNode.exercises.push({
                        slot: isCompensate ? "base_chest_light" : baseSlot,
                        icon: "🏋️‍♂️",
                        name: isCompensate ? "Компенсирующий жим (умеренно)" : "Тяжёлая база",
                        sets: isCompensate ? "3" : "4",
                        weight: "",
                        reps: isCompensate ? "10" : "8",
                        rir: isCompensate ? "RIR 3" : "RIR 2",
                        note: isCompensate ? "Умеренная база 2-дневного сплита" : ""
                    });
                } else {
                    let accessoryIndex = i - currentDayBases.length;
                    let accessorySlot  = currentDayAccessories[accessoryIndex];
                    if (!accessorySlot) {
                        accessorySlot = requiredAccessoryPool[Math.floor(Math.random() * requiredAccessoryPool.length)];
                    }

                    let currentIcon = "⚙️";
                    if (accessorySlot === "iso_bic") currentIcon = "🪙";
                    if (accessorySlot === "spec_extra_weekly") currentIcon = "🔥";
                    if (accessorySlot === "calves" || accessorySlot === "traps") currentIcon = "🪵";

                    let defaultName = accessorySlot === "spec_extra_weekly" ? "Интенсивная специализация" : "Подсобное упражнение";
                    dayNode.exercises.push({
                        slot: accessorySlot,
                        icon: currentIcon,
                        name: defaultName,
                        sets: "3",
                        weight: "",
                        reps: "10",
                        rir: "RIR 2",
                        note: ""
                    });
                }
            }

            // Проверка обязательных рук для 3-дневного фулбади (не short, не новичок-лимит)
            // Если обязательный слот не попал в день из-за лимита — добавляем с −50% подходов
            if (numDays === 3 && !isShortDay) {
                let requiredSlots = [];
                if (d === 0) requiredSlots = ["iso_bic"];
                if (d === 1) requiredSlots = ["iso_bic", "iso_tri"];
                if (d === 2) requiredSlots = ["iso_tri"];

                requiredSlots.forEach(req => {
                    let alreadyIn = dayNode.exercises.some(ex => ex.slot === req);
                    if (!alreadyIn) {
                        // Не влез — добавляем с −50% подходов (сжатый слот)
                        dayNode.exercises.push({
                            slot: req,
                            icon: "🪙",
                            name: "Обязательная подсобка (−50% объём)",
                            sets: "2",
                            weight: "",
                            reps: "10",
                            rir: "RIR 2",
                            note: "Сжат до 50% подходов — обязательный слот не вместился в лимит"
                        });
                    }
                });
            }
        }

        structure.days.push(dayNode);
    }

    return structure;
}
console.log("📐 [КОНВЕЙЕР ШАБЛОНОВ v5.0]: Новые минимумы, обязательные руки, минимализм-скелет, 2-дневный сплит и переадресация 4д без ног — заперты.");
