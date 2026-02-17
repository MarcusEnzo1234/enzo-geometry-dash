// ENZO DASH (Geometry Dash–inspired) - HTML Canvas
// Controls: Space / Click / Tap to jump. Avoid spikes.
// Includes: Menu, Credits, Shop, Dark/Light, Fullscreen.

const $ = (id) => document.getElementById(id);

// Panels
const menu = $("menu");
const gamePanel = $("game");
const shop = $("shop");
const credits = $("credits");

// Buttons
const startBtn = $("startBtn");
const shopBtn = $("shopBtn");
const creditsBtn = $("creditsBtn");
const backBtn = $("backBtn");
const menuBtn2 = $("menuBtn2");
const retryBtn = $("retryBtn");
const shopBackBtn = $("shopBackBtn");
const creditsBackBtn = $("creditsBackBtn");
const resetShopBtn = $("resetShopBtn");

const modeBtn = $("modeBtn");
const fsBtn = $("fsBtn");

// HUD
const scoreEl = $("score");
const bestEl = $("best");
const modeLabel = $("modeLabel");

// Canvas
const canvas = $("c");
const ctx = canvas.getContext("2d");
const wrap = $("gameWrap");

// Overlays
const gameOverEl = $("gameOver");
const finalScoreEl = $("finalScore");
const tapHint = $("tapHint");

// Shop UI
const previewBox = $("previewBox");
const swatches = [...document.querySelectorAll(".colorSwatch")];
const trailBtns = [...document.querySelectorAll(".trailBtn")];

// Storage keys
const KEY = "enzoDashSettings_v1";
const BEST = "enzoDashBest_v1";

// Settings (customize your box)
let settings = {
  playerColor: "#22c55e",
  trail: "dots", // none | dots | streak
};

// Game state
let running = false;
let gameOver = false;
let score = 0;
let best = Number(localStorage.getItem(BEST) || 0);

bestEl.textContent = best.toString();

// --- UI helpers ---
function showPanel(panel) {
  [menu, gamePanel, shop, credits].forEach(p => p.classList.remove("show"));
  panel.classList.add("show");
}

function saveSettings() {
  localStorage.setItem(KEY, JSON.stringify(settings));
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return;
    const obj = JSON.parse(raw);
    if (obj && typeof obj === "object") {
      settings = { ...settings, ...obj };
    }
  } catch {}
}

function applySettingsToUI() {
  previewBox.style.background = settings.playerColor;
  // highlight selected trail
  trailBtns.forEach(b => {
    const on = b.dataset.trail === settings.trail;
    b.classList.toggle("primary", on);
  });
}

loadSettings();
applySettingsToUI();

// --- Theme ---
function setTheme(isDark) {
  document.body.classList.toggle("dark", isDark);
  localStorage.setItem("enzoDashTheme", isDark ? "dark" : "light");
}

(function initTheme(){
  const t = localStorage.getItem("enzoDashTheme");
  setTheme(t === "dark");
})();

modeBtn.addEventListener("click", () => {
  setTheme(!document.body.classList.contains("dark"));
});

// --- Fullscreen ---
fsBtn.addEventListener("click", async () => {
  try {
    if (!document.fullscreenElement) {
      await wrap.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  } catch (e) {
    alert("Fullscreen not available on this device/browser.");
  }
});

// --- Navigation ---
startBtn.addEventListener("click", () => {
  showPanel(gamePanel);
  startGame();
});

shopBtn.addEventListener("click", () => showPanel(shop));
creditsBtn.addEventListener("click", () => showPanel(credits));

backBtn.addEventListener("click", () => {
  stopGame();
  showPanel(menu);
});

menuBtn2.addEventListener("click", () => {
  stopGame();
  showPanel(menu);
});

retryBtn.addEventListener("click", () => {
  showPanel(gamePanel);
  startGame();
});

shopBackBtn.addEventListener("click", () => showPanel(menu));
creditsBackBtn.addEventListener("click", () => showPanel(menu));

resetShopBtn.addEventListener("click", () => {
  settings.playerColor = "#22c55e";
  settings.trail = "dots";
  saveSettings();
  applySettingsToUI();
});

// --- Shop events ---
swatches.forEach(btn => {
  btn.addEventListener("click", () => {
    settings.playerColor = btn.dataset.color;
    saveSettings();
    applySettingsToUI();
  });
});

trailBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    settings.trail = btn.dataset.trail;
    saveSettings();
    applySettingsToUI();
  });
});

