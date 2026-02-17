// ENZO DASH — Beat-synced Level 1 with coins + shop + mobile jump
// Controls: Space / Click / Tap / Jump Button
// Music: WebAudio synth (starts on user gesture). Beat pulse synced to BPM.

const $ = (id) => document.getElementById(id);

// Panels
const menu = $("menu");
const gamePanel = $("game");
const shopPanel = $("shop");
const creditsPanel = $("credits");

// Menu buttons
const startBtn = $("startBtn");
const shopBtn = $("shopBtn");
const creditsBtn = $("creditsBtn");
const backBtn = $("backBtn");
const menuBtn2 = $("menuBtn2");
const menuBtn3 = $("menuBtn3");
const retryBtn = $("retryBtn");
const playAgainBtn = $("playAgainBtn");

// Header buttons
const modeBtn = $("modeBtn");
const fsBtn = $("fsBtn");

// HUD
const scoreEl = $("score");
const coinsEl = $("coins");
const bestEl = $("best");
const coinsHud = $("coinsHud");
const bestHud = $("bestHud");

// Game overlays
const gameOverEl = $("gameOver");
const finalScoreEl = $("finalScore");
const finalCoinsEl = $("finalCoins");
const winEl = $("levelComplete");
const winScoreEl = $("winScore");
const winCoinsEl = $("winCoins");
const tapHint = $("tapHint");

// Canvas
const wrap = $("gameWrap");
const canvas = $("c");
const ctx = canvas.getContext("2d");

// Jump button (mobile)
const jumpBtn = $("jumpBtn");

// Music
const musicBtn = $("musicBtn");

// Shop
const walletEl = $("wallet");
const previewBox = $("previewBox");
const skinName = $("skinName");
const glowName = $("glowName");
const sfxName = $("sfxName");
const themeName = $("themeName");

const skinsList = $("skinsList");
const glowList = $("glowList");
const sfxList = $("sfxList");
const themeList = $("themeList");

const shopBackBtn = $("shopBackBtn");
const resetAllBtn = $("resetAllBtn");
const creditsBackBtn = $("creditsBackBtn");

// Storage keys
const KEY_SAVE = "enzoDashSave_v2";
const KEY_THEME = "enzoDashTheme_v2";

// --- Utility ---
function showPanel(panel){
  [menu, gamePanel, shopPanel, creditsPanel].forEach(p => p.classList.remove("show"));
  panel.classList.add("show");
}
function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }

// --- Save data ---
const DEFAULT_SAVE = {
  best: 0,
  wallet: 0,
  owned: {
    skins: { classic: true },
    glow: { off: true },
    sfx: { pop: true },
    theme: { sky: true }
  },
  equipped: {
    skin: "classic",
    glow: "off",
    sfx: "pop",
    theme: "sky"
  }
};

let save = loadSave();

function loadSave(){
  try{
    const raw = localStorage.getItem(KEY_SAVE);
    if(!raw) return structuredClone(DEFAULT_SAVE);
    const parsed = JSON.parse(raw);

    // Merge safely
    const merged = structuredClone(DEFAULT_SAVE);
    merged.best = Number(parsed.best || 0);
    merged.wallet = Number(parsed.wallet || 0);

    merged.owned = merged.owned || {};
    merged.owned.skins = { ...merged.owned.skins, ...(parsed.owned?.skins || {}) };
    merged.owned.glow  = { ...merged.owned.glow,  ...(parsed.owned?.glow  || {}) };
    merged.owned.sfx   = { ...merged.owned.sfx,   ...(parsed.owned?.sfx   || {}) };
    merged.owned.theme = { ...merged.owned.theme, ...(parsed.owned?.theme || {}) };

    merged.equipped.skin = parsed.equipped?.skin || "classic";
    merged.equipped.glow = parsed.equipped?.glow || "off";
    merged.equipped.sfx  = parsed.equipped?.sfx  || "pop";
    merged.equipped.theme= parsed.equipped?.theme|| "sky";

    // Ensure equipped is owned (fallback)
    if(!merged.owned.skins[merged.equipped.skin]) merged.equipped.skin = "classic";
    if(!merged.owned.glow[merged.equipped.glow]) merged.equipped.glow = "off";
    if(!merged.owned.sfx[merged.equipped.sfx]) merged.equipped.sfx = "pop";
    if(!merged.owned.theme[merged.equipped.theme]) merged.equipped.theme = "sky";

    return merged;
  }catch{
    return structuredClone(DEFAULT_SAVE);
  }
}
function saveNow(){
  localStorage.setItem(KEY_SAVE, JSON.stringify(save));
  syncTopHUD();
  applyPreview();
}
function syncTopHUD(){
  bestEl.textContent = String(save.best);
  bestHud.textContent = String(save.best);
  coinsHud.textContent = String(save.wallet);
  walletEl.textContent = String(save.wallet);
}
syncTopHUD();

