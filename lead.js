import { supa } from './_supabase.js';
import { CONSENT_TEXT, clean, isEmail, normalizePhone, readBody } from './_validate.js';

// Étape 1 : enregistre le contact (prénom, mobile, e-mail) et renvoie son identifiant.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Méthode non autorisée.' });
  }

  const body = readBody(req);

  // Champ piège : invisible pour une personne, rempli par les robots.
  if (clean(body.website, 200)) {
    return res.status(200).json({ id: null });
  }

  const firstName = clean(body.first_name, 80);
  const email = clean(body.email, 254).toLowerCase();
  const phone = normalizePhone(body.phone);

  const errors = {};
  if (!firstName) errors.first_name = 'Indiquez votre prénom.';
  if (!phone) errors.phone = 'Entrez un numéro de mobile français (06 ou 07).';
  if (!isEmail(email)) errors.email = 'Entrez une adresse e-mail valide.';
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ errors });
  }

  try {
    const response = await supa('leads', {
      method: 'POST',
      prefer: 'return=representation',
      body: {
        first_name: firstName,
        phone,
        email,
        consent_at: new Date().toISOString(),
        consent_text: CONSENT_TEXT,
        utm_source: clean(body.utm_source, 100) || null,
        utm_medium: clean(body.utm_medium, 100) || null,
        utm_campaign: clean(body.utm_campaign, 100) || null,
        referrer: clean(body.referrer, 300) || null,
      },
    });

    if (!response.ok) {
      console.error('Supabase : insertion du contact refusée, statut', response.status);
      return res
        .status(502)
        .json({ error: "Enregistrement impossible pour le moment. Réessayez dans un instant." });
    }

    const rows = await response.json();
    return res.status(200).json({ id: rows[0].id });
  } catch (error) {
    console.error('Erreur /api/lead :', error.message);
    return res
      .status(500)
      .json({ error: "Enregistrement impossible pour le moment. Réessayez dans un instant." });
  }
}
