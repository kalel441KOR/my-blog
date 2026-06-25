/**
 * 2048 UI Module
 * game.js의 상태를 DOM에 반영, 키보드/터치 이벤트 처리, 애니메이션 트리거
 */

(function () {
  'use strict';

  const ANIMATION_DURATION = 100; // 이동 애니메이션 ms
  const APPEAR_DURATION = 150;    // 등장 애니메이션 ms

  let game;
  let bestScore = 0;
  let isAnimating = false;

  // DOM 요소
  let gridContainer;
  let scoreDisplay;
  let bestDisplay;
  let newGameBtn;
  let gameOverOverlay;
  let winOverlay;
  let gameContainer;

  /** 초기화 */
  function init() {
    game = new Game2048();
    bestScore = loadBestScore();

    // DOM 요소 참조
    gridContainer = document.getElementById('grid-container');
    scoreDisplay = document.getElementById('score-value');
    bestDisplay = document.getElementById('best-value');
    newGameBtn = document.getElementById('new-game-btn');
    gameOverOverlay = document.getElementById('game-over-overlay');
    winOverlay = document.getElementById('win-overlay');
    gameContainer = document.getElementById('game-container');

    // 이벤트 바인딩
    newGameBtn.addEventListener('click', startNewGame);
    document.getElementById('retry-btn').addEventListener('click', startNewGame);
    document.getElementById('win-new-game-btn').addEventListener('click', startNewGame);
    document.getElementById('keep-playing-btn').addEventListener('click', keepPlaying);

    bindKeyboard();
    bindTouch();
    applyTheme();

    // 초기 렌더링
    render();
    updateScores();
  }

  /** 새 게임 시작 */
  function startNewGame() {
    game.init();
    hideOverlays();
    isAnimating = false;
    render();
    updateScores();
  }

  /** 승리 후 계속 플레이 */
  function keepPlaying() {
    game.continuePlaying();
    hideOverlays();
    isAnimating = false;
  }

  /** 오버레이 숨기기 */
  function hideOverlays() {
    gameOverOverlay.classList.remove('active');
    winOverlay.classList.remove('active');
  }

  // ─── 렌더링 ──────────────────────────────────────────────

  /** 격자 전체 렌더링 (애니메이션 없이) */
  function render() {
    gridContainer.innerHTML = '';

    // 빈 칸 배경 렌더링
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const cell = document.createElement('div');
        cell.className = 'grid-cell';
        cell.style.gridRow = r + 1;
        cell.style.gridColumn = c + 1;
        gridContainer.appendChild(cell);
      }
    }

    // 타일 렌더링
    const state = game.getState();
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (state.grid[r][c] !== 0) {
          createTileElement(r, c, state.grid[r][c], false);
        }
      }
    }
  }

  /** 이동 후 애니메이션 포함 렌더링 */
  function renderWithAnimation(moveInfo) {
    isAnimating = true;
    gridContainer.innerHTML = '';

    // 빈 칸 배경
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const cell = document.createElement('div');
        cell.className = 'grid-cell';
        cell.style.gridRow = r + 1;
        cell.style.gridColumn = c + 1;
        gridContainer.appendChild(cell);
      }
    }

    const state = game.getState();
    const mergePositions = new Set();
    if (moveInfo.merges) {
      for (const m of moveInfo.merges) {
        mergePositions.add(`${m.r},${m.c}`);
      }
    }

    const newTilePos = moveInfo.newTile
      ? `${moveInfo.newTile.r},${moveInfo.newTile.c}`
      : null;

    // 이동한 타일들 — 시작 위치에서 끝 위치로 transform 애니메이션
    const movedToPositions = new Set();

    for (const m of moveInfo.moves) {
      movedToPositions.add(`${m.toR},${m.toC}`);
      const tile = document.createElement('div');
      const val = m.value;
      tile.className = `tile tile-${val > 2048 ? 'super' : val}`;
      tile.textContent = val;
      applyTileFontSize(tile, val);

      // 끝 위치에 배치하되 transform으로 시작 위치에 보이게 함
      const fromPos = getCellPosition(m.fromR, m.fromC);
      const toPos = getCellPosition(m.toR, m.toC);
      const dx = fromPos.left - toPos.left;
      const dy = fromPos.top - toPos.top;

      tile.style.left = toPos.left + 'px';
      tile.style.top = toPos.top + 'px';
      tile.style.width = toPos.width + 'px';
      tile.style.height = toPos.height + 'px';
      tile.style.transform = `translate(${dx}px, ${dy}px)`;
      tile.style.transition = 'none';
      gridContainer.appendChild(tile);

      // 다음 프레임에서 transform을 해제하여 끝 위치로 슬라이드
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          tile.style.transition = `transform ${ANIMATION_DURATION}ms ease-in-out`;
          tile.style.transform = 'translate(0, 0)';
        });
      });
    }

    // 이동하지 않은 기존 타일 (새 타일과 병합 결과 제외)
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const val = state.grid[r][c];
        if (val === 0) continue;
        const key = `${r},${c}`;
        if (key === newTilePos) continue;
        if (mergePositions.has(key)) continue;
        if (!movedToPositions.has(key)) {
          // 이동하지 않은 타일은 그냥 표시
          createTileElement(r, c, val, false);
        }
      }
    }

    // 병합과 새 타일은 이동 애니메이션 끝난 후 표시
    setTimeout(() => {
      // 기존 이동 타일 제거 후 최종 상태로 다시 그리기
      gridContainer.innerHTML = '';

      // 빈 칸 배경
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          const cell = document.createElement('div');
          cell.className = 'grid-cell';
          cell.style.gridRow = r + 1;
          cell.style.gridColumn = c + 1;
          gridContainer.appendChild(cell);
        }
      }

      // 최종 타일 그리기
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          const val = state.grid[r][c];
          if (val === 0) continue;
          const key = `${r},${c}`;
          const isMerged = mergePositions.has(key);
          const isNew = key === newTilePos;

          const tile = createTileElement(r, c, val, isNew);
          if (isMerged) {
            tile.classList.add('tile-merged');
          }
        }
      }

      isAnimating = false;

      // 상태 확인: 승리/패배
      if (state.won && !state.keepPlaying) {
        showWinOverlay();
      } else if (state.over) {
        showGameOverOverlay();
      }
    }, ANIMATION_DURATION);
  }

  /** 셀 위치와 크기를 계산 (격자 내 절대 좌표) */
  function getCellPosition(r, c) {
    const containerW = gridContainer.offsetWidth;
    const containerH = gridContainer.offsetHeight;
    const gap = parseFloat(getComputedStyle(gridContainer).gap) || 10;
    const cellW = (containerW - gap * 3) / 4;
    const cellH = (containerH - gap * 3) / 4;
    return {
      left: c * (cellW + gap),
      top: r * (cellH + gap),
      width: cellW,
      height: cellH
    };
  }

  /** 타일 DOM 요소 생성 */
  function createTileElement(r, c, value, isNew) {
    const tile = document.createElement('div');
    tile.className = `tile tile-${value > 2048 ? 'super' : value}`;
    tile.textContent = value;
    const pos = getCellPosition(r, c);
    tile.style.left = pos.left + 'px';
    tile.style.top = pos.top + 'px';
    tile.style.width = pos.width + 'px';
    tile.style.height = pos.height + 'px';
    applyTileFontSize(tile, value);

    if (isNew) {
      tile.classList.add('tile-new');
    }

    gridContainer.appendChild(tile);
    return tile;
  }

  /** 자릿수에 따른 폰트 크기 적용 */
  function applyTileFontSize(tile, value) {
    if (value >= 1000) {
      tile.classList.add('tile-digits-4');
    } else if (value >= 100) {
      tile.classList.add('tile-digits-3');
    } else if (value >= 10) {
      tile.classList.add('tile-digits-2');
    }
  }

  // ─── 점수 ────────────────────────────────────────────────

  function updateScores() {
    const state = game.getState();
    scoreDisplay.textContent = state.score;

    if (state.score > bestScore) {
      bestScore = state.score;
      saveBestScore(bestScore);
    }
    bestDisplay.textContent = bestScore;
  }

  function loadBestScore() {
    try {
      return parseInt(localStorage.getItem('2048-best-score')) || 0;
    } catch {
      return 0;
    }
  }

  function saveBestScore(score) {
    try {
      localStorage.setItem('2048-best-score', score.toString());
    } catch {
      // localStorage 사용 불가
    }
  }

  // ─── 오버레이 ────────────────────────────────────────────

  function showGameOverOverlay() {
    gameOverOverlay.classList.add('active');
  }

  function showWinOverlay() {
    winOverlay.classList.add('active');
  }

  // ─── 입력 처리 ───────────────────────────────────────────

  function handleMove(direction) {
    if (isAnimating) return;

    const state = game.getState();
    if (state.over && !state.keepPlaying) return;
    if (state.won && !state.keepPlaying) return;

    const moved = game.move(direction);
    if (moved) {
      const newState = game.getState();
      updateScores();
      if (newState.moveInfo) {
        renderWithAnimation(newState.moveInfo);
      } else {
        render();
      }
    }
  }

  /** 키보드 이벤트 바인딩 */
  function bindKeyboard() {
    document.addEventListener('keydown', function (e) {
      const keyMap = {
        'ArrowUp': 'up', 'ArrowDown': 'down', 'ArrowLeft': 'left', 'ArrowRight': 'right',
        'w': 'up', 'W': 'up',
        's': 'down', 'S': 'down',
        'a': 'left', 'A': 'left',
        'd': 'right', 'D': 'right'
      };

      const direction = keyMap[e.key];
      if (direction) {
        e.preventDefault();
        handleMove(direction);
      }
    });
  }

  /** 터치 스와이프 바인딩 */
  function bindTouch() {
    let startX = 0;
    let startY = 0;
    let touching = false;

    const target = gameContainer;

    target.addEventListener('touchstart', function (e) {
      if (e.touches.length === 1) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        touching = true;
      }
    }, { passive: true });

    target.addEventListener('touchmove', function (e) {
      if (touching) {
        e.preventDefault();
      }
    }, { passive: false });

    target.addEventListener('touchend', function (e) {
      if (!touching) return;
      touching = false;

      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;

      const dx = endX - startX;
      const dy = endY - startY;

      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      const THRESHOLD = 30;

      if (Math.max(absDx, absDy) < THRESHOLD) return;

      let direction;
      if (absDx > absDy) {
        direction = dx > 0 ? 'right' : 'left';
      } else {
        direction = dy > 0 ? 'down' : 'up';
      }

      handleMove(direction);
    }, { passive: true });
  }

  // ─── 테마 ────────────────────────────────────────────────

  function applyTheme() {
    // data-theme 속성이 이미 있으면 존중, 없으면 시스템 설정 따름
    const saved = document.documentElement.getAttribute('data-theme');
    if (!saved) {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        document.documentElement.setAttribute('data-theme', 'dark');
      }
    }
  }

  // ─── 시작 ────────────────────────────────────────────────

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
