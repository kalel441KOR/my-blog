# My Blog

마크다운 파일을 읽어 정적 블로그 웹사이트로 변환하는 프로젝트.

## Tech Stack

- HTML, CSS, JavaScript (프레임워크 없음, 순수 바닐라)
- 마크다운 파싱: marked.js (CDN)
- 빌드 도구 없음 — 브라우저에서 직접 실행

## Design Principles

- 깔끔하고 읽기 좋은 타이포그래피 중심 디자인
- 다크 모드 지원 (시스템 설정 감지 + 수동 토글)
- 모바일 반응형 (mobile-first)
- 최소한의 색상, 넉넉한 여백

## Project Structure

```
my-blog/
├── index.html          # 메인 페이지 (글 목록)
├── post.html           # 개별 글 페이지
├── css/
│   └── style.css       # 전체 스타일 (다크모드 포함)
├── js/
│   └── main.js         # 마크다운 로딩, 라우팅, 테마 토글
└── posts/              # 마크다운 글 파일 (.md)
    └── posts.json      # 글 메타데이터 목록
```

## Conventions

- 마크다운 파일 이름: `YYYY-MM-DD-slug.md` (예: `2026-06-24-hello-world.md`)
- posts.json에 글 목록 수동 관리 (title, date, file, summary)
- CSS 변수로 테마 색상 관리 (`--bg`, `--text`, `--accent` 등)
- 미디어 쿼리 `prefers-color-scheme`으로 시스템 다크모드 감지

## Commands

- 로컬 실행: `npx serve .` 또는 VS Code Live Server
- 별도 빌드/테스트 없음
