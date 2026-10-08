const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const quizScreen = document.getElementById('quizScreen');
const scoreBox = document.getElementById('scoreBox');
const timeBox = document.getElementById('timeBox');
const finalScoreText = document.getElementById('finalScoreText');

const startButton = document.getElementById('startButton');
const restartButton = document.getElementById('restartButton');
const answerButton = document.getElementById('quizAnswerButton');
const choicesContainer = document.getElementById('choices');
const quizQuestion = document.getElementById('quizQuestion');
const quizFeedback = document.getElementById('quizFeedback');

let gameState = 'menu';
let lastTime = 0;
let score = 0;
let elapsed = 0;
let spawnTimer = 0;
let difficulty = 1;
let difficultyMode = 'normal'; // 'normal' or 'hard'

const game = {
  width: canvas.width,
  height: canvas.height,
  gravity: 1200,
  platforms: [],
  player: {
    x: 80,
    y: 0,
    width: 40,
    height: 48,
    vy: 0,
    jumpForce: 650,
    onGround: true,
    color: '#FFD700',
    eyeX: 12,
    eyeY: 12
  },
  monsters: [],
  particles: [],
  quizQuestionIndex: 0,
  pausedForQuiz: false,
  quizAttempts: 0
};

const quizQuestions = [
  {
    term: 'Force',
    question: 'What is the definition of force?',
    choices: [
      'A push or pull acting on an object.',
      'The rate at which velocity changes.',
      'The tendency of an object to resist motion changes.',
      'The distance traveled in a certain amount of time.'
    ],
    correctIndex: 0,
    clue: 'A student used force to push the skateboard forward.'
  },
  {
    term: 'Friction',
    question: 'What is the definition of friction?',
    choices: [
      'The distance an object travels in a certain time.',
      'A force that opposes motion between two surfaces.',
      'The speed of an object in a specific direction.',
      'A push or pull acting on an object.'
    ],
    correctIndex: 1,
    clue: 'The friction between the shoes and the floor helped stop the runner.'
  },
  {
    term: 'Inertia',
    question: 'What is the definition of inertia?',
    choices: [
      'The tendency of an object to resist a change in its motion.',
      'The force between two surfaces that touch.',
      'The direction an object moves.',
      'How much mass an object has.'
    ],
    correctIndex: 0,
    clue: 'Because of inertia, the book stayed still until someone moved it.'
  },
  {
    term: 'Speed',
    question: 'What is the definition of speed?',
    choices: [
      'The rate at which velocity changes.',
      'The distance traveled in a certain amount of time.',
      'The tendency of an object to resist a change in motion.',
      'A force that opposes motion.'
    ],
    correctIndex: 1,
    clue: 'The cyclist rode at a speed of 20 miles per hour.'
  },
  {
    term: 'Velocity',
    question: 'What is the definition of velocity?',
    choices: [
      'The distance traveled in a certain time.',
      'The resistance between two moving surfaces.',
      'Speed in a specific direction.',
      'A push or pull acting on an object.'
    ],
    correctIndex: 2,
    clue: 'The car had a velocity of 50 kilometers per hour north.'
  },
  {
    term: 'Acceleration',
    question: 'What is the definition of acceleration?',
    choices: [
      'The amount of matter in an object.',
      'The tendency to resist motion changes.',
      'The rate at which velocity changes.',
      'The distance traveled by an object.'
    ],
    correctIndex: 2,
    clue: 'The skateboarder sped up, so there was acceleration.'
  }
];

function getRandomQuestion() {
  return quizQuestions[Math.floor(Math.random() * quizQuestions.length)];
}

function createPlatforms() {
  game.platforms = [
    { x: 0, y: 650, width: 1280, height: 70, color: '#4CAF50', isGround: true },
    { x: 100, y: 550, width: 250, height: 20, color: '#66BB6A', isGround: false },
    { x: 500, y: 480, width: 250, height: 20, color: '#66BB6A', isGround: false },
    { x: 900, y: 420, width: 250, height: 20, color: '#66BB6A', isGround: false },
    { x: 250, y: 350, width: 200, height: 20, color: '#81C784', isGround: false },
    { x: 750, y: 280, width: 200, height: 20, color: '#81C784', isGround: false }
  ];
}

