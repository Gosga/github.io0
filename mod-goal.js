// ================================================================= 
// [УЛЬТИМАТИВНЫЙ МОД ЦЕЛЕЙ v5.0 — RIR-РАНДОМИЗАЦИЯ, ФЛАГ ТЯЖЁЛЫЙ/УМЕРЕННЫЙ,
//  КУБИК ИЗОЛЯЦИИ НА СИЛЕ]
// =================================================================

// Вспомогательная функция: выбирает RIR по весовой таблице
// heavyDay = true  → тяжёлый/специализация: RIR0 15%, RIR1 40%, RIR2 40%, RIR3 5%
// heavyDay = false → умеренный день:          RIR0  0%, RIR1 15%, RIR2 45%, RIR3 35%
function rollRIR(heavyDay) {
    let roll = Math.random() * 100;
    if (heavyDay) {
        if (roll < 15) return "RIR 0";
        if (roll < 55) return "RIR 1";
        if (roll < 95) return "RIR 2";
        return "RIR 3";
    } else {
        if (roll < 15) return "RIR 1";
        if (roll < 60) return "RIR 2";
        return "RIR 3";
    }
}

// Вспомогательная функция: кубик изоляции для силовой цели (4 варианта)
// Соблюдает правило «трицепс не ниже 6 повторов»
function rollStrengthIsolation(ex, isShortDay) {
    let isTri = ex.slot.includes("tri");
    let dice  = Math.floor(Math.random() * 4) + 1;
    let setsBase = isShortDay ? "2" : "3";

    if (dice === 1) {
        ex.sets   = setsBase; ex.weight = "75% ПМ";
        ex.reps   = "6";      ex.rir    = "RIR 2";
        ex.note   = "Силовая изоляция";
    } else if (dice === 2) {
        ex.sets   = isShortDay ? "2" : "4"; ex.weight = "78% ПМ";
        ex.reps   = "5";                    ex.rir    = "RIR 2";
        ex.note   = "Тяжёлая изоляция";
    } else if (dice === 3) {
        ex.sets   = setsBase; ex.weight = "70% ПМ";
        ex.reps   = isTri ? "8" : "8"; ex.rir = "RIR 1";
        ex.note   = "Объёмная изоляция";
    } else {
        ex.sets   = isShortDay ? "2" : "2"; ex.weight = "65% ПМ";
        ex.reps   = isTri ? "8" : "10";     ex.rir    = "RIR 2";
        ex.note   = "Памп-финишер";
    }
}

