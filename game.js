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
let currentPhase = 0; // 0=Telestial, 1=Terrestre, 2=Celestial, 3=Criador de Mundos
let sidesDrawn = 0;
let targetSides = 3;
let outerRadius = 0;
let innerRadius = 60;
let shrinkSpeed = 0;
let gameLoopId;
let particles = [];
let backgroundColor = "#0a0a1a";

let planetsCreated = 0;

// Mecânica de Corte (Blade)
let isDragging = false;
let bladePoints = [];
let floatingTargets = [];

const scriptures = [
  "Glória das Estrelas: Reino Telestial. Lute contra a escuridão!",
  "Glória da Lua: Reino Terrestre. A prisão acelera!",
  "Glória do Sol: Reino Celestial. Absorva a Luz Perfeita!",
  "Você se tornou um Criador. Organize a matéria e salve as almas!"
];

function unlockAudio() {
  bgmTelestial.load();
  bgmTerrestrial.load();
  bgmCelestial.load();
  document.removeEventListener('pointerdown', unlockAudio);
}
document.addEventListener('pointerdown', unlockAudio);

function spawnTarget() {
  const isGodMode = currentPhase === 3;
  const isCelestial = currentPhase === 2;
  const size = isGodMode ? 70 : (isCelestial ? 40 : 80);
  
  let x, y, vx, vy;
  
  if (isGodMode) {
    // Modo Deus: vêm das bordas em direção ao centro
    const angle = Math.random() * Math.PI * 2;
    const spawnRadius = Math.max(cw, ch) * 0.7;
    x = cw/2 + Math.cos(angle) * spawnRadius;
    y = ch/2 + Math.sin(angle) * spawnRadius;
    
    const speed = Math.random() * 2 + 1.5;
    vx = -Math.cos(angle) * speed;
    vy = -Math.sin(angle) * speed;
  } else {
    // Modo Normal: cruzam a tela
    x = Math.random() < 0.5 ? -50 : cw + 50;
    y = Math.random() * ch * 0.7 + (ch * 0.15);
    vx = (x < 0 ? 1 : -1) * (Math.random() * 2 + 1.5);
    vy = (Math.random() - 0.5) * 3;
  }
  
  // Tipos para Modo Deus: 0 = Matéria (Roda/Cruz), 1 = Inimigo (Trevas)
  let type = 0; 
  if (isGodMode) {
    type = Math.random() > 0.6 ? 1 : 0; 
  }
  
  floatingTargets.push({
    x: x, y: y, vx: vx, vy: vy,
    angle: Math.random() * Math.PI,
    vAngle: (Math.random() - 0.5) * 0.05,
    size: size,
    isOrb: isCelestial,
    type: type, // 0 = normal/matéria, 1 = nave das trevas
    shapeType: Math.floor(Math.random() * 2), // 0 = Roda, 1 = Cruz (para matéria)
    active: true
  });
}

