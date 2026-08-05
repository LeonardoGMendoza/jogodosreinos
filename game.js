import { playSliceSFX, playSoulSFX, playExplosionSFX, playBossHitSFX, playVictorySFX } from './sfx.js';
import { ShopManager } from './shop.js';
import { CelestialSandbox } from './sandbox.js';

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

let cw = canvas.width = window.innerWidth;
let ch = canvas.height = window.innerHeight;

window.addEventListener('resize', () => {
  cw = canvas.width = window.innerWidth;
  ch = canvas.height = window.innerHeight;
});

// Managers
const shopManager = new ShopManager();
let sandbox = null;

// UI Elements
const screenMenu = document.getElementById('screen-menu');
const screenGameOver = document.getElementById('screen-gameover');
const screenShop = document.getElementById('screen-shop');
const screenSandboxUI = document.getElementById('screen-sandbox-ui');
const uiContainer = document.getElementById('ui-container');
const btnStart = document.getElementById('btn-start');
const btnRestart = document.getElementById('btn-restart');
const btnShop = document.getElementById('btn-shop');
const btnCloseShop = document.getElementById('btn-close-shop');
const btnSandbox = document.getElementById('btn-sandbox');
const scoreDisplay = document.getElementById('score');
const finalScoreDisplay = document.getElementById('final-score');
const kingdomName = document.getElementById('kingdom-name');
const scripturePopup = document.getElementById('scripture-popup');
const scriptureText = document.getElementById('scripture-text');
const bossHealthBarContainer = document.getElementById('boss-health-container');
const bossHealthFill = document.getElementById('boss-health-fill');
const bossNameDisplay = document.getElementById('boss-name');
const coinsCountDisplay = document.getElementById('coins-count');

// Game State
let isPlaying = false;
let currentPhase = 0; // 0 to 9 (10 Fases)
let sidesDrawn = 0;
let targetSides = 5;
let outerRadius = 0;
let innerRadius = 60;
let shrinkSpeed = 0;
let gameLoopId;
let particles = [];
let backgroundColor = "#050510";

// Boss State (Fase 9 - Dragão das Trevas)
let boss = null;
let bossPhaseStep = 0; // 0: Asas, 1: Cabeça, 2: Cauda, 3: Coração

// Blade mechanics
let isDragging = false;
let bladePoints = [];
let floatingTargets = [];

// Scriptures & Chapter Descriptions
const CHAPTER_TITLES = [
  "FASE 1: A GLÓRIA DAS ESTRELAS ⭐",
  "FASE 2: A GLÓRIA DA LUA 🌙",
  "FASE 3: A GLÓRIA DO SOL ☀️",
  "FASE 4: A GUERRA NO CÉU ⚡",
  "FASE 5: A CRIAÇÃO DO MUNDO 🌊",
  "FASE 6: CRIADOR DE PLANETAS 🪐",
  "FASE 7: A PROVAÇÃO DA MORTALIDADE ⏳",
  "FASE 8: RESGATE DOS 15 FILHOS 🕊️",
  "FASE 9: O JULGAMENTO DA BALANÇA ⚖️",
  "FASE 10: O DRAGÃO DAS TREVAS 🐉"
];

const scriptures = [
  "Capítulo 1: Conheça seus primeiros filhos espirituais. Aprenda a fatiar!",
  "Capítulo 1: Os desafios aumentam. Cuidado com as primeiras tentações!",
  "Capítulo 1: Glória do Sol! Domine a espada e realize milagres de luz!",
  "Capítulo 2: Enfrente as sombras e anjos rebeldes! Lúcifer espreita!",
  "Capítulo 3: Fatie a matéria caótica para criar oceanos e montanhas!",
  "Capítulo 3: Organize os planetas e defenda sua criação divina!",
  "Capítulo 4: Mortalidade! Proteja os filhos das doenças e guerras!",
  "Capítulo 4: Resgate os 15 filhos espirituais! Eles marcharão com você!",
  "Capítulo 5: O Julgamento diante do Trono! Equilibre a Balança Celestial!",
  "Capítulo 6: O DRAGÃO DAS TREVAS! Fatie as meteoros e destrua o Coração do Boss!"
];

function updateCoinsDisplay() {
  if (coinsCountDisplay) coinsCountDisplay.innerText = shopManager.getCoins();
}

