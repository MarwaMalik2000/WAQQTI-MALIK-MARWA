/* ============================================================
   WAQQTI — assets/antispam.js
   Anti-spam non intrusif pour tous les <form> :
   1) Champ "honeypot" invisible : rempli => c'est un bot => on bloque.
   2) Délai minimum : un envoi en moins de 2s => bot => on bloque.
   Drop-in : <script defer src="/assets/antispam.js"></script>
   N'affecte pas les handlers existants (blocage en phase capture).
   ============================================================ */
(function () {
  'use strict';
  var MIN_MS = 2000;
  var FIELD = 'wq_hp_website'; // nom neutre, attractif pour les bots

  function protect(form) {
    if (form.__wqProtected) return;
    form.__wqProtected = true;
    // honeypot
    var wrap = document.createElement('div');
    wrap.setAttribute('aria-hidden', 'true');
    wrap.style.cssText = 'position:absolute!important;left:-9999px!important;top:auto!important;width:1px;height:1px;overflow:hidden;';
    var hp = document.createElement('input');
    hp.type = 'text';
    hp.name = FIELD;
    hp.tabIndex = -1;
    hp.autocomplete = 'off';
    hp.setAttribute('aria-hidden', 'true');
    wrap.appendChild(hp);
    form.appendChild(wrap);
    form.__wqStart = Date.now();
  }

  function scan() {
    var forms = document.querySelectorAll('form');
    for (var i = 0; i < forms.length; i++) protect(forms[i]);
  }

  // Blocage prioritaire (capture) : s'exécute avant les handlers de la page.
  document.addEventListener('submit', function (e) {
    var form = e.target;
    if (!form || form.tagName !== 'FORM') return;
    var hp = form.querySelector('input[name="' + FIELD + '"]');
    var tooFast = form.__wqStart && (Date.now() - form.__wqStart) < MIN_MS;
    if ((hp && hp.value) || tooFast) {
      e.preventDefault();
      e.stopImmediatePropagation();
      if (window.WAQQTI && WAQQTI.toast) WAQQTI.toast('Envoi bloqué. Réessayez.', 'warn');
      return false;
    }
  }, true);

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', scan);
  else scan();
  // Re-scan pour les formulaires injectés dynamiquement (SPA gérant).
  new MutationObserver(scan).observe(document.documentElement, { childList: true, subtree: true });
})();
