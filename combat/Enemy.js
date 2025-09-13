// 风暴之书 - 敌机类模块

import { GAME_CONFIG } from '../config/GameConfig.js';
import { EnemyBullet } from './EnemyBullet.js';
import { BulletPatternGenerator } from '../effects/BulletPatternGenerator.js';

// 敌机类
class Enemy {
  constructor(x, y, type, level, unused = 1, spawnSide = 'top', gameInstance = null) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.level = level;
    this.gameInstance = gameInstance;
    
    // 根据游戏等级选择敌机外观 - 使用具体图片名字
    if (type === 'boss') {
      const bossImages = ['boss_01.png', 'boss_02.png', 'boss_03.png'];
      this.spriteName = bossImages[Math.floor(Math.random() * 3)]; // Boss随机选择
    } else if (type === 'small') {
      // 小型敌机只有一张图片
      this.spriteName = 'enemy_small.png';
    } else if (type === 'medium') {
      const mediumImages = ['enemy_medium_01.png', 'enemy_medium_02.png', 'enemy_medium_03.png', 'enemy_medium_04.png'];
      
      // 美学难度设计：01最简单，04最难
      if (level <= 2) {
        // 初期：主要使用01-02（简单敌机）
        const simpleImages = mediumImages.slice(0, 2);
        this.spriteName = simpleImages[Math.floor(Math.random() * simpleImages.length)];
      } else if (level <= 5) {
        // 中期：主要使用01-04，权重分布
        const weights = [0.3, 0.3, 0.25, 0.15];
        const selectedIndex = this.weightedRandomChoice(weights);
        this.spriteName = mediumImages[selectedIndex];
      } else {
        // 后期：更多困难敌机，但保持平衡
        const weights = [0.1, 0.15, 0.35, 0.4];
        const selectedIndex = this.weightedRandomChoice(weights);
        this.spriteName = mediumImages[selectedIndex];
      }
    } else if (type === 'large') {
      const largeImages = ['enemy_large_01.png', 'enemy_large_02.png', 'enemy_large_03.png', 'enemy_large_04.png', 'enemy_large_05.png'];
      
      // 美学难度设计：01最简单，05最难
      if (level <= 2) {
        // 初期：主要使用01-02（简单敌机）
        const simpleImages = largeImages.slice(0, 2);
        this.spriteName = simpleImages[Math.floor(Math.random() * simpleImages.length)];
      } else if (level <= 5) {
        // 中期：主要使用01-04，偶尔05
        const weights = [0.3, 0.3, 0.2, 0.15, 0.05];
        const selectedIndex = this.weightedRandomChoice(weights);
        this.spriteName = largeImages[selectedIndex];
      } else {
        // 后期：更多困难敌机，但保持平衡
        const weights = [0.1, 0.15, 0.25, 0.3, 0.2];
        const selectedIndex = this.weightedRandomChoice(weights);
        this.spriteName = largeImages[selectedIndex];
      }
    }
    

    this.flightPattern = null;
    this.flightFrameCount = 0;
    this.startX = x;
    this.startY = y;
    this.canShootFlag = true; // 默认可以射击
    
    // 初始化弹幕生成器
    this.bulletGenerator = new BulletPatternGenerator();
    

    if (type === 'small' && gameInstance && gameInstance.flightPatternManager) {
      this.flightPattern = gameInstance.flightPatternManager.getRandomPattern('small');
      this.canShootFlag = false; // 小敌机不射击
      
      // 为特定飞行模式设置参数
      if (this.flightPattern === 'lshape') {
        this.lDirection = Math.random() < 0.5 ? -1 : 1;
      }
      if (this.flightPattern === 'side_arc') {
        this.arcDirection = Math.random() < 0.5 ? -1 : 1;
      }
      if (this.flightPattern === 'horizontal_sweep') {
        this.sweepDirection = Math.random() < 0.5 ? -1 : 1;
      }
    }
    
    // 中型敌机也不射击，只作为威胁存在
    if (type === 'medium') {
      this.canShootFlag = false;
    }
    
    // 根据类型设置属性
    const typeConfig = {
      small: { width: 30, height: 30, hp: 1, speed: 6, score: 10 },      // 1发子弹死亡，大幅增加速度
      medium: { width: 50, height: 50, hp: 12, speed: 2, score: 30 },  // 3-4发子弹死亡
      large: { width: 80, height: 80, hp: 1000, speed: 1, score: 80 },   // 200-250发子弹死亡
      boss: { width: 160, height: 140, hp: 50000, speed: 0.6, score: 1500 } // 测试用：增强5倍血量方便测试弹幕
    };
    
    const config = typeConfig[type];
    this.width = config.width;
    this.height = config.height;
    