function spawnTarget() {
  let x, y, vx, vy;
  let type = 0; // 0: Normal, 1: Alma, 2: Perdição/Bomba, 3: Meteoro, 4: Matéria
  let size = 60;
  
  if (currentPhase === 3) { // Guerra no Céu (Lúcifer)
    type = Math.random() > 0.6 ? 2 : 0;
    size = 55;
    x = Math.random() * cw * 0.8 + (cw * 0.1);
    y = ch + 50;
    vx = (Math.random() - 0.5) * 4;
    vy = - (Math.random() * 4 + 7);
  } else if (currentPhase === 4) { // Criação (Matéria)
    type = 4;
    size = 70;
    x = Math.random() < 0.5 ? -50 : cw + 50;
    y = Math.random() * ch * 0.6 + (ch * 0.2);
    vx = (x < 0 ? 1 : -1) * (Math.random() * 2 + 2);
    vy = (Math.random() - 0.5) * 3;
  } else if (currentPhase === 7) { // Resgate dos 15 Filhos
    type = 1;
    size = 50;
    x = Math.random() * cw * 0.8 + (cw * 0.1);
    y = ch + 50;
    vx = (Math.random() - 0.5) * 3;
    vy = - (Math.random() * 3 + 6);
  } else if (currentPhase === 9) { // Boss Dragão
    type = Math.random() > 0.5 ? 3 : 2; // Meteoro ou Fogo/Bomba
    size = 65;
    x = Math.random() * cw * 0.8 + (cw * 0.1);
    y = -50;
    vx = (Math.random() - 0.5) * 3;
    vy = Math.random() * 4 + 4;
  } else { // Normal (0, 1, 2, 5, 6, 8)
    type = (currentPhase >= 6 && Math.random() > 0.75) ? 2 : 0;
    size = 55;
    x = Math.random() < 0.5 ? -50 : cw + 50;
    y = Math.random() * ch * 0.7 + (ch * 0.15);
    vx = (x < 0 ? 1 : -1) * (Math.random() * 2 + 1.5);
    vy = (Math.random() - 0.5) * 3;
  }

  floatingTargets.push({
    x: x, y: y, vx: vx, vy: vy,
    size: size, type: type, active: true,
    rotation: 0, vRotation: (Math.random() - 0.5) * 0.08
  });
}

function initPhase(phase) {
  currentPhase = phase;
  sidesDrawn = 0;
  outerRadius = Math.max(cw, ch) * 0.8;
  innerRadius = 60;
  particles = [];
  floatingTargets = [];
  bladePoints = [];
  
  if (bossHealthBarContainer) bossHealthBarContainer.classList.add('hidden');

  if (phase === 0) {
    targetSides = 5; shrinkSpeed = 0.8; backgroundColor = "#050512";
  } else if (phase === 1) {
    targetSides = 8; shrinkSpeed = 1.0; backgroundColor = "#100b24";
  } else if (phase === 2) {
    targetSides = 10; shrinkSpeed = 1.2; backgroundColor = "#2b1400";
  } else if (phase === 3) { // Guerra no Céu
    targetSides = 12; shrinkSpeed = 1.3; backgroundColor = "#150000";
  } else if (phase === 4) { // Criação
    targetSides = 10; shrinkSpeed = 0.9; backgroundColor = "#001a15";
  } else if (phase === 5) { // Planetas
    targetSides = 12; shrinkSpeed = 1.1; backgroundColor = "#05152b";
  } else if (phase === 6) { // Mortalidade
    targetSides = 12; shrinkSpeed = 1.4; backgroundColor = "#1a0515";
  } else if (phase === 7) { // Resgate 15 Filhos
    targetSides = 15; shrinkSpeed = 1.0; backgroundColor = "#110022";
  } else if (phase === 8) { // Julgamento
    targetSides = 12; shrinkSpeed = 1.2; backgroundColor = "#201a00";
  } else if (phase === 9) { // Boss Dragão das Trevas
    targetSides = 1; shrinkSpeed = 0.5; backgroundColor = "#0a0005";
    initBoss();
  }

  kingdomName.innerText = CHAPTER_TITLES[phase];
  scoreDisplay.innerText = `Progresso: 0/${targetSides}`;
  uiContainer.classList.remove('hidden');
  showScripture(scriptures[phase]);

  if (phase !== 9) {
    for (let i = 0; i < 4; i++) spawnTarget();
  }
}

