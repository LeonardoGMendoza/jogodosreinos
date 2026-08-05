// Módulo Sandbox Celestial - Pós-Jogo / Recompensas de Criação

export class CelestialSandbox {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.active = false;
    this.selectedTool = 'star'; // star, tree, temple, river, galaxy
    this.objects = [];
    this.families = [];
    
    // Inicia a população inicial de almas
    for (let i = 0; i < 15; i++) {
      this.families.push({
        x: Math.random() * (canvas.width || 800),
        y: Math.random() * (canvas.height || 600),
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        color: '#FFF8DC',
        size: Math.random() * 6 + 6,
        label: `Filho Espiritual #${i + 1}`
      });
    }
  }

  start() {
    this.active = true;
  }

  stop() {
    this.active = false;
  }

  setTool(tool) {
    this.selectedTool = tool;
  }

  addObject(x, y) {
    if (!this.active) return;
    this.objects.push({
      x: x,
      y: y,
      type: this.selectedTool,
      scale: 0.1,
      maxScale: 1.0,
      createdAt: Date.now()
    });

    // Possibilidade de nascer um novo filho ao criar um templo ou estrela
    if (this.selectedTool === 'temple' || this.selectedTool === 'galaxy') {
      this.families.push({
        x: x + (Math.random() - 0.5) * 40,
        y: y + (Math.random() - 0.5) * 40,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        color: '#FFD700',
        size: 7,
        label: `Nova Alma #${this.families.length + 1}`
      });
    }
  }

  updateAndRender() {
    if (!this.active) return;

    const cw = this.canvas.width;
    const ch = this.canvas.height;

    // Fundo dourado do Reino Celestial
    const grad = this.ctx.createRadialGradient(cw / 2, ch / 2, 50, cw / 2, ch / 2, Math.max(cw, ch));
    grad.addColorStop(0, '#1a1005');
    grad.addColorStop(0.5, '#0a0815');
    grad.addColorStop(1, '#05020a');
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, cw, ch);

    // Desenha objetos criados pelo jogador
    this.objects.forEach(obj => {
      if (obj.scale < obj.maxScale) obj.scale += 0.05;

      this.ctx.save();
      this.ctx.translate(obj.x, obj.y);
      this.ctx.scale(obj.scale, obj.scale);

      if (obj.type === 'star') {
        this.ctx.fillStyle = '#FFD700';
        this.ctx.shadowColor = '#FFD700';
        this.ctx.shadowBlur = 15;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 14, 0, Math.PI * 2);
        this.ctx.fill();
      } else if (obj.type === 'tree') {
        // Árvore da Vida
        this.ctx.fillStyle = '#228B22';
        this.ctx.shadowColor = '#00FF7F';
        this.ctx.shadowBlur = 15;
        this.ctx.beginPath();
        this.ctx.arc(0, -10, 18, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(-4, 0, 8, 16);
      } else if (obj.type === 'temple') {
        // Templo de Luz
        this.ctx.fillStyle = '#FFF8DC';
        this.ctx.shadowColor = '#FFFFFF';
        this.ctx.shadowBlur = 20;
        this.ctx.fillRect(-15, -15, 30, 30);
        this.ctx.beginPath();
        this.ctx.moveTo(-20, -15);
        this.ctx.lineTo(0, -30);
        this.ctx.lineTo(20, -15);
        this.ctx.closePath();
        this.ctx.fillStyle = '#FFD700';
        this.ctx.fill();
      } else if (obj.type === 'galaxy') {
        // Galáxia Espiral
        const t = Date.now() * 0.002;
        this.ctx.rotate(t);
        this.ctx.fillStyle = '#DA70D6';
        this.ctx.shadowColor = '#BA55D3';
        this.ctx.shadowBlur = 25;
        for (let i = 0; i < 4; i++) {
          this.ctx.rotate(Math.PI / 2);
          this.ctx.beginPath();
          this.ctx.arc(15, 0, 6, 0, Math.PI * 2);
          this.ctx.fill();
        }
      }

      this.ctx.restore();
    });

    // Atualiza e desenha a Família Espiritual (Almas interativas)
    this.families.forEach(f => {
      f.x += f.vx;
      f.y += f.vy;

      if (f.x < 20 || f.x > cw - 20) f.vx *= -1;
      if (f.y < 20 || f.y > ch - 20) f.vy *= -1;

      this.ctx.beginPath();
      this.ctx.arc(f.x, f.y, f.size, 0, Math.PI * 2);
      this.ctx.fillStyle = f.color;
      this.ctx.shadowColor = f.color;
      this.ctx.shadowBlur = 12;
      this.ctx.fill();
    });
  }
}