    // 根据击杀数动态调整敌机强度
    if (type === 'boss') {
      // Boss血量：使用击杀数难度系数
      const difficulty = gameInstance ? gameInstance.calculateDifficulty() : 1;
      this.maxHp = Math.ceil(config.hp * difficulty);
      this.hp = this.maxHp;
      this.speed = config.speed;
      this.scoreValue = config.score;
      
      // Boss特有属性
      this.moveDirection = 1;
      this.verticalDirection = 1;
      this.targetY = 120;
      this.isInPosition = false;
      this.shootPattern = 0;
      this.bossPhase = 1;
      this.lastPhaseHp = this.maxHp;
      
      // Boss旋转弹幕系统
      this.rotationAngle = 0; // 当前旋转角度
      this.rotationSpeed = 0; // 旋转速度
      this.rotationDirection = 1; // 旋转方向：1=顺时针, -1=逆时针
      this.bulletPattern = 0; // 当前弹幕模式：0=固定圆周, 1=快速旋转, 2=单向旋转, 3=风车弹, 4=交叉弹, 5=复数甩弹, 6=米弹
      this.patternTimer = 0; // 弹幕模式计时器
      this.bulletCooldown = 0; // 弹幕冷却时间
      this.isWaitingForClear = false; // 是否在等待屏幕清空
      this.bulletModeActive = false; // 弹幕模式是否激活
    this.hasPlayedBossAudio = false; // Boss音效标志，确保每个Boss只播放一次
      this.canShootFlag = true; // Boss现在可以射击了
      this.fastRotationPhase = 0; // 快速旋转阶段：0=第一次, 1=第二次
      this.windmillPhase = 0; // 风车弹阶段
      this.crossPhase = 0; // 交叉弹阶段
      this.singleRotationDuration = 0; // 单向旋转持续时间
      this.singleRotationMaxDuration = 600 + Math.floor(Math.random() * 600); // 10-20秒随机持续时间
      
      // 双向旋转系统
      this.dualRotationPhase = 0; // 双向旋转阶段：0=第一方向, 1=第二方向
      this.dualRotationDuration = 0; // 双向旋转持续时间
      this.dualRotationPhase1Duration = 0; // 第一阶段持续时间
      this.dualRotationPhase2Duration = 0; // 第二阶段持续时间
      this.dualRotationDirection1 = 1; // 第一阶段旋转方向
      this.dualRotationDirection2 = -1; // 第二阶段旋转方向
      
      // 延迟发射系统
      this.delayedBulletQueue = []; // 延迟发射队列
      this.delayedBulletTimer = 0; // 延迟发射计时器
    } else if (type === 'large') {
      // 大型敌机：使用击杀数难度系数
      const difficulty = gameInstance ? gameInstance.calculateDifficulty() : 1;
      this.maxHp = Math.ceil(config.hp * difficulty);
      this.hp = this.maxHp;
      this.speed = config.speed;
      this.scoreValue = config.score;
    } else {
      // 普通敌机：使用击杀数难度系数
      const difficulty = gameInstance ? gameInstance.calculateDifficulty() : 1;
      this.maxHp = Math.ceil(config.hp * difficulty);
      this.hp = this.maxHp;
      this.speed = config.speed;
      this.scoreValue = config.score;
    }
    
    // 射击相关
    this.shootTimer = 0;
    this.shootInterval = 120; // 标准射击间隔（Boss不射击）
    
    // 编队相关
    this.formationIndex = 0;
    this.formationOffset = { x: 0, y: 0 };
    this.isFormationLeader = false;
    this.formationId = null; // 新增：用于标识编队
    this.formationLeader = false; // 新增：是否为领队
    
    // 特殊属性
    this.monsterType = 1; // 大型敌机的怪兽类型
    this.isHovering = false; // 大型敌机悬浮模式
    this.hoverTimer = 0;
    this.hoverDirection = 1;
    this.hoverMode = false; // 大型敌机悬浮模式标志
    