// --- Canvas sizing ---
function resizeCanvas() {
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.floor(rect.width * dpr);
  canvas.height = Math.floor(rect.height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // draw in CSS pixels
}
window.addEventListener("resize", resizeCanvas);

// --- Simple runner gameplay ---
const GROUND_RATIO = 0.78; // where the ground line is
let W = 0, H = 0;

// Player
const player = {
  x: 120,
  y: 0,
  size: 34,
  vy: 0,
  onGround: true,
  rot: 0
};

// Physics
const gravity = 0.95;
const jumpVel = -15.2;

// World
let speed = 6.2;
let t = 0;

// Obstacles (spikes)
let obstacles = [];
let spawnTimer = 0;

// Trail particles
let trail = [];

// Input
function doJump() {
  if (!running || gameOver) return;
  if (player.onGround) {
    player.vy = jumpVel;
    player.onGround = false;
  }
}

// Keyboard/mouse/touch
window.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    e.preventDefault();
    if (!running) return;
    if (gameOver) return;
    doJump();
  }
});

wrap.addEventListener("pointerdown", () => {
  if (!running) return;
  if (gameOver) return;
  doJump();
});

// Start/Stop
let rafId = null;

function startGame() {
  resizeCanvas();
  W = canvas.getBoundingClientRect().width;
  H = canvas.getBoundingClientRect().height;

  running = true;
  gameOver = false;
  score = 0;
  speed = 6.2;
  t = 0;

  obstacles = [];
  spawnTimer = 0;
  trail = [];

  player.y = groundY() - player.size;
  player.vy = 0;
  player.onGround = true;
  player.rot = 0;

  scoreEl.textContent = "0";
  modeLabel.textContent = "Normal";
  tapHint.style.display = "block";

  hideGameOver();

  cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(loop);
}

function stopGame() {
  running = false;
  cancelAnimationFrame(rafId);
}

function endGame() {
  gameOver = true;
  running = true; // keep loop alive for overlay background
  tapHint.style.display = "none";

  if (score > best) {
    best = score;
    localStorage.setItem(BEST, String(best));
    bestEl.textContent = String(best);
  }

  finalScoreEl.textContent = String(score);
  showGameOver();
}

function showGameOver() {
  gameOverEl.classList.add("show");
}
function hideGameOver() {
  gameOverEl.classList.remove("show");
}

// Helpers
function groundY() {
  return Math.floor(H * GROUND_RATIO);
}

function spawnSpike() {
  const base = 30 + Math.random() * 10;
  const spike = {
    x: W + 40,
    y: groundY(),
    w: base,
    h: base,
  };
  obstacles.push(spike);
}

function aabbCollide(px, py, ps, ox, oy, ow, oh) {
  return px < ox + ow &&
         px + ps > ox &&
         py < oy &&
         py + ps > oy - oh;
}

function addTrail() {
  if (settings.trail === "none") return;
  const p = {
    x: player.x + player.size/2,
    y: player.y + player.size/2,
    r: settings.trail === "dots" ? 4 : 10,
    life: settings.trail === "dots" ? 22 : 14
  };
  trail.push(p);
  if (trail.length > 120) trail.shift();
}

function updateTrail() {
  for (const p of trail) p.life -= 1;
  trail = trail.filter(p => p.life > 0);
}

function drawTrail() {
  if (settings.trail === "none") return;

  for (const p of trail) {
    const alpha = Math.max(0, Math.min(1, p.life / 22));
    ctx.globalAlpha = settings.trail === "dots" ? alpha : alpha * 0.55;

    // draw circles
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r * (settings.trail === "streak" ? 0.75 : 1), 0, Math.PI * 2);
    ctx.fillStyle = settings.playerColor;
    ctx.fill();

    if (settings.trail === "streak") {
      ctx.globalAlpha = alpha * 0.25;
      ctx.fillRect(p.x - 22, p.y - 4, 18, 8);
    }
  }
  ctx.globalAlpha = 1;
}

