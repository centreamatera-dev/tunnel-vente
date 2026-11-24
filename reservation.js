(() => {
  const cfg = window.AMATERA || {};
  const form = document.getElementById('questions');
  const button = document.getElementById('submit');
  const formError = document.getElementById('form-error');
  const missing = document.getElementById('missing');
  const booking = document.getElementById('booking');
  const bookingTitle = document.getElementById('booking-title');
  const bookingNote = document.getElementById('booking-note');
  const planityLink = document.getElementById('planity-link');
  const intro = document.getElementById('intro');
  const title = document.getElementById('title');
  const radios = ['priority', 'contraindication', 'experience', 'source'];

  if (cfg.planityUrl) planityLink.href = cfg.planityUrl;

  function read(key) {
    try {
      return sessionStorage.getItem(key) || '';
    } catch (_) {
      return '';
    }
  }

  const leadId = read('amatera_lead');
  const firstName = read('amatera_first_name');

  // Sans inscription préalable, on renvoie vers la page 1 au lieu d'afficher un formulaire qui échouerait.
  if (!leadId) {
    form.hidden = true;
    intro.hidden = true;
    missing.hidden = false;
    return;
  }

  function setError(name, message) {
    const slot = document.getElementById(`err-${name}`);
    slot.textContent = message || '';
  }

  function showErrors(errors) {
    const order = ['priority', 'zone', 'contraindication', 'experience', 'source'];
    let first = null;
    order.forEach((name) => {
      setError(name, errors[name]);
      if (errors[name] && !first) first = name;
    });
    if (first) {
      const target = document.getElementById(first === 'zone' ? 'zone' : `f-${first}`);
      const focusable = target.querySelector ? target.querySelector('input') || target : target;
      focusable.focus();
    }
  }

  function validate() {
    const errors = {};
    radios.forEach((name) => {
      if (!form.elements[name].value) errors[name] = 'Choisissez une réponse.';
    });
    if (form.elements.zone.value.trim().length < 2) errors.zone = 'Indiquez la zone ou le souci de peau.';
    return errors;
  }

  function showBooking() {
    form.hidden = true;
    intro.hidden = true;
    title.textContent = firstName ? `${firstName}, il ne reste que le créneau` : 'Il ne reste que le créneau';
    if (form.elements.contraindication.value !== 'non') bookingNote.hidden = false;
    booking.hidden = false;
    bookingTitle.focus();
    window.scrollTo({ top: 0 });
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    formError.textContent = '';

    const errors = validate();
    showErrors(errors);
    if (Object.keys(errors).length > 0) return;

    button.disabled = true;
    const label = button.textContent;
    button.textContent = 'Enregistrement en cours';

    try {
      const response = await fetch('/api/qualify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: leadId,
          priority: form.elements.priority.value,
          zone: form.elements.zone.value,
          contraindication: form.elements.contraindication.value,
          experience: form.elements.experience.value,
          source: form.elements.source.value,
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (response.status === 400 && data.errors) {
        showErrors(data.errors);
        return;
      }
      if (response.status === 404) {
        form.hidden = true;
        intro.hidden = true;
        missing.hidden = false;
        return;
      }
      if (!response.ok) {
        formError.textContent = data.error || "L'envoi a échoué. Vérifiez votre connexion et réessayez.";
        return;
      }

      showBooking();
    } catch (_) {
      formError.textContent = "L'envoi a échoué. Vérifiez votre connexion et réessayez.";
    } finally {
      button.disabled = false;
      button.textContent = label;
    }
  });
})();
