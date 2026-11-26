/* ============================================================
   WAQQTI — api/sitemap.js   →   https://www.waqqti.com/sitemap.xml

   Plan du site généré à partir de la base, à chaque passage de Google
   (mis en cache 1 h). Y figurent uniquement :
     - les pages publiques fixes ;
     - les vrais salons (pas les démos), accessibles (Kill Switch) et
       qui ont au moins une prestation ;
     - les pages ville / spécialité qui ont au moins un de ces salons.
   Si Supabase ne répond pas, les pages fixes sont quand même servies.
   ============================================================ */
'use strict';

const L = require('./_lib');

const PAGES_FIXES = [
  { loc: '/', changefreq: 'weekly', priority: '1.0' },
  { loc: '/annuaire', changefreq: 'daily', priority: '0.9' },
  { loc: '/cgu', changefreq: 'yearly', priority: '0.2' },
  { loc: '/confidentialite', changefreq: 'yearly', priority: '0.2' },
  { loc: '/mentions', changefreq: 'yearly', priority: '0.2' },
  { loc: '/suppression-compte', changefreq: 'yearly', priority: '0.1' },
];

function jour(d) {
  const t = d ? new Date(d) : null;
  return t && !isNaN(t) ? t.toISOString().slice(0, 10) : null;
}
function plusRecent(a, b) {
  if (!a) return b;
  if (!b) return a;
  return a > b ? a : b;
}
function xmlEsc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));
}
function url(e) {
  return '  <url>\n    <loc>' + xmlEsc(L.SITE + e.loc) + '</loc>\n' +
    (e.lastmod ? '    <lastmod>' + e.lastmod + '</lastmod>\n' : '') +
    (e.changefreq ? '    <changefreq>' + e.changefreq + '</changefreq>\n' : '') +
    (e.priority ? '    <priority>' + e.priority + '</priority>\n' : '') +
    '  </url>\n';
}

module.exports = async (req, res) => {
  const entrees = PAGES_FIXES.slice();

  try {
    const [salons, prestations] = await Promise.all([
      L.sb('salons?select=*&actif=eq.true'),
      L.sb('prestations?select=salon_id&actif=not.is.false'),
    ]);
    const nb = {};
    (prestations || []).forEach((p) => { nb[p.salon_id] = (nb[p.salon_id] || 0) + 1; });
    const publies = (salons || []).filter((s) => L.indexable(s, nb[s.id] || 0));

    const villes = {};
    let derniereMaj = null;
    for (const s of publies) {
      const maj = jour(s.updated_at || s.created_at);
      derniereMaj = plusRecent(derniereMaj, maj);
      entrees.push({ loc: '/salon/' + encodeURIComponent(s.slug), lastmod: maj, changefreq: 'weekly', priority: '0.8' });

      const ws = L.slugWilaya(s.wilaya);
      if (!ws) continue;
      const v = (villes[ws] = villes[ws] || { maj: null, cats: {} });
      v.maj = plusRecent(v.maj, maj);
      (s.categories || []).forEach((k) => {
        if (L.CATS[k]) v.cats[k] = plusRecent(v.cats[k] || null, maj);
      });
    }
    for (const [ws, v] of Object.entries(villes)) {
      entrees.push({ loc: '/salons/' + ws, lastmod: v.maj, changefreq: 'weekly', priority: '0.7' });
      for (const [k, maj] of Object.entries(v.cats)) {
        entrees.push({ loc: '/salons/' + ws + '/' + L.CATS[k].slug, lastmod: maj, changefreq: 'weekly', priority: '0.6' });
      }
    }
    if (derniereMaj) entrees[1].lastmod = derniereMaj; // l'annuaire change avec les salons
  } catch (e) {
    console.error('[sitemap]', e.message);
  }

  const xml = '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    entrees.map(url).join('') +
    '</urlset>\n';
  return L.envoyer(res, 200, 'application/xml; charset=utf-8', xml, 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400');
};
