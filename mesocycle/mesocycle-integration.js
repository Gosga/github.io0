// ================================================================= 
// [ИНТЕГРАЦИЯ МЕЗОЦИКЛА v3.0 — КНОПКА, СКРЫТИЕ, ГЕНЕРАЦИЯ]
// =================================================================

let mesocycleButtonAdded = false;
let mesocyclePurchased = false;

// ===== ФУНКЦИЯ ДЛЯ СКРЫТИЯ КНОПОК ПОСЛЕ ПОКУПКИ =====
function hideAllPurchaseButtonsLocal() {
    // Скрываем новую кнопку мезоцикла
    let buttonBlock = document.getElementById('mesocycleButtonBlock');
    if (buttonBlock) {
        buttonBlock.style.display = 'none';
    }
    
    // Скрываем старую кнопку "30 ДНЕЙ ЗА 199₽"
    let allButtons = document.querySelectorAll("button");
    allButtons.forEach(function (btn) {
        if (btn.textContent && btn.textContent.includes("30 ДНЕЙ ЗА 199")) {
            btn.style.display = 'none';
        }
    });
}

// ===== ДОБАВЛЕНИЕ КНОПКИ "ПОЛУЧИТЬ ПРОГРАММУ НА МЕСЯЦ" =====
function addMesocycleButtonLocal() {
    if (mesocycleButtonAdded || mesocyclePurchased) return;
    
    let resultContainer = document.getElementById('resProgramTable');
    if (!resultContainer) {
        console.warn("⚠️ Контейнер resProgramTable не найден");
        return;
    }
    
    let buttonBlock = document.createElement('div');
    buttonBlock.id = 'mesocycleButtonBlock';
    buttonBlock.style.cssText = `
        text-align: center;
        margin: 40px auto;
        padding: 30px;
        background: linear-gradient(135deg, #1a1d26 0%, #0d0f14 100%);
        border: 2px solid var(--accent-color);
        border-radius: 16px;
        box-shadow: 0 0 30px rgba(0, 255, 204, 0.2);
        max-width: 800px;
    `;
    
    buttonBlock.innerHTML = `
        <h3 class="matrix-text-glow" style="color: var(--accent-color); font-size: 22px; margin-bottom: 15px; font-family: var(--font-header);">
            🚀 ХОЧЕШЬ БОЛЬШЕ?
        </h3>
        <p style="color: var(--text-muted); font-size: 14px; margin-bottom: 20px;">
            Получи <b>полную программу на месяц</b> с прогрессией нагрузки по неделям!<br>
            <span style="color: var(--accent-color);">✓ 4 недели тренировок</span> • 
            <span style="color: var(--accent-color);">✓ Рост интенсивности</span> • 
            <span style="color: var(--accent-color);">✓ Учёт перетрена</span> • 
            <span style="color: var(--accent-color);">✓ Проходки на пике</span>
        </p>
        <button 
            class="pay-btn" 
            onclick="handleMesocyclePurchaseLocal()" 
            style="padding: 18px 50px; font-size: 18px; background: linear-gradient(135deg, #00ffcc 0%, #00cc99 100%); color: #0d0f14; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 0 20px rgba(0, 255, 204, 0.5);"
        >
            💳 ПОЛУЧИТЬ ПРОГРАММУ НА МЕСЯЦ — 199₽
        </button>
        <p style="color: var(--text-muted); font-size: 11px; margin-top: 15px;">
            🔒 Безопасная оплата через ЮKassa
        </p>
    `;
    
    resultContainer.parentNode.insertBefore(buttonBlock, resultContainer.nextSibling);
    
    mesocycleButtonAdded = true;
    console.log("✅ Кнопка мезоцикла добавлена");
}

