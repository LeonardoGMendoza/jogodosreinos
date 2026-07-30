const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

let cw = canvas.width = window.innerWidth;
let ch = canvas.height = window.innerHeight;

window.addEventListener('resize', () => {
  cw = canvas.width = window.innerWidth;
  ch = canvas.height = window.innerHeight;
});

// Elementos da UI
const screenMenu = document.getElementById('screen-menu');
const screenGameOver = document.getElementById('screen-gameover');
const uiContainer = document.getElementById('ui-container');
const btnStart = document.getElementById('btn-start');
const btnRestart = document.getElementById('btn-restart');
const scoreDisplay = document.getElementById('score');
const finalScoreDisplay = document.getElementById('final-score');
const kingdomName = document.getElementById('kingdom-name');
const scripturePopup = document.getElementById('scripture-popup');
const scriptureText = document.getElementById('scripture-text');

// Áudios
const bgmTelestial = new Audio('hino_telestial.mp3');
const bgmTerrestrial = new Audio('hino_terrestre.mp3');
const bgmCelestial = new Audio('hino_celestial.mp3');
[bgmTelestial, bgmTerrestrial, bgmCelestial].forEach(audio => {
  audio.loop = true;
  audio.volume = 0.5;
});

// Estado do Jogo
let isPlaying = false;
let currentPhase = 0; // 0 = Telestial, 1 = Terrestre, 2 = Celestial
let sidesDrawn = 0;
let targetSides = 3;
let outerRadius = 0;
let innerRadius = 60;
let shrinkSpeed = 0;
let gameLoopId;
let particles = [];
let backgroundColor = "#0a0a1a";

// Textos das escrituras
const scriptures = [
  "Glória das Estrelas: O Reino Telestial.",
  "Glória da Lua: O Reino Terrestre.",
  "Glória do Sol: A Perfeição do Reino Celestial."
];

function unlockAudio() {
  bgmTelestial.load();
  bgmTerrestrial.load();
  bgmCelestial.load();
  document.removeEventListener('pointerdown', unlockAudio);
}
document.addEventListener('pointerdown', unlockAudio);

function initPhase(phase) {
  currentPhase = phase;
  sidesDrawn = 0;
  outerRadius = Math.max(cw, ch) * 0.5; // Começa grande
  particles = [];
  
  // Parar todas as músicas
  bgmTelestial.pause();
  bgmTerrestrial.pause();
  bgmCelestial.pause();
  
  if (phase === 0) {
    targetSides = 3; // Triângulo
    shrinkSpeed = 1.2;
    backgroundColor = "#050510"; // Escuro (Estrelas)
    kingdomName.innerText = "REINO TELESTIAL";
    bgmTelestial.play().catch(()=>{});
  } else if (phase === 1) {
    targetSides = 4; // Quadrado
    shrinkSpeed = 1.8;
    backgroundColor = "#1a1a2e"; // Noite com lua
    kingdomName.innerText = "REINO TERRESTRE";
    bgmTerrestrial.play().catch(()=>{});
  } else if (phase === 2) {
    targetSides = 10; // Muitos toques para explodir a luz (Bolinha)
    shrinkSpeed = 2.5;
    backgroundColor = "#331100"; // Dourado escuro
    kingdomName.innerText = "REINO CELESTIAL";
    bgmCelestial.play().catch(()=>{});
  }
  
  scoreDisplay.innerText = phase + 1;
  uiContainer.classList.remove('hidden');
  
  showScripture(scriptures[phase]);
}

function showScripture(text) {
  scriptureText.innerText = text;
  scripturePopup.classList.remove('hidden');
  scripturePopup.style.opacity = 1;
  setTimeout(() => {
    scripturePopup.style.opacity = 0;
    setTimeout(() => scripturePopup.classList.add('hidden'), 500);
  }, 3000);
}

function startGame() {
  screenMenu.classList.add('hidden');
  screenGameOver.classList.add('hidden');
  isPlaying = true;
  initPhase(0);
  gameLoop();
}

function gameOver() {
  isPlaying = false;
  cancelAnimationFrame(gameLoopId);
  screenGameOver.classList.remove('hidden');
  finalScoreDisplay.innerText = currentPhase + 1;
  uiContainer.classList.add('hidden');
}

function advancePhase() {
  createExplosion();
  setTimeout(() => {
    if (currentPhase < 2) {
      initPhase(currentPhase + 1);
    } else {
      // Venceu o jogo!
      showScripture("Você alcançou a Glória Eterna!");
      outerRadius = 9999; // Para de fechar
      shrinkSpeed = 0;
    }
  }, 1000);
}

// Input do jogador (Toques rápidos)
window.addEventListener('pointerdown', (e) => {
  if (!isPlaying) return;
  // Previne double tap zoom
  e.preventDefault(); 
  
  if (sidesDrawn < targetSides) {
    sidesDrawn++;
    createTapEffect(e.clientX, e.clientY);
    
    // Empurra a prisão um pouco para trás a cada toque (dá um respiro)
    outerRadius += 10;
    
    if (sidesDrawn === targetSides) {
      advancePhase();
    }
  }
}, { passive: false });

btnStart.addEventListener('click', startGame);
btnRestart.addEventListener('click', startGame);

