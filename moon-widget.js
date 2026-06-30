(function() {
  'use strict';

  // ----- Moon phase calculation -----
  function getMoonPhase(date, lat, lng) {
    const d = date || new Date();
    const year = d.getUTCFullYear();
    const month = d.getUTCMonth() + 1;
    const day = d.getUTCDate();
    const hours = d.getUTCHours() + d.getUTCMinutes() / 60 + d.getUTCSeconds() / 3600;

    // Calculate Julian Day Number
    let a = Math.floor((14 - month) / 12);
    let y = year + 4800 - a;
    let m = month + 12 * a - 3;
    let jdn = day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
    let jd = jdn + hours / 24 - 0.5;

    // Time since J2000.0 (in days)
    const T = (jd - 2451545.0) / 36525;

    // Moon's mean longitude (degrees)
    const L_prime = 218.3165 + 481267.8813 * T;
    // Moon's mean elongation (degrees)
    const D = 297.8502 + 445267.1114 * T;
    // Sun's mean anomaly (degrees)
    const M = 357.5291 + 35999.0503 * T;
    // Moon's mean anomaly (degrees)
    const M_prime = 134.9634 + 477198.8676 * T;
    // Moon's argument of latitude (degrees)
    const F = 93.2720 + 483202.0175 * T;

    // Convert to radians
    const D_rad = D * Math.PI / 180;
    const M_rad = M * Math.PI / 180;
    const M_prime_rad = M_prime * Math.PI / 180;
    const F_rad = F * Math.PI / 180;

    // Ecliptic longitude of the Moon (degrees)
    let lambda_moon = L_prime + 6.289 * Math.sin(M_prime_rad) 
      - 1.274 * Math.sin((2 * D - M_prime_rad)) 
      + 0.658 * Math.sin(2 * D_rad) 
      - 0.186 * Math.sin(M_rad) 
      - 0.059 * Math.sin((2 * D - 2 * M_prime_rad)) 
      - 0.057 * Math.sin((D - M_prime_rad)) 
      + 0.053 * Math.sin((D + M_prime_rad)) 
      + 0.046 * Math.sin((2 * D - M_rad)) 
      + 0.041 * Math.sin((2 * D + M_prime_rad)) 
      - 0.035 * Math.sin(M_prime_rad) 
      - 0.031 * Math.sin((2 * F - 2 * D_rad));

    // Ecliptic latitude of the Moon (degrees)
    let beta_moon = 5.128 * Math.sin(F_rad) 
      + 0.281 * Math.sin((M_prime_rad + F_rad)) 
      - 0.277 * Math.sin((M_prime_rad - F_rad)) 
      - 0.173 * Math.sin((2 * D - F_rad)) 
      + 0.055 * Math.sin((2 * D - M_prime_rad - F_rad)) 
      - 0.047 * Math.sin((2 * D + F_rad)) 
      - 0.046 * Math.sin((2 * D - M_prime_rad + F_rad)) 
      + 0.034 * Math.sin((2 * M_prime_rad - F_rad)) 
      - 0.032 * Math.sin((M_rad + F_rad)) 
      - 0.031 * Math.sin((M_rad - F_rad)) 
      - 0.024 * Math.sin((2 * D + M_prime_rad - F_rad));

    // Convert lambda and beta to radians
    const lambda_rad = lambda_moon * Math.PI / 180;
    const beta_rad = beta_moon * Math.PI / 180;

    // Obliquity of the ecliptic (degrees)
    const epsilon = 23.4393 - 0.0130 * T;
    const epsilon_rad = epsilon * Math.PI / 180;

    // Equatorial coordinates
    const alpha_rad = Math.atan2(
      Math.sin(lambda_rad) * Math.cos(epsilon_rad) - Math.tan(beta_rad) * Math.sin(epsilon_rad),
      Math.cos(lambda_rad)
    );
    const delta_rad = Math.asin(
      Math.sin(beta_rad) * Math.cos(epsilon_rad) + Math.cos(beta_rad) * Math.sin(epsilon_rad) * Math.sin(lambda_rad)
    );

    // Greenwich Sidereal Time (degrees)
    const GST = 280.4606 + 360.9856473 * (jd - 2451545.0);
    const GST_rad = GST * Math.PI / 180;

    // Hour angle
    const HA = GST_rad - alpha_rad - lng * Math.PI / 180;

    // Altitude and azimuth
    const lat_rad = lat * Math.PI / 180;
    const altitude_rad = Math.asin(
      Math.sin(lat_rad) * Math.sin(delta_rad) + Math.cos(lat_rad) * Math.cos(delta_rad) * Math.cos(HA)
    );

    // Phase angle (simplified)
    const phase_angle = Math.atan2(
      Math.cos(delta_rad) * Math.sin(HA),
      Math.sin(delta_rad) * Math.cos(lat_rad) - Math.cos(delta_rad) * Math.sin(lat_rad) * Math.cos(HA)
    );

    // Illumination (0 = new moon, 1 = full moon)
    const illumination = (1 + Math.cos(phase_angle)) / 2;
    
    // Phase names
    const phaseNames = [
      'New Moon', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous',
      'Full Moon', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent'
    ];
    
    const phaseIndex = Math.round((illumination * 8) % 8);
    const phaseName = phaseNames[phaseIndex % 8];

    // Moon's age (days since new moon)
    const newMoonJD = 2451550.09765 + 29.53058867 * Math.round((jd - 2451550.09765) / 29.53058867);
    const age = jd - newMoonJD;
    const ageDays = age % 29.53;

    return {
      illumination: illumination,
      phaseName: phaseName,
      phaseIndex: phaseIndex,
      ageDays: ageDays,
      altitude: altitude_rad * 180 / Math.PI,
      azimuth: phase_angle * 180 / Math.PI
    };
  }

  // ----- SVG Moon renderer -----
  function renderMoonSVG(illumination, size) {
    const w = size || 64;
    const h = size || 64;
    
    const illum = Math.max(0, Math.min(1, illumination));
    
    let svg = `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">`;
    
    // Background circle (dark side)
    svg += `<circle cx="${w/2}" cy="${h/2}" r="${w/2 - 2}" fill="#1a1a2e" stroke="#3d3d5c" stroke-width="1"/>`;
    
    if (illum > 0.01) {
      const r = w/2 - 2;
      const cx = w/2;
      const cy = h/2;
      
      if (illum < 0.5) {
        // Crescent
        const xOffset = (1 - illum * 2) * r;
        svg += `<path d="M ${cx - r} ${cy - r} A ${r} ${r} 0 0 1 ${cx + r} ${cy - r} A ${r} ${r} 0 0 1 ${cx - r} ${cy + r} A ${r} ${r} 0 0 0 ${cx + xOffset} ${cy} L ${cx - r} ${cy - r} Z" fill="#f0e8d0" opacity="0.9"/>`;
      } else {
        // Gibbous or full
        svg += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#f0e8d0" opacity="0.9"/>`;
        if (illum < 0.99) {
          const shadowX = (1 - illum) * 2 * r;
          svg += `<path d="M ${cx - r} ${cy - r} A ${r} ${r} 0 0 1 ${cx + r} ${cy - r} A ${r} ${r} 0 0 1 ${cx - r} ${cy + r} A ${r} ${r} 0 0 0 ${cx + shadowX} ${cy} L ${cx - r} ${cy - r} Z" fill="#1a1a2e" opacity="0.3"/>`;
        }
      }
    }
    
    // Subtle crater texture
    svg += `<circle cx="${w*0.35}" cy="${h*0.3}" r="${w*0.06}" fill="#ddd5c0" opacity="0.2"/>`;
    svg += `<circle cx="${w*0.65}" cy="${h*0.7}" r="${w*0.04}" fill="#ddd5c0" opacity="0.15"/>`;
    svg += `<circle cx="${w*0.45}" cy="${h*0.65}" r="${w*0.03}" fill="#ddd5c0" opacity="0.1"/>`;
    
    svg += `</svg>`;
    return svg;
  }

  // ----- Widget renderer -----
  function renderWidget(el) {
    const lat = parseFloat(el.getAttribute('data-lat'));
    const lng = parseFloat(el.getAttribute('data-lng'));
    const place = el.getAttribute('place') || '';
    const size = el.getAttribute('data-size') || 'full';
    
    if (isNaN(lat) || isNaN(lng)) {
      el.innerHTML = `<div class="ac-widget ac-widget--error">
        <div>📍 Missing coordinates (data-lat, data-lng)</div>
        <div class="ac-w-foot">Please provide valid latitude and longitude</div>
      </div>`;
      return;
    }

    try {
      const phase = getMoonPhase(new Date(), lat, lng);
      const illuminationPercent = Math.round(phase.illumination * 100);
      
      // Determine emoji representation
      const phaseEmojis = ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘'];
      const emoji = phaseEmojis[phase.phaseIndex % 8];
      
      // Build HTML
      const isCompact = size === 'compact';
      const iconSize = isCompact ? 44 : 64;
      
      let html = `<div class="ac-widget">`;
      html += `<div class="ac-w-content">`;
      html += `<div class="ac-w-phase">`;
      
      // Moon icon
      html += `<div class="moon-icon">`;
      html += renderMoonSVG(phase.illumination, iconSize);
      html += `</div>`;
      
      // Phase info
      html += `<div class="phase-info">`;
      html += `<div class="phase-label">${emoji} ${phase.phaseName}</div>`;
      html += `<div class="phase-detail">`;
      html += `<span class="illumination">${illuminationPercent}% illuminated</span>`;
      html += ` · Age ${Math.round(phase.ageDays)}d`;
      html += `</div>`;
      html += `</div>`;
      html += `</div>`;
      
      // Location
      if (place) {
        html += `<div class="ac-w-location">`;
        html += `<span class="loc-icon">📍</span>`;
        html += `<span class="loc-name">${place}</span>`;
        html += `</div>`;
      }
      
      html += `</div>`;
      html += `</div>`;
      
      el.innerHTML = html;
      
    } catch (error) {
      el.innerHTML = `<div class="ac-widget ac-widget--error">
        <div>🌙 Couldn't load moon phase</div>
        <div class="ac-w-foot">${error.message}</div>
      </div>`;
    }
  }

  // ----- Initialize all widgets -----
  function initWidgets() {
    const nodes = document.querySelectorAll('.ac-widget-moon');
    for (let i = 0; i < nodes.length; i++) {
      const el = nodes[i];
      if (el.getAttribute('data-ac-widget-mounted') === '1') continue;
      el.setAttribute('data-ac-widget-mounted', '1');
      renderWidget(el);
    }
  }

  // ----- Auto-init -----
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWidgets);
  } else {
    initWidgets();
  }

})();