// --- Theme mode (light/dark page UI) ---
function setTheme(isDark){
  document.body.classList.toggle("dark", isDark);
  localStorage.setItem(KEY_THEME, isDark ? "dark" : "light");
}
(function initTheme(){
  const t = localStorage.getItem(KEY_THEME);
  setTheme(t === "dark");
})();
modeBtn.addEventListener("click", () => setTheme(!document.body.classList.contains("dark")));

// --- Fullscreen ---
fsBtn.addEventListener("click", async () => {
  try{
    if(!document.fullscreenElement) await wrap.requestFullscreen();
    else await document.exitFullscreen();
  }catch{
    alert("Fullscreen not available on this device/browser.");
  }
});

// --- Shop Catalog ---
const CATALOG = {
  skins: [
    { id:"classic", name:"Classic", cost:0,  color:"#22c55e", note:"Starter" },
    { id:"bluebolt", name:"Blue Bolt", cost:40, color:"#3b82f6", note:"Clean speed vibe" },
    { id:"sunset", name:"Sunset", cost:60, color:"#f97316", note:"Warm orange" },
    { id:"rose", name:"Rose", cost:80, color:"#e11d48", note:"Bold red" },
    { id:"purplepop", name:"Purple Pop", cost:100, color:"#a855f7", note:"Magic look" },
    { id:"midnight", name:"Midnight", cost:140, color:"#111827", note:"Dark cube" }
  ],
  glow: [
    { id:"off", name:"Off", cost:0, note:"No glow" },
    { id:"soft", name:"Soft Glow", cost:75, note:"Gentle outline" },
    { id:"neon", name:"Neon Glow", cost:150, note:"Strong glow" }
  ],
  sfx: [
    { id:"pop", name:"Pop", cost:0, note:"Default jump" },
    { id:"bling", name:"Bling", cost:90, note:"Sparkly jump" },
    { id:"zap", name:"Zap", cost:120, note:"Electric jump" }
  ],
  theme: [
    { id:"sky", name:"Sky", cost:0, note:"Bright clouds" },
    { id:"neon", name:"Neon City", cost:120, note:"Night lights" },
    { id:"candy", name:"Candy Land", cost:140, note:"Sweet colors" },
    { id:"space", name:"Space", cost:160, note:"Stars & planets" }
  ]
};

function isOwned(cat, id){ return !!save.owned[cat][id]; }
function isEquipped(cat, id){
  if(cat==="skins") return save.equipped.skin === id;
  if(cat==="glow")  return save.equipped.glow === id;
  if(cat==="sfx")   return save.equipped.sfx === id;
  if(cat==="theme") return save.equipped.theme === id;
  return false;
}

function buyOrEquip(cat, item){
  const owned = isOwned(cat, item.id);
  if(!owned){
    if(save.wallet < item.cost) return;
    save.wallet -= item.cost;
    save.owned[cat][item.id] = true;
  }

  // Equip
  if(cat==="skins") save.equipped.skin = item.id;
  if(cat==="glow")  save.equipped.glow = item.id;
  if(cat==="sfx")   save.equipped.sfx = item.id;
  if(cat==="theme") save.equipped.theme = item.id;

  saveNow();
  renderShop();
}