// --- RENDERIZAÇÃO ---

function drawPolygon(ctx, x, y, radius, sides, progress, color, lineWidth) {
  if (sides < 3 && currentPhase < 2) {
    // Se for só 1 ou 2 palitinhos, desenha linhas soltas
    ctx.beginPath();
    ctx.moveTo(x, y - radius);
    if (sides > 0) ctx.lineTo(x + radius * Math.cos(Math.PI/6), y + radius * Math.sin(Math.PI/6));
    if (sides > 1) ctx.lineTo(x - radius * Math.cos(Math.PI/6), y + radius * Math.sin(Math.PI/6));
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
    return;
  }
  
  ctx.beginPath();
  const angleStep = (Math.PI * 2) / sides;
  // Rotação inicial dependendo da fase (Triângulo aponta pra cima, Quadrado é reto)
  const offset = sides === 4 ? Math.PI/4 : -Math.PI/2;
  
  for (let i = 0; i <= sides; i++) {
    // Só desenha a quantidade de lados que o jogador já completou
    if (i > progress) break;
    const currentAngle = offset + i * angleStep;
    const px = x + Math.cos(currentAngle) * radius;
    const py = y + Math.sin(currentAngle) * radius;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineJoin = 'round';
  ctx.stroke();
  
  // Efeito de brilho
  ctx.shadowColor = color;
  ctx.shadowBlur = 15;
  ctx.stroke();
  ctx.shadowBlur = 0;
}

function drawCircle(ctx, x, y, radius, color, isSolid = false) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  if (isSolid) {
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 30;
    ctx.fill();
  } else {
    ctx.strokeStyle = color;
    ctx.lineWidth = 5;
    ctx.shadowColor = color;
    ctx.shadowBlur = 15;
    ctx.stroke();
  }
  ctx.shadowBlur = 0;
}

function updateAndDrawParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    let p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life -= 0.02;
    if (p.life <= 0) {
      particles.splice(i, 1);
      continue;
    }
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI*2);
    ctx.fillStyle = p.color;
    ctx.fill();
  }
}

function createTapEffect(x, y) {
  for(let i=0; i<5; i++) {
    particles.push({
      x: x, y: y,
      vx: (Math.random() - 0.5) * 10,
      vy: (Math.random() - 0.5) * 10,
      life: 1,
      size: 3,
      color: "#ffffff"
    });
  }
}

function createExplosion() {
  const cx = cw / 2;
  const cy = ch / 2;
  const color = currentPhase === 0 ? "#00ffff" : currentPhase === 1 ? "#ff00ff" : "#ffff00";
  for(let i=0; i<50; i++) {
    particles.push({
      x: cx, y: cy,
      vx: (Math.random() - 0.5) * 20,
      vy: (Math.random() - 0.5) * 20,
      life: 1,
      size: Math.random() * 5 + 2,
      color: color
    });
  }
}

// Estrelas de fundo
const stars = Array.from({length: 100}, () => ({
  x: Math.random(),
  y: Math.random(),
  size: Math.random() * 2
}));

function drawBackground() {
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, cw, ch);
  
  if (currentPhase === 0 || currentPhase === 2) {
    ctx.fillStyle = currentPhase === 2 ? "#ffd700" : "#ffffff";
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x * cw, s.y * ch, s.size, 0, Math.PI*2);
      ctx.fill();
    });
  }
}

function gameLoop() {
  if (!isPlaying) return;
  gameLoopId = requestAnimationFrame(gameLoop);
  
  // Atualiza Lógica
  outerRadius -= shrinkSpeed;
  
  // Colisão (Prisão engoliu o jogador)
  if (outerRadius <= innerRadius) {
    gameOver();
    return;
  }
  
  // Desenho
  drawBackground();
  updateAndDrawParticles();
  
  const cx = cw / 2;
  const cy = ch / 2;
  
  // A PRISÃO (Mundo exterior tentando esmagar)
  const prisonColor = "#ff3333";
  if (currentPhase === 0) {
    drawPolygon(ctx, cx, cy, outerRadius, 3, 3, prisonColor, 8); // Triângulo
  } else if (currentPhase === 1) {
    drawPolygon(ctx, cx, cy, outerRadius, 4, 4, prisonColor, 8); // Quadrado
  } else if (currentPhase === 2) {
    drawCircle(ctx, cx, cy, outerRadius, prisonColor, false); // Círculo
  }
  
  // O JOGADOR (Espírito se construindo)
  const playerColor = currentPhase === 0 ? "#00ffff" : currentPhase === 1 ? "#ff00ff" : "#ffff00";
  
  if (currentPhase === 2) {
    // No Reino Celestial, é uma Bolinha que cresce de luz a cada toque
    const currentRad = innerRadius + (sidesDrawn * 5);
    drawCircle(ctx, cx, cy, currentRad, playerColor, true);
    // Vidas/Toques restantes como anéis
    drawCircle(ctx, cx, cy, currentRad + 20, "#ffffff", false);
  } else {
    // Fase 1 e 2: Construindo formas (Palitinhos)
    drawPolygon(ctx, cx, cy, innerRadius, targetSides, sidesDrawn, playerColor, 5);
  }
}
