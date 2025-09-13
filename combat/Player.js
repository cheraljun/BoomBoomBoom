// 风暴之书 - 玩家类模块

import { GAME_CONFIG } from '../config/GameConfig.js';
import { PlayerBullet } from './PlayerBullet.js';

// 玩家类
class Player {
  constructor(x, y, gameInstance = null) {
    this.x = x;
    this.y = y;
    this.width = GAME_CONFIG.player.width;
    this.height = GAME_CONFIG.player.height;
    this.speed = GAME_CONFIG.player.speed;
    this.lives = 3;         // 玩家总生命数 - 正常模式
    this.health = 100;     // 当前血量 (0-100)
    this.maxHealth = 100;  // 最大血量

    this.superBombs = 0;   // 初始0个轰炸，提升难度

    this.wingmenLevel = 0; // 从0开始，表示没有僚机
    this.bulletLevel = 1;       // 每局从1发子弹开始
    this.bulletTier = 1;       // 子弹威力等级 (升级到最高时提升)
    this.hasDoubleUpgrade = false; // 每局重新开始，需要收集道具升级
    this.invulnerable = 0;
    this.type = 'silver';
    this.shootTimer = 0;   // 添加射击计时器
    this.gameInstance = gameInstance;
    
    // ==> 自动测试AI Hook 开始 (可注释整个块禁用)
    this.autoTest = {
      enabled: false,
      
      // 简化AI核心参数
      threatDetectionRange: 600,  // 威胁检测范围
      dangerThreshold: 30,        // 危险阈值，低于此值进入危险模式(降低阈值，更早感知危险)
      
      // 传送系统
      teleport: {
        cooldown: 0,              // 传送冷却时间
        cooldownMax: 30,          // 最大冷却时间(0.5秒@60FPS)
        safeZones: [],            // 可用的安全传送点
        justTeleported: false,    // 刚传送标志
        protectionFrames: 0       // 传送保护帧数
      },
      
      // 巡逻系统(安全时使用)
      patrol: {
        direction: 1,             // 移动方向(1=右, -1=左)
        speed: 1.5,               // 巡逻速度
        range: 0.7,               // 巡逻范围(屏幕宽度的70%)
        directionCooldown: 0      // 方向改变冷却
      },
      
      // 道具收集系统(安全时使用)
      itemCollect: {
        target: null,             // 当前收集目标
        priority: {               // 道具优先级
          '双倍火力': 10,
          '战斗僚机': 9,
          '追踪导弹': 8,
          '轰炸': 7,
          '生命补给': 6
        }
      },
      
      // 当前移动目标
      moveTarget: { x: this.x, y: this.y },
      
      // 自动轰炸设置
      autoBomb: {
        enabled: true,            // 启用自动轰炸
        onlyWhenCritical: false   // 是否仅在血量危急时使用(false=被击中就用)
      }
    };
    // <== 自动测试AI Hook 结束

  }
  
  update() {
    this.shootTimer++;
    
    if (this.invulnerable > 0) {
      this.invulnerable--;
    }
    
    // ==> 自动测试AI Hook 开始 (可注释整个块禁用)
    if (this.autoTest && this.autoTest.enabled && this.gameInstance) {
      this.updateAutoTest();
    }
    // <== 自动测试AI Hook 结束

  }
  
  shoot() {
    const bullets = [];
    const damage = GAME_CONFIG.player.bulletDamage + this.bulletTier * 2; // 基础伤害 + 威力等级加成
    const bulletType = 'silver'; // 固定银色子弹
    
    // 新的子弹系统：一旦升级到双发，永远是双发或更多
    let actualBulletLevel = this.bulletLevel;
    if (this.hasDoubleUpgrade && actualBulletLevel === 1) {
      actualBulletLevel = 2; // 强制双发
    }
    
    // 根据子弹数量等级和威力等级确定使用的图片样式
    let bulletStyle = 'single';
    if (actualBulletLevel === 1) {
      bulletStyle = 'single';
    } else if (actualBulletLevel === 2) {
      bulletStyle = 'double';
    } else if (actualBulletLevel === 4) {
      bulletStyle = 'quad';
    } else if (actualBulletLevel === 8) {
      bulletStyle = 'octa';
    } else if (actualBulletLevel >= 10) {
      bulletStyle = 'deca';
    }
    
    // 威力等级影响子弹的外观和伤害（经典飞行射击游戏特色）
    // bulletTier = 1: 普通子弹, bulletTier = 2: 更强子弹, 等等

    if (actualBulletLevel === 1) {
      // 1发 - 单发中央射击
      bullets.push(new PlayerBullet(this.x, this.y - 25, bulletType, damage, this.bulletTier, 0, this.gameInstance, false, bulletStyle));
    } else if (actualBulletLevel === 2) {
      // 2发 - 左右双发
      bullets.push(new PlayerBullet(this.x - 10, this.y - 25, bulletType, damage, this.bulletTier, 0, this.gameInstance, false, bulletStyle));
      bullets.push(new PlayerBullet(this.x + 10, this.y - 25, bulletType, damage, this.bulletTier, 0, this.gameInstance, false, bulletStyle));
    } else if (actualBulletLevel === 4) {
      // 4发 - 扇形分布
      bullets.push(new PlayerBullet(this.x - 15, this.y - 25, bulletType, damage, this.bulletTier, 0, this.gameInstance, false, bulletStyle));
      bullets.push(new PlayerBullet(this.x - 5, this.y - 25, bulletType, damage, this.bulletTier, 0, this.gameInstance, false, bulletStyle));
      bullets.push(new PlayerBullet(this.x + 5, this.y - 25, bulletType, damage, this.bulletTier, 0, this.gameInstance, false, bulletStyle));
      bullets.push(new PlayerBullet(this.x + 15, this.y - 25, bulletType, damage, this.bulletTier, 0, this.gameInstance, false, bulletStyle));
    } else if (actualBulletLevel === 8) {
      // 8发 - 密集扇形
      for (let i = 0; i < 8; i++) {
        const offsetX = (i - 3.5) * 6; // 均匀分布
        bullets.push(new PlayerBullet(this.x + offsetX, this.y - 25, bulletType, damage, this.bulletTier, 0, this.gameInstance, false, bulletStyle));
      }
    } else if (actualBulletLevel >= 10) {
      // 10发 - 最强火力，前方扇形+侧面掩护
      for (let i = 0; i < 10; i++) {
        const offsetX = (i - 4.5) * 5; // 更密集的分布
        bullets.push(new PlayerBullet(this.x + offsetX, this.y - 25, bulletType, damage, this.bulletTier, 0, this.gameInstance, false, bulletStyle));
      }
    }
    
    return bullets;
  }
  