function resetGame() {
  score = 0;
  elapsed = 0;
  spawnTimer = 0;
  difficulty = 1;
  game.monsters = [];
  game.quizAttempts = 0;
  game.player.x = 80;
  game.player.y = 0;
  game.player.vy = 0;
  game.player.onGround = false;
  game.pausedForQuiz = false;
  createPlatforms();
  updateHUD();
}

function updateHUD() {
  scoreBox.textContent = `Score: ${Math.floor(score)}`;
  timeBox.textContent = `Time: ${Math.floor(elapsed)}s | Difficulty: ${difficultyMode.toUpperCase()}`;
}

function startGame(mode = 'normal') {
  difficultyMode = mode;
  resetGame();
  gameState = 'playing';
  startScreen.classList.add('hidden');
  gameOverScreen.classList.add('hidden');
  quizScreen.classList.remove('visible');
  answerButton.disabled = false;
  quizFeedback.textContent = '';
  lastTime = 0;
  requestAnimationFrame(gameLoop);
}

function showGameOver() {
  gameState = 'over';
  finalScoreText.textContent = `Final Score: ${Math.floor(score)}`;
  gameOverScreen.classList.remove('hidden');
}

function generateMonster() {
  const platformIndex = Math.floor(Math.random() * (game.platforms.length - 1)) + 1;
  const platform = game.platforms[platformIndex];
  
  let baseSpeed = difficultyMode === 'hard' ? 350 : 280;
  let diffMultiplier = difficultyMode === 'hard' ? 1.15 : 1.08;
  
  const monster = {
    x: canvas.width + 50,
    y: platform.y - 50,
    width: 45,
    height: 50,
    vy: 0,
    onGround: false,
    speed: baseSpeed + (difficulty * diffMultiplier),
    color: ['#e74c3c', '#9b59b6', '#1abc9c', '#e67e22'][Math.floor(Math.random() * 4)],
    hasTriggered: false,
    currentPlatform: null,
    jumpTimer: 0,
    direction: -1
  };
  game.monsters.push(monster);
}

function handleJump() {
  if (gameState !== 'playing') return;
  if (game.player.onGround) {
    game.player.vy = -game.player.jumpForce;
    game.player.onGround = false;
  }
}

function triggerQuiz() {
  if (game.pausedForQuiz) return;
  game.pausedForQuiz = true;
  gameState = 'quiz';
  game.quizAttempts = 0;
  showQuestion();
}

function showQuestion() {
  const q = getRandomQuestion();

  quizQuestion.textContent = q.question;
  choicesContainer.innerHTML = '';

  q.choices.forEach((choiceText, index) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'choice';
    btn.textContent = choiceText;
    btn.addEventListener('click', () => {
      document.querySelectorAll('.choice').forEach((item) => item.classList.remove('selected'));
      btn.classList.add('selected');
      btn.dataset.index = String(index);
    });
    choicesContainer.appendChild(btn);
  });

  quizFeedback.textContent = '';
  answerButton.dataset.correctIndex = String(q.correctIndex);
  answerButton.dataset.clue = q.clue;
  answerButton.disabled = false;
  quizScreen.classList.add('visible');
}

function evaluateAnswer() {
  const selected = document.querySelector('.choice.selected');
  const correctIndex = Number(answerButton.dataset.correctIndex);
  const clue = answerButton.dataset.clue || '';

  if (!selected) {
    quizFeedback.textContent = 'Please choose an answer.';
    return;
  }

  const selectedIndex = Number(selected.dataset.index);
  const allChoices = document.querySelectorAll('.choice');

  allChoices.forEach((choice, idx) => {
    choice.disabled = true;
    if (idx === correctIndex) choice.classList.add('correct');
    if (idx === selectedIndex && idx !== correctIndex) choice.classList.add('incorrect');
  });

  answerButton.disabled = true;

  if (selectedIndex === correctIndex) {
    quizFeedback.textContent = 'Correct! Great job! 🎉';
    score += 50;
    updateHUD();
    
    setTimeout(() => {
      quizScreen.classList.remove('visible');
      game.pausedForQuiz = false;
      gameState = 'playing';
      
      // Reset player position to ground
      game.player.y = game.platforms[0].y - game.player.height;
      game.player.vy = 0;
      game.player.onGround = true;
      
      // Remove triggered monsters
      game.monsters = game.monsters.filter((m) => !m.hasTriggered);
      
      requestAnimationFrame(gameLoop);
    }, 1800);
  } else {
    quizFeedback.textContent = 'Not quite. Clue: ' + clue;
    score = Math.max(0, score - 20);
    updateHUD();
    
    setTimeout(() => {
      quizScreen.classList.remove('visible');
      game.pausedForQuiz = false;
      gameState = 'playing';
      
      // Reset player position to ground
      game.player.y = game.platforms[0].y - game.player.height;
      game.player.vy = 0;
      game.player.onGround = true;
      
      // Remove triggered monsters
      game.monsters = game.monsters.filter((m) => !m.hasTriggered);
      
      requestAnimationFrame(gameLoop);
    }, 1800);
  }
}

