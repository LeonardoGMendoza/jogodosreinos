// Módulo da Loja de Lâminas e Persistência de Progresso (LocalStorage)

export const BLADES = [
  {
    id: 'gold',
    name: 'Espada Dourada Celestial',
    icon: '👑',
    price: 0,
    unlocked: true,
    description: 'A lâmina sagrada banhada pela glória original.',
    trailColor: ['#FFE259', '#FFA751'],
    glowColor: 'rgba(255, 215, 0, 0.8)',
    particleColor: '#FFD700'
  },
  {
    id: 'fire',
    name: 'Espada Flamejante de Fogo Santo',
    icon: '🔥',
    price: 150,
    unlocked: false,
    description: 'Chamas purificadoras que deixam brasas no ar.',
    trailColor: ['#FF416C', '#FF4B2B'],
    glowColor: 'rgba(255, 65, 108, 0.8)',
    particleColor: '#FF4500'
  },
  {
    id: 'thunder',
    name: 'Espada de Trovão Azul',
    icon: '⚡',
    price: 300,
    unlocked: false,
    description: 'Forjada com raios celestes e alta velocidade.',
    trailColor: ['#00B4DB', '#0083B0'],
    glowColor: 'rgba(0, 180, 219, 0.8)',
    particleColor: '#00FFFF'
  },
  {
    id: 'archangel',
    name: 'Espada de Miguel',
    icon: '🛡️',
    price: 500,
    unlocked: false,
    description: 'A espada do Arcanjo que afugenta as trevas.',
    trailColor: ['#7F00FF', '#E100FF'],
    glowColor: 'rgba(127, 0, 255, 0.8)',
    particleColor: '#E100FF'
  },
  {
    id: 'crystal',
    name: 'Espada de Cristal Prismática',
    icon: '💎',
    price: 750,
    unlocked: false,
    description: 'Reflete todas as cores da criação divina.',
    trailColor: ['#00F260', '#0575E6'],
    glowColor: 'rgba(0, 242, 96, 0.8)',
    particleColor: '#70FF00'
  },
  {
    id: 'nebula',
    name: 'Espada Nebulosa Cósmica',
    icon: '🌌',
    price: 1000,
    unlocked: false,
    description: 'Contém poeira de galáxias e estrelas em expansão.',
    trailColor: ['#8A2387', '#E94057', '#F27121'],
    glowColor: 'rgba(233, 64, 87, 0.8)',
    particleColor: '#FF69B4'
  }
];

export class ShopManager {
  constructor() {
    this.coins = parseInt(localStorage.getItem('jdr_coins') || '0', 10);
    this.equippedBladeId = localStorage.getItem('jdr_equipped') || 'gold';
    this.unlockedBlades = JSON.parse(localStorage.getItem('jdr_unlocked') || '["gold"]');
    
    // Atualiza estado inicial da lista
    BLADES.forEach(b => {
      if (this.unlockedBlades.includes(b.id)) {
        b.unlocked = true;
      }
    });
  }

  getCoins() {
    return this.coins;
  }

  addCoins(amount) {
    this.coins += amount;
    localStorage.setItem('jdr_coins', this.coins.toString());
  }

  getEquippedBlade() {
    return BLADES.find(b => b.id === this.equippedBladeId) || BLADES[0];
  }

  equipBlade(bladeId) {
    const blade = BLADES.find(b => b.id === bladeId);
    if (blade && blade.unlocked) {
      this.equippedBladeId = bladeId;
      localStorage.setItem('jdr_equipped', bladeId);
      return true;
    }
    return false;
  }

  buyBlade(bladeId) {
    const blade = BLADES.find(b => b.id === bladeId);
    if (blade && !blade.unlocked && this.coins >= blade.price) {
      this.coins -= blade.price;
      blade.unlocked = true;
      if (!this.unlockedBlades.includes(bladeId)) {
        this.unlockedBlades.push(bladeId);
      }
      localStorage.setItem('jdr_coins', this.coins.toString());
      localStorage.setItem('jdr_unlocked', JSON.stringify(this.unlockedBlades));
      this.equipBlade(bladeId);
      return { success: true, message: `Você adquiriu a ${blade.name}!` };
    }
    return { success: false, message: 'Moedas insuficientes!' };
  }
}
