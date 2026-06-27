import { Chess } from '/lib/chess.js';

// ── ENGINE API ────────────────────────────────────────────────────────────────
async function engineEval(fen, movetime = 1500, elo = 0) {
  const url = `/api/eval?fen=${encodeURIComponent(fen)}&movetime=${movetime}&elo=${elo}`;
  const res  = await fetch(url);
  if (!res.ok) return null;
  return res.json();
}

// ── CONSTANTS ─────────────────────────────────────────────────────────────────
const PIECE_UNICODE = {
  wK:'♔', wQ:'♕', wR:'♖', wB:'♗', wN:'♘', wP:'♙',
  bK:'♚', bQ:'♛', bR:'♜', bB:'♝', bN:'♞', bP:'♟',
};
const MOVE_ICONS = {
  BRILLIANT:'!!', GREAT:'!', GOOD:'', INACCURACY:'?!', MISTAKE:'?', BLUNDER:'??',
};
const MOVE_DELTA = {
  BRILLIANT: +200, GREAT: +100, GOOD: +20,
  INACCURACY: -50, MISTAKE: -50, BLUNDER: -50,
};
const BONUS_UNLOCK_MOVES = 5;  // player moves before per-move bonuses activate
const STARTING_STAKE     = 1000;
const JACKPOT            = 1000;

// ── SETTINGS ──────────────────────────────────────────────────────────────────
const SETTINGS_KEY = 'chessAnalyzerSettings';
function loadSettings() {
  try { return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {}; } catch { return {}; }
}
function saveSettings(patch) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...loadSettings(), ...patch }));
}

// ── SOUND SYSTEM ──────────────────────────────────────────────────────────────
class SoundSystem {
  constructor() {
    this._ctx  = null;
    this.volume = 0.7;
    this.enabled = true;
  }

  _ctx_() {
    if (!this._ctx) this._ctx = new (window.AudioContext || window.webkitAudioContext)();
    return this._ctx;
  }

  _tone(freq, type, dur, vol, startFreq) {
    if (!this.enabled) return;
    try {
      const ctx  = this._ctx_();
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = type || 'sine';
      if (startFreq) {
        osc.frequency.setValueAtTime(startFreq, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(freq, ctx.currentTime + dur * 0.3);
      } else {
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
      }
      gain.gain.setValueAtTime(vol * this.volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + dur);
    } catch {}
  }

  _seq(notes) {  // [{freq, dur, vol, type}]
    if (!this.enabled) return;
    let t = 0;
    notes.forEach(({ freq, dur, vol, type, delay }) => {
      t += delay ?? 0;
      const offset = t;
      try {
        const ctx  = this._ctx_();
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = type || 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + offset);
        gain.gain.setValueAtTime((vol ?? 0.3) * this.volume, ctx.currentTime + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + offset + dur);
        osc.start(ctx.currentTime + offset);
        osc.stop(ctx.currentTime + offset + dur);
      } catch {}
      t += dur;
    });
  }

  move()     { this._tone(800,  'square', 0.06, 0.15, 1200); }
  capture()  { this._tone(300,  'sawtooth', 0.12, 0.2, 600); }
  check()    { this._seq([{freq:880,dur:.1,vol:.3},{delay:.05,freq:1100,dur:.15,vol:.25}]); }
  premove()  { this._tone(600,  'sine', 0.08, 0.1); }
  cancel()   { this._tone(350,  'sine', 0.1,  0.08); }
  start()    { this._seq([{freq:523,dur:.1,vol:.2},{delay:.02,freq:659,dur:.1,vol:.2},{delay:.02,freq:784,dur:.15,vol:.25}]); }
  brilliant(){ this._seq([{freq:880,dur:.08,vol:.3},{delay:.05,freq:1047,dur:.08,vol:.3},{delay:.05,freq:1319,dur:.15,vol:.35,type:'triangle'}]); }
  blunder()  { this._seq([{freq:400,dur:.15,vol:.25,type:'sawtooth'},{delay:.05,freq:300,dur:.2,vol:.2,type:'sawtooth'}]); }
  win()      { this._seq([
    {freq:523,dur:.1,vol:.25},{delay:.05,freq:659,dur:.1,vol:.25},
    {delay:.05,freq:784,dur:.1,vol:.25},{delay:.05,freq:1047,dur:.3,vol:.3,type:'triangle'},
  ]); }
  lose()     { this._seq([
    {freq:494,dur:.15,vol:.2},{delay:.05,freq:440,dur:.15,vol:.2},
    {delay:.05,freq:392,dur:.15,vol:.2},{delay:.05,freq:330,dur:.3,vol:.25,type:'sawtooth'},
  ]); }
}

const sound = new SoundSystem();