function checkPlatformCollision(x, y, width, height) {
  for (const platform of game.platforms) {
    if (
      x + width > platform.x &&
      x < platform.x + platform.width &&
      y + height >= platform.y &&
      y + height <= platform.y + 25 &&
      game.player.vy >= 0
    ) {
      return { platform, onGround: true };
    }
  }
  return null;
}

function checkMonsterPlatformCollision(monster) {
  for (const platform of game.platforms) {
    if (
      monster.x + monster.width > platform.x &&
      monster.x < platform.x + platform.width &&
      monster.y + monster.height >= platform.y &&
      monster.y + monster.height <= platform.y + 25 &&
      monster.vy >= 0
    ) {
      return platform;
    }
  }
  return null;
}

function update(delta) {
  if (gameState !== 'playing') return;

  elapsed += delta;
  score += delta * 10;
  
  const difficultyLevel = 1 + Math.floor(elapsed / 15);
  difficulty = difficultyLevel;

  // Update player
  game.player.vy += game.gravity * delta;
  game.player.y += game.player.vy * delta;

  // Check platform collision for player
  const collision = checkPlatformCollision(game.player.x, game.player.y, game.player.width, game.player.height);
  if (collision) {
    game.player.y = collision.platform.y - game.player.height;
    game.player.vy = 0;
    game.player.onGround = true;
  } else {
    game.player.onGround = false;
  }

  // Kill player if falls off screen
  if (game.player.y > canvas.height) {
    showGameOver();
    return;
  }

  // Spawn monsters
  spawnTimer += delta;
  const spawnRate = difficultyMode === 'hard' ? 1.8 : 2.5;
  if (spawnTimer >= Math.max(1.0, spawnRate - difficultyLevel * 0.15)) {
    spawnTimer = 0;
    generateMonster();
  }

  // Update monsters
  for (let i = game.monsters.length - 1; i >= 0; i--) {
    const monster = game.monsters[i];
    
    monster.vy += game.gravity * delta;
    monster.y += monster.vy * delta;
    monster.x += monster.direction * monster.speed * delta;

    // Monster platform collision
    const monsterPlatform = checkMonsterPlatformCollision(monster);
    if (monsterPlatform) {
      monster.y = monsterPlatform.y - monster.height;
      monster.vy = 0;
      monster.onGround = true;
      monster.currentPlatform = monsterPlatform;
      
      // Monster jumps randomly
      monster.jumpTimer -= delta;
      if (monster.jumpTimer <= 0) {
        monster.vy = -580;
        monster.onGround = false;
        monster.jumpTimer = 1.5 + Math.random() * 1;
      }
    } else {
      monster.onGround = false;
    }

    // Remove if off screen
    if (monster.x < -100 || monster.y > canvas.height) {
      game.monsters.splice(i, 1);
      continue;
    }

    // Check collision with player
    if (!monster.hasTriggered) {
      const monsterRect = {
        x: monster.x,
        y: monster.y,
        width: monster.width,
        height: monster.height
      };

      const playerRect = {
        x: game.player.x,
        y: game.player.y,
        width: game.player.width,
        height: game.player.height
      };

      const intersects = playerRect.x < monsterRect.x + monsterRect.width &&
        playerRect.x + playerRect.width > monsterRect.x &&
        playerRect.y < monsterRect.y + monsterRect.height &&
        playerRect.y + playerRect.height > monsterRect.y;

      if (intersects) {
        monster.hasTriggered = true;
        triggerQuiz();
        break;
      }
    }
  }

  updateHUD();
}

