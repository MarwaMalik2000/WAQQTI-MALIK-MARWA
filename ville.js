/* ============================================================
   WAQQTI — api/ville.js
     https://www.waqqti.com/salons/<wilaya>              (ex. /salons/alger)
     https://www.waqqti.com/salons/<wilaya>/<specialite> (ex. /salons/oran/barbier)

   Pages d'atterrissage pour les recherches locales (« barbier Oran »,
   « salon de beauté Alger »). Une page n'existe que si elle a au moins
   un vrai salon à montrer : sinon réponse 404, jamais de page vide
   (Google pénalise les pages vides comme des « pages satellites »).
   ============================================================ */
'use strict';

const L = require('./_lib');

async function donnees() {
  const [salons, prestations] = await Promise.all([
    L.sb('salons?select=*&actif=eq.true&order=note_moyenne.desc.nullslast'),
    L.sb('prestations?select=salon_id,prix&actif=not.is.false'),
  ]);
  const parSalon = {};
  for (const p of prestations || []) {
    const e = (parSalon[p.salon_id] = parSalon[p.salon_id] || { n: 0, min: null });
    e.n += 1;
    const prix = Number(p.prix);
    if (prix > 0 && (e.min === null || prix < e.min)) e.min = prix;
  }
  const publies = (salons || []).filter((s) => L.indexable(s, (parSalon[s.id] || {}).n || 0));
  return { publies, parSalon };
}

function etoiles(note) {
  const n = Math.round(Number(note) || 0);
  return '★★★★★'.slice(0, n) + '☆☆☆☆☆'.slice(0, 5 - n);
}

function carte(s, info) {
  const cats = (Array.isArray(s.categories) ? s.categories : []).filter((k) => L.CATS[k]).slice(0, 2);
  const nb = Number(s.nb_avis) || 0;
  const img = (Array.isArray(s.photos) && s.photos.filter(Boolean)[0]) || s.logo_url || '';
  return '<article class="carte">' +
    '<a class="lien" href="/salon/' + encodeURIComponent(s.slug) + '">' +
      (img
        ? '<img class="photo" src="' + L.esc(img) + '" alt="' + L.esc(s.nom) + '" loading="lazy" width="400" height="240"/>'
        : '<div class="photo vide">' + L.esc((s.nom || '?').charAt(0).toUpperCase()) + '</div>') +
      '<div class="corps">' +
        '<h3>' + L.esc(s.nom) + '</h3>' +
        (nb > 0
          ? '<p class="note"><span class="et">' + etoiles(s.note_moyenne) + '</span> <b>' + Number(s.note_moyenne).toFixed(1) + '</b> <span class="gris">(' + nb + ' avis)</span></p>'
          : '<p class="note gris">Nouveau sur Waqqti</p>') +
        '<p class="adr">📍 ' + L.esc(s.adresse || L.nomWilaya(s.wilaya)) + '</p>' +
        (cats.length ? '<p class="tags">' + cats.map((k) => '<span>' + L.esc(L.CATS[k].label) + '</span>').join('') + '</p>' : '') +
        (s.description ? '<p class="desc">' + L.esc(L.tronque(s.description, 140)) + '</p>' : '') +
        '<p class="bas">' + (info && info.min ? '<span>À partir de <b>' + L.prixDA(info.min) + '</b></span>' : '<span></span>') +
          '<span class="cta">Réserver →</span></p>' +
      '</div>' +
    '</a>' +
  '</article>';
}

