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

const game = {
  width: canvas.width,
  height: canvas.height,
  gravity: 1700,
  groundY: 600,
  groundHeight: 120,
  speedBase: 420,
  speed: 420,
  player: {
    x: 120,
    y: 0,
    width: 42,
    height: 56,
    vy: 0,
    jumpForce: 720,
    onGround: true,
    color: '#ffb703'
  },
  obstacles: [],
  particles: [],
  monsterIndex: 0,
  quizQuestionIndex: 0,
  pausedForQuiz: false,
  isAnswering: false,
  questionInterval: 0,
  slideInTimer: 0
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

function resetGame() {
  score = 0;
  elapsed = 0;
  spawnTimer = 0;
  difficulty = 1;
  game.speed = game.speedBase;
  game.obstacles = [];
  game.particles = [];
  game.monsterIndex = 0;
  game.questionInterval = 0;
  game.player.x = 120;
  game.player.y = game.groundY - game.player.height;
  game.player.vy = 0;
  game.player.onGround = true;
  game.pausedForQuiz = false;
  game.isAnswering = false;
  game.slideInTimer = 0;
  updateHUD();
}

function updateHUD() {
  scoreBox.textContent = `Score: ${Math.floor(score)}`;
  timeBox.textContent = `Time: ${Math.floor(elapsed)}s`;
}

function startGame() {
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
  const height = 40 + Math.random() * 38;
  const monster = {
    x: canvas.width + 50,
    y: game.groundY - height,
    width: 48,
    height,
    speed: game.speed + 30 + Math.random() * 70,
    color: ['#5f0f40', '#7b2cbf', '#2a9d8f', '#ef476f'][Math.floor(Math.random() * 4)],
    hasTriggered: false,
    kind: 'monster'
  };
  game.obstacles.push(monster);
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
  showQuestion();
}

function showQuestion() {
  const q = quizQuestions[game.quizQuestionIndex % quizQuestions.length];
  game.quizQuestionIndex += 1;

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
    quizFeedback.textContent = 'Correct! Great job!';
    score += 40;
    updateHUD();
  } else {
    quizFeedback.textContent = 'Not quite. Sentence clue: ' + clue;
    score = Math.max(0, score - 15);
    updateHUD();
  }

  setTimeout(() => {
    quizScreen.classList.remove('visible');
    game.pausedForQuiz = false;
    gameState = 'playing';
    game.player.y = game.groundY - game.player.height;
    game.player.vy = 0;
    game.player.onGround = true;
    game.obstacles = game.obstacles.filter((obstacle) => !obstacle.hasTriggered);
  }, 1600);
}

function update(delta) {
  if (gameState !== 'playing') return;

  elapsed += delta;
  score += delta * 8;

  const difficultyLevel = 1 + Math.floor(elapsed / 12);
  game.speed = game.speedBase + difficultyLevel * 16;

  game.player.vy += game.gravity * delta;
  game.player.y += game.player.vy * delta;

  if (game.player.y >= game.groundY - game.player.height) {
    game.player.y = game.groundY - game.player.height;
    game.player.vy = 0;
    game.player.onGround = true;
  }

  spawnTimer += delta;
  if (spawnTimer >= Math.max(1.2, 2.2 - difficultyLevel * 0.18)) {
    spawnTimer = 0;
    generateMonster();
  }

  for (let i = game.obstacles.length - 1; i >= 0; i--) {
    const obstacle = game.obstacles[i];
    obstacle.x -= obstacle.speed * delta;

    if (obstacle.x + obstacle.width < -20) {
      game.obstacles.splice(i, 1);
      continue;
    }

    if (!obstacle.hasTriggered) {
      const playerRect = {
        x: game.player.x,
        y: game.player.y,
        width: game.player.width,
        height: game.player.height
      };

      const obstacleRect = {
        x: obstacle.x,
        y: obstacle.y,
        width: obstacle.width,
        height: obstacle.height
      };

      const intersects = playerRect.x < obstacleRect.x + obstacleRect.width &&
        playerRect.x + playerRect.width > obstacleRect.x &&
        playerRect.y < obstacleRect.y + obstacleRect.height &&
        playerRect.y + playerRect.height > obstacleRect.y;

      if (intersects) {
        obstacle.hasTriggered = true;
        triggerQuiz();
      }
    }
  }

  updateHUD();
}

function drawBackground() {
  ctx.fillStyle = '#7ec8ff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#9ad6ff';
  for (let i = 0; i < 40; i++) {
    const x = (i * 80 + (elapsed * 16) % 80) % (canvas.width + 80) - 40;
    const y = 60 + (i * 17) % 180;
    ctx.beginPath();
    ctx.arc(x, y, 2 + (i % 3), 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = '#8ecf63';
  ctx.fillRect(0, game.groundY, canvas.width, game.groundHeight);

  ctx.fillStyle = '#64a643';
  for (let x = 0; x < canvas.width; x += 32) {
    ctx.fillRect(x, game.groundY + 25, 20, 10);
  }
}

function drawPlayer() {
  const { x, y, width, height } = game.player;
  ctx.fillStyle = game.player.color;
  ctx.fillRect(x, y, width, height);

  ctx.fillStyle = '#1f2937';
  ctx.fillRect(x + 10, y + 8, 8, 8);
  ctx.fillRect(x + 24, y + 8, 8, 8);
  ctx.fillStyle = '#fff';
  ctx.fillRect(x + 12, y + 10, 2, 2);
  ctx.fillRect(x + 26, y + 10, 2, 2);
}

function drawMonster(obstacle) {
  ctx.fillStyle = obstacle.color;
  ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);

  ctx.fillStyle = '#2b2d42';
  ctx.fillRect(obstacle.x + 8, obstacle.y + 10, 8, 8);
  ctx.fillRect(obstacle.x + obstacle.width - 16, obstacle.y + 10, 8, 8);

  ctx.fillStyle = '#fff';
  ctx.fillRect(obstacle.x + 10, obstacle.y + 12, 3, 3);
  ctx.fillRect(obstacle.x + obstacle.width - 13, obstacle.y + 12, 3, 3);

  ctx.fillStyle = '#000';
  ctx.fillRect(obstacle.x + 14, obstacle.y + 24, obstacle.width - 28, 6);
}

function draw() {
  drawBackground();

  if (gameState === 'playing' || gameState === 'quiz') {
    for (const obstacle of game.obstacles) {
      drawMonster(obstacle);
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

  if (gameState === 'playing') {
    requestAnimationFrame(gameLoop);
  } else if (gameState === 'menu') {
    requestAnimationFrame(gameLoop);
  } else if (gameState === 'over') {
    return;
  }
}

window.addEventListener('keydown', (event) => {
  if (event.code === 'Space' || event.code === 'ArrowUp' || event.code === 'KeyW') {
    event.preventDefault();
    handleJump();
  }
});

startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', () => {
  gameOverScreen.classList.add('hidden');
  startGame();
});
answerButton.addEventListener('click', evaluateAnswer);

resetGame();
startScreen.classList.remove('hidden');
quizScreen.classList.remove('visible');
requestAnimationFrame(gameLoop);