    // 大型敌机悬浮模式属性
    this.hasReachedHoverPosition = false; // 是否到达悬浮位置
    this.hoverTargetY = 120; // 悬浮目标高度
    this.hoverSpeed = 1; // 悬浮移动速度
  }
  
  update() {
    if (this.type === 'boss') {
      this.updateBoss();
    } else {
      
      // 编队飞行 - 保持相对位置同步移动
      if (this.formationId && this.gameInstance) {
        if (this.formationLeader) {
          // 领队正常使用飞行模式
          if (this.flightPattern && this.gameInstance.flightPatternManager) {
            this.flightFrameCount++;
            const newPos = this.gameInstance.flightPatternManager.calculatePosition(
              this.flightPattern, 
              this, 
              this.flightFrameCount
            );
            this.x = newPos.x;
            this.y = newPos.y;
          } else {
            this.y += this.speed;
          }
        } else {
          // 编队成员跟随领队
          const leader = this.gameInstance.enemies.find(e => 
            e.formationId === this.formationId && e.formationLeader
          );
          if (leader) {
            // 保持相对于领队的固定偏移
            this.x = leader.x + this.formationOffset.x;
            this.y = leader.y + this.formationOffset.y;
          } else {
            // 如果领队不存在，使用默认移动
            this.y += this.speed;
          }
        }
        
        // 限制在屏幕范围内 - 增加安全边距
        const margin = Math.max(this.width / 2 + 20, 40); // 至少40像素边距
        this.x = Math.max(margin, Math.min(this.gameInstance.screenWidth - margin, this.x));
      }
      // 单机飞行模式
      else if (this.flightPattern && this.gameInstance && this.gameInstance.flightPatternManager) {
        this.flightFrameCount++;
        const newPos = this.gameInstance.flightPatternManager.calculatePosition(
          this.flightPattern, 
          this, 
          this.flightFrameCount
        );
        this.x = newPos.x;
        this.y = newPos.y;
        
        // 限制在屏幕范围内 - 增加安全边距
        const margin = Math.max(this.width / 2 + 20, 40); // 至少40像素边距
        this.x = Math.max(margin, Math.min(this.gameInstance.screenWidth - margin, this.x));
      } else {
        // 大型敌机悬浮模式
        if (this.type === 'large') {
          this.updateLargeEnemyBehavior();
        } else {
          // 默认移动模式
          this.y += this.speed;
          
          // 只有非小敌机或没有飞行模式的小敌机才使用旧的移动逻辑
          if (this.type === 'small' && !this.flightPattern) {
            this.x += Math.sin(this.y * 0.02) * 2;
            const margin = Math.max(this.width / 2 + 20, 40); // 至少40像素边距
            this.x = Math.max(margin, Math.min(this.gameInstance.screenWidth - margin, this.x));
          }
        }
      }
    }
    
    this.shootTimer++;
  }
  
  updateBoss() {
    // Boss专用更新逻辑
    if (!this.isInPosition) {
      // 移动到目标位置
      if (this.y < this.targetY) {
        this.y += this.speed;
      } else {
        this.isInPosition = true;
      }
    } else {
      // 左右摆动
      this.x += this.moveDirection * this.speed * 0.5;
      
      // 边界检测
      if (this.x < 80 || this.x > this.gameInstance.screenWidth - 80) {
        this.moveDirection *= -1;
      }
      
      // 垂直移动
      this.y += this.verticalDirection * this.speed * 0.3;
      if (this.y < this.targetY - 40 || this.y > this.targetY + 40) {
        this.verticalDirection *= -1;
      }
      
      // 阶段转换检测
      if (this.hp < this.lastPhaseHp * 0.5 && this.bossPhase === 1) {
        this.bossPhase = 2;
        this.speed *= 1.2; // 移动更快
      }
      
      // 召唤小兵
      if (this.shootTimer % 300 === 0) { // 每5秒召唤一次
        this.summonMinions();
      }
      
      // 更新旋转角度
      this.rotationAngle += this.rotationSpeed * this.rotationDirection;
      
      // 保持角度在0-2π范围内
      while (this.rotationAngle >= Math.PI * 2) {
        this.rotationAngle -= Math.PI * 2;
      }
      while (this.rotationAngle < 0) {
        this.rotationAngle += Math.PI * 2;
      }
      
      // 处理延迟发射队列
      this.processDelayedBullets();
    }
  }
  
  // Boss旋转弹幕系统
  canBossShoot() {
    // 必须在位置上才能发射弹幕
    if (!this.isInPosition) {
      return false;
    }
    
    // 如果在等待屏幕清空，检查是否已清空
    if (this.isWaitingForClear) {
      const screenBulletCount = this.countScreenBullets();
      if (screenBulletCount === 0) {
        this.isWaitingForClear = false;
        this.bulletCooldown = 60; // 1秒冷却
        this.switchBulletPattern(); // 切换到下一个弹幕模式
      }
      return false;
    }
    
    // 冷却时间检查
    if (this.bulletCooldown > 0) {
      this.bulletCooldown--;
      return false;
    }
    
    // 激活弹幕模式
    if (!this.bulletModeActive) {
      this.bulletModeActive = true;
      this.patternTimer = 0;
      this.setupCurrentPattern();
    }
    
    // 根据当前弹幕模式决定是否发射
    return this.shouldFireInCurrentPattern();
  }
  
  // 设置当前弹幕模式的参数
  setupCurrentPattern() {
    switch (this.bulletPattern) {
      case 0: // 固定圆周发射 - 多层圆周
        this.rotationSpeed = 0;
        this.rotationDirection = 1;
        this.bulletDensity = 8 + Math.floor(Math.random() * 5); // 8-12发子弹随机密度
        this.circleRadius = 30 + Math.random() * 20; // 30-50像素随机半径
        this.bulletImageName = 'bullet_02.png';
        break;
      case 1: // 快速旋转发射（条状）- 增加随机性
        this.rotationSpeed = 0.12 + Math.random() * 0.06; // 0.12-0.18随机速度
        this.rotationDirection = Math.random() < 0.5 ? -1 : 1;
        this.fastRotationPhase = 0;
        this.bulletLines = Math.random() < 0.3 ? 3 : 2; // 30%概率3条线，否则2条
        this.bulletImageName = 'bullet_03.png';
        break;
      case 2: // 单向旋转发射（螺旋）- 长时间持续发射
        this.rotationSpeed = 0.20 + Math.random() * 0.20; // 0.20-0.40随机速度（再快2倍）
        this.rotationDirection = Math.random() < 0.5 ? -1 : 1; // 随机方向
        this.spiralDensity = 1; // 每次发射1发子弹
        this.bulletImageName = 'bullet_02.png';
        // 重置旋转持续计时器
        this.singleRotationDuration = 0;
        break;
      case 3: // 风车弹（双甩弹）- 增加随机性
        this.rotationSpeed = 0.06 + Math.random() * 0.04; // 0.06-0.10随机速度
        this.rotationDirection = Math.random() < 0.5 ? -1 : 1;
        this.windmillArms = Math.random() < 0.3 ? 3 : 2; // 30%概率3臂风车
        this.armLength = 40 + Math.random() * 20; // 40-60像素臂长
        this.bulletImageName = 'bullet_03.png';
        break;
      case 4: // 交叉弹（对称弹幕）- 增加随机性
        this.rotationSpeed = 0.04 + Math.random() * 0.04; // 0.04-0.08随机速度
        this.rotationDirection = Math.random() < 0.5 ? -1 : 1;
        this.crossDensity = 4 + Math.floor(Math.random() * 3); // 4-6发每条线
        this.crossAngle = 45 + Math.random() * 90; // 45-135度随机交叉角
        this.bulletImageName = 'bullet_02.png';
        break;
      case 5: // 复数甩弹 - 增加随机性
        this.rotationSpeed = 0.10 + Math.random() * 0.05; // 0.10-0.15随机速度
        this.rotationDirection = Math.random() < 0.5 ? -1 : 1;
        this.sweepAngle = 60 + Math.random() * 60; // 60-120度随机扫射角度
        this.sweepBullets = 5 + Math.floor(Math.random() * 4); // 5-8发子弹
        this.bulletImageName = 'bullet_03.png';
        break;
      case 6: // 米弹（多重复数弹）- 增加随机性
        this.rotationSpeed = 0.02 + Math.random() * 0.04; // 0.02-0.06随机速度
        this.rotationDirection = Math.random() < 0.5 ? -1 : 1;
        this.riceLayers = 2 + Math.floor(Math.random() * 2); // 2-3层米弹
        this.riceSpacing = 15 + Math.random() * 10; // 15-25像素间距
        this.bulletImageName = 'bullet_02.png';
        break;
      case 7: // 双向旋转发射（螺旋）- 长时间双向持续发射
        this.rotationSpeed = 0.20 + Math.random() * 0.20; // 0.20-0.40随机速度（快速旋转）
        // 随机确定两个阶段的时间分配，总时间>17秒
        const totalDuration = 1020 + Math.floor(Math.random() * 600); // 17-27秒随机
        this.dualRotationPhase1Duration = 300 + Math.floor(Math.random() * (totalDuration - 600)); // 第一阶段5秒以上
        this.dualRotationPhase2Duration = totalDuration - this.dualRotationPhase1Duration; // 剩余时间给第二阶段
        // 随机确定两个阶段的旋转方向
        this.dualRotationDirection1 = Math.random() < 0.5 ? -1 : 1;
        this.dualRotationDirection2 = -this.dualRotationDirection1; // 反方向
        this.rotationDirection = this.dualRotationDirection1; // 从第一方向开始
        this.dualRotationPhase = 0; // 重置阶段
        this.dualRotationDuration = 0; // 重置计时器
        this.bulletImageName = 'bullet_02.png';
        break;
      case 8: // 变速旋转弹幕（波与粒子的境界）
        this.baseRotationSpeed = 0.02; // 基础速度
        this.speedAcceleration = 0.001 + Math.random() * 0.001; // 0.001-0.002加速度
        this.rotationDirection = Math.random() < 0.5 ? -1 : 1;
        this.accelerationPhase = 0; // 加速相位
        this.maxSpeed = 0.2; // 最大速度
        this.bulletImageName = 'bullet_02.png';
        break;

    }
  }
  
  // 判断当前模式是否应该发射
  shouldFireInCurrentPattern() {
    this.patternTimer++;
    
    switch (this.bulletPattern) {
      case 0: // 固定圆周发射 - 发射一次后等待清屏
        if (this.patternTimer === 1) {
          this.isWaitingForClear = true;
          this.bulletModeActive = false;
          // 播放Boss射击音效（仅首次）
          if (!this.hasPlayedBossAudio && this.gameInstance && this.gameInstance.audioManager) {
            this.gameInstance.audioManager.playBossShootSound();
            this.hasPlayedBossAudio = true;
          }
          return true;
        }
        break;
        
              case 1: // 快速旋转发射 - 两个阶段，每个阶段45帧
        // 第一阶段：0-45帧
        if (this.patternTimer <= 45 && this.patternTimer % 2 === 0) {
          // 播放Boss射击音效（仅首次）
          if (this.patternTimer === 2 && !this.hasPlayedBossAudio && this.gameInstance && this.gameInstance.audioManager) {
            this.gameInstance.audioManager.playBossShootSound();
            this.hasPlayedBossAudio = true;
          }
          return true;
        } 
        // 切换旋转方向的间隔
        else if (this.patternTimer === 46) {
          this.rotationDirection *= -1; // 切换旋转方向
          this.fastRotationPhase = 1;
          return false;
        }
        // 第二阶段：47-92帧
        else if (this.patternTimer >= 47 && this.patternTimer <= 92 && (this.patternTimer - 47) % 2 === 0) {
          return true;
        } 
        else if (this.patternTimer > 92) {
          this.isWaitingForClear = true;
          this.bulletModeActive = false;
        }
        break;
        
              case 2: // 单向旋转发射 - 连续发射10-20秒
        if (this.patternTimer <= this.singleRotationMaxDuration && this.patternTimer % 3 === 0) {
          // 播放Boss射击音效（仅首次）
          if (this.patternTimer === 3 && !this.hasPlayedBossAudio && this.gameInstance && this.gameInstance.audioManager) {
            this.gameInstance.audioManager.playBossShootSound();
            this.hasPlayedBossAudio = true;
          }
          return true;
        } else if (this.patternTimer > this.singleRotationMaxDuration) {
          this.isWaitingForClear = true;
          this.bulletModeActive = false;
          // 重置旋转持续时间，为下次准备
          this.singleRotationDuration = 0;
          this.singleRotationMaxDuration = 600 + Math.floor(Math.random() * 600); // 新的10-20秒随机时间
        }
        break;
        
      case 3: // 风车弹 - 持续发射120帧（2秒）
        if (this.patternTimer <= 120 && this.patternTimer % 5 === 0) {
          // 播放Boss射击音效（仅首次）
          if (this.patternTimer === 5 && !this.hasPlayedBossAudio && this.gameInstance && this.gameInstance.audioManager) {
            this.gameInstance.audioManager.playBossShootSound();
            this.hasPlayedBossAudio = true;
          }
          return true;
        } else if (this.patternTimer > 120) {
          this.isWaitingForClear = true;
          this.bulletModeActive = false;
        }
        break;
        
      case 4: // 交叉弹 - 发射3轮，每轮间隔30帧
        if ((this.patternTimer === 1) || (this.patternTimer === 31) || (this.patternTimer === 61)) {
          // 播放Boss射击音效（仅首次）
          if (this.patternTimer === 1 && !this.hasPlayedBossAudio && this.gameInstance && this.gameInstance.audioManager) {
            this.gameInstance.audioManager.playBossShootSound();
            this.hasPlayedBossAudio = true;
          }
          return true;
        } else if (this.patternTimer > 90) {
          this.isWaitingForClear = true;
          this.bulletModeActive = false;
        }
        break;
        
      case 5: // 复数甩弹 - 连续发射100帧，间隔3帧
        if (this.patternTimer <= 100 && this.patternTimer % 3 === 0) {
          // 播放Boss射击音效（仅首次）
          if (this.patternTimer === 3 && !this.hasPlayedBossAudio && this.gameInstance && this.gameInstance.audioManager) {
            this.gameInstance.audioManager.playBossShootSound();
            this.hasPlayedBossAudio = true;
          }
          return true;
        } else if (this.patternTimer > 100) {
          this.isWaitingForClear = true;
          this.bulletModeActive = false;
        }
        break;
        
      case 6: // 米弹 - 发射5轮，每轮间隔20帧
        if (this.patternTimer <= 100 && this.patternTimer % 20 === 1) {
          // 播放Boss射击音效（仅首次）
          if (this.patternTimer === 1 && !this.hasPlayedBossAudio && this.gameInstance && this.gameInstance.audioManager) {
            this.gameInstance.audioManager.playBossShootSound();
            this.hasPlayedBossAudio = true;
          }
          return true;
        } else if (this.patternTimer > 100) {
          this.isWaitingForClear = true;
          this.bulletModeActive = false;
        }
        break;
        
      case 7: // 双向旋转发射 - 先一个方向转，再反方向转
        this.dualRotationDuration++;
        
        // 第一阶段
        if (this.dualRotationPhase === 0) {
          if (this.dualRotationDuration <= this.dualRotationPhase1Duration) {
            // 播放Boss射击音效（仅首次）
            if (this.dualRotationDuration === 1 && !this.hasPlayedBossAudio && this.gameInstance && this.gameInstance.audioManager) {
              this.gameInstance.audioManager.playBossShootSound();
              this.hasPlayedBossAudio = true;
            }
            this.rotationDirection = this.dualRotationDirection1;
            return true;
          } else if (this.dualRotationDuration > this.dualRotationPhase1Duration) {
            // 切换到第二阶段
            this.dualRotationPhase = 1;
            this.rotationDirection = this.dualRotationDirection2;
          }
        }
        // 第二阶段
        else if (this.dualRotationPhase === 1) {
          const totalDuration = this.dualRotationPhase1Duration + this.dualRotationPhase2Duration;
          if (this.dualRotationDuration <= totalDuration) {
            this.rotationDirection = this.dualRotationDirection2;
            return true;
          } else if (this.dualRotationDuration > totalDuration) {
            this.isWaitingForClear = true;
            this.bulletModeActive = false;
          }
        }
        break;
        
      case 8: // 变速旋转弹幕（波与粒子的境界）- 速度动态变化
        if (this.patternTimer <= 180 && this.patternTimer % 2 === 0) {
          // 播放Boss射击音效（仅首次）
          if (this.patternTimer === 2 && !this.hasPlayedBossAudio && this.gameInstance && this.gameInstance.audioManager) {
            this.gameInstance.audioManager.playBossShootSound();
            this.hasPlayedBossAudio = true;
          }
          // 动态更新旋转速度：慢→快→慢→反向
          this.accelerationPhase++;
          const cyclePhase = (this.accelerationPhase % 120) / 120; // 2秒一个周期
          if (cyclePhase < 0.5) {
            // 前半周期：加速
            this.rotationSpeed = this.baseRotationSpeed + (cyclePhase * 2) * this.maxSpeed;
          } else {
            // 后半周期：减速并可能反向
            this.rotationSpeed = this.maxSpeed - ((cyclePhase - 0.5) * 2) * this.maxSpeed;
            if (cyclePhase > 0.9) {
              this.rotationDirection *= -1; // 偶尔反向
            }
          }
          return true;
        } else if (this.patternTimer > 180) {
          this.isWaitingForClear = true;
          this.bulletModeActive = false;
        }
        break;
        

    }
    
    return false;
  }
  
  // 切换弹幕模式
  switchBulletPattern() {
    this.bulletPattern = (this.bulletPattern + 1) % 9; // 现在有9种弹幕模式
  }
  
  // 计算屏幕内的子弹数量
  countScreenBullets() {
    if (!this.gameInstance || !this.gameInstance.enemyBullets) {
      return 0;
    }
    
    return this.gameInstance.enemyBullets.filter(bullet => 
      bullet.x >= -50 && bullet.x <= this.gameInstance.screenWidth + 50 &&
      bullet.y >= -50 && bullet.y <= this.gameInstance.screenHeight + 50
    ).length;
  }
  
  // 生成Boss旋转弹幕
  generateBossRotationBullets() {
    const bullets = [];
    
    switch (this.bulletPattern) {
      case 0: // 固定圆周发射
        bullets.push(...this.generateFixedCircleBullets());
        break;
      case 1: // 快速旋转发射（条状）
        bullets.push(...this.generateFastRotationBullets());
        break;
      case 2: // 单向旋转发射（螺旋）
        bullets.push(...this.generateSingleDirectionBullets());
        break;
      case 3: // 风车弹（双甩弹）
        bullets.push(...this.generateWindmillBullets());
        break;
      case 4: // 交叉弹（对称弹幕）
        bullets.push(...this.generateCrossBullets());
        break;
      case 5: // 复数甩弹
        bullets.push(...this.generateComplexSweepBullets());
        break;
      case 6: // 米弹（多重复数弹）
        bullets.push(...this.generateRiceBullets());
        break;
      case 7: // 双向旋转发射（螺旋弹幕）
        bullets.push(...this.generateDualDirectionBullets());
        break;
      case 8: // 变速旋转弹幕（波与粒子的境界）
        bullets.push(...this.generateVariableRotationBullets());
        break;

    }
    
    return bullets;
  }
  
  // 固定圆周发射 - 多层圆周（1-5层）
  generateFixedCircleBullets() {
    const bullets = [];
    const bulletCount = 8 + Math.floor(Math.random() * 6); // 8-13颗随机（减少密度）
    const angleStep = (Math.PI * 2) / bulletCount;
    const speed = 3; // 固定速度，保持美感
    const baseRadius = 35 + Math.random() * 15; // 35-50随机基础半径
    const layerCount = Math.floor(Math.random() * 7) + 1; // 1-7层随机
    const layerSpacing = 25 + Math.random() * 15; // 25-40px层间距
    
    for (let layer = 0; layer < layerCount; layer++) {
      const radius = baseRadius + layer * layerSpacing;
      
      for (let i = 0; i < bulletCount; i++) {
        const angle = i * angleStep;
        const startX = this.x + Math.cos(angle) * radius;
        const startY = this.y + Math.sin(angle) * radius;
        
        const bullet = new EnemyBullet(
          startX,
          startY,
          speed,
          this.gameInstance,
          'boss'
        );
        
        bullet.velocityX = Math.cos(angle) * speed;
        bullet.velocityY = Math.sin(angle) * speed;
        bullet.imageName = this.bulletImageName || 'bullet_02.png';
        
        bullets.push(bullet);
      }
    }
    
    return bullets;
  }
  
  // 快速旋转发射（条状弹幕）- 延迟逐层发射
  generateFastRotationBullets() {
    const bullets = []; // 立即发射的子弹（第一层）
    const bulletCount = 3; // 每层3颗子弹形成条状
    const angleSpread = Math.PI / 12; // 固定15度扩散，保持美感
    const speed = 4; // 固定速度，保持美感
    const layerCount = 2 + Math.floor(Math.random() * 6); // 2-7层随机
    const layerSpacing = 25; // 固定层间距
    
    // 随机确定这次发射的间隔时间（帧数）
    const baseInterval = Math.floor(1 + Math.random() * 12); // 0.01-0.2秒（1-12帧）的随机间隔
    
    for (let layer = 0; layer < layerCount; layer++) {
      const layerRadius = layer * layerSpacing; // 每层向外扩散
      const layerBullets = [];
      
      for (let i = 0; i < bulletCount; i++) {
        const angle = this.rotationAngle + (i - 1) * angleSpread;
        const startX = this.x + Math.cos(angle) * layerRadius;
        const startY = this.y + this.height / 2 + Math.sin(angle) * layerRadius;
        
        const bulletData = {
          x: startX,
          y: startY,
          speed: speed,
          velocityX: Math.cos(angle) * speed,
          velocityY: Math.sin(angle) * speed,
          width: 10,
          height: 10,
          imageType: 'bullet',
          imageName: 'bullet_02.png'
        };
        
        if (layer === 0) {
          // 第一层立即发射
          const bullet = new EnemyBullet(
            bulletData.x,
            bulletData.y,
            bulletData.speed,
            this.gameInstance,
            'large'
          );
          bullet.velocityX = bulletData.velocityX;
          bullet.velocityY = bulletData.velocityY;
          bullet.width = bulletData.width;
          bullet.height = bulletData.height;
          bullet.imageType = bulletData.imageType;
          bullet.imageName = bulletData.imageName;
          bullets.push(bullet);
        } else {
          // 其他层加入延迟发射队列
          layerBullets.push(bulletData);
        }
      }
      
      // 将延迟发射的层加入队列
      if (layer > 0) {
        this.delayedBulletQueue.push({
          fireTime: this.delayedBulletTimer + layer * baseInterval,
          bulletData: layerBullets
        });
      }
    }
    
    return bullets;
  }
  
  // 单向旋转发射（螺旋弹幕）- 持续旋转发射
  generateSingleDirectionBullets() {
    const bullets = [];
    const speed = 3.5; // 固定速度，保持美感
    
    // 每次调用都发射一发子弹，由shouldFireInCurrentPattern控制频率
    const bullet = new EnemyBullet(
      this.x,
      this.y + this.height / 2,
      speed,
      this.gameInstance,
      'large'
    );
    
    bullet.velocityX = Math.cos(this.rotationAngle) * speed;
    bullet.velocityY = Math.sin(this.rotationAngle) * speed;
    bullet.width = 11;
    bullet.height = 11;
    bullet.imageType = 'bullet';
    bullet.imageName = 'bullet_02.png';
    
    bullets.push(bullet);
    
    return bullets;
  }
  
  // 风车弹（双甩弹）- 经典东方弹幕
  generateWindmillBullets() {
    const bullets = [];
    const speed = 3.5; // 固定速度，保持美感
    const armCount = 3 + Math.floor(Math.random() * 3); // 3-5臂随机
    
    for (let arm = 0; arm < armCount; arm++) {
      // 每个臂相差90度
      const armAngle = this.rotationAngle + (arm * Math.PI / 2);
      
              // 每个臂发射一串子弹形成甩弹效果
        const bulletsPerArm = 2 + Math.floor(Math.random() * 3); // 2-4颗随机
        for (let i = 0; i < bulletsPerArm; i++) {
          const sweepOffset = i * (0.1 + Math.random() * 0.1); // 0.1-0.2随机甩弹偏移
          const finalAngle = armAngle + sweepOffset;
          const bulletSpeed = speed + i * 0.3; // 固定递增速度，保持甩弹美感
        
        const bullet = new EnemyBullet(
          this.x,
          this.y + this.height / 2,
          bulletSpeed,
          this.gameInstance,
          'large'
        );
        bullet.velocityX = Math.cos(finalAngle) * bulletSpeed;
        bullet.velocityY = Math.sin(finalAngle) * bulletSpeed;
        bullet.width = 10 - i; // 越远越小
        bullet.height = 10 - i;
        bullet.imageType = 'bullet';
        bullet.imageName = 'bullet_02.png';
        bullets.push(bullet);
      }
    }
    
    return bullets;
  }
  
  // 交叉弹（对称弹幕）
  generateCrossBullets() {
    const bullets = [];
    const speed = 4; // 固定速度，保持美感
    const armCount = 6 + Math.floor(Math.random() * 3); // 6-8个方向随机（减少密度）
    const angleStep = (Math.PI * 2) / armCount;
    
    // 第一组：从Boss发射
    for (let i = 0; i < armCount; i++) {
      const angle = i * angleStep + this.rotationAngle;
      const bullet = new EnemyBullet(
        this.x,
        this.y + this.height / 2,
        speed,
        this.gameInstance,
        'large'
      );
      bullet.velocityX = Math.cos(angle) * speed;
      bullet.velocityY = Math.sin(angle) * speed;
      bullet.width = 11;
      bullet.height = 11;
      bullet.imageType = 'bullet';
      bullet.imageName = 'bullet_02.png';
      bullets.push(bullet);
    }
    
    // 第二组：从Boss对侧虚拟点发射（形成交叉）
    const virtualX = this.gameInstance.screenWidth - this.x;
    for (let i = 0; i < armCount; i++) {
      const angle = i * angleStep - this.rotationAngle; // 反向
      const bullet = new EnemyBullet(
        virtualX,
        this.y + this.height / 2,
        speed * 0.8, // 稍慢一些
        this.gameInstance,
        'large'
      );
      bullet.velocityX = Math.cos(angle) * speed * 0.8;
      bullet.velocityY = Math.sin(angle) * speed * 0.8;
      bullet.width = 9;
      bullet.height = 9;
      bullet.imageType = 'bullet';
      bullet.imageName = 'bullet_02.png';
      bullets.push(bullet);
    }
    
    return bullets;
  }
  
  // 复数甩弹 - 环形甩弹
  generateComplexSweepBullets() {
    const bullets = [];
    const speed = 3.8; // 固定速度，保持美感
    const sweepCount = 4 + Math.floor(Math.random() * 3); // 4-6个甩弹方向随机（减少密度）
    const angleStep = (Math.PI * 2) / sweepCount;
    
    for (let i = 0; i < sweepCount; i++) {
      const baseAngle = i * angleStep;
      // 每个方向发射一个带有甩弹效果的子弹
      const sweepOffset = this.rotationAngle * 0.3; // 甩弹偏移
      const finalAngle = baseAngle + sweepOffset;
      
      const bullet = new EnemyBullet(
        this.x,
        this.y + this.height / 2,
        speed,
        this.gameInstance,
        'large'
      );
      bullet.velocityX = Math.cos(finalAngle) * speed;
      bullet.velocityY = Math.sin(finalAngle) * speed;
      bullet.width = 12;
      bullet.height = 12;
      bullet.imageType = 'bullet';
      bullet.imageName = 'bullet_02.png';
      bullets.push(bullet);
    }
    
    return bullets;
  }
  
  // 米弹（多重复数弹）
  generateRiceBullets() {
    const bullets = [];
    const baseSpeed = 2.5; // 固定基础速度，保持美感
    const bulletCount = 12 + Math.floor(Math.random() * 4); // 12-15个方向随机（减少密度）
    const angleStep = (Math.PI * 2) / bulletCount;
    const layerCount = 2 + Math.floor(Math.random() * 2); // 2-3层随机（减少密度）
    
    for (let layer = 0; layer < layerCount; layer++) {
      for (let i = 0; i < bulletCount; i++) {
        const angle = i * angleStep + this.rotationAngle + (layer * 0.1); // 每层稍微偏移
        const speed = baseSpeed + layer * 0.5; // 固定每层速度递增，保持美感
        
        const bullet = new EnemyBullet(
          this.x,
          this.y + this.height / 2,
          speed,
          this.gameInstance,
          'large'
        );
        bullet.velocityX = Math.cos(angle) * speed;
        bullet.velocityY = Math.sin(angle) * speed;
        bullet.width = 8 + layer; // 每层大小不同
        bullet.height = 8 + layer;
        bullet.imageType = 'bullet';
        bullet.imageName = 'bullet_02.png';
        bullets.push(bullet);
      }
    }
    
    return bullets;
  }
  
  takeDamage(damage) {
    this.hp -= damage;
  }
  
  canShoot() {
    // 检查是否允许射击
    if (!this.canShootFlag) {
      return false; // 小敌机和特定敌机不射击
    }
    
    // Boss旋转弹幕系统
    if (this.type === 'boss') {
      return this.canBossShoot();
    }
    
    // 经典飞行游戏设计：以飞机威胁为主，子弹威胁很少
    const fireIntervals = {
      small: 9999,    // 小敌机不射击（通过canShootFlag控制）
      // medium: 600, // 中型敌机实际不射击（编队生成时canShootFlag=false）
      large: 480      // 大型敌机悬浮时每8秒射击一次（降低频率，以威胁为主）
    };
    
    // 大型敌机只有在悬浮模式才射击
    if (this.type === 'large' && !this.hoverMode) {
      return false;
    }
    
    const interval = fireIntervals[this.type];
    return this.shootTimer % interval === 0;
  }
  
  shoot() {
    // Boss使用特殊的旋转弹幕生成
    if (this.type === 'boss') {
      return this.generateBossRotationBullets();
    }
    
    // 使用弹幕生成器生成子弹
    const bulletData = this.bulletGenerator.generateForEnemy(
      this.type, 
      this.x, 
      this.y + this.height/2, 
      this.gameInstance.player ? this.gameInstance.player.x : this.x,
      this.gameInstance.player ? this.gameInstance.player.y : this.y + 100
    );
    
    const bullets = [];
    
    // 将弹幕数据转换为EnemyBullet对象
    bulletData.forEach(data => {
      const bullet = new EnemyBullet(
        data.x, 
        data.y, 
        Math.sqrt(data.vx * data.vx + data.vy * data.vy), // 计算速度
        this.gameInstance, 
        this.type
      );
      
      // 设置子弹方向和属性
      bullet.velocityX = data.vx;
      bullet.velocityY = data.vy;
      bullet.width = data.size;
      bullet.height = data.size;
      
      // 设置弹幕属性（简化版本，移除throw特殊处理）
      bullet.imageType = data.imageType || 'bullet';
      bullet.imageName = data.imageName || 'bullet_02.png';
      
      // 设置生命周期（如果有的话）
      if (data.lifeTime) {
        bullet.lifeTime = data.lifeTime;
      }
      
      bullets.push(bullet);
    });
    
    return bullets;
  }
  
  summonMinions() {
    // Boss召唤小兵逻辑
    if (this.gameInstance && this.gameInstance.enemies) {
      const minionCount = 3;
      for (let i = 0; i < minionCount; i++) {
        const offsetX = (i - 1) * 40;
        const minion = new Enemy(
          this.x + offsetX, 
          this.y + this.height/2, 
          'small', 
          this.level, 
          1, 
          'top', 
          this.gameInstance
        );
        this.gameInstance.enemies.push(minion);
      }
    }
  }
  
  updateLargeEnemyBehavior() {
    // 如果还没到达悬浮位置，继续向下飞行
    if (!this.hasReachedHoverPosition) {
      this.y += this.speed;
      
      // 检查是否到达悬浮高度
      if (this.y >= this.hoverTargetY) {
        this.hasReachedHoverPosition = true;
        this.hoverMode = true;
        this.y = this.hoverTargetY;
      }
    } else {
      // 悬浮模式：在屏幕上方左右移动并上下微调
      
      // 左右移动
      this.x += this.hoverDirection * this.hoverSpeed;
      
      // 边界检测，改变方向
      const margin = this.width / 2 + 20;
      if (this.x <= margin || this.x >= this.gameInstance.screenWidth - margin) {
        this.hoverDirection *= -1;
      }
      
      // 上下微调（在悬浮区域内小幅移动）
      const verticalRange = 40; // 上下移动范围
      const verticalSpeed = 0.5;
      const centerY = this.hoverTargetY;
      const oscillation = Math.sin(this.shootTimer * 0.02) * verticalRange;
      this.y = centerY + oscillation * verticalSpeed;
      
      // 确保不离开屏幕上方区域
      this.y = Math.max(80, Math.min(160, this.y));
    }
  }
  
  spawnEnemyMinions() {
    // Boss召唤接口方法
    this.summonMinions();
  }
  
  render(ctx) {
    // 使用图片渲染敌机
    let image = null;
    if (this.gameInstance && this.gameInstance.imageManager) {
      // 使用构造时确定的spriteName，避免每帧都变化
      image = this.gameInstance.imageManager.getEnemyImage(this.type, this.spriteName);
    }
    
    if (image && image.complete) {
      // 图片放大1.5倍
      const scale = 1.5;
      const scaledWidth = this.width * scale;
      const scaledHeight = this.height * scale;
      
      // Boss需要旋转渲染
      if (this.type === 'boss' && this.rotationSpeed > 0) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotationAngle);
        ctx.drawImage(image, 
          -scaledWidth/2, 
          -scaledHeight/2, 
          scaledWidth, 
          scaledHeight
        );
        ctx.restore();
      } else {
        ctx.drawImage(image, 
          this.x - scaledWidth/2, 
          this.y - scaledHeight/2, 
          scaledWidth, 
          scaledHeight
        );
      }
    } else {
      // 延迟渲染：图片未加载完成时不渲染，等下一帧
      return;
    }
    
    // 渲染血量条 - 为所有受伤的敌机显示（与ORIGIN一致）
    if (this.hp < this.maxHp) {
      const barWidth = this.width;
      const healthPercent = this.hp / this.maxHp;
      
      // 背景条（红色）
      ctx.fillStyle = GAME_CONFIG.colors.red;
      ctx.fillRect(this.x - barWidth/2, this.y - this.height/2 - 10, barWidth, 4);
      
      // 前景条（绿色）
      ctx.fillStyle = GAME_CONFIG.colors.green;
      ctx.fillRect(this.x - barWidth/2, this.y - this.height/2 - 10, barWidth * healthPercent, 4);
    }
    
    // 为Boss显示更醒目的血量条
    if (this.type === 'boss') {
      const barWidth = this.width * 1.2;
      const healthPercent = this.hp / this.maxHp;
      
      // Boss血量条背景
      ctx.fillStyle = GAME_CONFIG.colors.blood;
      ctx.fillRect(this.x - barWidth/2, this.y - this.height/2 - 20, barWidth, 8);
      
      // Boss血量条前景
      ctx.fillStyle = healthPercent > 0.6 ? GAME_CONFIG.colors.green : 
                     healthPercent > 0.3 ? GAME_CONFIG.colors.yellow : GAME_CONFIG.colors.red;
      ctx.fillRect(this.x - barWidth/2, this.y - this.height/2 - 20, barWidth * healthPercent, 8);
      
      // Boss血量文字
      ctx.fillStyle = GAME_CONFIG.colors.white;
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`${this.hp}/${this.maxHp}`, this.x, this.y - this.height/2 - 25);
    }
  }
  
  applyFlightPattern() {
    // 应用飞行模式
    if (!this.flightPattern || !this.gameInstance || !this.gameInstance.flightPatternManager) {
      return;
    }
    
    // 使用飞行模式管理器计算新位置
    const newPos = this.gameInstance.flightPatternManager.calculatePosition(
      this.flightPattern, 
      this, 
      this.flightFrameCount
    );
    
    if (newPos) {
      this.x = newPos.x;
      this.y = newPos.y;
    }
  }
  
  weightedRandomChoice(weights) {
    // 权重随机选择算法
    const random = Math.random();
    let cumulativeWeight = 0;
    
    for (let i = 0; i < weights.length; i++) {
      cumulativeWeight += weights[i];
      if (random <= cumulativeWeight) {
        return i;
      }
    }
    return weights.length - 1; // 后备选择
  }
  
    // ===== 新增弹幕模式生成方法 =====
  
  // 处理延迟发射队列
  processDelayedBullets() {
    this.delayedBulletTimer++;
    
    // 检查队列中是否有需要发射的子弹
    for (let i = this.delayedBulletQueue.length - 1; i >= 0; i--) {
      const queueItem = this.delayedBulletQueue[i];
      
      if (this.delayedBulletTimer >= queueItem.fireTime) {
        // 时间到了，发射这一层子弹
        const bullets = queueItem.bulletData;
        bullets.forEach(bulletData => {
          const bullet = new EnemyBullet(
            bulletData.x,
            bulletData.y,
            bulletData.speed,
            this.gameInstance,
            'large'
          );
          bullet.velocityX = bulletData.velocityX;
          bullet.velocityY = bulletData.velocityY;
          bullet.width = bulletData.width;
          bullet.height = bulletData.height;
          bullet.imageType = bulletData.imageType;
          bullet.imageName = bulletData.imageName;
          
          this.gameInstance.enemyBullets.push(bullet);
        });
        
        // 从队列中移除已发射的项
        this.delayedBulletQueue.splice(i, 1);
      }
    }
  }

  // 双向旋转发射（螺旋弹幕）- 先一个方向转，再反方向转
  generateDualDirectionBullets() {
    const bullets = [];
    const speed = 3.5; // 固定速度，保持美感
    
    // 每次调用都发射一发子弹，由shouldFireInCurrentPattern控制频率和方向切换
    const bullet = new EnemyBullet(
      this.x,
      this.y + this.height / 2,
      speed,
      this.gameInstance,
      'large'
    );
    
    bullet.velocityX = Math.cos(this.rotationAngle) * speed;
    bullet.velocityY = Math.sin(this.rotationAngle) * speed;
    bullet.width = 11;
    bullet.height = 11;
    bullet.imageType = 'bullet';
    bullet.imageName = 'bullet_02.png';
    
    bullets.push(bullet);
    
    return bullets;
  }

  // 变速旋转弹幕（波与粒子的境界）
  generateVariableRotationBullets() {
    const bullets = [];
    const speed = 2.0; // 固定速度，保持美感
    const lineCount = 3 + Math.floor(Math.random() * 2); // 3-4条射线随机（减少密度）
    
    for (let line = 0; line < lineCount; line++) {
      const angleOffset = 360 / lineCount; // 动态计算角度间隔
      const baseAngle = line * angleOffset + (this.accelerationPhase * this.rotationSpeed * this.rotationDirection);
      
      // 每条线发射子弹数量随机
      const bulletsPerLine = 3 + Math.floor(Math.random() * 3); // 3-5发随机（减少密度）
      for (let i = 0; i < bulletsPerLine; i++) {
        const angle = baseAngle * Math.PI / 180;
        const randomSpacing = 40 + Math.random() * 20; // 40-60px随机间距（增大间距）
        const distance = 35 + i * randomSpacing; // 固定起始距离，随机间距
        
        const startX = this.x + Math.cos(angle) * distance;
        const startY = this.y + Math.sin(angle) * distance;
        
        const bullet = new EnemyBullet(
          startX,
          startY,
          speed,
          this.gameInstance,
          'boss'
        );
        
        bullet.velocityX = Math.cos(angle) * speed;
        bullet.velocityY = Math.sin(angle) * speed;
        bullet.imageName = this.bulletImageName;
        
        bullets.push(bullet);
      }
    }
    
    return bullets;
  }
  

}

export { Enemy }; 