function page({ titre, description, h1, intro, url, robots, contenu, schema }) {
  return '<!DOCTYPE html>\n<html lang="fr">\n<head>\n' +
  '  <meta charset="UTF-8"/>\n' +
  '  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>\n' +
  '  <title>' + L.esc(titre) + '</title>\n' +
  '  <meta name="description" content="' + L.esc(description) + '"/>\n' +
  '  <meta name="robots" content="' + robots + '"/>\n' +
  (url ? '  <link rel="canonical" href="' + L.esc(url) + '"/>\n' : '') +
  '  <meta name="theme-color" content="#F68423"/>\n' +
  '  <link rel="icon" href="/assets/logo.svg"/>\n' +
  '  <link rel="apple-touch-icon" href="/apple-touch-icon.png"/>\n' +
  '  <meta property="og:type" content="website"/>\n' +
  '  <meta property="og:site_name" content="Waqqti"/>\n' +
  '  <meta property="og:locale" content="fr_DZ"/>\n' +
  '  <meta property="og:title" content="' + L.esc(h1) + '"/>\n' +
  '  <meta property="og:description" content="' + L.esc(description) + '"/>\n' +
  (url ? '  <meta property="og:url" content="' + L.esc(url) + '"/>\n' : '') +
  '  <meta property="og:image" content="' + L.DEFAULT_IMAGE + '"/>\n' +
  '  <meta property="og:image:width" content="1200"/>\n  <meta property="og:image:height" content="630"/>\n' +
  '  <meta name="twitter:card" content="summary_large_image"/>\n' +
  '  <link rel="preconnect" href="https://fonts.googleapis.com"/>\n' +
  '  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@700&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet"/>\n' +
  (schema ? '  ' + L.jsonLd(schema) + '\n' : '') +
  '  <style>\n' +
  '    :root{--or:#F68423;--or-dk:#D26F1A;--cream:#FBF6EF;--brun:#2C1A0E;--gris:#8A7663;--bord:#EFE6DA}\n' +
  '    *{box-sizing:border-box;margin:0;padding:0}\n' +
  '    body{font-family:"DM Sans",system-ui,sans-serif;background:var(--cream);color:var(--brun);line-height:1.6;-webkit-font-smoothing:antialiased}\n' +
  '    a{color:inherit}\n' +
  '    .haut{background:linear-gradient(135deg,var(--or),var(--or-dk));color:#fff;padding:18px 0 46px}\n' +
  '    .barre{width:min(1100px,90%);margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:12px}\n' +
  '    .barre img{height:46px;filter:brightness(0) invert(1);display:block}\n' +
  '    .barre nav a{color:#fff;text-decoration:none;font-weight:500;margin-inline-start:18px;font-size:15px}\n' +
  '    .titre{width:min(1100px,90%);margin:34px auto 0}\n' +
  '    .fil{font-size:13px;opacity:.9;margin-bottom:10px}.fil a{text-decoration:none}\n' +
  '    h1{font-family:"Cormorant Garamond",serif;font-size:clamp(34px,6vw,52px);line-height:1.05;letter-spacing:-.02em}\n' +
  '    .intro{max-width:720px;margin-top:12px;font-size:17px;opacity:.95}\n' +
  '    main{width:min(1100px,90%);margin:-24px auto 0;padding:0 0 60px}\n' +
  '    .grille{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(300px,100%),1fr));gap:18px}\n' +
  '    .carte{background:#fff;border:1px solid var(--bord);border-radius:20px;overflow:hidden;box-shadow:0 8px 24px rgba(60,30,0,.06);transition:transform .2s}\n' +
  '    .carte:hover{transform:translateY(-3px)}\n' +
  '    .lien{display:block;text-decoration:none;height:100%}\n' +
  '    .photo{width:100%;height:180px;object-fit:cover;display:block;background:#F5E9DA}\n' +
  '    .photo.vide{display:flex;align-items:center;justify-content:center;font-family:"Cormorant Garamond",serif;font-size:64px;color:#fff;background:linear-gradient(135deg,#F5B865,var(--or))}\n' +
  '    .corps{padding:16px 18px 18px}\n' +
  '    h3{font-family:"Cormorant Garamond",serif;font-size:26px;line-height:1.1}\n' +
  '    .note{font-size:14px;margin-top:4px}.et{color:#F6A623;letter-spacing:1px}.gris{color:var(--gris)}\n' +
  '    .adr{font-size:14px;color:var(--gris);margin-top:6px}\n' +
  '    .tags{margin-top:8px;display:flex;flex-wrap:wrap;gap:6px}.tags span{font-size:12px;background:#FEF1E2;color:var(--or-dk);border-radius:999px;padding:3px 10px;font-weight:600}\n' +
  '    .desc{font-size:14px;margin-top:8px;color:#5A4433}\n' +
  '    .bas{display:flex;justify-content:space-between;align-items:center;margin-top:12px;font-size:14px}\n' +
  '    .cta{color:var(--or-dk);font-weight:700}\n' +
  '    section{margin-top:40px}\n' +
  '    h2{font-family:"Cormorant Garamond",serif;font-size:30px;margin-bottom:12px}\n' +
  '    .puces{display:flex;flex-wrap:wrap;gap:10px}\n' +
  '    .puces a{background:#fff;border:1px solid var(--bord);border-radius:999px;padding:8px 16px;text-decoration:none;font-size:14px;font-weight:500}\n' +
  '    .puces a:hover{border-color:var(--or);color:var(--or-dk)}\n' +
  '    .texte{max-width:760px;color:#5A4433}\n' +
  '    .bouton{display:inline-block;margin-top:18px;background:var(--or);color:#fff;text-decoration:none;font-weight:600;border-radius:999px;padding:13px 24px}\n' +
  '    footer{text-align:center;padding:28px 5%;color:var(--gris);font-size:13px}footer a{color:var(--or-dk)}\n' +
  '    @media (max-width:600px){.barre nav a{margin-inline-start:12px;font-size:14px}}\n' +
  '  </style>\n' +
  '  <script defer src="/assets/cookies.js"></script>\n' +
  '</head>\n<body>\n' +
  '  <header class="haut">\n' +
  '    <div class="barre"><a href="/"><img src="/assets/logo.svg" alt="Waqqti"/></a>' +
  '<nav><a href="/annuaire">Tous les salons</a><a href="/pro/dashboard">Espace Pro</a></nav></div>\n' +
  '    <div class="titre">' + contenu.fil + '<h1>' + L.esc(h1) + '</h1><p class="intro">' + intro + '</p></div>\n' +
  '  </header>\n' +
  '  <main>\n' + contenu.corps + '\n  </main>\n' +
  '  <footer>© ' + new Date().getFullYear() + ' Waqqti · <a href="/">Accueil</a> · <a href="/annuaire">Annuaire</a> · ' +
  '<a href="/cgu">CGU</a> · <a href="/confidentialite">Confidentialité</a> · <a href="/mentions">Mentions légales</a></footer>\n' +
  '</body>\n</html>\n';
}

