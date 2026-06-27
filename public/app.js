import { Chess } from '/lib/chess.js';

// ── PIECES ────────────────────────────────────────────────────────────────
const UNI = {
  wK:'♔',wQ:'♕',wR:'♖',wB:'♗',wN:'♘',wP:'♙',
  bK:'♚',bQ:'♛',bR:'♜',bB:'♝',bN:'♞',bP:'♟'
};
const PIECE_VALS = { p:1,n:3,b:3,r:5,q:9,k:0 };

// ── BOTS ──────────────────────────────────────────────────────────────────
const BOTS = [
  { id:'rookie',   name:'Rookie',          emoji:'🐣', tagline:'Perfect for beginners',      elo:[400,700,900],    blunder:[0.55,0.38,0.20], famous:false },
  { id:'club',     name:'Club Player',     emoji:'♟',  tagline:'Weekend tournament player',  elo:[900,1300,1600],  blunder:[0.20,0.10,0.04], famous:false },
  { id:'expert',   name:'Expert',          emoji:'🎓', tagline:'Advanced tactical player',   elo:[1600,1900,2100], blunder:[0.04,0.01,0],    famous:false },
  { id:'bobby',    name:'Bobby Fischer',   emoji:'🎭', tagline:'"Chess is life"',             elo:[2400,2650,2785], blunder:[0,0,0],          famous:true  },
  { id:'kasparov', name:'Garry Kasparov',  emoji:'🔥', tagline:'The chess machine',          elo:[2500,2700,2851], blunder:[0,0,0],          famous:true  },
  { id:'hikaru',   name:'Hikaru Nakamura', emoji:'⚡', tagline:'Speed chess king',           elo:[2500,2720,2816], blunder:[0,0,0],          famous:true  },
  { id:'magnus',   name:'Magnus Carlsen',  emoji:'👑', tagline:'Highest rated ever',         elo:[2600,2780,2882], blunder:[0,0,0],          famous:true  },
];

// ── TIME CONTROLS ─────────────────────────────────────────────────────────
const TIME_CONTROLS = [
  { cat:'Ultra-Bullet', label:'½|0',   seconds:30,   increment:0 },
  { cat:'Bullet',       label:'1|0',   seconds:60,   increment:0 },
  { cat:'Bullet',       label:'1|1',   seconds:60,   increment:1 },
  { cat:'Bullet',       label:'2|1',   seconds:120,  increment:1 },
  { cat:'Blitz',        label:'3|0',   seconds:180,  increment:0 },
  { cat:'Blitz',        label:'3|2',   seconds:180,  increment:2 },
  { cat:'Blitz',        label:'5|0',   seconds:300,  increment:0 },
  { cat:'Blitz',        label:'5|3',   seconds:300,  increment:3 },
  { cat:'Rapid',        label:'10|0',  seconds:600,  increment:0 },
  { cat:'Rapid',        label:'10|5',  seconds:600,  increment:5 },
  { cat:'Rapid',        label:'15|10', seconds:900,  increment:10 },
  { cat:'Classical',    label:'30|0',  seconds:1800, increment:0 },
];

// ── OPENINGS ──────────────────────────────────────────────────────────────
const OPENINGS = [
  { eco:'C60', name:'Ruy Lopez',          moves:'e4 e5 Nf3 Nc6 Bb5',        emoji:'🏰', desc:'One of the oldest and most respected openings. White attacks the knight defending e5 and aims for long-term pressure.', ideas:['Pressure the e5 pawn indirectly','Castle kingside early','Expand with d4 in the middlegame'], counters:['Morphy Defense (a6)','Berlin Defense (Nf6)','Schliemann (f5)'] },
  { eco:'C50', name:'Italian Game',       moves:'e4 e5 Nf3 Nc6 Bc4',        emoji:'🍕', desc:'White targets f7 immediately with the bishop. Leads to open, tactical games. The Giuoco Piano and Evans Gambit are variations.', ideas:['Control center with pawns','Target f7 weakness','Develop quickly and attack'], counters:['Two Knights Defense','Giuoco Piano (Bc5)','Hungarian Defense (Be7)'] },
  { eco:'B20', name:'Sicilian Defense',   moves:'e4 c5',                     emoji:'♟', desc:'The most popular defense to e4. Black fights for the center asymmetrically, leading to rich and complex positions.', ideas:['Counter-attack in the center','Create queenside play','Unbalance the position'], counters:['Open Sicilian (Nf3+d4)','Grand Prix Attack','Alapin (c3)'] },
  { eco:'C00', name:'French Defense',     moves:'e4 e6',                     emoji:'🇫🇷', desc:'Black prepares d5 to contest the center. Creates solid but slightly cramped positions. White often gains space.', ideas:['Play d5 to challenge e4','Create counterplay on queenside','Target e4 with pieces'], counters:['Advance Variation (e5)','Exchange Variation','Tarrasch Variation (d4 d5 Nd2)'] },
  { eco:'B10', name:'Caro-Kann Defense',  moves:'e4 c6',                     emoji:'🛡', desc:'Solid defense where Black prepares d5 with c6 support. Less space but fewer weaknesses than French.', ideas:['Play d5 with c6 support','Develop the c8-bishop outside the pawn chain','Solid and positional'], counters:['Advance Variation','Classical (Nc3)','Panov Attack (c4)'] },
  { eco:'D06', name:"Queen's Gambit",     moves:'d4 d5 c4',                  emoji:'♛', desc:"White offers a pawn to gain central control. One of the most classical openings. Black can accept (QGA) or decline (QGD).", ideas:['Gain central control','Develop queenside pieces','Create minority attack on queenside'], counters:['QGD (e6)','QGA (dxc4)','Slav Defense (c6)'] },
  { eco:'E60', name:"King's Indian Defense", moves:'d4 Nf6 c4 g6',           emoji:'⚔', desc:"Black allows White to build a big center then counterattacks it. Beloved by Fischer and Kasparov. Razor-sharp positions.", ideas:['Allow White center to overextend','Counterattack with e5 or c5','Create kingside attack'], counters:["Classical Variation (Nc3 Bg2)",'Sämisch Variation (f3)','Averbakh System'] },
  { eco:'E20', name:'Nimzo-Indian Defense', moves:'d4 Nf6 c4 e6 Nc3 Bb4',   emoji:'🔮', desc:"Black pins the knight and disrupts White's center plans. Named after Aron Nimzowitsch. Highly flexible and powerful.", ideas:['Pin c3 knight to weaken pawns','Control e4 square','Create doubled c-pawns for White'], counters:['Classical (Qc2)','Rubinstein (e3)','Sämisch (a3)'] },
  { eco:'E00', name:'Catalan Opening',    moves:'d4 Nf6 c4 e6 g3',          emoji:'🗺', desc:"White fianchettoes the bishop to put long-term pressure on d5 and c6. Strategic and subtle.", ideas:['Pressure d5 with fianchettoed bishop','Build solid pawn structure','Open the c-file for pressure'], counters:['Open Catalan (dxc4)','Closed Catalan (d5)'] },
  { eco:'A10', name:'English Opening',    moves:'c4',                         emoji:'🏴󠁧󠁢󠁥󠁮󠁧󠁿', desc:"White controls d5 without advancing e4 first. Very flexible — can transpose to many structures. Championed by Botvinnik.", ideas:['Control d5 from a distance','Build flexible pawn structure','Avoid forcing variations early'], counters:['Symmetrical English (c5)','Reversed Sicilian (e5)'] },
  { eco:'D00', name:'London System',      moves:'d4 d5 Bf4',                 emoji:'🔒', desc:"A solid setup for White requiring little memorization. White builds a strong pawn structure and develops consistently.", ideas:['Solid pyramid structure','Develop bishop before c3','Avoid early pawn weaknesses'], counters:['Set up ...e6 and ...Bd6','Play ...c5 to challenge center'] },
  { eco:'C30', name:"King's Gambit",      moves:'e4 e5 f4',                  emoji:'🗡', desc:"One of the oldest gambits. White sacrifices a pawn for rapid development and kingside attack. Highly tactical.", ideas:['Rapid development after pawn grab','Control e5 and attack f7','Create open f-file for rook'], counters:["King's Gambit Accepted (exf4)",'Falkbeer Counter-Gambit (d5)'] },
  { eco:'C44', name:'Scotch Game',        moves:'e4 e5 Nf3 Nc6 d4',         emoji:'🥃', desc:"White immediately opens the center. Kasparov revived this opening at the top level. Leads to direct, energetic play.", ideas:['Open center immediately','Create passed d-pawn potential','Attack with c3 and Nxd4'], counters:['Scotch Gambit (Bc5)','Mieses Variation (Qh4)','Schmidt Variation (Nf6)'] },
  { eco:'C46', name:'Vienna Game',        moves:'e4 e5 Nc3',                 emoji:'🎻', desc:"A solid and aggressive alternative to 2.Nf3. White delays moving the king knight to keep options open.", ideas:['Control d5 with knight','Set up Bc4 + Qh5 attack','Flexible center control'], counters:['Vienna Gambit (f4)','Falkbeer (Nf6)'] },
  { eco:'C42', name:"Petrov's Defense",   moves:'e4 e5 Nf3 Nf6',            emoji:'🏛', desc:"A rock-solid defense where Black mirrors White's development. Leads to balanced endgames. Highly respected.", ideas:['Symmetry leads to equality','Avoid tactical complications','Solid defense without weaknesses'], counters:['Stafford Gambit','Three Knights (Nc3)'] },
  { eco:'A80', name:'Dutch Defense',      moves:'d4 f5',                     emoji:'🌷', desc:"Black immediately seizes e4 with the f-pawn. Aggressive and double-edged. Creates attacking kingside chances.", ideas:['Control e4 immediately','Create kingside attack','Dynamic imbalanced play'], counters:['Leningrad Dutch (g6)','Stonewall Dutch (e6+d5+c6)'] },
];

