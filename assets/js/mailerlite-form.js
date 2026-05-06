// SPACESCANS — MailerLite signup form handler
//
// Wires every <form data-mailerlite-form> on the page to the MailerLite
// universal embed. Updates the inline .signup-status div on success/error.
//
// IDs come from the MailerLite dashboard (Forms → Embedded forms → "Get the
// code"). ACCOUNT_ID is the account number; FORM_ID is the numeric ID in the
// form's action URL (NOT the short data-form slug like "SGVd9H" — that's
// only for MailerLite's own .ml-embedded div selector).

(function () {
  'use strict';

  var ACCOUNT_ID = '2323598';
  var FORM_ID    = '186738107483162062';

  // Load MailerLite universal embed (idempotent — only loads once)
  function loadMailerLite() {
    if (window.ml) return;
    (function (w, d, e, u, f, l, n) {
      w[f] = w[f] || function () { (w[f].q = w[f].q || []).push(arguments); };
      l = d.createElement(e); l.async = 1; l.src = u;
      n = d.getElementsByTagName(e)[0]; n.parentNode.insertBefore(l, n);
    })(window, document, 'script', 'https://assets.mailerlite.com/js/universal.js', 'ml');
    window.ml('account', ACCOUNT_ID);
  }

  function findStatusDiv(form) {
    // Status div is a sibling of the form (next .signup-status)
    var parent = form.parentElement;
    if (!parent) return null;
    return parent.querySelector('.signup-status');
  }

  function setStatus(div, state, message) {
    if (!div) return;
    div.dataset.state = state;
    div.textContent = message;
  }

  function handleSubmit(event) {
    event.preventDefault();
    var form = event.currentTarget;
    var input = form.querySelector('input[type="email"]');
    var button = form.querySelector('button[type="submit"]');
    var status = findStatusDiv(form);

    if (!input || !input.value) {
      setStatus(status, 'error', 'Please enter your email address.');
      return;
    }

    button.disabled = true;
    setStatus(status, '', 'Submitting…');

    fetch('https://assets.mailerlite.com/jsonp/' + ACCOUNT_ID + '/forms/' + FORM_ID + '/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'fields[email]=' + encodeURIComponent(input.value)
    })
      .then(function (response) {
        if (!response.ok) throw new Error('network');
        return response.json().catch(function () { return {}; });
      })
      .then(function () {
        setStatus(status, 'success', 'Check your email to confirm your subscription.');
        form.reset();
      })
      .catch(function () {
        setStatus(status, 'error', 'Something went wrong. Please try again.');
      })
      .finally(function () {
        button.disabled = false;
      });
  }

  function init() {
    var forms = document.querySelectorAll('form[data-mailerlite-form]');
    if (!forms.length) return;
    loadMailerLite();
    forms.forEach(function (form) {
      form.addEventListener('submit', handleSubmit);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