function makeShopItem(cat, item){
  const owned = isOwned(cat, item.id);
  const equipped = isEquipped(cat, item.id);

  const el = document.createElement("div");
  el.className = "shopItem";

  const left = document.createElement("div");
  left.className = "shopItemLeft";

  const title = document.createElement("div");
  title.className = "shopItemTitle";
  title.textContent = item.name;

  const meta = document.createElement("div");
  meta.className = "shopItemMeta";
  meta.textContent = item.note + (item.cost ? ` • ${item.cost} coins` : " • free");

  left.appendChild(title);
  left.appendChild(meta);

  const btn = document.createElement("button");
  btn.className = "btn small";
  if(equipped) btn.classList.add("primary");

  if(equipped) btn.textContent = "Equipped";
  else if(owned) btn.textContent = "Equip";
  else btn.textContent = `Buy (${item.cost})`;

  btn.disabled = (!owned && save.wallet < item.cost);
  btn.addEventListener("click", () => buyOrEquip(cat, item));

  el.appendChild(left);
  el.appendChild(btn);
  return el;
}

function renderShop(){
  skinsList.innerHTML = "";
  glowList.innerHTML = "";
  sfxList.innerHTML = "";
  themeList.innerHTML = "";

  CATALOG.skins.forEach(i => skinsList.appendChild(makeShopItem("skins", i)));
  CATALOG.glow.forEach(i  => glowList.appendChild(makeShopItem("glow", i)));
  CATALOG.sfx.forEach(i   => sfxList.appendChild(makeShopItem("sfx", i)));
  CATALOG.theme.forEach(i => themeList.appendChild(makeShopItem("theme", i)));

  walletEl.textContent = String(save.wallet);
  applyPreview();
}
function applyPreview(){
  const skin = CATALOG.skins.find(s => s.id === save.equipped.skin) || CATALOG.skins[0];
  previewBox.style.background = skin.color;

  // Glow preview
  const g = save.equipped.glow;
  if(g === "soft") previewBox.style.boxShadow = `0 0 18px ${skin.color}`;
  else if(g === "neon") previewBox.style.boxShadow = `0 0 30px ${skin.color}, 0 0 60px ${skin.color}`;
  else previewBox.style.boxShadow = "none";

  skinName.textContent = skin.name;
  glowName.textContent = (CATALOG.glow.find(x=>x.id===save.equipped.glow)?.name || "Off");
  sfxName.textContent = (CATALOG.sfx.find(x=>x.id===save.equipped.sfx)?.name || "Pop");
  themeName.textContent = (CATALOG.theme.find(x=>x.id===save.equipped.theme)?.name || "Sky");
}
renderShop();

// --- Navigation ---
startBtn.addEventListener("click", () => { showPanel(gamePanel); startLevel1(); });
shopBtn.addEventListener("click", () => { showPanel(shopPanel); renderShop(); });
creditsBtn.addEventListener("click", () => showPanel(creditsPanel));
shopBackBtn.addEventListener("click", () => showPanel(menu));
creditsBackBtn.addEventListener("click", () => showPanel(menu));

backBtn.addEventListener("click", () => { stopGame(); showPanel(menu); });
menuBtn2.addEventListener("click", () => { stopGame(); showPanel(menu); });
menuBtn3.addEventListener("click", () => { stopGame(); showPanel(menu); });

retryBtn.addEventListener("click", () => { showPanel(gamePanel); startLevel1(); });
playAgainBtn.addEventListener("click", () => { showPanel(gamePanel); startLevel1(); });

resetAllBtn.addEventListener("click", () => {
  localStorage.removeItem(KEY_SAVE);
  save = loadSave();
  saveNow();
  renderShop();
});