// ── MOVE CLASSIFICATION (Lichess/chess.com standard) ──────────────────────
const MOVE_TAGS = {
  BRILLIANT:  { label:'!! Brilliant',  icon:'!!', color:'#29b6f6' },
  GREAT:      { label:'! Great',       icon:'!',  color:'#66bb6a' },
  BEST:       { label:'Best',          icon:'★',  color:'#a5d6a7' },
  EXCELLENT:  { label:'Excellent',     icon:'✓',  color:'#c8e6c9' },
  GOOD:       { label:'Good',          icon:'',   color:'#c9c9c9' },
  INACCURACY: { label:'?! Inaccuracy', icon:'?!', color:'#ffd54f' },
  MISTAKE:    { label:'? Mistake',     icon:'?',  color:'#ff8a65' },
  BLUNDER:    { label:'?? Blunder',    icon:'??', color:'#ef5350' },
};

const MOVE_DELTA = {
  BRILLIANT:+200, GREAT:+100, BEST:+40, EXCELLENT:+20, GOOD:+10,
  INACCURACY:-30, MISTAKE:-60, BLUNDER:-80
};

// Standard thresholds (centipawns)
const CP_THRESHOLDS = { EXCELLENT:10, GOOD:30, INACCURACY:100, MISTAKE:300 };

const THEMES = {
  classic:{ light:'#f0d9b5', dark:'#b58863' },
  green:  { light:'#ffffdd', dark:'#86a666' },
  blue:   { light:'#dee3e6', dark:'#8ca2ad' },
  marble: { light:'#f5f0e8', dark:'#6b6b6b' },
};

const BONUS_MOVES   = 5;
const SETTINGS_KEY  = 'chessSettings5';
const HISTORY_KEY   = 'chessHistory';
const WALLET_KEY    = 'chessWallet';
const PROFILE_KEY   = 'chessProfile';
const METHODS_KEY   = 'chessPayMethods';

// ── SOUND SYSTEM (realistic wood piece synthesis) ─────────────────────────
class SoundSystem {
  constructor() { this.ctx=null; this.vol=0.7; this.on=true; }

  _ctx() {
    if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    return this.ctx;
  }

  // White noise burst filtered through bandpass — sounds like wood on wood
  _thud(freq=450, dur=0.10, amp=0.55, offset=0) {
    if (!this.on) return;
    const ctx = this._ctx();
    const now = ctx.currentTime + offset;
    const len = Math.ceil(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d   = buf.getChannelData(0);
    for (let i=0; i<len; i++) {
      d[i] = (Math.random()*2-1) * Math.exp(-i/(ctx.sampleRate*0.018)) * amp * this.vol;
    }
    const src = ctx.createBufferSource(); src.buffer = buf;
    const bpf = ctx.createBiquadFilter(); bpf.type='bandpass'; bpf.frequency.value=freq; bpf.Q.value=2.5;
    // Resonance body
    const lp  = ctx.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=freq*1.8;
    const g   = ctx.createGain(); g.gain.setValueAtTime(1,now); g.gain.exponentialRampToValueAtTime(0.001,now+dur);
    src.connect(bpf); bpf.connect(lp); lp.connect(g); g.connect(ctx.destination);
    src.start(now);
  }

  // Soft sine ding
  _ding(freq=880, dur=0.5, amp=0.25, offset=0) {
    if (!this.on) return;
    const ctx=this._ctx(); const now=ctx.currentTime+offset;
    const o=ctx.createOscillator(); const g=ctx.createGain();
    o.type='sine'; o.frequency.value=freq;
    g.gain.setValueAtTime(amp*this.vol,now);
    g.gain.exponentialRampToValueAtTime(0.001,now+dur);
    o.connect(g); g.connect(ctx.destination);
    o.start(now); o.stop(now+dur);
  }

  move()    { this._thud(480,0.09,0.55); }
  capture() { this._thud(350,0.14,0.75); this._thud(600,0.07,0.35,0.05); }
  check()   { this._thud(480,0.09,0.55); this._ding(1100,0.25,0.25,0.06); }
  castle()  { this._thud(480,0.09,0.5); this._thud(500,0.09,0.45,0.16); }
  promote() { this._thud(480,0.09,0.55); this._ding(660,0.4,0.3,0.08); this._ding(880,0.3,0.2,0.25); }
  premove() { this._ding(600,0.08,0.18); }
  gain()    { this._ding(528,0.35,0.28); this._ding(660,0.28,0.22,0.15); }
  loss()    { this._ding(330,0.4,0.28); this._ding(260,0.35,0.22,0.2); }
  tick()    { this._ding(800,0.04,0.12); }
  gameEnd() { [0,0.18,0.36,0.54].forEach((t,i)=>this._ding(261+i*110,0.45,0.28,t)); }
}

// ── ENGINE ────────────────────────────────────────────────────────────────
async function engineEval(fen, movetime=1500, elo=0) {
  const p = new URLSearchParams({fen,movetime,elo});
  const r = await fetch(`/api/eval?${p}`);
  return r.json();
}

// ── MAIN CLASS ────────────────────────────────────────────────────────────
class ChessGame {
  constructor() {
    this.chess        = new Chess();
    this.sound        = new SoundSystem();
    this.flipped      = false;
    this.selected     = null;
    this.premove      = null;
    this.botThinking  = false;
    this.gameActive   = false;
    this.analysisMode = false;
    this.reviewMode   = false;
    this.reviewIdx    = 0;
    this.reviewStates = [];
    this.reviewEntries= [];
    this.arrows       = {};
    this.rDragFrom    = null;
    this.hintSquares  = [];
    this.lastMove     = null;
    this.moveHistory  = [];   // [{san,uci,color,classKey,cpLoss,evalBefore,evalAfter}]
    this.liveStates   = [];   // FENs during current game for review
    this.prevEval     = 0;
    this.bestMoveUci  = null;
    this.matchConfig  = null;
    this.playerWallet = this._loadWallet();
    this.playerPool   = 0;
    this.botPool      = 0;
    this.moveCount    = 0;
    this.transactions = [];
    this.playerTime   = 0;
    this.botTime      = 0;
    this.clockTick    = null;
    this.activeColor  = 'w';
    this.paymentMethods = JSON.parse(localStorage.getItem(METHODS_KEY)||'[]');

    this.settings = { theme:'classic', sound:true, volume:70, premove:true, autoQueen:true, coords:true, moveHints:true };
    this.profile  = this._loadProfile();

    this._loadSettings();
    this._bindUI();
    this._renderMatchModal();
    this._updateWalletDisplay();
    this._updateProfileHeader();
  }

