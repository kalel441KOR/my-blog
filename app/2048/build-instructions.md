# 2048 게임 Build 지침

## 목표
spec.md에 정의된 2048 퍼즐 게임을 구현한다.

## 수정 가능한 범위
`app/2048/` 폴더 안의 다음 파일만 생성/수정한다:
- index.html
- style.css
- game.js
- ui.js

**블로그 본체 파일(index.html, post.html, css/, js/, posts/ 등)은 절대 건드리지 않는다.**

## 구현 순서
1. game.js — 순수 게임 로직 (DOM 의존 없음)
2. ui.js — DOM 렌더링, 이벤트 처리, localStorage
3. style.css — 격자, 타일, 점수판, 애니메이션, 반응형, 다크모드
4. index.html — 마크업, 스크립트/스타일 로드

## 핵심 요구사항
- spec.md의 기능 목록, UI 설계, 색상 체계, 애니메이션 사양을 모두 따른다
- 외부 라이브러리 없이 순수 HTML/CSS/JS로 구현
- 모바일 터치 스와이프 지원 (최소 임계값 30px)
- 키보드 방향키 + WASD 지원
- localStorage로 최고 점수 저장
- 라이트/다크 모드 지원 (prefers-color-scheme + data-theme 속성)
- 반응형 레이아웃 (모바일에서도 동작)