  upgradeBulletLevel() {
    // 飞行射击游戏经典升级系统: 1→2→4→8→10→2(威力++)→4(威力++)...
    if (this.bulletLevel === 1) {
      this.hasDoubleUpgrade = true; // 第一次升级获得永久双发能力
      this.bulletLevel = 2;
    } else if (this.bulletLevel === 2) {
      this.bulletLevel = 4;
    } else if (this.bulletLevel === 4) {
      this.bulletLevel = 8;
    } else if (this.bulletLevel === 8) {
      this.bulletLevel = 10;
    } else if (this.bulletLevel >= 10) {
      // 到达最高数量后，重新开始但威力提升
      this.bulletLevel = 2; // 回到双发，但威力更强
      this.bulletTier++; // 威力等级提升（影响颜色和伤害）
    }
  }
  
  canShoot() {
    // 固定发射间隔，确保稳定的发射频率
    const fireInterval = Math.floor(60 / GAME_CONFIG.player.fireRate);
    return this.shootTimer % fireInterval === 0;
  }
  
  takeDamage(damage = 25) {
    if (this.invulnerable > 0) return;
    
    // 先减少血量
    this.health -= damage;
    this.invulnerable = 60; // 短暂无敌时间
    
    // ==> 自动测试AI Hook 开始 (可注释整个块禁用)
    // 自动轰炸：被击中后如果有轰炸就立即使用
    if (this.autoTest && this.autoTest.enabled && 
        this.autoTest.autoBomb.enabled && this.gameInstance) {
      
      // 检查是否满足使用条件
      let shouldUseBomb = false;
      
      if (this.autoTest.autoBomb.onlyWhenCritical) {
        // 仅在血量危急时使用(血量<30或即将死亡)
        shouldUseBomb = this.health < 30 || this.health <= 0;
      } else {
        // 被击中就使用
        shouldUseBomb = true;
      }
      
      if (shouldUseBomb && this.gameInstance.sessionBombs > 0) {
        // 有轰炸道具时立即使用
        this.gameInstance.clearScreen();
        this.gameInstance.addNotification('AI自动轰炸! 清除威胁');
      }
    }
    // <== 自动测试AI Hook 结束
    
    // 失去导弹
    if (this.gameInstance && this.gameInstance.powerupManager) {
      this.gameInstance.powerupManager.deactivateMissileMode();
      this.gameInstance.addNotification('失去导弹!');
    }
    
    // 血量耗尽时才减少生命
    if (this.health <= 0) {
      this.lives--;
      this.health = this.maxHealth; // 复活时血量回满
      
      // 僚机生命周期管理：每次生命结束时清除僚机
      if (this.gameInstance && this.gameInstance.wingmen) {
        this.gameInstance.wingmen = [];
        this.wingmenLevel = 0;
        this.gameInstance.addNotification('失去僚机！');
      }
      
      // 死亡惩罚：子弹数量回到初始状态，但保持威力
      if (this.lives >= 0) {
        if (this.hasDoubleUpgrade) {
          this.bulletLevel = 2; // 如果已获得双发能力，回到双发
        } else {
          this.bulletLevel = 1; // 否则回到单发
        }
        // bulletTier(威力等级)保持不变，这是玩家的永久进步
      }
    }
  }
  
  render(ctx) {
    if (this.invulnerable > 0 && Math.floor(this.invulnerable / 10) % 2) {
      return;
    }
    
    // 使用图片渲染玩家
    let image = null;
    if (this.gameInstance && this.gameInstance.imageManager) {
      // 使用主玩家图片 (player_main.png)
      image = this.gameInstance.imageManager.images.player[0];
    }
    
    if (image && image.complete) {
      // 图片放大1.5倍
      const scale = 1.5;
      const scaledWidth = this.width * scale;
      const scaledHeight = this.height * scale;
      
      ctx.drawImage(image, 
        this.x - scaledWidth/2, 
        this.y - scaledHeight/2, 
        scaledWidth, 
        scaledHeight
      );
    } else {
      // 延迟渲染：图片未加载完成时不渲染，等下一帧
      return;
    }
  }
  
  // ==> 自动测试AI Hook 开始 (可注释整个块禁用)
  // AI主更新逻辑 - 简化的二分法决策
  updateAutoTest() {
    const teleportConfig = this.autoTest.teleport;
    
    // 传送保护期：跳过所有逻辑
    if (teleportConfig.justTeleported) {
      teleportConfig.protectionFrames--;
      if (teleportConfig.protectionFrames <= 0) {
        teleportConfig.justTeleported = false;
      }
      return;
    }
    
    // 传送冷却计时
    if (teleportConfig.cooldown > 0) {
      teleportConfig.cooldown--;
    }
    
    // 巡逻方向冷却计时
    if (this.autoTest.patrol.directionCooldown > 0) {
      this.autoTest.patrol.directionCooldown--;
    }
    
    // 计算当前危险度
    const dangerLevel = this.calculateDangerLevel();
    
    // 二分法决策
    if (dangerLevel >= this.autoTest.dangerThreshold) {
      this.handleDangerousMode(dangerLevel);  // 危险模式：躲避或传送
    } else {
      this.handleSafeMode();                  // 安全模式：巡逻和收集道具
    }
    
    // 执行移动
    this.executeMovement();
  }
  
