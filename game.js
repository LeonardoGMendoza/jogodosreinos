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

// Mecânica de Corte (Blade)
let isDragging = false;
let bladePoints = []; // Rastro da espada [{x,y,time}]
let floatingTargets = []; // Palitinhos voando pela tela

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

function spawnTarget() {
  const isCelestial = currentPhase === 2;
  const size = isCelestial ? 40 : 80; // Bolinhas ou Palitos maiores para ser fácil de acertar
  const x = Math.random() < 0.5 ? -50 : cw + 50;
  const y = Math.random() * ch * 0.7 + (ch * 0.15); // Aparecem mais no meio da tela
  const vx = (x < 0 ? 1 : -1) * (Math.random() * 2 + 1.5);
  const vy = (Math.random() - 0.5) * 3;
  
  floatingTargets.push({
    x: x, y: y, vx: vx, vy: vy,
    angle: Math.random() * Math.PI,
    vAngle: (Math.random() - 0.5) * 0.05,
    size: size,
    isOrb: isCelestial,
    active: true
  });
}

function initPhase(phase) {
  currentPhase = phase;
  sidesDrawn = 0;
  outerRadius = Math.max(cw, ch) * 0.7; // Começa bem grande para dar tempo
  particles = [];
  floatingTargets = [];
  bladePoints = [];
  
  bgmTelestial.pause();
  bgmTerrestrial.pause();
  bgmCelestial.pause();
  
  if (phase === 0) {
    targetSides = 3; 
    shrinkSpeed = 0.8;
    backgroundColor = "#050510"; 
    kingdomName.innerText = "REINO TELESTIAL";
    bgmTelestial.play().catch(()=>{});
  } else if (phase === 1) {
    targetSides = 4; 
    shrinkSpeed = 1.2;
    backgroundColor = "#1a1a2e"; 
    kingdomName.innerText = "REINO TERRESTRE";
    bgmTerrestrial.play().catch(()=>{});
  } else if (phase === 2) {
    targetSides = 10; 
    shrinkSpeed = 1.8;
    backgroundColor = "#331100"; 
    kingdomName.innerText = "REINO CELESTIAL";
    bgmCelestial.play().catch(()=>{});
  }
  
  scoreDisplay.innerText = phase + 1;
  uiContainer.classList.remove('hidden');
  
  showScripture(scriptures[phase]);
  
  // Cria alvos iniciais
  for(let i=0; i<3; i++) spawnTarget();
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
  outerRadius += 500; // Empurra a prisão longe
  setTimeout(() => {
    if (currentPhase < 2) {
      initPhase(currentPhase + 1);
    } else {
      showScripture("Você alcançou a Glória Eterna!");
      outerRadius = 9999; 
      shrinkSpeed = 0;
    }
  }, 1000);
}

// ---- INPUT DA ESPADA (Corte Ninja) ----

function updateBlade(x, y) {
  bladePoints.push({x: x, y: y, time: Date.now()});
  // Mantém apenas os últimos pontos para formar o rastro
  if (bladePoints.length > 8) bladePoints.shift();
  checkCuts();
}

// Suporte para Mouse e Touch (Celular)
window.addEventListener('pointerdown', (e) => {
  if (!isPlaying) return;
  e.preventDefault();
  isDragging = true;
  bladePoints = [{x: e.clientX, y: e.clientY, time: Date.now()}];
}, { passive: false });

window.addEventListener('pointermove', (e) => {
  if (!isPlaying || !isDragging) return;
  e.preventDefault();
  updateBlade(e.clientX, e.clientY);
}, { passive: false });

window.addEventListener('pointerup', () => {
  isDragging = false;
}, { passive: false });

// BOTOES DE START E RESTART
btnStart.addEventListener('click', startGame);
btnRestart.addEventListener('click', startGame);

// Interseção de linhas para saber se a espada cortou o palito
function lineIntersect(x1, y1, x2, y2, x3, y3, x4, y4) {
  const den = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
  if (den === 0) return false;
  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / den;
  const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / den;
  return t >= 0 && t <= 1 && u >= 0 && u <= 1;
}

function checkCuts() {
  if (bladePoints.length < 2) return;
  const p1 = bladePoints[bladePoints.length - 2];
  const p2 = bladePoints[bladePoints.length - 1];
  
  floatingTargets.forEach(t => {
    if (!t.active) return;
    
    let hit = false;
    if (t.isOrb) {
      // Corte em bolinha (Reino Celestial) - usa distância
      const dist = Math.hypot(p2.x - t.x, p2.y - t.y);
      if (dist < t.size + 20) hit = true;
    } else {
      // Corte em Palito - usa interseção de linha geométrica
      const dx = Math.cos(t.angle) * (t.size/2);
      const dy = Math.sin(t.angle) * (t.size/2);
      const lineX1 = t.x - dx, lineY1 = t.y - dy;
      const lineX2 = t.x + dx, lineY2 = t.y + dy;
      hit = lineIntersect(p1.x, p1.y, p2.x, p2.y, lineX1, lineY1, lineX2, lineY2);
      
      // Checagem de raio extra caso a pessoa corte muito rápido
      if (!hit) {
         if (Math.hypot(p2.x - t.x, p2.y - t.y) < 40) hit = true;
      }
    }
    
    if (hit) {
      t.active = false;
      createCutEffect(t.x, t.y);
      sidesDrawn++;
      outerRadius += 25; // Recompensa: empurra a prisão pra longe
      
      if (sidesDrawn === targetSides) {
        advancePhase();
      }
    }
  });
}

