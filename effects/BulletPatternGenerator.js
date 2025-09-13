// 风暴之书 - 弹幕模式生成器
// 简化版弹幕系统，保持简洁美观

import { GAME_CONFIG } from '../config/GameConfig.js';

// 弹幕模式枚举 - 简化版本
export const BULLET_PATTERNS = {
  // Boss专用弹幕（4种核心模式）
  CIRCLE: 'circle',        // 圆形弹幕 - 全方位攻击
  SCATTER_3: 'scatter_3',  // 3颗子弹散射
  SCATTER_5: 'scatter_5',  // 5颗子弹散射
  DIRECT: 'direct',         // 直射弹幕
  
  // 大型敌机弹幕（1种模式）
  SINGLE: 'single',         // 单发直射
  
  // 通用弹幕（暂时注释掉）
  // THROW: 'throw'           // 抛掷弹幕
};

// 弹幕美学配置 - 简化版本
const BULLET_AESTHETICS = {
  // Boss弹幕：速度慢，花样多
  boss: {
    speed: 1.0,            // 很慢的速度
    density: 0.8,
    patterns: [BULLET_PATTERNS.CIRCLE, BULLET_PATTERNS.SCATTER_3, BULLET_PATTERNS.SCATTER_5, BULLET_PATTERNS.DIRECT],
    color: '#FF6B6B',
    fireInterval: 800,     // 发射间隔
    waveSize: 1           // 一波弹幕的数量
  },
  
  // 大型敌机：简单弹幕，间隔长
  large: {
    speed: 5,            // 中等速度
    density: 0.3,          // 低密度
    patterns: [BULLET_PATTERNS.SINGLE],
    color: '#FFA500',
    fireInterval: 3000,    // 很长的发射间隔
    maxBullets: 1          // 最多1发子弹
  },
  
  // 中型敌机：不发射
  medium: {
    speed: 0,
    density: 0,
    patterns: [],
    color: '#FFD700',
    fireInterval: 0,
    maxBullets: 0
  },
  
  // 小型敌机：不发射
  small: {
    speed: 0,
    density: 0,
    patterns: [],
    color: '#98FB98',
    fireInterval: 0,
    maxBullets: 0
  }
};

// 弹幕模式生成器
export class BulletPatternGenerator {
  constructor() {
    this.phase = 0;
    this.lastFireTime = 0;
    this.currentWave = 0;
    this.maxWaves = 3; // 最多3波弹幕同时存在
    this.initPatterns();
  }

  initPatterns() {
    this.patterns = {
      [BULLET_PATTERNS.CIRCLE]: this.generateCirclePattern.bind(this),
      [BULLET_PATTERNS.SCATTER_3]: this.generateScatter3Pattern.bind(this),
      [BULLET_PATTERNS.SCATTER_5]: this.generateScatter5Pattern.bind(this),
      [BULLET_PATTERNS.DIRECT]: this.generateDirectPattern.bind(this),
      [BULLET_PATTERNS.SINGLE]: this.generateSinglePattern.bind(this),
      // 暂时注释掉throw模式
      // [BULLET_PATTERNS.THROW]: this.generateThrowPattern.bind(this)
    };
  }
  
  // 主要弹幕生成方法
  generateForEnemy(enemyType, enemyX, enemyY, targetX, targetY) {
    const config = BULLET_AESTHETICS[enemyType];
    
    // 检查是否应该发射子弹
    if (!config || config.patterns.length === 0) {
      return [];
    }

    // 检查发射间隔
    const currentTime = Date.now();
    if (currentTime - this.lastFireTime < config.fireInterval) {
      return [];
    }

    // 检查弹幕波数限制
    if (enemyType === 'boss' && this.currentWave >= this.maxWaves) {
      return [];
    }

    // 选择弹幕模式
    const patternType = this.selectPattern(enemyType, config);
    if (!patternType) return [];

    // 生成弹幕
    const bullets = this.patterns[patternType](enemyX, enemyY, targetX, targetY, config, enemyType);
    
    // 更新状态
    this.lastFireTime = currentTime;
    if (enemyType === 'boss') {
      this.currentWave++;
    }

    return bullets;
  }

  // 选择弹幕模式
  selectPattern(enemyType, config) {
    if (enemyType === 'boss') {
      // Boss随机选择4种弹幕模式
      const bossPatterns = [BULLET_PATTERNS.CIRCLE, BULLET_PATTERNS.SCATTER_3, BULLET_PATTERNS.SCATTER_5, BULLET_PATTERNS.DIRECT];
      return bossPatterns[Math.floor(Math.random() * bossPatterns.length)];
    } else if (enemyType === 'large') {
      // 大型敌机：固定单发模式
      return BULLET_PATTERNS.SINGLE;
    }
    return null;
  }
  
