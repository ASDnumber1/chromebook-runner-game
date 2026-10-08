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
    width: 34,
    height: 42,
    vy: 0,
    jumpForce: 700,
    onGround: false,
    color: '#FFD166'
  },
  monsters: [],
  platforms: [],
  lastTime: 0,
  monsterId: 0,
  lastCaughtMonster: null
};

function randomQuestion() {
  return quizQuestions[Math.floor(Math.random() * quizQuestions.length)];
}

function buildPlatforms() {
  return [
    { x: 0, y: 640, width: 1280, height: 80, type: 'ground' },
    { x: 180, y: 540, width: 210, height: 18, type: 'platform' },
    { x: 510, y: 470, width: 210, height: 18, type: 'platform' },
    { x: 830, y: 390, width: 210, height: 18, type: 'platform' },
    { x: 300, y: 330, width: 180, height: 18, type: 'platform' },
    { x: 760, y: 280, width: 180, height: 18, type: 'platform' }
  ];
}

function resetState() {
  game.score = 0;
  game.elapsed = 0;
  game.spawnTimer = 0;
  game.monsters = [];
  game.platforms = buildPlatforms();
  game.player.x = 120;
  game.player.y = game.platforms[0].y - 42;
  game.player.vy = 0;
  game.player.onGround = true;
  game.lastCaughtMonster = null;
  updateHud();
}

function updateHud() {
  scoreBox.textContent = `Score: ${Math.floor(game.score)}`;
  timeBox.textContent = `Time: ${Math.floor(game.elapsed)}s | ${game.difficulty.toUpperCase()}`;
}

function startRun(mode) {
  game.difficulty = mode;
  game.worldSpeed = mode === 'hard' ? 320 : 260;
  resetState();
  game.phase = 'playing';
  startScreen.classList.add('hidden');
  quizScreen.classList.remove('visible');
  gameOverScreen.classList.add('hidden');
  quizFeedback.textContent = '';
  answerButton.disabled = false;
  game.lastTime = 0;
}

function gameOver() {
  game.phase = 'gameover';
  finalScoreText.textContent = `Final Score: ${Math.floor(game.score)}`;
  gameOverScreen.classList.remove('hidden');
}

function showQuiz() {
  const q = randomQuestion();
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

  answerButton.disabled = false;
  answerButton.dataset.correctIndex = String(q.correctIndex);
  answerButton.dataset.clue = q.clue;
  quizFeedback.textContent = '';
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
    game.score += 50;
  } else {
    quizFeedback.textContent = 'Not quite. Clue: ' + clue;
    game.score = Math.max(0, game.score - 15);
  }

  updateHud();

  setTimeout(() => {
    quizScreen.classList.remove('visible');
    game.phase = 'playing';
    game.player.y = game.platforms[0].y - game.player.height;
    game.player.vy = 0;
    game.player.onGround = true;
    if (game.lastCaughtMonster) {
      game.monsters = game.monsters.filter((monster) => monster !== game.lastCaughtMonster);
      game.lastCaughtMonster = null;
    }
  }, 1500);
}

function spawnMonster() {
  const platformChoices = game.platforms.filter((p) => p.type !== 'ground');
  const platform = platformChoices[Math.floor(Math.random() * platformChoices.length)] || game.platforms[0];

  const monster = {
    id: ++game.monsterId,
    x: canvas.width + 40,
    y: platform.y - 42,
    width: 38,
    height: 42,
    vy: 0,
    onGround: false,
    jumpTimer: 1.5 + Math.random() * 1.2,
    speed: game.worldSpeed * (game.difficulty === 'hard' ? 1.18 : 1.0) + Math.random() * 12,
    color: ['#FF5D8F', '#7B61FF', '#3DDC97', '#FF8A65'][Math.floor(Math.random() * 4)],
    caught: false,
    platform: platform
  };

  game.monsters.push(monster);
}

function handleJump() {
  if (game.phase !== 'playing') return;
  if (game.player.onGround) {
    game.player.vy = -game.player.jumpForce;
    game.player.onGround = false;
  }
}

function playerOnPlatform(player, platform) {
  const prevBottom = player.y + player.height - player.vy * (1 / 60);
  if (player.vy >= 0 && prevBottom <= platform.y + 8 && player.y + player.height >= platform.y && player.y + player.height <= platform.y + 26) {
    return true;
  }
  return false;
}

function updatePlayer(delta) {
  const previousY = game.player.y;
  game.player.vy += game.gravity * delta;
  game.player.y += game.player.vy * delta;
  game.player.onGround = false;

  for (const platform of game.platforms) {
    const playerBottom = game.player.y + game.player.height;
    const prevBottom = previousY + game.player.height;
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
    gameOver();
  }
}

