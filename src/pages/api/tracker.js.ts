export const prerender = false;

import type { APIRoute } from 'astro';

const TRACKER_SCRIPT = `(function() {
  'use strict';

  var ENDPOINT = '/api/events';
  var DURATION_ENDPOINT = '/api/events/duration';
  var LEAVE_ENDPOINT = '/api/events/leave';

  // Generate or retrieve visitor ID
  function getVisitorId() {
    var id = localStorage.getItem('_mr_vid');
    if (!id) {
      id = 'v_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
      localStorage.setItem('_mr_vid', id);
    }
    return id;
  }

  // Detect device type
  function getDevice() {
    var ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) return 'tablet';
    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) return 'mobile';
    return 'desktop';
  }

  // Detect browser
  function getBrowser() {
    var ua = navigator.userAgent;
    if (ua.indexOf('Firefox') > -1) return 'Firefox';
    if (ua.indexOf('SamsungBrowser') > -1) return 'Samsung';
    if (ua.indexOf('Opera') > -1 || ua.indexOf('OPR') > -1) return 'Opera';
    if (ua.indexOf('Trident') > -1) return 'IE';
    if (ua.indexOf('Edge') > -1) return 'Edge';
    if (ua.indexOf('Edg') > -1) return 'Edge';
    if (ua.indexOf('Chrome') > -1) return 'Chrome';
    if (ua.indexOf('Safari') > -1) return 'Safari';
    return 'Unknown';
  }

  // Detect OS
  function getOS() {
    var ua = navigator.userAgent;
    if (ua.indexOf('Win') > -1) return 'Windows';
    if (ua.indexOf('Mac') > -1) return 'macOS';
    if (ua.indexOf('Linux') > -1) return 'Linux';
    if (ua.indexOf('Android') > -1) return 'Android';
    if (ua.indexOf('like Mac') > -1) return 'iOS';
    return 'Unknown';
  }

  var visitorId = getVisitorId();
  var pageUrl = window.location.pathname;
  var startTime = Date.now();
  var siteId = document.querySelector('meta[name="site-id"]')?.content || window.location.hostname;

  // Send pageview
  function sendPageview() {
    var data = {
      site_id: siteId,
      visitor_id: visitorId,
      page_url: pageUrl,
      page_title: document.title,
      referrer: document.referrer,
      device: getDevice(),
      browser: getBrowser(),
      os: getOS()
    };

    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon(ENDPOINT, JSON.stringify(data));
      } else {
        var xhr = new XMLHttpRequest();
        xhr.open('POST', ENDPOINT, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(JSON.stringify(data));
      }
    } catch(e) {}
  }

  // Send duration update
  function sendDuration() {
    var seconds = Math.round((Date.now() - startTime) / 1000);
    var data = {
      visitor_id: visitorId,
      page_url: pageUrl,
      duration_seconds: seconds
    };

    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon(DURATION_ENDPOINT, JSON.stringify(data));
      } else {
        var xhr = new XMLHttpRequest();
        xhr.open('POST', DURATION_ENDPOINT, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(JSON.stringify(data));
      }
    } catch(e) {}
  }

  // Send leave event
  function sendLeave() {
    var seconds = Math.round((Date.now() - startTime) / 1000);
    var data = {
      visitor_id: visitorId,
      page_url: pageUrl,
      duration_seconds: seconds
    };

    try {
      navigator.sendBeacon(LEAVE_ENDPOINT, JSON.stringify(data));
    } catch(e) {
      var xhr = new XMLHttpRequest();
      xhr.open('POST', LEAVE_ENDPOINT, false);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(JSON.stringify(data));
    }
  }

  // Track pageview on load
  sendPageview();

  // Periodically update duration (every 30s)
  var durationInterval = setInterval(sendDuration, 30000);

  // Send leave on unload
  window.addEventListener('beforeunload', function() {
    clearInterval(durationInterval);
    sendLeave();
  });

  // Handle visibility change (tab switch)
  document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'hidden') {
      sendDuration();
    }
  });
})();`;

export const GET: APIRoute = async () => {
  return new Response(TRACKER_SCRIPT, {
    headers: {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
