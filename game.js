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
let currentPhase = 0; 
let sidesDrawn = 0;
let targetSides = 3;
let outerRadius = 0;
let innerRadius = 60;
let shrinkSpeed = 0;
let gameLoopId;
let particles = [];
let backgroundColor = "#0a0a1a";

let planetsCreated = 0;
const PLANETS_TO_WIN = 3;
let highestPhaseReached = 0;

// Mecânica de Corte (Blade)
let isDragging = false;
let bladePoints = [];
let floatingTargets = [];
let dancingGods = []; // Para a Fase 6

const scriptures = [
  "Glória das Estrelas: Lute contra a escuridão!",
  "Glória da Lua: A prisão acelera!",
  "Glória do Sol: Absorva a Luz Perfeita!",
  "Deus Criador: Organize a matéria e defenda seu mundo!",
  "Trevas Exteriores: Resgate seus filhos espirituais. CUIDADO COM A PERDIÇÃO!",
  "Guiando os Filhos: Ajude-os a passar pelas provações rapidamente!",
  "A Exaltação Eterna: Famílias para sempre. A glória não tem fim!"
];

function unlockAudio() {
  bgmTelestial.load();
  bgmTerrestrial.load();
  bgmCelestial.load();
  document.removeEventListener('pointerdown', unlockAudio);
}
document.addEventListener('pointerdown', unlockAudio);

function spawnTarget() {
  let x, y, vx, vy;
  let type = 0; 
  let size = 60;
  let shapeType = 0;
  let isOrb = false;
  
  if (currentPhase === 3) { // Deus
    size = 70;
    const angle = Math.random() * Math.PI * 2;
    const spawnRadius = Math.max(cw, ch) * 0.7;
    x = cw/2 + Math.cos(angle) * spawnRadius;
    y = ch/2 + Math.sin(angle) * spawnRadius;
    const speed = Math.random() * 2 + 1.5;
    vx = -Math.cos(angle) * speed;
    vy = -Math.sin(angle) * speed;
    type = Math.random() > 0.6 ? 1 : 0; 
    shapeType = Math.floor(Math.random() * 2);
  } else if (currentPhase === 4) { // Perdição
    size = 50;
    x = Math.random() * cw * 0.8 + (cw * 0.1);
    y = ch + 50;
    vx = (Math.random() - 0.5) * 4;
    vy = - (Math.random() * 4 + 8); 
    type = Math.random() > 0.7 ? 3 : 2; // 2=Filho Espiritual(Alma), 3=Filho da Perdição(Bomba)
    isOrb = (type === 2);
  } else if (currentPhase === 5) { // Guiando os Filhos (Turbo)
    size = 40;
    isOrb = true;
    x = Math.random() < 0.5 ? -50 : cw + 50;
    y = Math.random() * ch * 0.7 + (ch * 0.15);
    vx = (x < 0 ? 1 : -1) * (Math.random() * 3 + 2.5); // Bem rápido
    vy = (Math.random() - 0.5) * 4;
    type = 0;
  } else if (currentPhase === 6) {
    // Festa dos deuses (nao spawna alvos fatiáveis normais)
    return;
  } else {
    // Modo Normal (0, 1, 2)
    size = currentPhase === 2 ? 40 : 80;
    isOrb = currentPhase === 2;
    x = Math.random() < 0.5 ? -50 : cw + 50;
    y = Math.random() * ch * 0.7 + (ch * 0.15);
    vx = (x < 0 ? 1 : -1) * (Math.random() * 2 + 1.5);
    vy = (Math.random() - 0.5) * 3;
    type = 0;
  }
  
  floatingTargets.push({
    x: x, y: y, vx: vx, vy: vy,
    angle: Math.random() * Math.PI,
    vAngle: (Math.random() - 0.5) * 0.05,
    size: size,
    isOrb: isOrb,
    type: type, 
    shapeType: shapeType,
    active: true
  });
}