function pageIntrouvable(res) {
  const html = page({
    titre: 'Aucun salon ici pour le moment | Waqqti',
    description: 'Retrouvez tous les salons de beauté et de coiffure qui acceptent la réservation en ligne sur Waqqti.',
    h1: 'Aucun salon ici pour le moment',
    intro: 'Les salons partenaires de cette ville arrivent bientôt sur Waqqti.',
    url: null,
    robots: 'noindex, follow',
    contenu: {
      fil: '<p class="fil"><a href="/">Accueil</a> › Salons</p>',
      corps: '<section><p class="texte">En attendant, parcourez tous les salons disponibles.</p>' +
        '<a class="bouton" href="/annuaire">Voir l\'annuaire des salons →</a></section>',
    },
  });
  return L.envoyer(res, 404, 'text/html; charset=utf-8', html, 'public, max-age=0, s-maxage=300');
}

module.exports = async (req, res) => {
  const wSlug = L.slugify((req.query && req.query.wilaya) || '');
  const cSlug = L.slugify((req.query && req.query.cat) || '');
  const catKey = cSlug ? L.CAT_BY_SLUG[cSlug] : null;
  if (!wSlug || (cSlug && !catKey)) return pageIntrouvable(res);

  let d;
  try {
    d = await donnees();
  } catch (e) {
    console.error('[ville]', e.message);
    res.setHeader('Retry-After', '120');
    return L.envoyer(res, 503, 'text/plain; charset=utf-8', 'Service momentanément indisponible.', 'no-store');
  }

  const dansVille = d.publies.filter((s) => L.slugWilaya(s.wilaya) === wSlug);
  const liste = catKey ? dansVille.filter((s) => (s.categories || []).includes(catKey)) : dansVille;
  if (!liste.length) return pageIntrouvable(res);

  const ville = L.nomWilaya(liste[0].wilaya);
  const cat = catKey ? L.CATS[catKey] : null;
  const url = L.SITE + '/salons/' + wSlug + (cat ? '/' + cat.slug : '');
  const n = liste.length;
  const quoi = cat ? cat.label : 'Salons de beauté et de coiffure';
  const h1 = quoi + ' à ' + ville;
  const titre = h1 + ' – Réservation en ligne | Waqqti';
  const description = L.tronque(
    n + (n > 1 ? ' adresses' : ' adresse') + ' à ' + ville + ' où réserver en ligne' +
    (cat ? ' (' + cat.label.toLowerCase() + ')' : '') +
    ' : prestations, prix et avis clients vérifiés. Confirmation immédiate, sans appeler.', 158);
  const intro = n + (n > 1 ? ' salons acceptent' : ' salon accepte') + ' la réservation en ligne à ' + L.esc(ville) +
    '. Comparez les prestations, les prix et les avis, puis réservez votre créneau en quelques secondes, sans appeler.';

  // Liens internes : spécialités présentes dans cette ville, autres villes.
  const catsVille = {};
  dansVille.forEach((s) => (s.categories || []).forEach((k) => { if (L.CATS[k]) catsVille[k] = (catsVille[k] || 0) + 1; }));
  const villes = {};
  d.publies.forEach((s) => {
    const ws = L.slugWilaya(s.wilaya);
    if (ws && ws !== wSlug) villes[ws] = villes[ws] || { nom: L.nomWilaya(s.wilaya), n: 0 };
    if (ws && ws !== wSlug) villes[ws].n += 1;
  });

  const lienVille = '/salons/' + wSlug;
  const fil = '<p class="fil"><a href="/">Accueil</a> › ' +
    (cat ? '<a href="' + lienVille + '">Salons à ' + L.esc(ville) + '</a> › ' + L.esc(cat.label) : 'Salons à ' + L.esc(ville)) + '</p>';

  let corps = '<div class="grille">' + liste.map((s) => carte(s, d.parSalon[s.id])).join('') + '</div>';
  const autresCats = Object.keys(catsVille).filter((k) => k !== catKey);
  if (autresCats.length || cat) {
    corps += '<section><h2>Par spécialité à ' + L.esc(ville) + '</h2><div class="puces">' +
      (cat ? '<a href="' + lienVille + '">Tous les salons (' + dansVille.length + ')</a>' : '') +
      autresCats.map((k) => '<a href="' + lienVille + '/' + L.CATS[k].slug + '">' + L.esc(L.CATS[k].label) + ' (' + catsVille[k] + ')</a>').join('') +
      '</div></section>';
  }
  const autresVilles = Object.entries(villes).sort((a, b) => b[1].n - a[1].n).slice(0, 24);
  if (autresVilles.length) {
    corps += '<section><h2>Dans d\'autres villes</h2><div class="puces">' +
      autresVilles.map(([ws, v]) => '<a href="/salons/' + ws + '">Salons à ' + L.esc(v.nom) + '</a>').join('') + '</div></section>';
  }
  corps += '<section><h2>Réserver ' + (cat ? cat.label.toLowerCase() : 'votre salon') + ' à ' + L.esc(ville) + ' avec Waqqti</h2>' +
    '<p class="texte">Sur Waqqti, chaque salon affiche ses prestations, ses tarifs en dinars et ses créneaux libres en temps réel. ' +
    'Vous choisissez votre prestation, votre coiffeur ou votre esthéticienne et votre horaire : la réservation est confirmée immédiatement, ' +
    'et vous recevez un rappel avant votre rendez-vous. Les avis sont laissés uniquement par des clients venus au salon.</p>' +
    '<a class="bouton" href="/annuaire">Voir tous les salons →</a></section>';

  const ariane = [
    { '@type': 'ListItem', position: 1, name: 'Accueil', item: L.SITE + '/' },
    { '@type': 'ListItem', position: 2, name: 'Salons à ' + ville, item: L.SITE + lienVille },
  ];
  if (cat) ariane.push({ '@type': 'ListItem', position: 3, name: cat.label, item: url });

  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': url + '#page',
        name: h1,
        url,
        description,
        inLanguage: 'fr-DZ',
        isPartOf: { '@id': L.SITE + '/#site' },
        mainEntity: {
          '@type': 'ItemList',
          numberOfItems: n,
          itemListElement: liste.map((s, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            url: L.SITE + '/salon/' + encodeURIComponent(s.slug),
            name: s.nom,
          })),
        },
      },
      { '@type': 'BreadcrumbList', itemListElement: ariane },
    ],
  };

  const html = page({
    titre, description, h1, intro, url,
    robots: 'index, follow, max-image-preview:large',
    contenu: { fil, corps },
    schema,
  });
  return L.envoyer(res, 200, 'text/html; charset=utf-8', html, 'public, max-age=0, s-maxage=1800, stale-while-revalidate=86400');
};
