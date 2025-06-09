const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const leftBtn = document.getElementById("leftBtn");
const rightBtn = document.getElementById("rightBtn");
const restartBtn = document.getElementById("restartBtn");

// Загрузка картинок
const roadImg = new Image();
roadImg.src = "images/road.png";

const playerImg = new Image();
playerImg.src = "images/car_red.png";

const enemyImg = new Image();
enemyImg.src = "images/car_yellow.png";

let roadY = 0;

// Натуральные размеры картинок
let playerNaturalWidth = 0;
let playerNaturalHeight = 0;
let enemyNaturalWidth = 0;
let enemyNaturalHeight = 0;

// Ширина полосы
const laneWidth = 100;
const targetCarWidth = laneWidth * 0.9;

let player = {
  x: 180,
  y: 500,
  width: targetCarWidth,
  height: 0,
  speed: 5,
  movingLeft: false,
  movingRight: false
};

let enemy = {
  x: Math.random() * (canvas.width - targetCarWidth),
  y: -100,
  width: targetCarWidth,
  height: 0,
  speed: 4
};

let lives = 3;
let score = 0;
let gameOver = false;

let crashAnimation = false;   // флаг анимации аварии
let crashTimer = 0;
const crashDuration = 1000; // длительность анимации аварии в мс

// Клавиши
const keys = {};
window.addEventListener("keydown", e => {
  keys[e.key] = true;
  updatePlayerMovement();
});
window.addEventListener("keyup", e => {
  keys[e.key] = false;
  updatePlayerMovement();
});

// Кнопки управления
leftBtn.addEventListener("mousedown", () => { player.movingLeft = true; });
leftBtn.addEventListener("mouseup", () => { player.movingLeft = false; });
leftBtn.addEventListener("touchstart", e => { e.preventDefault(); player.movingLeft = true; });
leftBtn.addEventListener("touchend", e => { e.preventDefault(); player.movingLeft = false; });

rightBtn.addEventListener("mousedown", () => { player.movingRight = true; });
rightBtn.addEventListener("mouseup", () => { player.movingRight = false; });
rightBtn.addEventListener("touchstart", e => { e.preventDefault(); player.movingRight = true; });
rightBtn.addEventListener("touchend", e => { e.preventDefault(); player.movingRight = false; });

restartBtn.addEventListener("click", () => {
  lives = 3;
  score = 0;
  gameOver = false;
  crashAnimation = false;
  player.x = 180;
  resetEnemy();
  restartBtn.style.display = "none";
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

function checkCollision(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function update(deltaTime) {
  if (crashAnimation) {
    // Пока идёт анимация аварии, не двигаем игрока и врага
    crashTimer += deltaTime;
    if (crashTimer >= crashDuration) {
      crashAnimation = false;
      crashTimer = 0;
      lives--;
      if (lives === 0) {
        gameOver = true;
        restartBtn.style.display = "block";
      } else {
        resetEnemy();
        player.x = 180;
        player.y = 500;
      }
    }
    return;
  }

  // Если нет анимации аварии — управление обычное
  if (player.movingLeft && player.x > 0) player.x -= player.speed;
  if (player.movingRight && player.x < canvas.width - player.width) player.x += player.speed;

  enemy.y += enemy.speed;
  if (enemy.y > canvas.height) {
    resetEnemy();
    score++;
  }

  if (checkCollision(player, enemy)) {
    crashAnimation = true;
    crashTimer = 0;
  }

  roadY += 5;
  if (roadY >= canvas.height) {
    roadY = 0;
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Рисуем дорогу
  ctx.drawImage(roadImg, 0, roadY - canvas.height, canvas.width, canvas.height);
  ctx.drawImage(roadImg, 0, roadY, canvas.width, canvas.height);

  // Анимация аварии — мигание красным (каждые 200 мс)
  let drawPlayerNormally = true;
  if (crashAnimation) {
    const blinkPeriod = 200;
    const blinkPhase = Math.floor(crashTimer / blinkPeriod) % 2;
    drawPlayerNormally = blinkPhase === 0;
  }

  // Рисуем игрока
  if (playerNaturalWidth && playerNaturalHeight) {
    const scalePlayer = targetCarWidth / playerNaturalWidth;
    const carHeight = playerNaturalHeight * scalePlayer;
    player.height = carHeight;

    if (drawPlayerNormally) {
      ctx.drawImage(playerImg, player.x, player.y, targetCarWidth, carHeight);
    } else {
      // Рисуем красный прямоугольник вместо машины — эффект аварии
      ctx.fillStyle = "rgba(255, 0, 0, 0.7)";
      ctx.fillRect(player.x, player.y, targetCarWidth, carHeight);
    }
  } else {
    ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);
  }

  // Рисуем врага
  if (enemyNaturalWidth && enemyNaturalHeight) {
    const scaleEnemy = targetCarWidth / enemyNaturalWidth;
    const carHeight = enemyNaturalHeight * scaleEnemy;
    enemy.height = carHeight;
    ctx.drawImage(enemyImg, enemy.x, enemy.y, targetCarWidth, carHeight);
  } else {
    ctx.drawImage(enemyImg, enemy.x, enemy.y, enemy.width, enemy.height);
  }

  // Жизни и счет
  ctx.fillStyle = "white";
  ctx.font = "20px Arial";
  ctx.fillText(`❤️ Lives: ${lives}`, 10, 30);
  ctx.fillText(`⭐ Score: ${score}`, 10, 60);

  if (gameOver) {
    ctx.fillStyle = "red";
    ctx.font = "50px Arial";
    ctx.fillText("Game Over", 90, 300);
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

function assetLoaded() {
  playerNaturalWidth = playerImg.naturalWidth;
  playerNaturalHeight = playerImg.naturalHeight;
  enemyNaturalWidth = enemyImg.naturalWidth;
  enemyNaturalHeight = enemyImg.naturalHeight;

  const scalePlayer = targetCarWidth / playerNaturalWidth;
  player.height = playerNaturalHeight * scalePlayer;

  const scaleEnemy = targetCarWidth / enemyNaturalWidth;
  enemy.height = enemyNaturalHeight * scaleEnemy;

  gameLoop();
}

let assetsLoaded = 0;
const totalAssets = 3;

function checkAllAssetsLoaded() {
  assetsLoaded++;
  if (assetsLoaded === totalAssets) {
    assetLoaded();
  }
}

roadImg.onload = checkAllAssetsLoaded;
playerImg.onload = checkAllAssetsLoaded;
enemyImg.onload = checkAllAssetsLoaded;
