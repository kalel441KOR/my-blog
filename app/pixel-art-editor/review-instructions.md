# Review 서브에이전트 지침: 픽셀 아트 에디터

## 역할
너는 이 블로그 프로젝트의 "Review" 단계를 담당하는 서브에이전트다. Build 서브에이전트가
`app/pixel-art-editor/`에 구현한 픽셀 아트 에디터를 독립적으로 검증하는 것이 임무다.
너는 구현에 관여하지 않았으므로 편견 없이 처음부터 검증해라.

## 검증 범위
1. `app/pixel-art-editor/spec.md`를 읽고 기획 대비 구현이 요구사항을 충족하는지 확인한다.
2. `app/pixel-art-editor/index.html`, `style.css`, `editor.js` 코드를 리뷰한다:
   - 버그, 논리 오류, 엣지 케이스 누락
   - 접근성/시맨틱 문제
   - 불필요한 외부 의존성 사용 여부 (없어야 함)
   - 블로그 본체 파일(js/main.js, css/style.css)을 로드하지 않고 독립 실행 가능한지
3. 브라우저 프리뷰 도구(preview_start, preview_screenshot, preview_snapshot, preview_console_logs,
   preview_click, preview_fill, preview_inspect, preview_resize 등)를 사용해 실제로 앱을 띄우고
   다음을 직접 조작하며 확인한다:
   - 16x16 캔버스에 펜으로 도트가 찍히는지 (클릭 및 드래그)
   - 지우개 도구가 정상 동작하는지
   - 채우기(bucket fill) 도구가 인접한 동일 색상 영역만 올바르게 채우는지
   - 프리셋 팔레트 색상 클릭 시 현재 색상이 바뀌는지, 커스텀 컬러피커도 동작하는지
   - 전체 지우기가 confirm 확인 후 정상 동작하는지
   - PNG 저장 버튼 클릭 시 다운로드가 정상적으로 트리거되는지 (data URL 등 확인)
   - 다크모드 토글이 정상 동작하는지 (색상 변수 전환 확인)
   - 모바일 뷰포트(preview_resize로 375px 등)에서 레이아웃이 깨지지 않는지, 터치 드로잉이
     동작하는지
   - 콘솔 에러가 없는지 (preview_console_logs)
4. 문제를 발견하면 **직접 수정**한다 (`app/pixel-art-editor/` 폴더 안의 파일만 수정 가능).
   블로그의 다른 파일은 건드리지 않는다.

## 산출물
- 검증 결과와 발견한 문제/수정 내역을 `app/pixel-art-editor/review.md`에 작성한다.
  (형식 참고: `app/2048/review.md`가 있다면 참고, 없으면 자유롭게 - 검증 항목별 결과(pass/fail),
  발견한 버그와 수정 여부를 명확히 기록)
- 모든 항목이 정상 동작하는 것을 확인한 후 review.md를 최종 작성한다.
- 완료 후 대화창에는 review.md 요약(정상 동작 여부, 수정한 내용이 있다면 그 내용)만 간단히 보고한다.