function initPhase(phase) {
  currentPhase = phase;
  if (phase > highestPhaseReached) highestPhaseReached = phase;
  
  sidesDrawn = 0;
  outerRadius = Math.max(cw, ch) * 0.8;
  innerRadius = (phase === 3) ? 20 : 60;
  particles = [];
  floatingTargets = [];
  bladePoints = [];
  dancingGods = [];
  
  bgmTelestial.pause();
  bgmTerrestrial.pause();
  bgmCelestial.pause();
  
  kingdomName.style.color = "white"; // reseta
  
  if (phase === 0) {
    targetSides = 3; shrinkSpeed = 1.0; backgroundColor = "#050510"; kingdomName.innerText = "REINO TELESTIAL";
    planetsCreated = 0; bgmTelestial.play().catch(()=>{});
  } else if (phase === 1) {
    targetSides = 4; shrinkSpeed = 1.2; backgroundColor = "#1a1a2e"; kingdomName.innerText = "REINO TERRESTRE";
    bgmTerrestrial.play().catch(()=>{});
  } else if (phase === 2) {
    targetSides = 10; shrinkSpeed = 1.5; backgroundColor = "#331100"; kingdomName.innerText = "REINO CELESTIAL";
    bgmCelestial.play().catch(()=>{});
  } else if (phase === 3) {
    shrinkSpeed = 0; backgroundColor = "#000005"; kingdomName.innerText = "CRIADOR DE MUNDOS";
    bgmCelestial.play().catch(()=>{});
  } else if (phase === 4) {
    targetSides = 15; shrinkSpeed = 0; backgroundColor = "#000000"; 
    kingdomName.innerText = "TREVAS EXTERIORES (PERDIÇÃO)";
    kingdomName.style.color = "#ff3333";
    bgmTerrestrial.play().catch(()=>{}); 
  } else if (phase === 5) {
    targetSides = 15; shrinkSpeed = 3.0; // Prisão volta e é rápida!
    backgroundColor = "#110022"; kingdomName.innerText = "GUIANDO SEUS FILHOS";
    bgmTelestial.play().catch(()=>{}); 
  } else if (phase === 6) {
    shrinkSpeed = 0; backgroundColor = "#ffffaa"; // Dourado claro brilhante
    kingdomName.innerText = "A FESTA DOS DEUSES";
    kingdomName.style.color = "#885500";
    bgmCelestial.play().catch(()=>{});
    for(let i=0; i<30; i++) spawnDancingGod();
  }
  
  if (phase < 3) {
    scoreDisplay.innerText = "Nível " + (phase + 1);
  } else if (phase === 3) {
    scoreDisplay.innerText = "Planetas: " + planetsCreated + "/" + PLANETS_TO_WIN;
  } else if (phase === 4) {
    scoreDisplay.innerText = "Filhos Salvos: 0/" + targetSides;
  } else if (phase === 5) {
    scoreDisplay.innerText = "Filhos Guiados: 0/" + targetSides;
  } else if (phase === 6) {
    scoreDisplay.innerText = "Infinito";
  }
  
  uiContainer.classList.remove('hidden');
  showScripture(scriptures[phase]);
  
  if (phase !== 6) {
    for(let i=0; i<3; i++) spawnTarget();
  }
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

function startGame(startPhase = 0) {
  screenMenu.classList.add('hidden');
  screenGameOver.classList.add('hidden');
  kingdomName.style.color = "white"; 
  isPlaying = true;
  initPhase(startPhase);
  if (!gameLoopId) gameLoop();
}

function handleRestart() {
  // Checkpoint: Se já foi Deus (Fase 3 ou mais), volta pro modo Deus ao invés da Fase 0.
  if (highestPhaseReached >= 3) {
    startGame(3);
  } else {
    startGame(0);
  }
}

function gameOver(reason) {
  isPlaying = false;
  // cancelAnimationFrame(gameLoopId); // Nao vamos cancelar para o fundo continuar animando sutilmente se quisermos, mas ok cancelar
  screenGameOver.classList.remove('hidden');
  const deathReason = document.getElementById('death-reason');
  if (deathReason) deathReason.innerText = reason || "A escuridão venceu.";
  
  if (currentPhase < 3) finalScoreDisplay.innerText = "Fase " + (currentPhase + 1);
  else if (currentPhase === 3) finalScoreDisplay.innerText = planetsCreated + " Planetas";
  else if (currentPhase === 4) finalScoreDisplay.innerText = sidesDrawn + " Filhos Salvos";
  else if (currentPhase === 5) finalScoreDisplay.innerText = sidesDrawn + " Filhos Guiados";
  
  uiContainer.classList.add('hidden');
}

function advancePhase() {
  createExplosion(cw/2, ch/2, currentPhase);
  outerRadius += 500;
  
  if (currentPhase === 3) {
    planetsCreated++;
    scoreDisplay.innerText = "Planetas: " + planetsCreated + "/" + PLANETS_TO_WIN;
    innerRadius = 20; 
    floatingTargets = [];
    
    if (planetsCreated >= PLANETS_TO_WIN) {
      setTimeout(() => initPhase(4), 1000);
    } else {
      showScripture("Mundo Criado! Haja Luz!");
    }
    return;
  }
  
  if (currentPhase === 6) return; // Fica aqui pra sempre
  
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

btnStart.addEventListener('click', () => startGame(0));
btnRestart.addEventListener('click', handleRestart);

function checkCuts() {
  if (bladePoints.length < 2) return;
  const p1 = bladePoints[bladePoints.length - 2];
  const p2 = bladePoints[bladePoints.length - 1];
  
  floatingTargets.forEach(t => {
    if (!t.active) return;
    
    let hit = false;
    const dist = Math.hypot(p2.x - t.x, p2.y - t.y);
    if (dist < t.size/2 + 25) {
      hit = true;
    }
    
    if (hit) {
      t.active = false;
      
      if (currentPhase === 3) {
        if (t.type === 0) {
          createCutEffect(t.x, t.y, "#ffffff");
          innerRadius += 25; 
          if (innerRadius >= 120) advancePhase();
        } else if (t.type === 1) {
          createSoulSalvationEffect(t.x, t.y);
        }
      } else if (currentPhase === 4) {
        if (t.type === 2) {
          createCutEffect(t.x, t.y, "#ffffff");
          createSoulSalvationEffect(t.x, t.y);
          sidesDrawn++;
          scoreDisplay.innerText = "Filhos Salvos: " + sidesDrawn + "/" + targetSides;
          if (sidesDrawn === targetSides) advancePhase();
        } else if (t.type === 3) {
          createExplosion(t.x, t.y, 4, "#ff0000"); 
          gameOver("Você cortou a Perdição! Seus filhos espirituais choram.");
        }
      } else if (currentPhase === 5) {
         createCutEffect(t.x, t.y, "#ffffff");
         sidesDrawn++;
         outerRadius += 40; 
         scoreDisplay.innerText = "Filhos Guiados: " + sidesDrawn + "/" + targetSides;
         if (sidesDrawn === targetSides) advancePhase();
      } else {
        createCutEffect(t.x, t.y, "#ffffff");
        sidesDrawn++;
        outerRadius += 30; 
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
      life: 1, size: 4, color: color
    });
  }
}

function createSoulSalvationEffect(x, y) {
  for(let i=0; i<20; i++) {
    particles.push({
      x: x, y: y,
      vx: (Math.random() - 0.5) * 5,
      vy: -Math.random() * 8 - 4, 
      life: 1, size: 5, color: "#ffffff"
    });
  }
}

function createExplosion(x, y, phase, forceColor) {
  const color = forceColor || (phase === 0 ? "#00ffff" : phase === 1 ? "#ff00ff" : "#ffff00");
  for(let i=0; i<80; i++) {
    particles.push({
      x: x, y: y,
      vx: (Math.random() - 0.5) * 35,
      vy: (Math.random() - 0.5) * 35,
      life: 1, size: Math.random() * 6 + 2, color: color
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
    ctx.beginPath(); ctx.moveTo(x, y - radius);
    if (sides > 0) ctx.lineTo(x + radius * Math.cos(Math.PI/6), y + radius * Math.sin(Math.PI/6));
    if (sides > 1) ctx.lineTo(x - radius * Math.cos(Math.PI/6), y + radius * Math.sin(Math.PI/6));
    ctx.strokeStyle = color; ctx.lineWidth = lineWidth; ctx.stroke();
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
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.strokeStyle = color; ctx.lineWidth = lineWidth; ctx.lineJoin = 'round';
  ctx.shadowColor = color; ctx.shadowBlur = 15; ctx.stroke(); ctx.shadowBlur = 0;
}

function drawCircle(ctx, x, y, radius, color, isSolid = false) {
  ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2);
  if (isSolid) {
    ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 30; ctx.fill();
  } else {
    ctx.strokeStyle = color; ctx.lineWidth = 8; ctx.shadowColor = color; ctx.shadowBlur = 15; ctx.stroke();
  }
  ctx.shadowBlur = 0;
}

function drawWheel(ctx, size) {
  const colors = ["#ff00ff", "#00ffff", "#ffff00", "#800080"];
  ctx.lineWidth = 8;
  for(let i=0; i<4; i++){
    ctx.beginPath(); ctx.arc(0, 0, size/2, (Math.PI/2)*i, (Math.PI/2)*(i+1)); ctx.strokeStyle = colors[i]; ctx.stroke();
  }
}

function drawCross(ctx, size) {
  const colors = ["#ff00ff", "#00ffff", "#ffff00", "#800080"];
  ctx.lineWidth = 8; const l = size/2; ctx.lineCap = "round";
  ctx.strokeStyle = colors[0]; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(0,-l); ctx.stroke();
  ctx.strokeStyle = colors[1]; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(l,0); ctx.stroke();
  ctx.strokeStyle = colors[2]; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(0,l); ctx.stroke();
  ctx.strokeStyle = colors[3]; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(-l,0); ctx.stroke();
}

function drawUFO(ctx, size) {
  ctx.fillStyle = "#111111"; ctx.shadowColor = "#ff0000"; ctx.shadowBlur = 15;
  ctx.beginPath(); ctx.ellipse(0, 0, size/2, size/4, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = "#ff0000"; ctx.beginPath(); ctx.arc(0, -size/8, size/8, 0, Math.PI*2); ctx.fill();
  ctx.shadowBlur = 0;
}

function drawSoul(ctx, size) {
  ctx.fillStyle = "rgba(200, 230, 255, 0.9)";
  ctx.shadowColor = "#ffffff"; ctx.shadowBlur = 20;
  ctx.beginPath(); ctx.arc(0, 0, size/3, 0, Math.PI*2); ctx.fill();
  ctx.shadowBlur = 0;
}

function drawBomb(ctx, size) {
  ctx.fillStyle = "#220000"; ctx.strokeStyle = "#ff0000"; ctx.lineWidth = 3;
  ctx.shadowColor = "#ff0000"; ctx.shadowBlur = 15;
  
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI / 4) * i;
    const r = (i % 2 === 0) ? size/2 : size/4;
    const px = Math.cos(angle) * r;
    const py = Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill(); ctx.stroke(); ctx.shadowBlur = 0;
}

const stars = Array.from({length: 150}, () => ({
  x: Math.random(), y: Math.random(), size: Math.random() * 2
}));

function spawnDancingGod() {
  dancingGods.push({
    x: Math.random() * cw,
    y: Math.random() * ch,
    vx: (Math.random() - 0.5) * 5,
    vy: (Math.random() - 0.5) * 5,
    size: Math.random() * 20 + 15,
    hue: Math.random() * 60 + 30 // Dourados/Amarelos
  });
}

function drawBackground() {
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, cw, ch);
  
  if (currentPhase === 0 || currentPhase === 2 || currentPhase === 3) {
    ctx.fillStyle = (currentPhase === 2 || currentPhase === 3) ? "#ffd700" : "#ffffff";
    stars.forEach(s => {
      ctx.beginPath(); ctx.arc(s.x * cw, s.y * ch, s.size, 0, Math.PI*2); ctx.fill();
    });
  }
  
  if (currentPhase === 6) {
    // Fogos de artifício eternos e deuses dançando
    if (Math.random() < 0.05) createExplosion(Math.random() * cw, Math.random() * ch, 0, `hsl(${Math.random()*360}, 100%, 50%)`);
    
    dancingGods.forEach(g => {
      g.x += g.vx; g.y += g.vy;
      if (g.x < 0 || g.x > cw) g.vx *= -1;
      if (g.y < 0 || g.y > ch) g.vy *= -1;
      
      ctx.beginPath();
      ctx.arc(g.x, g.y, g.size, 0, Math.PI*2);
      ctx.fillStyle = `hsl(${g.hue}, 100%, 50%)`;
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 30;
      ctx.fill();
      ctx.shadowBlur = 0;
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
  
  ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 10; ctx.lineCap = "round"; ctx.lineJoin = "round";
  ctx.shadowColor = currentPhase === 4 ? "#ffffff" : "#00ffff"; 
  ctx.shadowBlur = 25; ctx.stroke(); ctx.shadowBlur = 0;
}

function gameLoop() {
  if (!isPlaying) return;
  
  // Nao precisa rodar a logica normal se for fase 6, só o fundo
  if (currentPhase === 6) {
    gameLoopId = requestAnimationFrame(gameLoop);
    drawBackground();
    updateAndDrawParticles();
    drawBladeTrail();
    return;
  }
  
  gameLoopId = requestAnimationFrame(gameLoop);
  const cx = cw / 2;
  const cy = ch / 2;
  
  // LÓGICA DE FASES
  if (currentPhase < 3 || currentPhase === 5) {
    outerRadius -= shrinkSpeed;
    if (outerRadius <= innerRadius) {
      if (currentPhase === 5) gameOver("A escuridão engoliu seus filhos.");
      else gameOver("A escuridão te engoliu.");
      return;
    }
  }
  
  // RESPAWN
  let spawnRate = 0.04;
  if (currentPhase === 2) spawnRate = 0.08; 
  if (currentPhase === 3) spawnRate = 0.06;
  if (currentPhase === 4) spawnRate = 0.05;
  if (currentPhase === 5) spawnRate = 0.08; 
  
  let maxTargets = currentPhase >= 3 ? 6 : 8;
  if (currentPhase === 5) maxTargets = 10;
  
  if (Math.random() < spawnRate && floatingTargets.length < maxTargets) {
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
    
    if (currentPhase === 4) t.vy += 0.1; 
    
    t.x += t.vx;
    t.y += t.vy;
    t.angle += t.vAngle;
    
    if (currentPhase === 3 && t.type === 1) {
       const distToCenter = Math.hypot(t.x - cx, t.y - cy);
       if (distToCenter < innerRadius + 10) {
         t.active = false;
         createCutEffect(t.x, t.y, "#ff0000"); 
         innerRadius -= 20; 
         if (innerRadius <= 10) {
           gameOver("As trevas destruíram o seu mundo.");
           return;
         }
         continue; 
       }
    }
    
    if (t.x < -100 || t.x > cw + 100 || t.y > ch + 100 || t.y < -100) {
      t.active = false;
      continue;
    }
    
    ctx.save();
    ctx.translate(t.x, t.y);
    ctx.rotate(t.angle);
    
    if (currentPhase === 3) {
      if (t.type === 1) drawUFO(ctx, t.size);
      else {
        if (t.shapeType === 0) drawWheel(ctx, t.size);
        else drawCross(ctx, t.size);
      }
    } else if (currentPhase === 4) {
      if (t.type === 2) drawSoul(ctx, t.size); 
      if (t.type === 3) drawBomb(ctx, t.size); 
    } else {
      const glowColor = currentPhase === 0 ? "#00ffff" : currentPhase === 1 ? "#ff00ff" : "#ffff00";
      ctx.shadowColor = glowColor; ctx.shadowBlur = 15;
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
  
  if (currentPhase < 3 || currentPhase === 5) {
    const prisonColor = "#ff2222";
    
    // Prisão
    if (currentPhase === 0) drawPolygon(ctx, cx, cy, outerRadius, 3, 3, prisonColor, 8);
    else if (currentPhase === 1) drawPolygon(ctx, cx, cy, outerRadius, 4, 4, prisonColor, 8);
    else if (currentPhase === 2 || currentPhase === 5) drawCircle(ctx, cx, cy, outerRadius, prisonColor, false);
    
    // Interior (Jogador ou Filhos sendo guiados)
    const playerColor = currentPhase === 0 ? "#00ffff" : currentPhase === 1 ? "#ff00ff" : "#ffff00";
    if (currentPhase === 2) {
      const currentRad = innerRadius + (sidesDrawn * 5);
      drawCircle(ctx, cx, cy, currentRad, playerColor, true);
      drawCircle(ctx, cx, cy, currentRad + 20, "#ffffff", false);
    } else if (currentPhase === 5) {
      // Deuses recém-nascidos no meio (as bolinhas)
      const currentRad = innerRadius + (sidesDrawn * 5);
      drawCircle(ctx, cx, cy, currentRad, "#ffffff", true); // Luz pura
      drawCircle(ctx, cx, cy, currentRad + 30, "#00ffff", false); // Seu escudo protegendo-os
    } else {
      drawPolygon(ctx, cx, cy, innerRadius, targetSides, sidesDrawn, playerColor, 8);
    }
  } else if (currentPhase === 3) {
    drawCircle(ctx, cx, cy, innerRadius, "#112244", true); 
    for (let r = 20; r < innerRadius; r += 15) {
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2);
      ctx.strokeStyle = `hsl(${(r * 10) % 360}, 100%, 50%)`; 
      ctx.lineWidth = 5; ctx.stroke();
    }
  }
}