// --- Canvas sizing ---
function resizeCanvas(){
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.floor(rect.width * dpr);
  canvas.height = Math.floor(rect.height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener("resize", resizeCanvas);

// =========================
// MUSIC + BEAT SYNC (WebAudio)
// =========================
let audio = {
  ctx: null,
  master: null,
  musicOn: false,
  bpm: 120,
  beatStartTime: 0,
  nextBeatTime: 0,
  beatCount: 0
};

function ensureAudio(){
  if(audio.ctx) return;
  const ctxA = new (window.AudioContext || window.webkitAudioContext)();
  const master = ctxA.createGain();
  master.gain.value = 0.18;
  master.connect(ctxA.destination);

  audio.ctx = ctxA;
  audio.master = master;
}

function playJumpSfx(){
  ensureAudio();
  const ctxA = audio.ctx;

  const type = save.equipped.sfx; // pop | bling | zap
  const osc = ctxA.createOscillator();
  const gain = ctxA.createGain();
  osc.connect(gain);
  gain.connect(audio.master);

  const now = ctxA.currentTime;
  if(type === "pop"){
    osc.type = "square";
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.08);
    gain.gain.setValueAtTime(0.9, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.10);
    osc.start(now);
    osc.stop(now + 0.12);
  } else if(type === "bling"){
    osc.type = "triangle";
    osc.frequency.setValueAtTime(660, now);
    osc.frequency.exponentialRampToValueAtTime(990, now + 0.04);
    gain.gain.setValueAtTime(0.7, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    osc.start(now);
    osc.stop(now + 0.16);
  } else { // zap
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.12);
    gain.gain.setValueAtTime(0.75, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    osc.start(now);
    osc.stop(now + 0.16);
  }
}

function scheduleBeatClick(time){
  // soft kick/click for beat feel
  const ctxA = audio.ctx;
  const osc = ctxA.createOscillator();
  const gain = ctxA.createGain();
  osc.connect(gain);
  gain.connect(audio.master);

  osc.type = "sine";
  osc.frequency.setValueAtTime(120, time);
  osc.frequency.exponentialRampToValueAtTime(60, time + 0.06);

  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.exponentialRampToValueAtTime(0.7, time + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.09);

  osc.start(time);
  osc.stop(time + 0.10);
}

function scheduleBass(time, noteHz){
  const ctxA = audio.ctx;
  const osc = ctxA.createOscillator();
  const gain = ctxA.createGain();
  osc.connect(gain);
  gain.connect(audio.master);

  osc.type = "triangle";
  osc.frequency.setValueAtTime(noteHz, time);

  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.exponentialRampToValueAtTime(0.55, time + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.20);

  osc.start(time);
  osc.stop(time + 0.22);
}

function startMusic(){
  ensureAudio();
  audio.musicOn = true;
  musicBtn.textContent = "🎵 Music: On";

  const ctxA = audio.ctx;
  const now = ctxA.currentTime;

  audio.beatStartTime = now + 0.05;
  audio.nextBeatTime = audio.beatStartTime;
  audio.beatCount = 0;
}

function stopMusic(){
  audio.musicOn = false;
  musicBtn.textContent = "🎵 Music: Off";
}

musicBtn.addEventListener("click", async () => {
  ensureAudio();
  if(audio.ctx.state === "suspended") await audio.ctx.resume();
  if(!audio.musicOn) startMusic();
  else stopMusic();
});

// =========================
// LEVEL 1 (Fixed layout)
// =========================
// We build a tile world. Obstacles/coins are placed by "tileX" positions.
// Beat sync: speed is derived so that N tiles pass per beat.
const TILE = 40;        // pixels per tile
const TILES_PER_BEAT = 3; // scrolling pace (higher = faster)
const BPM = 120;

function pxPerSec(){
  // tiles/beat * beats/sec * px/tile
  return TILES_PER_BEAT * (BPM / 60) * TILE;
}

// Level length (tiles)
const LEVEL_TILES = 210;

// Layout definition (spikes + coin lines + small jumps)
const LEVEL1 = {
  name: "Level 1",
  endTile: LEVEL_TILES,
  spikes: [
    // Each entry: {x: tileX, n: number of spikes in a row}
    { x: 18, n: 1 },
    { x: 26, n: 2 },
    { x: 36, n: 1 },
    { x: 44, n: 3 },
    { x: 60, n: 2 },
    { x: 74, n: 1 },
    { x: 86, n: 4 },
    { x: 104, n: 2 },
    { x: 120, n: 1 },
    { x: 132, n: 3 },
    { x: 150, n: 2 },
    { x: 166, n: 4 },
    { x: 186, n: 2 },
  ],
  coins: [
    // lines of coins (tile range) at jump height
    { from: 12, to: 16, y: 3 },
    { from: 24, to: 29, y: 3 },
    { from: 42, to: 48, y: 4 },
    { from: 58, to: 63, y: 3 },
    { from: 84, to: 92, y: 4 },
    { from: 118, to: 124, y: 3 },
    { from: 148, to: 155, y: 4 },
    { from: 182, to: 190, y: 3 },
  ],
  // Simple "bumps" (small raised blocks) to vary ground (optional)
  bumps: [
    { x: 52, w: 4, h: 1 },
    { x: 96, w: 4, h: 1 },
    { x: 140, w: 5, h: 1 },
    { x: 174, w: 4, h: 1 },
  ]
};

// =========================
// GAME LOOP
// =========================
let rafId = null;
let running = false;
let dead = false;
let won = false;

let W = 0, H = 0;
let score = 0;
let runCoins = 0;

let cameraX = 0; // world x offset in pixels

// Player
const player = {
  x: 4 * TILE,     // fixed screen position (world coords track with camera)
  y: 0,
  size: 34,
  vy: 0,
  onGround: true,
  rot: 0
};

const GRAVITY = 0.95;
const JUMP_VEL = -15.2;

// Beat pulse
let beatPulse = 0; // 0..1
let beatIndexSeen = 0;

// Entities built per run
let spikeRects = [];
let coinOrbs = [];
let bumpRects = [];

function groundY(){
  return Math.floor(H * 0.78);
}

function buildLevelEntities(){
  spikeRects = [];
  coinOrbs = [];
  bumpRects = [];

  // spikes
  for(const g of LEVEL1.spikes){
    for(let i=0;i<g.n;i++){
      const tx = g.x + i;
      spikeRects.push({
        x: tx * TILE,
        w: TILE,
        h: TILE,
      });
    }
  }

  // bumps (raised blocks)
  for(const b of LEVEL1.bumps){
    bumpRects.push({
      x: b.x * TILE,
      w: b.w * TILE,
      h: b.h * TILE,
    });
  }

  // coins
  for(const line of LEVEL1.coins){
    for(let tx = line.from; tx <= line.to; tx++){
      coinOrbs.push({
        x: tx * TILE + TILE * 0.5,
        // y is in "tiles above ground"
        yTiles: line.y,
        r: 10,
        taken: false
      });
    }
  }
}

function currentSkinColor(){
  const skin = CATALOG.skins.find(s => s.id === save.equipped.skin) || CATALOG.skins[0];
  return skin.color;
}

function glowStrength(){
  if(save.equipped.glow === "soft") return 0.55;
  if(save.equipped.glow === "neon") return 1.0;
  return 0.0;
}

// Collision helpers
function aabb(px, py, ps, rx, ryTop, rw, rh){
  // rect is drawn from ground up (top is ryTop-rh)
  const rLeft = rx;
  const rRight = rx + rw;
  const rTop = ryTop - rh;
  const rBottom = ryTop;

  return px < rRight &&
         px + ps > rLeft &&
         py < rBottom &&
         py + ps > rTop;
}

function doJump(){
  if(!running || dead || won) return;
  if(player.onGround){
    player.vy = JUMP_VEL;
    player.onGround = false;
    playJumpSfx();
  }
}

// Inputs
window.addEventListener("keydown", (e) => {
  if(e.code === "Space"){
    e.preventDefault();
    doJump();
  }
});
wrap.addEventListener("pointerdown", () => doJump());
jumpBtn.addEventListener("pointerdown", (e) => { e.preventDefault(); doJump(); });

// Start / Stop
function startLevel1(){
  resizeCanvas();
  W = canvas.getBoundingClientRect().width;
  H = canvas.getBoundingClientRect().height;

  running = true;
  dead = false;
  won = false;

  score = 0;
  runCoins = 0;
  cameraX = 0;

  player.y = groundY() - player.size;
  player.vy = 0;
  player.onGround = true;
  player.rot = 0;

  tapHint.style.display = "block";
  hideOverlays();

  audio.bpm = BPM;

  buildLevelEntities();
  syncTopHUD();
  coinsEl.textContent = "0";
  scoreEl.textContent = "0";

  cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(loop);
}

function stopGame(){
  running = false;
  cancelAnimationFrame(rafId);
}

function hideOverlays(){
  gameOverEl.classList.remove("show");
  winEl.classList.remove("show");
}

function endGame(){
  dead = true;
  tapHint.style.display = "none";

  // Update best + wallet
  save.wallet += runCoins;
  save.best = Math.max(save.best, score);
  saveNow();

  finalScoreEl.textContent = String(score);
  finalCoinsEl.textContent = String(runCoins);
  gameOverEl.classList.add("show");
}

function winGame(){
  won = true;
  tapHint.style.display = "none";

  save.wallet += runCoins;
  save.best = Math.max(save.best, score);
  saveNow();

  winScoreEl.textContent = String(score);
  winCoinsEl.textContent = String(runCoins);
  winEl.classList.add("show");
}

// Buttons
menuBtn2.addEventListener("click", () => { stopGame(); showPanel(menu); });
menuBtn3.addEventListener("click", () => { stopGame(); showPanel(menu); });
retryBtn.addEventListener("click", () => startLevel1());
playAgainBtn.addEventListener("click", () => startLevel1());

// Start at menu
showPanel(menu);

// =========================
// DRAWING: Themes
// =========================
function themeColors(){
  const t = save.equipped.theme;
  const dark = document.body.classList.contains("dark");

  if(t === "neon"){
    return {
      skyA: dark ? "rgba(20,10,50,1)" : "rgba(230,245,255,1)",
      skyB: dark ? "rgba(0,255,200,0.12)" : "rgba(0,140,255,0.12)",
      ground: dark ? "rgba(10,12,20,0.85)" : "rgba(15,23,42,0.06)",
      grid: dark ? "rgba(226,232,240,0.08)" : "rgba(15,23,42,0.08)",
      accent: dark ? "rgba(0,255,200,0.55)" : "rgba(37,99,235,0.35)"
    };
  }
  if(t === "candy"){
    return {
      skyA: dark ? "rgba(35,8,20,1)" : "rgba(255,245,252,1)",
      skyB: dark ? "rgba(255,80,160,0.14)" : "rgba(255,80,160,0.10)",
      ground: dark ? "rgba(18,6,12,0.85)" : "rgba(15,23,42,0.06)",
      grid: dark ? "rgba(226,232,240,0.08)" : "rgba(15,23,42,0.08)",
      accent: dark ? "rgba(255,80,160,0.55)" : "rgba(255,80,160,0.35)"
    };
  }
  if(t === "space"){
    return {
      skyA: dark ? "rgba(5,8,18,1)" : "rgba(235,245,255,1)",
      skyB: dark ? "rgba(160,120,255,0.12)" : "rgba(80,120,255,0.10)",
      ground: dark ? "rgba(5,8,18,0.90)" : "rgba(15,23,42,0.06)",
      grid: dark ? "rgba(226,232,240,0.07)" : "rgba(15,23,42,0.08)",
      accent: dark ? "rgba(160,120,255,0.55)" : "rgba(37,99,235,0.35)"
    };
  }
  // default sky
  return {
    skyA: dark ? "rgba(2,6,23,0.35)" : "rgba(255,255,255,0.40)",
    skyB: dark ? "rgba(96,165,250,0.12)" : "rgba(37,99,235,0.12)",
    ground: dark ? "rgba(15,23,42,0.75)" : "rgba(15,23,42,0.06)",
    grid: dark ? "rgba(226,232,240,0.08)" : "rgba(15,23,42,0.08)",
    accent: dark ? "rgba(96,165,250,0.55)" : "rgba(37,99,235,0.35)"
  };
}

function drawBackground(){
  ctx.clearRect(0,0,W,H);
  const tc = themeColors();

  // base fill
  ctx.fillStyle = tc.skyA;
  ctx.fillRect(0,0,W,H);

  // beat pulse glow wash
  if(beatPulse > 0.001){
    ctx.globalAlpha = 0.35 * beatPulse;
    ctx.fillStyle = tc.skyB;
    ctx.fillRect(0,0,W,H);
    ctx.globalAlpha = 1;
  }

  // subtle grid
  ctx.strokeStyle = tc.grid;
  ctx.lineWidth = 1;

  const grid = 40;
  const offset = (cameraX * 0.35) % grid;

  for(let x = -grid; x < W + grid; x += grid){
    ctx.beginPath();
    ctx.moveTo(x - offset, 0);
    ctx.lineTo(x - offset, H);
    ctx.stroke();
  }

  // ground
  const gy = groundY();
  ctx.fillStyle = tc.ground;
  ctx.fillRect(0, gy, W, H - gy);

  // ground line
  ctx.strokeStyle = tc.accent;
  ctx.beginPath();
  ctx.moveTo(0, gy);
  ctx.lineTo(W, gy);
  ctx.stroke();
}

// draw spike at worldX
function drawSpike(worldX){
  const screenX = worldX - cameraX;
  const y = groundY();
  const w = TILE;
  const h = TILE;

  // beat tint
  const pulse = beatPulse;
  const r = 239, g = 68, b = 68;
  const boost = Math.floor(30 * pulse);

  ctx.fillStyle = `rgba(${clamp(r+boost,0,255)},${clamp(g+boost,0,255)},${clamp(b+boost,0,255)},0.95)`;
  ctx.beginPath();
  ctx.moveTo(screenX, y);
  ctx.lineTo(screenX + w/2, y - h);
  ctx.lineTo(screenX + w, y);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "rgba(15,23,42,0.25)";
  ctx.stroke();
}

function drawBump(b){
  const x = b.x - cameraX;
  const yTop = groundY() - b.h;
  ctx.fillStyle = "rgba(15,23,42,0.10)";
  ctx.fillRect(x, yTop, b.w, b.h);
}

function drawCoin(c){
  if(c.taken) return;

  const screenX = c.x - cameraX;
  const y = groundY() - (c.yTiles * TILE);

  // bob with beat
  const bob = Math.sin((cameraX/80) + c.x/120) * 2 + (beatPulse * -3);

  ctx.save();
  ctx.translate(screenX, y + bob);

  ctx.globalAlpha = 0.95;
  ctx.fillStyle = "rgba(250, 204, 21, 0.98)";
  ctx.beginPath();
  ctx.arc(0, 0, c.r, 0, Math.PI*2);
  ctx.fill();

  ctx.strokeStyle = "rgba(15,23,42,0.25)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, c.r, 0, Math.PI*2);
  ctx.stroke();

  // shine line
  ctx.globalAlpha = 0.35;
  ctx.strokeStyle = "white";
  ctx.beginPath();
  ctx.moveTo(-3, -6);
  ctx.lineTo(-1, 6);
  ctx.stroke();

  ctx.restore();
}

function roundRect(x,y,w,h,r){
  const rr = Math.min(r, w/2, h/2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function drawPlayer(){
  const s = player.size;
  const skinColor = currentSkinColor();
  const glow = glowStrength();

  const cx = (player.x - cameraX) + s/2;
  const cy = player.y + s/2;

  // glow
  if(glow > 0.001){
    ctx.save();
    ctx.globalAlpha = 0.45 * glow;
    ctx.fillStyle = skinColor;
    ctx.beginPath();
    ctx.arc(cx, cy, s * (glow > 0.9 ? 1.35 : 1.15), 0, Math.PI*2);
    ctx.fill();
    ctx.restore();
  }

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(player.rot);

  ctx.fillStyle = skinColor;
  ctx.strokeStyle = "rgba(15,23,42,0.25)";
  ctx.lineWidth = 2;

  roundRect(-s/2, -s/2, s, s, 10);
  ctx.fill();
  ctx.stroke();

  // face
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.beginPath(); ctx.arc(-6, -4, 3, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc( 6, -4, 3, 0, Math.PI*2); ctx.fill();

  ctx.strokeStyle = "rgba(15,23,42,0.35)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 6, 6, 0, Math.PI);
  ctx.stroke();

  ctx.restore();
}

// =========================
// GAME UPDATE
// =========================
function updateBeat(dt){
  if(!audio.musicOn || !audio.ctx) {
    beatPulse = Math.max(0, beatPulse - dt * 2.2);
    return;
  }

  const ctxA = audio.ctx;
  const spb = 60 / audio.bpm; // seconds per beat
  const now = ctxA.currentTime;

  // schedule ahead
  const ahead = 0.18;
  while(audio.nextBeatTime < now + ahead){
    // Pattern (4-beat loop)
    const step = audio.beatCount % 8;
    scheduleBeatClick(audio.nextBeatTime);

    // bass notes on 1 and 3 (and some extras)
    const bassNotes = [110,110,146.8,110,130.8,110,146.8,110]; // A2, D3-ish etc
    scheduleBass(audio.nextBeatTime, bassNotes[step]);

    audio.beatCount++;
    audio.nextBeatTime += spb;
  }

  // compute pulse based on nearest beat
  const beatsSinceStart = (now - audio.beatStartTime) / spb;
  const beatIndex = Math.floor(beatsSinceStart);
  const beatT = beatsSinceStart - beatIndex; // 0..1

  // pulse peaks at beat (0) then decays
  const pulse = Math.exp(-beatT * 6.0);
  beatPulse = clamp(pulse, 0, 1);

  // for any visuals that need "new beat"
  if(beatIndex !== beatIndexSeen){
    beatIndexSeen = beatIndex;
  }
}

function collectCoins(){
  const px = player.x - cameraX;
  const py = player.y;
  const ps = player.size;

  for(const c of coinOrbs){
    if(c.taken) continue;
    const cx = c.x - cameraX;
    const cy = groundY() - (c.yTiles * TILE);

    const dx = (px + ps/2) - cx;
    const dy = (py + ps/2) - cy;
    const dist = Math.hypot(dx, dy);

    if(dist < (c.r + ps*0.35)){
      c.taken = true;
      runCoins += 1;
      coinsEl.textContent = String(runCoins);

      // tiny coin blip (reuse audio)
      ensureAudio();
      const ctxA = audio.ctx;
      const osc = ctxA.createOscillator();
      const gain = ctxA.createGain();
      osc.connect(gain);
      gain.connect(audio.master);
      const now = ctxA.currentTime;
      osc.type = "triangle";
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1320, now + 0.05);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.6, now + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.09);
    }
  }
}

function checkCollisions(){
  // spikes collision
  for(const s of spikeRects){
    const sx = s.x;
    // aabb with spike bounding box (triangle approximated)
    if(aabb(player.x, player.y, player.size, sx, groundY(), TILE, TILE)){
      return true;
    }
  }
  // bumps are solid blocks you can land on (optional)
  for(const b of bumpRects){
    const top = groundY() - b.h;
    const left = b.x;
    const right = b.x + b.w;

    // If player is falling and intersects top surface
    const pBottom = player.y + player.size;
    const pPrevBottom = pBottom - player.vy;

    const withinX = (player.x + player.size) > left && player.x < right;
    const crossingTop = pPrevBottom <= top && pBottom >= top;

    if(withinX && crossingTop && player.vy >= 0){
      player.y = top - player.size;
      player.vy = 0;
      player.onGround = true;
      return false;
    }
  }
  return false;
}

let lastTime = 0;

function loop(ts){
  if(!running) return;
  if(!lastTime) lastTime = ts;
  const dt = Math.min(0.033, (ts - lastTime) / 1000); // seconds
  lastTime = ts;

  W = canvas.getBoundingClientRect().width;
  H = canvas.getBoundingClientRect().height;

  // Beat update (music)
  updateBeat(dt);

  // Speed derived from BPM (beat-synced)
  const speed = pxPerSec();

  if(!dead && !won){
    // advance camera
    cameraX += speed * dt;

    // score increases by distance
    score += Math.floor(speed * dt * 0.12);
    scoreEl.textContent = String(score);

    // physics
    player.vy += GRAVITY;
    player.y += player.vy;

    // ground
    const gy = groundY();
    if(player.y + player.size >= gy){
      player.y = gy - player.size;
      player.vy = 0;
      player.onGround = true;
    } else {
      player.onGround = false;
    }

    // rotate like dash
    if(!player.onGround) player.rot += 0.14;
    else player.rot *= 0.85;

    // collect coins
    collectCoins();

    // check collisions
    if(checkCollisions()){
      endGame();
    }

    // win condition
    const endX = LEVEL1.endTile * TILE;
    if(cameraX + (W * 0.35) >= endX){
      winGame();
    }
  } else {
    // little decay
    beatPulse = Math.max(0, beatPulse - dt * 1.8);
  }

  // draw
  drawBackground();

  // bumps
  for(const b of bumpRects){
    const x = b.x - cameraX;
    if(x + b.w < -100 || x > W + 100) continue;
    drawBump(b);
  }

  // coins
  for(const c of coinOrbs){
    const x = c.x - cameraX;
    if(x < -100 || x > W + 100) continue;
    drawCoin(c);
  }

  // spikes
  for(const s of spikeRects){
    const x = s.x - cameraX;
    if(x < -TILE*2 || x > W + TILE*2) continue;
    drawSpike(s.x);
  }

  // player
  drawPlayer();

  // hint auto-hide
  if(ts > 2200) tapHint.style.display = "none";

  rafId = requestAnimationFrame(loop);
}

// Default UI values
coinsEl.textContent = "0";
scoreEl.textContent = "0";
bestEl.textContent = String(save.best);

// Update preview from equipped
applyPreview();

// Show menu stats
syncTopHUD();

// Start menu panel
showPanel(menu);
