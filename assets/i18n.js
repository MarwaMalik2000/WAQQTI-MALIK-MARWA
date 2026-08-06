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
      'book.ouvert': 'Ouvert maintenant',
      'book.pref_titre': 'Choisissez votre préférence',
      'book.pref_sub': 'Avec qui souhaitez-vous prendre rendez-vous ?',
      'book.dates_sub': 'Faites défiler pour voir plus de dates',
      'book.coord_sub': 'Nous enverrons une confirmation par SMS',
      'book.tel_hint': 'Nous vous enverrons un SMS de confirmation et un rappel 24h avant',
      'book.note_label': 'Note pour le salon (optionnel)',
      'book.confirme_titre': 'Réservation confirmée !',
      'book.confirme_sub': 'Un SMS de confirmation vient d\'être envoyé à votre numéro',
      'book.lbl_salon': 'Salon :',
      'book.lbl_service': 'Service :',
      'book.lbl_date': 'Date :',
      'book.lbl_heure': 'Heure :',
      'book.lbl_avec': 'Avec :',
      'book.lbl_prix': 'Prix :',
      'book.annuler_note': 'Pour annuler ou modifier, contactez directement le salon.',
      'book.autre': 'Faire une autre réservation',
      'book.footer': 'Réservation propulsée par <a href="https://www.waqqti.com" target="_blank" style="color:var(--or);text-decoration:none;font-weight:600">Waqqti</a> · La référence beauté en Algérie',
      'book.recap_prestation': 'Prestation choisie',
      'book.a_selectionner': 'À sélectionner',
      'book.a_remplir': 'À remplir',
      'book.confirmer_resa': 'Confirmer ma réservation ✓',
      'book.enregistrement': '⏳ Enregistrement...',
      'book.peu_importe': 'Peu importe',
      'book.acompte_requis': 'Acompte requis',
      'book.acompte_sub': 'Pour garantir votre rendez-vous, le salon demande un acompte. Effectuez le versement puis ajoutez une photo du reçu ci-dessous.',
      'book.coordonnees_lbl': 'Coordonnées :',
      'book.titulaire': 'Titulaire :',
      'book.rib_wa': 'Le salon vous communiquera ses coordonnées de paiement par WhatsApp.',
      'book.acompte_regler': 'Acompte à régler :',
      'book.payer_via': 'Payer via :',
      'book.apres_versement': 'Après le versement, ajoutez une photo/capture du reçu :',
      'book.envoyer_recu': '📤 Envoyer le reçu',
      'book.choisir_image': '⚠️ Choisissez d\'abord une image.',
      'book.envoi': '⏳ Envoi...',
      'book.recu_ok': '✅ Reçu envoyé ! Le salon va vérifier votre acompte.',
      'book.recu_envoye': '✓ Reçu envoyé',
      'book.reessayer': '📤 Réessayer',
      'ann.titre': 'Trouvez votre salon',
      'ann.sous': 'Réservez en ligne chez les meilleurs salons de beauté et coiffure d\'Algérie.',
      'ann.recherche_ph': '🔍 Nom du salon, ville, adresse…',
      'ann.rechercher': 'Rechercher',
      'ann.autour': '📍 Autour de moi',
      'auth.client': 'Espace client Waqqti',
      'auth.google': 'Continuer avec Google',
      'auth.retour_accueil': '← Retour à l\'accueil',
      'lbl.offre': 'Ce qu\'on vous offre',
      'lbl.tarifs': 'Tarifs',
      'lbl.simple': 'Simple et rapide',
      'sub.fonctions': 'Plus d\'appels manqués, plus de cahiers désorganisés. Waqqti gère tout à votre place.',
      'sub.formules': '30 jours d\'essai gratuit sur toutes les formules. Sans carte bancaire.',
      'sub.comment': 'On s\'occupe de tout. Vous nous envoyez vos prestations, on crée votre page.',
      'feat.resa.t': 'Réservation 24h/24',
      'feat.resa.d': 'Vos clients réservent depuis leur téléphone à n\'importe quelle heure. Notification instantanée.',
      'feat.sms.t': 'SMS automatiques',
      'feat.sms.d': 'Confirmation immédiate + rappel 24h avant le RDV. Zéro no-show, zéro effort.',
      'feat.agenda.t': 'Agenda intelligent',
      'feat.agenda.d': 'Vue calendrier claire. Gérez vos créneaux, vos pauses et votre équipe en un clic.',
      'feat.emp.t': 'Agenda par employé(e)',
      'feat.emp.d': 'Coiffeur, barbier, nail artist, esthéticien(ne) — chacun(e) a son agenda. Le client choisit son préféré.',
      'feat.lien.t': 'Lien unique salon',
      'feat.lien.d': 'Un lien à mettre dans votre bio Instagram, votre WhatsApp, ou à l\'affiche dans le salon.',
      'feat.secu.t': 'Données sécurisées',
      'feat.secu.d': 'Vos données et celles de vos clients sont chiffrées et hébergées en sécurité.',
      'plan.ess.name': 'Essentielle',
      'plan.ess.desc': 'Idéale pour démarrer',
      'plan.conf.name': 'Confort',
      'plan.conf.desc': 'Pour salons avec équipe (coiffeurs, barbiers, esthéticien·nes…)',
      'plan.prem.name': 'Premium',
      'plan.prem.desc': 'Pour grands salons / instituts',
      'plan.badge': '⭐ Le plus populaire',
      'plan.cta': 'Commencer l\'essai gratuit',
      'plan.mois': 'DA/mois',
      'pf.ess1': 'Réservation en ligne 24h/24',
      'pf.ess2': 'Agenda par siège (pas de nom d\'employé(e))',
      'pf.ess3': 'Ex : 4 sièges = 4 créneaux dispo / heure',
      'pf.ess4': '150 SMS automatiques / mois',
      'pf.ess5': 'Tableau de bord gérant',
      'pf.ess6': 'Support WhatsApp',
      'pf.conf1': 'Tout l\'Essentielle inclus',
      'pf.conf2': 'SMS illimités',
      'pf.conf3': 'Profil par employé(e) nommé(e)',
      'pf.conf4': 'Le client choisit son préféré(e)',
      'pf.conf5': 'Gestion des spécialités',
      'pf.conf6': 'Support prioritaire',
      'pf.prem1': 'Tout le Confort inclus',
      'pf.prem2': 'Agenda individuel par employé(e)',
      'pf.prem3': 'Chaque employé(e) gère son planning',
      'pf.prem4': 'Page salon personnalisée',
      'pf.prem5': '<strong>Mention « Recommandé » sur l\'app et le site</strong>',
      'pf.prem6': 'Gestionnaire de compte dédié',
      'step1.t': 'Vous nous contactez',
      'step1.d': 'Via WhatsApp. Vous choisissez votre formule et démarrez l\'essai 30j gratuit.',
      'step2.t': 'Vous envoyez vos prestations',
      'step2.d': 'Liste des services, durées et tarifs. On configure votre page en 24h max.',
      'step3.t': 'Vous partagez votre lien',
      'step3.d': 'Un lien unique pour votre salon : bio Instagram, WhatsApp, affiche.',
      'step4.t': 'Les RDV arrivent',
      'step4.d': 'Vos clients réservent en autonomie. Les SMS partent automatiquement.',
      'band.text': 'Opérationnel en 24h',
      'band.gratuit': '30 jours gratuit',
      'band.sans': 'Sans engagement',
      'cta.sub': '30 jours gratuits · Sans engagement · Opérationnel en 24h',
      'cta.btn': '💬 Démarrer sur WhatsApp'
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
      'book.ouvert': 'مفتوح الآن',
      'book.pref_titre': 'اختر تفضيلك',
      'book.pref_sub': 'مع من ترغب في الحجز؟',
      'book.dates_sub': 'مرّر لرؤية المزيد من التواريخ',
      'book.coord_sub': 'سنرسل لك تأكيدًا عبر رسالة SMS',
      'book.tel_hint': 'سنرسل لك رسالة تأكيد وتذكيرًا قبل الموعد بـ24 ساعة',
      'book.note_label': 'ملاحظة للصالون (اختياري)',
      'book.confirme_titre': 'تم تأكيد الحجز!',
      'book.confirme_sub': 'تم إرسال رسالة تأكيد إلى رقمك',
      'book.lbl_salon': 'الصالون:',
      'book.lbl_service': 'الخدمة:',
      'book.lbl_date': 'التاريخ:',
      'book.lbl_heure': 'الوقت:',
      'book.lbl_avec': 'مع:',
      'book.lbl_prix': 'السعر:',
      'book.annuler_note': 'للإلغاء أو التعديل، اتصل مباشرة بالصالون.',
      'book.autre': 'إجراء حجز آخر',
      'book.footer': 'حجز مدعوم من <a href="https://www.waqqti.com" target="_blank" style="color:var(--or);text-decoration:none;font-weight:600">Waqqti</a> · مرجع الجمال في الجزائر',
      'book.recap_prestation': 'الخدمة المختارة',
      'book.a_selectionner': 'يُرجى الاختيار',
      'book.a_remplir': 'يُرجى الملء',
      'book.confirmer_resa': 'أكّد حجزي ✓',
      'book.enregistrement': '⏳ جارٍ التسجيل...',
      'book.peu_importe': 'لا يهم',
      'book.acompte_requis': 'عربون مطلوب',
      'book.acompte_sub': 'لضمان موعدك، يطلب الصالون عربونًا. قم بالدفع ثم أضف صورة للإيصال أدناه.',
      'book.coordonnees_lbl': 'الإحداثيات:',
      'book.titulaire': 'صاحب الحساب:',
      'book.rib_wa': 'سيرسل لك الصالون إحداثيات الدفع عبر واتساب.',
      'book.acompte_regler': 'العربون المطلوب دفعه:',
      'book.payer_via': 'ادفع عبر:',
      'book.apres_versement': 'بعد الدفع، أضف صورة/لقطة شاشة للإيصال:',
      'book.envoyer_recu': '📤 إرسال الإيصال',
      'book.choisir_image': '⚠️ اختر صورة أولاً.',
      'book.envoi': '⏳ جارٍ الإرسال...',
      'book.recu_ok': '✅ تم إرسال الإيصال! سيتحقق الصالون من عربونك.',
      'book.recu_envoye': '✓ تم إرسال الإيصال',
      'book.reessayer': '📤 إعادة المحاولة',
      'ann.titre': 'اعثر على صالونك',
      'ann.sous': 'احجز عبر الإنترنت لدى أفضل صالونات التجميل والحلاقة في الجزائر.',
      'ann.recherche_ph': '🔍 اسم الصالون، المدينة، العنوان…',
      'ann.rechercher': 'بحث',
      'ann.autour': '📍 بالقرب مني',
      'auth.client': 'فضاء زبون وقتي',
      'auth.google': 'المتابعة عبر Google',
      'auth.retour_accueil': '→ العودة إلى الرئيسية',
      'lbl.offre': 'ما نقدّمه لك',
      'lbl.tarifs': 'الأسعار',
      'lbl.simple': 'بسيط وسريع',
      'sub.fonctions': 'لا مكالمات فائتة، لا دفاتر فوضوية. وقتي يدير كل شيء عنك.',
      'sub.formules': '30 يومًا تجربة مجانية على كل الصيغ. دون بطاقة بنكية.',
      'sub.comment': 'نحن نتكفّل بكل شيء. أرسل لنا خدماتك، وننشئ صفحتك.',
      'feat.resa.t': 'حجز 24/24',
      'feat.resa.d': 'يحجز زبائنك من هواتفهم في أي وقت. إشعار فوري.',
      'feat.sms.t': 'رسائل SMS تلقائية',
      'feat.sms.d': 'تأكيد فوري + تذكير قبل الموعد بـ24 ساعة. دون تغيّب، دون جهد.',
      'feat.agenda.t': 'أجندة ذكية',
      'feat.agenda.d': 'عرض تقويم واضح. تحكّم في مواعيدك وفتراتك وفريقك بنقرة واحدة.',
      'feat.emp.t': 'أجندة لكل موظف(ة)',
      'feat.emp.d': 'حلاق، مزيّن، فنان أظافر، أخصائي(ة) تجميل — لكل واحد أجندته. والزبون يختار المفضّل لديه.',
      'feat.lien.t': 'رابط خاص بالصالون',
      'feat.lien.d': 'رابط تضعه في بايو إنستغرام، أو واتساب، أو معلّقًا في الصالون.',
      'feat.secu.t': 'بيانات آمنة',
      'feat.secu.d': 'بياناتك وبيانات زبائنك مشفّرة ومستضافة بأمان.',
      'plan.ess.name': 'الأساسية',
      'plan.ess.desc': 'مثالية للانطلاق',
      'plan.conf.name': 'المريحة',
      'plan.conf.desc': 'للصالونات ذات فريق (حلاقون، مزيّنون، أخصائيو تجميل…)',
      'plan.prem.name': 'المميّزة',
      'plan.prem.desc': 'للصالونات والمعاهد الكبيرة',
      'plan.badge': '⭐ الأكثر رواجًا',
      'plan.cta': 'ابدأ التجربة المجانية',
      'plan.mois': 'دج/شهر',
      'pf.ess1': 'حجز عبر الإنترنت 24/24',
      'pf.ess2': 'أجندة حسب المقعد (دون اسم موظف)',
      'pf.ess3': 'مثال: 4 مقاعد = 4 مواعيد متاحة / ساعة',
      'pf.ess4': '150 رسالة SMS تلقائية / شهر',
      'pf.ess5': 'لوحة تحكّم المسيّر',
      'pf.ess6': 'دعم واتساب',
      'pf.conf1': 'كل ما في الأساسية',
      'pf.conf2': 'رسائل SMS غير محدودة',
      'pf.conf3': 'ملف لكل موظف(ة) بالاسم',
      'pf.conf4': 'الزبون يختار المفضّل لديه',
      'pf.conf5': 'إدارة التخصصات',
      'pf.conf6': 'دعم ذو أولوية',
      'pf.prem1': 'كل ما في المريحة',
      'pf.prem2': 'أجندة فردية لكل موظف(ة)',
      'pf.prem3': 'كل موظف(ة) يدير مخططه',
      'pf.prem4': 'صفحة صالون مخصّصة',
      'pf.prem5': '<strong>ذكر «موصى به» على التطبيق والموقع</strong>',
      'pf.prem6': 'مدير حساب مخصّص',
      'step1.t': 'تتواصل معنا',
      'step1.d': 'عبر واتساب. تختار صيغتك وتبدأ التجربة المجانية 30 يومًا.',
      'step2.t': 'ترسل خدماتك',
      'step2.d': 'قائمة الخدمات والمدد والأسعار. ننشئ صفحتك خلال 24 ساعة كحدّ أقصى.',
      'step3.t': 'تشارك رابطك',
      'step3.d': 'رابط خاص بصالونك: بايو إنستغرام، واتساب، ملصق.',
      'step4.t': 'المواعيد تتوالى',
      'step4.d': 'يحجز زبائنك بأنفسهم. وتُرسَل رسائل SMS تلقائيًا.',
      'band.text': 'جاهز خلال 24 ساعة',
      'band.gratuit': '30 يومًا مجانًا',
      'band.sans': 'دون التزام',
      'cta.sub': '30 يومًا مجانًا · دون التزام · جاهز خلال 24 ساعة',
      'cta.btn': '💬 ابدأ عبر واتساب'
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
      '[dir="rtl"] h1,[dir="rtl"] h2,[dir="rtl"] h3,[dir="rtl"] .card-title,[dir="rtl"] .logo,[dir="rtl"] .brand{font-family:"Amiri","Cormorant Garamond",serif}' +
      // Garder les nombres/prix dans le bon sens (LTR) même en page arabe
      '[dir="rtl"] .plan-price,[dir="rtl"] .prest-price,[dir="rtl"] .recap-value,[dir="rtl"] [dir="ltr"]{direction:ltr;unicode-bidi:isolate}';
    (document.head || document.documentElement).appendChild(st);
  } catch (e) {}

  /* Applique la direction immédiatement (anti-flash), puis les libellés au chargement */
  WQ.applyDir();
  document.addEventListener('DOMContentLoaded', function () { WQ.apply(); });

  window.WQ = WQ;
})();
