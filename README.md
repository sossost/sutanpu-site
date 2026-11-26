# 스탄푸 공개 페이지

앱 스탄푸의 소개 페이지와 이용약관, 개인정보처리방침, 문의, 계정 삭제 페이지입니다.

- https://sossost.github.io/sutanpu-site/ (첫 화면: 내 공항에서 직항으로 가는 일본 소도시)
- https://sossost.github.io/sutanpu-site/terms.html
- https://sossost.github.io/sutanpu-site/privacy.html
- https://sossost.github.io/sutanpu-site/support.html
- https://sossost.github.io/sutanpu-site/delete-account.html
- https://sossost.github.io/sutanpu-site/direct-icn.html · direct-pus.html · direct-cjj.html (공항별 직항 소도시)

`terms`·`privacy`·`support`·`delete-account.html`은 앱 레포의 약관에서 생성합니다(`pnpm gen:legal-site`). 여기서 직접 고치지 않습니다.

`index.html`과 `direct-*.html`은 앱 저장소에서 만듭니다. 첫 화면 디자인과 문구는 앱 저장소의 `docs/features/landing-page/source/index.template.html`에서 고칩니다. 공항, 도시, 운항 기간, 이동 시간과 사진 출처는 앱 데이터에서 가져옵니다.

앱 저장소에서 Node 22.18 이상과 ImageMagick으로 실행합니다.

```sh
node tools/gen-direct-pages.mjs --site ~/sutanpu-site
docs/features/landing-page/source/build-site-assets.sh ~/sutanpu-site --landing-only
```

첫 화면과 직항 페이지, 글꼴, 공유 이미지를 같은 세트로 배포합니다. `assets/store-ct.js`(스토어 링크에 `?ct=` 넘기기)와 `assets/analytics.js`(쿠키 없는 PostHog 방문 집계)도 앱 저장소의 `docs/features/landing-page/source/`에서 복사합니다. 제목 글자가 바뀌면 부분집합 글꼴의 이름도 바뀝니다.
