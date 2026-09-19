// ================================================================= 
// [ГЕНЕРАЦИЯ PDF И ЭКСПОРТ МЕЗОЦИКЛА v3.0]
// =================================================================

// ===== ФУНКЦИЯ СКАЧИВАНИЯ МЕЗОЦИКЛА В PDF =====
function downloadMesocycleAsPDFLocal() {
    console.log("📥 [PDF ЭКСПОРТ] Запуск скачивания мезоцикла...");
    
    if (!globalMesocycleCache) {
        alert("⚠️ Мезоцикл ещё не сгенерирован!");
        return;
    }
    
    try {
        // Используем html2pdf если доступен, иначе простой способ
        let element = document.getElementById('mesocycleOutputContainer');
        if (!element) {
            alert("⚠️ Контейнер мезоцикла не найден!");
            return;
        }
        
        let goalAccusative = getGoalAccusativeCase(globalMesocycleCache.userContext.goal);
        let filename = 'Mesocycle_' + goalAccusative + '_4weeks.pdf';
        
        // Простой способ: открыть окно печати
        let printWindow = window.open('', '', 'width=800,height=600');
        
        let htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>ПРОГРАММА НА ${goalAccusative} — 4 НЕДЕЛИ</title>
                <style>
                    body { 
                        font-family: Arial, sans-serif; 
                        background: white; 
                        color: #333;
                        margin: 20px;
                        line-height: 1.6;
                    }
                    h1 { 
                        text-align: center; 
                        color: #00ffcc; 
                        font-size: 24px;
                        margin-bottom: 10px;
                    }
                    h2 { 
                        color: #00ffcc; 
                        font-size: 18px;
                        margin-top: 30px;
                        border-bottom: 2px solid #00ffcc;
                        padding-bottom: 5px;
                    }
                    h3 { 
                        color: #333; 
                        font-size: 14px;
                        margin-top: 15px;
                    }
                    table { 
                        width: 100%; 
                        border-collapse: collapse; 
                        margin: 15px 0;
                    }
                    th { 
                        background: #00ffcc; 
                        color: #000; 
                        padding: 10px; 
                        text-align: left;
                        font-weight: bold;
                    }
                    td { 
                        border: 1px solid #ddd; 
                        padding: 8px;
                    }
                    tr:nth-child(even) { 
                        background: #f9f9f9; 
                    }
                    .advice {
                        background: #f0f0f0;
                        border-left: 3px solid #00ffcc;
                        padding: 10px;
                        margin: 10px 0;
                        font-size: 12px;
                    }
                    .week-header {
                        background: #f5f5f5;
                        padding: 10px;
                        margin: 20px 0 10px 0;
                        border-radius: 5px;
                        font-weight: bold;
                    }
                    .page-break {
                        page-break-after: always;
                    }
                </style>
            </head>
            <body>
                <h1>🔥 ПРОГРАММА НА ${goalAccusative} — 4 НЕДЕЛИ 🔥</h1>
                <p style="text-align: center; color: #666;">Программа с прогрессией нагрузки</p>
                <hr>
        `;
        
        // Добавляем каждую неделю
        globalMesocycleCache.weeks.forEach((week, idx) => {
            let weekDesc = getWeekDescriptionLocal(idx + 1, globalMesocycleCache.userContext);
            
            htmlContent += `
                <div class="week-header">📅 НЕДЕЛЯ ${idx + 1}: ${weekDesc}</div>
            `;
            
            // Добавляем таблицы дней
            week.structure.days.forEach(day => {
                htmlContent += `<h3>${day.title}</h3>`;
                htmlContent += `<table>
                    <tr>
                        <th>Упражнение</th>
                        <th>Сет</th>
                        <th>Вес / Интенсивность</th>
                        <th>Повторы</th>
                    </tr>
                `;
                
                day.exercises.forEach(ex => {
                    if (!ex) return;
                    
                    let setsArray = ex.sets.toString().split(/<br\s*\/?>|\n/gi);
                    let repsArray = ex.reps.toString().split(/<br\s*\/?>/gi);
                    let weightArray = ex.weight ? ex.weight.toString().split(/<br\s*\/?>/gi) : [];
                    let rirArray = ex.rir ? ex.rir.toString().split(/<br\s*\/?>/gi) : [];
                    
                    let actualSetsCount = Math.max(setsArray.length, repsArray.length, weightArray.length, rirArray.length);
                    if (actualSetsCount === 1 && !isNaN(parseInt(ex.sets))) {
                        actualSetsCount = parseInt(ex.sets);
                    }
                    
                    for (let s = 0; s < actualSetsCount; s++) {
                        let currentRep = repsArray[s] || repsArray[0] || "8";
                        let currentWeight = weightArray[s] || weightArray[0] || ex.weight || "";
                        let currentRir = rirArray[s] || rirArray[0] || ex.rir || "RIR 2";
                        
                        let finalWeightDisplay = currentWeight;
                        if (!finalWeightDisplay) {
                            finalWeightDisplay = currentRir;
                        } else if (!finalWeightDisplay.includes("RIR") && !finalWeightDisplay.includes("Вес тела") && !finalWeightDisplay.includes("%")) {
                            finalWeightDisplay += " (" + currentRir.replace(/<[^>]*>/g, '') + ")";
                        }
                        
                        htmlContent += `
                            <tr>
                                <td>${s === 0 ? ex.icon + ' ' + ex.name : ''}</td>
                                <td>Сет ${s + 1}</td>
                                <td>${finalWeightDisplay}</td>
                                <td>${currentRep}</td>
                            </tr>
                        `;
                    }
                });
                
                htmlContent += `</table>`;
            });
            
            // Совет тренера
            htmlContent += `
                <div class="advice">
                    ${week.structure.trainerAdvice}
                </div>
            `;
            
            if (idx < globalMesocycleCache.weeks.length - 1) {
                htmlContent += `<div class="page-break"></div>`;
            }
        });
        
        htmlContent += `
            </body>
            </html>
        `;
        
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        
        // Открываем диалог печати
        setTimeout(() => {
            printWindow.print();
        }, 250);
        
        console.log("✅ [PDF ЭКСПОРТ] Диалог печати открыт!");
        
    } catch (error) {
        console.error("❌ [PDF ЭКСПОРТ] Ошибка:", error);
        alert("⚠️ Ошибка при подготовке PDF:\n\n" + error.message);
    }
}

// ===== ДОБАВЛЕНИЕ КНОПКИ "СКАЧАТЬ PDF" В МЕЗОЦИКЛ =====
function addDownloadPDFButtonLocal() {
    // Проверяем, есть ли уже кнопка
    if (document.getElementById('downloadPdfButton')) return;
    
    let container = document.getElementById('mesocycleOutputContainer');
    if (!container) return;
    
    let buttonDiv = document.createElement('div');
    buttonDiv.style.cssText = `
        text-align: center;
        margin: 30px 0;
        padding: 20px;
    `;
    
    buttonDiv.innerHTML = `
        <button 
            id="downloadPdfButton"
            onclick="downloadMesocycleAsPDFLocal()"
            style="padding: 15px 40px; font-size: 16px; background: linear-gradient(135deg, #00ffcc 0%, #00cc99 100%); color: #0d0f14; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; border: none; border-radius: 8px; cursor: pointer; box-shadow: 0 0 15px rgba(0, 255, 204, 0.4);"
        >
            📥 СКАЧАТЬ ПРОГРАММУ В PDF
        </button>
    `;
    
    container.appendChild(buttonDiv);
    console.log("✅ Кнопка скачивания PDF добавлена");
}

console.log("✅ [PDF ЭКСПОРТ v3.0]: Модуль готов к использованию");
