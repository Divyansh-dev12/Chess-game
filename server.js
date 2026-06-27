const express  = require('express');
const path     = require('path');
const initEngine = require('./node_modules/stockfish');
const app      = express();
const PORT     = 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use('/lib/chess.js', express.static(path.join(__dirname, 'node_modules/chess.js/dist/esm/chess.js')));
app.use(express.json());

// ── Stockfish server-side engine ─────────────────────────────────────────────
let engine = null;
let engineBusy = false;
const evalQueue = [];

function flushQueue() {
  if (engineBusy || !evalQueue.length || !engine) return;
  const { fen, movetime, elo, res } = evalQueue.shift();
  engineBusy = true;

  let score       = 0;
  let partialBest = null;

  engine.listener = (msg) => {
    if (typeof msg !== 'string') return;
    const sm = msg.match(/score (cp|mate) (-?\d+)/);
    if (sm) {
      score = sm[1] === 'mate'
        ? (parseInt(sm[2], 10) > 0 ? 30000 : -30000)
        : parseInt(sm[2], 10);
    }
    const bm = msg.match(/\bpv ([a-h][1-8][a-h][1-8][qrbn]?)/);
    if (bm) partialBest = bm[1];

    if (msg.startsWith('bestmove')) {
      const m = msg.match(/bestmove ([a-h][1-8][a-h][1-8][qrbn]?)/);
      const bestMove = m ? m[1] : partialBest;
      engineBusy = false;
      res.json({ score, bestMove });
      flushQueue();
    }
  };

  if (elo) {
    engine.sendCommand('setoption name UCI_LimitStrength value true');
    engine.sendCommand(`setoption name UCI_Elo value ${elo}`);
  } else {
    engine.sendCommand('setoption name UCI_LimitStrength value false');
  }
  engine.sendCommand(`position fen ${fen}`);
  engine.sendCommand(`go movetime ${movetime}`);
}

initEngine('lite-single').then(eng => {
  engine = eng;
  console.log('♟  Stockfish engine ready');
  flushQueue();
}).catch(err => {
  console.error('Stockfish init failed:', err);
});

app.get('/api/eval', (req, res) => {
  const fen      = req.query.fen;
  const movetime = parseInt(req.query.movetime, 10) || 1500;
  const elo      = parseInt(req.query.elo, 10) || 0;  // 0 = no ELO limit
  if (!fen) return res.status(400).json({ error: 'fen required' });
  evalQueue.push({ fen, movetime, elo: elo || null, res });
  flushQueue();
});

app.listen(PORT, () => console.log(`\n♟  Chess Analyzer running at http://localhost:${PORT}\n`));
