// 주소의 ?ct=<이름>을 스토어 단추와 사이트 안 링크로 넘긴다. App Store는 ct, Google Play는 referrer의 utm_source.
// 사이트 안 링크(첫 화면 ↔ 직항 페이지, 직항 ↔ 직항)에도 같은 ?ct=를 붙여, 광고로 와서 공항을 고른 사람의 스토어 단추까지 광고 이름이 간다.
// 앱 공유 글은 ?ct=share로 온다. 값이 없거나 형식이 다르면 생성기가 넣은 기본값(web)을 그대로 둔다.
(function () {
  const CAMPAIGN_PATTERN = /^[a-z0-9-]{1,40}$/;
  // 첫 화면(…/ 또는 …/index.html)과 직항 페이지(…/direct-icn.html). 약관·문의 페이지에는 붙이지 않는다
  const LANDING_PAGE_PATH = /\/(index\.html|direct-[a-z]+\.html)?$/;
  const campaign = new URLSearchParams(window.location.search).get('ct');
  if (campaign == null || !CAMPAIGN_PATTERN.test(campaign)) return;

  function withStoreCampaign(url) {
    if (url.hostname === 'apps.apple.com') {
      url.searchParams.set('ct', campaign);
      return true;
    }
    if (url.hostname === 'play.google.com') {
      const referrer = new URLSearchParams(url.searchParams.get('referrer') || '');
      referrer.set('utm_source', campaign);
      url.searchParams.set('referrer', referrer.toString());
      return true;
    }
    return false;
  }

  function withSiteCampaign(url) {
    if (url.origin !== window.location.origin || !LANDING_PAGE_PATH.test(url.pathname)) return false;
    // 같은 페이지 안 앵커(#get, #city-…)는 그대로 둔다. 주소가 바뀌지 않아 ct가 이미 있다
    if (url.pathname === window.location.pathname && url.search === window.location.search) return false;
    url.searchParams.set('ct', campaign);
    return true;
  }

  document.querySelectorAll('a[href]').forEach(function (link) {
    const url = new URL(link.href);
    const isChanged = link.classList.contains('store') ? withStoreCampaign(url) : withSiteCampaign(url);
    if (isChanged) link.href = url.toString();
  });
})();
