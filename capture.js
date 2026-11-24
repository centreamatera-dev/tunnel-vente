(() => {
  const cfg = window.AMATERA || {};
  const form = document.getElementById('lead-form');
  const button = document.getElementById('submit');
  const formError = document.getElementById('form-error');
  const fields = ['first_name', 'phone', 'email'];

  const legalLink = document.getElementById('legal-link');
  if (legalLink && cfg.legalUrl) legalLink.href = cfg.legalUrl;

  // On garde l'origine du trafic (pub, Instagram) pour savoir ce qui fonctionne.
  try {
    const params = new URLSearchParams(location.search);
    const utm = {};
    ['utm_source', 'utm_medium', 'utm_campaign'].forEach((key) => {
      if (params.get(key)) utm[key] = params.get(key);
    });
    if (Object.keys(utm).length > 0) {
      utm.referrer = document.referrer || '';
      sessionStorage.setItem('amatera_utm', JSON.stringify(utm));
    }
  } catch (_) {
    /* stockage indisponible : le tunnel fonctionne sans */
  }

  function readUtm() {
    try {
      return JSON.parse(sessionStorage.getItem('amatera_utm') || '{}');
    } catch (_) {
      return {};
    }
  }

  function isMobileFr(value) {
    return /^(?:\+33|0033|0)[67]\d{8}$/.test(value.replace(/[\s.\-()]/g, ''));
  }

  function showErrors(errors) {
    let first = null;
    fields.forEach((name) => {
      const input = form.elements[name];
      const slot = document.getElementById(`err-${name}`);
      const message = errors[name] || '';
      slot.textContent = message;
      input.setAttribute('aria-invalid', message ? 'true' : 'false');
      if (message) {
        input.setAttribute('aria-describedby', slot.id);
        first = first || input;
      } else {
        input.removeAttribute('aria-describedby');
      }
    });
    if (first) first.focus();
  }

  function validate() {
    const errors = {};
    if (!form.elements.first_name.value.trim()) errors.first_name = 'Indiquez votre prénom.';
    if (!isMobileFr(form.elements.phone.value)) errors.phone = 'Entrez un numéro de mobile français (06 ou 07).';
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.elements.email.value.trim())) {
      errors.email = 'Entrez une adresse e-mail valide.';
    }
    return errors;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    formError.textContent = '';

    const errors = validate();
    showErrors(errors);
    if (Object.keys(errors).length > 0) return;

    button.disabled = true;
    const label = button.textContent;
    button.textContent = 'Envoi en cours';

    try {
      const response = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: form.elements.first_name.value,
          phone: form.elements.phone.value,
          email: form.elements.email.value,
          website: form.elements.website.value,
          ...readUtm(),
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (response.status === 400 && data.errors) {
        showErrors(data.errors);
        return;
      }
      if (!response.ok) {
        formError.textContent = data.error || "L'envoi a échoué. Vérifiez votre connexion et réessayez.";
        return;
      }

      try {
        if (data.id) sessionStorage.setItem('amatera_lead', data.id);
        sessionStorage.setItem('amatera_first_name', form.elements.first_name.value.trim());
      } catch (_) {
        /* sans stockage, la page 3 demandera de recommencer */
      }
      window.location.assign(cfg.videoPath || '/video');
    } catch (_) {
      formError.textContent = "L'envoi a échoué. Vérifiez votre connexion et réessayez.";
    } finally {
      button.disabled = false;
      button.textContent = label;
    }
  });
})();
