const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const leftBtn = document.getElementById("leftBtn");
const rightBtn = document.getElementById("rightBtn");
const restartBtn = document.getElementById("restartBtn");

const engineSound = document.getElementById("engineSound");
const crashSound = document.getElementById("crashSound");
const bonusSound = document.getElementById("bonusSound");

const roadImg = new Image();
roadImg.src = "images/road.png";

const playerImg = new Image();
playerImg.src = "images/car_red.png";

const enemyImg = new Image();
enemyImg.src = "images/car_yellow.png";

let roadY = 0;
const laneWidth = 100;
const targetCarWidth = laneWidth * 0.9;

let player = {
  x: 180, y: 500,
  width: targetCarWidth, height: 0,
  speed: 5,
  movingLeft: false, movingRight: false
};

let enemy = {
  x: 0, y: -100,
  width: targetCarWidth, height: 0,
  speed: 4
};

let bonus = {
  x: 0, y: -300,
  radius: 20,
  type: "",
  active: false
};

const bonusTypes = ["100 points", "Health regeneration", "Rocket fast"];
let bonusTimer = 0;
let bonusMessage = "";
let pauseAfterBonus = false;

let lives = 3;
let score = 0;
let gameOver = false;
let crashAnimation = false;
let crashTimer = 0;
const crashDuration = 1000;

const keys = {};
window.addEventListener("keydown", e => { keys[e.key] = true; updatePlayerMovement(); });
window.addEventListener("keyup", e => { keys[e.key] = false; updatePlayerMovement(); });

leftBtn.addEventListener("mousedown", () => player.movingLeft = true);
leftBtn.addEventListener("mouseup", () => player.movingLeft = false);
leftBtn.addEventListener("touchstart", e => { e.preventDefault(); player.movingLeft = true; });
leftBtn.addEventListener("touchend", e => { e.preventDefault(); player.movingLeft = false; });

rightBtn.addEventListener("mousedown", () => player.movingRight = true);
rightBtn.addEventListener("mouseup", () => player.movingRight = false);
rightBtn.addEventListener("touchstart", e => { e.preventDefault(); player.movingRight = true; });
rightBtn.addEventListener("touchend", e => { e.preventDefault(); player.movingRight = false; });

restartBtn.addEventListener("click", () => {
  lives = 3;
  score = 0;
  gameOver = false;
  crashAnimation = false;
  bonus.active = false;
  player.x = 180;
  player.speed = 5;
  resetEnemy();
  restartBtn.style.display = "none";
  engineSound.play();
});

function updatePlayerMovement() {
  player.movingLeft = keys["ArrowLeft"] || player.movingLeft;
  player.movingRight = keys["ArrowRight"] || player.movingRight;
}

function resetEnemy() {
  enemy.x = Math.random() * (canvas.width - enemy.width);
  enemy.y = -100;
  enemy.speed = 4 + Math.random() * 2;
}

function spawnBonus() {
  bonus.active = true;
  bonus.x = Math.random() * (canvas.width - bonus.radius * 2) + bonus.radius;
  bonus.y = -100;
  bonus.type = bonusTypes[Math.floor(Math.random() * bonusTypes.length)];
}

function applyBonus(type) {
  pauseAfterBonus = true;
  bonusMessage = type;
  bonusSound.play();
  setTimeout(() => {
    pauseAfterBonus = false;
    bonusMessage = "";
  }, 1500);

  if (type === "100 points") score += 100;
  else if (type === "Health regeneration" && lives < 3) lives++;
  else if (type === "Rocket fast") player.speed = 10;
}

