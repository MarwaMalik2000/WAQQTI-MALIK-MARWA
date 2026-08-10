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
      'pro.login_sub':'Espace gérant Waqqti','pro.email':'Email','pro.password':'Mot de passe','pro.connexion':'Se connecter','pro.connexion_load':'Connexion…',
      'pro.support_txt':'Identifiants fournis par Waqqti. Un souci de connexion ?','pro.support_link':'Contacter le support','pro.deconnexion':'Se déconnecter','pro.retour':'← Retour',
      'pro.ks_titre':'Votre essai est terminé','pro.ks_txt':'Votre période d\'essai de 30 jours est arrivée à échéance. Pour réactiver votre espace et continuer à recevoir des réservations, contactez-nous pour choisir votre formule.','pro.ks_btn':'Réactiver mon compte via WhatsApp',
      'pro.essai_gratuit':'Essai gratuit','pro.jours_restants':'jours restants','pro.formule':'Formule','pro.identifiants_invalides':'Identifiants invalides',
      'pro.geo_txt':'Renseignez votre position pour apparaître dans « Autour de moi » de l\'annuaire.','pro.geo_btn':'Ajouter ma position',
      'pro.jour':'Jour','pro.mois':'Mois','pro.rdv_jour':'RDV du jour','pro.ca_prevu':'CA prévu','pro.annules':'Annulés','pro.aucun_rdv':'Aucun rendez-vous ce jour.',
      'pro.th_heure':'Heure','pro.th_prestation':'Prestation','pro.th_client':'Client','pro.th_prix':'Prix','pro.th_statut':'Statut',
      'pro.st_annule':'Annulé','pro.st_termine':'Terminé','pro.st_confirme':'Confirmé','pro.ac_verifier':'à vérifier','pro.ac_paye':'payé','pro.ac_refuse':'refusé',
      'pro.terminer':'Terminer','pro.rdv_mois':'RDV ce mois','pro.ca_mois':'CA du mois','pro.rdv_court':'RDV','pro.clic_jour':'Cliquez sur un jour pour voir le détail.',
      'pro.confirm_annuler':'Annuler ce rendez-vous ?','pro.toast_annule':'Rendez-vous annulé','pro.toast_termine':'Rendez-vous terminé ✓',
      'pro.filtre_verifier':'À vérifier','pro.filtre_valides':'Validés','pro.filtre_refuses':'Refusés','pro.filtre_tous':'Tous','pro.aucun_acompte':'Aucun acompte à vérifier.',
      'pro.th_rdv':'RDV','pro.th_acompte':'Acompte','pro.th_recu':'Reçu','pro.ac_valide':'Validé','pro.valider':'✓ Valider','pro.refuser':'✗ Refuser','pro.revalider':'Re-valider','pro.voir_recu':'🖼 Voir le reçu','pro.aucun_recu':'Aucun reçu reçu',
      'pro.toast_valide':'Acompte validé ✓','pro.toast_refuse':'Justificatif refusé','pro.confirm_refuser':'Refuser ce justificatif ?','pro.img_indispo':'Image indisponible',
      'pro.rechercher_client':'🔍 Rechercher un client…','pro.clients_uniques':'Clients uniques','pro.th_nom':'Nom','pro.th_telephone':'Téléphone','pro.th_visites':'Visites','pro.th_total':'Total','pro.th_dernier':'Dernier RDV','pro.aucun_client':'Aucun client pour l\'instant.',
      'pro.ajouter':'+ Ajouter','pro.aucune_prestation':'Aucune prestation. Ajoute ta première prestation.','pro.masquee':'masquée','pro.modifier':'Modifier','pro.min':'min',
      'pro.nouvelle_prestation':'Nouvelle prestation','pro.modifier_prestation':'Modifier prestation','pro.f_categorie':'Catégorie','pro.f_ordre':'Ordre','pro.f_prix':'Prix (DA)','pro.f_prix_min':'Prix mini (DA)','pro.f_prix_max':'Prix maxi (DA)','pro.f_prix_max_ph':'ex : 3000','pro.f_fourchette':'Prix variable (fourchette)','pro.f_description':'Description (optionnel)','pro.f_description_ph':'Détaillez la prestation, ce qu\'elle inclut…','pro.f_duree':'Durée (min)','pro.f_visible':'Visible pour les clients',
      'pro.f_ac_demander':'Demander un acompte pour cette prestation','pro.f_ac_type':'Type d\'acompte','pro.f_ac_pct':'Pourcentage (%)','pro.f_ac_fixe':'Montant fixe (DA)','pro.f_ac_valeur':'Valeur',
      'pro.toast_prest_ok':'Prestation enregistrée','pro.confirm_del_prest':'Supprimer cette prestation ?','pro.toast_supprimee':'Supprimée','pro.nom_requis':'Le nom est requis',
      'pro.equipe_confort':'Les profils d\'employés sont visibles par les clients à partir de la formule Confort.','pro.aucun_membre':'Aucun membre. Ajoute ton équipe.','pro.inactif':'inactif','pro.nouveau_membre':'Nouveau membre','pro.modifier_membre':'Modifier membre','pro.f_actif':'Actif','pro.toast_enregistre':'Enregistré','pro.confirm_del_membre':'Supprimer ce membre ?',
      'pro.p_nom_salon':'Nom du salon','pro.p_wilaya':'Wilaya','pro.p_telephone':'Téléphone','pro.p_adresse':'Adresse','pro.p_annul_max':'Annulation en ligne autorisée jusqu\'à (heures avant le RDV)','pro.p_annul_hint':'0 = jusqu\'au dernier moment','pro.p_description':'Description du salon','pro.p_description_hint':'présentée aux clients','pro.p_description_ph':'Présentez votre salon : ambiance, spécialités, équipe, ce qui vous distingue…','pro.p_mode':'Mode de réservation','pro.p_mode_creneau':'Par créneau horaire','pro.p_mode_journee':'À la journée (sans horaire)','pro.p_sieges':'Nombre de sièges','pro.p_capacite_jour':'Plafond de réservations / jour (mode journée)','pro.p_capacite_jour_hint':'vide = illimité','pro.p_capacite_jour_ph':'ex : 10',
      'pro.logo_titre':'🖼 Logo du salon','pro.logo_sub':'Affiché sur votre page de réservation et dans l\'annuaire.','pro.logo_upload':'Téléverser le logo','pro.logo_ok':'Logo enregistré ✓','pro.choisir_image':'Choisis une image.',
      'pro.gal_titre':'📸 Galerie du salon','pro.gal_sub':'Ces photos s\'affichent sur votre page de réservation, sous le nom du salon.','pro.gal_upsell':'Passez en formule Confort (5 photos) ou Premium (15 photos) pour présenter votre salon.','pro.gal_upload':'Ajouter des photos','pro.gal_plein':'Limite atteinte. Supprimez une photo pour en ajouter une nouvelle.','pro.gal_ok':'Galerie mise à jour ✓','pro.gal_confirm_del':'Supprimer cette photo ?','common.supprimer':'Supprimer',
      'pro.avis':'Avis','pro.avis_count':'avis','pro.avis_client':'Client','pro.avis_aucun':'Aucun avis pour le moment.','pro.avis_info':'Les clients laissent un avis après leur rendez-vous. Plus vous avez de bons avis, mieux votre salon est classé dans l\'annuaire.','pro.avis_confirm_del':'Supprimer cet avis ? (réservé aux avis abusifs)',
      'pro.avis_votre_reponse':'Votre réponse','pro.avis_repondre':'Répondre','pro.avis_modifier_rep':'Modifier','pro.avis_repondre_ph':'Répondre publiquement à cet avis…','pro.avis_rep_ok':'Réponse publiée ✓',
      'pro.attente':'Liste d\'attente','pro.att_info':'Clients à prévenir dès qu\'une place se libère. Contactez-les d\'un clic (WhatsApp / e-mail).','pro.att_aucun':'Personne en liste d\'attente.','pro.att_notifie':'prévenu','pro.att_msg':'Bonjour','pro.att_msg2':'une place vient de se libérer chez','pro.att_msg3':'Souhaitez-vous réserver ?',
      'pro.push_titre':'🔔 Notifications','pro.push_sub':'Recevez une alerte sur ce téléphone/ordinateur à chaque nouvelle réservation, même l\'application fermée.','pro.push_activer':'Activer les notifications','pro.push_indispo':'Notifications non supportées sur cet appareil/navigateur.','pro.push_refuse':'Autorisation refusée. Activez-la dans les réglages du navigateur.','pro.push_ok':'Notifications activées sur cet appareil.','pro.push_actives':'Notifications activées sur cet appareil.','pro.push_reactiver':'Réactiver / Rafraîchir',
      'pro.ferme_titre':'🚫 Fermeture exceptionnelle','pro.ferme_sub':'Fermez votre salon sur une plage de dates (congés, imprévu). Les clients ne pourront pas réserver ces jours-là.','pro.ferme_active':'Fermé','pro.ferme_du':'Du','pro.ferme_au':'Au','pro.ferme_enregistrer':'Enregistrer la fermeture','pro.ferme_annuler':'Retirer la fermeture','pro.ferme_ordre':'La date de fin doit être après le début','pro.ferme_ok':'Fermeture enregistrée ✓','pro.ferme_efface':'Fermeture retirée',
      'pro.qr_titre':'🔳 QR code du salon','pro.qr_sub':'À imprimer ou afficher en vitrine : vos clients scannent et arrivent directement sur votre page de réservation.','pro.qr_download':'Télécharger le QR (PNG)',
      'pro.rdv':'RDV','pro.voir_rdv':'Voir ses rendez-vous','pro.aucun_rdv_membre':'Aucun rendez-vous pour ce membre.','pro.a_venir':'À venir','pro.passes':'Passés','pro.aucun':'Aucun',
      'pro.p_paiement':'💳 Coordonnées de paiement','pro.p_paiement_sub':'Affichées au client quand un acompte est demandé.','pro.p_type':'Type','pro.p_aucun':'— Aucun —','pro.p_titulaire':'Titulaire','pro.p_numero':'Numéro (CCP / RIB / tél)','pro.p_cle':'Clé (CCP)','pro.p_instructions':'Instructions (optionnel)','pro.p_save_coord':'Enregistrer les coordonnées',
      'pro.p_horaires':'🕐 Horaires & disponibilités','pro.p_horaires_sub':'Définissent les créneaux proposés aux clients (mode « par créneau »).','pro.p_ouverture':'Ouverture','pro.p_fermeture':'Fermeture','pro.p_pause_debut':'Pause — début (optionnel)','pro.p_pause_fin':'Pause — fin','pro.p_intervalle':'Intervalle entre créneaux','pro.p_jours_fermeture':'Jours de fermeture','pro.p_save_horaires':'Enregistrer les horaires',
      'pro.p_localisation':'📍 Localisation','pro.p_localisation_sub':'Pour apparaître dans « Autour de moi » de l\'annuaire.','pro.p_utiliser_position':'📍 Utiliser ma position actuelle','pro.p_save_position':'Enregistrer la position',
      'pro.toast_param':'Paramètres enregistrés','pro.toast_coord':'Coordonnées enregistrées','pro.toast_position':'Position enregistrée','pro.toast_horaires':'Horaires enregistrés ✓','pro.toast_position_captee':'Position captée — pense à enregistrer','pro.geoloc_indispo':'Géolocalisation indisponible','pro.position_refusee':'Position refusée','pro.fermeture_apres':'La fermeture doit être après l\'ouverture',
      'pro.j0':'Dim','pro.j1':'Lun','pro.j2':'Mar','pro.j3':'Mer','pro.j4':'Jeu','pro.j5':'Ven','pro.j6':'Sam',
      'pro.formule_actuelle':'Formule actuelle','pro.geree_waqqti':'Gérée par Waqqti','pro.essai':'Essai','pro.les_formules':'Les formules','pro.active':'Active','pro.changer_formule':'Pour changer de formule, contacte ton conseiller Waqqti.','pro.contacter_waqqti':'Contacter Waqqti','pro.j_restants':'j restants',
      'pro.f_essentielle':'Essentielle','pro.f_confort':'Confort','pro.f_premium':'Premium','pro.d_essentielle':'Réservation par sièges, SMS limités','pro.d_confort':'Profils employés, SMS illimités, choix de l\'employé','pro.d_premium':'Agendas individuels, acompte, mise en avant, community manager',
      'common.ou': '— ou —',
      'common.langue': 'العربية',
      'nav.annuaire': 'Annuaire des salons',
      'nav.fonctions': 'Fonctionnalités',
      'nav.formules': 'Formules',
      'nav.comment': 'Comment ça marche',
      'nav.espace_client': 'Espace client',
      'nav.essai': 'Essai gratuit 30j →',
      'hero.badge': 'Première plateforme beauté en Algérie',
      'hero.titre': 'Votre salon, <em>réservé</em><br/>en ligne 24h/24h',
      'hero.p': 'Waqqti connecte vos clients à votre salon automatiquement. Confirmations SMS, agenda intelligent, zéro appel manqué. Commencez gratuitement pendant 30 jours.',
      'hero.cta1': 'Démarrer gratuitement →',
      'hero.cta2': 'Voir comment ça marche',
      'sec.fonctions': 'Tout ce dont votre salon a besoin,<br/>dans une seule app',
      'sec.formules': 'Des formules pour chaque salon',
      'sec.comment': 'Opérationnel en 24 heures',
      'sec.contact': 'Prêt(e) à moderniser votre salon ?',
      'book.retour': '← Retour',
      'book.aide': '💬 Aide WhatsApp',
      'book.galerie': 'Le salon en photos',
      'book.ferme_titre': 'Salon fermé',
      'book.annuler_rdv':'Annuler mon rendez-vous','book.annuler_confirm':'Voulez-vous vraiment annuler ce rendez-vous ?','book.annuler_ok':'Rendez-vous annulé. À bientôt !',
      'book.email_label':'E-mail (optionnel — pour la confirmation 24h avant)',
      'book.liste_titre':'Complet ou aucun créneau qui vous convient ?','book.liste_sub':'Laissez vos coordonnées : le salon vous prévient dès qu\'une place se libère.','book.liste_tel':'Téléphone (optionnel)','book.liste_email':'E-mail','book.liste_jour':'Jour souhaité','book.liste_heure':'Créneau souhaité','book.liste_heure_ph':'ex : matin, 14h…','book.liste_cta':'Me prévenir si une place se libère','book.liste_ok':'Vous êtes sur la liste ! Vous serez prévenu(e) par e-mail.','book.liste_nom_requis':'Votre nom est requis.','book.liste_email_requis':'Votre e-mail est requis pour être prévenu(e).','book.liste_nom_ph':'Ex : Amina K.',
      'book.apropos': 'À propos du salon','book.apropos_vide':'Ce salon n’a pas encore ajouté de description.','book.horaires':'Horaires d’ouverture','book.ferme_le':'fermé','book.collaborateurs':'L’équipe','book.tri_reco':'Trier : recommandé','book.tri_prix_asc':'Prix croissant','book.tri_prix_desc':'Prix décroissant',
      'book.avis_titre':'Avis clients','book.avis_count':'avis','book.avis_client':'Client','book.avis_reponse':'Réponse du salon',
      'book.avis_aucun':'Aucun avis pour le moment. Soyez le premier après votre visite !',
      'book.avis_login':'Connectez-vous et réservez pour laisser un avis.','book.avis_login_cta':'Se connecter',
      'book.avis_apres':'Vous pourrez laisser un avis après votre rendez-vous.',
      'book.avis_form_titre':'Laissez votre avis','book.avis_prestation':'Votre prestation',
      'book.avis_comment_ph':'Racontez votre expérience…','book.avis_photo':'Photo (facultatif)',
      'book.avis_envoyer':'Publier mon avis','book.avis_note_requise':'Choisissez une note (étoiles).','book.avis_merci':'Merci pour votre avis !',
      'book.acompte_compte_titre':'Un compte est nécessaire pour les acomptes','book.acompte_compte_sub':'Connectez-vous ou créez un compte pour suivre votre acompte. Vos infos restent ici — revenez ensuite valider.','book.acompte_login_requis':'Pour réserver avec un acompte, connectez-vous d\'abord (bouton « Se connecter »). Vos informations restent saisies ici.',
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
      'book.confirme_sub': 'Une confirmation vous a été envoyée sur WhatsApp.',
      'book.attente_titre': 'Réservation en attente',
      'book.attente_sub': 'Votre réservation sera confirmée une fois votre acompte validé par le salon.',
      'book.refuse_titre': 'Acompte refusé',
      'book.refuse_sub': 'Votre justificatif a été refusé. Merci d\'en renvoyer un valide ci-dessous.',
      'book.recu_attente': 'Reçu envoyé — en attente de validation par le salon.',
      'book.lbl_salon': 'Salon :',
      'book.lbl_service': 'Service :',
      'book.lbl_date': 'Date :',
      'book.lbl_heure': 'Heure :',
      'book.lbl_avec': 'Avec :',
      'book.lbl_prix': 'Prix :',
      'book.annuler_note': 'Pour annuler ou modifier, contactez directement le salon.',
      'book.autre': 'Faire une autre réservation',
      'book.footer': 'Réservation propulsée par <a href="https://www.waqqti.com" target="_blank" style="color:var(--or);text-decoration:none;font-weight:600">Waqqti</a> · La référence beauté en Algérie',
      'book.journee': 'Journée',
      'book.contacter_salon': 'Contacter le salon',
      'book.calendrier': 'Ajouter au calendrier',
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
      'ann.nouveau': '✨ Nouveau',
      'ann.genre_tous':'Hommes & Femmes','ann.genre_h':'Hommes','ann.genre_f':'Femmes','ann.cat_toutes':'Toutes spécialités',
      'ann.dispo_titre':'Prochaines dispos','ann.dispo_aucune':'Pas de créneau proche','ann.dispo_jour':'Disponible','ann.plus_infos':'Plus d’informations','ann.prix_tous':'Prix',
      'cat.barber':'Barber & coiffure hommes','cat.bienetre_h':'Bien-être hommes','cat.coiffure_maquillage':'Coiffure & maquillage','cat.onglerie':'Onglerie','cat.spa':'Bien-être & spa','cat.soin_visage':'Esthétique & soin du visage','cat.regard':'Beauté du regard','cat.mariage':'Mariage & événements',
      'auth.client': 'Espace client Waqqti',
      'auth.google': 'Continuer avec Google',
      'auth.retour_accueil': '← Retour à l\'accueil',
      'lbl.offre': 'Ce qu\'on vous offre',
      'lbl.tarifs': 'Tarifs',
      'lbl.simple': 'Simple et rapide',
      'sub.fonctions': 'Plus d\'appels manqués, plus de cahiers désorganisés. Waqqti gère tout à votre place.',
      'sub.formules': '30 jours d\'essai gratuit sur toutes les formules. Sans carte bancaire.',
      'sub.comment': 'On s\'occupe de tout. Vous nous envoyez vos prestations, on crée votre page.',
      'feat.resa.t': 'Réservation 24h/24h',
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
      'pf.ess1': 'Réservation en ligne 24h/24h',
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
      'pro.agenda': 'البرنامج',
      'pro.acomptes': 'العرابين',
      'pro.clients': 'الزبائن',
      'pro.prestations': 'الخدمات',
      'pro.equipe': 'الفريق',
      'pro.parametres': 'الإعدادات',
      'pro.abonnement': 'الاشتراك',
      'pro.login_sub':'فضاء المسيّر وقتي','pro.email':'البريد الإلكتروني','pro.password':'كلمة السر','pro.connexion':'تسجيل الدخول','pro.connexion_load':'جاري الدخول…',
      'pro.support_txt':'المعرّفات مقدَّمة من وقتي. مشكل في الدخول؟','pro.support_link':'تواصل مع الدعم','pro.deconnexion':'تسجيل الخروج','pro.retour':'→ رجوع',
      'pro.ks_titre':'انتهت فترتك التجريبية','pro.ks_txt':'انتهت فترة تجربتك المجانية (30 يومًا). لإعادة تفعيل فضائك ومواصلة استقبال الحجوزات، تواصل معنا لاختيار صيغتك.','pro.ks_btn':'إعادة تفعيل حسابي عبر واتساب',
      'pro.essai_gratuit':'تجربة مجانية','pro.jours_restants':'يوم متبقٍ','pro.formule':'الصيغة','pro.identifiants_invalides':'معرّفات غير صحيحة',
      'pro.geo_txt':'أدخل موقعك لتظهر في « بالقرب مني » في الدليل.','pro.geo_btn':'أضف موقعي',
      'pro.jour':'يوم','pro.mois':'شهر','pro.rdv_jour':'مواعيد اليوم','pro.ca_prevu':'الإيرادات المتوقعة','pro.annules':'ملغاة','pro.aucun_rdv':'لا مواعيد في هذا اليوم.',
      'pro.th_heure':'الساعة','pro.th_prestation':'الخدمة','pro.th_client':'الزبون','pro.th_prix':'السعر','pro.th_statut':'الحالة',
      'pro.st_annule':'ملغى','pro.st_termine':'منتهٍ','pro.st_confirme':'مؤكَّد','pro.ac_verifier':'للتحقق','pro.ac_paye':'مدفوع','pro.ac_refuse':'مرفوض',
      'pro.terminer':'إنهاء','pro.rdv_mois':'مواعيد هذا الشهر','pro.ca_mois':'إيرادات الشهر','pro.rdv_court':'موعد','pro.clic_jour':'انقر على يوم لعرض التفاصيل.',
      'pro.confirm_annuler':'إلغاء هذا الموعد؟','pro.toast_annule':'تم إلغاء الموعد','pro.toast_termine':'تم إنهاء الموعد ✓',
      'pro.filtre_verifier':'للتحقق','pro.filtre_valides':'مقبولة','pro.filtre_refuses':'مرفوضة','pro.filtre_tous':'الكل','pro.aucun_acompte':'لا عربون للتحقق.',
      'pro.th_rdv':'الموعد','pro.th_acompte':'العربون','pro.th_recu':'الإيصال','pro.ac_valide':'مقبول','pro.valider':'✓ قبول','pro.refuser':'✗ رفض','pro.revalider':'إعادة القبول','pro.voir_recu':'🖼 عرض الإيصال','pro.aucun_recu':'لم يُستلم أي إيصال',
      'pro.toast_valide':'تم قبول العربون ✓','pro.toast_refuse':'تم رفض الإيصال','pro.confirm_refuser':'رفض هذا الإيصال؟','pro.img_indispo':'الصورة غير متوفرة',
      'pro.rechercher_client':'🔍 ابحث عن زبون…','pro.clients_uniques':'زبائن مختلفون','pro.th_nom':'الاسم','pro.th_telephone':'الهاتف','pro.th_visites':'الزيارات','pro.th_total':'المجموع','pro.th_dernier':'آخر موعد','pro.aucun_client':'لا زبائن حاليًا.',
      'pro.ajouter':'+ إضافة','pro.aucune_prestation':'لا خدمات. أضف خدمتك الأولى.','pro.masquee':'مخفية','pro.modifier':'تعديل','pro.min':'د',
      'pro.nouvelle_prestation':'خدمة جديدة','pro.modifier_prestation':'تعديل الخدمة','pro.f_categorie':'الفئة','pro.f_ordre':'الترتيب','pro.f_prix':'السعر (دج)','pro.f_prix_min':'السعر الأدنى (دج)','pro.f_prix_max':'السعر الأقصى (دج)','pro.f_prix_max_ph':'مثال: 3000','pro.f_fourchette':'سعر متغيّر (نطاق)','pro.f_description':'وصف (اختياري)','pro.f_description_ph':'اشرح الخدمة وما تتضمّنه…','pro.f_duree':'المدة (دقيقة)','pro.f_visible':'مرئية للزبائن',
      'pro.f_ac_demander':'طلب عربون لهذه الخدمة','pro.f_ac_type':'نوع العربون','pro.f_ac_pct':'نسبة مئوية (%)','pro.f_ac_fixe':'مبلغ ثابت (دج)','pro.f_ac_valeur':'القيمة',
      'pro.toast_prest_ok':'تم حفظ الخدمة','pro.confirm_del_prest':'حذف هذه الخدمة؟','pro.toast_supprimee':'تم الحذف','pro.nom_requis':'الاسم مطلوب',
      'pro.equipe_confort':'تظهر ملفات الموظفين للزبائن ابتداءً من صيغة « المريحة ».','pro.aucun_membre':'لا أعضاء. أضف فريقك.','pro.inactif':'غير نشط','pro.nouveau_membre':'عضو جديد','pro.modifier_membre':'تعديل العضو','pro.f_actif':'نشط','pro.toast_enregistre':'تم الحفظ','pro.confirm_del_membre':'حذف هذا العضو؟',
      'pro.p_nom_salon':'اسم الصالون','pro.p_wilaya':'الولاية','pro.p_telephone':'الهاتف','pro.p_adresse':'العنوان','pro.p_annul_max':'الإلغاء عبر الإنترنت مسموح حتى (ساعات قبل الموعد)','pro.p_annul_hint':'0 = حتى آخر لحظة','pro.p_description':'وصف الصالون','pro.p_description_hint':'يُعرض للزبائن','pro.p_description_ph':'قدّم صالونك: الأجواء، التخصصات، الفريق، ما يميّزك…','pro.p_mode':'نمط الحجز','pro.p_mode_creneau':'حسب الموعد الزمني','pro.p_mode_journee':'باليوم (دون توقيت)','pro.p_sieges':'عدد المقاعد','pro.p_capacite_jour':'الحد الأقصى للحجوزات / يوم (نمط اليوم)','pro.p_capacite_jour_hint':'فارغ = بلا حدّ','pro.p_capacite_jour_ph':'مثال: 10',
      'pro.logo_titre':'🖼 شعار الصالون','pro.logo_sub':'يظهر على صفحة حجزك وفي الدليل.','pro.logo_upload':'رفع الشعار','pro.logo_ok':'تم حفظ الشعار ✓','pro.choisir_image':'اختر صورة.',
      'pro.gal_titre':'📸 معرض الصالون','pro.gal_sub':'تظهر هذه الصور في صفحة حجزك، تحت اسم الصالون.','pro.gal_upsell':'انتقل إلى صيغة « المريحة » (5 صور) أو « المميّزة » (15 صورة) لعرض صالونك.','pro.gal_upload':'إضافة صور','pro.gal_plein':'تم بلوغ الحد. احذف صورة لإضافة أخرى.','pro.gal_ok':'تم تحديث المعرض ✓','pro.gal_confirm_del':'حذف هذه الصورة؟','common.supprimer':'حذف',
      'pro.avis':'التقييمات','pro.avis_count':'تقييم','pro.avis_client':'زبون','pro.avis_aucun':'لا توجد تقييمات بعد.','pro.avis_info':'يترك الزبائن تقييماً بعد موعدهم. كلما زادت التقييمات الجيدة، تحسّن ترتيب صالونك في الدليل.','pro.avis_confirm_del':'حذف هذا التقييم؟ (للتقييمات المسيئة فقط)',
      'pro.avis_votre_reponse':'ردّك','pro.avis_repondre':'الرد','pro.avis_modifier_rep':'تعديل','pro.avis_repondre_ph':'ردّ علنيّ على هذا التقييم…','pro.avis_rep_ok':'تم نشر الرد ✓',
      'pro.attente':'قائمة الانتظار','pro.att_info':'زبائن ننبّههم فور شغور موعد. تواصل معهم بنقرة (واتساب / بريد).','pro.att_aucun':'لا أحد في قائمة الانتظار.','pro.att_notifie':'تم إشعاره','pro.att_msg':'مرحباً','pro.att_msg2':'شغر موعد لدى','pro.att_msg3':'هل ترغب في الحجز؟',
      'pro.push_titre':'🔔 الإشعارات','pro.push_sub':'استقبل تنبيهاً على هذا الهاتف/الحاسوب عند كل حجز جديد، حتى والتطبيق مغلق.','pro.push_activer':'تفعيل الإشعارات','pro.push_indispo':'الإشعارات غير مدعومة على هذا الجهاز/المتصفح.','pro.push_refuse':'تم رفض الإذن. فعّله من إعدادات المتصفح.','pro.push_ok':'تم تفعيل الإشعارات على هذا الجهاز.','pro.push_actives':'الإشعارات مُفعّلة على هذا الجهاز.','pro.push_reactiver':'إعادة التفعيل / تحديث',
      'pro.ferme_titre':'🚫 إغلاق استثنائي','pro.ferme_sub':'أغلق صالونك خلال فترة (عطلة، طارئ). لن يتمكن الزبائن من الحجز في تلك الأيام.','pro.ferme_active':'مغلق','pro.ferme_du':'من','pro.ferme_au':'إلى','pro.ferme_enregistrer':'حفظ الإغلاق','pro.ferme_annuler':'إلغاء الإغلاق','pro.ferme_ordre':'تاريخ النهاية يجب أن يكون بعد البداية','pro.ferme_ok':'تم حفظ الإغلاق ✓','pro.ferme_efface':'تم إلغاء الإغلاق',
      'pro.qr_titre':'🔳 رمز QR للصالون','pro.qr_sub':'اطبعه أو اعرضه في الواجهة: يمسحه زبائنك ويصلون مباشرة إلى صفحة الحجز.','pro.qr_download':'تحميل رمز QR (PNG)',
      'pro.rdv':'موعد','pro.voir_rdv':'عرض مواعيده','pro.aucun_rdv_membre':'لا مواعيد لهذا العضو.','pro.a_venir':'قادمة','pro.passes':'ماضية','pro.aucun':'لا شيء',
      'pro.p_paiement':'💳 إحداثيات الدفع','pro.p_paiement_sub':'تظهر للزبون عند طلب عربون.','pro.p_type':'النوع','pro.p_aucun':'— لا شيء —','pro.p_titulaire':'صاحب الحساب','pro.p_numero':'الرقم (CCP / RIB / هاتف)','pro.p_cle':'المفتاح (CCP)','pro.p_instructions':'تعليمات (اختياري)','pro.p_save_coord':'حفظ الإحداثيات',
      'pro.p_horaires':'🕐 التوقيت والتوفّر','pro.p_horaires_sub':'تحدّد المواعيد المقترحة على الزبائن (نمط « حسب الموعد »).','pro.p_ouverture':'الفتح','pro.p_fermeture':'الإغلاق','pro.p_pause_debut':'الاستراحة — البداية (اختياري)','pro.p_pause_fin':'الاستراحة — النهاية','pro.p_intervalle':'الفاصل بين المواعيد','pro.p_jours_fermeture':'أيام الإغلاق','pro.p_save_horaires':'حفظ التوقيت',
      'pro.p_localisation':'📍 الموقع','pro.p_localisation_sub':'لتظهر في « بالقرب مني » في الدليل.','pro.p_utiliser_position':'📍 استخدام موقعي الحالي','pro.p_save_position':'حفظ الموقع',
      'pro.toast_param':'تم حفظ الإعدادات','pro.toast_coord':'تم حفظ الإحداثيات','pro.toast_position':'تم حفظ الموقع','pro.toast_horaires':'تم حفظ التوقيت ✓','pro.toast_position_captee':'تم التقاط الموقع — لا تنسَ الحفظ','pro.geoloc_indispo':'تحديد الموقع غير متاح','pro.position_refusee':'تم رفض الموقع','pro.fermeture_apres':'يجب أن يكون الإغلاق بعد الفتح',
      'pro.j0':'أحد','pro.j1':'إثن','pro.j2':'ثلا','pro.j3':'أرب','pro.j4':'خمي','pro.j5':'جمع','pro.j6':'سبت',
      'pro.formule_actuelle':'الصيغة الحالية','pro.geree_waqqti':'تُدار من طرف وقتي','pro.essai':'تجربة','pro.les_formules':'الصيغ','pro.active':'نشطة','pro.changer_formule':'لتغيير الصيغة، تواصل مع مستشارك في وقتي.','pro.contacter_waqqti':'تواصل مع وقتي','pro.j_restants':'يوم متبقٍ',
      'pro.f_essentielle':'الأساسية','pro.f_confort':'المريحة','pro.f_premium':'المميّزة','pro.d_essentielle':'حجز حسب المقاعد، رسائل SMS محدودة','pro.d_confort':'ملفات الموظفين، رسائل SMS غير محدودة، اختيار الموظف','pro.d_premium':'أجندات فردية، عربون، إبراز، مدير محتوى',
      'common.ou': '— أو —',
      'common.langue': 'FR',
      'nav.annuaire': 'دليل الصالونات',
      'nav.fonctions': 'المميزات',
      'nav.formules': 'الصيغ',
      'nav.comment': 'كيف يعمل',
      'nav.espace_client': 'فضاء الزبون',
      'nav.essai': 'تجربة مجانية 30 يوم →',
      'hero.badge': 'أول منصة تجميل في الجزائر',
      'hero.titre': 'صالونك <em>محجوز</em><br/>عبر الإنترنت 24h/24h',
      'hero.p': 'وقتي يربط زبائنك بصالونك تلقائيًا. تأكيدات عبر SMS، برنامج ذكي، دون أي مكالمة فائتة. ابدأ مجانًا لمدة 30 يومًا.',
      'hero.cta1': 'ابدأ مجانًا →',
      'hero.cta2': 'شاهد كيف يعمل',
      'sec.fonctions': 'كل ما يحتاجه صالونك<br/>في تطبيق واحد',
      'sec.formules': 'صيغ تناسب كل صالون',
      'sec.comment': 'جاهز خلال 24 ساعة',
      'sec.contact': 'مستعد لتحديث صالونك؟',
      'book.retour': '→ رجوع',
      'book.aide': '💬 مساعدة واتساب',
      'book.galerie': 'الصالون بالصور',
      'book.ferme_titre': 'الصالون مغلق',
      'book.annuler_rdv':'إلغاء موعدي','book.annuler_confirm':'هل تريد فعلاً إلغاء هذا الموعد؟','book.annuler_ok':'تم إلغاء الموعد. إلى اللقاء!',
      'book.email_label':'البريد الإلكتروني (اختياري — لتأكيد الموعد قبل 24 ساعة)',
      'book.liste_titre':'كامل العدد أو لا يوجد موعد مناسب؟','book.liste_sub':'اترك معلوماتك: يخبرك الصالون فور شغور موعد.','book.liste_tel':'الهاتف (اختياري)','book.liste_email':'البريد الإلكتروني','book.liste_jour':'اليوم المطلوب','book.liste_heure':'الوقت المطلوب','book.liste_heure_ph':'مثال: صباحاً، 14:00…','book.liste_cta':'أبلغني إذا شغر موعد','book.liste_ok':'أنت في القائمة! سنخبرك عبر البريد الإلكتروني.','book.liste_nom_requis':'الاسم مطلوب.','book.liste_email_requis':'البريد الإلكتروني مطلوب لإبلاغك.','book.liste_nom_ph':'مثال: أمينة ك.',
      'book.apropos': 'عن الصالون','book.apropos_vide':'لم يُضِف هذا الصالون وصفاً بعد.','book.horaires':'أوقات العمل','book.ferme_le':'مغلق','book.collaborateurs':'الفريق','book.tri_reco':'ترتيب: موصى به','book.tri_prix_asc':'السعر تصاعدياً','book.tri_prix_desc':'السعر تنازلياً',
      'book.avis_titre':'تقييمات الزبائن','book.avis_count':'تقييم','book.avis_client':'زبون','book.avis_reponse':'ردّ الصالون',
      'book.avis_aucun':'لا توجد تقييمات بعد. كن أول من يقيّم بعد زيارتك!',
      'book.avis_login':'سجّل الدخول واحجز لتترك تقييماً.','book.avis_login_cta':'تسجيل الدخول',
      'book.avis_apres':'يمكنك ترك تقييم بعد موعدك.',
      'book.avis_form_titre':'اترك تقييمك','book.avis_prestation':'خدمتك',
      'book.avis_comment_ph':'احكِ لنا عن تجربتك…','book.avis_photo':'صورة (اختياري)',
      'book.avis_envoyer':'نشر تقييمي','book.avis_note_requise':'اختر تقييماً (نجوم).','book.avis_merci':'شكراً على تقييمك!',
      'book.acompte_compte_titre':'يلزم حساب لدفع العربون','book.acompte_compte_sub':'سجّل الدخول أو أنشئ حساباً لمتابعة عربونك. تبقى معلوماتك هنا — عُد بعدها للتأكيد.','book.acompte_login_requis':'للحجز مع عربون، سجّل الدخول أولاً (زر « تسجيل الدخول »). تبقى معلوماتك محفوظة هنا.',
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
      'book.confirme_sub': 'تم إرسال تأكيد إليك عبر واتساب.',
      'book.attente_titre': 'حجز قيد الانتظار',
      'book.attente_sub': 'سيتم تأكيد حجزك بمجرد التحقق من عربونك من طرف الصالون.',
      'book.refuse_titre': 'تم رفض العربون',
      'book.refuse_sub': 'تم رفض إيصالك. يُرجى إرسال إيصال صالح أدناه.',
      'book.recu_attente': 'تم إرسال الإيصال — في انتظار تحقّق الصالون.',
      'book.lbl_salon': 'الصالون:',
      'book.lbl_service': 'الخدمة:',
      'book.lbl_date': 'التاريخ:',
      'book.lbl_heure': 'الوقت:',
      'book.lbl_avec': 'مع:',
      'book.lbl_prix': 'السعر:',
      'book.annuler_note': 'للإلغاء أو التعديل، اتصل مباشرة بالصالون.',
      'book.autre': 'إجراء حجز آخر',
      'book.footer': 'حجز مدعوم من <a href="https://www.waqqti.com" target="_blank" style="color:var(--or);text-decoration:none;font-weight:600">Waqqti</a> · مرجع الجمال في الجزائر',
      'book.journee': 'طوال اليوم',
      'book.contacter_salon': 'تواصل مع الصالون',
      'book.calendrier': 'أضف إلى التقويم',
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
      'ann.nouveau': '✨ جديد',
      'ann.genre_tous':'رجال ونساء','ann.genre_h':'رجال','ann.genre_f':'نساء','ann.cat_toutes':'كل التخصصات',
      'ann.dispo_titre':'أقرب المواعيد','ann.dispo_aucune':'لا يوجد موعد قريب','ann.dispo_jour':'متاح','ann.plus_infos':'مزيد من المعلومات','ann.prix_tous':'السعر',
      'cat.barber':'حلاقة رجالية','cat.bienetre_h':'عناية رجالية','cat.coiffure_maquillage':'تصفيف ومكياج','cat.onglerie':'العناية بالأظافر','cat.spa':'استرخاء وسبا','cat.soin_visage':'عناية بالبشرة والوجه','cat.regard':'جمال العيون','cat.mariage':'أعراس ومناسبات',
      'auth.client': 'فضاء زبون وقتي',
      'auth.google': 'المتابعة عبر Google',
      'auth.retour_accueil': '→ العودة إلى الرئيسية',
      'lbl.offre': 'ما نقدّمه لك',
      'lbl.tarifs': 'الأسعار',
      'lbl.simple': 'بسيط وسريع',
      'sub.fonctions': 'لا مكالمات فائتة، لا دفاتر فوضوية. وقتي يدير كل شيء عنك.',
      'sub.formules': '30 يومًا تجربة مجانية على كل الصيغ. دون بطاقة بنكية.',
      'sub.comment': 'نحن نتكفّل بكل شيء. أرسل لنا خدماتك، وننشئ صفحتك.',
      'feat.resa.t': 'حجز 24h/24h',
      'feat.resa.d': 'يحجز زبائنك من هواتفهم في أي وقت. إشعار فوري.',
      'feat.sms.t': 'رسائل SMS مبرمجة',
      'feat.sms.d': 'تأكيد فوري + تذكير قبل الموعد بـ24 ساعة. دون تغيّب، دون جهد.',
      'feat.agenda.t': 'برنامج ذكي',
      'feat.agenda.d': 'عرض تقويم واضح. تحكّم في مواعيدك وفتراتك وفريقك بنقرة واحدة.',
      'feat.emp.t': 'برنامج لكل موظف(ة)',
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
      'pf.ess1': 'حجز عبر الإنترنت 24h/24h',
      'pf.ess2': 'برنامج حسب المقعد (دون اسم موظف)',
      'pf.ess3': 'مثال: 4 مقاعد = 4 مواعيد متاحة / ساعة',
      'pf.ess4': '150 رسالة SMS مبرمجة / شهر',
      'pf.ess5': 'لوحة تحكّم المسيّر',
      'pf.ess6': 'دعم واتساب',
      'pf.conf1': 'كل ما في الأساسية',
      'pf.conf2': 'رسائل SMS غير محدودة',
      'pf.conf3': 'ملف لكل موظف(ة) بالاسم',
      'pf.conf4': 'الزبون يختار المفضّل لديه',
      'pf.conf5': 'إدارة التخصصات',
      'pf.conf6': 'دعم ذو أولوية',
      'pf.prem1': 'كل ما في المريحة',
      'pf.prem2': 'برنامج فردي لكل موظف(ة)',
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