  // ===== Boss专用弹幕模式 =====

  // 圆形弹幕 - 全方位攻击
  generateCirclePattern(enemyX, enemyY, targetX, targetY, config) {
    const bullets = [];
    const bulletCount = 12;
    const angleStep = (Math.PI * 2) / bulletCount;
    
    for (let i = 0; i < bulletCount; i++) {
      const angle = i * angleStep;
      const speed = config.speed + Math.random() * 0.3;
      
      bullets.push({
        x: enemyX,
        y: enemyY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 8 + Math.random() * 4,
        type: 'circle',
        color: config.color,
        damage: 10,
        imageType: 'bullet',
        imageIndex: Math.floor(Math.random() * 3), // 修复：0-2对应bullet_01-03
        trajectory: null,
        lifeTime: 400 + Math.random() * 200
      });
    }
    
    return bullets;
  }

  // 3颗子弹散射
  generateScatter3Pattern(enemyX, enemyY, targetX, targetY, config) {
    const bullets = [];
    const bulletCount = 3;
    const spreadAngle = Math.PI / 3; // 60度扇形
    const baseAngle = Math.atan2(targetY - enemyY, targetX - enemyX);
    
    for (let i = 0; i < bulletCount; i++) {
      const angle = baseAngle + (i - 1) * (spreadAngle / (bulletCount - 1));
      const speed = config.speed + Math.random() * 0.5;
      
      bullets.push({
        x: enemyX,
        y: enemyY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 10 + Math.random() * 4,
        type: 'scatter_3',
        color: config.color,
        damage: 12,
        imageType: 'bullet',
        imageIndex: Math.floor(Math.random() * 3), // 修复：0-2对应bullet_01-03
        trajectory: null,
        lifeTime: 450 + Math.random() * 200
      });
    }
    
    return bullets;
  }

  // 5颗子弹散射
  generateScatter5Pattern(enemyX, enemyY, targetX, targetY, config) {
    const bullets = [];
    const bulletCount = 5;
    const spreadAngle = Math.PI / 2; // 90度扇形
    const baseAngle = Math.atan2(targetY - enemyY, targetX - enemyX);
    
    for (let i = 0; i < bulletCount; i++) {
      const angle = baseAngle + (i - 2) * (spreadAngle / (bulletCount - 1));
      const speed = config.speed + Math.random() * 0.4;
      
      bullets.push({
        x: enemyX,
        y: enemyY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 9 + Math.random() * 3,
        type: 'scatter_5',
        color: config.color,
        damage: 11,
        imageType: 'bullet',
        imageIndex: Math.floor(Math.random() * 3), // 修复：0-2对应bullet_01-03
        trajectory: null,
        lifeTime: 500 + Math.random() * 200
      });
    }
    
    return bullets;
  }

  // 直射弹幕
  generateDirectPattern(enemyX, enemyY, targetX, targetY, config) {
    const bullets = [];
    const bulletCount = 3; // 3发直射，稍微错开
    
    for (let i = 0; i < bulletCount; i++) {
      const offsetX = (i - 1) * 15; // 水平错开
      const speed = config.speed + Math.random() * 0.3;
      
      bullets.push({
        x: enemyX + offsetX,
        y: enemyY,
        vx: 0,
        vy: speed,
        size: 8 + Math.random() * 3,
        type: 'direct',
        color: config.color,
        damage: 10,
        imageType: 'bullet',
        imageIndex: Math.floor(Math.random() * 3), // 修复：0-2对应bullet_01-03
        trajectory: null,
        lifeTime: 600 + Math.random() * 200
      });
    }
    
    return bullets;
  }

  // ===== 大型敌机弹幕模式 =====

  // 单发直射
  generateSinglePattern(enemyX, enemyY, targetX, targetY, config) {
    const angle = Math.atan2(targetY - enemyY, targetX - enemyX);
    const speed = config.speed + Math.random() * 0.3;
    
    return [{
      x: enemyX,
      y: enemyY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 9,
      type: 'single',
      color: config.color,
      damage: 12,
      imageType: 'bullet',
      imageName: 'bullet_03.png', // 大型敌机使用bullet_03.png
      trajectory: null,
      lifeTime: 500
    }];
  }
  
  // 暂时注释掉throw模式
  /*
  // 抛掷弹幕 - 模拟"一丢"的感觉
  generateThrowPattern(enemyX, enemyY, targetX, targetY, config) {
    // 暂时注释掉，等待后续调整
    return [];
  }
  */
  
  // 重置状态
  reset() {
    this.phase = 0;
    this.lastFireTime = 0;
    this.currentWave = 0;
  }

  // 更新状态
  update() {
    // 减少弹幕波数计数
    if (this.currentWave > 0) {
      this.currentWave = Math.max(0, this.currentWave - 0.01);
    }
  }
}