import { playSliceSFX, playSoulSFX, playExplosionSFX, playBossHitSFX, playVictorySFX } from './sfx.js';
import { ShopManager, BLADES } from './shop.js';
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

// Áudios dos Hinos
const bgmTelestial = new Audio('hino_telestial.mp3');
const bgmTerrestrial = new Audio('hino_terrestre.mp3');
const bgmCelestial = new Audio('hino_celestial.mp3');
[bgmTelestial, bgmTerrestrial, bgmCelestial].forEach(audio => {
  audio.loop = true;
  audio.volume = 0.6;
});

function stopAllMusic() {
  [bgmTelestial, bgmTerrestrial, bgmCelestial].forEach(audio => {
    try {
      audio.pause();
      audio.currentTime = 0;
    } catch (e) {}
  });
}

let audioUnlocked = false;
function forceUnlockAndPlayAudio(phase = 0) {
  playMusicForPhase(phase);
  audioUnlocked = true;
}

function playMusicForPhase(phase) {
  stopAllMusic();
  try {
    if (phase === 0 || phase === 1 || phase === 3 || phase === 7) {
      bgmTelestial.play().catch(() => {});
    } else if (phase === 2 || phase === 4 || phase === 6 || phase === 8) {
      bgmTerrestrial.play().catch(() => {});
    } else {
      bgmCelestial.play().catch(() => {});
    }
  } catch (e) {}
}

document.addEventListener('pointerdown', () => {
  if (!audioUnlocked) forceUnlockAndPlayAudio(currentPhase);
}, { once: true });

// UI Elements
const screenMenu = document.getElementById('screen-menu');
const screenGameOver = document.getElementById('screen-gameover');
const screenShop = document.getElementById('screen-shop');
const screenSandboxUI = document.getElementById('screen-sandbox-ui');
const screenVictory = document.getElementById('screen-victory');
const uiContainer = document.getElementById('ui-container');

const btnStart = document.getElementById('btn-start');
const btnRestart = document.getElementById('btn-restart');
const btnShop = document.getElementById('btn-shop');
const btnCloseShop = document.getElementById('btn-close-shop');
const btnSandbox = document.getElementById('btn-sandbox');
const btnEnterSandbox = document.getElementById('btn-enter-sandbox');
const btnVictoryReplay = document.getElementById('btn-victory-replay');
const btnVictoryMenu = document.getElementById('btn-victory-menu');
const btnCloseSandbox = document.getElementById('btn-close-sandbox');
const selectPhase = document.getElementById('select-phase');

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
let phaseLives = 3;   // 3 Vidas por fase!
let sidesDrawn = 0;
let targetSides = 5;
let outerRadius = 0;
let innerRadius = 60;
let shrinkSpeed = 0;
let gameLoopId = null;
let particles = [];
let backgroundColor = "#050510";

// Boss Dragão State
let boss = null;
let bossPhaseStep = 0;
let bossWingAngle = 0;

// Blade mechanics
let isDragging = false;
let bladePoints = [];
let floatingTargets = [];

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
  "Capítulo 6: O DRAGÃO DAS TREVAS! Fatie os ataques e vença o Boss!"
];

function updateCoinsDisplay() {
  if (coinsCountDisplay) coinsCountDisplay.innerText = shopManager.getCoins();
}

function updateScoreAndLivesDisplay() {
  const hearts = "❤️".repeat(Math.max(0, phaseLives));
  scoreDisplay.innerText = `Progresso: ${sidesDrawn}/${targetSides} | Vidas: ${hearts}`;
}