function initBoss() {
  bossHealthBarContainer.classList.remove('hidden');
  bossNameDisplay.innerText = "DRAGÃO DAS TREVAS";
  bossPhaseStep = 0;
  
  boss = {
    x: cw / 2,
    y: ch * 0.3,
    maxHp: 100,
    hp: 100,
    partName: "ASAS DAS TREVAS",
    weakPointRadius: 70
  };
  updateBossUI();
}

function updateBossUI() {
  if (!boss) return;
  const pct = Math.max(0, (boss.hp / boss.maxHp) * 100);
  bossHealthFill.style.width = `${pct}%`;
  bossNameDisplay.innerText = `DRAGÃO DAS TREVAS (${boss.partName})`;
}

function showScripture(text) {
  scriptureText.innerText = text;
  scripturePopup.classList.remove('hidden');
  scripturePopup.style.opacity = 1;
  setTimeout(() => {
    scripturePopup.style.opacity = 0;
    setTimeout(() => scripturePopup.classList.add('hidden'), 500);
  }, 3500);
}

function startGame(startPhase = 0) {
  screenMenu.classList.add('hidden');
  screenGameOver.classList.add('hidden');
  screenShop.classList.add('hidden');
  screenSandboxUI.classList.add('hidden');
  if (sandbox) sandbox.stop();
  
  isPlaying = true;
  if (gameLoopId) cancelAnimationFrame(gameLoopId);
  
  initPhase(startPhase);
  gameLoop();
}

function gameOver(reason) {
  isPlaying = false;
  if (gameLoopId) cancelAnimationFrame(gameLoopId);
  screenGameOver.classList.remove('hidden');
  const deathReason = document.getElementById('death-reason');
  if (deathReason) deathReason.innerText = reason || "A escuridão venceu.";
  finalScoreDisplay.innerText = `Alcançou: ${CHAPTER_TITLES[currentPhase]}`;
  uiContainer.classList.add('hidden');
}

function winGame() {
  isPlaying = false;
  if (gameLoopId) cancelAnimationFrame(gameLoopId);
  playVictorySFX();
  shopManager.addCoins(200);
  updateCoinsDisplay();

  // Ativa o Modo Sandbox Celestial
  sandbox = new CelestialSandbox(canvas, ctx);
  sandbox.start();

  uiContainer.classList.add('hidden');
  screenSandboxUI.classList.remove('hidden');
}

function advancePhase() {
  createExplosion(cw / 2, ch / 2, "#FFD700");
  playVictorySFX();
  shopManager.addCoins(30);
  updateCoinsDisplay();

  if (currentPhase >= 9) {
    winGame();
    return;
  }

  setTimeout(() => {
    initPhase(currentPhase + 1);
  }, 1200);
}

// Interação e Corte (Blade)
function updateBlade(x, y) {
  bladePoints.push({ x: x, y: y, time: Date.now() });
  if (bladePoints.length > 10) bladePoints.shift();
  playSliceSFX();
  checkCuts();
}

window.addEventListener('pointerdown', (e) => {
  if (sandbox && sandbox.active) {
    sandbox.addObject(e.clientX, e.clientY);
    return;
  }
  if (!isPlaying) return;
  e.preventDefault();
  isDragging = true;
  bladePoints = [{ x: e.clientX, y: e.clientY, time: Date.now() }];
}, { passive: false });

window.addEventListener('pointermove', (e) => {
  if (!isPlaying || !isDragging) return;
  e.preventDefault();
  updateBlade(e.clientX, e.clientY);
}, { passive: false });

window.addEventListener('pointerup', () => {
  isDragging = false;
}, { passive: false });

// Botões da Interface
btnStart.addEventListener('click', () => startGame(0));
btnRestart.addEventListener('click', () => startGame(0));

if (btnShop) {
  btnShop.addEventListener('click', () => {
    screenMenu.classList.add('hidden');
    screenShop.classList.remove('hidden');
    renderShopItems();
  });
}

if (btnCloseShop) {
  btnCloseShop.addEventListener('click', () => {
    screenShop.classList.add('hidden');
    screenMenu.classList.remove('hidden');
  });
}

if (btnSandbox) {
  btnSandbox.addEventListener('click', () => {
    screenMenu.classList.add('hidden');
    winGame();
  });
}

