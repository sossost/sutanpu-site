// 주소의 ?ct=<이름>을 스토어 단추로 넘긴다. App Store는 ct, Google Play는 referrer의 utm_source.
// 앱 공유 글은 ?ct=share로 온다. 값이 없거나 형식이 다르면 생성기가 넣은 기본값(web)을 그대로 둔다.
(function () {
  var CAMPAIGN_PATTERN = /^[a-z0-9-]{1,40}$/;
  var campaign = new URLSearchParams(window.location.search).get('ct');
  if (campaign == null || !CAMPAIGN_PATTERN.test(campaign)) return;

  document.querySelectorAll('a.store').forEach(function (link) {
    var url = new URL(link.href);
    if (url.hostname === 'apps.apple.com') {
      url.searchParams.set('ct', campaign);
    } else if (url.hostname === 'play.google.com') {
      var referrer = new URLSearchParams(url.searchParams.get('referrer') || '');
      referrer.set('utm_source', campaign);
      url.searchParams.set('referrer', referrer.toString());
    } else {
      return;
    }
    link.href = url.toString();
  });
})();
