/* ============================================================================
   YourGym — FIX OVERLAY v1.0
   ----------------------------------------------------------------------------
   ЭТО НАДСТРОЙКА. Она ничего не переписывает и не удаляет.

   НЕ трогает: расчёты, модификаторы (mod-*.js), квиз, mesocycle-core.js,
               pipeline-dispatcher.js, template-builder.js, HTML, CSS.

   Делает ровно 2 вещи:
     1) Калькулятор ПМ (#dynamicFinalInputsContainer) и недельная программа
        (#resProgramTable) больше НЕ остаются скрытыми после генерации
        мезоцикла — если их кто-то спрятал, файл возвращает видимость.
     2) Под мезоциклом появляется кнопка «📥 СКАЧАТЬ ПРОГРАММУ В PDF».
        PDF печатает ровно то, что на экране (берётся копия готового блока),
        поэтому расчёты в PDF всегда совпадают с сайтом.

   Установка: один тег <script> в index.html, ПОСЛЕДНИМ, перед </body>.
   Откат: удалить тег <script> — сайт вернётся в исходное состояние.
   ============================================================================ */

(function () {
    'use strict';

    var FIX_TAG = '[YourGym FIX]';

    // Что нельзя прятать (ID из твоего же сайта)
    var KEEP_VISIBLE = ['dynamicFinalInputsContainer', 'resProgramTable'];

    var MESO_ID = 'mesocycleOutputContainer';   // блок мезоцикла
    var PDF_BTN_ID = 'yourgymPdfButton';
    var ENFORCE_MS = 6000;                      // сколько мс следим после генерации

    var enforcing = false;
    var enforceUntil = 0;
    var mesoWasSeen = false;

    /* ======================= 1. ВОЗВРАТ ВИДИМОСТИ ======================= */

    function unhide(el) {
        if (!el || !el.style) return false;
        if (el.style.display !== 'none') return false;

        // убираем inline display:none -> элемент снова берёт стиль из CSS
        el.style.removeProperty('display');

        // если элемент прячет ещё и CSS-правило — показываем принудительно
        var cs = window.getComputedStyle ? window.getComputedStyle(el) : null;
        if (cs && cs.display === 'none') {
            el.style.display = 'block';
        }
        return true;
    }

    function enforceVisibility() {
        if (!enforcing) return;
        if (Date.now() > enforceUntil) {
            enforcing = false;
            console.log(FIX_TAG, 'контроль видимости завершён');
            return;
        }

        for (var i = 0; i < KEEP_VISIBLE.length; i++) {
            var id = KEEP_VISIBLE[i];
            var el = document.getElementById(id);
            if (!el) continue;

            var changed = unhide(el);

            // старый код прятал ещё и родителя блока с калькулятором —
            // возвращаем и его
            if (el.parentElement && unhide(el.parentElement)) changed = true;

            if (changed) {
                console.log(FIX_TAG, 'вернул видимость:', id);
            }
        }
    }

    function startEnforce() {
        if (enforcing) return;
        enforcing = true;
        enforceUntil = Date.now() + ENFORCE_MS;
        console.log(FIX_TAG, 'включён контроль видимости (на ' + ENFORCE_MS + ' мс)');
        enforceVisibility();
    }

    // Быстрая реакция: следим за изменениями style на всей странице
    try {
        new MutationObserver(enforceVisibility).observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['style'],
            subtree: true,
            childList: true
        });
    } catch (e) {
        console.warn(FIX_TAG, 'MutationObserver недоступен, работает только таймер');
    }

    // Клик по кнопкам покупки/генерации = старт контроля
    document.addEventListener('click', function (e) {
        var t = e.target;
        while (t && t !== document) {
            if (t.tagName === 'BUTTON' || t.tagName === 'A') {
                var txt = (t.textContent || '').toUpperCase();
                if (txt.indexOf('199') !== -1 ||
                    txt.indexOf('МЕСЯЦ') !== -1 ||
                    txt.indexOf('30 ДНЕЙ') !== -1) {
                    startEnforce();
                }
                break;
            }
            t = t.parentNode;
        }
    }, true);

    /* ============================ 2. ПЕЧАТЬ / PDF ============================ */

    function buildPrintHtml() {
        var container = document.getElementById(MESO_ID);
        if (!container || !container.querySelector('table')) return null;

        // копируем готовый блок (расчёты уже внутри — ничего не пересчитываем)
        var clone = container.cloneNode(true);

        // убираем кнопки/служебные элементы из печатной версии
        var junk = clone.querySelectorAll('#' + PDF_BTN_ID + ', .no-print, button');
        for (var i = 0; i < junk.length; i++) {
            if (junk[i].parentNode) junk[i].parentNode.removeChild(junk[i]);
        }

        var ctx = (typeof userContext !== 'undefined' && userContext) ? userContext : {};
        var goal = ctx.goal ? String(ctx.goal) : '';
        var title = goal
            ? ('ПРОГРАММА НА ' + goal.toUpperCase() + ' — 4 НЕДЕЛИ')
            : 'ТРЕНИРОВОЧНАЯ ПРОГРАММА — 4 НЕДЕЛИ';

        var html = '<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8">' +
            '<title>' + title + '</title>' +
            '<style>' +
            '@page { size: A4; margin: 12mm; }' +
            'body { margin: 0; }' +
            '* { background: #fff !important; color: #111 !important; ' +
            'box-shadow: none !important; text-shadow: none !important; ' +
            'font-family: Arial, "DejaVu Sans", sans-serif !important; }' +
            'h1, h2, h3, h4 { color: #111 !important; margin: 14px 0 6px; }' +
            'table { width: 100%; border-collapse: collapse; margin: 8px 0 14px; }' +
            'th, td { border: 1px solid #999 !important; padding: 5px 7px; ' +
            'font-size: 11.5px; text-align: left; vertical-align: top; }' +
            'th { font-weight: bold; background: #eee !important; }' +
            'tr, td, th { page-break-inside: avoid; }' +
            'img, svg, video { display: none !important; }' +
            '.yg-title { font-size: 19px; font-weight: bold; text-align: center; margin: 0 0 4px; }' +
            '.yg-sub { text-align: center; font-size: 11px; color: #555 !important; margin-bottom: 16px; }' +
            '</style></head><body>' +
            '<div class="yg-title">' + title + '</div>' +
            '<div class="yg-sub">Сформировано ' + new Date().toLocaleDateString('ru-RU') +
            ' • YourGym · Система Атак</div>' +
            clone.innerHTML +
            '</body></html>';

        return html;
    }

    function printViaWindow(html) {
        var w = window.open('', '_blank');
        if (!w) {
            alert('Браузер заблокировал окно печати.\n\nРазреши всплывающие окна для этого сайта и попробуй снова.');
            return;
        }
        w.document.open();
        w.document.write(html);
        w.document.close();
        setTimeout(function () {
            try { w.focus(); w.print(); } catch (e) { console.error(FIX_TAG, e); }
        }, 400);
    }

    function printViaIframe(html) {
        var frame = document.createElement('iframe');
        frame.setAttribute('aria-hidden', 'true');
        frame.style.cssText = 'position:fixed;right:0;bottom:0;width:1px;height:1px;border:0;opacity:0;';
        document.body.appendChild(frame);

        var doc = frame.contentWindow.document;
        doc.open();
        doc.write(html);
        doc.close();

        setTimeout(function () {
            try {
                frame.contentWindow.focus();
                frame.contentWindow.print();
            } catch (e) {
                console.warn(FIX_TAG, 'iframe-печать не сработала, пробую окно', e);
                printViaWindow(html);
            }
            setTimeout(function () {
                if (frame.parentNode) frame.parentNode.removeChild(frame);
            }, 60000);
        }, 400);
    }

    function onPdfClick() {
        var html = buildPrintHtml();
        if (!html) {
            alert('Мезоцикл ещё не сгенерирован.\n\nСначала нажми «ПОЛУЧИТЬ ПРОГРАММУ НА МЕСЯЦ».');
            return;
        }
        console.log(FIX_TAG, 'готовлю PDF...');
        try {
            printViaIframe(html);
        } catch (e) {
            console.error(FIX_TAG, e);
            printViaWindow(html);
        }
    }

    /* ====================== 3. КНОПКА ПОД МЕЗОЦИКЛОМ ====================== */

    function hasPdfButtonAlready(container) {
        if (document.getElementById(PDF_BTN_ID)) return true;
        var btns = container.querySelectorAll('button');
        for (var i = 0; i < btns.length; i++) {
            if (/PDF/i.test(btns[i].textContent || '')) return true;
        }
        return false;
    }

    function injectPdfButton() {
        var container = document.getElementById(MESO_ID);
        if (!container) return;
        if (!container.querySelector('table')) return;   // мезоцикл ещё не отрисован
        if (hasPdfButtonAlready(container)) return;

        var wrap = document.createElement('div');
        wrap.className = 'no-print';
        wrap.style.cssText = 'text-align:center;margin:28px 0 10px;';

        var btn = document.createElement('button');
        btn.id = PDF_BTN_ID;
        btn.type = 'button';
        btn.textContent = '📥 СКАЧАТЬ ПРОГРАММУ В PDF';
        btn.style.cssText = 'padding:16px 42px;font:700 16px/1 Arial,sans-serif;' +
            'letter-spacing:1px;text-transform:uppercase;color:#0d0f14;' +
            'background:linear-gradient(135deg,#00ffcc 0%,#00cc99 100%);' +
            'border:0;border-radius:8px;cursor:pointer;' +
            'box-shadow:0 0 15px rgba(0,255,204,.45);';
        btn.addEventListener('click', onPdfClick);

        wrap.appendChild(btn);
        container.appendChild(wrap);
        console.log(FIX_TAG, 'кнопка «Скачать в PDF» добавлена');
    }

    /* ============================ 4. НАБЛЮДЕНИЕ ============================ */

    setInterval(function () {
        enforceVisibility();

        var container = document.getElementById(MESO_ID);
        if (!container) {
            mesoWasSeen = false;
            return;
        }

        // мезоцикл только что появился -> включаем контроль видимости
        if (!mesoWasSeen && container.querySelector('table')) {
            mesoWasSeen = true;
            startEnforce();
        }

        injectPdfButton();
    }, 200);

    /* ================= Ручной доступ (для отладки в F12) ================= */
    window.YourGymFix = {
        printPdf: onPdfClick,
        keepVisible: startEnforce
    };

    console.log('✅ ' + FIX_TAG + ' ядро фиксов запущено');
})();
