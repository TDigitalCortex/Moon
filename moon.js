// widget-moon.js – exact mirror of https://astro-charts.com/static/widget-moon.js
(function(){
  var HOST = (function() {
    var s = document.currentScript;
    if (s && s.src) {
      try {
        var u = new URL(s.src);
        return u.protocol + '//' + u.host;
      } catch(_) {}
    }
    return 'https://astro-charts.com';
  })();

  var ENDPOINT = HOST + '/tools/widget_html/moon/';
  var CSS_URL = HOST + '/static/widget.css';

  function ensureCss() {
    if (document.querySelector('link[data-ac-widget-css]')) return;
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = CSS_URL;
    link.setAttribute('data-ac-widget-css', '1');
    document.head.appendChild(link);
  }

  function fetchJson(url) {
    var sep = (url.indexOf('?') === -1) ? '?' : '&';
    var u = url + sep + 'path=' + encodeURIComponent(window.location.host);
    return fetch(u, { credentials: 'omit', mode: 'cors' })
      .then(function(r) {
        if (!r.ok) throw new Error('moon widget: HTTP ' + r.status);
        return r.json();
      });
  }

  function buildQuery(el) {
    var parts = [];
    var geoPk = el.getAttribute('data-geo-pk') || el.getAttribute('geo_pk');
    if (geoPk) {
      parts.push('geo_pk=' + encodeURIComponent(geoPk));
    } else {
      var lat = el.getAttribute('data-lat'), lng = el.getAttribute('data-lng');
      if (lat && lng) {
        parts.push('lat=' + encodeURIComponent(lat));
        parts.push('lng=' + encodeURIComponent(lng));
      }
    }

    var size = el.getAttribute('data-size');
    if (!size) {
      var orient = el.getAttribute('data-orient');
      if (!orient && el.classList) {
        if (el.classList.contains('vertical')) orient = 'vertical';
        else if (el.classList.contains('horizontal')) orient = 'horizontal';
      }
      size = (orient === 'vertical') ? 'compact' : 'full';
    }
    parts.push('size=' + encodeURIComponent(size));

    return parts.join('&');
  }

  function mount(el) {
    var qs = buildQuery(el);
    if (qs.indexOf('geo_pk=') === -1 && qs.indexOf('lat=') === -1) {
      el.innerHTML = '<div class="ac-widget ac-widget--error">' +
                     '<div class="ac-w-foot">Missing data-geo-pk on widget host.</div></div>';
      return;
    }

    fetchJson(ENDPOINT + '?' + qs)
      .then(function(res) {
        el.innerHTML = res.html || '';
      })
      .catch(function() {
        el.innerHTML = '<div class="ac-widget ac-widget--error">' +
                       '<div class="ac-w-foot">Couldn’t load moon phase.</div></div>';
      });
  }

  function init() {
    ensureCss();
    var nodes = document.querySelectorAll('.ac-widget-moon, .moon_container');
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      if (el.getAttribute('data-ac-widget-mounted') === '1') continue;
      el.setAttribute('data-ac-widget-mounted', '1');
      mount(el);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