function checkCollision(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function checkCircleCollision(circle, rect) {
  let distX = Math.abs(circle.x - rect.x - rect.width / 2);
  let distY = Math.abs(circle.y - rect.y - rect.height / 2);
  if (distX > (rect.width / 2 + circle.radius)) return false;
  if (distY > (rect.height / 2 + circle.radius)) return false;
  return true;
}

function update(deltaTime) {
  if (pauseAfterBonus) return;

  if (crashAnimation) {
    crashTimer += deltaTime;
    if (crashTimer >= crashDuration) {
      crashAnimation = false;
      crashTimer = 0;
      lives--;
      if (lives === 0) {
        gameOver = true;
        engineSound.pause();
        restartBtn.style.display = "block";
      } else {
        resetEnemy();
        player.x = 180;
        player.y = 500;
      }
    }
    return;
  }

  if (player.movingLeft && player.x > 0) player.x -= player.speed;
  if (player.movingRight && player.x < canvas.width - player.width) player.x += player.speed;

  enemy.y += enemy.speed;
  if (enemy.y > canvas.height) {
    resetEnemy();
    score++;
  }

  // Сундуки
  if (!bonus.active && Math.random() < 0.005) spawnBonus();

  if (bonus.active) {
    bonus.y += 3;
    if (checkCircleCollision(bonus, player)) {
      applyBonus(bonus.type);
      bonus.active = false;
    } else if (bonus.y > canvas.height) {
      bonus.active = false;
    }
  }

  if (checkCollision(player, enemy)) {
    crashAnimation = true;
    crashTimer = 0;
    crashSound.play();
  }

  roadY += 5;
  if (roadY >= canvas.height) roadY = 0;
}

function drawBonus() {
  if (!bonus.active) return;
  ctx.beginPath();
  ctx.arc(bonus.x, bonus.y, bonus.radius, 0, Math.PI * 2);
  ctx.fillStyle = "yellow";
  ctx.moveTo(bonus.x, bonus.y - bonus.radius);
  ctx.arc(bonus.x, bonus.y, bonus.radius, -Math.PI / 2, Math.PI / 2, false);
  ctx.fillStyle = "yellow";
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(bonus.x, bonus.y - bonus.radius);
  ctx.arc(bonus.x, bonus.y, bonus.radius, -Math.PI / 2, Math.PI / 2, true);
  ctx.fillStyle = "purple";
  ctx.fill();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.drawImage(roadImg, 0, roadY - canvas.height, canvas.width, canvas.height);
  ctx.drawImage(roadImg, 0, roadY, canvas.width, canvas.height);

  if (playerNaturalWidth) {
    const scale = targetCarWidth / playerNaturalWidth;
    player.height = playerNaturalHeight * scale;
    if (!crashAnimation || (Math.floor(crashTimer / 200) % 2 === 0)) {
      ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);
    } else {
      ctx.fillStyle = "rgba(255, 0, 0, 0.7)";
      ctx.fillRect(player.x, player.y, player.width, player.height);
    }
  }

  if (enemyNaturalWidth) {
    const scale = targetCarWidth / enemyNaturalWidth;
    enemy.height = enemyNaturalHeight * scale;
    ctx.drawImage(enemyImg, enemy.x, enemy.y, enemy.width, enemy.height);
  }

  drawBonus();

  ctx.fillStyle = "white";
  ctx.font = "20px 'Press Start 2P', monospace";
  ctx.fillText(`❤️ Lives: ${lives}`, 10, 30);
  ctx.fillText(`⭐ Score: ${score}`, 10, 60);

  if (gameOver) {
    ctx.fillStyle = "red";
    ctx.font = "50px 'Press Start 2P', monospace";
    ctx.fillText("Game Over", 40, 300);
  }

  if (bonusMessage) {
    ctx.fillStyle = "yellow";
    ctx.font = "24px 'Press Start 2P', monospace";
    ctx.fillText(bonusMessage, 70, 250);
  }
}

let lastTime = 0;
function gameLoop(time = 0) {
  const deltaTime = time - lastTime;
  lastTime = time;

  if (!gameOver) update(deltaTime);
  draw();
  requestAnimationFrame(gameLoop);
}

let playerNaturalWidth = 0, playerNaturalHeight = 0;
let enemyNaturalWidth = 0, enemyNaturalHeight = 0;

function assetLoaded() {
  playerNaturalWidth = playerImg.naturalWidth;
  playerNaturalHeight = playerImg.naturalHeight;
  enemyNaturalWidth = enemyImg.naturalWidth;
  enemyNaturalHeight = enemyImg.naturalHeight;
  engineSound.play();
  gameLoop();
}

let assetsLoaded = 0;
function checkAllAssetsLoaded() {
  assetsLoaded++;
  if (assetsLoaded === 3) assetLoaded();
}

roadImg.onload = checkAllAssetsLoaded;
playerImg.onload = checkAllAssetsLoaded;
enemyImg.onload = checkAllAssetsLoaded;
