(function() {
  'use strict';
  var script = document.currentScript;
  if (!script) return;
  var host = script.src.replace(/\/tracker\.js.*$/, '');
  var siteId = script.getAttribute('data-site-id') || 'default';

  // Fingerprint: hash of screen + timezone + language + UA
  function hash(s) {
    for (var h = 0, i = 0; i < s.length; i++) {
      h = ((h << 5) - h + s.charCodeAt(i)) | 0;
    }
    return Math.abs(h).toString(36);
  }
  var fp = hash([
    screen.width, screen.height, screen.colorDepth,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    navigator.language, navigator.userAgent
  ].join('|'));

  var startTime = Date.now();
  var currentPage = location.href;

  // Send page view
  function sendEvent() {
    var data = JSON.stringify({
      visitor_id: fp,
      site_id: siteId,
      page_url: location.pathname + location.search,
      page_title: document.title,
      referrer: document.referrer
    });
    if (navigator.sendBeacon) {
      navigator.sendBeacon(host + '/api/events', new Blob([data], { type: 'application/json' }));
    } else {
      var x = new XMLHttpRequest();
      x.open('POST', host + '/api/events', true);
      x.setRequestHeader('Content-Type', 'application/json');
      x.send(data);
    }
  }

  // Send duration
  function sendDuration() {
    var dur = Math.round((Date.now() - startTime) / 1000);
    if (dur < 1) return;
    var data = JSON.stringify({
      visitor_id: fp,
      page_url: location.pathname + location.search,
      duration: dur
    });
    if (navigator.sendBeacon) {
      navigator.sendBeacon(host + '/api/events/duration', new Blob([data], { type: 'application/json' }));
    } else {
      var x = new XMLHttpRequest();
      x.open('POST', host + '/api/events/duration', false);
      x.setRequestHeader('Content-Type', 'application/json');
      x.send(data);
    }
  }

  // Send leave event
  function sendLeave() {
    sendDuration();
    var data = JSON.stringify({ visitor_id: fp });
    if (navigator.sendBeacon) {
      navigator.sendBeacon(host + '/api/events/leave', new Blob([data], { type: 'application/json' }));
    }
  }

  // WebSocket for live presence
  var ws;
  function connectWS() {
    try {
      var proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
      var wsHost = host.replace(/^https?:/, proto);
      ws = new WebSocket(wsHost + '/ws?type=tracker&visitor_id=' + fp);
      ws.onopen = function() {
        // Send heartbeat every 30s
        setInterval(function() {
          if (ws.readyState === 1) ws.send(JSON.stringify({ type: 'heartbeat' }));
        }, 30000);
      };
      ws.onclose = function() {
        setTimeout(connectWS, 5000);
      };
    } catch(e) {}
  }

  // Visibility change: send duration when hidden
  document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
      sendDuration();
    } else {
      startTime = Date.now();
    }
  });

  // Page unload
  window.addEventListener('pagehide', sendLeave);

  // Init
  sendEvent();
  connectWS();
})();