// Loja Renders
function renderShopItems() {
  const container = document.getElementById('shop-items-container');
  if (!container) return;
  container.innerHTML = '';
  updateCoinsDisplay();

  const equipped = shopManager.getEquippedBlade();

  shopManager.unlockedBlades.forEach(); // update status
  
  import('./shop.js').then(module => {
    module.BLADES.forEach(b => {
      const card = document.createElement('div');
      card.className = `shop-card ${equipped.id === b.id ? 'equipped' : ''}`;
      
      const isUnlocked = b.unlocked;
      
      card.innerHTML = `
        <div class="shop-icon">${b.icon}</div>
        <div class="shop-name">${b.name}</div>
        <div class="shop-desc">${b.description}</div>
        <button class="shop-btn ${isUnlocked ? 'unlocked' : ''}">
          ${equipped.id === b.id ? 'EM USO' : isUnlocked ? 'EQUIPAR' : `COMPRAR (${b.price} ⭐)`}
        </button>
      `;

      const btn = card.querySelector('.shop-btn');
      btn.addEventListener('click', () => {
        if (!isUnlocked) {
          const res = shopManager.buyBlade(b.id);
          alert(res.message);
          renderShopItems();
        } else {
          shopManager.equipBlade(b.id);
          renderShopItems();
        }
      });

      container.appendChild(card);
    });
  });
}

function checkCuts() {
  if (bladePoints.length < 2) return;
  const p1 = bladePoints[bladePoints.length - 2];
  const p2 = bladePoints[bladePoints.length - 1];
  const blade = shopManager.getEquippedBlade();

  // Teste de colisão no Boss (Fase 9)
  if (currentPhase === 9 && boss) {
    const distBoss = Math.hypot(p2.x - boss.x, p2.y - boss.y);
    if (distBoss < boss.weakPointRadius + 30) {
      boss.hp -= 8;
      playBossHitSFX();
      createCutEffect(boss.x, boss.y, blade.particleColor);
      updateBossUI();

      if (boss.hp <= 0) {
        bossPhaseStep++;
        if (bossPhaseStep === 1) {
          boss.partName = "CABEÇA DO DRAGÃO";
          boss.hp = boss.maxHp = 100;
          showScripture("Asas cortadas! Agora fatie a Cabeça do Dragão!");
        } else if (bossPhaseStep === 2) {
          boss.partName = "CAUDA DAS TREVAS";
          boss.hp = boss.maxHp = 100;
          showScripture("Cabeça destruída! Fatie a Cauda!");
        } else if (bossPhaseStep === 3) {
          boss.partName = "CORAÇÃO DAS TREVAS";
          boss.hp = boss.maxHp = 100;
          showScripture("GOLPE FINAL! CORTE O CORAÇÃO!");
        } else {
          advancePhase();
        }
      }
    }
  }

  floatingTargets.forEach(t => {
    if (!t.active) return;
    const dist = Math.hypot(p2.x - t.x, p2.y - t.y);
    if (dist < t.size / 2 + 25) {
      t.active = false;
      
      if (t.type === 2) { // Bomba / Perdição
        playExplosionSFX();
        createExplosion(t.x, t.y, "#FF0000");
        gameOver("Você cortou a Perdição! Seus filhos espirituais choram.");
      } else if (t.type === 1) { // Alma / Filho Espiritual
        playSoulSFX();
        createSoulSalvationEffect(t.x, t.y);
        sidesDrawn++;
        outerRadius += 30;
        scoreDisplay.innerText = `Progresso: ${sidesDrawn}/${targetSides}`;
        if (sidesDrawn >= targetSides) advancePhase();
      } else { // Normal / Meteoro / Matéria
        playSliceSFX();
        createCutEffect(t.x, t.y, blade.particleColor);
        sidesDrawn++;
        outerRadius += 25;
        scoreDisplay.innerText = `Progresso: ${sidesDrawn}/${targetSides}`;
        if (sidesDrawn >= targetSides) advancePhase();
      }
    }
  });
}

function createCutEffect(x, y, color) {
  for (let i = 0; i < 15; i++) {
    particles.push({
      x: x, y: y,
      vx: (Math.random() - 0.5) * 12,
      vy: (Math.random() - 0.5) * 12,
      life: 1, size: 4, color: color || "#FFD700"
    });
  }
}

function createSoulSalvationEffect(x, y) {
  for (let i = 0; i < 20; i++) {
    particles.push({
      x: x, y: y,
      vx: (Math.random() - 0.5) * 6,
      vy: -Math.random() * 8 - 3,
      life: 1, size: 5, color: "#FFF8DC"
    });
  }
}

