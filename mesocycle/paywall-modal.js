/* ============================================================================
   YourGym — PAYWALL MODAL v2.0
   ----------------------------------------------------------------------------
   Что делает:
     Перехватывает клик по кнопке «ПОЛУЧИТЬ ПОЛНЫЙ ПЛАН НА 30 ДНЕЙ ЗА 199 ₽»
     и вместо него показывает модальное окно с двумя тарифами.

   НЕ трогает: расчёты, модификаторы, mesocycle-core.js, generator, HTML, CSS.
   Установка:  <script src="mesocycle/paywall-modal.js"></script>
               ПОСЛЕДНИМ тегом, перед </body>

   Откат: удалить тег <script>.
   ============================================================================ */

(function () {
    'use strict';

    var TAG = '[YourGym PAYWALL]';

    var MODAL_ID   = 'ygPaywall';
    var STYLE_ID   = 'ygPaywallStyles';
    var lastFocused = null;

    /* ===================== ТАРИФЫ (правь тексты тут) ===================== */

    var PLANS = [
        {
            id: 'program',
            badge: null,
            title: 'ПРОГРАММА ТРЕНИРОВОК',
            subtitle: 'Персональный план на 30 дней',
            price: 299,
            oldPrice: 499,
            features: [
                '4 недели с прогрессией нагрузки',
                'Индивидуальные рабочие веса от твоих ПМ',
                'Учёт перетрена и проходки на пике',
                'Скачивание в PDF'
            ],
            cta: 'ВЫБРАТЬ',
            featured: false
        },
        {
            id: 'program+nutrition',
            badge: '🔥 ХИТ ВЫБОРА',
            title: 'ПРОГРАММА + ПЛАН ПИТАНИЯ',
            subtitle: 'Под вашу цель: масса, сила или сушка',
            price: 439,
            oldPrice: 799,
            features: [
                'Всё из тарифа «Программа»',
                'Рацион под твою цель и калораж',
                'Расчёт БЖУ под твой вес',
                'Список продуктов + схема приёмов',
                'Корректировка под дни тренировок'
            ],
            cta: 'ВЫБРАТЬ СО СКИДКОЙ',
            featured: true
        }
    ];

    /* ============================== СТИЛИ ============================== */

    function injectStyles() {
        if (document.getElementById(STYLE_ID)) return;

        var css = ''
        + '#' + MODAL_ID + '{position:fixed;inset:0;z-index:99999;display:none;'
        + 'align-items:center;justify-content:center;padding:16px;'
        + 'font-family:Arial,"DejaVu Sans",sans-serif;box-sizing:border-box;}'
        + '#' + MODAL_ID + '.yg-open{display:flex;}'
        + '#' + MODAL_ID + ' *{box-sizing:border-box;}'

        /* затемнение */
        + '#' + MODAL_ID + ' .yg-backdrop{position:absolute;inset:0;'
        + 'background:rgba(4,6,10,.86);backdrop-filter:blur(6px);'
        + '-webkit-backdrop-filter:blur(6px);opacity:0;transition:opacity .25s ease;}'
        + '#' + MODAL_ID + '.yg-open .yg-backdrop{opacity:1;}'

        /* карточка окна */
        + '#' + MODAL_ID + ' .yg-panel{position:relative;width:100%;max-width:820px;'
        + 'max-height:92vh;overflow-y:auto;padding:34px 28px 26px;'
        + 'background:linear-gradient(160deg,#141824 0%,#0d0f14 100%);'
        + 'border:1px solid rgba(0,255,204,.35);border-radius:20px;'
        + 'box-shadow:0 0 60px rgba(0,255,204,.18),0 24px 60px rgba(0,0,0,.7);'
        + 'transform:translateY(26px) scale(.96);opacity:0;'
        + 'transition:transform .38s cubic-bezier(.16,1,.3,1),opacity .3s ease;}'
        + '#' + MODAL_ID + '.yg-open .yg-panel{transform:none;opacity:1;}'
        + '#' + MODAL_ID + ' .yg-panel::-webkit-scrollbar{width:8px;}'
        + '#' + MODAL_ID + ' .yg-panel::-webkit-scrollbar-thumb{'
        + 'background:rgba(0,255,204,.35);border-radius:8px;}'

        /* закрыть */
        + '#' + MODAL_ID + ' .yg-close{position:absolute;top:12px;right:14px;'
        + 'width:38px;height:38px;border:1px solid rgba(255,255,255,.14);'
        + 'border-radius:10px;background:rgba(255,255,255,.04);color:#9aa4b2;'
        + 'font-size:20px;line-height:1;cursor:pointer;transition:.2s;}'
        + '#' + MODAL_ID + ' .yg-close:hover{color:#00ffcc;'
        + 'border-color:rgba(0,255,204,.6);background:rgba(0,255,204,.08);'
        + 'transform:rotate(90deg);}'

        /* заголовок */
        + '#' + MODAL_ID + ' .yg-head{text-align:center;margin-bottom:22px;}'
        + '#' + MODAL_ID + ' .yg-head h2{margin:0 0 8px;font-size:clamp(19px,3.4vw,27px);'
        + 'color:#00ffcc;letter-spacing:1.4px;text-transform:uppercase;'
        + 'text-shadow:0 0 22px rgba(0,255,204,.5);}'
        + '#' + MODAL_ID + ' .yg-head p{margin:0;color:#8b95a5;font-size:13.5px;'
        + 'line-height:1.55;}'

        /* сетка тарифов */
        + '#' + MODAL_ID + ' .yg-grid{display:grid;gap:16px;'
        + 'grid-template-columns:1fr 1fr;margin-bottom:22px;}'

        /* карточка тарифа */
        + '#' + MODAL_ID + ' .yg-card{position:relative;padding:24px 20px 22px;'
        + 'background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.09);'
        + 'border-radius:16px;display:flex;flex-direction:column;'
        + 'opacity:0;transform:translateY(16px);'
        + 'transition:border-color .22s,transform .22s,box-shadow .22s,opacity .3s;}'
        + '#' + MODAL_ID + '.yg-open .yg-card{opacity:1;transform:none;}'
        + '#' + MODAL_ID + ' .yg-card:hover{transform:translateY(-4px);'
        + 'border-color:rgba(0,255,204,.45);box-shadow:0 12px 34px rgba(0,0,0,.5);}'
        + '#' + MODAL_ID + ' .yg-card.yg-featured{'
        + 'background:linear-gradient(165deg,rgba(0,255,204,.07),rgba(0,255,204,.01));'
        + 'border-color:rgba(0,255,204,.5);'
        + 'box-shadow:inset 0 0 40px rgba(0,255,204,.05);}'

        /* бейдж «хит выбора» */
        + '#' + MODAL_ID + ' .yg-badge{position:absolute;top:-1px;left:50%;'
        + 'transform:translateX(-50%);padding:5px 14px;border-radius:0 0 10px 10px;'
        + 'background:linear-gradient(135deg,#00ffcc,#00cc99);color:#0d0f14;'
        + 'font-size:10.5px;font-weight:700;letter-spacing:1.1px;white-space:nowrap;'
        + 'animation:ygPulse 2.1s ease-in-out infinite;}'

        + '#' + MODAL_ID + ' .yg-card h3{margin:6px 0 5px;font-size:14.5px;'
        + 'color:#e8edf4;letter-spacing:.7px;text-transform:uppercase;line-height:1.35;}'
        + '#' + MODAL_ID + ' .yg-card .yg-sub{margin:0 0 16px;font-size:12px;'
        + 'color:#7d8798;line-height:1.5;}'

        /* список преимуществ */
        + '#' + MODAL_ID + ' .yg-list{list-style:none;margin:0 0 18px;padding:0;'
        + 'flex:1;}'
        + '#' + MODAL_ID + ' .yg-list li{position:relative;padding:0 0 9px 22px;'
        + 'font-size:12.5px;color:#aab4c2;line-height:1.5;}'
        + '#' + MODAL_ID + ' .yg-list li:before{content:"✓";position:absolute;'
        + 'left:0;top:0;color:#00ffcc;font-weight:700;}'

        /* цена */
        + '#' + MODAL_ID + ' .yg-price{display:flex;align-items:baseline;gap:9px;'
        + 'margin-bottom:4px;flex-wrap:wrap;}'
        + '#' + MODAL_ID + ' .yg-old{color:#68717f;font-size:15px;'
        + 'text-decoration:line-through;}'
        + '#' + MODAL_ID + ' .yg-new{color:#00ffcc;'
        + 'font-size:clamp(26px,4.6vw,34px);font-weight:700;line-height:1;'
        + 'text-shadow:0 0 18px rgba(0,255,204,.45);}'
        + '#' + MODAL_ID + ' .yg-save{display:inline-block;padding:3px 9px;'
        + 'border-radius:6px;background:rgba(255,80,80,.14);color:#ff7676;'
        + 'font-size:11px;font-weight:700;letter-spacing:.6px;margin-bottom:16px;}'

        /* кнопка тарифа */
        + '#' + MODAL_ID + ' .yg-cta{position:relative;overflow:hidden;width:100%;'
        + 'padding:15px 18px;border:0;border-radius:10px;cursor:pointer;'
        + 'font:700 13.5px/1 Arial,sans-serif;letter-spacing:1.1px;'
        + 'text-transform:uppercase;color:#0d0f14;'
        + 'background:linear-gradient(135deg,#00ffcc 0%,#00cc99 100%);'
        + 'box-shadow:0 0 18px rgba(0,255,204,.35);'
        + 'transition:transform .18s,box-shadow .22s;}'
        + '#' + MODAL_ID + ' .yg-cta:hover{transform:translateY(-2px);'
        + 'box-shadow:0 0 30px rgba(0,255,204,.6);}'
        + '#' + MODAL_ID + ' .yg-cta:active{transform:translateY(0) scale(.985);}'
        + '#' + MODAL_ID + ' .yg-cta:disabled{opacity:.55;cursor:wait;'
        + 'transform:none;}'
        + '#' + MODAL_ID + ' .yg-cta:after{content:"";position:absolute;top:0;'
        + 'left:-120%;width:60%;height:100%;'
        + 'background:linear-gradient(90deg,transparent,rgba(255,255,255,.55),transparent);'
        + 'transform:skewX(-22deg);animation:ygShine 3.4s ease-in-out infinite;}'
        + '#' + MODAL_ID + ' .yg-card:not(.yg-featured) .yg-cta{'
        + 'background:transparent;color:#00ffcc;'
        + 'border:1.5px solid rgba(0,255,204,.55);box-shadow:none;}'
        + '#' + MODAL_ID + ' .yg-card:not(.yg-featured) .yg-cta:hover{'
        + 'background:rgba(0,255,204,.1);box-shadow:0 0 22px rgba(0,255,204,.25);}'
        + '#' + MODAL_ID + ' .yg-card:not(.yg-featured) .yg-cta:after{display:none;}'

        /* строка доверия (вместо таймера) */
        + '#' + MODAL_ID + ' .yg-trust{display:flex;align-items:center;'
        + 'justify-content:center;gap:9px;padding:14px 16px;'
        + 'background:rgba(0,255,204,.045);'
        + 'border:1px solid rgba(0,255,204,.22);border-radius:12px;'
        + 'font-size:12px;line-height:1.5;color:#98a2b0;text-align:center;'
        + 'flex-wrap:wrap;}'
        + '#' + MODAL_ID + ' .yg-trust b{color:#00ffcc;font-weight:700;}'
        + '#' + MODAL_ID + ' .yg-trust .yg-trust-icon{font-size:14px;'
        + 'flex-shrink:0;}'

        /* анимации */
        + '@keyframes ygPulse{0%,100%{box-shadow:0 0 0 0 rgba(0,255,204,.5);}'
        + '50%{box-shadow:0 0 0 7px rgba(0,255,204,0);}}'
        + '@keyframes ygShine{0%{left:-120%;}55%,100%{left:130%;}}'

        /* мобильные */
        + '@media(max-width:640px){'
        + '#' + MODAL_ID + ' .yg-panel{padding:28px 16px 20px;border-radius:16px;}'
        + '#' + MODAL_ID + ' .yg-grid{grid-template-columns:1fr;gap:14px;}'
        + '}'
        + '@media(prefers-reduced-motion:reduce){'
        + '#' + MODAL_ID + ' *{animation:none !important;transition:none !important;}'
        + '}';

        var style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = css;
        document.head.appendChild(style);
    }

    /* =========================== РАЗМЕТКА ОКНА =========================== */

    function esc(s) {
        return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function discountPercent(price, oldPrice) {
        return Math.round((1 - price / oldPrice) * 100);
    }

    function buildCard(plan) {
        var features = plan.features.map(function (f) {
            return '<li>' + esc(f) + '</li>';
        }).join('');

        return ''
        + '<div class="yg-card' + (plan.featured ? ' yg-featured' : '') + '">'
        +   (plan.badge ? '<div class="yg-badge">' + esc(plan.badge) + '</div>' : '')
        +   '<h3>' + esc(plan.title) + '</h3>'
        +   '<p class="yg-sub">' + esc(plan.subtitle) + '</p>'
        +   '<ul class="yg-list">' + features + '</ul>'
        +   '<div class="yg-price">'
        +     '<span class="yg-old">' + plan.oldPrice + ' ₽</span>'
        +     '<span class="yg-new">' + plan.price + ' ₽</span>'
        +   '</div>'
        +   '<div class="yg-save">ВЫГОДА '
        +     discountPercent(plan.price, plan.oldPrice) + '%</div>'
        +   '<button type="button" class="yg-cta" data-plan="' + esc(plan.id) + '">'
        +     esc(plan.cta) + '</button>'
        + '</div>';
    }

    function buildModal() {
        var existing = document.getElementById(MODAL_ID);
        if (existing) existing.parentNode.removeChild(existing);

        var cards = PLANS.map(buildCard).join('');

        var html = ''
        + '<div class="yg-backdrop" data-yg-close="1"></div>'
        + '<div class="yg-panel" role="dialog" aria-modal="true" '
        + 'aria-labelledby="ygPaywallTitle">'
        +   '<button type="button" class="yg-close" aria-label="Закрыть" '
        +     'data-yg-close="1">&times;</button>'
        +   '<div class="yg-head">'
        +     '<h2 id="ygPaywallTitle">Выбери свой формат</h2>'
        +     '<p>Программа собирается по твоим ответам: цель, опыт, '
        +       'инвентарь и максимумы ПМ.</p>'
        +   '</div>'
        +   '<div class="yg-grid">' + cards + '</div>'
        +   '<div class="yg-trust">'
        +     '<span class="yg-trust-icon">🔒</span>'
        +     '<span>Оплата через <b>ЮKassa</b> · доступ открывается сразу после оплаты · '
        +       'оплата защищена</span>'
        +   '</div>'
        + '</div>';

        var modal = document.createElement('div');
        modal.id = MODAL_ID;
        modal.innerHTML = html;
        document.body.appendChild(modal);

        // поочерёдное появление карточек
        setTimeout(function () {
            var cs = modal.querySelectorAll('.yg-card');
            for (var i = 0; i < cs.length; i++) {
                cs[i].style.transitionDelay = (110 + i * 90) + 'ms';
            }
        }, 40);

        return modal;
    }

    /* ========================== ОТКРЫТИЕ / ЗАКРЫТИЕ ========================== */

    function openModal() {
        injectStyles();
        var modal = buildModal();
        lastFocused = document.activeElement;

        void modal.offsetWidth;                 // форсируем reflow для анимации
        modal.classList.add('yg-open');
        document.body.style.overflow = 'hidden';

        var closeBtn = modal.querySelector('.yg-close');
        if (closeBtn) closeBtn.focus();

        console.log(TAG, 'окно с тарифами открыто');
    }

    function closeModal() {
        var modal = document.getElementById(MODAL_ID);
        if (!modal) return;

        modal.classList.remove('yg-open');
        document.body.style.overflow = '';

        setTimeout(function () {
            if (modal.parentNode) modal.parentNode.removeChild(modal);
        }, 300);

        if (lastFocused && lastFocused.focus) {
            try { lastFocused.focus(); } catch (e) {}
        }
        console.log(TAG, 'окно закрыто');
    }

    /* ============================ ВЫБОР ТАРИФА ============================ */

    function choosePlan(planId, buttonEl) {
        var plan = null;
        for (var i = 0; i < PLANS.length; i++) {
            if (PLANS[i].id === planId) { plan = PLANS[i]; break; }
        }
        if (!plan) return;

        console.log(TAG, 'выбран тариф:', plan.id, plan.price + ' ₽');

        if (buttonEl) {
            buttonEl.disabled = true;
            buttonEl.textContent = 'ПОДОЖДИ...';
        }

        // === ТОЧКА ИНТЕГРАЦИИ ПЛАТЁЖКИ ===
        // Когда подключишь ЮKassa / Robokassa — замени тело setTimeout
        // на реальный redirect:
        //   window.location.href = '/pay?plan=' + plan.id;
        setTimeout(function () {
            closeModal();
            if (typeof window.redirectToPayment === 'function') {
                window.redirectToPayment();
            } else {
                alert('Тариф «' + plan.title + '» — ' + plan.price + ' ₽\n\n' +
                      'Платёжная система ещё не подключена.');
            }
        }, 450);
    }

    /* ======================= ПЕРЕХВАТ КНОПКИ «199 ₽» ======================= */

    function isTargetButton(el) {
        if (!el || el.tagName !== 'BUTTON') return false;

        // свою карточку и само окно не перехватываем — у них свои обработчики
        if (el.closest && (el.closest('#' + MODAL_ID) ||
                          el.closest('#ygNutritionCard'))) return false;

        var txt = (el.textContent || '').toUpperCase();
        return txt.indexOf('30 ДНЕЙ') !== -1 ||
               txt.indexOf('ПОЛНЫЙ ПЛАН') !== -1 ||
               txt.indexOf('ПОЛУЧИТЬ ПРОГРАММУ') !== -1 ||
               (txt.indexOf('199') !== -1 && txt.indexOf('₽') !== -1) ||
               (txt.indexOf('299') !== -1 && txt.indexOf('₽') !== -1);
    }

    document.addEventListener('click', function (e) {
        var el = e.target;

        // 1) клик внутри модалки
        var modal = document.getElementById(MODAL_ID);
        if (modal && modal.contains(el)) {
            if (el.closest && el.closest('[data-yg-close]')) {
                e.preventDefault();
                closeModal();
                return;
            }
            var cta = el.closest ? el.closest('.yg-cta') : null;
            if (cta) {
                e.preventDefault();
                choosePlan(cta.getAttribute('data-plan'), cta);
            }
            return;
        }

        // 2) клик по кнопке «ПОЛУЧИТЬ ПОЛНЫЙ ПЛАН НА 30 ДНЕЙ ЗА 199 ₽»
        var btn = el;
        while (btn && btn !== document) {
            if (isTargetButton(btn)) {
                e.preventDefault();
                e.stopPropagation();

                // не ломаем фикс видимости калькулятора
                if (window.YourGymFix && window.YourGymFix.keepVisible) {
                    window.YourGymFix.keepVisible();
                }
                openModal();
                return;
            }
            btn = btn.parentNode;
        }
    }, true);

    /* ============================ КЛАВИАТУРА ============================ */

    document.addEventListener('keydown', function (e) {
        var modal = document.getElementById(MODAL_ID);
        if (!modal || !modal.classList.contains('yg-open')) return;

        if (e.key === 'Escape') {
            e.preventDefault();
            closeModal();
            return;
        }

        // ловушка фокуса внутри окна
        if (e.key === 'Tab') {
            var focusables = modal.querySelectorAll('button');
            if (!focusables.length) return;
            var first = focusables[0];
            var last = focusables[focusables.length - 1];

            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault(); last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault(); first.focus();
            }
        }
    });

    /* ============================== ПУБЛИЧНОЕ ============================== */

    window.YourGymPaywall = {
        open: openModal,
        close: closeModal,
        plans: PLANS
    };

    console.log('✅ ' + TAG + ' загружен');
})();
