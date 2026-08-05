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
      'pro.clients': 'Clients',
      'pro.prestations': 'Prestations',
      'pro.equipe': 'Équipe',
      'pro.parametres': 'Paramètres',
      'pro.abonnement': 'Abonnement'
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
      'pro.clients': 'الزبائن',
      'pro.prestations': 'الخدمات',
      'pro.equipe': 'الفريق',
      'pro.parametres': 'الإعدادات',
      'pro.abonnement': 'الاشتراك'
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

    /* Traduit tous les [data-i18n] et [data-i18n-attr] présents */
    apply: function (root) {
      root = root || document;
      root.querySelectorAll('[data-i18n]').forEach(function (el) {
        el.textContent = WQ.t(el.getAttribute('data-i18n'));
      });
      // data-i18n-attr="placeholder:form.nom;title:common.retour"
      root.querySelectorAll('[data-i18n-attr]').forEach(function (el) {
        el.getAttribute('data-i18n-attr').split(';').forEach(function (pair) {
          var kv = pair.split(':');
          if (kv.length === 2) el.setAttribute(kv[0].trim(), WQ.t(kv[1].trim()));
        });
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

  /* Applique la direction immédiatement (anti-flash), puis les libellés au chargement */
  WQ.applyDir();
  document.addEventListener('DOMContentLoaded', function () { WQ.apply(); });

  window.WQ = WQ;
})();