function initPhase(phase) {
  currentPhase = phase;
  sidesDrawn = 0;
  outerRadius = Math.max(cw, ch) * 0.8;
  innerRadius = phase === 3 ? 20 : 60; // Começa pequeno no Modo Deus
  particles = [];
  floatingTargets = [];
  bladePoints = [];
  
  bgmTelestial.pause();
  bgmTerrestrial.pause();
  bgmCelestial.pause();
  
  if (phase === 0) {
    targetSides = 3; 
    shrinkSpeed = 1.8; // MAIS RÁPIDO
    backgroundColor = "#050510"; 
    kingdomName.innerText = "REINO TELESTIAL";
    planetsCreated = 0;
    bgmTelestial.play().catch(()=>{});
  } else if (phase === 1) {
    targetSides = 4; 
    shrinkSpeed = 2.5; // MUITO MAIS RÁPIDO
    backgroundColor = "#1a1a2e"; 
    kingdomName.innerText = "REINO TERRESTRE";
    bgmTerrestrial.play().catch(()=>{});
  } else if (phase === 2) {
    targetSides = 10; 
    shrinkSpeed = 3.5; // INSANO
    backgroundColor = "#331100"; 
    kingdomName.innerText = "REINO CELESTIAL";
    bgmCelestial.play().catch(()=>{});
  } else if (phase === 3) {
    shrinkSpeed = 0; // Prisão não fecha mais
    backgroundColor = "#000005"; // Espaço profundo
    kingdomName.innerText = "CRIADOR DE MUNDOS";
    bgmCelestial.play().catch(()=>{});
  }
  
  if (phase < 3) {
    scoreDisplay.innerText = "Nível " + (phase + 1);
  } else {
    scoreDisplay.innerText = "Planetas: " + planetsCreated;
  }
  
  uiContainer.classList.remove('hidden');
  showScripture(scriptures[phase]);
  
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

function gameOver(reason) {
  isPlaying = false;
  cancelAnimationFrame(gameLoopId);
  screenGameOver.classList.remove('hidden');
  const deathReason = document.getElementById('death-reason');
  if (deathReason) deathReason.innerText = reason || "A prisão te esmagou.";
  
  finalScoreDisplay.innerText = currentPhase < 3 ? ("Fase " + (currentPhase + 1)) : (planetsCreated + " Planetas");
  uiContainer.classList.add('hidden');
}

function advancePhase() {
  createExplosion(cw/2, ch/2, currentPhase);
  outerRadius += 500;
  
  if (currentPhase === 3) {
    // Criou um planeta!
    planetsCreated++;
    scoreDisplay.innerText = "Planetas: " + planetsCreated;
    showScripture("Mundo Criado! Haja Luz!");
    innerRadius = 20; // Reseta tamanho do novo planeta
    // Limpa tela
    floatingTargets = [];
    return;
  }
  
  setTimeout(() => {
    initPhase(currentPhase + 1);
  }, 1000);
}

// ---- INPUT DA ESPADA ----

function updateBlade(x, y) {
  bladePoints.push({x: x, y: y, time: Date.now()});
  if (bladePoints.length > 8) bladePoints.shift();
  checkCuts();
}

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

btnStart.addEventListener('click', startGame);
btnRestart.addEventListener('click', startGame);

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
    
    // Distância radial para quase todos agora para simplificar os formatos complexos
    const dist = Math.hypot(p2.x - t.x, p2.y - t.y);
    if (dist < t.size/2 + 25) {
      hit = true;
    }
    
    if (hit) {
      t.active = false;
      
      if (currentPhase === 3) {
        if (t.type === 0) {
          // Fatiou matéria (construiu planeta)
          createCutEffect(t.x, t.y, "#ffffff");
          innerRadius += 8; // Cresce o planeta
          if (innerRadius > 150) {
            advancePhase(); // Terminou o planeta!
          }
        } else {
          // Fatiou nave das trevas (salvou alma)
          createSoulSalvationEffect(t.x, t.y);
        }
      } else {
        // Fases Normais
        createCutEffect(t.x, t.y, "#ffffff");
        sidesDrawn++;
        outerRadius += 30; // Mais fôlego!
        if (sidesDrawn === targetSides) advancePhase();
      }
    }
  });
}

// ---- RENDERIZAÇÃO ----

function createCutEffect(x, y, color) {
  for(let i=0; i<20; i++) {
    particles.push({
      x: x, y: y,
      vx: (Math.random() - 0.5) * 15,
      vy: (Math.random() - 0.5) * 15,
      life: 1,
      size: 4,
      color: color
    });
  }
}

function createSoulSalvationEffect(x, y) {
  // Almas subindo (Brancas)
  for(let i=0; i<15; i++) {
    particles.push({
      x: x, y: y,
      vx: (Math.random() - 0.5) * 5,
      vy: -Math.random() * 8 - 2, // Sobe rápido
      life: 1,
      size: 5,
      color: "#ffffff"
    });
  }
}

