// ============================================================================
//  WAQQTI — Edge Function : whatsapp-notify
//  Envoi automatique de messages WhatsApp via l'API Meta WhatsApp Business Cloud.
//  Déclenchée par un Database Webhook Supabase sur la table `reservations`
//  (INSERT + UPDATE). Le client n'a RIEN à faire : tout part automatiquement.
//
//  Événements couverts :
//    • INSERT  → confirmation de RDV au client
//              → si acompte requis : demande d'acompte au client (montant + RIB)
//              → notification "nouveau RDV" au gérant
//    • UPDATE acompte_statut : 'en_attente' (justif reçu) → alerte gérant à vérifier
//                              'recu'   → confirmation d'acompte validé au client
//                              'refuse' → message au client (justif refusé)
//
//  Secrets à définir (Supabase → Edge Functions → Secrets) :
//    WHATSAPP_TOKEN      = token permanent de l'app Meta
//    WHATSAPP_PHONE_ID   = Phone Number ID du numéro WhatsApp Business
//    SUPABASE_URL        = auto-injecté par Supabase
//    SUPABASE_SERVICE_ROLE_KEY = auto-injecté (lecture salon/prix côté serveur)
//    WEBHOOK_SECRET      = jeton partagé, comparé à l'en-tête x-webhook-secret
//
//  ⚠️ Les modèles (templates) doivent être créés et APPROUVÉS dans Meta.
//     Noms attendus (langue fr) — voir le guide :
//       waqqti_confirmation, waqqti_demande_acompte,
//       waqqti_acompte_valide, waqqti_nouveau_rdv
// ============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GRAPH = "https://graph.facebook.com/v20.0";
const TOKEN = Deno.env.get("WHATSAPP_TOKEN")!;
const PHONE_ID = Deno.env.get("WHATSAPP_PHONE_ID")!;
const WEBHOOK_SECRET = Deno.env.get("WEBHOOK_SECRET") ?? "";

const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

// N° algérien → format E.164 sans "+" attendu par l'API Meta (ex: 213770123456)
function toWa(raw: string | null): string | null {
  if (!raw) return null;
  let d = String(raw).replace(/[^\d+]/g, "");
  if (d.startsWith("+")) d = d.slice(1);
  if (d.startsWith("00")) d = d.slice(2);
  if (d.startsWith("0")) d = "213" + d.slice(1);
  if (/^[567]\d{8}$/.test(d)) d = "213" + d;
  return d;
}

function fmtDA(n: number | null): string {
  if (n == null) return "—";
  return Math.round(n).toLocaleString("fr-FR") + " DA";
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("fr-FR", {
      dateStyle: "full", timeStyle: "short", timeZone: "Africa/Algiers",
    });
  } catch { return iso; }
}

// Envoi d'un template WhatsApp avec paramètres positionnels {{1}}, {{2}}, ...
async function sendTemplate(to: string, template: string, params: string[]) {
  const body = {
    messaging_product: "whatsapp",
    to,
    type: "template",
    template: {
      name: template,
      language: { code: "fr" },
      components: params.length
        ? [{ type: "body", parameters: params.map((t) => ({ type: "text", text: t })) }]
        : [],
    },
  };
  const res = await fetch(`${GRAPH}/${PHONE_ID}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) console.error("WA error", template, JSON.stringify(json));
  return json;
}

function ribLine(s: any): string {
  const t = s.rib_type === "baridimob" ? "BaridiMob"
    : s.rib_type === "ccp" ? "CCP"
    : s.rib_type === "rib" ? "RIB" : "Paiement";
  const cle = s.rib_cle ? " clé " + s.rib_cle : "";
  const tit = s.rib_titulaire ? ` (${s.rib_titulaire})` : "";
  return `${t} ${s.rib_numero ?? ""}${cle}${tit}`.trim();
}

Deno.serve(async (req) => {
  // Vérif du secret partagé (le webhook Supabase doit envoyer x-webhook-secret)
  if (WEBHOOK_SECRET && req.headers.get("x-webhook-secret") !== WEBHOOK_SECRET) {
    return new Response("unauthorized", { status: 401 });
  }

  let payload: any;
  try { payload = await req.json(); } catch { return new Response("bad json", { status: 400 }); }

  const type = payload.type;                 // "INSERT" | "UPDATE"
  const row = payload.record;                 // nouvelle ligne
  const old = payload.old_record;             // ancienne ligne (UPDATE)
  if (!row || !row.salon_id) return new Response("skip", { status: 200 });

  // Salon (nom + RIB + tél gérant)
  const { data: salon } = await admin
    .from("salons").select("*").eq("id", row.salon_id).single();
  if (!salon) return new Response("no salon", { status: 200 });

  const clientWa = toWa(row.client_telephone);
  const gerantWa = toWa(salon.telephone);
  const quand = fmtDate(row.date_rdv);

  try {
    if (type === "INSERT") {
      // 1) Confirmation au client
      if (clientWa) {
        await sendTemplate(clientWa, "waqqti_confirmation",
          [row.client_nom ?? "client", salon.nom, row.prestation_nom ?? "prestation", quand]);
        // 2) Demande d'acompte si requis
        if (row.acompte_statut === "en_attente" && row.acompte_montant) {
          await sendTemplate(clientWa, "waqqti_demande_acompte",
            [salon.nom, fmtDA(row.acompte_montant), ribLine(salon)]);
        }
      }
      // 3) Notification gérant
      if (gerantWa) {
        await sendTemplate(gerantWa, "waqqti_nouveau_rdv",
          [row.prestation_nom ?? "prestation", row.client_nom ?? "client",
           row.client_telephone ?? "—", quand]);
      }
    } else if (type === "UPDATE" && old && row.acompte_statut !== old.acompte_statut) {
      if (row.acompte_statut === "en_attente" && old.acompte_statut !== "en_attente" && gerantWa) {
        // justificatif reçu → prévenir le gérant qu'il y a un paiement à vérifier
        await sendTemplate(gerantWa, "waqqti_nouveau_rdv",
          ["Justificatif d'acompte à vérifier", row.client_nom ?? "client",
           row.client_telephone ?? "—", quand]);
      }
      if (row.acompte_statut === "recu" && clientWa) {
        await sendTemplate(clientWa, "waqqti_acompte_valide", [salon.nom, quand]);
      }
      if (row.acompte_statut === "refuse" && clientWa) {
        await sendTemplate(clientWa, "waqqti_demande_acompte",
          [salon.nom, fmtDA(row.acompte_montant), ribLine(salon)]);
      }
    }
  } catch (e) {
    console.error(e);
  }

  return new Response("ok", { status: 200, headers: { "content-type": "text/plain" } });
});