// ===== ОБРАБОТЧИК НАЖАТИЯ КНОПКИ =====
function handleMesocyclePurchaseLocal() {
    console.log("💳 [ОПЛАТА] Инициация оплаты мезоцикла...");
    
    if (confirm("⚠️ РЕЖИМ РАЗРАБОТКИ\n\nОплата через ЮKassa ещё не подключена.\nСгенерировать мезоцикл бесплатно для теста?")) {
        generateAndShowMesocycleLocal();
    } else {
        alert("💡 После интеграции ЮKassa здесь будет редирект на платёжную форму.");
    }
}

// ===== ГЕНЕРАЦИЯ И ОТОБРАЖЕНИЕ МЕЗОЦИКЛА =====
function generateAndShowMesocycleLocal() {
    console.log("🔥 [МЕЗОЦИКЛ] Старт генерации...");
    
    if (!globalGeneratedStructureCache) {
        alert("⚠️ Ошибка: программа не найдена!\n\nСначала пройди квиз и получи недельную программу.");
        return;
    }
    
    if (typeof userContext === 'undefined' || !userContext) {
        alert("⚠️ Ошибка: анкета пользователя не найдена!");
        return;
    }
    
    try {
        let mesocycle = generateMesocycleLocal();
        let html = renderMesocycleToHTMLLocal(mesocycle);
        showMesocycleResultLocal(html);
        
        mesocyclePurchased = true;
        
        console.log("✅ [МЕЗОЦИКЛ] Генерация завершена успешно!");
        
    } catch (error) {
        console.error("❌ [МЕЗОЦИКЛ] Ошибка генерации:", error);
        alert("⚠️ Произошла ошибка при генерации мезоцикла:\n\n" + error.message);
    }
}

// ===== ОТОБРАЖЕНИЕ РЕЗУЛЬТАТА =====
function showMesocycleResultLocal(html) {
    // Скрываем ВСЕ кнопки покупки
    hideAllPurchaseButtonsLocal();
    
    // Скрываем недельную программу и таблицу с ПМ
    let weeklyResult = document.getElementById('resProgramTable');
    if (weeklyResult) {
        weeklyResult.style.display = 'none';
    }
    
    let pmInputsBlock = document.getElementById('dynamicFinalInputsContainer');
    if (pmInputsBlock && pmInputsBlock.parentElement) {
        pmInputsBlock.parentElement.style.display = 'none';
    }
    
    let container = document.getElementById('mesocycleOutputContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'mesocycleOutputContainer';
        container.style.cssText = `
            max-width: 1200px;
            margin: 30px auto;
            padding: 0;
        `;
        
        let anchor = document.getElementById('mesocycleButtonBlock') || weeklyResult;
        if (anchor && anchor.parentNode) {
            anchor.parentNode.insertBefore(container, anchor.nextSibling);
        } else {
            document.body.appendChild(container);
        }
    }
    
    container.innerHTML = html;
    
    container.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ===== РЕЗЕРВНЫЙ ОБРАБОТЧИК ДЛЯ СТАРОЙ КНОПКИ =====
window.redirectToPayment = function redirectToPayment() {
    console.log("💳 [ОПЛАТА] Клик по кнопке '30 ДНЕЙ ЗА 199₽' → запуск мезоцикла...");
    handleMesocyclePurchaseLocal();
};

// ===== ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ СТРАНИЦЫ =====
document.addEventListener("DOMContentLoaded", function () {
    // Находим кнопку "30 ДНЕЙ ЗА 199₽" и добавляем обработчик
    let allButtons = document.querySelectorAll("button");
    allButtons.forEach(function (btn) {
        if (btn.textContent && btn.textContent.includes("30 ДНЕЙ ЗА 199")) {
            btn.id = btn.id || "oldPaymentButton30Days";
            btn.addEventListener("click", function (e) {
                e.preventDefault();
                console.log("💳 [РЕЗЕРВНЫЙ ОБРАБОТЧИК] Клик по кнопке '30 ДНЕЙ' пойман");
                window.redirectToPayment();
            });
        }
    });
    console.log("✅ [ИНТЕГРАЦИЯ v3.0] Обработчики кнопок подключены");
});

console.log("✅ [ИНТЕГРАЦИЯ v3.0]: Модуль мезоцикла готов к использованию");