// ---- RENDERIZAÇÃO ----

function createCutEffect(x, y) {
  for(let i=0; i<20; i++) {
    particles.push({
      x: x, y: y,
      vx: (Math.random() - 0.5) * 15,
      vy: (Math.random() - 0.5) * 15,
      life: 1,
      size: 4,
      color: "#ffffff"
    });
  }
}

function createExplosion() {
  const cx = cw / 2;
  const cy = ch / 2;
  const color = currentPhase === 0 ? "#00ffff" : currentPhase === 1 ? "#ff00ff" : "#ffff00";
  for(let i=0; i<60; i++) {
    particles.push({
      x: cx, y: cy,
      vx: (Math.random() - 0.5) * 25,
      vy: (Math.random() - 0.5) * 25,
      life: 1,
      size: Math.random() * 6 + 2,
      color: color
    });
  }
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

function drawPolygon(ctx, x, y, radius, sides, progress, color, lineWidth) {
  if (sides < 3 && currentPhase < 2) {
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
  const offset = sides === 4 ? Math.PI/4 : -Math.PI/2;
  
  for (let i = 0; i <= sides; i++) {
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
    ctx.lineWidth = 8;
    ctx.shadowColor = color;
    ctx.shadowBlur = 15;
    ctx.stroke();
  }
  ctx.shadowBlur = 0;
}

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

function drawBladeTrail() {
  const now = Date.now();
  bladePoints = bladePoints.filter(p => now - p.time < 150); // Remove pontos antigos
  
  if (bladePoints.length < 2) return;
  
  ctx.beginPath();
  ctx.moveTo(bladePoints[0].x, bladePoints[0].y);
  for (let i = 1; i < bladePoints.length; i++) {
    ctx.lineTo(bladePoints[i].x, bladePoints[i].y);
  }
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 8;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.shadowColor = "#00ffff";
  ctx.shadowBlur = 20;
  ctx.stroke();
  ctx.shadowBlur = 0;
}

function gameLoop() {
  if (!isPlaying) return;
  gameLoopId = requestAnimationFrame(gameLoop);
  
  // Lógica da Prisão
  outerRadius -= shrinkSpeed;
  if (outerRadius <= innerRadius) {
    gameOver();
    return;
  }
  
  // Respawn de alvos (Palitos voadores)
  if (Math.random() < 0.03 && floatingTargets.length < 6) {
    spawnTarget();
  }
  
  // Desenha Fundo
  drawBackground();
  
  // Desenha Alvos
  for (let i = floatingTargets.length - 1; i >= 0; i--) {
    let t = floatingTargets[i];
    if (!t.active) {
      floatingTargets.splice(i, 1);
      continue;
    }
    t.x += t.vx;
    t.y += t.vy;
    t.angle += t.vAngle;
    
    // Some se sair muito da tela
    if (t.x < -100 || t.x > cw + 100 || t.y < -100 || t.y > ch + 100) {
      t.active = false;
      continue;
    }
    
    ctx.save();
    ctx.translate(t.x, t.y);
    ctx.rotate(t.angle);
    const glowColor = currentPhase === 0 ? "#00ffff" : currentPhase === 1 ? "#ff00ff" : "#ffff00";
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 15;
    
    if (t.isOrb) {
      ctx.beginPath();
      ctx.arc(0, 0, t.size/2, 0, Math.PI*2);
      ctx.fillStyle = glowColor;
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.moveTo(-t.size/2, 0);
      ctx.lineTo(t.size/2, 0);
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 10;
      ctx.lineCap = "round";
      ctx.stroke();
    }
    ctx.restore();
  }
  
  // Desenha Partículas e Espada
  updateAndDrawParticles();
  drawBladeTrail();
  
  const cx = cw / 2;
  const cy = ch / 2;
  
  // A PRISÃO
  const prisonColor = "#ff2222";
  if (currentPhase === 0) {
    drawPolygon(ctx, cx, cy, outerRadius, 3, 3, prisonColor, 8);
  } else if (currentPhase === 1) {
    drawPolygon(ctx, cx, cy, outerRadius, 4, 4, prisonColor, 8);
  } else if (currentPhase === 2) {
    drawCircle(ctx, cx, cy, outerRadius, prisonColor, false);
  }
  
  // O JOGADOR (Em Construção)
  const playerColor = currentPhase === 0 ? "#00ffff" : currentPhase === 1 ? "#ff00ff" : "#ffff00";
  
  if (currentPhase === 2) {
    const currentRad = innerRadius + (sidesDrawn * 4);
    drawCircle(ctx, cx, cy, currentRad, playerColor, true);
    drawCircle(ctx, cx, cy, currentRad + 20, "#ffffff", false);
  } else {
    drawPolygon(ctx, cx, cy, innerRadius, targetSides, sidesDrawn, playerColor, 8);
  }
}

// BOTOES DE START E RESTART
btnStart.addEventListener('click', startGame);
btnRestart.addEventListener('click', startGame);