function createExplosion(x, y, phase) {
  const color = phase === 0 ? "#00ffff" : phase === 1 ? "#ff00ff" : "#ffff00";
  for(let i=0; i<60; i++) {
    particles.push({
      x: x, y: y,
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

// Desenha obstáculos nostálgicos da Fase 4
function drawWheel(ctx, size) {
  const colors = ["#ff00ff", "#00ffff", "#ffff00", "#800080"]; // Cores classicas
  ctx.lineWidth = 8;
  for(let i=0; i<4; i++){
    ctx.beginPath();
    ctx.arc(0, 0, size/2, (Math.PI/2)*i, (Math.PI/2)*(i+1));
    ctx.strokeStyle = colors[i];
    ctx.stroke();
  }
}

function drawCross(ctx, size) {
  const colors = ["#ff00ff", "#00ffff", "#ffff00", "#800080"];
  ctx.lineWidth = 8;
  const l = size/2;
  ctx.lineCap = "round";
  
  ctx.strokeStyle = colors[0]; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(0,-l); ctx.stroke();
  ctx.strokeStyle = colors[1]; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(l,0); ctx.stroke();
  ctx.strokeStyle = colors[2]; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(0,l); ctx.stroke();
  ctx.strokeStyle = colors[3]; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(-l,0); ctx.stroke();
}

function drawUFO(ctx, size) {
  // Nave das trevas
  ctx.fillStyle = "#111111";
  ctx.shadowColor = "#ff0000";
  ctx.shadowBlur = 15;
  ctx.beginPath();
  ctx.ellipse(0, 0, size/2, size/4, 0, 0, Math.PI*2);
  ctx.fill();
  
  ctx.fillStyle = "#ff0000"; // Olho vermelho
  ctx.beginPath();
  ctx.arc(0, -size/8, size/8, 0, Math.PI*2);
  ctx.fill();
  ctx.shadowBlur = 0;
}

const stars = Array.from({length: 150}, () => ({
  x: Math.random(), y: Math.random(), size: Math.random() * 2
}));

function drawBackground() {
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, cw, ch);
  
  if (currentPhase === 0 || currentPhase === 2 || currentPhase === 3) {
    ctx.fillStyle = (currentPhase === 2 || currentPhase === 3) ? "#ffd700" : "#ffffff";
    stars.forEach(s => {
      ctx.beginPath(); ctx.arc(s.x * cw, s.y * ch, s.size, 0, Math.PI*2); ctx.fill();
    });
  }
}

function drawBladeTrail() {
  const now = Date.now();
  bladePoints = bladePoints.filter(p => now - p.time < 150); 
  if (bladePoints.length < 2) return;
  
  ctx.beginPath();
  ctx.moveTo(bladePoints[0].x, bladePoints[0].y);
  for (let i = 1; i < bladePoints.length; i++) ctx.lineTo(bladePoints[i].x, bladePoints[i].y);
  
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 10;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.shadowColor = currentPhase === 3 ? "#ffffaa" : "#00ffff"; // Fica divino na fase 4
  ctx.shadowBlur = 25;
  ctx.stroke();
  ctx.shadowBlur = 0;
}

function gameLoop() {
  if (!isPlaying) return;
  gameLoopId = requestAnimationFrame(gameLoop);
  const cx = cw / 2;
  const cy = ch / 2;
  
  // LÓGICA DE FASES
  if (currentPhase < 3) {
    outerRadius -= shrinkSpeed;
    if (outerRadius <= innerRadius) {
      gameOver("A escuridão te engoliu.");
      return;
    }
  }
  
  // RESPAWN
  const spawnRate = currentPhase === 3 ? 0.05 : 0.03; // Mais rápido no modo Deus
  if (Math.random() < spawnRate && floatingTargets.length < 8) {
    spawnTarget();
  }
  
  drawBackground();
  
  // DESENHA ALVOS
  for (let i = floatingTargets.length - 1; i >= 0; i--) {
    let t = floatingTargets[i];
    if (!t.active) {
      floatingTargets.splice(i, 1);
      continue;
    }
    t.x += t.vx;
    t.y += t.vy;
    t.angle += t.vAngle;
    
    if (currentPhase === 3) {
      // Inimigos atacam o planeta central
      if (t.type === 1) {
         const distToCenter = Math.hypot(t.x - cx, t.y - cy);
         if (distToCenter < innerRadius + 10) {
           t.active = false;
           createCutEffect(t.x, t.y, "#ff0000"); // Sangrou o planeta
           innerRadius -= 20; // Planeta encolhe
           if (innerRadius <= 10) {
             gameOver("As trevas destruíram o seu mundo.");
             return;
           }
           continue; // Pula o resto do desenho
         }
      }
    }
    
    // Limite de tela normal
    if (t.x < -100 || t.x > cw + 100 || t.y < -100 || t.y > ch + 100) {
      t.active = false;
      continue;
    }
    
    ctx.save();
    ctx.translate(t.x, t.y);
    ctx.rotate(t.angle);
    
    if (currentPhase === 3) {
      if (t.type === 1) {
        drawUFO(ctx, t.size); // Nave Inimiga das Trevas
      } else {
        // Matéria Nostálgica (Rodas e Cruzes do Color Switch)
        if (t.shapeType === 0) drawWheel(ctx, t.size);
        else drawCross(ctx, t.size);
      }
    } else {
      // Fases Normais
      const glowColor = currentPhase === 0 ? "#00ffff" : currentPhase === 1 ? "#ff00ff" : "#ffff00";
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 15;
      if (t.isOrb) {
        ctx.beginPath(); ctx.arc(0, 0, t.size/2, 0, Math.PI*2); ctx.fillStyle = glowColor; ctx.fill();
      } else {
        ctx.beginPath(); ctx.moveTo(-t.size/2, 0); ctx.lineTo(t.size/2, 0); ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 10; ctx.lineCap = "round"; ctx.stroke();
      }
    }
    ctx.restore();
  }
  
  updateAndDrawParticles();
  drawBladeTrail();
  
  // DESENHA PRISÃO / PLANETA ESTRUTURAL
  if (currentPhase < 3) {
    const prisonColor = "#ff2222";
    if (currentPhase === 0) drawPolygon(ctx, cx, cy, outerRadius, 3, 3, prisonColor, 8);
    else if (currentPhase === 1) drawPolygon(ctx, cx, cy, outerRadius, 4, 4, prisonColor, 8);
    else if (currentPhase === 2) drawCircle(ctx, cx, cy, outerRadius, prisonColor, false);
    
    const playerColor = currentPhase === 0 ? "#00ffff" : currentPhase === 1 ? "#ff00ff" : "#ffff00";
    if (currentPhase === 2) {
      const currentRad = innerRadius + (sidesDrawn * 5);
      drawCircle(ctx, cx, cy, currentRad, playerColor, true);
      drawCircle(ctx, cx, cy, currentRad + 20, "#ffffff", false);
    } else {
      drawPolygon(ctx, cx, cy, innerRadius, targetSides, sidesDrawn, playerColor, 8);
    }
  } else {
    // FASE 4: O PLANETA GIGANTE NO CENTRO
    // O planeta é feito de anéis coloridos da matéria que ele absorve
    drawCircle(ctx, cx, cy, innerRadius, "#112244", true); // Núcleo
    for (let r = 20; r < innerRadius; r += 15) {
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2);
      ctx.strokeStyle = `hsl(${(r * 10) % 360}, 100%, 50%)`; // Cores do arco-íris
      ctx.lineWidth = 5; ctx.stroke();
    }
  }
}