// ── MAIN GAME CLASS ───────────────────────────────────────────────────────────
class ChessGame {
  constructor() {
    this.chess            = new Chess();
    this.playerColor      = 'w';
    this.flipped          = false;
    this.selectedSq       = null;
    this.lastMove         = null;
    this.moves            = [];
    this.prevEval         = null;
    this.engineReady      = false;
    this.showingHint      = false;
    this.botThinking      = false;

    // Premove
    this.premove          = null;
    this.premoveFrom      = null;

    // Bankroll — dual balances
    this.playerBalance    = STARTING_STAKE;
    this.botBalance       = STARTING_STAKE;
    this.playerMoveCount  = 0;  // tracks when bonuses unlock

    // Arrows / highlights
    this.arrows           = [];
    this.squareHighlights = [];
    this._arrowSvg        = null;
    this._arrowStartSq    = null;
    this._arrowPreviewSq  = null;

    // Review mode
    this.reviewMode       = false;
    this.reviewFens       = [];
    this.reviewIdx        = 0;

    // Settings (loaded below)
    this.settings = {
      sound:      true,
      volume:     70,
      premove:    true,
      autoQueen:  true,
      coords:     true,
      moveHints:  true,
    };

    this._init();
  }

  // ── INIT ─────────────────────────────────────────────────────────────────
  async _init() {
    this._loadAndApplySettings();
    this._bindUI();
    this._initArrows();

    for (let i = 0; i < 30; i++) {
      try {
        const r = await engineEval('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', 100);
        if (r?.bestMove) break;
      } catch {}
      await new Promise(r => setTimeout(r, 500));
    }
    this.engineReady = true;
    document.getElementById('engineStatus').textContent = '⚙ Engine ready';
    await this._startGame();
  }

  // ── SETTINGS ─────────────────────────────────────────────────────────────
  _loadAndApplySettings() {
    const s = loadSettings();
    if (s.difficulty)  document.getElementById('difficulty').value   = s.difficulty;
    if (s.playerColor) document.getElementById('playerColor').value  = s.playerColor;

    // Merge saved settings
    Object.assign(this.settings, {
      sound:     s.sound     ?? true,
      volume:    s.volume    ?? 70,
      premove:   s.premove   ?? true,
      autoQueen: s.autoQueen ?? true,
      coords:    s.coords    ?? true,
      moveHints: s.moveHints ?? true,
    });

    // Sync UI checkboxes
    document.getElementById('settingSound').checked     = this.settings.sound;
    document.getElementById('settingVolume').value      = this.settings.volume;
    document.getElementById('settingPremove').checked   = this.settings.premove;
    document.getElementById('settingAutoQueen').checked = this.settings.autoQueen;
    document.getElementById('settingCoords').checked    = this.settings.coords;
    document.getElementById('settingMoveHints').checked = this.settings.moveHints;

    sound.enabled = this.settings.sound;
    sound.volume  = this.settings.volume / 100;

    // Auto-save selects
    document.getElementById('difficulty').addEventListener('change',  e => saveSettings({ difficulty:   e.target.value }));
    document.getElementById('playerColor').addEventListener('change', e => saveSettings({ playerColor: e.target.value }));

    // Setting toggles
    document.getElementById('settingSound').addEventListener('change', e => {
      this.settings.sound = e.target.checked;
      sound.enabled = e.target.checked;
      saveSettings({ sound: e.target.checked });
    });
    document.getElementById('settingVolume').addEventListener('input', e => {
      this.settings.volume = +e.target.value;
      sound.volume = +e.target.value / 100;
      saveSettings({ volume: +e.target.value });
    });
    document.getElementById('settingPremove').addEventListener('change', e => {
      this.settings.premove = e.target.checked;
      saveSettings({ premove: e.target.checked });
    });
    document.getElementById('settingAutoQueen').addEventListener('change', e => {
      this.settings.autoQueen = e.target.checked;
      saveSettings({ autoQueen: e.target.checked });
    });
    document.getElementById('settingCoords').addEventListener('change', e => {
      this.settings.coords = e.target.checked;
      saveSettings({ coords: e.target.checked });
      this._renderBoard();
    });
    document.getElementById('settingMoveHints').addEventListener('change', e => {
      this.settings.moveHints = e.target.checked;
      saveSettings({ moveHints: e.target.checked });
      this._renderBoard();
    });
  }

  // ── BANKROLL ─────────────────────────────────────────────────────────────
  _applyBankrollDelta(classification) {
    const delta = MOVE_DELTA[classification] ?? 0;
    if (delta === 0) return;

    // Only apply after unlock threshold
    if (this.playerMoveCount < BONUS_UNLOCK_MOVES) return;

    // Zero-sum: player gain = bot loss
    this.playerBalance += delta;
    this.botBalance    -= delta;

    this._animateDelta('playerDelta', delta);
    this._animateDelta('botDelta',   -delta);
    this._renderBalances();

    // Sound cues
    if (classification === 'BRILLIANT') sound.brilliant();
    else if (classification === 'BLUNDER' || classification === 'MISTAKE') sound.blunder();
  }