function applyModifierGoalLocal(structure, w) {
    let totalDays = structure.days.length;
    let randomPeakDayIndex1 = Math.floor(Math.random() * totalDays);
    let randomPeakDayIndex2 = (randomPeakDayIndex1 + 1) % totalDays;

    structure.days.forEach((day, dIdx) => {
        // Глобальный кубик дня (без специализации — единый для всех баз)
        let dayDiceStrength = Math.floor(Math.random() * 5) + 1;
        let dayDiceMass     = Math.floor(Math.random() * 4) + 1;
        let dayDiceCutting  = Math.floor(Math.random() * 5) + 1;

        // Флаг тяжёлого/умеренного дня:
        //   3-дневный фулбади: все дни тяжёлые (акцент по группе, не по интенсивности)
        //   4-дневный верх/низ: Пн/Вт тяжёлые, Чт/Пт умеренные (как раньше)
        //   2-дневный сплит: оба дня тяжёлые по базе (новое правило v5.0)
        //   Явный флаг из скелета (day.isHeavyDay) имеет приоритет, если выставлен
        let isHeavyDay = (day.isHeavyDay !== undefined) ? day.isHeavyDay : true;

        // Флаг короткой тренировки
        let isShortDay = (userContext.time === "short");

        day.exercises.forEach(ex => {
            if (!ex) return;

            let isBase = ex.slot.includes("base");

            let diceAccessory = Math.floor(Math.random() * 4) + 1;

            // С специализацией — каждое упражнение получает свой кубик (сломанная цельность дня)
            let diceStrength = (userContext.spec === "skip") ? dayDiceStrength : (Math.floor(Math.random() * 5) + 1);
            let diceMass     = (userContext.spec === "skip") ? dayDiceMass     : (Math.floor(Math.random() * 4) + 1);
            let diceCutting  = (userContext.spec === "skip") ? dayDiceCutting  : (Math.floor(Math.random() * 5) + 1);

            // =============================================================
            // ДЕЛОАД (ПЕРЕТРЕНИРОВАННОСТЬ)
            // =============================================================
            if (userContext.plateau === "plateau_over") {
                if (isBase) {
                    ex.sets = "2"; ex.weight = "50% ПМ";
                    ex.reps = "8"; ex.rir    = "RIR 4";
                    ex.note = "Реабилитационный сет делоада";
                }
                return;
            }

            // Акцент дня (по группе мышц, для фулбади)
            let isDayAccent = false;
            if (parseInt(userContext.days) === 3) {
                if (dIdx === 0 && ex.slot.includes("chest")) isDayAccent = true;
                if (dIdx === 1 && ex.slot.includes("legs"))  isDayAccent = true;
                if (dIdx === 2 && ex.slot.includes("back"))  isDayAccent = true;
            } else {
                isDayAccent = true;
            }

            // Флаг специализации форсирует тяжёлый день для целевой группы
            let isSpecAccent = false;
            if (userContext.spec === "chest" && ex.slot.includes("chest")) isSpecAccent = true;
            if (userContext.spec === "back"  && ex.slot.includes("back"))  isSpecAccent = true;
            if (userContext.spec === "arms"  && (ex.slot.includes("bic") || ex.slot.includes("tri"))) isSpecAccent = true;

            let effectiveHeavy = isHeavyDay || isSpecAccent;

            // =============================================================
            // СИЛА
            // =============================================================
            if (userContext.goal === "сила") {
                if (isBase) {
                    let isPeakDay = (dIdx === randomPeakDayIndex1 && isDayAccent && effectiveHeavy);
                    if (userContext.plateau === "plateau_under" && isDayAccent) {
                        isPeakDay = (dIdx === randomPeakDayIndex1 || dIdx === randomPeakDayIndex2);
                    }
                    if (isSpecAccent) isPeakDay = true;

                    if (isPeakDay) {
                        ex.sets   = isShortDay ? "1<br>1<br>1" : "1<br>1<br>1<br>1";
                        ex.weight = isShortDay ? "50% ПМ<br>75% ПМ<br>100% ПМ" : "50% ПМ<br>75% ПМ<br>90% ПМ<br>100% ПМ";
                        ex.reps   = isShortDay ? "5<br>3<br>1" : "5<br>3<br>1<br>1";
                        ex.rir    = "RIR 4<br>RIR 2<br>RIR 1<br>RIR 0";
                        ex.note   = "Пиковый силовой дожим";
                    } else if (isDayAccent && effectiveHeavy) {
                        let setsCount = isShortDay ? "3" : "5";
                        if (diceStrength === 1) {
                            ex.sets = setsCount; ex.weight = "75% ПМ"; ex.reps = "5";
                            ex.rir  = rollRIR(true); ex.note = "Силовой сет";
                        } else if (diceStrength === 2) {
                            ex.sets   = "1<br>1<br>1<br>1";
                            ex.weight = "75% ПМ<br>78% ПМ<br>80% ПМ<br>85% ПМ";
                            ex.reps   = "5<br>4<br>3<br>2";
                            ex.rir    = `${rollRIR(true)}<br>${rollRIR(true)}<br>${rollRIR(true)}<br>${rollRIR(true)}`;
                            ex.note   = "Волновой подъём";
                        } else if (diceStrength === 3) {
                            ex.sets   = "1<br>1<br>1<br>1";
                            ex.weight = "78% ПМ<br>80% ПМ<br>80% ПМ<br>85% ПМ";
                            ex.reps   = "4<br>3<br>3<br>2";
                            ex.rir    = `${rollRIR(true)}<br>${rollRIR(true)}<br>${rollRIR(true)}<br>${rollRIR(true)}`;
                            ex.note   = "Силовой шаг";
                        } else {
                            ex.sets = isShortDay ? "3" : "4"; ex.weight = "78% ПМ"; ex.reps = "4";
                            ex.rir  = rollRIR(true); ex.note = "Силовая пирамида";
                        }
                    } else {
                        ex.sets = "3";
                        ex.weight = effectiveHeavy ? "70% ПМ" : "65% ПМ (Умеренно)";
                        ex.reps   = "5";
                        ex.rir    = rollRIR(false);
                        ex.note   = effectiveHeavy ? "Поддерживающий силовой сет" : "Умеренная силовая волна";
                    }
                } else {
                    // ИЗОЛЯЦИЯ НА СИЛЕ — кубик вместо фиксированной схемы (v5.0)
                    rollStrengthIsolation(ex, isShortDay);
                }
            }

            // =============================================================
            // МАССА
            // =============================================================
            else if (userContext.goal === "масса") {
                if (isBase) {
                    let isMassPeakDay = (dIdx === randomPeakDayIndex1 && isDayAccent && effectiveHeavy);
                    if (isSpecAccent) isMassPeakDay = true;

                    if (isMassPeakDay) {
                        ex.sets   = isShortDay ? "1<br>1<br>1" : "1<br>1<br>1<br>1";
                        ex.weight = isShortDay ? "50% ПМ<br>75% ПМ<br>100% ПМ" : "50% ПМ<br>75% ПМ<br>90% ПМ<br>100% ПМ";
                        ex.reps   = isShortDay ? "5<br>3<br>1" : "5<br>3<br>1<br>1";
                        ex.rir    = "RIR 4<br>RIR 2<br>RIR 1<br>RIR 0";
                        ex.note   = "Пиковый вылет";
                    } else if (isDayAccent && effectiveHeavy) {
                        let baseSetsCount = isShortDay ? "3" : "4";
                        if (diceMass === 1) {
                            ex.sets   = isShortDay ? "1<br>1<br>1" : "1<br>1<br>1<br>1";
                            ex.weight = isShortDay ? "70% ПМ<br>75% ПМ<br>90% ПМ" : "70% ПМ<br>75% ПМ<br>78% ПМ<br>90% ПМ";
                            ex.reps   = isShortDay ? "10<br>8<br>2" : "10<br>8<br>6<br>2";
                            ex.rir    = `${rollRIR(true)}<br>${rollRIR(true)}<br>${rollRIR(true)}${isShortDay ? "" : "<br>" + rollRIR(true)}`;
                            ex.note   = "Отказной дожим";
                        } else if (diceMass === 2) {
                            ex.sets   = baseSetsCount; ex.weight = "75% ПМ"; ex.reps = "8";
                            ex.rir    = (userContext.plateau === "plateau_under") ? "RIR 0" : rollRIR(true);
                            ex.note   = "Базовый сет";
                        } else if (diceMass === 3) {
                            ex.sets   = isShortDay ? "1<br>2" : "1<br>1<br>2";
                            ex.weight = isShortDay ? "75% ПМ<br>70% ПМ" : "78% ПМ<br>75% ПМ<br>70% ПМ";
                            ex.reps   = isShortDay ? "8<br>10" : "6<br>8<br>10";
                            ex.rir    = `${rollRIR(true)}<br>${rollRIR(true)}${isShortDay ? "" : "<br>" + rollRIR(false)}`;
                            ex.note   = "Волновая петля";
                        } else {
                            ex.sets   = baseSetsCount; ex.weight = "68% ПМ"; ex.reps = "10";
                            ex.rir    = rollRIR(true); ex.note = "Объёмный сет";
                        }
                    } else {
                        if (diceMass % 2 === 0) {
                            ex.sets   = "3";
                            ex.weight = effectiveHeavy ? "65% ПМ" : "60% ПМ (Умеренно)";
                            ex.reps   = "10";
                            ex.rir    = rollRIR(false);
                            ex.note   = "Поддерживающий объём";
                        } else {
                            ex.sets   = "3"; ex.weight = "60% ПМ"; ex.reps = "12";
                            ex.rir    = rollRIR(false); ex.note = "Тонизирующий объём";
                        }
                    }
                } else {
                    // Подсобка на массе — свой кубик
                    let isTri = ex.slot.includes("tri");
                    if (diceAccessory === 1) {
                        ex.sets = "4"; ex.weight = "70% ПМ"; ex.reps = isTri ? "8" : "10";
                        ex.rir  = rollRIR(effectiveHeavy); ex.note = "Объёмная подсобка";
                    } else if (diceAccessory === 2) {
                        ex.sets = "3"; ex.weight = "75% ПМ"; ex.reps = isTri ? "8" : "8";
                        ex.rir  = rollRIR(effectiveHeavy); ex.note = "Рабочая подсобка";
                    } else if (diceAccessory === 3) {
                        ex.sets = "3"; ex.weight = "65% ПМ"; ex.reps = isTri ? "12" : "12";
                        ex.rir  = rollRIR(false); ex.note = "Памп-подсобка";
                    } else {
                        // Икры/трапеции — фиксированный памп
                        if (ex.slot === "calves" || ex.slot === "traps") {
                            ex.sets = "4"; ex.weight = "Подобрать"; ex.reps = "15";
                            ex.rir  = "RIR 2"; ex.note = "Памп изоляция";
                        } else {
                            ex.sets = "3"; ex.weight = "68% ПМ"; ex.reps = isTri ? "10" : "12";
                            ex.rir  = rollRIR(false); ex.note = "Лёгкая подсобка";
                        }
                    }
                }
            }

            // =============================================================
            // СУШКА
            // =============================================================
            else if (userContext.goal === "сушка") {
                if (isBase) {
                    if (isDayAccent && effectiveHeavy) {
                        if (diceCutting <= 2) {
                            ex.sets = isShortDay ? "3" : "4"; ex.weight = "70% ПМ"; ex.reps = "10";
                            ex.rir  = rollRIR(true); ex.note = "Рабочий сет сушки";
                        } else if (diceCutting <= 4) {
                            ex.sets = isShortDay ? "3" : "4"; ex.weight = "65% ПМ"; ex.reps = "12";
                            ex.rir  = rollRIR(true); ex.note = "Объёмный сет сушки";
                        } else {
                            ex.sets   = "1<br>1<br>1"; ex.weight = "65% ПМ<br>70% ПМ<br>75% ПМ";
                            ex.reps   = "12<br>10<br>8";
                            ex.rir    = `${rollRIR(true)}<br>${rollRIR(true)}<br>${rollRIR(true)}`;
                            ex.note   = "Пирамида сушки";
                        }
                    } else {
                        ex.sets = "3"; ex.weight = "60% ПМ (Умеренно)"; ex.reps = "12";
                        ex.rir  = rollRIR(false); ex.note = "Тонизирующий сет";
                    }
                } else {
                    // Подсобка на сушке
                    if (diceAccessory <= 2) {
                        ex.sets = "3"; ex.weight = "65% ПМ"; ex.reps = "12";
                        ex.rir  = rollRIR(effectiveHeavy); ex.note = "Памп сушки";
                    } else {
                        ex.sets = "4"; ex.weight = "60% ПМ"; ex.reps = "15";
                        ex.rir  = rollRIR(false); ex.note = "Многоповторная сушка";
                    }
                }
            }
        });
    });

    return structure;
}
console.log("📐 [МОД ЦЕЛЕЙ v5.0]: RIR-рандомизация по весовой таблице, кубик изоляции на силе, флаг тяжёлый/умеренный для всех сплитов.");