  // 计算当前危险度 - 统一的威胁评估
  calculateDangerLevel() {
    const game = this.gameInstance;
    let danger = 0;
    
    // 检测子弹威胁
    if (game.enemyBullets) {
      game.enemyBullets.forEach(bullet => {
        const distance = this.calculateDistance(this.x, this.y, bullet.x, bullet.y);
        if (distance < this.autoTest.threatDetectionRange) {
          // 预测子弹10帧后位置
          const futureX = bullet.x + (bullet.vx || 0) * 10;
          const futureY = bullet.y + (bullet.speed || 2) * 10;
          const futureDistance = this.calculateDistance(this.x, this.y, futureX, futureY);
          
          const minDistance = Math.min(distance, futureDistance);
          if (minDistance < 60) {
            danger += Math.max(50, 150 - minDistance); // 近距离高威胁
          } else {
            danger += Math.max(0, 30 - minDistance * 0.1); // 远距离低威胁
          }
        }
      });
    }
    
    // 检测敌机威胁
    if (game.enemies) {
      game.enemies.forEach(enemy => {
        const distance = this.calculateDistance(this.x, this.y, enemy.x, enemy.y);
        if (distance < this.autoTest.threatDetectionRange) {
          const enemySize = Math.max(enemy.width || 40, enemy.height || 50);
          if (distance < enemySize * 1.5) {
            danger += 80; // 敌机近身高威胁
          } else {
            danger += Math.max(0, 40 - distance * 0.1);
          }
        }
      });
    }
    
    // 检测客机威胁
    if (game.passengers) {
      game.passengers.forEach(passenger => {
        const distance = this.calculateDistance(this.x, this.y, passenger.x, passenger.y);
        if (distance < this.autoTest.threatDetectionRange) {
          const passengerSize = Math.max(passenger.width || 60, passenger.height || 80);
          if (distance < passengerSize * 2) {
            danger += 60; // 客机威胁中等，但要避让
          }
        }
      });
    }
    
    return danger;
  }
  
  // 危险模式处理 - 躲避或传送
  handleDangerousMode(dangerLevel) {
    // 非常危险时直接传送(降低阈值，更早直接传送)
    if (dangerLevel > 70 && this.autoTest.teleport.cooldown === 0) {
      if (this.attemptTeleport()) {
        return; // 传送成功，结束处理
      }
    }
    
    // 寻找最近的安全位置
    const safeSpot = this.findNearestSafeSpot();
    if (safeSpot) {
      this.autoTest.moveTarget = safeSpot;
    } else {
      // 没有安全位置，尝试传送
      this.attemptTeleport();
    }
  }
  
  // 安全模式处理 - 巡逻和收集道具
  handleSafeMode() {
    // 1. 优先收集道具
    const item = this.findBestItem();
    if (item) {
      this.autoTest.itemCollect.target = item;
      this.autoTest.moveTarget = { x: item.x, y: item.y };
      return;
    }
    
    // 2. 没有道具时巡逻
    this.handlePatrol();
  }
  

  
  // 执行紧急传送 - 真正的瞬间传送
  executeEmergencyTeleport() {
    const teleportConfig = this.autoTest.emergencyTeleport;
    const game = this.gameInstance;
    
    // 如果没有可用的安全区域，不传送
    if (teleportConfig.emergencySafeZones.length === 0) {
      return false;
    }
    
    // 选择最安全的区域，严格筛选条件
    let bestZone = null;
    for (let zone of teleportConfig.emergencySafeZones) {
      // 确保传送目标在安全范围内，距离边界更远
      if (zone.x > 120 && zone.x < game.screenWidth - 120 &&
          zone.y > 140 && zone.y < game.screenHeight - 140) {
        
        // 严格检查：确保传送目标远离所有威胁
        let isSafeFromAllThreats = true;
        
        // 检查敌机子弹
        for (let bullet of game.enemyBullets) {
          const distance = this.calculateDistance(zone.x, zone.y, bullet.x, bullet.y);
          if (distance < 80) { // 传送位置距离子弹至少80像素
            isSafeFromAllThreats = false;
            break;
          }
        }
        
        // 检查敌机
        if (isSafeFromAllThreats) {
          for (let enemy of game.enemies) {
            const distance = this.calculateDistance(zone.x, zone.y, enemy.x, enemy.y);
            if (distance < 120) { // 传送位置距离敌机至少120像素
              isSafeFromAllThreats = false;
              break;
            }
          }
        }
        
        // 检查客机
        if (isSafeFromAllThreats && game.passengers && game.passengers.length > 0) {
          for (let passenger of game.passengers) {
            const distance = this.calculateDistance(zone.x, zone.y, passenger.x, passenger.y);
            if (distance < 180) { // 传送位置距离客机至少180像素
              isSafeFromAllThreats = false;
              break;
            }
          }
        }
        
        if (isSafeFromAllThreats) {
          bestZone = zone;
          break; // 取第一个符合条件的（已按安全度排序）
        }
      }
    }
    
    if (bestZone) {
      // 执行真正的瞬间传送
      this.x = bestZone.x;
      this.y = bestZone.y;
      
      // 设置传送状态和保护
      teleportConfig.teleportCooldown = teleportConfig.teleportCooldownMax;
      teleportConfig.justTeleported = true;
      teleportConfig.teleportFrames = 3; // 传送后3帧保护期
      
      // 重置所有移动目标为传送位置
      this.autoTest.currentSafeTarget = { x: this.x, y: this.y };
      
      // 清除可能的紧急重新规划标志
      this.autoTest.needsEmergencyReplan = false;
      
      return true; // 表示执行了传送
    }
    
    return false;
  }
  
