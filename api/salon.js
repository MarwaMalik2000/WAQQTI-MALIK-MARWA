/* ============================================================
   WAQQTI — api/salon.js   →   https://www.waqqti.com/salon/<slug>

   Sert la page de réservation (client/salon.html) DÉJÀ REMPLIE pour
   Google et pour les aperçus WhatsApp / Facebook :
     - titre, description, adresse canonique propre
     - image d'aperçu = photo du salon
     - fiche schema.org (HairSalon / BeautySalon…) : adresse, horaires,
       prestations et prix, note issue des avis Waqqti
   Le visiteur obtient exactement la même page qu'avant : le JavaScript
   de réservation prend le relais une fois la page chargée.

   Si Supabase ne répond pas, la page brute est servie quand même :
   la réservation continue de fonctionner.
   ============================================================ */
'use strict';

const fs = require('fs');
const path = require('path');
const L = require('./_lib');

let MODELE = null;
function modele() {
  if (!MODELE) MODELE = fs.readFileSync(path.join(process.cwd(), 'client', 'salon.html'), 'utf8');
  return MODELE;
}

/* Retire du modèle les balises SEO génériques, remplacées ensuite par
   celles du salon. */
function nettoyerTete(html) {
  return html
    .replace(/<title>[\s\S]*?<\/title>\s*/i, '')
    .replace(/\s*<meta\s+name="robots"[^>]*>/gi, '')
    .replace(/\s*<meta\s+name="description"[^>]*>/gi, '')
    .replace(/\s*<link\s+rel="canonical"[^>]*>/gi, '')
    .replace(/\s*<meta\s+property="og:(?:type|locale|title|description|url|image(?::[a-z]+)?)"[^>]*>/gi, '')
    .replace(/\s*<meta\s+name="twitter:[a-z]+"[^>]*>/gi, '');
}

function horaires(s) {
  const fermes = Array.isArray(s.jours_fermes) ? s.jours_fermes.map(Number) : [];
  const jours = L.JOURS_SCHEMA.filter((_, i) => !fermes.includes(i));
  if (!jours.length) return null;
  const hh = (t, d) => String(t || d).slice(0, 5);
  const ouv = hh(s.heure_ouverture, '09:00');
  const fer = hh(s.heure_fermeture, '19:00');
  const pd = s.pause_debut ? hh(s.pause_debut) : null;
  const pf = s.pause_fin ? hh(s.pause_fin) : null;
  const plages = pd && pf && pd > ouv && pf < fer ? [[ouv, pd], [pf, fer]] : [[ouv, fer]];
  return plages.map(([o, f]) => ({
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: jours.map((j) => 'https://schema.org/' + j),
    opens: o,
    closes: f,
  }));
}

