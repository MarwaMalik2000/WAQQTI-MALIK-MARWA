/* ============================================================
   WAQQTI — api/_lib.js
   Outils partagés par les fonctions SEO (pages salon, pages ville,
   sitemap). Le préfixe « _ » empêche Vercel d'en faire une route.

   Lecture seule : ces fonctions n'utilisent que la clé publique
   « anon » de Supabase (la même que le site), donc uniquement ce que
   les règles RLS laissent déjà voir à tout visiteur.
   ============================================================ */
'use strict';

const SITE = 'https://www.waqqti.com';
const SUPABASE_URL = 'https://zsbbemdbjoaurywkoshx.supabase.co';
const SUPABASE_ANON =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpzYmJlbWRiam9hdXJ5d2tvc2h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5MzIwNDYsImV4cCI6MjEwMTUwODA0Nn0.NcDE2hWHhtX2h-2hKe2oBv-GPQFh88N93CqMXtnTxkE';

const DEFAULT_IMAGE = SITE + '/assets/og-image.png';

/* Spécialités (mêmes clés que l'annuaire) :
   - slug  : morceau d'URL des pages ville (/salons/alger/barbier)
   - label : titre de la page de spécialité
   - metier: mot utilisé dans le titre d'une fiche salon
   - type  : type schema.org le plus précis pour Google */
const CATS = {
  barber:              { slug: 'barbier',            label: 'Barbiers et coiffeurs hommes', metier: 'Barbier',                type: 'HairSalon' },
  coiffure_maquillage: { slug: 'coiffure-maquillage', label: 'Coiffure et maquillage',       metier: 'Coiffure & maquillage',  type: 'HairSalon' },
  onglerie:            { slug: 'onglerie',           label: 'Onglerie',                     metier: 'Onglerie',               type: 'NailSalon' },
  spa:                 { slug: 'spa',                label: 'Spa et bien-être',             metier: 'Spa & bien-être',        type: 'DaySpa' },
  soin_visage:         { slug: 'soin-visage',        label: 'Esthétique et soin du visage', metier: 'Institut de beauté',     type: 'BeautySalon' },
  regard:              { slug: 'beaute-du-regard',   label: 'Beauté du regard',             metier: 'Beauté du regard',       type: 'BeautySalon' },
  mariage:             { slug: 'mariage',            label: 'Beauté mariage et événements', metier: 'Beauté mariage',         type: 'BeautySalon' },
  bienetre_h:          { slug: 'bien-etre-homme',    label: 'Bien-être hommes',             metier: 'Bien-être homme',        type: 'DaySpa' },
};
const CAT_BY_SLUG = Object.fromEntries(Object.entries(CATS).map(([k, v]) => [v.slug, k]));

const JOURS_SCHEMA = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/* ── Petits utilitaires ───────────────────────────────────── */

function esc(v) {
  return String(v == null ? '' : v).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function slugify(v) {
  return String(v || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/* « 16 - Alger » → « Alger » ; « alger » → « Alger » */
function nomWilaya(w) {
  const s = String(w || '').replace(/^\s*\d+\s*[-–—.]?\s*/, '').trim();
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
}
function slugWilaya(w) {
  return slugify(nomWilaya(w));
}

function tronque(txt, max) {
  const s = String(txt || '').replace(/\s+/g, ' ').trim();
  if (s.length <= max) return s;
  return s.slice(0, max - 1).replace(/\s+\S*$/, '') + '…';
}

function prixDA(n) {
  return Number(n).toLocaleString('fr-FR').replace(/ | /g, ' ') + ' DA';
}

/* JSON-LD sûr à insérer dans <script> : « < » échappé, donc aucun
   contenu saisi (nom, avis…) ne peut refermer la balise. */
function jsonLd(obj) {
  return '<script type="application/ld+json">' +
    JSON.stringify(obj).replace(/</g, '\\u003c').replace(/[\u2028\u2029]/g, ' ') +
    '</script>';
}

/* ── Accès Supabase (REST, lecture seule) ─────────────────── */

async function sb(chemin, { timeoutMs = 4000 } = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(SUPABASE_URL + '/rest/v1/' + chemin, {
      headers: { apikey: SUPABASE_ANON, Authorization: 'Bearer ' + SUPABASE_ANON, Accept: 'application/json' },
      signal: ctrl.signal,
    });
    if (!r.ok) {
      const err = new Error('Supabase ' + r.status + ' : ' + (await r.text()).slice(0, 200));
      err.status = r.status;
      throw err;
    }
    return await r.json();
  } finally {
    clearTimeout(t);
  }
}

/* ── Règles de publication ────────────────────────────────── */

/* Même règle que verifier_acces_salon (Kill Switch) : un salon en
   essai expiré n'est plus présenté à Google. */
function accesActif(s) {
  if (!s || s.actif === false) return false;
  if (s.formule !== 'trial') return true;
  if (!s.trial_end_date) return true;
  return new Date(s.trial_end_date).getTime() > Date.now();
}

/* Salon de démonstration : colonne « demo » (migration_seo.sql),
   et par sécurité tout salon dont le nom ou l'adresse contient « démo ». */
function estDemo(s) {
  if (!s) return true;
  if (s.demo === true) return true;
  return /d[ée]mo/i.test(String(s.slug || '') + ' ' + String(s.nom || ''));
}

/* Un salon n'est envoyé à Google que s'il est réel, accessible et
   qu'il a au moins une prestation à montrer : pas de page vide. */
function indexable(s, nbPrestations) {
  return !estDemo(s) && accesActif(s) && nbPrestations > 0;
}

function categorieSalon(s) {
  const cats = Array.isArray(s && s.categories) ? s.categories : [];
  return cats.find((k) => CATS[k]) || null;
}

function imageSalon(s) {
  const photos = Array.isArray(s && s.photos) ? s.photos.filter(Boolean) : [];
  return photos[0] || (s && s.logo_url) || DEFAULT_IMAGE;
}

function envoyer(res, status, type, corps, cache) {
  res.statusCode = status;
  res.setHeader('Content-Type', type);
  res.setHeader('Cache-Control', cache || 'public, max-age=0, s-maxage=600, stale-while-revalidate=86400');
  res.end(corps);
}

module.exports = {
  SITE, DEFAULT_IMAGE, CATS, CAT_BY_SLUG, JOURS_SCHEMA,
  esc, slugify, nomWilaya, slugWilaya, tronque, prixDA, jsonLd,
  sb, accesActif, estDemo, indexable, categorieSalon, imageSalon, envoyer,
};