  // 检查自动收集道具 - 优先级最低，只在安全时执行
  checkAutoCollectItems() {
    const collectConfig = this.autoTest.autoCollect;
    const game = this.gameInstance;
    
    // 检查是否启用自动收集
    if (!collectConfig.enabled) return;
    
    // 检查当前安全度，只有在安全时才收集道具
    const currentSafety = this.calculateSafetyScore(this.x, this.y);
    if (currentSafety < collectConfig.safetyThreshold) {
      collectConfig.collectTarget = null; // 不安全时清除收集目标
      return;
    }
    
    // 检查是否有道具可收集
    if (!game.items || game.items.length === 0) {
      collectConfig.collectTarget = null;
      return;
    }
    
    // 寻找最优收集目标
    this.findBestCollectTarget();
  }
  
  // 寻找最优道具收集目标
  findBestCollectTarget() {
    const collectConfig = this.autoTest.autoCollect;
    const game = this.gameInstance;
    
    let bestItem = null;
    let bestScore = 0;
    
    // 遍历所有道具，计算收集评分
    game.items.forEach(item => {
      const distance = this.calculateDistance(this.x, this.y, item.x, item.y);
      
      // 只考虑检测范围内的道具
      if (distance > collectConfig.detectionRange) return;
      
      // 检查收集路径的安全性
      const pathSafety = this.calculateItemPathSafety(item);
      if (pathSafety < 70) return; // 路径不安全，跳过
      
      // 计算道具收集评分
      const priority = collectConfig.collectPriority[item.type] || 5; // 默认优先级5
      const distanceScore = Math.max(0, 100 - distance * 0.5); // 距离越近评分越高
      const safetyScore = pathSafety; // 路径安全度
      
      // 综合评分 = 优先级 * 10 + 距离评分 + 安全评分
      const totalScore = priority * 10 + distanceScore * 0.3 + safetyScore * 0.2;
      
      if (totalScore > bestScore) {
        bestScore = totalScore;
        bestItem = item;
      }
    });
    
    // 设置收集目标
    collectConfig.collectTarget = bestItem;
  }
  
  // 计算收集道具路径的安全性
  calculateItemPathSafety(item) {
    const steps = 10; // 将路径分成10段检查
    let minSafety = 100;
    
    for (let i = 0; i <= steps; i++) {
      const ratio = i / steps;
      const checkX = this.x + (item.x - this.x) * ratio;
      const checkY = this.y + (item.y - this.y) * ratio;
      
      const pathSafety = this.calculateSafetyScore(checkX, checkY);
      minSafety = Math.min(minSafety, pathSafety);
      
      // 如果路径中任何一点过于危险，立即返回
      if (pathSafety < 50) {
        return pathSafety;
      }
    }
    
    return minSafety;
  }
  
  // 动态重评估当前目标安全性
  reEvaluateCurrentTarget() {
    const target = this.autoTest.currentSafeTarget;
    
    // 计算当前目标位置的实时安全度
    const targetSafety = this.calculateSafetyScore(target.x, target.y);
    const currentSafety = this.calculateSafetyScore(this.x, this.y);
    
    // 如果目标位置变得不安全，立即放弃当前目标
    if (targetSafety < 50) {
      // 目标已经危险，立即停止移动，以当前位置为新目标
      this.autoTest.currentSafeTarget = { x: this.x, y: this.y };
      
      // 如果当前位置也不安全，标记需要紧急重新搜索
      if (currentSafety < 40) {
        this.autoTest.needsEmergencyReplan = true;
      }
    } 
    // 如果目标安全度明显低于当前位置，也考虑重新规划
    else if (targetSafety < currentSafety - 20 && currentSafety > 70) {
      // 当前位置相对更安全，不必移动到不太安全的目标
      this.autoTest.currentSafeTarget = { x: this.x, y: this.y };
    }
  }
  
  // 大范围威胁扫描 - 为紧急传送准备安全区域
  longRangeThreatScan() {
    const game = this.gameInstance;
    const teleportConfig = this.autoTest.emergencyTeleport;
    
    // 减少传送冷却时间
    if (teleportConfig.teleportCooldown > 0) {
      teleportConfig.teleportCooldown--;
    }
    
    // 每20帧重新扫描一次大范围安全区域(更频繁的扫描)
    if (this.shootTimer % 20 !== 0) return;
    
    teleportConfig.emergencySafeZones = [];
    const scanRange = teleportConfig.longRangeScanRange;
    const step = 50; // 大范围搜索用更大的步长
    
    // 在整个屏幕范围内搜索安全区域
    for (let x = 80; x < game.screenWidth - 80; x += step) {
      for (let y = 100; y < game.screenHeight - 100; y += step) {
        const safety = this.calculateLongRangeSafety(x, y, scanRange);
        
        // 只保留极高安全度的区域作为紧急传送目标(提高标准)
        if (safety >= 95) {
          teleportConfig.emergencySafeZones.push({
            x: x,
            y: y,
            safety: safety,
            distanceFromPlayer: this.calculateDistance(this.x, this.y, x, y)
          });
        }
      }
    }
    
    // 按安全度降序排序，优先选择最安全的区域
    teleportConfig.emergencySafeZones.sort((a, b) => b.safety - a.safety);
  }
  
