# 스탄푸 공개 페이지

앱 스탄푸의 소개 페이지와 이용약관, 개인정보처리방침, 문의, 계정 삭제 페이지입니다.

- https://sossost.github.io/sutanpu-site/ (첫 화면: 내 공항에서 직항으로 가는 일본 소도시)
- https://sossost.github.io/sutanpu-site/terms.html
- https://sossost.github.io/sutanpu-site/privacy.html
- https://sossost.github.io/sutanpu-site/support.html
- https://sossost.github.io/sutanpu-site/delete-account.html
- https://sossost.github.io/sutanpu-site/direct-icn.html · direct-pus.html · direct-cjj.html (공항별 직항 소도시)

`terms`·`privacy`·`support`·`delete-account.html`은 앱 레포의 약관에서 생성합니다(`pnpm gen:legal-site`). 여기서 직접 고치지 않습니다.

`index.html`(첫 화면)은 여기서 직접 고칩니다. 다만 `<!--gen:이름-->` 칸(공항 단추의 공항·도시 수, 맛보기 도시, 숫자)은 앱 레포의 `node tools/gen-direct-pages.mjs --index <이 폴더>/index.html`이 채우니 손으로 고치지 않습니다. `assets/`의 그림과 글꼴은 앱 레포의 `docs/features/landing-page/source/build-site-assets.sh`가 만듭니다. 문장을 고치면 글꼴에 새 글자가 들어가도록 그 스크립트를 다시 돌립니다. 무엇을 어디서 가져왔는지는 앱 레포의 `docs/features/landing-page/01-spec.md`에 있습니다.

`direct-*.html`·`sitemap.xml`·`robots.txt`와 제목 글꼴 `assets/jua-direct.<해시>.woff2`·`jua-subset.<해시>.woff2`는 앱 레포의 `tools/gen-direct-pages.mjs`와 `docs/features/landing-page/source/build-site-assets.sh`가 만듭니다(`docs/features/landing-page/01-spec.md`). 글꼴 이름의 해시는 남긴 글자에서 나와, 글자가 바뀌면 주소도 바뀝니다. 첫 화면 맛보기 카드 사진 `assets/cities/<도시>.<해시>.webp`와 그 출처 줄도 같은 두 스크립트가 앱 데이터에서 만듭니다. 여기서 직접 고치지 않습니다.