function drawBackground() {
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, '#87CEEB');
  gradient.addColorStop(1, '#E0F6FF');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Clouds
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  for (let i = 0; i < 5; i++) {
    const x = (i * 300 + (elapsed * 30) % 300) % (canvas.width + 100);
    const y = 80 + (i * 50) % 150;
    ctx.beginPath();
    ctx.arc(x, y, 30, 0, Math.PI * 2);
    ctx.arc(x + 40, y - 10, 40, 0, Math.PI * 2);
    ctx.arc(x + 80, y, 30, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPlatforms() {
  for (const platform of game.platforms) {
    ctx.fillStyle = platform.color;
    ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
    
    // Platform detail
    ctx.fillStyle = platform.isGround ? '#2d5016' : '#2e7d32';
    for (let x = platform.x; x < platform.x + platform.width; x += 40) {
      ctx.fillRect(x, platform.y + platform.height - 8, 30, 8);
    }
  }
}

function drawPlayer() {
  const { x, y, width, height } = game.player;
  
  // Body
  ctx.fillStyle = game.player.color;
  ctx.beginPath();
  ctx.moveTo(x + width / 2, y);
  ctx.lineTo(x + width, y + height * 0.6);
  ctx.lineTo(x + width, y + height);
  ctx.lineTo(x, y + height);
  ctx.lineTo(x, y + height * 0.6);
  ctx.closePath();
  ctx.fill();
  
  // Head
  ctx.fillStyle = game.player.color;
  ctx.beginPath();
  ctx.arc(x + width / 2, y + 10, 12, 0, Math.PI * 2);
  ctx.fill();
  
  // Eyes
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(x + width / 2 - 6, y + 8, 3, 0, Math.PI * 2);
  ctx.arc(x + width / 2 + 6, y + 8, 3, 0, Math.PI * 2);
  ctx.fill();
  
  // Mouth
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x + width / 2, y + 12, 3, 0, Math.PI);
  ctx.stroke();
  
  // Arms
  ctx.strokeStyle = game.player.color;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x + 2, y + height * 0.4);
  ctx.lineTo(x - 8, y + height * 0.3);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + width - 2, y + height * 0.4);
  ctx.lineTo(x + width + 8, y + height * 0.3);
  ctx.stroke();
}

function drawMonster(monster) {
  const { x, y, width, height } = monster;
  
  // Body
  ctx.fillStyle = monster.color;
  ctx.fillRect(x, y + 10, width, height - 10);
  
  // Head
  ctx.beginPath();
  ctx.arc(x + width / 2, y + 8, 12, 0, Math.PI * 2);
  ctx.fill();
  
  // Eyes
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(x + width / 2 - 6, y + 5, 4, 0, Math.PI * 2);
  ctx.arc(x + width / 2 + 6, y + 5, 4, 0, Math.PI * 2);
  ctx.fill();
  
  // Pupils
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(x + width / 2 - 6, y + 6, 2, 0, Math.PI * 2);
  ctx.arc(x + width / 2 + 6, y + 6, 2, 0, Math.PI * 2);
  ctx.fill();
  
  // Mouth
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + width / 2 - 4, y + 12);
  ctx.lineTo(x + width / 2 + 4, y + 12);
  ctx.stroke();
  
  // Spikes
  ctx.fillStyle = monster.color;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(x + 5 + i * 15, y);
    ctx.lineTo(x + 10 + i * 15, y - 8);
    ctx.lineTo(x + 15 + i * 15, y);
    ctx.closePath();
    ctx.fill();
  }
}

function draw() {
  drawBackground();
  drawPlatforms();

  if (gameState === 'playing' || gameState === 'quiz') {
    for (const monster of game.monsters) {
      drawMonster(monster);
    }
    drawPlayer();
  }
}

function gameLoop(timestamp) {
  if (!lastTime) lastTime = timestamp;
  const delta = Math.min((timestamp - lastTime) / 1000, 0.032);
  lastTime = timestamp;

  if (gameState === 'playing') {
    update(delta);
  }

  draw();

  if (gameState === 'playing' || gameState === 'menu') {
    requestAnimationFrame(gameLoop);
  }
}

window.addEventListener('keydown', (event) => {
  if (event.code === 'Space' || event.code === 'ArrowUp' || event.code === 'KeyW') {
    event.preventDefault();
    handleJump();
  }
});

startButton.addEventListener('click', () => startGame('normal'));
restartButton.addEventListener('click', () => {
  gameOverScreen.classList.add('hidden');
  startGame(difficultyMode);
});
answerButton.addEventListener('click', evaluateAnswer);

resetGame();
startScreen.classList.remove('hidden');
quizScreen.classList.remove('visible');
requestAnimationFrame(gameLoop);
