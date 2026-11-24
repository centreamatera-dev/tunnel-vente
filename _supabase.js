// Appel de l'API REST de Supabase avec la clé service_role.
// Cette clé ne doit jamais apparaître dans une page : elle reste dans les variables d'environnement Vercel.
export function supa(path, { method = 'GET', body, prefer } = {}) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquante');
  }
  return fetch(`${url.replace(/\/$/, '')}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: key,
      // Ancienne clé service_role (JWT, commence par "eyJ") : à envoyer aussi en Authorization.
      // Nouvelle clé "secret" (sb_secret_...) : l'en-tête apikey suffit.
      ...(key.startsWith('eyJ') ? { Authorization: `Bearer ${key}` } : {}),
      'Content-Type': 'application/json',
      ...(prefer ? { Prefer: prefer } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}