function createExplosion(x, y, color) {
  for (let i = 0; i < 60; i++) {
    particles.push({
      x: x, y: y,
      vx: (Math.random() - 0.5) * 30,
      vy: (Math.random() - 0.5) * 30,
      life: 1, size: Math.random() * 6 + 2, color: color || "#FF4500"
    });
  }
}

function gameLoop() {
  if (sandbox && sandbox.active) {
    sandbox.updateAndRender();
    gameLoopId = requestAnimationFrame(gameLoop);
    return;
  }

  if (!isPlaying) return;

  // Fundo
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, cw, ch);

  // Prisão do Mundo (Bordas encolhendo)
  outerRadius -= shrinkSpeed;
  if (outerRadius < innerRadius + 20) {
    gameOver("A Prisão do Mundo se fechou completamente!");
    return;
  }

  // Desenha a Prisão
  ctx.strokeStyle = "rgba(255, 50, 50, 0.6)";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(cw / 2, ch / 2, outerRadius, 0, Math.PI * 2);
  ctx.stroke();

  // Spawna alvos periodicamente
  if (Math.random() < 0.04 && floatingTargets.length < 5 && currentPhase !== 9) {
    spawnTarget();
  }

  // Se for Boss Dragão, desenha o Dragão no topo
  if (currentPhase === 9 && boss) {
    ctx.save();
    ctx.translate(boss.x, boss.y);
    ctx.shadowColor = "#FF0000";
    ctx.shadowBlur = 30;
    
    // Corpo do Dragão
    ctx.fillStyle = "#330005";
    ctx.beginPath();
    ctx.arc(0, 0, boss.weakPointRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#FF0000";
    ctx.lineWidth = 4;
    ctx.stroke();

    // Olhos do Dragão
    ctx.fillStyle = "#FFD700";
    ctx.beginPath();
    ctx.arc(-25, -15, 10, 0, Math.PI * 2);
    ctx.arc(25, -15, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // Atualiza e Desenha Alvos Fatiáveis
  for (let i = floatingTargets.length - 1; i >= 0; i--) {
    let t = floatingTargets[i];
    t.x += t.vx;
    t.y += t.vy;
    t.rotation += t.vRotation;

    if (t.x < -100 || t.x > cw + 100 || t.y < -100 || t.y > ch + 100) {
      floatingTargets.splice(i, 1);
      continue;
    }

    ctx.save();
    ctx.translate(t.x, t.y);
    ctx.rotate(t.rotation);

    if (t.type === 2) { // Bomba / Perdição
      ctx.fillStyle = "#8B0000";
      ctx.shadowColor = "#FF0000";
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(0, 0, t.size / 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (t.type === 1) { // Alma / Filho Espiritual
      ctx.fillStyle = "#FFF8DC";
      ctx.shadowColor = "#FFD700";
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(0, 0, t.size / 2, 0, Math.PI * 2);
      ctx.fill();
    } else { // Normal
      ctx.fillStyle = "#00FFFF";
      ctx.shadowColor = "#00BFFF";
      ctx.shadowBlur = 15;
      ctx.fillRect(-t.size / 2, -t.size / 2, t.size, t.size);
    }

    ctx.restore();
  }

  // Partículas
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
    ctx.arc(p.x, p.y, Math.max(1, p.size * p.life), 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.fill();
  }

  // Desenha o Rastro da Espada (Blade Trail)
  const equippedBlade = shopManager.getEquippedBlade();
  if (bladePoints.length > 1) {
    ctx.save();
    ctx.shadowColor = equippedBlade.glowColor;
    ctx.shadowBlur = 20;
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.strokeStyle = equippedBlade.trailColor[0];

    ctx.beginPath();
    ctx.moveTo(bladePoints[0].x, bladePoints[0].y);
    for (let i = 1; i < bladePoints.length; i++) {
      ctx.lineTo(bladePoints[i].x, bladePoints[i].y);
    }
    ctx.stroke();
    ctx.restore();
  }

  gameLoopId = requestAnimationFrame(gameLoop);
}

// Inicialização
updateCoinsDisplay();

// Helper global para troca de ferramentas no Sandbox
window.setSandboxTool = function(toolName) {
  if (sandbox) sandbox.setTool(toolName);
  const btns = document.querySelectorAll('.tool-btn');
  btns.forEach(btn => btn.classList.remove('active'));
  if (window.event && window.event.target) {
    window.event.target.classList.add('active');
  }
};
