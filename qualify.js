import { supa } from './_supabase.js';
import { CHOICES, clean, isUuid, readBody } from './_validate.js';

// Étape 3 : ajoute les 5 réponses de qualification au contact créé à l'étape 1.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Méthode non autorisée.' });
  }

  const body = readBody(req);
  const id = clean(body.id, 36);

  if (!isUuid(id)) {
    return res.status(400).json({ error: 'Votre inscription est introuvable. Reprenez depuis la première page.' });
  }

  const zone = clean(body.zone, 200);
  const errors = {};
  if (!CHOICES.priority.includes(body.priority)) errors.priority = 'Choisissez une réponse.';
  if (zone.length < 2) errors.zone = 'Indiquez la zone ou le souci de peau.';
  if (!CHOICES.contraindication.includes(body.contraindication)) errors.contraindication = 'Choisissez une réponse.';
  if (!CHOICES.experience.includes(body.experience)) errors.experience = 'Choisissez une réponse.';
  if (!CHOICES.source.includes(body.source)) errors.source = 'Choisissez une réponse.';
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ errors });
  }

  try {
    // Seuls les contacts encore au début du tunnel peuvent être modifiés.
    const response = await supa(`leads?id=eq.${id}&stage=in.(capture,qualifie)`, {
      method: 'PATCH',
      prefer: 'return=representation',
      body: {
        priority: body.priority,
        zone,
        contraindication: body.contraindication,
        experience: body.experience,
        source: body.source,
        stage: 'qualifie',
        qualified_at: new Date().toISOString(),
      },
    });

    if (!response.ok) {
      console.error('Supabase : mise à jour refusée, statut', response.status);
      return res
        .status(502)
        .json({ error: 'Enregistrement impossible pour le moment. Réessayez dans un instant.' });
    }

    const rows = await response.json();
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Votre inscription est introuvable. Reprenez depuis la première page.' });
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Erreur /api/qualify :', error.message);
    return res
      .status(500)
      .json({ error: 'Enregistrement impossible pour le moment. Réessayez dans un instant.' });
  }
}