function spawnTarget() {
  let x, y, vx, vy;
  let type = 0;
  let size = 20;
  
  if (currentPhase === 3) {
    type = Math.random() > 0.65 ? 2 : 0;
    size = 18;
    x = Math.random() * cw * 0.8 + (cw * 0.1);
    y = ch + 30;
    vx = (Math.random() - 0.5) * 3.5;
    vy = - (Math.random() * 3 + 5.5);
  } else if (currentPhase === 4) {
    type = 4;
    size = 22;
    x = Math.random() < 0.5 ? -30 : cw + 30;
    y = Math.random() * ch * 0.6 + (ch * 0.2);
    vx = (x < 0 ? 1 : -1) * (Math.random() * 2 + 1.8);
    vy = (Math.random() - 0.5) * 2.5;
  } else if (currentPhase === 7) {
    type = 1;
    size = 20;
    x = Math.random() * cw * 0.8 + (cw * 0.1);
    y = ch + 30;
    vx = (Math.random() - 0.5) * 3;
    vy = - (Math.random() * 3 + 5);
  } else if (currentPhase === 9) {
    type = Math.random() > 0.5 ? 3 : 2;
    size = 22;
    x = Math.random() * cw * 0.8 + (cw * 0.1);
    y = -30;
    vx = (Math.random() - 0.5) * 3;
    vy = Math.random() * 3 + 3.5;
  } else {
    type = (currentPhase >= 6 && Math.random() > 0.85) ? 2 : 0;
    size = 20;
    x = Math.random() < 0.5 ? -30 : cw + 30;
    y = Math.random() * ch * 0.7 + (ch * 0.15);
    vx = (x < 0 ? 1 : -1) * (Math.random() * 2 + 1.5);
    vy = (Math.random() - 0.5) * 2.5;
  }

  floatingTargets.push({
    x: x, y: y, vx: vx, vy: vy,
    size: size, type: type, active: true,
    rotation: 0, vRotation: (Math.random() - 0.5) * 0.08
  });
}

function initPhase(phase, resetLives = false) {
  currentPhase = phase;
  sidesDrawn = 0;
  outerRadius = Math.max(cw, ch) * 0.8;
  innerRadius = 60;
  particles = [];
  floatingTargets = [];
  bladePoints = [];
  
  if (resetLives) phaseLives = 3;
  if (bossHealthBarContainer) bossHealthBarContainer.classList.add('hidden');

  playMusicForPhase(phase);

  if (phase === 0) {
    targetSides = 5; shrinkSpeed = 0.5; backgroundColor = "#050512";
  } else if (phase === 1) {
    targetSides = 6; shrinkSpeed = 0.6; backgroundColor = "#100b24";
  } else if (phase === 2) {
    targetSides = 8; shrinkSpeed = 0.5; backgroundColor = "#2b1400";
  } else if (phase === 3) {
    targetSides = 10; shrinkSpeed = 0.7; backgroundColor = "#150000";
  } else if (phase === 4) {
    targetSides = 10; shrinkSpeed = 0.5; backgroundColor = "#001a15";
  } else if (phase === 5) {
    targetSides = 8; shrinkSpeed = 0.5; backgroundColor = "#05152b";
  } else if (phase === 6) {
    targetSides = 6; shrinkSpeed = 0.35; backgroundColor = "#1a0515";
  } else if (phase === 7) {
    targetSides = 10; shrinkSpeed = 0.4; backgroundColor = "#110022";
  } else if (phase === 8) {
    targetSides = 10; shrinkSpeed = 0.6; backgroundColor = "#201a00";
  } else if (phase === 9) {
    targetSides = 1; shrinkSpeed = 0.3; backgroundColor = "#0a0005";
    initBoss();
  }

  kingdomName.innerText = CHAPTER_TITLES[phase];
  updateScoreAndLivesDisplay();
  uiContainer.classList.remove('hidden');
  showScripture(scriptures[phase]);

  if (phase !== 9) {
    for (let i = 0; i < 6; i++) spawnTarget();
  }
}

