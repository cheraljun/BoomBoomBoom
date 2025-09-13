// 风暴之书 - 敌机生成器模块

import { GAME_CONFIG } from '../config/GameConfig.js';
import { Enemy } from '../combat/Enemy.js';

// 敌机生成管理器
class EnemySpawner {
  constructor(gameInstance) {
    this.gameInstance = gameInstance;
    this.lastSpawnTime = 0;
  }
  
  spawnEnemies() {
    // 只在战斗阶段生成敌机
    if (this.gameInstance.gameStartPhase !== 'battle') {
      return;
    }
    
    // 添加生成延迟，避免同一帧生成多个敌机
    if (this.lastSpawnTime && Date.now() - this.lastSpawnTime < 500) {
      return; // 500ms内不重复生成
    }
    
    // 检查是否有Boss在场，如果有就不生成其他敌机
    const hasBoss = this.gameInstance.enemies.some(enemy => enemy.type === 'boss');
    if (hasBoss) return; // Boss在场时不生成其他敌机
    
    // BOSS被打败后短暂过渡期
    if (this.gameInstance.lastBossTime && Date.now() - this.gameInstance.lastBossTime < 3000) {
      return;
    }
    
    // 检查是否允许生成敌机（由BattlePhaseManager统一管理）
    if (!this.gameInstance.battlePhaseManager.canSpawnEnemies()) {
      return;
    }
    
    // 根据游戏时长调整生成频率和数量 - 渐进式挑战
    let adjustedSpawnRate = GAME_CONFIG.enemy.spawnRate;
    let maxSpawnCount = GAME_CONFIG.enemy.maxSimultaneousSpawn;
    
    const gameTime = Date.now() - (this.gameInstance.gameStartTime || Date.now());
    const gameMinutes = gameTime / 60000;
    
    if (gameMinutes > 2) {
      adjustedSpawnRate *= 1.2; // 适度提高频率
      maxSpawnCount = 3;
    }
    if (gameMinutes > 4) {
      adjustedSpawnRate *= 1.3; // 继续提高
      maxSpawnCount = 4;
    }
    if (gameMinutes > 6) {
      adjustedSpawnRate *= 1.4; // 后期挑战
      maxSpawnCount = 5; // 最高难度增加数量
    }
    
    if (Math.random() < adjustedSpawnRate) {
      const spacing = GAME_CONFIG.enemy.spacing;
      

      
      // 每次只生成一种类型的敌机，避免重叠
        let enemyType;
        
      // 基于BattlePhaseManager的敌机类型选择
      const allowedTypes = this.gameInstance.battlePhaseManager.getAllowedEnemyTypes();
      if (allowedTypes.length === 0) {
        return; // 当前阶段不允许生成敌机
      }
      
      // 根据允许的类型随机选择
      if (allowedTypes.includes('small') && allowedTypes.includes('medium')) {
        const rand = Math.random();
        enemyType = rand < 0.7 ? 'small' : 'medium';
      } else if (allowedTypes.includes('small')) {
        enemyType = 'small';
      } else if (allowedTypes.includes('medium')) {
        enemyType = 'medium';
      }
        
        if (enemyType === 'boss') {
        // BOSS生成现在通过预警系统处理，这里不直接生成
        enemyType = 'large'; // 改为生成大型敌机
        }
        
        if (enemyType !== 'boss') {
          // 小型敌机改为单飞形式，不再编队
          if (enemyType === 'small') {
            // 直接生成单个小型敌机
            this.spawnSingleEnemy('small');
            return;
          }
          
        // 中型敌机编队生成 - 2-3架一组（减少密度）
        if (enemyType === 'medium' && Math.random() < 0.6) {
          // 60%概率生成2-3机编队（降低概率）
          const formationType = 'line';
          const safeZoneStart = this.gameInstance.screenWidth * 0.1;
          const safeZoneEnd = this.gameInstance.screenWidth * 0.9;
          const centerX = safeZoneStart + Math.random() * (safeZoneEnd - safeZoneStart);
          const centerY = -120;
          const formationSize = 2 + Math.floor(Math.random() * 2); // 2-3架（减少1架）
            
          const formationEnemies = this.gameInstance.flightPatternManager.generateFormation(
            formationType, centerX, centerY, formationSize, 
            enemyType, this.gameInstance.level, 1, this.gameInstance, 'straight'
          );
          
          // 为编队中的每个中型飞机设置随机图片类型 (1-4)
          formationEnemies.forEach(enemy => {
            enemy.monsterType = 1 + Math.floor(Math.random() * 4); // 1, 2, 3, 4
          });
          
          this.gameInstance.enemies.push(...formationEnemies);
          return;
        }
          
        // 大型敌机由BattlePhaseManager统一管理，这里不处理
      }
    }
  }
  

  
  spawnLargeEnemy() {
    const safeZoneStart = this.gameInstance.screenWidth * 0.1;
    const safeZoneEnd = this.gameInstance.screenWidth * 0.9;
    
    const x = safeZoneStart + Math.random() * (safeZoneEnd - safeZoneStart);
    const y = -150;
    
    // 随机选择大型怪兽图片 (1-5)
    const monsterType = 1 + Math.floor(Math.random() * 5); // 1, 2, 3, 4, 5
    
    const enemy = new Enemy(x, y, 'large', this.gameInstance.level, 1, 'top', this.gameInstance);
    enemy.shootTimer = Math.floor(Math.random() * 300);
    
    // 设置怪兽类型，用于选择不同的图片
    enemy.monsterType = monsterType;
    
    this.gameInstance.enemies.push(enemy);
  }
  
  // 检查敌机重叠
  checkOverlap(x, y, enemyType) {
    // 根据敌机类型设置不同的安全距离
    const safeDistance = enemyType === 'small' ? 80 : enemyType === 'medium' ? 100 : 120;
    
    return this.gameInstance.enemies.some(existingEnemy => {
      const dx = existingEnemy.x - x;
      const dy = existingEnemy.y - y;
      return Math.sqrt(dx * dx + dy * dy) < safeDistance;
    });
  }
  
  // 生成单个敌机（供BattlePhaseManager调用）
  spawnSingleEnemy(enemyType) {
    const spacing = 80; // 增加安全间距，从50增加到80
    
    // 选择生成位置，避免重叠
    let x, y;
    let attempts = 0;
    
    do {
      x = spacing + Math.random() * (this.gameInstance.screenWidth - spacing * 2);
      y = -50 - Math.random() * 100;
      attempts++;
    } while (this.checkOverlap(x, y, enemyType) && attempts < 10);
    
    // 创建敌机
    const enemy = new Enemy(x, y, enemyType, this.gameInstance.level, 1, 'top', this.gameInstance);
    
    // 设置飞行模式
    enemy.flightPattern = this.gameInstance.flightPatternManager.getRandomPattern('small');
    enemy.flightFrameCount = 0;
    
    this.gameInstance.enemies.push(enemy);
  }
}

// 导出EnemySpawner类
export { EnemySpawner };