  // 计算大范围安全度
  calculateLongRangeSafety(x, y, scanRange) {
    let safety = 100;
    const game = this.gameInstance;
    
    // 检测大范围内的敌机子弹威胁
    game.enemyBullets.forEach(bullet => {
      const distance = this.calculateDistance(x, y, bullet.x, bullet.y);
      if (distance < scanRange) {
        // 预测更长时间(15帧)的威胁位置
        const futureX = bullet.x + (bullet.vx || 0) * 15;
        const futureY = bullet.y + (bullet.speed || 2) * 15;
        const futureDistance = this.calculateDistance(x, y, futureX, futureY);
        
        const dangerDistance = Math.min(distance, futureDistance);
        if (dangerDistance < 50) {
          safety -= 60; // 大幅降低安全度
        } else {
          const decayFactor = Math.max(0, 1 - (dangerDistance - 50) / 100);
          safety -= 40 * decayFactor;
        }
      }
    });
    
    // 检测大范围内的敌机威胁
    game.enemies.forEach(enemy => {
      const distance = this.calculateDistance(x, y, enemy.x, enemy.y);
      if (distance < scanRange) {
        const futureX = enemy.x + (enemy.vx || 0) * 15;
        const futureY = enemy.y + (enemy.speed || 1) * 15;
        const futureDistance = this.calculateDistance(x, y, futureX, futureY);
        
        const dangerDistance = Math.min(distance, futureDistance);
        const enemySize = Math.max(enemy.width || 40, enemy.height || 50) * 2;
        
        if (dangerDistance < enemySize) {
          safety -= 80; // 敌机威胁更大
        } else {
          const decayFactor = Math.max(0, 1 - (dangerDistance - enemySize) / 120);
          safety -= 50 * decayFactor;
        }
      }
    });
    
    // 检测大范围内的客机威胁
    if (game.passengers && game.passengers.length > 0) {
      game.passengers.forEach(passenger => {
        const distance = this.calculateDistance(x, y, passenger.x, passenger.y);
        if (distance < scanRange) {
          const futureX = passenger.x + (passenger.vx || 0) * 15;
          const futureY = passenger.y + (passenger.vy || 0) * 15;
          const futureDistance = this.calculateDistance(x, y, futureX, futureY);
          
          const dangerDistance = Math.min(distance, futureDistance);
          const passengerSize = Math.max(passenger.width || 60, passenger.height || 80) * 2.2; // 客机避让距离更大
          
          if (dangerDistance < passengerSize) {
            safety -= 70; // 客机威胁较高，避免误撞造成伤害
          } else {
            const decayFactor = Math.max(0, 1 - (dangerDistance - passengerSize) / 150);
            safety -= 45 * decayFactor;
          }
        }
      });
    }
    
    return Math.max(0, safety);
  }
  
  // 检测威胁
  detectThreats() {
    const threats = [];
    const game = this.gameInstance;
    
    // 检测敌机子弹威胁
    game.enemyBullets.forEach(bullet => {
      const distance = this.calculateDistance(this.x, this.y, bullet.x, bullet.y);
      if (distance < this.autoTest.threatScanRange) {
        threats.push({
          x: bullet.x,
          y: bullet.y,
          vx: bullet.vx || 0,
          vy: bullet.speed || 2,
          radius: 35,  // 子弹真正危险半径(最后时刻规避)
          severity: Math.max(40, 200 - distance * 0.7)
        });
      }
    });
    
    // 检测敌机威胁
    game.enemies.forEach(enemy => {
      const distance = this.calculateDistance(this.x, this.y, enemy.x, enemy.y);
      if (distance < this.autoTest.threatScanRange) {
        threats.push({
          x: enemy.x,
          y: enemy.y,
          vx: enemy.vx || 0,
          vy: enemy.speed || 1,
          radius: Math.max(enemy.width || 40, enemy.height || 50) * 1.5, // 敌机真正危险半径(最后时刻规避)
          severity: Math.max(40, 200 - distance * 0.7),
          type: 'enemy'
        });
      }
    });
    
    // 检测客机威胁
    if (game.passengers && game.passengers.length > 0) {
      game.passengers.forEach(passenger => {
        const distance = this.calculateDistance(this.x, this.y, passenger.x, passenger.y);
        if (distance < this.autoTest.threatScanRange) {
          threats.push({
            x: passenger.x,
            y: passenger.y,
            vx: passenger.vx || 0,
            vy: passenger.vy || 0,
            radius: Math.max(passenger.width || 60, passenger.height || 80) * 1.8, // 客机避让半径更大，避免误撞
            severity: Math.max(60, 250 - distance * 0.8), // 客机威胁级别较高，因为撞击有伤害
            type: 'passenger'
          });
        }
      });
    }
    
    this.autoTest.threats = threats;
  }
  
    // 寻找安全区域
  findSafeZone() {
    const game = this.gameInstance;
    const currentSafety = this.calculateSafetyScore(this.x, this.y);
    
    // 紧急重新规划：当前位置很危险时，强制搜索新的安全区域
    if (this.autoTest.needsEmergencyReplan) {
      this.autoTest.needsEmergencyReplan = false; // 重置标志
      // 跳过所有稳定性检查，立即搜索最安全的位置
    }
    // 自动收集道具逻辑(优先级高于巡逻，但低于安全)
    else if (this.autoTest.autoCollect.enabled && 
             this.autoTest.autoCollect.collectTarget && 
             currentSafety >= this.autoTest.autoCollect.safetyThreshold) {
      this.handleItemCollection(game, currentSafety);
      return; // 在收集道具时，不执行其他移动逻辑
    }
    // 安全时左右移动逻辑
    else if (this.autoTest.patrolMode.enabled && currentSafety >= this.autoTest.patrolMode.safetyThreshold) {
      this.handlePatrolMovement(game, currentSafety);
      return; // 在巡逻模式下，不执行常规的安全区域搜索
    }
    // 目标稳定性：如果当前位置够安全，就不要频繁换目标
    else if (currentSafety >= this.autoTest.minSafetyToKeepTarget) {
      // 检查当前目标是否还在合理范围内
      const targetDistance = this.calculateDistance(this.x, this.y, 
        this.autoTest.currentSafeTarget.x, this.autoTest.currentSafeTarget.y);
      
      // 如果当前已经很安全，且目标不太远，就保持当前目标
      if (targetDistance < 30) {
        return; // 保持目标不变，避免频繁跳跃
      }
    }
    
    let bestSafeSpot = { x: this.x, y: this.y };
    let bestSafety = currentSafety;
    
    // 在当前位置周围搜索安全区域
    const searchRange = this.autoTest.safeZoneSearchRange;
    const step = 3; // 搜索步长(提升网格密度，更精确路径规划)
    
    for (let dx = -searchRange; dx <= searchRange; dx += step) {
      for (let dy = -searchRange; dy <= searchRange; dy += step) {
        const testX = this.x + dx;
        const testY = this.y + dy;
        
        // 确保不超出屏幕边界
        if (testX < 40 || testX > game.screenWidth - 40 || 
            testY < 60 || testY > game.screenHeight - 60) {
          continue;
        }
        
        const safety = this.calculateSafetyScore(testX, testY);
        if (safety > bestSafety) {
          bestSafety = safety;
          bestSafeSpot = { x: testX, y: testY };
        }
      }
    }
    
    // 只有找到明显更好的位置才更新目标(增加稳定性)
    if (bestSafety > currentSafety + 5) { // 降低切换目标的门槛
      this.autoTest.currentSafeTarget = bestSafeSpot;
    }
  }
  
