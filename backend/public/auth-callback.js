(function () {
  try {
    var params = new URLSearchParams(window.location.search);
    var token = params.get('token') || '';
    var userStr = params.get('user');
    var front = params.get('front') || '';
    var error = params.get('error');

    if (error) {
      if (window.opener) {
        window.opener.postMessage({ type: 'GOOGLE_AUTH_ERROR', error: error }, '*');
        window.close();
        return;
      }
      if (front) {
        window.location.href = front + '/auth/google-callback#error=' + encodeURIComponent(error);
        return;
      }
    }

    var user = null;
    if (userStr) {
      try { user = JSON.parse(decodeURIComponent(userStr)); } catch (_) {}
    }

    if (window.opener && token) {
      window.opener.postMessage({ type: 'GOOGLE_AUTH_SUCCESS', token: token, user: user }, '*');
      window.close();
      return;
    }

    if (token && front) {
      window.location.href = front + '/auth/google-callback#token=' + encodeURIComponent(token) + '&user=' + encodeURIComponent(JSON.stringify(user));
      return;
    }
  } catch (e) {
    try {
      if (window.opener) {
        window.opener.postMessage({ type: 'GOOGLE_AUTH_ERROR', error: 'OAuth authentication failed' }, '*');
        window.close();
        return;
      }
      var front = params && params.get('front');
      if (front) {
        window.location.href = front + '/auth/google-callback#error=' + encodeURIComponent('OAuth authentication failed');
      }
    } catch (_) {}
  }
})();


