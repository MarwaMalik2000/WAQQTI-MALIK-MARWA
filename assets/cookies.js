/* ============================================================
   WAQQTI — assets/cookies.js
   Bannière de consentement cookies (RGPD) + chargement analytics.
   - Cookies essentiels (auth Supabase, langue) : toujours actifs.
   - Statistiques (analytics) : chargées UNIQUEMENT après consentement.
   Auto-injecté : il suffit d'ajouter <script defer src="/assets/cookies.js"></script>
   ============================================================ */
(function () {
  'use strict';

  var KEY = 'waqqti_cookie_consent'; // 'accepted' | 'refused'
  var lang = (localStorage.getItem('waqqti_lang') || document.documentElement.lang || 'fr').slice(0, 2);

  var T = {
    fr: {
      msg: 'Nous utilisons des cookies pour faire fonctionner le site et, avec votre accord, mesurer son audience.',
      accept: 'Accepter',
      refuse: 'Refuser',
      more: 'En savoir plus'
    },
    ar: {
      msg: 'نستخدم ملفات تعريف الارتباط لتشغيل الموقع، وبموافقتك، لقياس الزيارات.',
      accept: 'موافق',
      refuse: 'رفض',
      more: 'معرفة المزيد'
    }
  };
  var t = T[lang] || T.fr;

  /* --- Chargement analytics (Vercel Web Analytics — sans cookie, gratuit sur Vercel) --- */
  function loadAnalytics() {
    if (window.__wqAnalyticsLoaded) return;
    window.__wqAnalyticsLoaded = true;
    window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
    var s = document.createElement('script');
    s.defer = true;
    s.src = '/_vercel/insights/script.js';
    document.head.appendChild(s);
  }

  function apply(consent) {
    window.WQ_CONSENT = { analytics: consent === 'accepted' };
    document.dispatchEvent(new CustomEvent('wq:consent', { detail: window.WQ_CONSENT }));
    if (consent === 'accepted') loadAnalytics();
  }

  function save(consent) {
    try { localStorage.setItem(KEY, consent); } catch (e) {}
    apply(consent);
    var b = document.getElementById('wq-cookie');
    if (b) { b.style.opacity = '0'; b.style.transform = 'translateY(20px)'; setTimeout(function () { b.remove(); }, 300); }
  }

  function banner() {
    var css = document.createElement('style');
    css.textContent =
      '#wq-cookie{position:fixed;left:16px;right:16px;bottom:16px;z-index:99999;max-width:720px;margin:0 auto;' +
      'background:#fff;color:#3D1F00;border:1px solid rgba(61,31,0,.12);border-radius:18px;' +
      'box-shadow:0 12px 50px rgba(61,31,0,.18);padding:18px 20px;' +
      'font-family:"DM Sans",system-ui,sans-serif;font-size:14px;line-height:1.5;' +
      'display:flex;flex-wrap:wrap;align-items:center;gap:14px;' +
      'opacity:0;transform:translateY(20px);transition:opacity .3s cubic-bezier(.22,.9,.32,1),transform .3s cubic-bezier(.22,.9,.32,1)}' +
      '#wq-cookie p{flex:1 1 260px;margin:0;color:#7A5030}' +
      '#wq-cookie a{color:#D26F1A;text-decoration:underline}' +
      '#wq-cookie .wq-btns{display:flex;gap:10px;flex:0 0 auto}' +
      '#wq-cookie button{cursor:pointer;border:none;padding:11px 20px;border-radius:50px;' +
      'font-family:inherit;font-size:14px;font-weight:600;transition:transform .15s,background .2s}' +
      '#wq-cookie button:active{transform:scale(.96)}' +
      '#wq-cookie .wq-accept{background:#F68423;color:#fff}' +
      '#wq-cookie .wq-accept:hover{background:#D26F1A}' +
      '#wq-cookie .wq-refuse{background:transparent;color:#3D1F00;border:1px solid rgba(61,31,0,.2)}' +
      '#wq-cookie .wq-refuse:hover{border-color:#F68423}';
    document.head.appendChild(css);

    var el = document.createElement('div');
    el.id = 'wq-cookie';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', 'Consentement cookies');
    if (lang === 'ar') el.dir = 'rtl';
    el.innerHTML =
      '<p>' + t.msg + ' <a href="/confidentialite.html">' + t.more + '</a></p>' +
      '<div class="wq-btns">' +
      '<button class="wq-refuse" type="button">' + t.refuse + '</button>' +
      '<button class="wq-accept" type="button">' + t.accept + '</button>' +
      '</div>';
    document.body.appendChild(el);
    requestAnimationFrame(function () { el.style.opacity = '1'; el.style.transform = 'translateY(0)'; });
    el.querySelector('.wq-accept').addEventListener('click', function () { save('accepted'); });
    el.querySelector('.wq-refuse').addEventListener('click', function () { save('refused'); });
  }

  function init() {
    var prev = null;
    try { prev = localStorage.getItem(KEY); } catch (e) {}
    if (prev === 'accepted' || prev === 'refused') { apply(prev); return; }
    if (document.body) banner();
    else document.addEventListener('DOMContentLoaded', banner);
  }

  // Permet de rouvrir le choix depuis un lien "Gérer les cookies" : WQCookies.reset()
  window.WQCookies = {
    reset: function () { try { localStorage.removeItem(KEY); } catch (e) {} banner(); }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