  // ── SETTINGS ─────────────────────────────────────────────────────────
  _loadSettings() {
    try { const s=JSON.parse(localStorage.getItem(SETTINGS_KEY)); if(s) Object.assign(this.settings,s); } catch {}
    this._applyTheme(this.settings.theme);
    const s=this.settings;
    document.getElementById('settingSound').checked     = s.sound;
    document.getElementById('settingVolume').value      = s.volume;
    document.getElementById('settingPremove').checked   = s.premove;
    document.getElementById('settingAutoQueen').checked = s.autoQueen;
    document.getElementById('settingCoords').checked    = s.coords;
    document.getElementById('settingMoveHints').checked = s.moveHints;
    document.querySelectorAll('.theme-btn').forEach(b=>b.classList.toggle('active',b.dataset.theme===s.theme));
    this.sound.on  = s.sound;
    this.sound.vol = s.volume/100;
  }
  _saveSettings() { localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings)); }
  _applyTheme(t) {
    const th=THEMES[t]||THEMES.classic;
    document.documentElement.style.setProperty('--light-sq',th.light);
    document.documentElement.style.setProperty('--dark-sq', th.dark);
  }

  // ── PROFILE ───────────────────────────────────────────────────────────
  _loadProfile() {
    try {
      return JSON.parse(localStorage.getItem(PROFILE_KEY)) || this._defaultProfile();
    } catch { return this._defaultProfile(); }
  }
  _defaultProfile() { return { name:'Player', avatar:'👤', estimatedElo:1200, gamesPlayed:0, wins:0, losses:0, draws:0 }; }
  _saveProfile()    { localStorage.setItem(PROFILE_KEY, JSON.stringify(this.profile)); }

  _updateProfileHeader() {
    document.getElementById('profileName').textContent = this.profile.name;
  }

  _updateEloAfterGame(result, botElo) {
    const K = 32;
    const expected = 1 / (1 + Math.pow(10, (botElo - this.profile.estimatedElo) / 400));
    this.profile.estimatedElo = Math.round(Math.max(100, Math.min(3200, this.profile.estimatedElo + K * (result - expected))));
    this.profile.gamesPlayed++;
    if (result === 1)   this.profile.wins++;
    else if (result === 0) this.profile.losses++;
    else               this.profile.draws++;
    this._saveProfile();
    this._updateProfileHeader();
  }

  _checkFairMatch(botElo) {
    if (this.profile.gamesPlayed < 5) return null;
    const diff = this.profile.estimatedElo - botElo;
    if (diff > 350) return `⚠ Your estimated ELO (${this.profile.estimatedElo}) is significantly higher than this bot (ELO ${botElo}). This won't be a fair match — consider a stronger opponent.`;
    if (diff < -500) return `ℹ This bot (ELO ${botElo}) is much stronger than you (estimated ${this.profile.estimatedElo}). Expect a very tough game!`;
    return null;
  }

  _openProfile() {
    const p = this.profile;
    document.getElementById('profileNameInput').value = p.name;
    document.getElementById('profileAvatarBig').textContent = p.avatar;

    // Avatar grid
    const avatars = ['👤','🎯','♟','♛','🎭','🔥','⚡','🧠','🦁','🐉','🎪','🌙','⭐','🏆','🎮','🦊','🎩','🌊','🎸','🦅'];
    const grid = document.getElementById('avatarGrid');
    grid.innerHTML = '';
    avatars.forEach(em => {
      const span = document.createElement('span');
      span.className = 'avatar-option' + (em === p.avatar ? ' active' : '');
      span.textContent = em;
      span.addEventListener('click', () => {
        document.querySelectorAll('.avatar-option').forEach(x=>x.classList.remove('active'));
        span.classList.add('active');
        document.getElementById('profileAvatarBig').textContent = em;
      });
      grid.appendChild(span);
    });

    // Stats
    document.getElementById('profileStatsGrid').innerHTML = `
      <div class="profile-stat"><div class="profile-stat-val">${p.gamesPlayed}</div><div class="profile-stat-lbl">Games</div></div>
      <div class="profile-stat"><div class="profile-stat-val" style="color:#66bb6a">${p.wins}</div><div class="profile-stat-lbl">Wins</div></div>
      <div class="profile-stat"><div class="profile-stat-val" style="color:#ef5350">${p.losses}</div><div class="profile-stat-lbl">Losses</div></div>
    `;

    const eloBox = document.getElementById('eloEstimateBox');
    if (p.gamesPlayed >= 5) {
      eloBox.innerHTML = `<div class="elo-val">${p.estimatedElo}</div><div class="elo-lbl">Estimated ELO (${p.gamesPlayed} games)</div>`;
    } else {
      eloBox.innerHTML = `<div class="elo-lbl" style="padding:8px">Play ${5-p.gamesPlayed} more game${p.gamesPlayed===4?'':'s'} to get your ELO estimate</div>`;
    }

    document.getElementById('profileModal').classList.remove('hidden');
  }

  // ── WALLET ────────────────────────────────────────────────────────────
  _loadWallet()  { return parseInt(localStorage.getItem(WALLET_KEY))||5000; }
  _saveWallet()  { localStorage.setItem(WALLET_KEY, this.playerWallet); }
  _updateWalletDisplay() {
    document.getElementById('walletBig').textContent     = '$'+this.playerWallet.toLocaleString();
    document.getElementById('walletPreview').textContent = '$'+this.playerWallet.toLocaleString();
  }

  _openWallet() {
    document.getElementById('walletBig').textContent = '$'+this.playerWallet.toLocaleString();
    const list = document.getElementById('walletTxList');
    if (!this.transactions.length) {
      list.innerHTML = '<div class="wallet-tx"><span style="color:#7d7d7d;font-size:.8rem;padding:8px">No transactions this match</span></div>';
    } else {
      list.innerHTML = this.transactions.slice(0,25).map(tx=>`
        <div class="wallet-tx">
          <span class="wallet-tx-move">${tx.moveSan||'—'}</span>
          <span class="wallet-tx-label">${tx.label||''}</span>
          <span class="wallet-tx-amount ${tx.delta>=0?'pos':'neg'}">${tx.delta>=0?'+':''}$${tx.delta}</span>
        </div>`).join('');
    }
    this._renderPaymentMethods();
    document.getElementById('walletModal').classList.remove('hidden');
  }

  _renderPaymentMethods() {
    const list = document.getElementById('paymentMethodsList');
    if (!this.paymentMethods.length) {
      list.innerHTML = '<div class="no-methods">No payment methods added yet</div>';
    } else {
      list.innerHTML = this.paymentMethods.map((m,i)=>`
        <div class="saved-method">
          <span>${m.type==='card'?'💳':m.type==='upi'?'📱':'🏦'}</span>
          <span style="flex:1">${m.label}</span>
          <button class="btn" style="padding:3px 8px;font-size:.72rem" data-midx="${i}">✕</button>
        </div>`).join('');
      list.querySelectorAll('[data-midx]').forEach(b=>{
        b.addEventListener('click',()=>{
          this.paymentMethods.splice(parseInt(b.dataset.midx),1);
          localStorage.setItem(METHODS_KEY, JSON.stringify(this.paymentMethods));
          this._renderPaymentMethods();
        });
      });
    }
  }

  // ── MATCH MODAL ───────────────────────────────────────────────────────
  _renderMatchModal() {
    // Bot tabs
    let currentTab = 'casual';
    const renderBotGrid = (tab) => {
      const grid = document.getElementById('botGrid');
      grid.innerHTML = '';
      BOTS.filter(b => (tab==='casual') ? !b.famous : b.famous).forEach((b,i) => {
        const div = document.createElement('div');
        div.className = 'bot-card' + (b.famous?' famous':'') + (i===0?' active':'');
        div.dataset.id = b.id;
        div.innerHTML = `<div class="bot-emoji">${b.emoji}</div>
          <div class="bot-name">${b.name}</div>
          <div class="bot-tagline">${b.tagline}</div>
          <div class="bot-elo-range">ELO ${b.elo[1]}</div>
          ${b.famous?'<div class="famous-badge">Famous Bot</div>':''}`;
        div.addEventListener('click', ()=>{
          document.querySelectorAll('.bot-card').forEach(c=>c.classList.remove('active'));
          div.classList.add('active');
          this._refreshMatchPreview();
          this._checkFairMatchWarning();
        });
        grid.appendChild(div);
      });
    };

    document.querySelectorAll('.bot-tab').forEach(t=>{
      t.addEventListener('click', ()=>{
        document.querySelectorAll('.bot-tab').forEach(x=>x.classList.remove('active'));
        t.classList.add('active');
        currentTab = t.dataset.tab;
        renderBotGrid(currentTab);
        this._checkFairMatchWarning();
      });
    });
    renderBotGrid('casual');

    // Difficulty
    document.querySelectorAll('.diff-btn').forEach(b=>{
      b.addEventListener('click',()=>{
        document.querySelectorAll('.diff-btn').forEach(x=>x.classList.remove('active'));
        b.classList.add('active');
        this._refreshMatchPreview();
        this._checkFairMatchWarning();
      });
    });

    // Time controls
    const cats = {};
    TIME_CONTROLS.forEach(tc=>{ if(!cats[tc.cat]) cats[tc.cat]=[]; cats[tc.cat].push(tc); });
    const timeCats = document.getElementById('timeCats');
    timeCats.innerHTML = '';
    let firstBtn = true;
    Object.entries(cats).forEach(([cat,tcs])=>{
      const wrap=document.createElement('div');
      wrap.innerHTML=`<div class="time-cat-label">${cat}</div><div class="time-options"></div>`;
      const row=wrap.querySelector('.time-options');
      tcs.forEach(tc=>{
        const btn=document.createElement('button');
        btn.className='time-btn'+(firstBtn?' active':'');
        if(firstBtn) firstBtn=false;
        btn.textContent=tc.label; btn.dataset.seconds=tc.seconds; btn.dataset.increment=tc.increment||0;
        btn.addEventListener('click',()=>{
          document.querySelectorAll('.time-btn').forEach(x=>x.classList.remove('active'));
          btn.classList.add('active');
        });
        row.appendChild(btn);
      });
      timeCats.appendChild(wrap);
    });

    // Stakes
    document.querySelectorAll('.stake-btn').forEach(b=>{
      b.addEventListener('click',()=>{
        document.querySelectorAll('.stake-btn').forEach(x=>x.classList.remove('active'));
        b.classList.add('active');
        const ci=document.getElementById('customStakeInput');
        if(b.dataset.stake==='custom'){ ci.classList.remove('hidden'); ci.focus(); }
        else ci.classList.add('hidden');
        this._refreshMatchPreview();
      });
    });
    document.getElementById('customStakeInput').addEventListener('input',()=>this._refreshMatchPreview());

    // Colors
    document.querySelectorAll('.color-btn').forEach(b=>{
      b.addEventListener('click',()=>{
        document.querySelectorAll('.color-btn').forEach(x=>x.classList.remove('active'));
        b.classList.add('active');
      });
    });

    this._refreshMatchPreview();
  }

  _getSelectedBot() {
    const active = document.querySelector('.bot-card.active');
    if (!active) return BOTS[0];
    return BOTS.find(b=>b.id===active.dataset.id) || BOTS[0];
  }

  _getStake() {
    const a=document.querySelector('.stake-btn.active');
    if(!a) return 500;
    if(a.dataset.stake==='custom') return parseInt(document.getElementById('customStakeInput').value)||0;
    return parseInt(a.dataset.stake);
  }

  _refreshMatchPreview() {
    const diff=parseInt(document.querySelector('.diff-btn.active')?.dataset.diff??1);
    const stake=this._getStake();
    document.getElementById('poolPreview').textContent  ='$'+(stake*2).toLocaleString();
    document.getElementById('walletPreview').textContent='$'+this.playerWallet.toLocaleString();
    document.querySelectorAll('.bot-card').forEach(c=>{
      const b=BOTS.find(x=>x.id===c.dataset.id);
      if(b) c.querySelector('.bot-elo-range').textContent=`ELO ${b.elo[diff]}`;
    });
  }

  _checkFairMatchWarning() {
    const bot  = this._getSelectedBot();
    const diff = parseInt(document.querySelector('.diff-btn.active')?.dataset.diff??1);
    const warn = this._checkFairMatch(bot.elo[diff]);
    const el   = document.getElementById('fairMatchWarning');
    if (warn) { el.textContent=warn; el.classList.remove('hidden'); }
    else       { el.classList.add('hidden'); }
  }

  // ── OPENINGS LAB ──────────────────────────────────────────────────────
  _openOpeningsLab() {
    const list = document.getElementById('openingsList');
    list.innerHTML = OPENINGS.map((o,i)=>`
      <div class="opening-item${i===0?' active':''}" data-idx="${i}">
        <div class="opening-eco">${o.eco} · ${o.emoji}</div>
        <div class="opening-name">${o.name}</div>
      </div>`).join('');
    list.querySelectorAll('.opening-item').forEach(item=>{
      item.addEventListener('click',()=>{
        list.querySelectorAll('.opening-item').forEach(x=>x.classList.remove('active'));
        item.classList.add('active');
        this._renderOpeningDetail(OPENINGS[parseInt(item.dataset.idx)]);
      });
    });
    this._renderOpeningDetail(OPENINGS[0]);
    document.getElementById('openingsModal').classList.remove('hidden');
  }

  _renderOpeningDetail(o) {
    const detail = document.getElementById('openingDetail');
    const board  = this._renderMiniBoardFromMoves(o.moves);
    detail.innerHTML = `
      <div class="opening-d-name">${o.emoji} ${o.name}</div>
      <div class="opening-d-eco">ECO: ${o.eco}</div>
      <div class="opening-moves-str">${o.moves}</div>
      ${board}
      <div class="opening-desc">${o.desc}</div>
      <div class="opening-section-title">Key Ideas</div>
      <ul class="opening-ideas">${o.ideas.map(i=>`<li>${i}</li>`).join('')}</ul>
      <div class="opening-section-title">Common Responses</div>
      <ul class="opening-ideas">${o.counters.map(c=>`<li>${c}</li>`).join('')}</ul>
    `;
  }

  _renderMiniBoardFromMoves(movesStr) {
    try {
      const c = new Chess();
      movesStr.split(' ').forEach(m => { try { c.move(m); } catch {} });
      const files = 'abcdefgh';
      let html = '<div class="opening-mini-board">';
      for (let ri=0; ri<8; ri++) {
        for (let fi=0; fi<8; fi++) {
          const rank=8-ri, file=fi;
          const sq=files[file]+rank;
          const isLight=(file+rank)%2===0;
          const piece=c.get(sq);
          const pieceHtml = piece ? `<span class="${piece.color==='w'?'wp':'bp'}">${UNI[piece.color+piece.type.toUpperCase()]}</span>` : '';
          html += `<div class="opening-sq ${isLight?'light':'dark'}">${pieceHtml}</div>`;
        }
      }
      html += '</div>';
      return html;
    } catch { return ''; }
  }

  // ── BIND UI ───────────────────────────────────────────────────────────
  _bindUI() {
    const $=id=>document.getElementById(id);
    $('newGameBtn').addEventListener('click',()=>{ $('startMatchModal').classList.remove('hidden'); this._refreshMatchPreview(); this._checkFairMatchWarning(); });
    $('openingsBtn').addEventListener('click',()=>this._openOpeningsLab());
    $('flipBoard').addEventListener('click',()=>{ this.flipped=!this.flipped; this._renderBoard(); });
    $('uploadPgnBtn').addEventListener('click',()=>$('pgnFileInput').click());
    $('pgnFileInput').addEventListener('change',e=>this._loadPgn(e));
    $('historyBtn').addEventListener('click',()=>this._openHistory());
    $('walletBtn').addEventListener('click',()=>this._openWallet());
    $('profileBtn').addEventListener('click',()=>this._openProfile());
    $('settingsBtn').addEventListener('click',()=>$('settingsModal').classList.remove('hidden'));

    $('reviewFirst').addEventListener('click',()=>this._gotoReview(0));
    $('reviewPrev').addEventListener('click', ()=>this._gotoReview(this.reviewIdx-1));
    $('reviewNext').addEventListener('click', ()=>this._gotoReview(this.reviewIdx+1));
    $('reviewLast').addEventListener('click', ()=>this._gotoReview(this.reviewStates.length-1));
    $('exitReviewBtn').addEventListener('click',()=>this._exitReview());

    $('resignBtn').addEventListener('click',()=>{ if(!this.gameActive) return; $('resignStakeDisplay').textContent=this.matchConfig?.stake||0; $('resignModal').classList.remove('hidden'); });
    $('drawBtn').addEventListener('click',()=>{ if(!this.gameActive) return; $('drawModal').classList.remove('hidden'); });
    $('hintBtn').addEventListener('click',()=>this._showHint());
    $('undoMove').addEventListener('click',()=>this._undoMove());

    $('startMatchBtn').addEventListener('click',()=>this._startMatch());
    $('analysisModeBtn').addEventListener('click',()=>this._startAnalysisMode());

    $('gameOverNewGame').addEventListener('click',()=>{ $('gameOverModal').classList.add('hidden'); $('startMatchModal').classList.remove('hidden'); this._refreshMatchPreview(); });
    $('gameOverRematch').addEventListener('click',()=>{ $('gameOverModal').classList.add('hidden'); this._rematch(); });
    $('gameOverReview').addEventListener('click',()=>{ $('gameOverModal').classList.add('hidden'); this._startGameReview(); });
    $('resignConfirm').addEventListener('click',()=>{ $('resignModal').classList.add('hidden'); this._doResign(); });
    $('resignCancel').addEventListener('click', ()=>$('resignModal').classList.add('hidden'));
    $('drawConfirm').addEventListener('click',  ()=>{ $('drawModal').classList.add('hidden'); this._offerDraw(); });
    $('drawCancel').addEventListener('click',   ()=>$('drawModal').classList.add('hidden'));
    $('walletClose').addEventListener('click',  ()=>$('walletModal').classList.add('hidden'));
    $('historyClose').addEventListener('click', ()=>$('historyModal').classList.add('hidden'));
    $('openingsClose').addEventListener('click',()=>$('openingsModal').classList.add('hidden'));
    $('profileClose').addEventListener('click', ()=>$('profileModal').classList.add('hidden'));
    $('settingsClose').addEventListener('click',()=>$('settingsModal').classList.add('hidden'));

    // Wallet tabs
    document.querySelectorAll('.wallet-tab').forEach(t=>{
      t.addEventListener('click',()=>{
        document.querySelectorAll('.wallet-tab').forEach(x=>x.classList.remove('active'));
        t.classList.add('active');
        const tab=t.dataset.wtab;
        ['wtabDeposit','wtabWithdraw','wtabMethods'].forEach(id=>{ $( id).classList.toggle('hidden', !id.includes(tab.charAt(0).toUpperCase()+tab.slice(1))); });
        // Fix: show correct tab
        $('wtabDeposit').classList.toggle('hidden',  tab!=='deposit');
        $('wtabWithdraw').classList.toggle('hidden', tab!=='withdraw');
        $('wtabMethods').classList.toggle('hidden',  tab!=='methods');
      });
    });

    // Add funds
    document.querySelectorAll('.btn-add-funds').forEach(b=>{
      b.addEventListener('click',()=>{
        const amt=parseInt(b.dataset.amount);
        this.playerWallet+=amt; this._saveWallet(); this._updateWalletDisplay();
        this._addTxEntry('+$'+amt, amt,'Demo deposit'); this._openWallet();
      });
    });

    // Withdraw
    $('withdrawBtn').addEventListener('click',()=>{
      const amt=parseInt($('withdrawAmount').value);
      const to=$('withdrawTo').value;
      const msg=$('withdrawMsg');
      if(!to){ msg.textContent='Please select withdrawal method'; msg.className='withdraw-msg error'; return; }
      if(!amt||amt<100){ msg.textContent='Minimum withdrawal is $100'; msg.className='withdraw-msg error'; return; }
      if(amt>this.playerWallet){ msg.textContent=`Insufficient balance ($${this.playerWallet.toLocaleString()})`; msg.className='withdraw-msg error'; return; }
      msg.textContent=`⏳ Withdrawal request of $${amt.toLocaleString()} submitted (Razorpay integration pending)`; msg.className='withdraw-msg success';
      msg.classList.remove('hidden');
    });

    // Payment method type tabs
    document.querySelectorAll('.method-type-btn').forEach(b=>{
      b.addEventListener('click',()=>{
        document.querySelectorAll('.method-type-btn').forEach(x=>x.classList.remove('active'));
        b.classList.add('active');
        ['cardForm','upiForm','bankForm'].forEach(id=>$( id).classList.add('hidden'));
        $(`${b.dataset.mtype}Form`).classList.remove('hidden');
      });
    });

    $('addMethodBtn').addEventListener('click',()=>{
      const type = document.querySelector('.method-type-btn.active')?.dataset.mtype||'card';
      let label = '';
      if(type==='card'){
        const num=$('cardNumber').value.replace(/\s/g,'');
        if(num.length<12){ alert('Enter a valid card number'); return; }
        label=`Card ending in ${num.slice(-4)}`;
      } else if(type==='upi'){
        const upi=$('upiId').value.trim();
        if(!upi.includes('@')){ alert('Enter a valid UPI ID (e.g. name@bank)'); return; }
        label=`UPI: ${upi}`;
      } else {
        const acct=$('bankAcct').value.trim();
        if(acct.length<6){ alert('Enter a valid account number'); return; }
        label=`Bank: ****${acct.slice(-4)}`;
      }
      this.paymentMethods.push({type,label});
      localStorage.setItem(METHODS_KEY, JSON.stringify(this.paymentMethods));
      this._renderPaymentMethods();
      alert(`✓ Payment method saved (Razorpay integration coming soon)`);
    });

    // Profile save
    $('saveProfileBtn').addEventListener('click',()=>{
      const name=$('profileNameInput').value.trim() || 'Player';
      const avatar=$('profileAvatarBig').textContent;
      this.profile.name=name; this.profile.avatar=avatar;
      this._saveProfile(); this._updateProfileHeader();
      $('profileModal').classList.add('hidden');
    });

    // Settings
    $('settingSound').addEventListener('change',    e=>{ this.settings.sound=e.target.checked; this.sound.on=e.target.checked; this._saveSettings(); });
    $('settingVolume').addEventListener('input',    e=>{ this.settings.volume=+e.target.value; this.sound.vol=+e.target.value/100; this._saveSettings(); });
    $('settingPremove').addEventListener('change',  e=>{ this.settings.premove=e.target.checked; this._saveSettings(); });
    $('settingAutoQueen').addEventListener('change',e=>{ this.settings.autoQueen=e.target.checked; this._saveSettings(); });
    $('settingCoords').addEventListener('change',   e=>{ this.settings.coords=e.target.checked; this._saveSettings(); this._renderBoard(); });
    $('settingMoveHints').addEventListener('change',e=>{ this.settings.moveHints=e.target.checked; this._saveSettings(); });
    document.querySelectorAll('.theme-btn').forEach(b=>{
      b.addEventListener('click',()=>{
        document.querySelectorAll('.theme-btn').forEach(x=>x.classList.remove('active'));
        b.classList.add('active'); this.settings.theme=b.dataset.theme;
        this._applyTheme(b.dataset.theme); this._saveSettings();
      });
    });

    fetch('/api/eval?fen=rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR%20w%20KQkq%20-%200%201&movetime=100')
      .then(r=>r.json())
      .then(()=>{ document.getElementById('engineStatus').textContent='⚙ Engine ready'; })
      .catch(()=>{ document.getElementById('engineStatus').textContent='⚠ Engine offline'; });
  }

  // ── START MATCH ───────────────────────────────────────────────────────
  _startMatch() {
    const bot   = this._getSelectedBot();
    const diff  = parseInt(document.querySelector('.diff-btn.active')?.dataset.diff??1);
    const tcBtn = document.querySelector('.time-btn.active');
    const stake = this._getStake();
    const colorCode = document.querySelector('.color-btn.active')?.dataset.color??'w';

    if(!tcBtn)              { alert('Select a time control'); return; }
    if(stake<10)            { alert('Minimum stake is $10'); return; }
    if(stake>this.playerWallet){ alert(`Insufficient funds. Wallet: $${this.playerWallet.toLocaleString()}`); return; }

    const tc = { seconds:parseInt(tcBtn.dataset.seconds), increment:parseInt(tcBtn.dataset.increment||0), label:tcBtn.textContent };
    const playerColor = colorCode==='r'?(Math.random()<.5?'w':'b'):colorCode;

    this.matchConfig = { bot, diff, tc, stake, playerColor, elo:bot.elo[diff], blunderChance:bot.blunder[diff] };
    this.flipped     = playerColor==='b';
    this.analysisMode = false;

    this.playerWallet -= stake;
    this._saveWallet(); this._updateWalletDisplay();
    this.playerPool = stake; this.botPool = stake;

    document.getElementById('startMatchModal').classList.add('hidden');
    this._initGame();
  }

  _rematch() {
    if (!this.matchConfig) { document.getElementById('startMatchModal').classList.remove('hidden'); return; }
    const cfg = this.matchConfig;
    const stake = cfg.stake;
    if (stake > this.playerWallet) { alert(`Insufficient funds ($${this.playerWallet.toLocaleString()}) for rematch stake ($${stake.toLocaleString()})`); document.getElementById('startMatchModal').classList.remove('hidden'); return; }
    this.playerWallet -= stake; this._saveWallet(); this._updateWalletDisplay();
    this.playerPool = stake; this.botPool = stake;
    this._initGame();
  }

  _startAnalysisMode() {
    document.getElementById('startMatchModal').classList.add('hidden');
    this.matchConfig  = null;
    this.analysisMode = true;
    this.chess = new Chess();
    this.selected=null; this.premove=null; this.botThinking=false;
    this.gameActive=true; this.reviewMode=false;
    this.arrows={}; this.hintSquares=[]; this.lastMove=null;
    this.moveHistory=[]; this.liveStates=[this.chess.fen()];
    this.prevEval=0; this.bestMoveUci=null;
    this.moveCount=0; this.transactions=[];
    this.playerPool=0; this.botPool=0; this.flipped=false;
    this._stopClock();

    document.getElementById('topPlayerName').textContent = 'Black';
    document.getElementById('topAvatar').textContent     = '♚';
    document.getElementById('topElo').textContent        = '';
    document.getElementById('bottomPlayerName').textContent='White';
    document.getElementById('bottomElo').textContent     = '';
    document.getElementById('topClock').textContent      = '—';
    document.getElementById('bottomClock').textContent   = '—';
    document.getElementById('topClock').className        = 'player-clock';
    document.getElementById('bottomClock').className     = 'player-clock';
    document.getElementById('poolBadge').textContent     = 'Analysis';
    document.getElementById('playerBalance').textContent = '—';
    document.getElementById('botBalance').textContent    = '—';
    document.getElementById('reviewBar').classList.add('hidden');
    document.querySelectorAll('.pip').forEach(p=>p.classList.remove('filled'));
    document.getElementById('unlockCount').textContent   = '—';

    this._setGameReveal(true); // show eval in analysis mode
    this._renderBoard(); this._renderMaterial(); this._updateMoveHistory();
    document.getElementById('statusText').textContent='Analysis — play both sides freely';
    document.getElementById('lastMoveAnalysis').innerHTML='<div class="analysis-placeholder">Make a move to see analysis</div>';
    document.getElementById('bestMoveBadge').textContent='—';
  }

  _initGame() {
    const cfg = this.matchConfig;
    this.chess=new Chess(); this.selected=null; this.premove=null;
    this.botThinking=false; this.gameActive=true; this.reviewMode=false;
    this.reviewStates=[]; this.reviewEntries=[]; this.reviewIdx=0;
    this.arrows={}; this.hintSquares=[]; this.lastMove=null;
    this.moveHistory=[]; this.liveStates=[this.chess.fen()];
    this.prevEval=0; this.bestMoveUci=null;
    this.moveCount=0; this.transactions=[];
    this.activeColor='w';
    this.playerTime=cfg.tc.seconds; this.botTime=cfg.tc.seconds;
    this._stopClock();

    document.getElementById('topPlayerName').textContent = cfg.bot.name;
    document.getElementById('topAvatar').textContent     = cfg.bot.emoji;
    document.getElementById('topElo').textContent        = `ELO ${cfg.elo}`;
    document.getElementById('bottomPlayerName').textContent = this.profile.name;
    document.getElementById('bottomAvatar').textContent  = this.profile.avatar;
    document.getElementById('bottomElo').textContent     = cfg.playerColor==='w'?'White':'Black';
    document.getElementById('reviewBar').classList.add('hidden');

    document.querySelectorAll('.pip').forEach(p=>p.classList.remove('filled'));
    document.getElementById('unlockCount').textContent='5 moves';
    document.getElementById('unlockCount').classList.remove('unlocked');

    this._setGameReveal(false); // hide eval/analysis during live game
    this._updatePoolDisplay();
    this._renderClocks();
    this._renderBoard();
    this._renderMaterial();
    this._updateMoveHistory();
    document.getElementById('lastMoveAnalysis').innerHTML='<div class="analysis-placeholder">Analysis revealed after game</div>';
    document.getElementById('bestMoveBadge').textContent='—';

    if (cfg.playerColor==='b') {
      document.getElementById('statusText').textContent="Bot's turn";
      setTimeout(()=>this._botMove(), 400);
    } else {
      document.getElementById('statusText').textContent='Your turn';
      this._startClock('w');
    }
  }

  // ── REVEAL / HIDE analysis during live game ───────────────────────────
  _setGameReveal(revealed) {
    document.getElementById('evalBarWrap').classList.toggle('hidden', !revealed);
    document.getElementById('hintBtn').classList.toggle('hidden', !revealed);
    // Analysis panel placeholder changes
    if (!revealed) {
      document.getElementById('bestMovePanel').style.opacity = '0.35';
      document.getElementById('analysisPanel').style.opacity = '0.35';
    } else {
      document.getElementById('bestMovePanel').style.opacity = '';
      document.getElementById('analysisPanel').style.opacity = '';
    }
    this._gameRevealed = revealed;
  }

  // ── CLOCK ─────────────────────────────────────────────────────────────
  _startClock(color) {
    this._stopClock();
    this.activeColor = color;
    this._updateClockStyles();
    const isPlayer = color===this.matchConfig?.playerColor;
    this.clockTick = setInterval(()=>{
      if (isPlayer) {
        this.playerTime -= 0.1;
        if (this.playerTime <= 0) { this.playerTime=0; this._renderClocks(); this._stopClock(); this._flagLoss('player'); return; }
        if (this.playerTime <= 10) this.sound.tick();
      } else {
        this.botTime -= 0.1;
        if (this.botTime <= 0) { this.botTime=0; this._renderClocks(); this._stopClock(); this._flagLoss('bot'); return; }
      }
      this._renderClocks();
    }, 100);
  }

  _stopClock() { if(this.clockTick){ clearInterval(this.clockTick); this.clockTick=null; } }

  _addIncrement(whichColor) {
    const inc = this.matchConfig?.tc?.increment||0;
    if (!inc) return;
    if (whichColor===this.matchConfig?.playerColor) this.playerTime+=inc;
    else this.botTime+=inc;
  }

  _renderClocks() {
    const fmt=s=>{ s=Math.max(0,s); const m=Math.floor(s/60),sec=Math.floor(s%60),t=Math.floor((s%1)*10); return s<10?`${m}:${sec.toString().padStart(2,'0')}.${t}`:`${m}:${sec.toString().padStart(2,'0')}`; };
    const cfg=this.matchConfig;
    const pEl=document.getElementById('bottomClock'), bEl=document.getElementById('topClock');
    pEl.textContent=cfg?fmt(this.playerTime):'—';
    bEl.textContent=cfg?fmt(this.botTime):'—';
    const pw=this.playerTime<30&&this.playerTime>0, pc=this.playerTime<10&&this.playerTime>0;
    const pActive=cfg&&this.activeColor===cfg.playerColor;
    const bActive=cfg&&this.activeColor!==cfg.playerColor;
    pEl.className='player-clock'+(pc?' critical':pw?' warning':'')+(pActive?' active-clock':'');
    bEl.className='player-clock'+(bActive?' active-clock':'');
  }
  _updateClockStyles() { this._renderClocks(); }
  _flagLoss(who) { if(!this.gameActive) return; this._endGame('timeout', who==='player'?'bot':'player'); }

  // ── RENDER BOARD ──────────────────────────────────────────────────────
  _renderBoard() {
    const board=document.getElementById('board'); board.innerHTML='';
    const files='abcdefgh';
    for(let ri=0;ri<8;ri++){
      for(let fi=0;fi<8;fi++){
        const rank=this.flipped?ri+1:8-ri;
        const file=this.flipped?7-fi:fi;
        const sq=files[file]+rank;
        // ★ FIX: (file+rank)%2===0 gives h1=light, a1=dark (standard chess coloring)
        const isLight=(file+rank)%2===0;
        const div=document.createElement('div');
        div.className=`square ${isLight?'light':'dark'}`;
        div.dataset.sq=sq;

        if(this.settings.coords){
          if(fi===0){ const l=document.createElement('span'); l.className='sq-label-rank'; l.textContent=rank; div.appendChild(l); }
          if(ri===7){ const l=document.createElement('span'); l.className='sq-label-file'; l.textContent=files[file]; div.appendChild(l); }
        }

        const piece=this.chess.get(sq);
        if(piece){
          const span=document.createElement('span');
          span.className=`piece ${piece.color==='w'?'white':'black'}`;
          span.textContent=UNI[piece.color+piece.type.toUpperCase()];
          div.appendChild(span);
        }

        if(this.lastMove&&(sq===this.lastMove.from||sq===this.lastMove.to)) div.classList.add('last-move');
        if(this.selected===sq) div.classList.add('selected');
        if(this.selected&&this.settings.moveHints&&!this.reviewMode){
          const moves=this.chess.moves({square:this.selected,verbose:true});
          if(moves.some(m=>m.to===sq)) div.classList.add(piece?'valid-capture':'valid-move');
        }
        if(this.premove){
          if(sq===this.premove.from) div.classList.add('premove-from');
          if(sq===this.premove.to)   div.classList.add('premove-to');
        }
        if(this.hintSquares.includes(sq)) div.classList.add(sq===this.hintSquares[0]?'hint-from':'hint-to');
        if(this.chess.inCheck()){
          const king=this._findKing(this.chess.turn());
          if(sq===king) div.classList.add('in-check');
        }
        // Review highlights
        if(this.reviewMode&&this.reviewLastMove){
          if(sq===this.reviewLastMove.from) div.classList.add('review-from');
          if(sq===this.reviewLastMove.to)   div.classList.add('review-to');
        }

        div.addEventListener('click',     e=>this._handleClick(sq,e));
        div.addEventListener('mousedown', e=>this._handleMouseDown(sq,e));
        div.addEventListener('mouseup',   e=>this._handleMouseUp(sq,e));
        div.addEventListener('contextmenu',e=>e.preventDefault());
        board.appendChild(div);
      }
    }
    if(Object.keys(this.arrows).length) this._drawArrows();
  }

  _findKing(color){ for(const sq of this.chess.board().flat()) if(sq&&sq.type==='k'&&sq.color===color) return sq.square; return null; }

  // ── INPUT ─────────────────────────────────────────────────────────────
  _handleMouseDown(sq,e){ if(e.button===2) this.rDragFrom=sq; }
  _handleMouseUp(sq,e){
    if(e.button===2&&this.rDragFrom&&this.rDragFrom!==sq) this._addArrow(this.rDragFrom,sq,e);
    this.rDragFrom=null;
  }

  _handleClick(sq,e){
    if(e.button===2||this.rDragFrom) return;
    this.arrows={}; this.hintSquares=[];
    if(this.reviewMode){ this._renderBoard(); return; }

    const pc=this.matchConfig?.playerColor||'w';

    if(this.botThinking&&this.settings.premove){
      const piece=this.chess.get(sq);
      if(!this.premove&&piece&&piece.color===pc){
        this.premove={from:sq,to:null}; this._renderBoard(); return;
      }
      if(this.premove?.from&&!this.premove.to){
        if(sq===this.premove.from){ this.premove=null; this._renderBoard(); return; }
        this.premove={from:this.premove.from,to:sq}; this._renderBoard(); this.sound.premove(); return;
      }
      return;
    }

    if(!this.gameActive) return;
    // Analysis mode: allow both colors
    if(!this.analysisMode && this.chess.turn()!==pc) return;

    if(this.selected){
      if(sq===this.selected){ this.selected=null; this._renderBoard(); return; }
      const moves=this.chess.moves({square:this.selected,verbose:true});
      const mv=moves.find(m=>m.to===sq);
      if(mv){ this._doPlayerMove(this.selected,sq,mv); return; }
      const piece=this.chess.get(sq);
      if(piece&&(this.analysisMode||piece.color===pc)){ this.selected=sq; this._renderBoard(); return; }
      this.selected=null; this._renderBoard(); return;
    }
    const piece=this.chess.get(sq);
    if(piece&&(this.analysisMode||piece.color===pc)){ this.selected=sq; this._renderBoard(); }
  }

  _doPlayerMove(from,to,moveObj){
    this.selected=null;
    if(moveObj?.flags?.includes('p')&&!this.settings.autoQueen){ this._showPromoModal(from,to); return; }
    this._execMove(from,to,moveObj?.flags?.includes('p')?'q':undefined);
  }

  _execMove(from,to,promotion){
    const fenBefore=this.chess.fen();
    const move=this.chess.move({from,to,promotion:promotion||'q'});
    if(!move) return;

    if(!this.analysisMode){ this._stopClock(); this._addIncrement(this.matchConfig.playerColor); }
    this.lastMove={from,to};
    this.liveStates.push(this.chess.fen());

    if(move.flags.includes('k')||move.flags.includes('q')) this.sound.castle();
    else if(move.promotion) this.sound.promote();
    else if(move.captured)  this.sound.capture();
    else                    this.sound.move();
    if(this.chess.inCheck()) this.sound.check();

    this._renderBoard(); this._renderMaterial();

    if(!this.analysisMode && this._checkGameOver()) return;

    // Classify
    this._classifyMove(move,fenBefore).then(entry=>{
      this.moveHistory.push(entry);
      this._updateMoveHistory();
      if(!this.analysisMode) this._updatePoolBonuses(entry);
      else { this._showAnalysis(entry); if(this._gameRevealed) this._updateEvalBar(entry.evalAfter); }
    });

    if(this.analysisMode){
      const turn=this.chess.turn()==='w'?'White':'Black';
      document.getElementById('statusText').textContent=`${turn}'s turn (analysis)`;
      engineEval(this.chess.fen(),800).then(r=>{
        this.prevEval=r?.score??0;
        this._updateEvalBar(this.prevEval);
        if(r?.bestMove){ this.bestMoveUci=r.bestMove; document.getElementById('bestMoveBadge').textContent=r.bestMove.slice(0,2)+'→'+r.bestMove.slice(2,4); }
      }).catch(()=>{});
    } else {
      this._botMove();
    }
  }

  // ── PREMOVE ───────────────────────────────────────────────────────────
  _tryFirePremove(){
    if(!this.premove?.from||!this.premove?.to){ this.premove=null; return; }
    const{from,to}=this.premove; this.premove=null;
    const moves=this.chess.moves({square:from,verbose:true});
    const mv=moves.find(m=>m.to===to);
    if(!mv){ this._renderBoard(); return; }
    this._execMove(from,to,mv.flags.includes('p')?'q':undefined);
  }

  // ── BOT MOVE ──────────────────────────────────────────────────────────
  async _botMove(){
    if(!this.gameActive||this.analysisMode) return;
    this.botThinking=true;
    document.getElementById('botThinkingDots').classList.remove('hidden');
    document.getElementById('statusText').textContent='Thinking…';
    const cfg=this.matchConfig;
    this._startClock(cfg.playerColor==='w'?'b':'w');

    const movetime=Math.min(1500,Math.max(200,this.botTime*40));
    let bestData;
    try { bestData=await engineEval(this.chess.fen(),movetime,cfg.elo); }
    catch { bestData={bestMove:null}; }

    // Always get the full legal move list for the current position
    const legalMoves = this.chess.moves({verbose:true});
    if (!legalMoves.length) { this.botThinking=false; this._checkGameOver(); return; }

    // Helper: check if a UCI string matches any legal move (prevents bot capturing own piece)
    const isLegal = (uci) => {
      if (!uci || uci === '0000') return false;
      const f=uci.slice(0,2), t=uci.slice(2,4), p=uci[4]||null;
      return legalMoves.some(m => m.from===f && m.to===t && (!p || m.promotion===p));
    };

    let chosenUci = isLegal(bestData?.bestMove) ? bestData.bestMove : null;

    // Blunder injection: override with a random legal move
    if (cfg.blunderChance>0 && Math.random()<cfg.blunderChance) {
      const m = legalMoves[Math.floor(Math.random()*legalMoves.length)];
      chosenUci = m.from+m.to+(m.promotion||'');
    }

    // Fallback to random legal move if engine gave nothing valid
    if (!isLegal(chosenUci)) {
      const m = legalMoves[Math.floor(Math.random()*legalMoves.length)];
      chosenUci = m.from+m.to+(m.promotion||'');
    }

    const from=chosenUci.slice(0,2),to=chosenUci.slice(2,4),promo=chosenUci[4];
    const fenBefore=this.chess.fen();
    const move=this.chess.move({from,to,promotion:promo||'q'});
    if(!move){ this.botThinking=false; return; }

    this._stopClock(); this._addIncrement(cfg.playerColor==='w'?'b':'w');
    this.lastMove={from,to};
    this.liveStates.push(this.chess.fen());

    if(move.flags.includes('k')||move.flags.includes('q')) this.sound.castle();
    else if(move.promotion) this.sound.promote();
    else if(move.captured)  this.sound.capture();
    else                    this.sound.move();
    if(this.chess.inCheck()) this.sound.check();

    this._renderBoard(); this._renderMaterial();
    this._classifyMove(move,fenBefore).then(entry=>{ this.moveHistory.push(entry); this._updateMoveHistory(); });

    // ★ INSTANT PREMOVE: fire before any secondary eval
    this.botThinking=false;
    document.getElementById('botThinkingDots').classList.add('hidden');

    if(this._checkGameOver()) return;

    if(this.premove){
      document.getElementById('statusText').textContent='Premove!';
      setTimeout(()=>this._tryFirePremove(),50);
    } else {
      document.getElementById('statusText').textContent='Your turn';
      this._startClock(cfg.playerColor);
    }

    // Background eval for best-move panel (not shown during live game)
    engineEval(this.chess.fen(),800).then(r=>{
      this.prevEval=r?.score??0;
      if(r?.bestMove){ this.bestMoveUci=r.bestMove; if(this._gameRevealed) document.getElementById('bestMoveBadge').textContent=r.bestMove.slice(0,2)+'→'+r.bestMove.slice(2,4); }
      if(this._gameRevealed) this._updateEvalBar(this.prevEval);
    }).catch(()=>{});
  }

  // ── CLASSIFICATION (Lichess/chess.com standard thresholds) ───────────
  async _classifyMove(move, fenBefore){
    let evalAfter=0, bestUci=null;
    try {
      const r=await engineEval(this.chess.fen(),400);
      evalAfter=r?.score??0; bestUci=r?.bestMove;
    } catch {}

    // cpLoss from mover's perspective (positive = worse for mover)
    const moverSign = move.color==='w'?1:-1;
    const cpBefore  = moverSign * this.prevEval;        // how good position was before for mover
    const cpAfter   = -(moverSign * evalAfter);         // how good it is after (perspective flipped)
    const cpLoss    = cpBefore - cpAfter;               // positive = we lost advantage

    // Is this the top engine move?
    const isBest = bestUci && (move.from+move.to)===(bestUci.slice(0,2)+bestUci.slice(2,4));

    // Is the piece we moved immediately capturable by opponent?
    // (check opponent's legal moves after our move — any capture on our landing square)
    let isPieceSacrificed = false;
    try {
      const opMoves = this.chess.moves({verbose:true});
      isPieceSacrificed = opMoves.some(m=>m.to===move.to && m.captured);
    } catch {}

    // Was position already bad before (mover was losing by 150+ cp)?
    const wasInDifficulty = cpBefore < -150;

    let classKey;
    // Brilliant: best move + piece can be immediately taken (apparent sacrifice that's correct)
    if (isBest && isPieceSacrificed && cpLoss <= 20)    classKey = 'BRILLIANT';
    // Great: best move that saves a losing position or is deeply non-obvious
    else if (isBest && wasInDifficulty && cpLoss <= 10) classKey = 'GREAT';
    else if (isBest && cpLoss <= 10)                    classKey = 'BEST';
    else if (cpLoss <= CP_THRESHOLDS.EXCELLENT)         classKey = 'EXCELLENT';
    else if (cpLoss <= CP_THRESHOLDS.GOOD)              classKey = 'GOOD';
    else if (cpLoss <= CP_THRESHOLDS.INACCURACY)        classKey = 'INACCURACY';
    else if (cpLoss <= CP_THRESHOLDS.MISTAKE)           classKey = 'MISTAKE';
    else                                                classKey = 'BLUNDER';

    this.prevEval = evalAfter;
    return { san:move.san, uci:move.from+move.to, color:move.color, classKey, cpLoss, evalBefore:cpBefore, evalAfter };
  }

  // ── POOL BONUSES ──────────────────────────────────────────────────────
  _updatePoolBonuses(entry){
    this.moveCount++;
    const pips=document.getElementById('unlockPips').querySelectorAll('.pip');
    pips.forEach((p,i)=>p.classList.toggle('filled',i<Math.min(this.moveCount,BONUS_MOVES)));
    const countEl=document.getElementById('unlockCount');
    if(this.moveCount>=BONUS_MOVES){ countEl.textContent='Unlocked!'; countEl.classList.add('unlocked'); }
    else countEl.textContent=`${BONUS_MOVES-this.moveCount} moves`;
    if(this.moveCount<BONUS_MOVES) return;

    const delta=MOVE_DELTA[entry.classKey]||0;
    if(!delta) return;
    if(entry.color===this.matchConfig.playerColor){
      this.playerPool+=delta; this.botPool-=delta; this._flashDelta('player',delta);
    } else {
      this.botPool+=delta; this.playerPool-=delta; this._flashDelta('bot',delta);
    }
    this._updatePoolDisplay();
    if(entry.color===this.matchConfig.playerColor){
      this._addTxEntry(entry.san,delta,MOVE_TAGS[entry.classKey]?.label||entry.classKey);
      if(delta>0) this.sound.gain(); else this.sound.loss();
    }
  }

  _flashDelta(who,delta){
    const el=document.getElementById(who+'Delta');
    el.textContent=(delta>=0?'+':'')+'$'+delta;
    el.className='bk-delta '+(delta>=0?'positive':'negative');
    setTimeout(()=>el.classList.add('hidden'),2200);
  }

  _updatePoolDisplay(){
    const pool=(this.matchConfig?.stake||0)*2;
    document.getElementById('poolBadge').textContent    ='$'+pool.toLocaleString()+' pool';
    document.getElementById('playerBalance').textContent='$'+this.playerPool.toLocaleString();
    document.getElementById('botBalance').textContent   ='$'+this.botPool.toLocaleString();
  }

  _addTxEntry(moveSan,delta,label){ this.transactions.unshift({moveSan,delta,label,time:Date.now()}); }

  _showAnalysis(entry){
    const tag=MOVE_TAGS[entry.classKey];
    const cpStr=entry.cpLoss>0?`−${entry.cpLoss}cp`:`+${Math.abs(entry.cpLoss)}cp`;
    document.getElementById('lastMoveAnalysis').innerHTML=`
      <div class="move-tag" style="background:${tag.color}22;color:${tag.color};margin-bottom:6px">
        ${tag.icon?tag.icon+' ':''}${tag.label}
      </div>
      <div class="analysis-move">${entry.san}</div>
      <div class="analysis-eval">CP loss: ${cpStr}</div>`;
  }

  // ── MOVE HISTORY ──────────────────────────────────────────────────────
  _updateMoveHistory(){
    const el=document.getElementById('moveHistory');
    const hist=this.chess.history();
    let html='';
    for(let i=0;i<hist.length;i+=2){
      const wE=this.moveHistory.find(e=>e.san===hist[i]&&e.color==='w');
      const bE=this.moveHistory.find(e=>e.san===hist[i+1]&&e.color==='b');
      const wC=wE?.classKey||'GOOD', bC=bE?.classKey||'GOOD';
      // During live match, don't show classification icons
      const showIcons=this._gameRevealed||this.analysisMode;
      const wI=showIcons?(MOVE_TAGS[wC]?.icon||''):'';
      const bI=showIcons?(MOVE_TAGS[bC]?.icon||''):'';
      const wCls=showIcons?wC:'';
      const bCls=showIcons?bC:'';
      html+=`<div class="move-pair">
        <span class="move-num">${i/2+1}.</span>
        <span class="move-san ${wCls}">${hist[i]}${wI?`<span class="move-icon">${wI}</span>`:''}  </span>
        ${hist[i+1]?`<span class="move-san ${bCls}">${hist[i+1]}${bI?`<span class="move-icon">${bI}</span>`:''}</span>`:''}
      </div>`;
    }
    el.innerHTML=html;
    el.scrollTop=el.scrollHeight;
  }

  // ── MATERIAL ──────────────────────────────────────────────────────────
  _renderMaterial(){
    const counts={};
    this.chess.board().flat().forEach(sq=>{ if(sq){ const k=sq.color+sq.type; counts[k]=(counts[k]||0)+1; } });
    const init={wP:8,wN:2,wB:2,wR:2,wQ:1,bP:8,bN:2,bB:2,bR:2,bQ:1};
    const captured={w:[],b:[]};
    Object.entries(init).forEach(([k,v])=>{
      const col=k[0], missing=v-(counts[k]||0);
      for(let i=0;i<missing;i++) captured[col].push(UNI[k]);
    });
    const isPlayerWhite=this.matchConfig?.playerColor==='w'||this.analysisMode;
    document.getElementById('topCaptured').textContent   =(isPlayerWhite?captured.w:captured.b).join('');
    document.getElementById('bottomCaptured').textContent=(isPlayerWhite?captured.b:captured.w).join('');
    const adv=captured.b.length-captured.w.length;
    document.getElementById('topMaterial').textContent   =isPlayerWhite&&adv<0?`+${Math.abs(adv)}`:'';
    document.getElementById('bottomMaterial').textContent=isPlayerWhite&&adv>0?`+${adv}`:'';
  }

  // ── EVAL BAR ──────────────────────────────────────────────────────────
  _updateEvalBar(score){
    const c=Math.max(-800,Math.min(800,score));
    const w=(c+800)/1600;
    document.getElementById('evalBlack').style.flex=1-w;
    document.getElementById('evalWhite').style.flex=w;
    const d=Math.abs(score)>900?'M':(score/100).toFixed(1);
    document.getElementById('evalScore').textContent=score>0?'+'+d:d;
  }

  // ── GAME OVER ─────────────────────────────────────────────────────────
  _checkGameOver(){
    if(!this.chess.isGameOver()) return false;
    this._stopClock(); this.gameActive=false;
    let winner=null;
    if(this.chess.isCheckmate()) winner=this.chess.turn()==='w'?'b':'w';
    const reason=this.chess.isCheckmate()?'checkmate':this.chess.isStalemate()?'stalemate':
      this.chess.isThreefoldRepetition()?'threefold':this.chess.isDraw()?'draw':'draw';
    const whoWon=winner===this.matchConfig?.playerColor?'player':winner?'bot':'draw';
    this._endGame(reason,whoWon);
    return true;
  }

  _endGame(reason,winner){
    this._stopClock(); this.gameActive=false;
    this.sound.gameEnd();
    this._setGameReveal(true); // reveal everything after game

    // Re-render move history with classifications
    this._updateMoveHistory();
    if(this.bestMoveUci) document.getElementById('bestMoveBadge').textContent=this.bestMoveUci.slice(0,2)+'→'+this.bestMoveUci.slice(2,4);

    const stake=this.matchConfig?.stake||0;
    const pool=stake*2;
    let netChange=0,title='',sub='';
    if(winner==='player'){
      netChange=pool; title='🏆 You Win!'; sub=reason==='timeout'?'Bot ran out of time':'Checkmate!';
      this._updateEloAfterGame(1, this.matchConfig?.elo||1200);
    } else if(winner==='bot'){
      netChange=0; title='💀 You Lose'; sub=reason==='timeout'?'Out of time':reason==='resign'?'Resigned':'Checkmate';
      this._updateEloAfterGame(0, this.matchConfig?.elo||1200);
    } else {
      netChange=stake; title='🤝 Draw'; sub='Stakes returned — '+reason;
      this._updateEloAfterGame(0.5, this.matchConfig?.elo||1200);
    }

    this.playerWallet+=netChange; this._saveWallet(); this._updateWalletDisplay();
    const net=netChange-stake;
    document.getElementById('gameOverTitle').textContent=title;
    document.getElementById('gameOverSub').textContent=sub+` · Pool: $${pool.toLocaleString()}`;
    document.getElementById('gameOverEarnings').innerHTML=
      `Move bonuses: <strong style="color:${this.playerPool>=stake?'#66bb6a':'#ef5350'}">${this.playerPool>=stake?'+':''}$${(this.playerPool-stake).toLocaleString()}</strong>
       &nbsp;·&nbsp; Net: <strong style="color:${net>=0?'#66bb6a':'#ef5350'}">${net>=0?'+':''}$${net.toLocaleString()}</strong>`;
    document.getElementById('gameOverModal').classList.remove('hidden');
    this._saveGameToHistory(winner,net,reason);
  }

  _doResign(){ if(this.gameActive) this._endGame('resign','bot'); }

  _offerDraw(){
    if(!this.gameActive) return;
    const diff=this.matchConfig?.diff??1;
    if(Math.random()<[0.6,0.3,0.1][diff]) this._endGame('draw','draw');
    else document.getElementById('statusText').textContent='Bot declined the draw offer';
  }

  // ── GAME REVIEW ───────────────────────────────────────────────────────
  _startGameReview(){
    if(!this.liveStates.length){ alert('No game to review'); return; }
    this.reviewStates = [...this.liveStates];
    this.reviewEntries = [...this.moveHistory];
    this.reviewMode = true;
    this.reviewLastMove = null;
    this.reviewIdx = 0;
    document.getElementById('reviewBar').classList.remove('hidden');
    this._gotoReview(this.reviewStates.length-1);
  }

  _gotoReview(idx){
    idx=Math.max(0,Math.min(this.reviewStates.length-1,idx));
    this.reviewIdx=idx;
    this.chess.load(this.reviewStates[idx]);

    // Figure out last move for highlighting
    if(idx>0){
      const prevChess=new Chess(); prevChess.load(this.reviewStates[idx-1]);
      const curChess=new Chess();  curChess.load(this.reviewStates[idx]);
      // Scan for the difference
      const files='abcdefgh';
      const entry=this.reviewEntries[idx-1];
      if(entry){ this.reviewLastMove={from:entry.uci.slice(0,2),to:entry.uci.slice(2,4)}; }
      else this.reviewLastMove=null;
    } else { this.reviewLastMove=null; }

    this._renderBoard();
    document.getElementById('reviewCounter').textContent=`${idx} / ${this.reviewStates.length-1}`;

    // Show move info
    const entry=idx>0?this.reviewEntries[idx-1]:null;
    const infoEl=document.getElementById('reviewMoveInfo');
    if(entry){
      const tag=MOVE_TAGS[entry.classKey];
      infoEl.innerHTML=`<span style="color:${tag.color}">${tag.icon?tag.icon+' ':''}${entry.san}</span> <span style="color:#7d7d7d;font-size:.75rem">CP loss: ${entry.cpLoss>0?entry.cpLoss:0}</span>`;
    } else { infoEl.innerHTML=''; }
  }

  _exitReview(){
    this.reviewMode=false; this.reviewLastMove=null;
    document.getElementById('reviewBar').classList.add('hidden');
    this._renderBoard();
  }

  // ── HINT ─────────────────────────────────────────────────────────────
  _showHint(){
    if(!this.bestMoveUci) return;
    this.hintSquares=[this.bestMoveUci.slice(0,2),this.bestMoveUci.slice(2,4)];
    this._renderBoard();
    setTimeout(()=>{ this.hintSquares=[]; this._renderBoard(); },3000);
  }

  // ── UNDO ─────────────────────────────────────────────────────────────
  _undoMove(){
    if(!this.gameActive) return;
    if(!this.analysisMode){ this.chess.undo(); if(this.moveHistory.length) this.moveHistory.pop(); if(this.liveStates.length>1) this.liveStates.pop(); }
    this.chess.undo(); if(this.moveHistory.length) this.moveHistory.pop(); if(this.liveStates.length>1) this.liveStates.pop();
    this.lastMove=null;
    this._renderBoard(); this._renderMaterial(); this._updateMoveHistory();
    if(!this.analysisMode){ document.getElementById('statusText').textContent='Your turn'; this._startClock(this.matchConfig.playerColor); }
  }

  // ── ARROWS ───────────────────────────────────────────────────────────
  _addArrow(from,to,e){
    const color=e.shiftKey?'blue':e.ctrlKey?'red':e.altKey?'orange':'green';
    const key=from+to;
    if(this.arrows[key]) delete this.arrows[key]; else this.arrows[key]={from,to,color};
    this._renderBoard();
  }

  _drawArrows(){
    let svg=document.querySelector('.board-arrow-svg');
    if(!svg){
      svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
      svg.classList.add('board-arrow-svg');
      Object.assign(svg.style,{position:'absolute',inset:'0',width:'100%',height:'100%',pointerEvents:'none',zIndex:'10'});
      document.querySelector('.board-wrap').appendChild(svg);
    }
    svg.innerHTML='';
    const bRect=document.getElementById('board').getBoundingClientRect();
    const wRect=document.querySelector('.board-wrap').getBoundingClientRect();
    const sqW=bRect.width/8,sqH=bRect.height/8;
    const files='abcdefgh';
    const center=sq=>{
      const fi=this.flipped?7-files.indexOf(sq[0]):files.indexOf(sq[0]);
      const ri=this.flipped?parseInt(sq[1])-1:8-parseInt(sq[1]);
      return{x:bRect.left-wRect.left+(fi+.5)*sqW,y:bRect.top-wRect.top+(ri+.5)*sqH};
    };
    const cols={green:'#15781bcc',blue:'#2255cccc',red:'#aa2222cc',orange:'#cc8800cc'};
    svg.innerHTML='<defs>'+Object.entries(cols).map(([n,c])=>`
      <marker id="arr-${n}" viewBox="0 0 4 4" refX="3.5" refY="2" markerWidth="4" markerHeight="4" orient="auto">
        <path d="M0,0 L4,2 L0,4 Z" fill="${c}"/>
      </marker>`).join('')+'</defs>';
    Object.values(this.arrows).forEach(({from,to,color})=>{
      const a=center(from),b=center(to);
      const dx=b.x-a.x,dy=b.y-a.y,len=Math.sqrt(dx*dx+dy*dy)||1;
      const ex=a.x+dx/len*(len-sqW*0.22),ey=a.y+dy/len*(len-sqH*0.22);
      const line=document.createElementNS('http://www.w3.org/2000/svg','line');
      line.setAttribute('x1',a.x); line.setAttribute('y1',a.y);
      line.setAttribute('x2',ex);  line.setAttribute('y2',ey);
      line.setAttribute('stroke',cols[color]);
      line.setAttribute('stroke-width',sqW*0.18);
      line.setAttribute('stroke-linecap','round');
      line.setAttribute('marker-end',`url(#arr-${color})`);
      svg.appendChild(line);
    });
  }

  // ── PROMOTION ─────────────────────────────────────────────────────────
  _showPromoModal(from,to){
    const color=this.chess.turn();
    const container=document.getElementById('promoPieces'); container.innerHTML='';
    ['q','r','b','n'].forEach(p=>{
      const span=document.createElement('span');
      span.className='promo-piece'; span.textContent=UNI[color+p.toUpperCase()];
      span.addEventListener('click',()=>{ document.getElementById('promotionModal').classList.add('hidden'); this._execMove(from,to,p); });
      container.appendChild(span);
    });
    document.getElementById('promotionModal').classList.remove('hidden');
  }

  // ── HISTORY ───────────────────────────────────────────────────────────
  _saveGameToHistory(winner,net,reason){
    const cfg=this.matchConfig;
    const h=this._loadHistory();
    h.unshift({
      date:new Date().toISOString(),
      bot:cfg?.bot?.name||'?', botEmoji:cfg?.bot?.emoji||'🤖',
      elo:cfg?.elo||0, diff:['Easy','Normal','Hard'][cfg?.diff??1],
      tc:cfg?.tc?.label||'—', stake:cfg?.stake||0,
      winner, net, reason, moves:this.chess.history().length,
    });
    localStorage.setItem(HISTORY_KEY,JSON.stringify(h.slice(0,100)));
  }
  _loadHistory(){ try{ return JSON.parse(localStorage.getItem(HISTORY_KEY))||[]; } catch{ return[]; } }

  _openHistory(){
    const h=this._loadHistory();
    const list=document.getElementById('historyList');
    if(!h.length){ list.innerHTML='<div class="history-empty">No games played yet</div>'; }
    else {
      list.innerHTML=h.map(g=>{
        const d=new Date(g.date);
        const ds=d.toLocaleDateString()+' '+d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
        const rc=g.winner==='player'?'win':g.winner==='bot'?'loss':'draw';
        const rl=g.winner==='player'?'Win':g.winner==='bot'?'Loss':'Draw';
        const ns=(g.net>=0?'+':'')+'$'+(g.net||0).toLocaleString();
        return`<div class="history-row ${rc}">
          <div><div class="hist-bot">${g.botEmoji} ${g.bot}</div><div class="hist-date">${ds}</div></div>
          <div class="hist-tc">${g.tc}</div>
          <div style="font-size:.72rem;color:#7d7d7d">ELO ${g.elo} · ${g.diff}</div>
          <div class="hist-result ${rc}">${rl}</div>
          <div class="hist-net" style="color:${g.net>=0?'#66bb6a':'#ef5350'}">${ns}</div>
        </div>`;
      }).join('');
    }
    document.getElementById('historyModal').classList.remove('hidden');
  }

  // ── PGN REVIEW ────────────────────────────────────────────────────────
  _loadPgn(e){
    const file=e.target.files[0]; if(!file) return;
    const reader=new FileReader();
    reader.onload=ev=>{
      const tmp=new Chess();
      if(!tmp.loadPgn(ev.target.result)){ alert('Invalid PGN'); return; }
      const hist=tmp.history({verbose:true});
      const c=new Chess(); this.reviewStates=[c.fen()];
      hist.forEach(m=>{ c.move(m); this.reviewStates.push(c.fen()); });
      this.reviewEntries=[]; // no classifications for PGN import
      this.chess=c; this.reviewMode=true; this.reviewIdx=this.reviewStates.length-1;
      this.gameActive=false; this._stopClock();
      document.getElementById('reviewBar').classList.remove('hidden');
      this._gotoReview(this.reviewIdx);
    };
    reader.readAsText(file); e.target.value='';
  }
}

const game = new ChessGame();