  _animateDelta(elId, delta) {
    const el = document.getElementById(elId);
    el.textContent = (delta > 0 ? '+' : '') + `$${Math.abs(delta)}`;
    el.className   = 'bk-delta ' + (delta > 0 ? 'positive' : 'negative');
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.add('hidden'), 2000);
  }

  _renderBalances() {
    const pEl = document.getElementById('playerBalance');
    const bEl = document.getElementById('botBalance');
    pEl.textContent = `$${this.playerBalance.toLocaleString()}`;
    bEl.textContent = `$${this.botBalance.toLocaleString()}`;
    pEl.className = 'bk-amount' + (this.playerBalance > STARTING_STAKE ? ' gain' : this.playerBalance < STARTING_STAKE ? ' loss' : '');
    bEl.className = 'bk-amount' + (this.botBalance    > STARTING_STAKE ? ' gain' : this.botBalance    < STARTING_STAKE ? ' loss' : '');
    setTimeout(() => { pEl.className = 'bk-amount'; bEl.className = 'bk-amount'; }, 1200);
  }

  _updateUnlockUI() {
    const filled  = Math.min(this.playerMoveCount, BONUS_UNLOCK_MOVES);
    const pips    = document.querySelectorAll('.pip');
    pips.forEach((p, i) => p.classList.toggle('filled', i < filled));
    const countEl = document.getElementById('unlockCount');
    if (this.playerMoveCount >= BONUS_UNLOCK_MOVES) {
      countEl.textContent = '🔓 Bonuses active!';
      countEl.className   = 'unlock-count unlocked';
    } else {
      const left = BONUS_UNLOCK_MOVES - this.playerMoveCount;
      countEl.textContent = `${left} move${left !== 1 ? 's' : ''} left`;
      countEl.className   = 'unlock-count';
    }
  }

  _resetBankrollUI() {
    this.playerBalance   = STARTING_STAKE;
    this.botBalance      = STARTING_STAKE;
    this.playerMoveCount = 0;
    document.getElementById('playerBalance').textContent = `$${STARTING_STAKE.toLocaleString()}`;
    document.getElementById('botBalance').textContent    = `$${STARTING_STAKE.toLocaleString()}`;
    document.getElementById('playerBalance').className   = 'bk-amount';
    document.getElementById('botBalance').className      = 'bk-amount';
    document.getElementById('playerDelta').classList.add('hidden');
    document.getElementById('botDelta').classList.add('hidden');
    this._updateUnlockUI();
  }

  // ── UI BINDING ────────────────────────────────────────────────────────────
  _bindUI() {
    document.getElementById('newGame').addEventListener('click', () => {
      this._resetBankrollUI(); this._startGame();
    });
    document.getElementById('flipBoard').addEventListener('click', () => {
      this.flipped = !this.flipped; this._renderBoard();
    });
    document.getElementById('undoMove').addEventListener('click',    () => this._undoMove());
    document.getElementById('hintBtn').addEventListener('click',     () => this._toggleHint());
    document.getElementById('uploadPgnBtn').addEventListener('click',() => document.getElementById('pgnFileInput').click());
    document.getElementById('pgnFileInput').addEventListener('change', e => this._loadPGN(e));
    document.getElementById('analyzeAllBtn').addEventListener('click', () => this._analyzeAllMoves());
    document.getElementById('exitReviewBtn').addEventListener('click', () => this._exitReview());
    document.getElementById('reviewFirst').addEventListener('click', () => this._reviewGoto(0));
    document.getElementById('reviewPrev').addEventListener('click',  () => this._reviewGoto(this.reviewIdx - 1));
    document.getElementById('reviewNext').addEventListener('click',  () => this._reviewGoto(this.reviewIdx + 1));
    document.getElementById('reviewLast').addEventListener('click',  () => this._reviewGoto(this.reviewFens.length - 1));
    document.getElementById('gameOverNewGame').addEventListener('click', () => {
      document.getElementById('gameOverModal').classList.add('hidden');
      this._resetBankrollUI(); this._startGame();
    });
    // Settings modal
    document.getElementById('settingsBtn').addEventListener('click', () =>
      document.getElementById('settingsModal').classList.remove('hidden'));
    document.getElementById('settingsClose').addEventListener('click', () =>
      document.getElementById('settingsModal').classList.add('hidden'));
    document.getElementById('settingsModal').addEventListener('click', e => {
      if (e.target === document.getElementById('settingsModal'))
        document.getElementById('settingsModal').classList.add('hidden');
    });
  }

  // ── NEW GAME ──────────────────────────────────────────────────────────────
  async _startGame() {
    this._exitReview();
    this.chess       = new Chess();
    this.selectedSq  = null;
    this.lastMove    = null;
    this.moves       = [];
    this.prevEval    = null;
    this.showingHint = false;
    this.botThinking = false;
    this.premove     = null;
    this.premoveFrom = null;
    this.arrows           = [];
    this.squareHighlights = [];
    this.playerColor = document.getElementById('playerColor').value;

    document.getElementById('moveHistory').innerHTML      = '';
    document.getElementById('lastMoveAnalysis').innerHTML = '<div class="analysis-placeholder">Make a move to see analysis</div>';
    document.getElementById('bestMoveBadge').textContent  = '—';
    document.getElementById('gameOverModal').classList.add('hidden');
    document.getElementById('statusText').textContent     = 'Your turn';
    document.getElementById('topPlayerName').textContent    = this.playerColor === 'w' ? 'Bot (Black)' : 'Bot (White)';
    document.getElementById('bottomPlayerName').textContent = this.playerColor === 'w' ? 'You (White)' : 'You (Black)';

    this._renderBoard();
    this._renderArrows();
    sound.start();

    if (this.engineReady) {
      this.prevEval = await engineEval(this.chess.fen(), 1500);
      this._updateBestMovePanel();
    }
    if (this.playerColor === 'b') await this._botMove();
  }

  // ── BOARD RENDERING ───────────────────────────────────────────────────────
  _renderBoard() {
    const el = document.getElementById('board');
    el.innerHTML = '';
    const ranks = this.flipped ? [1,2,3,4,5,6,7,8] : [8,7,6,5,4,3,2,1];
    const files = this.flipped ? ['h','g','f','e','d','c','b','a'] : ['a','b','c','d','e','f','g','h'];

    for (const rank of ranks) {
      for (const file of files) {
        const sq      = file + rank;
        const isLight = (file.charCodeAt(0) - 97 + rank) % 2 === 1;
        const div     = document.createElement('div');
        div.className = 'square ' + (isLight ? 'light' : 'dark');
        div.dataset.sq = sq;

        // Coordinates
        if (this.settings.coords) {
          if (file === (this.flipped ? 'h' : 'a')) {
            const lbl = document.createElement('span');
            lbl.className = 'sq-label-rank'; lbl.textContent = rank; div.appendChild(lbl);
          }
          if (rank === (this.flipped ? 8 : 1)) {
            const lbl = document.createElement('span');
            lbl.className = 'sq-label-file'; lbl.textContent = file; div.appendChild(lbl);
          }
        }

        if (this.lastMove && (sq === this.lastMove.from || sq === this.lastMove.to))
          div.classList.add('last-move');
        if (sq === this.selectedSq) div.classList.add('selected');

        // Legal move dots
        if (this.settings.moveHints && this.selectedSq && !this.botThinking) {
          const hit = this.chess.moves({ square: this.selectedSq, verbose: true }).find(m => m.to === sq);
          if (hit) div.classList.add(this.chess.get(sq) ? 'valid-capture' : 'valid-move');
        }

        // Premove
        if (this.premove) {
          if (sq === this.premove.from) div.classList.add('premove-from');
          if (sq === this.premove.to)   div.classList.add('premove-to');
        }
        if (this.premoveFrom && sq === this.premoveFrom) div.classList.add('premove-from');

        // Hint
        if (this.showingHint && this.prevEval?.bestMove) {
          const bm = this.prevEval.bestMove;
          if (sq === bm.slice(0,2)) div.classList.add('hint-from');
          if (sq === bm.slice(2,4)) div.classList.add('hint-to');
        }

        const piece = this.chess.get(sq);
        if (piece) {
          const span = document.createElement('span');
          span.className   = `piece ${piece.color === 'w' ? 'white' : 'black'}`;
          span.textContent = PIECE_UNICODE[piece.color + piece.type.toUpperCase()];
          div.appendChild(span);
        }

        div.addEventListener('click', () => this._onSquareClick(sq));
        el.appendChild(div);
      }
    }
    this._syncSvgBounds();
  }

  // ── SQUARE CLICK ─────────────────────────────────────────────────────────
  _onSquareClick(sq) {
    if (this.reviewMode) return;

    if (this.arrows.length || this.squareHighlights.length) {
      this.arrows = []; this.squareHighlights = []; this._renderArrows();
    }

    // Bot thinking → handle premove
    if (this.botThinking) {
      if (!this.settings.premove) return;
      const piece = this.chess.get(sq);
      if (this.premoveFrom) {
        if (sq === this.premoveFrom) {
          this.premoveFrom = null; sound.cancel();
        } else {
          this.premove     = { from: this.premoveFrom, to: sq, promotion: 'q' };
          this.premoveFrom = null;
          document.getElementById('statusText').textContent = '⚡ Premove set';
          sound.premove();
        }
        this._renderBoard(); return;
      }
      if (piece && piece.color === this.playerColor) {
        this.premove = null; this.premoveFrom = sq; this._renderBoard();
      } else if (this.premove) {
        this.premove = null; this.premoveFrom = null; sound.cancel(); this._renderBoard();
      }
      return;
    }

    if (this.chess.turn() !== this.playerColor) return;

    if (this.selectedSq) {
      const legalMoves = this.chess.moves({ square: this.selectedSq, verbose: true });
      const move       = legalMoves.find(m => m.to === sq);
      if (move) {
        if (move.flags.includes('p') && !this.settings.autoQueen) {
          this._promptPromotion(this.selectedSq, sq); return;
        }
        this._executeMove(this.selectedSq, sq, move.flags.includes('p') ? 'q' : undefined);
        return;
      }
    }

    const piece = this.chess.get(sq);
    if (piece && piece.color === this.playerColor) {
      this.selectedSq = this.selectedSq === sq ? null : sq;
    } else {
      this.selectedSq = null;
    }
    this._renderBoard();
  }

  _cancelPremove() {
    if (this.premove || this.premoveFrom) {
      this.premove = null; this.premoveFrom = null;
      sound.cancel(); this._renderBoard();
    }
  }

  _tryFirePremove() {
    if (!this.premove) return false;
    const { from, to, promotion } = this.premove;
    this.premove = null; this.premoveFrom = null;
    const legal = this.chess.moves({ square: from, verbose: true }).find(m => m.to === to);
    if (!legal) {
      document.getElementById('statusText').textContent = 'Premove cancelled';
      this._renderBoard(); return false;
    }
    this._executeMove(from, to, promotion);
    return true;
  }

  // ── EXECUTE MOVE ─────────────────────────────────────────────────────────
  async _executeMove(from, to, promotion = 'q') {
    if (this.showingHint) this.showingHint = false;
    const fenBefore  = this.chess.fen();
    const evalBefore = this.prevEval;
    const move = this.chess.move({ from, to, promotion });
    if (!move) return;

    // Sound
    if (move.captured) sound.capture();
    else sound.move();
    if (this.chess.inCheck()) sound.check();

    this.selectedSq = null;
    this.lastMove   = { from, to };
    this.playerMoveCount++;
    this._updateUnlockUI();
    this._renderBoard();

    document.getElementById('statusText').textContent = '⏳ Analyzing…';

    const evalAfter = this.engineReady ? await engineEval(this.chess.fen(), 1500) : null;
    this.prevEval   = evalAfter;
    this._updateBestMovePanel();

    const result = evalBefore && evalAfter
      ? this._classifyMove(evalBefore, evalAfter, move, fenBefore)
      : { key: 'GOOD', cpLoss: 0 };

    this._applyBankrollDelta(result.key);
    this.moves.push({
      san: move.san, uci: from + to, classification: result.key,
      evalBefore: evalBefore?.score, evalAfter: evalAfter?.score, bestMove: evalBefore?.bestMove,
    });

    this._renderAnalysis(move, result, evalBefore, evalAfter);
    this._renderMoveHistory();
    this._checkGameOver();

    if (!this.chess.isGameOver()) {
      document.getElementById('statusText').textContent = '⏳ Bot thinking…';
      await this._botMove();
    }
  }

  // ── BOT MOVE ─────────────────────────────────────────────────────────────
  async _botMove() {
    this.botThinking = true;
    const diff     = document.getElementById('difficulty').value;
    const movetime = { beginner:500, intermediate:1000, advanced:1500, master:2000 }[diff] ?? 1500;
    const elo      = { beginner:800, intermediate:1500, advanced:2200, master:2800 }[diff] ?? 1500;

    const result = this.engineReady ? await engineEval(this.chess.fen(), movetime, elo) : null;
    if (!result?.bestMove) { this.botThinking = false; return; }

    const from  = result.bestMove.slice(0,2);
    const to    = result.bestMove.slice(2,4);
    const promo = result.bestMove[4] || 'q';
    const move  = this.chess.move({ from, to, promotion: promo });
    if (!move) { this.botThinking = false; return; }

    if (move.captured) sound.capture();
    else sound.move();
    if (this.chess.inCheck()) sound.check();

    this.lastMove = { from, to };
    this._renderBoard();

    this.prevEval = this.engineReady ? await engineEval(this.chess.fen(), 1500) : null;
    this._updateBestMovePanel();

    this.moves.push({ san: move.san, uci: from+to, classification: null,
      evalBefore: null, evalAfter: null, bestMove: null });
    this._renderMoveHistory();
    this.botThinking = false;
    this._checkGameOver();

    if (!this.chess.isGameOver()) {
      if (!this._tryFirePremove()) {
        document.getElementById('statusText').textContent = 'Your turn';
      }
    }
  }

  // ── MOVE CLASSIFICATION ───────────────────────────────────────────────────
  _classifyMove(evalBefore, evalAfter, move, fenBefore) {
    const scoreBefore = evalBefore.score;
    const scoreAfter  = -(evalAfter.score);
    const cpLoss      = scoreBefore - scoreAfter;
    const playedUCI   = move.from + move.to;
    const isBestMove  = evalBefore.bestMove && playedUCI === evalBefore.bestMove;

    let key;
    if (isBestMove) {
      const tmp = new Chess(fenBefore); tmp.move(move);
      const isSacrifice = tmp.moves({ verbose:true }).some(m => m.to === move.to);
      key = (isSacrifice && cpLoss <= 0) ? 'BRILLIANT' : 'GREAT';
    } else if (cpLoss <= 10)  { key = 'GOOD'; }
    else if (cpLoss <= 50)    { key = 'GOOD'; }
    else if (cpLoss <= 150)   { key = 'INACCURACY'; }
    else if (cpLoss <= 300)   { key = 'MISTAKE'; }
    else                      { key = 'BLUNDER'; }
    return { key, cpLoss };
  }

  // ── ANALYSIS PANEL ────────────────────────────────────────────────────────
  _renderAnalysis(move, result, evalBefore, evalAfter) {
    const icon    = MOVE_ICONS[result.key] ?? '';
    const evalStr = evalAfter
      ? (evalAfter.score >= 0 ? '+' : '') + (evalAfter.score / 100).toFixed(2) : '?';
    const best = evalBefore?.bestMove ? `Best: ${evalBefore.bestMove}` : '';
    const locked = this.playerMoveCount <= BONUS_UNLOCK_MOVES
      ? `<div class="analysis-eval" style="color:#ffd54f">Bonuses unlock in ${Math.max(0, BONUS_UNLOCK_MOVES - this.playerMoveCount + 1)} more moves</div>`
      : '';
    document.getElementById('lastMoveAnalysis').innerHTML = `
      <span class="move-tag ${result.key}">${result.key}${icon ? ' '+icon : ''}</span>
      <div class="analysis-move">${move.san}</div>
      <div class="analysis-eval">Eval: ${evalStr}</div>
      ${best ? `<div class="analysis-best">${best}</div>` : ''}
      ${locked}
    `;
  }

  // ── MOVE HISTORY ─────────────────────────────────────────────────────────
  _renderMoveHistory() {
    const el = document.getElementById('moveHistory');
    el.innerHTML = '';
    for (let i = 0; i < this.moves.length; i += 2) {
      const row = document.createElement('div');
      row.className = 'move-pair';
      const num = document.createElement('span');
      num.className = 'move-num'; num.textContent = Math.floor(i/2)+1+'.';
      row.appendChild(num);
      for (let j = i; j < Math.min(i+2, this.moves.length); j++) {
        const m    = this.moves[j];
        const icon = MOVE_ICONS[m.classification] ?? '';
        const span = document.createElement('span');
        span.className = `move-san ${m.classification || ''}`;
        span.innerHTML = m.san + (icon ? ` <span class="move-icon">${icon}</span>` : '');
        span.title     = m.classification || '';
        row.appendChild(span);
      }
      el.appendChild(row);
    }
    el.scrollTop = el.scrollHeight;
  }

  // ── BEST MOVE PANEL ───────────────────────────────────────────────────────
  _updateBestMovePanel() {
    if (!this.prevEval?.bestMove) return;
    const uci = this.prevEval.bestMove;
    try {
      const tmp  = new Chess(this.chess.fen());
      const move = tmp.move({ from:uci.slice(0,2), to:uci.slice(2,4), promotion:uci[4]||'q' });
      document.getElementById('bestMoveBadge').textContent = move ? move.san : uci;
    } catch { document.getElementById('bestMoveBadge').textContent = uci; }
  }

  // ── HINT ─────────────────────────────────────────────────────────────────
  _toggleHint() { this.showingHint = !this.showingHint; this._renderBoard(); }

  // ── UNDO ─────────────────────────────────────────────────────────────────
  _undoMove() {
    if (this.reviewMode || this.botThinking || this.moves.length < 2) return;
    this.chess.undo(); this.chess.undo();
    this.moves.splice(-2);
    this.playerMoveCount = Math.max(0, this.playerMoveCount - 1);
    this.lastMove = null; this.selectedSq = null;
    this.showingHint = false; this.prevEval = null;
    this.premove = null; this.premoveFrom = null;
    this._renderBoard(); this._renderMoveHistory(); this._updateUnlockUI();
    document.getElementById('lastMoveAnalysis').innerHTML = '<div class="analysis-placeholder">Make a move to see analysis</div>';
    document.getElementById('statusText').textContent = 'Your turn';
  }

  // ── GAME OVER ─────────────────────────────────────────────────────────────
  _checkGameOver() {
    if (!this.chess.isGameOver()) return;
    let title, sub;
    const playerWon = this.chess.isCheckmate() && this.chess.turn() !== this.playerColor;
    const botWon    = this.chess.isCheckmate() && this.chess.turn() === this.playerColor;

    if (this.chess.isCheckmate()) {
      title = playerWon ? '🏆 You Won!' : '💀 You Lost';
      sub   = playerWon ? 'Checkmate! Congratulations.' : 'Checkmate. Better luck next time!';
    } else if (this.chess.isDraw()) {
      title = '½–½ Draw'; sub = 'The game is a draw.';
    } else {
      title = 'Game Over'; sub = '';
    }

    // Apply jackpot
    if (playerWon) { this.playerBalance += JACKPOT; this.botBalance -= JACKPOT; sound.win(); }
    else if (botWon) { this.botBalance += JACKPOT; this.playerBalance -= JACKPOT; sound.lose(); }
    else { sound.lose(); }

    this._renderBalances();

    const pNet = this.playerBalance - STARTING_STAKE;
    const bNet = this.botBalance    - STARTING_STAKE;

    document.getElementById('gameOverTitle').textContent   = title;
    document.getElementById('gameOverSub').textContent     = sub;
    document.getElementById('gameOverBalance').textContent =
      `Your balance: $${this.playerBalance.toLocaleString()}`;
    document.getElementById('gameOverEarnings').textContent =
      `Net earnings: ${pNet >= 0 ? '+' : ''}$${pNet.toLocaleString()} · Bot: ${bNet >= 0 ? '+' : ''}$${bNet.toLocaleString()}`;
    document.getElementById('gameOverModal').classList.remove('hidden');
    document.getElementById('statusText').textContent = 'Game over';
  }

  // ── PROMOTION ─────────────────────────────────────────────────────────────
  _promptPromotion(from, to) {
    const modal  = document.getElementById('promotionModal');
    const pieces = document.getElementById('promoPieces');
    pieces.innerHTML = '';
    ['q','r','b','n'].forEach(type => {
      const span = document.createElement('span');
      span.className   = 'promo-piece';
      span.textContent = PIECE_UNICODE[this.playerColor + type.toUpperCase()];
      span.addEventListener('click', () => { modal.classList.add('hidden'); this._executeMove(from, to, type); });
      pieces.appendChild(span);
    });
    modal.classList.remove('hidden');
  }

  // ── PGN UPLOAD ────────────────────────────────────────────────────────────
  _loadPGN(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const tmp = new Chess();
      try { tmp.loadPgn(ev.target.result); } catch { alert('Invalid PGN file.'); return; }
      this.reviewFens  = [tmp.initialFen ?? new Chess().fen()];
      const hist       = tmp.history({ verbose: true });
      const walker     = new Chess(tmp.initialFen ?? undefined);
      hist.forEach(m => { walker.move(m); this.reviewFens.push(walker.fen()); });
      this.reviewMoves = hist.map(m => m.san);
      this.reviewIdx   = 0; this.reviewMode = true;
      document.getElementById('reviewBar').classList.remove('hidden');
      this._reviewGoto(0);
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  _reviewGoto(idx) {
    idx = Math.max(0, Math.min(this.reviewFens.length - 1, idx));
    this.reviewIdx = idx;
    this.chess     = new Chess(this.reviewFens[idx]);
    this.lastMove  = idx > 0 && this.reviewMoves[idx-1]
      ? (() => { const tmp = new Chess(this.reviewFens[idx-1]); const m = tmp.move(this.reviewMoves[idx-1], {sloppy:true}); return m ? {from:m.from,to:m.to} : null; })()
      : null;
    document.getElementById('reviewCounter').textContent = `${idx} / ${this.reviewFens.length - 1}`;
    this._renderBoard();
  }

  _analyzeAllMoves() { alert('Sequential analysis will run — this may take a minute for long games.'); }
  _exitReview() {
    this.reviewMode = false; this.reviewFens = []; this.reviewIdx = 0;
    document.getElementById('reviewBar').classList.add('hidden');
  }

  // ── ARROWS ───────────────────────────────────────────────────────────────
  _initArrows() {
    const wrap = document.querySelector('.board-wrap');
    const svg  = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.id = 'arrowOverlay';
    Object.assign(svg.style, { position:'absolute', top:'0', left:'0', pointerEvents:'none', zIndex:'50', overflow:'visible' });
    wrap.appendChild(svg);
    this._arrowSvg = svg;

    const boardEl = document.getElementById('board');

    boardEl.addEventListener('mousedown', e => {
      if (e.button !== 2) return;
      e.preventDefault();
      this._arrowStartSq = this._pixelToSquare(e, boardEl); this._arrowPreviewSq = null;
    });
    boardEl.addEventListener('mousemove', e => {
      if (!this._arrowStartSq) return;
      const sq = this._pixelToSquare(e, boardEl);
      if (sq !== this._arrowPreviewSq) { this._arrowPreviewSq = sq; this._renderArrows(); }
    });
    boardEl.addEventListener('mouseup', e => {
      if (e.button !== 2 || !this._arrowStartSq) return;
      e.preventDefault();
      const sq    = this._pixelToSquare(e, boardEl);
      const color = e.shiftKey ? 'blue' : e.ctrlKey ? 'red' : e.altKey ? 'orange' : 'green';
      if (sq && sq !== this._arrowStartSq) {
        const idx = this.arrows.findIndex(a => a.from === this._arrowStartSq && a.to === sq && a.color === color);
        if (idx >= 0) this.arrows.splice(idx, 1);
        else          this.arrows.push({ from: this._arrowStartSq, to: sq, color });
      } else if (sq === this._arrowStartSq) {
        const idx = this.squareHighlights.findIndex(h => h.sq === sq);
        if (idx >= 0) this.squareHighlights.splice(idx, 1);
        else          this.squareHighlights.push({ sq, color });
      }
      this._arrowStartSq = null; this._arrowPreviewSq = null; this._renderArrows();
    });
    boardEl.addEventListener('contextmenu', e => { e.preventDefault(); this._cancelPremove(); });
    boardEl.addEventListener('click', () => {
      if (this.arrows.length || this.squareHighlights.length) {
        this.arrows = []; this.squareHighlights = []; this._renderArrows();
      }
    });
    window.addEventListener('resize', () => this._syncSvgBounds());
  }

  _syncSvgBounds() {
    const svg = this._arrowSvg, boardEl = document.getElementById('board');
    if (!svg || !boardEl) return;
    const bRect = boardEl.getBoundingClientRect(), wRect = svg.parentElement.getBoundingClientRect();
    svg.style.left   = (bRect.left - wRect.left) + 'px';
    svg.style.top    = (bRect.top  - wRect.top)  + 'px';
    svg.style.width  = bRect.width  + 'px';
    svg.style.height = bRect.height + 'px';
  }

  _pixelToSquare(e, boardEl) {
    const rect = boardEl.getBoundingClientRect();
    const col  = Math.floor((e.clientX - rect.left)  / (rect.width  / 8));
    const row  = Math.floor((e.clientY - rect.top)   / (rect.height / 8));
    if (col < 0 || col > 7 || row < 0 || row > 7) return null;
    const files = this.flipped ? ['h','g','f','e','d','c','b','a'] : ['a','b','c','d','e','f','g','h'];
    const ranks = this.flipped ? [1,2,3,4,5,6,7,8] : [8,7,6,5,4,3,2,1];
    return files[col] + ranks[row];
  }

  _renderArrows() {
    const svg = this._arrowSvg; if (!svg) return;
    this._syncSvgBounds();
    const w = parseFloat(svg.style.width) || svg.clientWidth;
    const h = parseFloat(svg.style.height) || svg.clientHeight;
    if (!w || !h) return;
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    const sqW = w/8, sqH = h/8;
    for (const { sq, color } of this.squareHighlights) {
      const { col, row } = this._sqToColRow(sq);
      const COLORS = { green:'#15781b', blue:'#2255cc', red:'#aa2222', orange:'#cc8800' };
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', col*sqW); rect.setAttribute('y', row*sqH);
      rect.setAttribute('width', sqW); rect.setAttribute('height', sqH);
      rect.setAttribute('fill', COLORS[color]??COLORS.green); rect.setAttribute('opacity','0.4');
      svg.appendChild(rect);
    }
    const allArrows = [...this.arrows];
    if (this._arrowStartSq && this._arrowPreviewSq && this._arrowStartSq !== this._arrowPreviewSq)
      allArrows.push({ from:this._arrowStartSq, to:this._arrowPreviewSq, color:'green', preview:true });
    for (const { from, to, color, preview } of allArrows) this._drawArrow(from, to, color, sqW, sqH, preview);
  }

  _sqToColRow(sq) {
    const files = this.flipped ? ['h','g','f','e','d','c','b','a'] : ['a','b','c','d','e','f','g','h'];
    const ranks = this.flipped ? [1,2,3,4,5,6,7,8] : [8,7,6,5,4,3,2,1];
    return { col: files.indexOf(sq[0]), row: ranks.indexOf(parseInt(sq[1])) };
  }

  _drawArrow(from, to, color, sqW, sqH, preview=false) {
    const COLORS = { green:'#15781b', blue:'#2255cc', red:'#aa2222', orange:'#cc8800' };
    const fill = COLORS[color]??COLORS.green;
    const { col:fc, row:fr } = this._sqToColRow(from);
    const { col:tc, row:tr } = this._sqToColRow(to);
    const sx=(fc+.5)*sqW, sy=(fr+.5)*sqH, ex=(tc+.5)*sqW, ey=(tr+.5)*sqH;
    const dx=ex-sx, dy=ey-sy, len=Math.sqrt(dx*dx+dy*dy);
    if (len<1) return;
    const ux=dx/len, uy=dy/len, px=-uy, py=ux;
    const shaft=sqW*.13, head=sqW*.28, headLen=sqW*.4, s0=sqW*.28, e0=sqW*.22;
    const bx=ex-ux*e0, by=ey-uy*e0, sxA=sx+ux*s0, syA=sy+uy*s0;
    const hb={x:bx-ux*headLen, y:by-uy*headLen};
    const pts=[
      [sxA+px*shaft, syA+py*shaft],[hb.x+px*shaft, hb.y+py*shaft],
      [hb.x+px*head, hb.y+py*head],[bx, by],
      [hb.x-px*head, hb.y-py*head],[hb.x-px*shaft, hb.y-py*shaft],
      [sxA-px*shaft, syA-py*shaft],
    ].map(([x,y])=>`${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
    const poly=document.createElementNS('http://www.w3.org/2000/svg','polygon');
    poly.setAttribute('points',pts); poly.setAttribute('fill',fill);
    poly.setAttribute('opacity',preview?'0.5':'0.82');
    this._arrowSvg.appendChild(poly);
  }
}

// ── BOOT ─────────────────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => { window.game = new ChessGame(); });