function initBoss() {
  bossHealthBarContainer.classList.remove('hidden');
  bossNameDisplay.innerText = "DRAGÃO DAS TREVAS";
  bossPhaseStep = 0;
  
  boss = {
    x: cw / 2,
    y: ch * 0.28,
    maxHp: 100,
    hp: 100,
    partName: "ASAS DAS TREVAS",
    weakPointRadius: 65
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

function startGame(startPhase = 0, resetLives = true) {
  if (sandbox) sandbox.stop();
  screenMenu.classList.add('hidden');
  screenGameOver.classList.add('hidden');
  screenShop.classList.add('hidden');
  screenSandboxUI.classList.add('hidden');
  if (screenVictory) screenVictory.classList.add('hidden');
  
  forceUnlockAndPlayAudio(startPhase);

  isPlaying = true;
  if (gameLoopId) cancelAnimationFrame(gameLoopId);
  
  initPhase(startPhase, resetLives);
  gameLoop();
}

function gameOver(reason) {
  isPlaying = false;
  stopAllMusic();
  if (gameLoopId) cancelAnimationFrame(gameLoopId);

  phaseLives--;

  screenGameOver.classList.remove('hidden');
  const deathReason = document.getElementById('death-reason');

  if (phaseLives > 0) {
    if (deathReason) deathReason.innerText = `${reason}\n(Você ainda tem ${phaseLives} tentativa(s) nesta fase!)`;
    finalScoreDisplay.innerText = `Fase Atual: ${CHAPTER_TITLES[currentPhase]} (Tentativa ${4 - phaseLives} de 3)`;
  } else {
    if (deathReason) deathReason.innerText = `${reason}\n(Suas 3 tentativas acabaram! Voltando ao início da jornada.)`;
    finalScoreDisplay.innerText = `Suas 3 vidas acabaram na ${CHAPTER_TITLES[currentPhase]}`;
  }

  uiContainer.classList.add('hidden');
}

function handleRestart() {
  if (phaseLives > 0) {
    startGame(currentPhase, false);
  } else {
    phaseLives = 3;
    startGame(0, true);
  }
}

function winGame() {
  isPlaying = false;
  if (gameLoopId) cancelAnimationFrame(gameLoopId);
  playVictorySFX();
  shopManager.addCoins(100);
  updateCoinsDisplay();

  stopAllMusic();
  bgmCelestial.play().catch(() => {});

  uiContainer.classList.add('hidden');
  if (screenVictory) screenVictory.classList.remove('hidden');
}

function enterSandboxMode() {
  isPlaying = false;
  if (gameLoopId) cancelAnimationFrame(gameLoopId);

  screenMenu.classList.add('hidden');
  screenGameOver.classList.add('hidden');
  screenShop.classList.add('hidden');
  if (screenVictory) screenVictory.classList.add('hidden');
  uiContainer.classList.add('hidden');
  screenSandboxUI.classList.remove('hidden');

  stopAllMusic();
  bgmCelestial.play().catch(() => {});

  sandbox = new CelestialSandbox(canvas, ctx);
  sandbox.start();

  sandboxLoop();
}

function exitSandboxMode() {
  if (sandbox) sandbox.stop();
  stopAllMusic();
  if (gameLoopId) cancelAnimationFrame(gameLoopId);
  screenSandboxUI.classList.add('hidden');
  screenMenu.classList.remove('hidden');
}

function sandboxLoop() {
  if (sandbox && sandbox.active) {
    sandbox.updateAndRender();
    gameLoopId = requestAnimationFrame(sandboxLoop);
  }
}

function advancePhase() {
  createExplosion(cw / 2, ch / 2, "#FFD700");
  playVictorySFX();
  shopManager.addCoins(25);
  updateCoinsDisplay();

  if (currentPhase >= 9) {
    winGame();
    return;
  }

  setTimeout(() => {
    initPhase(currentPhase + 1, true);
  }, 1200);
}

// Interação e Corte
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
btnStart.addEventListener('click', () => {
  const chosenPhase = selectPhase ? parseInt(selectPhase.value, 10) || 0 : 0;
  forceUnlockAndPlayAudio(chosenPhase);
  startGame(chosenPhase, true);
});

btnRestart.addEventListener('click', () => {
  forceUnlockAndPlayAudio(currentPhase);
  handleRestart();
});

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
    enterSandboxMode();
  });
}

