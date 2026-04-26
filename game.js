// =========================
// CLEAN GAME CORE (FIXED)
// =========================

let cameraX = 0;
let running = false;
let dead = false;

let score = 0;
let runCoins = 0;

const PLAYER_SCREEN_X_RATIO = 0.3;

// Player (NO fixed world X anymore)
const player = {
  y: 0,
  size: 34,
  vy: 0,
  onGround: true,
  rot: 0
};

function playerWorldX(){
  return cameraX + W * PLAYER_SCREEN_X_RATIO;
}

function groundY(){
  return Math.floor(H * 0.78);
}

// =========================
// START GAME
// =========================
function startLevel1(){
  resizeCanvas();
  W = canvas.getBoundingClientRect().width;
  H = canvas.getBoundingClientRect().height;

  running = true;
  dead = false;

  cameraX = 0;
  score = 0;
  runCoins = 0;

  player.y = groundY() - player.size;
  player.vy = 0;
  player.onGround = true;
  player.rot = 0;

  buildLevelEntities();

  cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(loop);
}

// =========================
// GAME LOOP
// =========================
let lastTime = 0;

function loop(ts){
  if(!running) return;

  if(!lastTime) lastTime = ts;
  const dt = Math.min(0.033, (ts - lastTime) / 1000);
  lastTime = ts;

  W = canvas.getBoundingClientRect().width;
  H = canvas.getBoundingClientRect().height;

  const speed = pxPerSec();

  if(!dead){
    // ✅ MOVE CAMERA
    cameraX += speed * dt;

    // ✅ SCORE
    score += Math.floor(speed * dt * 0.12);
    scoreEl.textContent = String(score);

    // ✅ PHYSICS
    player.vy += GRAVITY;
    player.y += player.vy;

    const gy = groundY();
    if(player.y + player.size >= gy){
      player.y = gy - player.size;
      player.vy = 0;
      player.onGround = true;
    } else {
      player.onGround = false;
    }

    // rotation
    if(!player.onGround) player.rot += 0.14;
    else player.rot *= 0.85;

    collectCoins();
    if(checkCollisions()) endGame();
  }

  drawBackground();

  // draw world
  for(const b of bumpRects) drawBump(b);
  for(const c of coinOrbs) drawCoin(c);
  for(const s of spikeRects) drawSpike(s.x);

  drawPlayer();

  rafId = requestAnimationFrame(loop);
}

// =========================
// DRAW PLAYER (FIXED)
// =========================
function drawPlayer(){
  const s = player.size;

  // ✅ FIXED SCREEN POSITION
  const cx = W * PLAYER_SCREEN_X_RATIO + s/2;
  const cy = player.y + s/2;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(player.rot);

  ctx.fillStyle = currentSkinColor();
  roundRect(-s/2, -s/2, s, s, 10);
  ctx.fill();

  ctx.restore();
}

// =========================
// COLLISIONS (FIXED)
// =========================
function checkCollisions(){
  const px = playerWorldX();

  for(const s of spikeRects){
    if(aabb(px, player.y, player.size, s.x, groundY(), TILE, TILE)){
      return true;
    }
  }

  return false;
}

// =========================
// COINS (FIXED)
// =========================
function collectCoins(){
  const px = playerWorldX();
  const py = player.y;
  const ps = player.size;

  for(const c of coinOrbs){
    if(c.taken) continue;

    const dx = (px + ps/2) - c.x;
    const dy = (py + ps/2) - (groundY() - c.yTiles * TILE);

    if(Math.hypot(dx, dy) < c.r + ps*0.35){
      c.taken = true;
      runCoins++;
      coinsEl.textContent = runCoins;
    }
  }
}
