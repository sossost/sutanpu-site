# 스탄푸 공개 페이지

앱 스탄푸의 소개 페이지와 이용약관, 개인정보처리방침, 문의, 계정 삭제 페이지입니다.

- https://sossost.github.io/sutanpu-site/ (앱 소개)
- https://sossost.github.io/sutanpu-site/terms.html
- https://sossost.github.io/sutanpu-site/privacy.html
- https://sossost.github.io/sutanpu-site/support.html
- https://sossost.github.io/sutanpu-site/delete-account.html

`terms`·`privacy`·`support`·`delete-account.html`은 앱 레포의 약관에서 생성합니다(`pnpm gen:legal-site`). 여기서 직접 고치지 않습니다.

`index.html`(앱 소개)은 여기서 직접 고칩니다. `assets/`의 그림과 글꼴은 앱 레포의 `docs/features/landing-page/source/build-site-assets.sh`가 만듭니다. 문장을 고치면 글꼴에 새 글자가 들어가도록 그 스크립트를 다시 돌립니다. 무엇을 어디서 가져왔는지는 앱 레포의 `docs/features/landing-page/01-spec.md`에 있습니다.
