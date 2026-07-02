(function () {
  'use strict';

  // ─── 상수 ──────────────────────────────────────────────
  var GRID_SIZE = 16;
  var EXPORT_SCALE = 16; // 16 x 16 = 256 x 256 PNG
  var STORAGE_KEY_THEME = 'pixel-art-editor-theme';

  var PRESET_COLORS = [
    '#000000', '#ffffff', '#7f7f7f', '#c3c3c3',
    '#ff0000', '#ff8c00', '#ffd700', '#2ecc71',
    '#00bcd4', '#3498db', '#1a237e', '#8e44ad',
    '#ff69b4', '#8b4513', '#a0522d', 'transparent'
  ];

  // ─── 상태 (Single Source of Truth) ─────────────────────
  // pixels[row][col] = hex 색상 문자열 또는 null(투명)
  var pixels = createEmptyGrid();
  var currentColor = '#000000';
  var currentTool = 'pen'; // 'pen' | 'eraser' | 'fill'
  var isDrawing = false;
  var lastCell = null; // { row, col } 중복 재드로잉 방지용

  // ─── DOM 요소 ───────────────────────────────────────────
  var canvas = document.getElementById('pixel-canvas');
  var ctx = canvas.getContext('2d');
  var paletteEl = document.getElementById('palette');
  var swatchEl = document.getElementById('current-color-swatch');
  var customColorInput = document.getElementById('custom-color');
  var clearBtn = document.getElementById('clear-btn');
  var saveBtn = document.getElementById('save-btn');
  var themeToggleBtn = document.getElementById('theme-toggle');
  var toolButtons = document.querySelectorAll('.tool-btn');

  // ─── 초기화 ─────────────────────────────────────────────
  function init() {
    applyTheme();
    buildPalette();
    updateSwatch();
    bindToolButtons();
    bindPaletteEvents();
    bindCustomColorEvents();
    bindClearButton();
    bindSaveButton();
    bindThemeToggle();
    bindPointerEvents();
    render();
  }

  function createEmptyGrid() {
    var grid = [];
    for (var r = 0; r < GRID_SIZE; r++) {
      var row = [];
      for (var c = 0; c < GRID_SIZE; c++) {
        row.push(null);
      }
      grid.push(row);
    }
    return grid;
  }

  // ─── 렌더링 ─────────────────────────────────────────────
  function render() {
    var cssWidth = canvas.clientWidth || canvas.width;
    var cssHeight = canvas.clientHeight || canvas.height;
    var dpr = window.devicePixelRatio || 1;

    var targetW = Math.round(cssWidth * dpr);
    var targetH = Math.round(cssHeight * dpr);
    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }

    ctx.imageSmoothingEnabled = false;

    var cellW = canvas.width / GRID_SIZE;
    var cellH = canvas.height / GRID_SIZE;

    var bgColor = getCssVar('--canvas-bg') || '#ffffff';
    var gridLineColor = getCssVar('--canvas-grid-line') || '#dcdcdc';

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (var r = 0; r < GRID_SIZE; r++) {
      for (var c = 0; c < GRID_SIZE; c++) {
        var color = pixels[r][c];
        if (color) {
          ctx.fillStyle = color;
          ctx.fillRect(
            Math.floor(c * cellW),
            Math.floor(r * cellH),
            Math.ceil(cellW),
            Math.ceil(cellH)
          );
        }
      }
    }

    // 격자선
    ctx.strokeStyle = gridLineColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (var i = 0; i <= GRID_SIZE; i++) {
      var x = Math.round(i * cellW) + 0.5;
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      var y = Math.round(i * cellH) + 0.5;
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
    }
    ctx.stroke();
  }

  function getCssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  // ─── 좌표 -> 셀 변환 ────────────────────────────────────
  function getCellFromEvent(clientX, clientY) {
    var rect = canvas.getBoundingClientRect();
    var x = clientX - rect.left;
    var y = clientY - rect.top;
    var col = Math.floor((x / rect.width) * GRID_SIZE);
    var row = Math.floor((y / rect.height) * GRID_SIZE);
    if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) {
      return null;
    }
    return { row: row, col: col };
  }

  // ─── 드로잉 로직 ────────────────────────────────────────
  function applyToolAt(row, col) {
    if (currentTool === 'pen') {
      pixels[row][col] = currentColor;
    } else if (currentTool === 'eraser') {
      pixels[row][col] = null;
    } else if (currentTool === 'fill') {
      floodFill(row, col);
    }
  }

  function floodFill(startRow, startCol) {
    var targetColor = pixels[startRow][startCol];
    var fillColor = currentColor;
    if (targetColor === fillColor) return;

    var stack = [{ row: startRow, col: startCol }];
    var visited = new Set();
    visited.add(startRow + ',' + startCol);

    while (stack.length > 0) {
      var cell = stack.pop();
      var r = cell.row;
      var c = cell.col;
      if (pixels[r][c] !== targetColor) continue;
      pixels[r][c] = fillColor;

      var neighbors = [
        { row: r - 1, col: c },
        { row: r + 1, col: c },
        { row: r, col: c - 1 },
        { row: r, col: c + 1 }
      ];
      for (var i = 0; i < neighbors.length; i++) {
        var n = neighbors[i];
        if (n.row < 0 || n.row >= GRID_SIZE || n.col < 0 || n.col >= GRID_SIZE) continue;
        var key = n.row + ',' + n.col;
        if (visited.has(key)) continue;
        if (pixels[n.row][n.col] !== targetColor) continue;
        visited.add(key);
        stack.push(n);
      }
    }
  }

  function handlePointerDown(clientX, clientY) {
    var cell = getCellFromEvent(clientX, clientY);
    if (!cell) return;
    isDrawing = true;
    lastCell = null;
    drawAtCell(cell);
  }

  function handlePointerMove(clientX, clientY) {
    if (!isDrawing) return;
    var cell = getCellFromEvent(clientX, clientY);
    if (!cell) return;
    drawAtCell(cell);
  }

  function handlePointerUp() {
    isDrawing = false;
    lastCell = null;
  }

  function drawAtCell(cell) {
    if (lastCell && lastCell.row === cell.row && lastCell.col === cell.col) {
      return; // 같은 셀 중복 재드로잉 방지
    }
    lastCell = cell;
    applyToolAt(cell.row, cell.col);
    render();
  }

  // ─── 마우스/터치 이벤트 바인딩 ──────────────────────────
  function bindPointerEvents() {
    canvas.addEventListener('mousedown', function (e) {
      handlePointerDown(e.clientX, e.clientY);
    });
    window.addEventListener('mousemove', function (e) {
      handlePointerMove(e.clientX, e.clientY);
    });
    window.addEventListener('mouseup', function () {
      handlePointerUp();
    });

    canvas.addEventListener('touchstart', function (e) {
      e.preventDefault();
      var touch = e.touches[0];
      handlePointerDown(touch.clientX, touch.clientY);
    }, { passive: false });

    canvas.addEventListener('touchmove', function (e) {
      e.preventDefault();
      var touch = e.touches[0];
      handlePointerMove(touch.clientX, touch.clientY);
    }, { passive: false });

    canvas.addEventListener('touchend', function (e) {
      e.preventDefault();
      handlePointerUp();
    }, { passive: false });

    canvas.addEventListener('touchcancel', function (e) {
      e.preventDefault();
      handlePointerUp();
    }, { passive: false });

    window.addEventListener('resize', function () {
      render();
    });
  }

  // ─── 도구 버튼 ──────────────────────────────────────────
  function bindToolButtons() {
    toolButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        currentTool = btn.getAttribute('data-tool');
        toolButtons.forEach(function (b) {
          b.classList.toggle('active', b === btn);
        });
      });
    });
  }

  // ─── 팔레트 ─────────────────────────────────────────────
  function buildPalette() {
    PRESET_COLORS.forEach(function (color) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'palette-btn';
      btn.setAttribute('data-color', color);
      btn.title = color === 'transparent' ? '투명' : color;
      if (color === 'transparent') {
        btn.style.background =
          'repeating-conic-gradient(#cccccc 0% 25%, #ffffff 0% 50%) 50% / 10px 10px';
      } else {
        btn.style.background = color;
      }
      paletteEl.appendChild(btn);
    });
  }

  function bindPaletteEvents() {
    paletteEl.addEventListener('click', function (e) {
      var btn = e.target.closest('.palette-btn');
      if (!btn) return;
      var color = btn.getAttribute('data-color');
      setCurrentColor(color === 'transparent' ? null : color);
      highlightPaletteSelection(btn);
    });
  }

  function highlightPaletteSelection(selectedBtn) {
    var btns = paletteEl.querySelectorAll('.palette-btn');
    btns.forEach(function (b) {
      b.classList.toggle('selected', b === selectedBtn);
    });
  }

  function bindCustomColorEvents() {
    customColorInput.addEventListener('input', function () {
      setCurrentColor(customColorInput.value);
      highlightPaletteSelection(null);
    });
  }

  function setCurrentColor(color) {
    currentColor = color || '#000000';
    updateSwatch();
  }

  function updateSwatch() {
    swatchEl.style.background = currentColor;
  }

  // ─── 전체 지우기 ────────────────────────────────────────
  function bindClearButton() {
    clearBtn.addEventListener('click', function () {
      var confirmed = window.confirm('캔버스를 전체 지우시겠습니까? 되돌릴 수 없습니다.');
      if (!confirmed) return;
      pixels = createEmptyGrid();
      render();
    });
  }

  // ─── PNG 저장 ───────────────────────────────────────────
  function bindSaveButton() {
    saveBtn.addEventListener('click', function () {
      savePng();
    });
  }

  function savePng() {
    var exportSize = GRID_SIZE * EXPORT_SCALE; // 256
    var offCanvas = document.createElement('canvas');
    offCanvas.width = exportSize;
    offCanvas.height = exportSize;
    var offCtx = offCanvas.getContext('2d');
    offCtx.imageSmoothingEnabled = false;

    for (var r = 0; r < GRID_SIZE; r++) {
      for (var c = 0; c < GRID_SIZE; c++) {
        var color = pixels[r][c];
        if (color) {
          offCtx.fillStyle = color;
          offCtx.fillRect(c * EXPORT_SCALE, r * EXPORT_SCALE, EXPORT_SCALE, EXPORT_SCALE);
        }
      }
    }

    var dataUrl = offCanvas.toDataURL('image/png');
    var link = document.createElement('a');
    link.download = 'pixel-art.png';
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // ─── 다크모드 ───────────────────────────────────────────
  function applyTheme() {
    var saved = localStorage.getItem(STORAGE_KEY_THEME);
    if (saved === 'dark' || saved === 'light') {
      document.documentElement.setAttribute('data-theme', saved);
    }
    updateThemeToggleLabel();
  }

  function bindThemeToggle() {
    themeToggleBtn.addEventListener('click', function () {
      var current = document.documentElement.getAttribute('data-theme');
      var isDark;
      if (current === 'dark') {
        isDark = false;
      } else if (current === 'light') {
        isDark = true;
      } else {
        // 속성이 없으면 시스템 설정 기준으로 반대값 적용
        var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        isDark = !prefersDark;
      }
      var next = isDark ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem(STORAGE_KEY_THEME, next);
      updateThemeToggleLabel();
      render();
    });
  }

  function updateThemeToggleLabel() {
    var current = document.documentElement.getAttribute('data-theme');
    var isDark = current === 'dark' ||
      (current !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    themeToggleBtn.textContent = isDark ? '☀️' : '🌙';
  }

  // ─── 시작 ───────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