function ficheSchema(s, prestations, avis, url, image, ville) {
  const cat = L.categorieSalon(s);
  const fiche = {
    '@type': cat ? L.CATS[cat].type : 'BeautySalon',
    '@id': url + '#salon',
    name: s.nom,
    url,
    image,
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'DZ',
      ...(s.adresse ? { streetAddress: s.adresse } : {}),
      ...(ville ? { addressLocality: ville, addressRegion: ville } : {}),
    },
  };
  if (s.description) fiche.description = L.tronque(s.description, 500);
  if (s.telephone) fiche.telephone = String(s.telephone);
  if (s.logo_url) fiche.logo = s.logo_url;
  if (s.latitude != null && s.longitude != null) {
    fiche.geo = { '@type': 'GeoCoordinates', latitude: Number(s.latitude), longitude: Number(s.longitude) };
  }
  const h = horaires(s);
  if (h) fiche.openingHoursSpecification = h;

  const prix = prestations.map((p) => Number(p.prix)).filter((n) => n > 0);
  if (prix.length) {
    const min = Math.min(...prix);
    const max = Math.max(...prix);
    fiche.priceRange = min === max ? L.prixDA(min) : L.prixDA(min) + ' – ' + L.prixDA(max);
    fiche.currenciesAccepted = 'DZD';
  }
  if (prestations.length) {
    fiche.hasOfferCatalog = {
      '@type': 'OfferCatalog',
      name: 'Prestations',
      itemListElement: prestations.slice(0, 40).map((p) => ({
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: p.nom,
          ...(p.duree_minutes ? { description: p.duree_minutes + ' min' } : {}),
        },
        ...(Number(p.prix) > 0 ? { price: Number(p.prix), priceCurrency: 'DZD' } : {}),
      })),
    };
  }

  // Note : uniquement les vrais avis laissés après un rendez-vous Waqqti,
  // et seulement s'il y en a (une note sans nombre d'avis est invalide).
  const nb = Number(s.nb_avis) || 0;
  const note = Number(s.note_moyenne);
  if (nb > 0 && note > 0) {
    fiche.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: Math.round(note * 10) / 10,
      reviewCount: nb,
      bestRating: 5,
      worstRating: 1,
    };
    const avecNom = avis.filter((a) => a && a.auteur_nom && Number(a.note) > 0).slice(0, 5);
    if (avecNom.length) {
      fiche.review = avecNom.map((a) => ({
        '@type': 'Review',
        author: { '@type': 'Person', name: String(a.auteur_nom).slice(0, 60) },
        reviewRating: { '@type': 'Rating', ratingValue: Number(a.note), bestRating: 5, worstRating: 1 },
        ...(a.commentaire ? { reviewBody: L.tronque(a.commentaire, 400) } : {}),
        ...(a.created_at ? { datePublished: String(a.created_at).slice(0, 10) } : {}),
      }));
    }
  }

  fiche.potentialAction = {
    '@type': 'ReserveAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: url,
      actionPlatform: ['https://schema.org/DesktopWebPlatform', 'https://schema.org/MobileWebPlatform'],
    },
    result: { '@type': 'Reservation', name: 'Rendez-vous chez ' + s.nom },
  };
  return fiche;
}

function descriptionSalon(s, prestations, ville) {
  if (s.description && s.description.trim().length >= 60) {
    return L.tronque(s.description, 158);
  }
  const lieu = ville ? ' à ' + ville : '';
  const exemples = prestations
    .filter((p) => Number(p.prix) > 0)
    .slice(0, 2)
    .map((p) => p.nom + ' ' + L.prixDA(p.prix))
    .join(', ');
  const base = 'Réservez en ligne chez ' + s.nom + lieu + (exemples ? ' : ' + exemples + '.' : '.') +
    ' Confirmation immédiate, sans appeler.';
  return L.tronque(base, 158);
}