  // 计算位置安全度
  calculateSafetyScore(x, y) {
    let safety = 100;
    
    this.autoTest.threats.forEach(threat => {
      // 计算到威胁当前位置的距离
      const currentDistance = this.calculateDistance(x, y, threat.x, threat.y);
      
      // 预测威胁10帧后的位置(增加预判时间，更好应对密集快速子弹)
      const futureX = threat.x + threat.vx * 10;
      const futureY = threat.y + threat.vy * 10;
      const futureDistance = this.calculateDistance(x, y, futureX, futureY);
      
      // 取最危险的距离
      const dangerDistance = Math.min(currentDistance, futureDistance);
      
      if (dangerDistance < threat.radius) {
        // 真正危险区域，大幅扣分
        safety -= threat.severity * 3;
      } else {
        // 威胁影响范围较小，只在接近时才明显影响安全度
        const decayFactor = Math.max(0, 1 - (dangerDistance - threat.radius) / 60);
        safety -= threat.severity * decayFactor * 0.8;  // 降低远距离威胁的影响
      }
    });
    
    return Math.max(0, safety);
  }
  
  // 平滑移动到安全区域
  smoothMoveToSafeZone() {
    const target = this.autoTest.currentSafeTarget;
    const game = this.gameInstance;
    const currentSafety = this.calculateSafetyScore(this.x, this.y);
    
    // 计算移动方向
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    
    // 应用平滑移动
    const smoothX = dx * this.autoTest.smoothFactor;
    const smoothY = dy * this.autoTest.smoothFactor;
    
    // 根据当前状态调整移动速度
    let moveSpeedMultiplier = this.autoTest.moveSpeed;
    
    // 如果在收集道具模式下，使用中等移动速度
    if (this.autoTest.autoCollect.enabled && 
        this.autoTest.autoCollect.collectTarget && 
        currentSafety >= this.autoTest.autoCollect.safetyThreshold) {
      moveSpeedMultiplier *= 1.2; // 收集道具时稍快一些，但不要太急
    }
    // 如果在巡逻模式下，使用较慢的移动速度
    else if (this.autoTest.patrolMode.enabled && 
             currentSafety >= this.autoTest.patrolMode.safetyThreshold) {
      moveSpeedMultiplier *= this.autoTest.patrolMode.patrolSpeed;
    }
    
    // 限制移动速度
    const maxMove = this.speed * moveSpeedMultiplier;
    const moveDistance = Math.sqrt(smoothX * smoothX + smoothY * smoothY);
    
    let finalMoveX = smoothX;
    let finalMoveY = smoothY;
    
    if (moveDistance > maxMove) {
      const ratio = maxMove / moveDistance;
      finalMoveX *= ratio;
      finalMoveY *= ratio;
    }
    
    // 应用移动，确保不超出屏幕边界
    this.x = Math.max(40, Math.min(game.screenWidth - 40, this.x + finalMoveX));
    this.y = Math.max(60, Math.min(game.screenHeight - 60, this.y + finalMoveY));
  }
  
  // 处理安全时的左右移动
  handlePatrolMovement(game, currentSafety) {
    const patrol = this.autoTest.patrolMode;
    
    // 减少方向改变冷却时间
    if (patrol.changeDirectionCooldown > 0) {
      patrol.changeDirectionCooldown--;
    }
    
    // 计算巡逻范围边界
    const screenCenter = game.screenWidth / 2;
    const patrolHalfRange = (game.screenWidth * patrol.patrolRange) / 2;
    const leftBound = screenCenter - patrolHalfRange;
    const rightBound = screenCenter + patrolHalfRange;
    
    // 检查是否需要改变方向
    if (patrol.changeDirectionCooldown <= 0) {
      if ((patrol.direction === 1 && this.x >= rightBound - 50) ||
          (patrol.direction === -1 && this.x <= leftBound + 50)) {
        patrol.direction *= -1; // 改变方向
        patrol.changeDirectionCooldown = 60; // 设置冷却时间(1秒@60FPS)
      }
    }
    
    // 设置巡逻目标点
    if (patrol.direction === 1) {
      // 向右移动
      patrol.targetX = Math.min(rightBound, this.x + 100);
    } else {
      // 向左移动
      patrol.targetX = Math.max(leftBound, this.x - 100);
    }
    
    // 在设置目标前检查目标位置的安全性（包括客机威胁）
    const targetSafety = this.calculateSafetyScore(patrol.targetX, this.y);
    
    // 特别检查客机威胁：如果巡逻路径上有客机，暂停巡逻
    let hasPassengerThreat = false;
    if (game.passengers && game.passengers.length > 0) {
      game.passengers.forEach(passenger => {
        const distanceToTarget = this.calculateDistance(patrol.targetX, this.y, passenger.x, passenger.y);
        if (distanceToTarget < 120) { // 客机附近120像素内暂停巡逻
          hasPassengerThreat = true;
        }
      });
    }
    
    if (targetSafety >= patrol.safetyThreshold - 10 && !hasPassengerThreat) {
      // 目标位置安全且没有客机威胁，设置为当前目标
      this.autoTest.currentSafeTarget = { 
        x: patrol.targetX, 
        y: this.y 
      };
    } else {
      // 目标位置不安全或有客机威胁，保持当前位置为目标
      this.autoTest.currentSafeTarget = { 
        x: this.x, 
        y: this.y 
      };
      
      // 如果是因为客机威胁而停止，暂时增加方向改变冷却时间
      if (hasPassengerThreat) {
        patrol.changeDirectionCooldown = Math.max(patrol.changeDirectionCooldown, 30);
      }
    }
  }
  