function updateMonsters(delta) {
  for (let i = game.monsters.length - 1; i >= 0; i--) {
    const monster = game.monsters[i];

    monster.x -= monster.speed * delta;
    monster.vy += game.gravity * delta;
    monster.y += monster.vy * delta;
    monster.jumpTimer -= delta;

    let landed = false;
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
        landed = true;
        if (monster.jumpTimer <= 0) {
          monster.vy = -620;
          monster.onGround = false;
          monster.jumpTimer = 1.3 + Math.random() * 1.7;
        }
        break;
      }
    }

    if (!landed && monster.jumpTimer <= 0) {
      monster.vy = -620;
      monster.onGround = false;
      monster.jumpTimer = 1.4 + Math.random() * 1.6;
    }

    if (monster.x + monster.width < -10) {
      game.monsters.splice(i, 1);
      continue;
    }

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

    const touching =
      playerRect.x < monsterRect.x + monsterRect.width &&
      playerRect.x + playerRect.width > monsterRect.x &&
      playerRect.y < monsterRect.y + monsterRect.height &&
      playerRect.y + playerRect.height > monsterRect.y;

    if (touching && !monster.caught) {
      monster.caught = true;
      game.lastCaughtMonster = monster;
      game.phase = 'quiz';
      showQuiz();
      break;
    }
  }
}

function update(delta) {
  if (game.phase !== 'playing') return;

  game.elapsed += delta;
  game.score += delta * 10;
  game.spawnTimer += delta;

  updatePlayer(delta);

  if (game.spawnTimer >= (game.difficulty === 'hard' ? 1.6 : 2.1)) {
    game.spawnTimer = 0;
    spawnMonster();
  }

  updateMonsters(delta);
  updateHud();
}

function drawBackground() {
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, '#7EC8FF');
  gradient.addColorStop(1, '#EAFBFF');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  for (let i = 0; i < 6; i++) {
    const x = (i * 240 + (game.elapsed * 25) % 300) % (canvas.width + 200) - 100;
    const y = 90 + (i % 3) * 40;
    ctx.beginPath();
    ctx.arc(x, y, 28, 0, Math.PI * 2);
    ctx.arc(x + 38, y - 20, 34, 0, Math.PI * 2);
    ctx.arc(x + 76, y, 28, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPlatforms() {
  for (const platform of game.platforms) {
    ctx.fillStyle = platform.type === 'ground' ? '#5EA55E' : '#66BB6A';
    ctx.fillRect(platform.x, platform.y, platform.width, platform.height);

    ctx.fillStyle = platform.type === 'ground' ? '#3D6B2F' : '#2E7D32';
    for (let x = platform.x; x < platform.x + platform.width; x += 28) {
      ctx.fillRect(x, platform.y + platform.height - 8, 18, 8);
    }
  }
}

function drawPlayer() {
  const p = game.player;

  ctx.fillStyle = '#D4A017';
  ctx.fillRect(p.x + 6, p.y + 10, p.width - 12, p.height - 10);

  ctx.fillStyle = '#F7D46A';
  ctx.beginPath();
  ctx.arc(p.x + p.width / 2, p.y + 10, 12, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#000';
  ctx.fillRect(p.x + 10, p.y + 8, 3, 3);
  ctx.fillRect(p.x + p.width - 13, p.y + 8, 3, 3);

  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(p.x + p.width / 2, p.y + 12, 5, 0, Math.PI);
  ctx.stroke();

  ctx.strokeStyle = '#D4A017';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(p.x + 6, p.y + 18);
  ctx.lineTo(p.x - 8, p.y + 26);
  ctx.moveTo(p.x + p.width - 6, p.y + 18);
  ctx.lineTo(p.x + p.width + 8, p.y + 26);
  ctx.stroke();
}

function drawMonster(monster) {
  ctx.fillStyle = monster.color;
  ctx.fillRect(monster.x, monster.y + 12, monster.width, monster.height - 12);

  ctx.fillStyle = monster.color;
  ctx.beginPath();
  ctx.arc(monster.x + monster.width / 2, monster.y + 9, 12, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#fff';
  ctx.fillRect(monster.x + 8, monster.y + 6, 4, 4);
  ctx.fillRect(monster.x + monster.width - 12, monster.y + 6, 4, 4);

  ctx.fillStyle = '#000';
  ctx.fillRect(monster.x + 9, monster.y + 7, 2, 2);
  ctx.fillRect(monster.x + monster.width - 11, monster.y + 7, 2, 2);

  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(monster.x + 10, monster.y + 16);
  ctx.lineTo(monster.x + monster.width - 10, monster.y + 16);
  ctx.stroke();
}

function draw() {
  drawBackground();
  drawPlatforms();

  if (game.phase !== 'menu') {
    for (const monster of game.monsters) drawMonster(monster);
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
quizScreen.classList.remove('visible');
gameOverScreen.classList.add('hidden');
updateHud();
requestAnimationFrame(loop);