module.exports = async (req, res) => {
  const slug = String((req.query && req.query.slug) || '').trim().toLowerCase();
  const brut = modele();

  if (!slug || !/^[a-z0-9-]{1,120}$/.test(slug)) {
    return L.envoyer(res, 404, 'text/html; charset=utf-8', brut, 'public, max-age=0, s-maxage=60');
  }

  let salon = null;
  let prestations = [];
  let avis = [];
  try {
    const lignes = await L.sb('salons?select=*&slug=eq.' + encodeURIComponent(slug) + '&actif=eq.true&limit=1');
    salon = lignes[0] || null;
    if (salon) {
      const [p, a] = await Promise.all([
        L.sb('prestations?select=nom,prix,duree_minutes,categorie,ordre&salon_id=eq.' + salon.id +
             '&actif=not.is.false&order=ordre.asc&limit=60').catch(() => []),
        L.sb('avis?select=note,commentaire,auteur_nom,created_at&salon_id=eq.' + salon.id +
             '&order=created_at.desc&limit=5').catch(() => []),
      ]);
      prestations = Array.isArray(p) ? p : [];
      avis = Array.isArray(a) ? a : [];
    }
  } catch (e) {
    // Supabase indisponible : page brute, le JavaScript fera le travail.
    console.error('[salon]', e.message);
    return L.envoyer(res, 200, 'text/html; charset=utf-8', brut, 'public, max-age=0, s-maxage=30');
  }

  if (!salon) {
    // Salon inconnu ou désactivé : vraie réponse 404 pour Google,
    // la page affiche « Salon introuvable » comme avant.
    return L.envoyer(res, 404, 'text/html; charset=utf-8', brut, 'public, max-age=0, s-maxage=60');
  }

  const url = L.SITE + '/salon/' + encodeURIComponent(salon.slug);
  const ville = L.nomWilaya(salon.wilaya);
  const cat = L.categorieSalon(salon);
  const metier = cat ? L.CATS[cat].metier : 'Salon de beauté';
  const titre = salon.nom + ' – ' + metier + (ville ? ' à ' + ville : '') + ' | Waqqti';
  const description = descriptionSalon(salon, prestations, ville);
  const image = L.imageSalon(salon);
  const ouvert = L.indexable(salon, prestations.length);

  const graphe = [ficheSchema(salon, prestations, avis, url, image, ville)];
  const ariane = [{ '@type': 'ListItem', position: 1, name: 'Accueil', item: L.SITE + '/' }];
  if (ville && ouvert) {
    ariane.push({ '@type': 'ListItem', position: 2, name: 'Salons à ' + ville, item: L.SITE + '/salons/' + L.slugWilaya(salon.wilaya) });
  }
  ariane.push({ '@type': 'ListItem', position: ariane.length + 1, name: salon.nom, item: url });
  graphe.push({ '@type': 'BreadcrumbList', itemListElement: ariane });

  const tete = [
    '<title>' + L.esc(titre) + '</title>',
    '<meta name="description" content="' + L.esc(description) + '"/>',
    '<meta name="robots" content="' + (ouvert ? 'index, follow, max-image-preview:large' : 'noindex, follow') + '"/>',
    '<link rel="canonical" href="' + L.esc(url) + '"/>',
    '<meta property="og:type" content="business.business"/>',
    '<meta property="og:locale" content="fr_DZ"/>',
    '<meta property="og:locale:alternate" content="ar_DZ"/>',
    '<meta property="og:title" content="' + L.esc(salon.nom + (ville ? ' – ' + ville : '')) + '"/>',
    '<meta property="og:description" content="' + L.esc(description) + '"/>',
    '<meta property="og:url" content="' + L.esc(url) + '"/>',
    '<meta property="og:image" content="' + L.esc(image) + '"/>',
    '<meta property="og:image:alt" content="' + L.esc(salon.nom) + '"/>',
    '<meta name="twitter:card" content="summary_large_image"/>',
    '<meta name="twitter:title" content="' + L.esc(salon.nom) + '"/>',
    '<meta name="twitter:description" content="' + L.esc(description) + '"/>',
    '<meta name="twitter:image" content="' + L.esc(image) + '"/>',
    L.jsonLd({ '@context': 'https://schema.org', '@graph': graphe }),
  ].join('\n  ');

  let html = nettoyerTete(brut);
  // Juste après <meta charset> / viewport, pour que le titre arrive tôt.
  if (/<meta\s+name="viewport"[^>]*>/i.test(html)) {
    html = html.replace(/(<meta\s+name="viewport"[^>]*>)/i, (m) => m + '\n  ' + tete);
  } else {
    html = html.replace(/<head>/i, (m) => m + '\n  ' + tete);
  }
  // Le nom du salon est dans la page dès l'arrivée (Google, lecteurs d'écran).
  html = html.replace(/(<div class="salon-info">\s*<h1>)[\s\S]*?(<\/h1>)/, (m, a, b) => a + L.esc(salon.nom) + b);

  return L.envoyer(res, 200, 'text/html; charset=utf-8', html);
};