  // 处理道具收集移动
  handleItemCollection(game, currentSafety) {
    const collectConfig = this.autoTest.autoCollect;
    const targetItem = collectConfig.collectTarget;
    
    // 检查目标道具是否仍然存在
    if (!targetItem || !game.items.includes(targetItem)) {
      collectConfig.collectTarget = null;
      return;
    }
    
    // 再次检查收集路径的安全性
    const pathSafety = this.calculateItemPathSafety(targetItem);
    if (pathSafety < 70) {
      collectConfig.collectTarget = null; // 路径变得不安全，放弃收集
      return;
    }
    
    // 检查是否已经足够接近道具(收集范围是40像素)
    const distanceToItem = this.calculateDistance(this.x, this.y, targetItem.x, targetItem.y);
    if (distanceToItem <= 45) {
      // 已经足够接近，直接设置为当前位置，让碰撞检测自动收集
      this.autoTest.currentSafeTarget = { x: this.x, y: this.y };
      return;
    }
    
    // 设置道具位置为移动目标
    this.autoTest.currentSafeTarget = { 
      x: targetItem.x, 
      y: targetItem.y 
    };
  }
  
  // 寻找最近的安全位置
  findNearestSafeSpot() {
    const game = this.gameInstance;
    let bestSpot = null;
    let bestDistance = Infinity;
    
    // 在当前位置周围搜索安全点
    const searchRadius = 150;
    const step = 30;
    
    for (let dx = -searchRadius; dx <= searchRadius; dx += step) {
      for (let dy = -searchRadius; dy <= searchRadius; dy += step) {
        const testX = this.x + dx;
        const testY = this.y + dy;
        
        // 边界检查
        if (testX < 60 || testX > game.screenWidth - 60 || 
            testY < 80 || testY > game.screenHeight - 80) {
          continue;
        }
        
        // 检查这个位置是否安全
        if (this.isPositionSafe(testX, testY)) {
          const distance = Math.abs(dx) + Math.abs(dy); // 曼哈顿距离
          if (distance < bestDistance) {
            bestDistance = distance;
            bestSpot = { x: testX, y: testY };
          }
        }
      }
    }
    
    return bestSpot;
  }
  
  // 检查位置是否安全 - 动态预判版本
  isPositionSafe(x, y) {
    const game = this.gameInstance;
    
    // 检查子弹威胁 - 预判子弹轨迹
    if (game.enemyBullets) {
      for (let bullet of game.enemyBullets) {
        // 检查传送后20帧内是否会与子弹相撞
        for (let frame = 0; frame <= 20; frame += 2) {
          const bulletX = bullet.x + (bullet.vx || 0) * frame;
          const bulletY = bullet.y + (bullet.speed || 2) * frame;
          
          const distance = this.calculateDistance(x, y, bulletX, bulletY);
          
          // 如果任何时刻距离子弹过近，则不安全
          if (distance < 70) {
            return false;
          }
        }
      }
    }
    
    // 检查敌机威胁
    if (game.enemies) {
      for (let enemy of game.enemies) {
        const distance = this.calculateDistance(x, y, enemy.x, enemy.y);
        const enemySize = Math.max(enemy.width || 40, enemy.height || 50);
        if (distance < enemySize * 2) return false; // 距离敌机太近
      }
    }
    
    // 检查客机威胁
    if (game.passengers) {
      for (let passenger of game.passengers) {
        const distance = this.calculateDistance(x, y, passenger.x, passenger.y);
        const passengerSize = Math.max(passenger.width || 60, passenger.height || 80);
        if (distance < passengerSize * 2.5) return false; // 距离客机太近
      }
    }
    
    return true;
  }
  
  // 尝试传送
  attemptTeleport() {
    const game = this.gameInstance;
    const teleport = this.autoTest.teleport;
    
    if (teleport.cooldown > 0) return false;
    
    // 寻找传送目标 - 扩大到整个屏幕范围
    let bestSpot = null;
    const spots = [];
    
    // 在整个屏幕范围内寻找安全传送点(密集搜索确保找到最佳位置)
    for (let x = 60; x < game.screenWidth - 60; x += 40) { // 更密集的搜索
      for (let y = 80; y < game.screenHeight - 80; y += 40) {
        if (this.isPositionSafe(x, y)) {
          // 计算这个位置的详细安全度
          const safetyScore = this.calculatePositionSafety(x, y);
          
          // 只选择安全度足够高的位置
          if (safetyScore > 60) {
            const distance = this.calculateDistance(this.x, this.y, x, y);
            spots.push({ x, y, distance, safety: safetyScore });
          }
        }
      }
    }
    
    // 如果高安全度位置不够，降低标准再搜索一次
    if (spots.length < 3) {
      for (let x = 60; x < game.screenWidth - 60; x += 50) {
        for (let y = 80; y < game.screenHeight - 80; y += 50) {
          if (this.isPositionSafe(x, y)) {
            const safetyScore = this.calculatePositionSafety(x, y);
            if (safetyScore > 30) { // 降低安全度要求
              const distance = this.calculateDistance(this.x, this.y, x, y);
              spots.push({ x, y, distance, safety: safetyScore });
            }
          }
        }
      }
    }
    
    if (spots.length > 0) {
      // 优先选择最安全的位置，而不是距离适中的位置
      spots.sort((a, b) => {
        // 首先按安全度降序排序
        const safetyDiff = b.safety - a.safety;
        if (Math.abs(safetyDiff) > 20) return safetyDiff;
        
        // 安全度相近时，优先选择距离当前威胁更远的位置
        return b.distance - a.distance;
      });
      
      bestSpot = spots[0];
      
      // 执行传送
      this.x = bestSpot.x;
      this.y = bestSpot.y;
      teleport.cooldown = teleport.cooldownMax;
      teleport.justTeleported = true;
      teleport.protectionFrames = 3;
      this.autoTest.moveTarget = { x: this.x, y: this.y };
      
      return true;
    }
    
    return false;
  }
  
