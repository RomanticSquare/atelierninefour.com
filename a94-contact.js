/* Progressive enhancement: the native POST form remains usable without JavaScript. */
(function () {
  'use strict';
  var form = document.getElementById('inquiry');
  if (!form || !window.fetch || !window.FormData || !window.AbortController) return;
  var status = document.getElementById('f-status');
  var button = document.getElementById('f-send');
  var field = function (name) { return form.elements.namedItem(name); };
  var started = false;
  var submitting = false;
  try {
    var interest = new URLSearchParams(location.search).get('interest');
    if (Array.from(field('interest').options).some(function (option) { return option.value === interest; })) field('interest').value = interest;
  } catch (error) { /* Invalid URLs must not prevent an inquiry. */ }
  function track(name, params) { if (window.a94event) window.a94event(name, params); }
  function errorFor(name, message) {
    field(name).setAttribute('aria-invalid', message ? 'true' : 'false');
    document.getElementById('e-' + name).textContent = message;
  }
  function begin() {
    if (!started) { started = true; track('inquiry_start', {interest: field('interest').value}); }
  }
  form.addEventListener('input', begin);
  form.addEventListener('change', begin);
  form.addEventListener('input', function (event) {
    var name = event.target.name;
    if (['name', 'email', 'message'].indexOf(name) >= 0 && event.target.getAttribute('aria-invalid') === 'true') errorFor(name, '');
  });
  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    if (submitting) return;
    var name = field('name').value.trim();
    var email = field('email').value.trim();
    var message = field('message').value.trim();
    var invalid = [];
    [['name', name ? '' : 'Add your name.'],
     ['email', email && field('email').validity.valid ? '' : 'Add an email address like name@company.com.'],
     ['message', message ? '' : 'Add a sentence or two about the situation.']].forEach(function (item) {
      errorFor(item[0], item[1]); if (item[1]) invalid.push(item[0]);
    });
    if (invalid.length) {
      status.className = 'form-status err'; status.textContent = 'Please fix the highlighted fields.';
      field(invalid[0]).focus(); return;
    }
    if (field('_gotcha').value) return;
    var selectedInterest = field('interest').value;
    var teamSize = field('team_size').value || 'unspecified';
    var label = field('interest').options[field('interest').selectedIndex].text;
    var data = new FormData(form);
    data.set('name', name); data.set('email', email); data.set('message', message);
    data.set('interest', label); data.set('_subject', 'New A94 request: ' + label);
    var controller = new AbortController();
    var timer = setTimeout(function () { controller.abort(); }, 20000);
    submitting = true; button.disabled = true; form.setAttribute('aria-busy', 'true');
    status.className = 'form-status'; status.textContent = 'Sending...';
    try {
      var response = await fetch(form.action, {method: 'POST', body: data, headers: {Accept: 'application/json'}, signal: controller.signal});
      // Formspree documents HTTP response.ok as the success signal.
      if (!response.ok) throw new Error('delivery-unconfirmed');
      // Preserve the existing event name. Mark only this event as a GA4 key event.
      track('inquiry_submit', {interest: selectedInterest, team_size: teamSize});
      form.reset(); started = false;
      status.className = 'form-status ok';
      status.textContent = "Thanks, your request was received. I'll reply within two business days.";
    } catch (error) {
      status.className = 'form-status err';
      status.textContent = "We couldn't confirm delivery. Your message is still here. Please email jenny@atelierninefour.com before retrying so you don't send a duplicate.";
      track('inquiry_error', {reason: error.name === 'AbortError' ? 'timeout' : 'unconfirmed'});
    } finally {
      clearTimeout(timer); submitting = false; button.disabled = false; form.setAttribute('aria-busy', 'false');
    }
  });
  form.noValidate = true;
})();
