const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const startScreen = document.getElementById('startScreen');
const quizScreen = document.getElementById('quizScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const scoreBox = document.getElementById('scoreBox');
const timeBox = document.getElementById('timeBox');
const quizQuestion = document.getElementById('quizQuestion');
const choicesContainer = document.getElementById('choices');
const quizFeedback = document.getElementById('quizFeedback');
const answerButton = document.getElementById('quizAnswerButton');
const startNormalButton = document.getElementById('startNormalButton');
const startHardButton = document.getElementById('startHardButton');
const restartButton = document.getElementById('restartButton');
const finalScoreText = document.getElementById('finalScoreText');

const quizQuestions = [
  {
    question: 'What is the definition of force?',
    choices: [
      'A push or pull acting on an object.',
      'The rate at which velocity changes.',
      'The tendency of an object to resist a change in motion.',
      'The distance traveled in a certain amount of time.'
    ],
    correctIndex: 0,
    clue: 'The student used force to push the skateboard forward.'
  },
  {
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
    question: 'What is the definition of inertia?',
    choices: [
      'The tendency of an object to resist a change in its motion.',
      'The force between two surfaces that touch.',
      'The speed of an object in a specific direction.',
      'The amount of matter in an object.'
    ],
    correctIndex: 0,
    clue: 'Because of inertia, the book stayed still until someone moved it.'
  },
  {
    question: 'What is the definition of speed?',
    choices: [
      'The rate at which velocity changes.',
      'The distance traveled in a certain amount of time.',
      'The tendency of an object to resist motion changes.',
      'The force between two surfaces.'
    ],
    correctIndex: 1,
    clue: 'The cyclist rode at a speed of 20 miles per hour.'
  },
  {
    question: 'What is the definition of velocity?',
    choices: [
      'A force that opposes motion between two surfaces.',
      'The distance traveled in a certain time.',
      'Speed in a specific direction.',
      'A push or pull acting on an object.'
    ],
    correctIndex: 2,
    clue: 'The car had a velocity of 50 kilometers per hour north.'
  },
  {
    question: 'What is the definition of acceleration?',
    choices: [
      'The tendency of an object to resist motion changes.',
      'The amount of matter in an object.',
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

const game = {
  width: canvas.width,
  height: canvas.height,
  gravity: 1500,
  worldSpeed: 260,
  score: 0,
  elapsed: 0,
  spawnTimer: 0,
  difficulty: 'normal',
  phase: 'menu',
  player: {
    x: 120,
    y: 0,
    width: 38,
    height: 52,
    vy: 0,
    jumpForce: 700,
    onGround: false,
    color: '#ffd166'
  },
  monsters: [],
  platforms: [],
  lastTime: 0,
  monsterId: 0,
  caughtMonsterIndex: -1,
  isProcessingQuiz: false
};

function buildPlatforms() {
  return [
    { x: 0, y: 650, width: 1280, height: 70, type: 'ground' },
    { x: 180, y: 540, width: 200, height: 18, type: 'platform' },
    { x: 510, y: 470, width: 210, height: 18, type: 'platform' },
    { x: 860, y: 390, width: 220, height: 18, type: 'platform' },
    { x: 300, y: 340, width: 170, height: 18, type: 'platform' },
    { x: 760, y: 280, width: 190, height: 18, type: 'platform' }
  ];
}

function resetState() {
  game.score = 0;
  game.elapsed = 0;
  game.spawnTimer = 0;
  game.monsters = [];
  game.platforms = buildPlatforms();
  game.player.x = 120;
  game.player.y = game.platforms[0].y - game.player.height;
  game.player.vy = 0;
  game.player.onGround = true;
  game.caughtMonsterIndex = -1;
  game.isProcessingQuiz = false;
  updateHud();
}

function updateHud() {
  scoreBox.textContent = `Score: ${Math.floor(game.score)}`;
  timeBox.textContent = `Time: ${Math.floor(game.elapsed)}s | ${game.difficulty.toUpperCase()}`;
}

function startRun(mode) {
  game.difficulty = mode;
  game.worldSpeed = mode === 'hard' ? 310 : 260;
  resetState();
  game.phase = 'playing';
  startScreen.classList.add('hidden');
  quizScreen.classList.add('hidden');
  gameOverScreen.classList.add('hidden');
  quizFeedback.textContent = '';
  answerButton.disabled = false;
  game.lastTime = 0;
}

function showGameOver() {
  game.phase = 'gameover';
  finalScoreText.textContent = `Final Score: ${Math.floor(game.score)}`;
  gameOverScreen.classList.remove('hidden');
}

function showQuiz() {
  const q = getRandomQuestion();
  quizQuestion.textContent = q.question;
  choicesContainer.innerHTML = '';

  q.choices.forEach((choiceText, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'choice';
    button.textContent = choiceText;
    button.addEventListener('click', () => {
      document.querySelectorAll('.choice').forEach((c) => c.classList.remove('selected'));
      button.classList.add('selected');
      button.dataset.index = String(index);
    });
    choicesContainer.appendChild(button);
  });

  answerButton.dataset.correctIndex = String(q.correctIndex);
  answerButton.dataset.clue = q.clue;
  answerButton.disabled = false;
  quizFeedback.textContent = '';
  quizScreen.classList.remove('hidden');
}

function evaluateAnswer() {
  const selected = document.querySelector('.choice.selected');
  const correctIndex = Number(answerButton.dataset.correctIndex);
  const clue = answerButton.dataset.clue || '';

  if (!selected) {
    quizFeedback.textContent = 'Please choose an answer.';
    return;
  }

  const choiceIndex = Number(selected.dataset.index);
  const allChoices = document.querySelectorAll('.choice');
  
  allChoices.forEach((choice, idx) => {
    choice.disabled = true;
    if (idx === correctIndex) choice.classList.add('correct');
    if (idx === choiceIndex && idx !== correctIndex) choice.classList.add('incorrect');
  });

  answerButton.disabled = true;

  if (choiceIndex === correctIndex) {
    quizFeedback.textContent = 'Correct! Great job!';
    game.score += 60;
  } else {
    quizFeedback.textContent = 'Not quite. Clue: ' + clue;
    game.score = Math.max(0, game.score - 20);
  }

  updateHud();

  setTimeout(() => {
    quizScreen.classList.add('hidden');
    game.phase = 'playing';
    game.isProcessingQuiz = false;
    
    game.player.y = game.platforms[0].y - game.player.height;
    game.player.vy = 0;
    game.player.onGround = true;
    
    if (game.caughtMonsterIndex >= 0 && game.caughtMonsterIndex < game.monsters.length) {
      game.monsters.splice(game.caughtMonsterIndex, 1);
    }
    game.caughtMonsterIndex = -1;
  }, 1600);
}

function spawnMonster() {
  const platformChoices = game.platforms.filter((p) => p.type !== 'ground');
  const platform = platformChoices[Math.floor(Math.random() * platformChoices.length)] || game.platforms[0];

  const monster = {
    id: ++game.monsterId,
    x: canvas.width + 40,
    y: platform.y - 52,
    width: 38,
    height: 52,
    vy: 0,
    onGround: false,
    jumpTimer: 0.8 + Math.random() * 1.4,
    speed: game.worldSpeed * (game.difficulty === 'hard' ? 1.2 : 1.0) + Math.random() * 20,
    color: ['#f56565', '#9f7aea', '#4fd1c5', '#f6ad55'][Math.floor(Math.random() * 4)],
    hasCollided: false
  };

  game.monsters.push(monster);
}

function handleJump() {
  if (game.phase !== 'playing' || game.isProcessingQuiz) return;
  if (game.player.onGround) {
    game.player.vy = -game.player.jumpForce;
    game.player.onGround = false;
  }
}

function updatePlayer(delta) {
  game.player.vy += game.gravity * delta;
  game.player.y += game.player.vy * delta;
  game.player.onGround = false;

  for (const platform of game.platforms) {
    const playerBottom = game.player.y + game.player.height;
    const prevBottom = (game.player.y - game.player.vy * delta) + game.player.height;

    if (
      game.player.vy >= 0 &&
      prevBottom <= platform.y + 10 &&
      playerBottom >= platform.y &&
      game.player.x + game.player.width > platform.x &&
      game.player.x < platform.x + platform.width
    ) {
      game.player.y = platform.y - game.player.height;
      game.player.vy = 0;
      game.player.onGround = true;
      break;
    }
  }

  if (game.player.y > canvas.height + 100) {
    showGameOver();
  }
}

function updateMonsters(delta) {
  for (let i = 0; i < game.monsters.length; i++) {
    const monster = game.monsters[i];

    monster.x -= monster.speed * delta;
    monster.vy += game.gravity * delta;
    monster.y += monster.vy * delta;
    monster.jumpTimer -= delta;

    let onPlatform = false;
    for (const platform of game.platforms) {
      const monsterBottom = monster.y + monster.height;
      const prevBottom = monster.y - monster.vy * delta + monster.height;

      if (
        monster.vy >= 0 &&
        prevBottom <= platform.y + 8 &&
        monsterBottom >= platform.y &&
        monster.x + monster.width > platform.x &&
        monster.x < platform.x + platform.width
      ) {
        monster.y = platform.y - monster.height;
        monster.vy = 0;
        monster.onGround = true;
        onPlatform = true;

        if (monster.jumpTimer <= 0) {
          monster.vy = -620;
          monster.onGround = false;
          monster.jumpTimer = 1.2 + Math.random() * 1.8;
        }
        break;
      }
    }

    if (!onPlatform) {
      monster.onGround = false;
    }

    if (monster.x + monster.width < -20) {
      game.monsters.splice(i, 1);
      i--;
      continue;
    }

    if (!monster.hasCollided && !game.isProcessingQuiz) {
      const playerRect = {
        x: game.player.x,
        y: game.player.y,
        width: game.player.width,
        height: game.player.height
      };

      const monsterRect = {
        x: monster.x,
        y: monster.y,
        width: monster.width,
        height: monster.height
      };

      const colliding =
        playerRect.x < monsterRect.x + monsterRect.width &&
        playerRect.x + playerRect.width > monsterRect.x &&
        playerRect.y < monsterRect.y + monsterRect.height &&
        playerRect.y + playerRect.height > monsterRect.y;

      if (colliding) {
        monster.hasCollided = true;
        game.caughtMonsterIndex = i;
        game.isProcessingQuiz = true;
        game.phase = 'quiz';
        showQuiz();
        return;
      }
    }
  }
}

function update(delta) {
  if (game.phase !== 'playing') return;

  game.elapsed += delta;
  game.score += delta * 10;
  game.spawnTimer += delta;

  updatePlayer(delta);

  if (game.spawnTimer >= (game.difficulty === 'hard' ? 1.5 : 2.2)) {
    game.spawnTimer = 0;
    spawnMonster();
  }

  updateMonsters(delta);
  updateHud();
}

function drawBackground() {
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, '#7ec8ff');
  gradient.addColorStop(1, '#eaf7ff');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  for (let i = 0; i < 8; i++) {
    const x = (i * 200 + (game.elapsed * 20) % 280) % (canvas.width + 180) - 90;
    const y = 100 + (i % 4) * 35;
    ctx.beginPath();
    ctx.arc(x, y, 26, 0, Math.PI * 2);
    ctx.arc(x + 32, y - 16, 32, 0, Math.PI * 2);
    ctx.arc(x + 64, y, 26, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPlatforms() {
  for (const platform of game.platforms) {
    ctx.fillStyle = platform.type === 'ground' ? '#5ea55e' : '#66bb6a';
    ctx.fillRect(platform.x, platform.y, platform.width, platform.height);

    ctx.fillStyle = platform.type === 'ground' ? '#2f612d' : '#2e7d32';
    for (let x = platform.x; x < platform.x + platform.width; x += 28) {
      ctx.fillRect(x, platform.y + platform.height - 8, 18, 8);
    }
  }
}

function drawPlayer() {
  const p = game.player;

  ctx.fillStyle = '#e8a82d';
  ctx.fillRect(p.x + 8, p.y + 16, p.width - 16, p.height - 20);

  ctx.fillStyle = '#f7d56a';
  ctx.beginPath();
  ctx.arc(p.x + p.width / 2, p.y + 12, 13, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#000';
  ctx.fillRect(p.x + 10, p.y + 9, 3, 4);
  ctx.fillRect(p.x + p.width - 13, p.y + 9, 3, 4);

  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.arc(p.x + p.width / 2, p.y + 14, 5, 0, Math.PI);
  ctx.stroke();

  ctx.strokeStyle = '#e8a82d';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(p.x + 7, p.y + 28);
  ctx.lineTo(p.x - 10, p.y + 38);
  ctx.moveTo(p.x + p.width - 7, p.y + 28);
  ctx.lineTo(p.x + p.width + 10, p.y + 38);
  ctx.stroke();
}

function drawMonster(monster) {
  ctx.fillStyle = monster.color;
  ctx.fillRect(monster.x, monster.y + 14, monster.width, monster.height - 14);

  ctx.beginPath();
  ctx.arc(monster.x + monster.width / 2, monster.y + 10, 13, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#fff';
  ctx.fillRect(monster.x + 8, monster.y + 6, 5, 5);
  ctx.fillRect(monster.x + monster.width - 13, monster.y + 6, 5, 5);

  ctx.fillStyle = '#000';
  ctx.fillRect(monster.x + 10, monster.y + 8, 2, 2);
  ctx.fillRect(monster.x + monster.width - 11, monster.y + 8, 2, 2);

  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(monster.x + 10, monster.y + 18);
  ctx.lineTo(monster.x + monster.width - 10, monster.y + 18);
  ctx.stroke();

  ctx.fillStyle = monster.color;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(monster.x + 6 + i * 13, monster.y);
    ctx.lineTo(monster.x + 10 + i * 13, monster.y - 6);
    ctx.lineTo(monster.x + 14 + i * 13, monster.y);
    ctx.closePath();
    ctx.fill();
  }
}

function draw() {
  drawBackground();
  drawPlatforms();

  if (game.phase !== 'menu') {
    for (const monster of game.monsters) {
      drawMonster(monster);
    }
    drawPlayer();
  }
}

function loop(timestamp) {
  if (!game.lastTime) game.lastTime = timestamp;
  const delta = Math.min((timestamp - game.lastTime) / 1000, 0.032);
  game.lastTime = timestamp;

  if (game.phase === 'playing') {
    update(delta);
  }

  draw();
  requestAnimationFrame(loop);
}

startNormalButton.addEventListener('click', () => startRun('normal'));
startHardButton.addEventListener('click', () => startRun('hard'));
restartButton.addEventListener('click', () => startRun(game.difficulty || 'normal'));
answerButton.addEventListener('click', evaluateAnswer);

window.addEventListener('keydown', (event) => {
  if (event.code === 'Space' || event.code === 'ArrowUp' || event.code === 'KeyW') {
    event.preventDefault();
    handleJump();
  }
});

resetState();
startScreen.classList.remove('hidden');
quizScreen.classList.add('hidden');
gameOverScreen.classList.add('hidden');
updateHud();
requestAnimationFrame(loop);
