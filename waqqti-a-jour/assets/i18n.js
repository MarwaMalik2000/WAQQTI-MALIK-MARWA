/* ============================================================
   WAQQTI — assets/i18n.js
   Moteur de traduction FR / AR (arabe maghrébin).
   ⚠️ À charger dans le <head> (PAS en fin de <body>) :
      generateDates() appelle WQ.jourCourt() dès le chargement.

   Principe :
   - Le CONTENU métier (noms de prestations, etc.) vient de Supabase
     et reste TOUJOURS en français → jamais traduit.
   - Seuls les LIBELLÉS d'interface sont traduits, via data-i18n.

   Utilisation dans le HTML :
     <span data-i18n="nav.reserver">Réserver</span>
     <input data-i18n-attr="placeholder:form.nom">
   Changer de langue :
     WQ.setLang('ar');  // ou 'fr'
   Persistance : localStorage['waqqti_lang'] · Événement : 'wq:langchange'
   ============================================================ */
(function () {
  'use strict';

  var STORAGE_KEY = 'waqqti_lang';
  var DEFAULT_LANG = 'fr';

  /* ---- Dictionnaire des libellés d'interface ---- */
  var DICT = {
    fr: {
      'nav.reserver': 'Réserver',
      'nav.connexion': 'Connexion',
      'nav.espace_pro': 'Espace pro',
      'common.chargement': 'Chargement…',
      'common.retour': 'Retour',
      'common.suivant': 'Suivant',
      'common.confirmer': 'Confirmer',
      'common.annuler': 'Annuler',
      'common.enregistrer': 'Enregistrer',
      'common.fermer': 'Fermer',
      'booking.titre': 'Réserver un rendez-vous',
      'booking.prestation': 'Choisir une prestation',
      'booking.date': 'Date & heure',
      'booking.coordonnees': 'Vos coordonnées',
      'booking.confirmation': 'Réservation confirmée',
      'booking.matin': 'Matin',
      'booking.apresmidi': 'Après-midi',
      'booking.premier_dispo': 'Premier disponible',
      'form.nom': 'Votre nom',
      'form.telephone': 'Téléphone',
      'form.note': 'Note (facultatif)',
      'pro.agenda': 'Agenda',
      'pro.acomptes': 'Acomptes',
      'pro.clients': 'Clients',
      'pro.prestations': 'Prestations',
      'pro.equipe': 'Équipe',
      'pro.parametres': 'Paramètres',
      'pro.abonnement': 'Abonnement',
      'common.ou': '— ou —',
      'common.langue': 'العربية',
      'nav.annuaire': 'Annuaire des salons',
      'nav.fonctions': 'Fonctionnalités',
      'nav.formules': 'Formules',
      'nav.comment': 'Comment ça marche',
      'nav.espace_client': 'Espace client',
      'nav.essai': 'Essai gratuit 30j →',
      'hero.badge': 'Première plateforme beauté en Algérie',
      'hero.titre': 'Votre salon, <em>réservé</em><br/>en ligne 24h/24',
      'hero.p': 'Waqqti connecte vos clients à votre salon automatiquement. Confirmations SMS, agenda intelligent, zéro appel manqué. Commencez gratuitement pendant 30 jours.',
      'hero.cta1': 'Démarrer gratuitement →',
      'hero.cta2': 'Voir comment ça marche',
      'sec.fonctions': 'Tout ce dont votre salon a besoin,<br/>dans une seule app',
      'sec.formules': 'Des formules pour chaque salon',
      'sec.comment': 'Opérationnel en 24 heures',
      'sec.contact': 'Prêt(e) à moderniser votre salon ?',
      'book.retour': '← Retour',
      'book.aide': '💬 Aide WhatsApp',
      'book.step1': 'Prestation',
      'book.step2': 'Date & heure',
      'book.step3': 'Coordonnées',
      'book.step4': 'Confirmation',
      'book.choix_prestation': 'Choisissez votre prestation',
      'book.choix_prestation_sub': 'Sélectionnez le service souhaité',
      'book.choix_date': 'Choisissez la date',
      'book.coordonnees_titre': 'Vos coordonnées',
      'book.nom_label': 'Nom complet *',
      'book.tel_label': 'Numéro de téléphone *',
      'book.continuer': 'Continuer →',
      'ann.titre': 'Trouvez votre salon',
      'ann.sous': 'Réservez en ligne chez les meilleurs salons de beauté et coiffure d\'Algérie.',
      'ann.recherche_ph': '🔍 Nom du salon, ville, adresse…',
      'ann.rechercher': 'Rechercher',
      'ann.autour': '📍 Autour de moi',
      'auth.client': 'Espace client Waqqti',
      'auth.google': 'Continuer avec Google',
      'auth.retour_accueil': '← Retour à l\'accueil'
    },
    ar: {
      'nav.reserver': 'احجز',
      'nav.connexion': 'تسجيل الدخول',
      'nav.espace_pro': 'فضاء المحترف',
      'common.chargement': 'جاري التحميل…',
      'common.retour': 'رجوع',
      'common.suivant': 'التالي',
      'common.confirmer': 'تأكيد',
      'common.annuler': 'إلغاء',
      'common.enregistrer': 'حفظ',
      'common.fermer': 'إغلاق',
      'booking.titre': 'احجز موعدًا',
      'booking.prestation': 'اختر خدمة',
      'booking.date': 'التاريخ والوقت',
      'booking.coordonnees': 'معلوماتك',
      'booking.confirmation': 'تم تأكيد الحجز',
      'booking.matin': 'صباحًا',
      'booking.apresmidi': 'مساءً',
      'booking.premier_dispo': 'أول متاح',
      'form.nom': 'اسمك',
      'form.telephone': 'الهاتف',
      'form.note': 'ملاحظة (اختياري)',
      'pro.agenda': 'الأجندة',
      'pro.acomptes': 'العرابين',
      'pro.clients': 'الزبائن',
      'pro.prestations': 'الخدمات',
      'pro.equipe': 'الفريق',
      'pro.parametres': 'الإعدادات',
      'pro.abonnement': 'الاشتراك',
      'common.ou': '— أو —',
      'common.langue': 'FR',
      'nav.annuaire': 'دليل الصالونات',
      'nav.fonctions': 'المميزات',
      'nav.formules': 'الصيغ',
      'nav.comment': 'كيف يعمل',
      'nav.espace_client': 'فضاء الزبون',
      'nav.essai': 'تجربة مجانية 30 يوم →',
      'hero.badge': 'أول منصة تجميل في الجزائر',
      'hero.titre': 'صالونك <em>محجوز</em><br/>عبر الإنترنت 24/24',
      'hero.p': 'وقتي يربط زبائنك بصالونك تلقائيًا. تأكيدات عبر SMS، أجندة ذكية، دون أي مكالمة فائتة. ابدأ مجانًا لمدة 30 يومًا.',
      'hero.cta1': 'ابدأ مجانًا →',
      'hero.cta2': 'شاهد كيف يعمل',
      'sec.fonctions': 'كل ما يحتاجه صالونك<br/>في تطبيق واحد',
      'sec.formules': 'صيغ تناسب كل صالون',
      'sec.comment': 'جاهز خلال 24 ساعة',
      'sec.contact': 'مستعد لتحديث صالونك؟',
      'book.retour': '→ رجوع',
      'book.aide': '💬 مساعدة واتساب',
      'book.step1': 'الخدمة',
      'book.step2': 'التاريخ والوقت',
      'book.step3': 'المعلومات',
      'book.step4': 'التأكيد',
      'book.choix_prestation': 'اختر خدمتك',
      'book.choix_prestation_sub': 'حدد الخدمة المطلوبة',
      'book.choix_date': 'اختر التاريخ',
      'book.coordonnees_titre': 'معلوماتك',
      'book.nom_label': 'الاسم الكامل *',
      'book.tel_label': 'رقم الهاتف *',
      'book.continuer': 'متابعة →',
      'ann.titre': 'اعثر على صالونك',
      'ann.sous': 'احجز عبر الإنترنت لدى أفضل صالونات التجميل والحلاقة في الجزائر.',
      'ann.recherche_ph': '🔍 اسم الصالون، المدينة، العنوان…',
      'ann.rechercher': 'بحث',
      'ann.autour': '📍 بالقرب مني',
      'auth.client': 'فضاء زبون وقتي',
      'auth.google': 'المتابعة عبر Google',
      'auth.retour_accueil': '→ العودة إلى الرئيسية'
    }
  };

  /* ---- Calendrier : jours + mois (arabe maghrébin, chiffres occidentaux) ---- */
  var JOURS_COURT = {
    fr: ['dim', 'lun', 'mar', 'mer', 'jeu', 'ven', 'sam'],
    ar: ['أحد', 'إثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت']
  };
  var JOURS_LONG = {
    fr: ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'],
    ar: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
  };
  // Noms de mois maghrébins (janvier→جانفي, etc.)
  var MOIS = {
    fr: ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'],
    ar: ['جانفي', 'فيفري', 'مارس', 'أفريل', 'ماي', 'جوان', 'جويلية', 'أوت', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
  };

  /* ---- État courant (lu tout de suite pour éviter le flash) ---- */
  var current = (function () {
    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      return (saved === 'fr' || saved === 'ar') ? saved : DEFAULT_LANG;
    } catch (e) { return DEFAULT_LANG; }
  })();

  function toDate(d) { return (d instanceof Date) ? d : new Date(d); }

  var WQ = {
    /* Traduction d'une clé (fallback : la clé elle-même) */
    t: function (key) {
      var table = DICT[current] || DICT.fr;
      return (key in table) ? table[key] : (DICT.fr[key] || key);
    },

    getLang: function () { return current; },

    /* Change la langue, applique, persiste, notifie */
    setLang: function (lang) {
      if (lang !== 'fr' && lang !== 'ar') return;
      current = lang;
      try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) {}
      WQ.applyDir();
      WQ.apply();
      document.dispatchEvent(new CustomEvent('wq:langchange', { detail: { lang: lang } }));
    },

    toggle: function () { WQ.setLang(current === 'fr' ? 'ar' : 'fr'); },

    /* Applique la direction du document (RTL en arabe, LTR en français) */
    applyDir: function () {
      var html = document.documentElement;
      html.setAttribute('lang', current);
      html.setAttribute('dir', current === 'ar' ? 'rtl' : 'ltr');
    },

    /* Traduit tous les [data-i18n], [data-i18n-html] et [data-i18n-attr] présents */
    apply: function (root) {
      root = root || document;
      root.querySelectorAll('[data-i18n]').forEach(function (el) {
        el.textContent = WQ.t(el.getAttribute('data-i18n'));
      });
      // data-i18n-html : la traduction peut contenir du HTML (<br>, <em>…)
      root.querySelectorAll('[data-i18n-html]').forEach(function (el) {
        el.innerHTML = WQ.t(el.getAttribute('data-i18n-html'));
      });
      // data-i18n-attr="placeholder:form.nom;title:common.retour"
      root.querySelectorAll('[data-i18n-attr]').forEach(function (el) {
        el.getAttribute('data-i18n-attr').split(';').forEach(function (pair) {
          var kv = pair.split(':');
          if (kv.length === 2) el.setAttribute(kv[0].trim(), WQ.t(kv[1].trim()));
        });
      });
      WQ.wireToggles(root);
    },

    /* Câble tout bouton [data-lang-toggle] : libellé = langue opposée + clic */
    wireToggles: function (root) {
      root = root || document;
      root.querySelectorAll('[data-lang-toggle]').forEach(function (el) {
        el.textContent = (current === 'fr') ? 'العربية' : 'FR';
        el.setAttribute('dir', 'ltr');
        if (!el._wqWired) {
          el._wqWired = true;
          el.addEventListener('click', function () { WQ.toggle(); });
        }
      });
    },

    /* Jour court : "mar" / "ثلا" */
    jourCourt: function (d) { return JOURS_COURT[current][toDate(d).getDay()]; },
    /* Jour long : "mardi" / "الثلاثاء" */
    jourLong: function (d) { return JOURS_LONG[current][toDate(d).getDay()]; },
    /* Nom de mois : "mars" / "مارس" */
    moisNom: function (m) { return MOIS[current][(m instanceof Date) ? m.getMonth() : m]; },

    /* Date lisible : "mar 12 mars" (chiffres occidentaux dans les deux langues) */
    dateLisible: function (d) {
      d = toDate(d);
      return WQ.jourCourt(d) + ' ' + d.getDate() + ' ' + WQ.moisNom(d.getMonth());
    }
  };

  /* Police arabe quand la page passe en RTL (nécessite Tajawal/Amiri chargées) */
  try {
    var st = document.createElement('style');
    st.textContent =
      '[dir="rtl"]{font-family:"Tajawal","DM Sans",sans-serif}' +
      '[dir="rtl"] h1,[dir="rtl"] h2,[dir="rtl"] h3,[dir="rtl"] .card-title,[dir="rtl"] .logo,[dir="rtl"] .brand{font-family:"Amiri","Cormorant Garamond",serif}';
    (document.head || document.documentElement).appendChild(st);
  } catch (e) {}

  /* Applique la direction immédiatement (anti-flash), puis les libellés au chargement */
  WQ.applyDir();
  document.addEventListener('DOMContentLoaded', function () { WQ.apply(); });

  window.WQ = WQ;
})();
