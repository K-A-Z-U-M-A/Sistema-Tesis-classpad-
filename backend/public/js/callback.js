(function(){
  try{
    var hash = window.location.hash || '';
    var params = {};
    if (hash.charAt(0) === '#') hash = hash.substring(1);
    hash.split('&').forEach(function (kv) {
      var p = kv.split('=');
      if (p.length === 2) params[decodeURIComponent(p[0])] = decodeURIComponent(p[1]);
    });
    var token = params.token || '';
    var user = params.user ? JSON.parse(params.user) : null;
    var front = params.front ? decodeURIComponent(params.front) : '';

    // If redirect flow desired, send browser to frontend callback route
    if (front) {
      var target = front.replace(/\/$/, '') + '/auth/google-callback#token=' + encodeURIComponent(token);
      // If this page was opened as a popup, try notifying and also redirect opener
      if (window.opener && !window.opener.closed) {
        try { window.opener.location.href = target; } catch(_) {}
        window.close();
        return;
      }
      // Fallback: redirect current window
      window.location.replace(target);
      return;
    }

    // Popup flow postMessage (legacy)
    if (window.opener) {
      window.opener.postMessage({ type: 'GOOGLE_AUTH_SUCCESS', token: token, user: user }, '*');
      window.close();
      return;
    }
  }catch(e){
    if (window.opener) {
      window.opener.postMessage({ type: 'GOOGLE_AUTH_ERROR', error: 'OAuth authentication failed' }, '*');
      window.close();
      return;
    }
  }
})();
