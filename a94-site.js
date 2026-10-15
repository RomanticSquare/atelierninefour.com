/* Shared navigation and non-personal funnel events. No form field values are tracked. */
(function () {
  'use strict';
  var button = document.querySelector('.menu-btn');
  var nav = document.getElementById('site-nav');
  if (button && nav) {
    function closeNav(returnFocus) {
      nav.classList.remove('open');
      button.setAttribute('aria-expanded', 'false');
      if (returnFocus) button.focus();
    }
    button.addEventListener('click', function () {
      button.setAttribute('aria-expanded', String(nav.classList.toggle('open')));
    });
    nav.addEventListener('click', function (event) {
      if (event.target.closest('a')) closeNav(false);
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && nav.classList.contains('open')) closeNav(true);
    });
    document.addEventListener('click', function (event) {
      if (!nav.contains(event.target) && !button.contains(event.target)) closeNav(false);
    });
    // Only collapse navigation after all its handlers have been attached.
    document.documentElement.classList.add('nav-ready');
  }
  function track(name, params) {
    try { if (window.gtag) window.gtag('event', name, params || {}); } catch (error) { /* Analytics must never break the site. */ }
  }
  window.a94event = track;
  document.addEventListener('click', function (event) {
    var link = event.target.closest('a');
    var tagged = event.target.closest('[data-ga]');
    if (tagged) track(tagged.getAttribute('data-ga'), {label: tagged.getAttribute('data-ga-label') || tagged.textContent.trim().slice(0, 60)});
    if (link && /^mailto:/i.test(link.getAttribute('href') || '')) {
      track('email_click', {location: link.closest('footer') ? 'footer' : 'content'});
    }
  });
  document.querySelectorAll('details.case').forEach(function (detail) {
    detail.addEventListener('toggle', function () {
      if (detail.open) track('case_study_view', {case_id: detail.id});
    });
  });
  var pageEvent = document.body.getAttribute('data-page-event');
  if (pageEvent) track(pageEvent);
})();
