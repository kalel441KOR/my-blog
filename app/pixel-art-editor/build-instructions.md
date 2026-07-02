# Build 서브에이전트 지침: 픽셀 아트 에디터

## 역할
너는 이 블로그 프로젝트의 "Build" 단계를 담당하는 서브에이전트다. 이미 승인된 기획서
`app/pixel-art-editor/spec.md`를 그대로 구현하는 것이 임무다. **기획을 바꾸지 마라** —
spec.md에 없는 기능을 추가하거나 범위를 확장하지 말고, spec.md에 정의된 대로 정확히 구현해라.

## 수정 범위 (엄격히 제한)
- 오직 `app/pixel-art-editor/` 폴더 안의 파일만 생성/수정한다.
- 블로그의 다른 파일(`index.html`, `css/`, `js/`, `app/2048/` 등)은 절대 건드리지 않는다.
- 생성할 파일: `app/pixel-art-editor/index.html`, `app/pixel-art-editor/style.css`, `app/pixel-art-editor/editor.js`
  (spec.md의 "3. 파일 구조" 섹션 참고)

## 구현 지침
1. 먼저 `app/pixel-art-editor/spec.md`를 정독해라. 모든 섹션(기능 목록, 파일 구조, 기술 스택,
   UI 설계, 모바일 지원)을 반드시 반영한다.
2. 기술 스택 결정을 그대로 따른다: canvas 하나로 편집과 저장을 모두 처리 (DOM grid 사용 안 함).
   - 16x16 상태 배열이 단일 진실 소스(Single Source of Truth)
   - 화면 표시용 캔버스는 반응형 크기(`width: min(90vw, 512px)`)로 확대 렌더링,
     `imageSmoothingEnabled = false`로 픽셀 경계 유지
   - PNG 저장 시 별도 오프스크린 캔버스(256x256, 16배 확대)에 다시 그려서
     `toDataURL('image/png')` + `<a download>`로 다운로드
3. 도구: 펜, 지우개, 채우기(flood fill, 4방향 인접). 팔레트: 프리셋 12~16색 + `<input type="color">`.
   현재 색상 스와치 표시. 전체 지우기(confirm 확인 후 실행).
4. 마우스(mousedown/mousemove/mouseup)와 터치(touchstart/touchmove/touchend) 모두 지원,
   같은 셀 좌표 계산 로직 재사용. 캔버스에 `touch-action: none` 적용.
5. 다크모드: spec.md "5.2 색상 체계" 표에 정의된 CSS 변수 값을 그대로 사용한다.
   `[data-theme="dark"]` 선택자 + `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) }`
   패턴을 따르고, 앱 자체에 다크모드 토글 버튼을 둔다 (2048 앱의 다크모드 토글 구현 방식을
   `app/2048/index.html`, `app/2048/ui.js` 등에서 참고해도 좋다 — 단, 그 파일들은 읽기만 하고 수정하지 않는다).
6. 모바일 대응: `<meta name="viewport" content="width=device-width, initial-scale=1">`,
   버튼 최소 터치 영역 44px, `flex-wrap: wrap`으로 좁은 화면 대응.
7. 외부 라이브러리는 쓰지 않는다 (CDN 포함 제로 의존성). Vanilla HTML/CSS/JS(ES6+)만 사용한다.
8. index.html은 블로그 본체와 무관하게 단독으로 실행 가능해야 한다 (블로그의 js/main.js, css/style.css를 로드하지 않는다).

## 완료 후
- 구현한 파일 목록과 각 파일의 역할을 간단히 보고한다.
- review.md나 spec.md는 건드리지 않는다 (review는 별도 서브에이전트가 담당).
