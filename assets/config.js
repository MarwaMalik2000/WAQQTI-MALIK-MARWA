/* ============================================================
   WAQQTI — assets/config.js
   Connexion Supabase + helpers globaux (WAQQTI.*)
   Chargé sur toutes les pages qui parlent à la base.
   ============================================================ */
(function () {
  'use strict';

  /* ---------------------------------------------------------
     1. CONFIG SUPABASE
     ⚠️ Remplace SUPABASE_ANON_KEY par ta VRAIE clé "anon public"
        (Supabase → Project Settings → API → Project API keys → anon public).
        La clé anon est publique et sûre côté navigateur (protégée par les RLS).
        Ne mets JAMAIS la clé "service_role" ici.
     --------------------------------------------------------- */
  var SUPABASE_URL = 'https://zsbbemdbjoaurywkoshx.supabase.co';
  var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpzYmJlbWRiam9hdXJ5d2tvc2h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5MzIwNDYsImV4cCI6MjEwMTUwODA0Nn0.NcDE2hWHhtX2h-2hKe2oBv-GPQFh88N93CqMXtnTxkE';

  if (!window.supabase || !window.supabase.createClient) {
    console.error('[WAQQTI] supabase-js non chargé. Ajoute le <script> CDN AVANT config.js.');
    return;
  }

  var client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true }
  });

  /* ---------------------------------------------------------
     2. HELPERS
     --------------------------------------------------------- */

  // Normalise un numéro algérien pour stockage (LTR, sans espaces).
  // Accepte 0770123456, +213770123456, 0770 12 34 56 → renvoie +213770123456
  function formatPhone(raw) {
    if (!raw) return null;
    var d = String(raw).replace(/[^\d+]/g, '');
    if (d.indexOf('+213') === 0) return d;
    if (d.indexOf('00213') === 0) return '+' + d.slice(2);
    if (d.indexOf('0') === 0) return '+213' + d.slice(1);
    if (/^[567]\d{8}$/.test(d)) return '+213' + d; // sans le 0 initial
    return d;
  }

  // Version affichable : 0770 12 34 56
  function displayPhone(raw) {
    var d = formatPhone(raw);
    if (!d) return '';
    var local = d.indexOf('+213') === 0 ? '0' + d.slice(4) : d;
    return local.replace(/(\d{4})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4');
  }

  // Prix en dinars algériens : 2500 → "2 500 DA"
  function formatPrix(n) {
    if (n === null || n === undefined || n === '') return '—';
    return Number(n).toLocaleString('fr-DZ').replace(/ | /g, ' ') + ' DA';
  }

  // Petit toast global (non bloquant)
  function toast(message, type) {
    var el = document.createElement('div');
    el.textContent = message;
    el.style.cssText =
      'position:fixed;left:50%;bottom:28px;transform:translateX(-50%);z-index:9999;' +
      'padding:12px 22px;border-radius:50px;font-family:DM Sans,sans-serif;font-size:14px;' +
      'font-weight:600;color:#fff;box-shadow:0 8px 30px rgba(0,0,0,.18);opacity:0;' +
      'transition:opacity .25s,transform .25s;background:' +
      (type === 'error' ? '#E0454C' : type === 'warn' ? '#D26F1A' : '#2D9E5F') + ';';
    document.body.appendChild(el);
    requestAnimationFrame(function () {
      el.style.opacity = '1';
      el.style.transform = 'translateX(-50%) translateY(-6px)';
    });
    setTimeout(function () {
      el.style.opacity = '0';
      el.style.transform = 'translateX(-50%)';
      setTimeout(function () { el.remove(); }, 300);
    }, type === 'error' ? 4000 : 2600);
  }

  /* ---------------------------------------------------------
     3. KILL SWITCH — vérifie l'accès d'un salon (essai expiré / désactivé)
        Double verrou : ici (UX) + RLS côté base via verifier_acces_salon().
        Renvoie { actif:boolean, raison:string, jours_restants:number|null }
     --------------------------------------------------------- */
  async function verifierAcces(salon) {
    if (!salon) return { actif: false, raison: 'introuvable', jours_restants: null };
    if (salon.actif === false) return { actif: false, raison: 'desactive', jours_restants: null };

    if (salon.formule === 'trial') {
      if (!salon.trial_end_date) return { actif: true, raison: 'essai', jours_restants: null };
      var jours = Math.ceil((new Date(salon.trial_end_date) - new Date()) / 86400000);
      if (jours <= 0) return { actif: false, raison: 'essai_expire', jours_restants: 0 };
      return { actif: true, raison: 'essai', jours_restants: jours };
    }
    return { actif: true, raison: 'abonne', jours_restants: null };
  }

  /* ---------------------------------------------------------
     5. ACOMPTE — calcul du montant à partir de la config prestation
        prestation.acompte_actif / acompte_type / acompte_valeur
     --------------------------------------------------------- */
  function calcAcompte(prestation) {
    if (!prestation || !prestation.acompte_actif) return 0;
    var val = Number(prestation.acompte_valeur) || 0;
    if (prestation.acompte_type === 'fixe') return Math.round(val);
    return Math.round((Number(prestation.prix) || 0) * val / 100); // pourcentage
  }

  // Libellé lisible des coordonnées de paiement d'un salon
  function ribLisible(salon) {
    if (!salon || !salon.rib_numero) return null;
    var t = salon.rib_type === 'baridimob' ? 'BaridiMob'
          : salon.rib_type === 'ccp' ? 'CCP'
          : salon.rib_type === 'rib' ? 'RIB' : 'Paiement';
    var cle = salon.rib_cle ? ' · clé ' + salon.rib_cle : '';
    return t + ' : ' + salon.rib_numero + cle;
  }

  /* ---------------------------------------------------------
     6. JUSTIFICATIF — upload dans le bucket 'justificatifs'
        Chemin : {salon_id}/{reservation_id}.ext  puis attache via RPC.
        Renvoie { ok:boolean, chemin?:string, error?:string }
     --------------------------------------------------------- */
  async function uploadJustificatif(salonId, reservationId, file) {
    try {
      var ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
      var chemin = salonId + '/' + reservationId + '.' + ext;
      var up = await client.storage.from('justificatifs')
        .upload(chemin, file, { upsert: true, contentType: file.type || 'image/jpeg' });
      if (up.error) return { ok: false, error: up.error.message };
      var rpc = await client.rpc('attacher_justificatif', {
        p_reservation_id: reservationId, p_chemin: chemin
      });
      if (rpc.error) return { ok: false, error: rpc.error.message };
      return { ok: true, chemin: chemin };
    } catch (e) { return { ok: false, error: String(e) }; }
  }

  // Upload d'une image publique (logo salon, photo prestation) dans le bucket 'medias'.
  // Chemin : {salon_id}/{name}-{timestamp}.ext → renvoie l'URL publique.
  async function uploadImage(salonId, name, file) {
    try {
      var ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
      var chemin = salonId + '/' + name + '-' + Date.now() + '.' + ext;
      var up = await client.storage.from('medias')
        .upload(chemin, file, { upsert: true, contentType: file.type || 'image/jpeg' });
      if (up.error) return { ok: false, error: up.error.message };
      var pub = client.storage.from('medias').getPublicUrl(chemin);
      return { ok: true, url: (pub.data && pub.data.publicUrl) || null, chemin: chemin };
    } catch (e) { return { ok: false, error: String(e) }; }
  }

  // Upload d'une photo d'avis (client connecté) dans 'medias/avis/{salon_id}/…'.
  async function uploadAvisPhoto(salonId, file) {
    try {
      var ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
      var chemin = 'avis/' + salonId + '/' + Date.now() + '.' + ext;
      var up = await client.storage.from('medias')
        .upload(chemin, file, { upsert: false, contentType: file.type || 'image/jpeg' });
      if (up.error) return { ok: false, error: up.error.message };
      var pub = client.storage.from('medias').getPublicUrl(chemin);
      return { ok: true, url: (pub.data && pub.data.publicUrl) || null, chemin: chemin };
    } catch (e) { return { ok: false, error: String(e) }; }
  }

  // URL signée temporaire pour afficher un justificatif (côté gérant connecté).
  async function urlSigneeJustificatif(chemin, secondes) {
    var r = await client.storage.from('justificatifs')
      .createSignedUrl(chemin, secondes || 3600);
    return r && r.data ? r.data.signedUrl : null;
  }

  /* ---------------------------------------------------------
     7. AUTH — connexion Google (OAuth) + inscription email
     --------------------------------------------------------- */
  async function loginGoogle(redirectTo) {
    return client.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: redirectTo || window.location.href }
    });
  }
  async function inscriptionEmail(email, password, meta) {
    // meta = { nom, prenom, telephone } → stockés dans profiles via trigger
    return client.auth.signUp({
      email: email, password: password,
      options: { data: meta || {} }
    });
  }

  /* ---------------------------------------------------------
     8. GÉOLOC — distance Haversine (km) côté navigateur
     --------------------------------------------------------- */
  function distanceKm(lat1, lon1, lat2, lon2) {
    if ([lat1, lon1, lat2, lon2].some(function (x) { return x == null; })) return null;
    var R = 6371, dLat = (lat2 - lat1) * Math.PI / 180, dLon = (lon2 - lon1) * Math.PI / 180;
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  /* ---------------------------------------------------------
     9. EXPORT GLOBAL
     --------------------------------------------------------- */
  window.WAQQTI = {
    supabase: client,
    SUPABASE_URL: SUPABASE_URL,
    formatPhone: formatPhone,
    displayPhone: displayPhone,
    formatPrix: formatPrix,
    toast: toast,
    verifierAcces: verifierAcces,
    calcAcompte: calcAcompte,
    ribLisible: ribLisible,
    uploadJustificatif: uploadJustificatif,
    uploadImage: uploadImage,
    uploadAvisPhoto: uploadAvisPhoto,
    urlSigneeJustificatif: urlSigneeJustificatif,
    loginGoogle: loginGoogle,
    inscriptionEmail: inscriptionEmail,
    distanceKm: distanceKm
  };

  document.dispatchEvent(new CustomEvent('wq:ready'));
})();