function drawBackground() {
  // Simple parallax grid + ground
  ctx.clearRect(0, 0, W, H);

  // sky-ish
  const isDark = document.body.classList.contains("dark");
  ctx.fillStyle = isDark ? "rgba(2,6,23,0.35)" : "rgba(255,255,255,0.4)";
  ctx.fillRect(0, 0, W, H);

  // faint grid
  ctx.strokeStyle = isDark ? "rgba(226,232,240,0.08)" : "rgba(15,23,42,0.08)";
  ctx.lineWidth = 1;

  const grid = 40;
  const offset = (t * speed * 0.35) % grid;
  for (let x = -grid; x < W + grid; x += grid) {
    ctx.beginPath();
    ctx.moveTo(x - offset, 0);
    ctx.lineTo(x - offset, H);
    ctx.stroke();
  }

  // ground
  const gy = groundY();
  ctx.fillStyle = isDark ? "rgba(15,23,42,0.75)" : "rgba(15,23,42,0.06)";
  ctx.fillRect(0, gy, W, H - gy);

  // ground line
  ctx.strokeStyle = isDark ? "rgba(96,165,250,0.55)" : "rgba(37,99,235,0.35)";
  ctx.beginPath();
  ctx.moveTo(0, gy);
  ctx.lineTo(W, gy);
  ctx.stroke();
}

function drawSpike(o) {
  // draw a triangle spike
  ctx.fillStyle = "rgba(239,68,68,0.95)";
  ctx.beginPath();
  ctx.moveTo(o.x, o.y);
  ctx.lineTo(o.x + o.w/2, o.y - o.h);
  ctx.lineTo(o.x + o.w, o.y);
  ctx.closePath();
  ctx.fill();

  // outline
  ctx.strokeStyle = "rgba(15,23,42,0.25)";
  ctx.stroke();
}

function drawPlayer() {
  const s = player.size;
  const cx = player.x + s/2;
  const cy = player.y + s/2;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(player.rot);

  // body
  ctx.fillStyle = settings.playerColor;
  ctx.strokeStyle = "rgba(15,23,42,0.25)";
  ctx.lineWidth = 2;
  roundRect(ctx, -s/2, -s/2, s, s, 10);
  ctx.fill();
  ctx.stroke();

  // face (cute)
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

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w/2, h/2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

// Difficulty ramp
function updateDifficulty() {
  // Increase speed slowly, and slightly increase spawn rate
  speed = Math.min(13, speed + 0.0022);
  const m = speed > 9.5 ? "Fast" : "Normal";
  modeLabel.textContent = m;
}

function loop() {
  if (!running) return;

  // Update sizes (in case of resize)
  W = canvas.getBoundingClientRect().width;
  H = canvas.getBoundingClientRect().height;

  t++;

  drawBackground();

  // Spawn spikes
  spawnTimer -= 1;
  if (spawnTimer <= 0 && !gameOver) {
    spawnSpike();
    // spawn delay: decreases as speed rises
    const minDelay = 52;
    const maxDelay = 92;
    const sFactor = Math.max(0, (speed - 6) / 7); // 0..1
    spawnTimer = Math.floor(maxDelay - (maxDelay - minDelay) * sFactor + Math.random() * 18);
  }

  // Move obstacles
  for (const o of obstacles) o.x -= speed;
  obstacles = obstacles.filter(o => o.x + o.w > -50);

  // Physics
  if (!gameOver) {
    player.vy += gravity;
    player.y += player.vy;

    const gy = groundY();
    if (player.y + player.size >= gy) {
      player.y = gy - player.size;
      player.vy = 0;
      player.onGround = true;
    }

    // rotation like GD
    if (!player.onGround) player.rot += 0.14;
    else player.rot *= 0.85;

    // Score
    score += 1;
    scoreEl.textContent = String(score);

    // Difficulty
    updateDifficulty();

    // Trail
    addTrail();
    updateTrail();

    // Collision
    for (const o of obstacles) {
      if (aabbCollide(player.x, player.y, player.size, o.x, o.y, o.w, o.h)) {
        endGame();
        break;
      }
    }
  } else {
    // still animate trail faintly
    updateTrail();
  }

  // Draw trail behind
  drawTrail();

  // Draw obstacles + player
  for (const o of obstacles) drawSpike(o);
  drawPlayer();

  // Hide hint after a bit
  if (t > 150) tapHint.style.display = "none";

  rafId = requestAnimationFrame(loop);
}

// Start on menu
showPanel(menu);
