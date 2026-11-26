// 공개 사이트의 페이지 조회와 누른 것을 앱과 같은 PostHog 프로젝트에 센다. 기준은 ../01-spec.md '방문 집계'.
// 쿠키·localStorage·sessionStorage에 아무것도 남기지 않는다(persistence: memory + disable_persistence).
// 그래서 페이지를 열 때마다 새 임의 ID가 생기고, 다른 페이지로 넘어가면 같은 사람으로 이어지지 않는다.
// 페이지 사이는 ct로 잇는다: 주소에 ct가 없으면 같은 사이트의 앞 페이지 주소에서 ct를 읽는다.
// 웹 이벤트는 이름이 'web.'으로 시작하고 platform: 'web'을 달아 앱 이벤트와 나눈다.
// 누른 것은 HTML의 data-track(이벤트 이름)과 data-airport·data-city·data-store(속성)로 정한다. 생성기와 첫 화면 원본이 붙인다.
(function () {
  // 앱 .env.local의 EXPO_PUBLIC_POSTHOG_KEY와 같은 프로젝트 키(phc_). 공개용이라 페이지에 넣어도 된다. 다른 키는 넣지 않는다
  const PROJECT_KEY = 'phc_msJAmtEqr8y6wagv66sUKbekQZWWbRWVTv3qUHCqB4vK';
  const API_HOST = 'https://us.i.posthog.com';
  const CAMPAIGN_PATTERN = /^[a-z0-9-]{1,40}$/;
  // '$' 없이 남기는 속성: PostHog가 받는 데 필요한 둘과 우리가 붙이는 것. 이 밖(utm_*, fbclid 같은 광고 클릭 ID)은 보내기 전에 버린다
  const PLAIN_PROPERTIES = ['token', 'distinct_id', 'platform', 'page', 'ct', 'ct_from', 'airport', 'city', 'store'];
  const TRACKED_DATA = ['airport', 'city', 'store'];
  // Vercel 사본에서만 Vercel Web Analytics를 함께 쓴다. github.io에는 /_vercel/insights가 없어 불러오지 않는다
  const VERCEL_HOST_SUFFIX = '.vercel.app';
  const VERCEL_SCRIPT = '/_vercel/insights/script.js';
  // Vercel 커스텀 이벤트는 Pro에서 속성 둘까지다(https://vercel.com/docs/analytics/limits-and-pricing). 이벤트마다 고른 둘
  const VERCEL_EVENT_PROPERTIES = {
    'web.airport_pick': ['airport', 'ct'],
    'web.route_open': ['airport', 'city'],
    'web.get_jump': ['ct'],
    'web.store_open': ['store', 'ct'],
  };

  /** '…/sutanpu-site/' → index, '…/direct-icn.html' → direct-icn */
  function pageOf(pathname) {
    const last = pathname.split('/').pop();
    return last == null || last === '' ? 'index' : last.replace(/\.html$/, '');
  }

  /** 주소로 읽히지 않으면 null. 읽다 멈추면 page_view와 클릭 집계가 통째로 빠진다 */
  function parseUrl(href) {
    try {
      return new URL(href);
    } catch {
      return null;
    }
  }

  function campaignOf(search) {
    const value = new URLSearchParams(search).get('ct');
    return value != null && CAMPAIGN_PATTERN.test(value) ? value : null;
  }

  /** 이 주소의 ct, 없으면 같은 사이트 앞 페이지의 ct. 광고로 첫 화면에 와서 공항을 고른 사람도 광고로 센다 */
  function campaignContext() {
    const own = campaignOf(window.location.search);
    if (own != null) return { ct: own, ct_from: 'url' };
    if (document.referrer === '') return { ct: null, ct_from: null };
    const previous = parseUrl(document.referrer);
    if (previous == null || previous.origin !== window.location.origin) return { ct: null, ct_from: null };
    const carried = campaignOf(previous.search);
    return carried == null ? { ct: null, ct_from: null } : { ct: carried, ct_from: 'previous_page' };
  }

  /** 주소에서 ct만 남긴다. 광고 링크에 붙는 fbclid 같은 클릭 ID를 보내지 않으려고. 주소로 읽히지 않으면 원문 대신 버린다 */
  function withoutTrackingQuery(href) {
    if (typeof href !== 'string' || href === '') return href;
    const url = parseUrl(href);
    if (url == null) return undefined;
    const ct = campaignOf(url.search);
    url.search = ct == null ? '' : '?ct=' + ct;
    url.hash = '';
    return url.toString();
  }

  // PostHog 기본 속성 중 버리는 것. 들어온 주소 전체와 그 안의 광고 클릭 ID($session_entry_fbclid 같은)를 따로 싣는 칸,
  // 메타 광고 클릭 값($fbc), 전체 User-Agent(브라우저·OS는 $browser·$os로 남는다), 사람 속성
  const DROPPED_PREFIXES = ['$session_entry_', '$initial_'];
  const DROPPED_PROPERTIES = ['$fbc', '$raw_user_agent', '$set', '$set_once'];

  function isKeptProperty(key) {
    if (DROPPED_PROPERTIES.includes(key)) return false;
    if (DROPPED_PREFIXES.some((prefix) => key.startsWith(prefix))) return false;
    return key.startsWith('$') || PLAIN_PROPERTIES.includes(key);
  }

  function beforeSend(event) {
    if (event == null) return null;
    const kept = Object.fromEntries(Object.entries(event.properties).filter(([key]) => isKeptProperty(key)));
    const referrer = kept.$referrer === '$direct' ? kept.$referrer : withoutTrackingQuery(kept.$referrer);
    const properties = { ...kept, $current_url: withoutTrackingQuery(kept.$current_url), $referrer: referrer };
    return { ...event, properties, $set: undefined, $set_once: undefined };
  }

  /** 브라우저의 '추적 안 함'. 켜져 있으면 PostHog·Vercel 스크립트를 받지도 않는다 */
  function isDoNotTrack() {
    const value = navigator.doNotTrack ?? window.doNotTrack;
    return value === '1' || value === 'yes';
  }

  if (isDoNotTrack()) return;

  // PostHog 웹 스니펫 그대로(https://posthog.com/docs/libraries/js, 2026-11-26 확인)
  /* eslint-disable */
  !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],Object.defineProperty(u,"toString",{configurable:!0,enumerable:!0,writable:!0,value:function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e}}),Object.defineProperty(u.people,"toString",{configurable:!0,enumerable:!0,writable:!0,value:function(){return u.toString(1)+".people (stub)"}}),o="init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagResult isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey getNextSurveyStep identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty createPersonProfile opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing debug".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
  /* eslint-enable */

  // array.js가 로드되면 window.posthog가 대기열(stub)에서 진짜 객체로 바뀐다. 변수에 담아 두면 그 뒤 호출이 버려져 매번 window에서 읽는다
  window.posthog.init(PROJECT_KEY, {
    api_host: API_HOST,
    defaults: '2026-08-30',
    // 저장하지 않는다. 쿠키 배너가 필요 없는 상태를 지킨다
    persistence: 'memory',
    disable_persistence: true,
    // 위에서 이미 멈추지만 PostHog 쪽에도 같은 뜻을 남긴다. 저장소를 안 써 끄기 선택을 기억할 수 없어 '추적 안 함'을 거부 방법으로 둔다
    respect_dnt: true,
    // 사람 프로필을 만들지 않는다(앱과 같다)
    person_profiles: 'never',
    // 정한 이벤트만 보낸다. 자동 수집·화면 녹화·설문·/flags 요청을 끈다
    autocapture: false,
    capture_pageview: false,
    capture_pageleave: false,
    capture_dead_clicks: false,
    capture_heatmaps: false,
    capture_performance: false,
    capture_exceptions: false,
    disable_session_recording: true,
    disable_surveys: true,
    advanced_disable_flags: true,
    before_send: beforeSend,
  });

  /** Vercel 사본이면 Web Analytics 스크립트를 붙인다. 주소의 광고 클릭 ID는 PostHog와 같이 지운다(문서 quickstart·redacting-sensitive-data) */
  function startVercelAnalytics() {
    if (!window.location.hostname.endsWith(VERCEL_HOST_SUFFIX)) return false;
    window.va =
      window.va ||
      function () {
        (window.vaq = window.vaq || []).push(arguments);
      };
    window.va('beforeSend', function (event) {
      const url = withoutTrackingQuery(event.url);
      return url == null ? null : { ...event, url };
    });
    const script = document.createElement('script');
    script.defer = true;
    script.src = VERCEL_SCRIPT;
    document.head.appendChild(script);
    return true;
  }

  /** PostHog와 같은 클릭을 Vercel 커스텀 이벤트로도 센다. 속성은 이벤트마다 정한 둘만 */
  function trackVercelEvent(name, properties) {
    const keys = VERCEL_EVENT_PROPERTIES[name];
    if (keys == null) return;
    const data = Object.fromEntries(keys.map((key) => [key, properties[key] ?? null]));
    window.va('event', { name, data });
  }

  const context = campaignContext();
  const hasVercelAnalytics = startVercelAnalytics();
  // $geoip_disable: IP로 나라·도시·우편번호·좌표를 붙이지 않는다(앱과 같다). 한국에서 왔는지는 $timezone·$browser_language로 본다
  window.posthog.register({
    platform: 'web',
    page: pageOf(window.location.pathname),
    ct: context.ct,
    ct_from: context.ct_from,
    $geoip_disable: true,
  });
  window.posthog.capture('web.page_view');

  // 누르면 바로 다른 페이지로 넘어가니 줄 세우지 않고 sendBeacon으로 바로 보낸다(문서 'Sending events before a page unload')
  document.addEventListener(
    'click',
    function (click) {
      const target = click.target instanceof Element ? click.target.closest('[data-track]') : null;
      const eventName = target == null ? '' : target.getAttribute('data-track');
      if (eventName == null || eventName === '') return;
      const properties = {};
      TRACKED_DATA.forEach(function (name) {
        const value = target.getAttribute('data-' + name);
        if (value != null) properties[name] = value;
      });
      window.posthog.capture(eventName, properties, { transport: 'sendBeacon', send_instantly: true });
      if (hasVercelAnalytics) trackVercelEvent(eventName, { ...properties, ct: context.ct });
    },
    true,
  );
})();