  // 计算位置的详细安全度(用于传送目标选择) - 包含动态预判
  calculatePositionSafety(x, y) {
    const game = this.gameInstance;
    let safety = 100;
    
    // 检查子弹威胁 - 动态轨迹预判
    if (game.enemyBullets) {
      game.enemyBullets.forEach(bullet => {
        // 多时间点预判：检查传送后0-30帧内的威胁
        let minSafety = 100;
        
        for (let frame = 0; frame <= 30; frame += 3) { // 每3帧检查一次
          const bulletX = bullet.x + (bullet.vx || 0) * frame;
          const bulletY = bullet.y + (bullet.speed || 2) * frame;
          
          const distance = this.calculateDistance(x, y, bulletX, bulletY);
          
          // 计算这一帧的威胁度
          let frameThreat = 0;
          if (distance < 50) {
            frameThreat = 100; // 极度危险
          } else if (distance < 80) {
            frameThreat = 80 - (distance - 50) * 1.5; // 高度危险
          } else if (distance < 120) {
            frameThreat = 35 - (distance - 80) * 0.5; // 中度危险
          }
          
          // 近期帧的威胁权重更高
          const timeWeight = Math.max(0.3, 1 - frame * 0.02);
          frameThreat *= timeWeight;
          
          minSafety -= frameThreat;
        }
        
        safety = Math.min(safety, minSafety);
      });
    }
    
    // 检查敌机威胁
    if (game.enemies) {
      game.enemies.forEach(enemy => {
        const distance = this.calculateDistance(x, y, enemy.x, enemy.y);
        const enemySize = Math.max(enemy.width || 40, enemy.height || 50);
        
        if (distance < enemySize * 3) {
          safety -= Math.max(15, 60 - distance * 0.3);
        }
      });
    }
    
    // 检查客机威胁
    if (game.passengers) {
      game.passengers.forEach(passenger => {
        const distance = this.calculateDistance(x, y, passenger.x, passenger.y);
        const passengerSize = Math.max(passenger.width || 60, passenger.height || 80);
        
        if (distance < passengerSize * 3) {
          safety -= Math.max(10, 40 - distance * 0.2);
        }
      });
    }
    
    // 位置加分：距离屏幕边缘适中的位置更安全
    const centerX = game.screenWidth / 2;
    const centerY = game.screenHeight / 2;
    const distanceFromCenter = this.calculateDistance(x, y, centerX, centerY);
    const optimalDistance = Math.min(game.screenWidth, game.screenHeight) * 0.25;
    
    if (Math.abs(distanceFromCenter - optimalDistance) < 50) {
      safety += 10; // 距离屏幕中心适中位置加分
    }
    
    return Math.max(0, Math.min(100, safety));
  }
  
  // 寻找最佳道具
  findBestItem() {
    const game = this.gameInstance;
    if (!game.items || game.items.length === 0) return null;
    
    let bestItem = null;
    let bestScore = 0;
    
    game.items.forEach(item => {
      const distance = this.calculateDistance(this.x, this.y, item.x, item.y);
      if (distance > 200) return; // 距离太远
      
      // 检查收集路径是否安全
      if (!this.isPathSafe(this.x, this.y, item.x, item.y)) return;
      
      const priority = this.autoTest.itemCollect.priority[item.type] || 5;
      const distanceScore = Math.max(0, 200 - distance);
      const score = priority * 20 + distanceScore;
      
      if (score > bestScore) {
        bestScore = score;
        bestItem = item;
      }
    });
    
    return bestItem;
  }
  
  // 检查路径是否安全
  isPathSafe(startX, startY, endX, endY) {
    const steps = 5;
    for (let i = 0; i <= steps; i++) {
      const ratio = i / steps;
      const x = startX + (endX - startX) * ratio;
      const y = startY + (endY - startY) * ratio;
      if (!this.isPositionSafe(x, y)) return false;
    }
    return true;
  }
  
  // 处理巡逻移动
  handlePatrol() {
    const game = this.gameInstance;
    const patrol = this.autoTest.patrol;
    
    // 计算巡逻边界
    const centerX = game.screenWidth / 2;
    const patrolWidth = game.screenWidth * patrol.range;
    const leftBound = centerX - patrolWidth / 2;
    const rightBound = centerX + patrolWidth / 2;
    
    // 检查是否需要改变方向
    if (patrol.directionCooldown <= 0) {
      if ((patrol.direction === 1 && this.x >= rightBound - 60) ||
          (patrol.direction === -1 && this.x <= leftBound + 60)) {
        patrol.direction *= -1;
        patrol.directionCooldown = 60; // 1秒冷却
      }
    }
    
    // 设置巡逻目标
    const targetX = patrol.direction === 1 ? 
      Math.min(rightBound, this.x + 80) : 
      Math.max(leftBound, this.x - 80);
    
    this.autoTest.moveTarget = { x: targetX, y: this.y };
  }
  
  // 执行移动
  executeMovement() {
    const target = this.autoTest.moveTarget;
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 5) { // 避免抖动
      const speed = this.speed * this.autoTest.patrol.speed;
      const moveX = (dx / distance) * Math.min(speed, distance);
      const moveY = (dy / distance) * Math.min(speed, distance);
      
      const game = this.gameInstance;
      this.x = Math.max(40, Math.min(game.screenWidth - 40, this.x + moveX));
      this.y = Math.max(60, Math.min(game.screenHeight - 60, this.y + moveY));
    }
  }
  
  // 计算两点间距离
  calculateDistance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  }
  // <== 自动测试AI Hook 结束

}

export { Player }; 