if (btnEnterSandbox) {
  btnEnterSandbox.addEventListener('click', () => {
    enterSandboxMode();
  });
}

if (btnVictoryReplay) {
  btnVictoryReplay.addEventListener('click', () => {
    startGame(0, true);
  });
}

if (btnVictoryMenu) {
  btnVictoryMenu.addEventListener('click', () => {
    if (screenVictory) screenVictory.classList.add('hidden');
    stopAllMusic();
    screenMenu.classList.remove('hidden');
  });
}

if (btnCloseSandbox) {
  btnCloseSandbox.addEventListener('click', () => {
    exitSandboxMode();
  });
}

// Loja Renders e Compra Direta
function renderShopItems() {
  const container = document.getElementById('shop-items-container');
  if (!container) return;
  container.innerHTML = '';
  updateCoinsDisplay();

  const equipped = shopManager.getEquippedBlade();

  BLADES.forEach(b => {
    const card = document.createElement('div');
    const isUnlocked = b.unlocked;
    const isEquipped = equipped.id === b.id;

    card.className = `shop-card ${isEquipped ? 'equipped' : ''}`;
    
    card.innerHTML = `
      <div class="shop-icon">${b.icon}</div>
      <div class="shop-name">${b.name}</div>
      <div class="shop-desc">${b.description}</div>
      <button class="shop-btn ${isUnlocked ? 'unlocked' : ''}">
        ${isEquipped ? 'EM USO' : isUnlocked ? 'EQUIPAR' : `COMPRAR (${b.price} ⭐)`}
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
}

function checkCuts() {
  if (bladePoints.length < 2) return;
  const p1 = bladePoints[bladePoints.length - 2];
  const p2 = bladePoints[bladePoints.length - 1];
  const blade = shopManager.getEquippedBlade();

  if (currentPhase === 9 && boss) {
    const distBoss = Math.hypot(p2.x - boss.x, p2.y - boss.y);
    if (distBoss < boss.weakPointRadius + 25) {
      boss.hp -= 10;
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
    if (dist < t.size / 2 + 20) {
      t.active = false;
      
      if (t.type === 2) {
        playExplosionSFX();
        createExplosion(t.x, t.y, "#FF0000");
        gameOver("Você cortou a Perdição! Seus filhos espirituais choram.");
      } else if (t.type === 1) {
        playSoulSFX();
        createSoulSalvationEffect(t.x, t.y);
        sidesDrawn++;
        outerRadius += 40;
        updateScoreAndLivesDisplay();
        if (sidesDrawn >= targetSides) advancePhase();
      } else {
        playSliceSFX();
        createCutEffect(t.x, t.y, blade.particleColor);
        sidesDrawn++;
        outerRadius += 35;
        updateScoreAndLivesDisplay();
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

function drawDragon(x, y) {
  bossWingAngle += 0.05;
  const wingFlap = Math.sin(bossWingAngle) * 15;

  ctx.save();
  ctx.translate(x, y);

  ctx.shadowColor = "#FF0000";
  ctx.shadowBlur = 35;

  ctx.fillStyle = "#220005";
  ctx.strokeStyle = "#8B0000";
  ctx.lineWidth = 3;

  // Asa Esquerda
  ctx.beginPath();
  ctx.moveTo(-20, 0);
  ctx.quadraticCurveTo(-120, -90 + wingFlap, -180, -30 + wingFlap);
  ctx.quadraticCurveTo(-100, 30, -20, 20);
  ctx.fill();
  ctx.stroke();

  // Asa Direita
  ctx.beginPath();
  ctx.moveTo(20, 0);
  ctx.quadraticCurveTo(120, -90 + wingFlap, 180, -30 + wingFlap);
  ctx.quadraticCurveTo(100, 30, 20, 20);
  ctx.fill();
  ctx.stroke();

  // Corpo
  ctx.fillStyle = "#110003";
  ctx.beginPath();
  ctx.ellipse(0, 20, 45, 60, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Cabeça e Chifres
  ctx.fillStyle = "#1a0005";
  ctx.beginPath();
  ctx.moveTo(-35, -30);
  ctx.lineTo(-65, -80);
  ctx.lineTo(-20, -50);
  ctx.lineTo(0, -75);
  ctx.lineTo(20, -50);
  ctx.lineTo(65, -80);
  ctx.lineTo(35, -30);
  ctx.lineTo(0, 10);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Olhos Vermelhos
  ctx.fillStyle = "#FF0000";
  ctx.shadowColor = "#FF0000";
  ctx.shadowBlur = 15;
  ctx.beginPath();
  ctx.arc(-18, -30, 7, 0, Math.PI * 2);
  ctx.arc(18, -30, 7, 0, Math.PI * 2);
  ctx.fill();

  // Focinho
  ctx.fillStyle = "#FF4500";
  ctx.beginPath();
  ctx.arc(-8, -15, 3, 0, Math.PI * 2);
  ctx.arc(8, -15, 3, 0, Math.PI * 2);
  ctx.fill();

  // Alvo do Ponto Fraco
  ctx.strokeStyle = "#FFD700";
  ctx.lineWidth = 4;
  ctx.setLineDash([8, 6]);
  ctx.beginPath();
  ctx.arc(0, 0, boss.weakPointRadius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

function gameLoop() {
  if (sandbox && sandbox.active) {
    return;
  }

  if (!isPlaying) return;

  // Fundo
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, cw, ch);

  // Prisão do Mundo
  outerRadius -= shrinkSpeed;
  if (outerRadius < innerRadius + 20) {
    gameOver("A Prisão do Mundo se fechou completamente!");
    return;
  }

  ctx.strokeStyle = "rgba(255, 50, 50, 0.6)";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(cw / 2, ch / 2, outerRadius, 0, Math.PI * 2);
  ctx.stroke();

  if (Math.random() < 0.12 && floatingTargets.length < 8 && currentPhase !== 9) {
    spawnTarget();
  }

  if (currentPhase === 9 && boss) {
    drawDragon(boss.x, boss.y);
  }

  // Desenha Alvos Fatiáveis (Tamanho Mini 18px-22px)
  for (let i = floatingTargets.length - 1; i >= 0; i--) {
    let t = floatingTargets[i];
    t.x += t.vx;
    t.y += t.vy;
    t.rotation += t.vRotation;

    if (t.x < -80 || t.x > cw + 80 || t.y < -80 || t.y > ch + 80) {
      floatingTargets.splice(i, 1);
      continue;
    }

    ctx.save();
    ctx.translate(t.x, t.y);
    ctx.rotate(t.rotation);

    if (t.type === 2) {
      ctx.fillStyle = "#8B0000";
      ctx.shadowColor = "#FF0000";
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(0, 0, t.size / 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (t.type === 1) {
      ctx.fillStyle = "#FFF8DC";
      ctx.shadowColor = "#FFD700";
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(0, 0, t.size / 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = "#00FFFF";
      ctx.shadowColor = "#00BFFF";
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(0, -t.size / 2);
      ctx.lineTo(t.size / 2, 0);
      ctx.lineTo(0, t.size / 2);
      ctx.lineTo(-t.size / 2, 0);
      ctx.closePath();
      ctx.fill();
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

  // Rastro da Espada
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

window.setSandboxTool = function(toolName) {
  if (sandbox) sandbox.setTool(toolName);
  const btns = document.querySelectorAll('.tool-btn');
  btns.forEach(btn => btn.classList.remove('active'));
  if (window.event && window.event.target) {
    window.event.target.classList.add('active');
  }
};
