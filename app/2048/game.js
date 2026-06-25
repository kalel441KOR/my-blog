/**
 * 2048 Game Logic Module
 * 순수 게임 로직 — DOM에 의존하지 않음
 */

class Game2048 {
  constructor(size = 4) {
    this.size = size;
    this.grid = [];
    this.score = 0;
    this.won = false;
    this.over = false;
    this.keepPlaying = false;
    this.previousGrid = null;
    this.previousScore = 0;
    this.moveInfo = null; // 이동/병합 애니메이션 정보
    this.init();
  }

  /** 게임 초기화 */
  init() {
    this.grid = this.createEmptyGrid();
    this.score = 0;
    this.won = false;
    this.over = false;
    this.keepPlaying = false;
    this.moveInfo = null;
    this.addRandomTile();
    this.addRandomTile();
  }

  /** 빈 4x4 격자 생성 */
  createEmptyGrid() {
    const grid = [];
    for (let r = 0; r < this.size; r++) {
      grid[r] = [];
      for (let c = 0; c < this.size; c++) {
        grid[r][c] = 0;
      }
    }
    return grid;
  }

  /** 빈 셀 좌표 목록 반환 */
  getEmptyCells() {
    const cells = [];
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (this.grid[r][c] === 0) {
          cells.push({ r, c });
        }
      }
    }
    return cells;
  }

  /** 랜덤 빈 칸에 새 타일 추가 (90% -> 2, 10% -> 4) */
  addRandomTile() {
    const emptyCells = this.getEmptyCells();
    if (emptyCells.length === 0) return null;

    const cell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    const value = Math.random() < 0.9 ? 2 : 4;
    this.grid[cell.r][cell.c] = value;
    return { r: cell.r, c: cell.c, value };
  }

  /** 격자 깊은 복사 */
  cloneGrid(grid) {
    return grid.map(row => [...row]);
  }

  /**
   * 한 줄(row)을 왼쪽으로 밀어 병합하는 핵심 알고리즘
   * @param {number[]} line - 길이 4 배열
   * @returns {{ result: number[], score: number, moves: object[], merged: number[] }}
   */
  slideLine(line) {
    const size = line.length;
    let score = 0;
    const moves = [];   // { from, to } 인덱스
    const merged = [];  // 병합된 결과 위치 인덱스

    // 1단계: 0이 아닌 타일만 추출
    const nonZero = [];
    const originalIndices = [];
    for (let i = 0; i < size; i++) {
      if (line[i] !== 0) {
        nonZero.push(line[i]);
        originalIndices.push(i);
      }
    }

    // 2단계: 병합 처리
    const result = [];
    const resultSources = []; // 각 결과 타일의 원본 인덱스들
    let i = 0;
    while (i < nonZero.length) {
      if (i + 1 < nonZero.length && nonZero[i] === nonZero[i + 1]) {
        // 병합
        const mergedValue = nonZero[i] * 2;
        result.push(mergedValue);
        resultSources.push([originalIndices[i], originalIndices[i + 1]]);
        score += mergedValue;
        merged.push(result.length - 1);
        i += 2;
      } else {
        result.push(nonZero[i]);
        resultSources.push([originalIndices[i]]);
        i++;
      }
    }

    // 빈 칸 채우기
    while (result.length < size) {
      result.push(0);
      resultSources.push([]);
    }

    // 이동 정보 생성
    for (let j = 0; j < resultSources.length; j++) {
      for (const fromIdx of resultSources[j]) {
        if (fromIdx !== j) {
          moves.push({ from: fromIdx, to: j });
        }
      }
    }

    return { result, score, moves, merged };
  }

  /**
   * 방향으로 이동 실행
   * @param {'up'|'down'|'left'|'right'} direction
   * @returns {boolean} 이동이 발생했는지 여부
   */
  move(direction) {
    if (this.over && !this.keepPlaying) return false;
    if (this.won && !this.keepPlaying) return false;

    this.previousGrid = this.cloneGrid(this.grid);
    this.previousScore = this.score;

    const moveDetails = {
      moves: [],     // { fromR, fromC, toR, toC, value }
      merges: [],    // { r, c, value }
      newTile: null  // { r, c, value }
    };

    let moved = false;
    let scoreGain = 0;

    if (direction === 'left') {
      for (let r = 0; r < this.size; r++) {
        const line = this.grid[r].slice();
        const { result, score, moves, merged } = this.slideLine(line);
        scoreGain += score;
        for (const m of moves) {
          moved = true;
          moveDetails.moves.push({
            fromR: r, fromC: m.from,
            toR: r, toC: m.to,
            value: line[m.from]
          });
        }
        for (const idx of merged) {
          moveDetails.merges.push({ r, c: idx, value: result[idx] });
        }
        this.grid[r] = result;
      }
    } else if (direction === 'right') {
      for (let r = 0; r < this.size; r++) {
        const line = this.grid[r].slice().reverse();
        const { result, score, moves, merged } = this.slideLine(line);
        scoreGain += score;
        const reversedResult = result.reverse();
        for (const m of moves) {
          moved = true;
          moveDetails.moves.push({
            fromR: r, fromC: this.size - 1 - m.from,
            toR: r, toC: this.size - 1 - m.to,
            value: this.grid[r][this.size - 1 - m.from]
          });
        }
        for (const idx of merged) {
          moveDetails.merges.push({ r, c: this.size - 1 - idx, value: reversedResult[this.size - 1 - idx] });
        }
        this.grid[r] = reversedResult;
      }
    } else if (direction === 'up') {
      for (let c = 0; c < this.size; c++) {
        const line = [];
        for (let r = 0; r < this.size; r++) line.push(this.grid[r][c]);
        const { result, score, moves, merged } = this.slideLine(line);
        scoreGain += score;
        for (const m of moves) {
          moved = true;
          moveDetails.moves.push({
            fromR: m.from, fromC: c,
            toR: m.to, toC: c,
            value: line[m.from]
          });
        }
        for (const idx of merged) {
          moveDetails.merges.push({ r: idx, c, value: result[idx] });
        }
        for (let r = 0; r < this.size; r++) this.grid[r][c] = result[r];
      }
    } else if (direction === 'down') {
      for (let c = 0; c < this.size; c++) {
        const line = [];
        for (let r = this.size - 1; r >= 0; r--) line.push(this.grid[r][c]);
        const { result, score, moves, merged } = this.slideLine(line);
        scoreGain += score;
        for (const m of moves) {
          moved = true;
          moveDetails.moves.push({
            fromR: this.size - 1 - m.from, fromC: c,
            toR: this.size - 1 - m.to, toC: c,
            value: this.grid[this.size - 1 - m.from][c]
          });
        }
        for (const idx of merged) {
          const actualR = this.size - 1 - idx;
          moveDetails.merges.push({ r: actualR, c, value: result[idx] });
        }
        const reversed = result.reverse();
        for (let r = 0; r < this.size; r++) this.grid[r][c] = reversed[r];
      }
    }

    if (!moved) return false;

    this.score += scoreGain;

    // 새 타일 추가
    const newTile = this.addRandomTile();
    if (newTile) {
      moveDetails.newTile = newTile;
    }

    this.moveInfo = moveDetails;

    // 승리 판정
    if (!this.won && this.hasValue(2048)) {
      this.won = true;
    }

    // 패배 판정
    if (!this.canMove()) {
      this.over = true;
    }

    return true;
  }

  /** 격자에 특정 값이 있는지 확인 */
  hasValue(value) {
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (this.grid[r][c] === value) return true;
      }
    }
    return false;
  }

  /** 이동 가능한 방향이 있는지 확인 */
  canMove() {
    // 빈 칸이 있으면 이동 가능
    if (this.getEmptyCells().length > 0) return true;

    // 인접 같은 숫자가 있으면 이동 가능
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        const val = this.grid[r][c];
        // 오른쪽 확인
        if (c + 1 < this.size && this.grid[r][c + 1] === val) return true;
        // 아래쪽 확인
        if (r + 1 < this.size && this.grid[r + 1][c] === val) return true;
      }
    }

    return false;
  }

  /** 승리 후 계속 플레이 */
  continuePlaying() {
    this.keepPlaying = true;
  }

  /** 현재 격자 상태 반환 */
  getState() {
    return {
      grid: this.cloneGrid(this.grid),
      score: this.score,
      won: this.won,
      over: this.over,
      keepPlaying: this.keepPlaying,
      moveInfo: this.moveInfo
    };
  }
}
