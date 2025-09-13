// 游戏引擎核心 - 精简核心引擎
import { GAME_CONFIG } from '../config/GameConfig.js';
import { Player } from '../combat/Player.js';
import { Enemy } from '../combat/Enemy.js';
import { PlayerBullet } from '../combat/PlayerBullet.js';
import { EnemyBullet } from '../combat/EnemyBullet.js';
import { TrackingMissile, BomberMissile, Wingman, Bomber, PowerupManager } from '../powerups/PowerupManager.js';
import { Item } from '../powerups/Item.js';
import { EnemySpawner } from '../flight/EnemySpawner.js';
import { FlightPatternManager, CargoPlane } from '../flight/FlightPatternManager.js';
import { BattlePhaseManager } from '../flight/BattlePhaseManager.js';
import { ImageManager } from '../resources/ImageManager.js';
import { BackgroundSystem } from '../resources/BackgroundSystem.js';
import { DataManager } from '../resources/DataManager.js';
import { MenuSystem } from '../ui/MenuSystem.js';
import { ShopSystem } from '../ui/ShopSystem.js';
import { SkillUI, GameUI } from '../ui/GameUI.js';
import { NotificationSystem } from '../ui/NotificationSystem.js';
import { CollisionDetector } from './CollisionDetector.js';
import { InputHandler } from './InputHandler.js';
import { ExplosionEffect } from '../effects/ExplosionEffect.js';
import { DestroyAnimation } from '../effects/DeathAnimation.js';
import { AudioManager } from '../resources/AudioManager.js';
import { ShakeEffect } from '../effects/ShakeEffect.js';

// 游戏引擎
class GameEngine {
  constructor() {
    this.canvas = wx.createCanvas();
    this.ctx = this.canvas.getContext('2d');
    
    const systemInfo = wx.getSystemInfoSync();
    const pixelRatio = systemInfo.pixelRatio || 1;
    
    this.canvas.width = systemInfo.windowWidth * pixelRatio;
    this.canvas.height = systemInfo.windowHeight * pixelRatio;
    
    this.ctx.scale(pixelRatio, pixelRatio);
    
    this.screenWidth = systemInfo.windowWidth;
    this.screenHeight = systemInfo.windowHeight;
    
    this.gameState = 'loading';
    this.killCount = 0;
    this.missionCount = 0;
    this.level = 1;
    this.lastFrameTime = 0;
    this.fps = 60;
    this.lastBossTime = 0; // 上次Boss出现时间
    this.deathCause = null; // 死亡原因（用于高亮显示）
    this.gameTime = 0; // 游戏时间（帧数）
    
    // 任务系统
    this.totalMissions = 0; // 总任务数（5-10随机）
    this.completedMissions = 0; // 已完成任务数
    this.missionSystemEnabled = true; // 任务系统开关
    
    // 击杀进度系统
    this.currentTaskKills = 0; // 当前任务段的击杀数
    
    // 进度条动画系统
    this.realProgress = 0; // 真实进度值
    this.displayProgress = 0; // 当前显示的进度值（用于动画）
    
    // ==> 自动测试AI Hook 开始 (可注释整个块禁用)
    this.autoTestEnabled = false; // 自动测试开关状态
    // <== 自动测试AI Hook 结束
    
    // 画面抖动效果管理器
    this.shakeEffect = new ShakeEffect();

    
    // 保留必要的Boss系统状态（向后兼容）
    this.lastBossTime = 0;
    

    
    this.player = null;
    this.enemies = [];
    this.playerBullets = [];
    this.enemyBullets = [];
    this.items = [];
    this.missiles = [];
    this.wingmen = [];
    this.effects = [];
    this.passengers = []; // 客机数组
    this.cargoPlanes = []; // 货机数组
    
    // 当局轰炸数量（购买的 + 货机掉落的）
    this.sessionBombs = 0;     // 开局0个轰炸，提升难度
    
    // 简化通知系统
    this.currentItem = null;        // 当前道具通知
    this.comboNotification = null;  // 连击通知（带生命周期）
    
    // 游戏开始序列控制
    this.gameStartPhase = 'ready';  // 'ready', 'flying', 'tips', 'battle'
    this.startTimer = 0;
    this.startTips = null;
    
    // 初始化各个系统
    this.background = new BackgroundSystem();
    this.ui = new SkillUI(this);
    this.imageManager = new ImageManager();
    this.dataManager = new DataManager();
    this.audioManager = new AudioManager();
    this.flightPatternManager = new FlightPatternManager();
    
    // 设置音频音量（可选）
    // this.audioManager.setGlobalVolume(0.8);        // 设置全局音量为80%
    // this.audioManager.setMasterVolume(0.9);        // 设置主音量为90%
    // this.audioManager.setVolume('missile', 0.6);   // 设置导弹音效为60%
    // this.audioManager.setVolume('itemCollect', 0.7); // 设置收集道具音效为70%
    
    // 初始化各个管理器
    this.menuSystem = new MenuSystem(this);
    this.shopSystem = new ShopSystem(this);
    this.gameUI = new GameUI(this);
    this.notificationSystem = new NotificationSystem(this);
    this.collisionDetector = new CollisionDetector(this);
    this.inputHandler = new InputHandler(this);
    this.enemySpawner = new EnemySpawner(this);
    this.battlePhaseManager = new BattlePhaseManager(this);
    this.powerupManager = new PowerupManager(this);
    
    // 叛乱系统现在由PowerupManager管理
    
    this.bindEvents();
    this.init();
  }
  
  // 游戏初始化（创建玩家、设置初始状态）
  init() {
    this.player = new Player(this.screenWidth / 2, this.screenHeight - 100, this);
    this.gameState = 'menu'; // 'menu', 'shop', 'playing', 'paused', 'pause_menu', 'dying', 'gameover'
  }
  
  // 绑定事件
  bindEvents() {
    this.inputHandler.bindEvents();
  }

  // 开始新游戏（重置所有状态、重新初始化）
  startGame() {
    this.gameState = 'playing';
    this.killCount = 0;
    this.missionCount = 0;
    this.level = 1;
    this.lastBossTime = 0; // 重置Boss时间
    this.gameStartTime = Date.now(); // 记录游戏开始时间
    this.killsSaved = false; // 重置击杀数保存标志
    
    // 初始化任务系统
    this.totalMissions = Math.floor(Math.random() * 5) + 1; // 随机1-5个任务
    this.completedMissions = 0;
    this.currentTaskKills = 0; // 重置当前任务段击杀数
    
    // 重置进度动画
    this.realProgress = 0;
    this.displayProgress = 0;
    
    // 计算动态比例信息
    const progressPerTask = 1 / this.totalMissions;
    const killContribution = progressPerTask * 0.75;
    const passengerContribution = progressPerTask * 0.25;
    

    
    // 每局开始重置购买状态（道具需要重新购买）
    // 当局道具已在构造函数中初始化为0
    
    this.player = new Player(this.screenWidth / 2, this.screenHeight - 100, this);
    
    // ==> 自动测试AI Hook 开始 (可注释整个块禁用)
    // 同步自动测试状态到玩家
    if (this.player.autoTest) {
      this.player.autoTest.enabled = this.autoTestEnabled;
    }
    // <== 自动测试AI Hook 结束
    
    // 每局开始时，玩家装备重置为基础状态
    this.player.superBombs = this.sessionBombs; // 直接使用统一的轰炸数量
    
    // 重置通知系统
    this.currentItem = null;
    this.comboNotification = null;
    this.notificationSystem = new NotificationSystem(this);
    
    // 重置游戏对象数组
    this.enemies = [];
    this.playerBullets = [];
    this.enemyBullets = [];
    this.items = [];
    this.missiles = [];
    this.wingmen = [];
    this.effects = [];
    this.passengers = []; // 重置客机数组
    this.cargoPlanes = []; // 重置货机数组
    
    // 重置僚机系统
    this.player.wingmenLevel = 0;
    
    // 重置PowerupManager状态（轰炸、导弹等）
    this.powerupManager = new PowerupManager(this);
    
    // 重置背景系统到初始状态
    this.background = new BackgroundSystem();
    
    // 重置战斗阶段管理器
    this.battlePhaseManager = new BattlePhaseManager(this);
    

    

    
    // 重置游戏开始序列 - 直接进入战斗模式
    this.gameStartPhase = 'battle';
    this.startTimer = 0;
    this.startTips = null;
    this.gameTime = 0;
    
    // 游戏开始瞬间就显示操作提示
    this.showStartTips();
  }
  

  
  // 重置游戏到主菜单
  resetGame() {
    this.gameState = 'menu';
    this.deathCause = null;
    
    // 重置任务系统
    this.totalMissions = 0;
    this.completedMissions = 0;
    this.currentTaskKills = 0;
    this.missionSystemEnabled = true;
    
    // 重置进度动画
    this.realProgress = 0;
    this.displayProgress = 0;
    
    // 重置当局轰炸数量
    this.sessionBombs = 0; // 重置为0个，保持难度
    
    // 重置游戏对象数组（确保客机等都被清理）
    this.enemies = [];
    this.playerBullets = [];
    this.enemyBullets = [];
    this.items = [];
    this.missiles = [];
    this.passengers = []; // 重置客机数组
    this.cargoPlanes = []; // 重置货机数组
    this.effects = [];
    
    // 重置BattlePhaseManager的客机任务状态
    if (this.battlePhaseManager) {
      this.battlePhaseManager.resetPassengerMission();
    }
  }
  
  // 开始死亡序列（高亮死亡原因）
  startDeathSequence() {
    // 开始死亡序列，高亮显示死亡原因
    this.gameState = 'dying';
    this.deathTimer = 120; // 2秒的死亡序列
    
    // 立即重置抖动效果，防止Canvas变换矩阵累积导致画面移动
    this.shakeEffect.reset();
  }

  // 开始客机死亡序列（高亮死亡原因）
  startPassengerDeathSequence() {
    // 开始客机死亡序列，高亮显示死亡原因
    this.gameState = 'passenger_dying';
    this.deathTimer = 120; // 2秒的死亡序列
    
    // 立即重置抖动效果，防止Canvas变换矩阵累积导致画面移动
    this.shakeEffect.reset();
  }

  // 显示游戏开始提示
  showStartTips() {
    this.notificationSystem.showStartTips();
  }

  // 添加通知
  addNotification(text) {
    this.notificationSystem.addNotification(text);
  }



  // 生成敌机
  spawnEnemies() {
    this.enemySpawner.spawnEnemies();
  }

  // 生成货机
  spawnCargo() {
    this.spawnCargoPlanes();
  }
  
  // 生成货机
  spawnCargoPlanes() {
    // 只在战斗阶段生成货机
    if (this.gameStartPhase !== 'battle') {
      return;
    }
    
    // 控制货机生成频率
    if (Math.random() < GAME_CONFIG.cargo.spawnRate) {
      // 检查当前屏幕上的货机数量，避免太多
      if (this.cargoPlanes.length < 1) { // 最多同时1架货机
        const cargo = this.flightPatternManager.generateCargo(this);
        this.cargoPlanes.push(cargo);
        
        // 货机生成时立即显示补给通知和播放音效
        this.addNotification('补给来了！');
        this.audioManager.playCargoComingSound();
      }
    }
  }
  
  getAvailableItemTypes() {
    const types = [];
    
    // 生命补给：生命数小于2条时出现（即只有0、1条时才生成）
    if (this.player.lives <= 2) {
      types.push('生命补给');
    }
    
    // 导弹：只有没有导弹时才会生成一个
    if (!this.powerupManager || !this.powerupManager.isMissileModeActive()) {
      types.push('追踪导弹');
    }
    
    // 叛乱：只有没有叛乱时才会生成一个
    if (this.player.superBombs === 0) {
      types.push('轰炸');
    }
    
    // 僚机：只有僚机等级不满时才出现
    if (this.player.wingmenLevel < 6) {
      types.push('战斗僚机');
    }
    
    // 双倍火力道具：经典飞行射击游戏必备，随时可能出现
      types.push('双倍火力');
    
    return types;
  }


  
  // 叛乱道具使用入口 - 委托给PowerupManager
  clearScreen() {
    this.powerupManager.clearScreen();
  }







  // 道具收集处理
  collectItem(item) {
    this.powerupManager.collectItem(item);
  }

  // 在指定位置创建道具（用于货机掉落）
  createItemAt(x, y, type) {
    this.items.push(new Item(x, y, type, this));
  }

  // 删除双击检测（暂停功能改为左下角固定按钮）
  handlePlayerTap(touchX, touchY) {
    // 此方法已不再使用，暂停功能移至左下角固定按钮
    return;
  }
  

  




  // 检查威力提升
  checkLevelUp() {
    const newLevel = Math.floor((this.killCount + this.missionCount * 5) / 20) + 1;
    if (newLevel > this.level) {
      this.level = newLevel;
      this.addNotification(`威力 ${this.level}`);
    }
  }

  // 计算阶梯式击杀进度（权重衰减，无上限）
  calculateKillProgressRatio() {
    if (this.currentTaskKills === 0) return 0;
    
    let totalKillPoints = 0;
    let remainingKills = this.currentTaskKills;
    
    // 阶梯式权重表（每个击杀的点数）
    const killTiers = [
      { maxKills: 20, pointsPerKill: 1.0 },   // 第1-20个：满点数
      { maxKills: 10, pointsPerKill: 0.67 },  // 第21-30个：67%点数
      { maxKills: 10, pointsPerKill: 0.40 },  // 第31-40个：40%点数  
      { maxKills: Infinity, pointsPerKill: 0.20 } // 第41+个：20%点数
    ];
    
    // 按阶梯计算总点数
    for (const tier of killTiers) {
      if (remainingKills <= 0) break;
      
      const killsInThisTier = Math.min(remainingKills, tier.maxKills);
      totalKillPoints += killsInThisTier * tier.pointsPerKill;
      remainingKills -= killsInThisTier;
    }
    
    // 基准点数为20（前20个满点击杀）
    const basePoints = 20;
    
    // 返回击杀比例（可以超过1.0，让击杀持续有效果）
    return totalKillPoints / basePoints;
  }

  // 计算精确的游戏进度（0-1之间）- 动态平衡版本  
  calculateGameProgress() {
    if (!this.missionSystemEnabled || this.totalMissions === 0) {
      return 0;
    }
    
    // 每个任务段占总进度的比例
    const progressPerTask = 1 / this.totalMissions; // 例如：5个任务，每个20%
    
    // 已完成任务的基础进度
    const completedTasksProgress = Math.max(0, this.completedMissions - 1) * progressPerTask;
    
    // 全局累积击杀进度（阶梯式权重，可持续增长）
    const killProgressRatio = this.calculateKillProgressRatio(); // 可以超过1.0
    const baseKillContribution = progressPerTask * 0.75; // 击杀基础贡献75%
    
    // 击杀进度：前20个线性增长，超出部分递减但永不停止
    let globalKillProgress;
    if (killProgressRatio <= 1.0) {
      // 前20个击杀：线性增长到基础值
      globalKillProgress = killProgressRatio * baseKillContribution;
    } else {
      // 超过20个击杀：基础值 + 递减的额外贡献（永远有效果）
      const extraRatio = killProgressRatio - 1.0;
      const diminishingReturns = extraRatio / (1 + extraRatio * 0.5); // 递减公式
      const extraContribution = diminishingReturns * baseKillContribution * 0.5; // 额外贡献最多50%
      globalKillProgress = baseKillContribution + extraContribution;
    }
    
    // 检查是否有活跃客机
    const activePassenger = this.passengers.find(passenger => 
      passenger && !passenger.hasCompletedEscape && !passenger.isDestroyed()
    );
    
    if (activePassenger && typeof activePassenger.getFlightProgress === 'function') {
      // 当前任务完成时应该达到的目标进度
      const targetTotalProgress = this.completedMissions * progressPerTask;
      
      // 当前基础进度（已完成任务 + 击杀进度）
      const currentBaseProgress = completedTasksProgress + globalKillProgress;
      
      // 客机需要补齐的进度（确保任务完成时精确到20%倍数）
      const remainingProgress = Math.max(0, targetTotalProgress - currentBaseProgress);
      
      // 客机进度：飞行进度 × 需要补齐的进度
      const passengerProgress = activePassenger.getFlightProgress() * remainingProgress;
      
      // 调试信息（可以注释掉）

      
      return currentBaseProgress + passengerProgress;
    } else {
      // 没有活跃客机时（任务间隔期）
      return completedTasksProgress + globalKillProgress;
    }
  }
  
  // 更新进度条平滑动画
  updateProgressAnimation() {
    if (!this.missionSystemEnabled) return;
    
    // 获取真实进度值
    this.realProgress = this.calculateGameProgress();
    
    // 计算显示进度值向真实进度值靠拢
    const progressDiff = this.realProgress - this.displayProgress;
    
    if (Math.abs(progressDiff) > 0.0001) { // 如果差距大于0.01%
      // 动画速度：每帧追赶差距的15%（快速但平滑）
      const animationSpeed = 0.15;
      this.displayProgress += progressDiff * animationSpeed;
      
      // 防止过度滚动
      if (Math.abs(this.realProgress - this.displayProgress) < 0.0001) {
        this.displayProgress = this.realProgress;
      }
    } else {
      // 差距很小时直接同步
      this.displayProgress = this.realProgress;
    }
    
    // 限制在0-1之间
    this.displayProgress = Math.min(Math.max(this.displayProgress, 0), 1);
  }

  // 检查任务完成
  checkMissionComplete() {
    if (!this.missionSystemEnabled || this.gameState !== 'playing') return;
    
    // 检查是否完成所有任务
    if (this.completedMissions >= this.totalMissions) {
      this.gameState = 'mission_complete';
    }
  }

  // 计算游戏难度（基于击杀数的对数函数）
  calculateDifficulty() {
    return 1 + Math.log(this.killCount + 1) * 0.4;
  }

  // ==> 自动测试AI Hook 开始 (可注释整个块禁用)
  // 切换自动测试模式
  toggleAutoTest() {
    this.autoTestEnabled = !this.autoTestEnabled;
    if (this.player && this.player.autoTest) {
      this.player.autoTest.enabled = this.autoTestEnabled;
    }
  }
  // <== 自动测试AI Hook 结束

  // 更新游戏开始序列
  updateGameStartSequence() {
    this.notificationSystem.updateGameStartSequence();
  }
  
  // 更新客机（现在由BattlePhaseManager管理）
  updatePassengers() {
    for (let i = this.passengers.length - 1; i >= 0; i--) {
      const passenger = this.passengers[i];
      passenger.update();
      
      // 在客机死亡序列期间不移除客机，确保闪烁效果能正常显示
      if (this.gameState === 'passenger_dying') {
        continue; // 跳过移除逻辑，保留客机用于死亡序列渲染
      }
      
      // 清理已完成逃脱或被击毁的客机
      if (passenger.hasCompletedEscape || passenger.isDestroyed()) {
        this.passengers.splice(i, 1);
      }
    }
  }
  
  // 更新货机
  updateCargoPlanes() {
    for (let i = this.cargoPlanes.length - 1; i >= 0; i--) {
      const cargo = this.cargoPlanes[i];
      cargo.update();
      
      // 清理已完成任务的货机
      if (cargo.hasCompletedEscape) {
        this.cargoPlanes.splice(i, 1);
      }
    }
  }

  // 游戏状态更新（各模块协调更新）
  update() {
    try {
    if (this.gameState === 'dying') {
      // 处理玩家死亡序列
      this.deathTimer--;
      if (this.deathTimer <= 0) {
        this.gameState = 'gameover';
        // 游戏结束时保存击杀数
        if (!this.killsSaved) {
          this.dataManager.addKills(this.killCount);
          this.killsSaved = true;
        }
      }
      return;
    }
    
    if (this.gameState === 'passenger_dying') {
      // 处理客机死亡序列
      this.deathTimer--;
      if (this.deathTimer <= 0) {
        this.gameState = 'passenger_failed';
        // 清理死亡的客机
        for (let i = this.passengers.length - 1; i >= 0; i--) {
          if (this.passengers[i].isDestroyed()) {
            this.passengers.splice(i, 1);
          }
        }
        // 客机死亡，护航任务失败
        this.battlePhaseManager.onPassengerDestroyed();
      }
      return;
    }
    
    if (this.gameState === 'paused' || this.gameState === 'pause_menu' || this.gameState === 'shop' || this.gameState === 'menu') {
      // 暂停状态和菜单状态只更新通知
      this.updateNotifications();
      return;
    }
    
    if (this.gameState !== 'playing') return;
    
    // 游戏开始序列控制
    this.updateGameStartSequence();
    
    // 更新游戏时间和背景
    this.gameTime++;
    this.background.update(this.gameTime, this.player);
    
    // 更新画面抖动效果
    this.shakeEffect.update();
    
    if (this.player) {
      this.player.update();
      
      if (this.player.canShoot()) {
        const bullets = this.player.shoot();
        this.playerBullets.push(...bullets);
        
        // 轰炸模式已由叛乱系统替代
      }
      
      this.wingmen.forEach((wingman, index) => {
        wingman.offsetX = (index === 0) ? -60 : 60;
        wingman.offsetY = 40;
        wingman.update(this.player);
        
        if (wingman.canShoot()) {
          const bullets = wingman.shoot();
          this.playerBullets.push(...bullets);
        }
      });
    }
    
    // 生成敌机和道具 (场景切换期间暂停)
    if (!this.background.isSceneTransitioning()) {
    this.spawnEnemies();
    this.spawnCargo();
          }
    
    // 更新敌机
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      enemy.update();
      
      if (enemy.y > this.screenHeight + 50) {
        this.enemies.splice(i, 1);
        continue;
      }
      
      // 所有敌机都可以射击 - 让战斗更激烈
      if (enemy.canShoot()) {
        const bullets = enemy.shoot();
        this.enemyBullets.push(...bullets);
      }
    }
    
    // 更新客机
    this.updatePassengers();
    
    // 更新货机
    this.updateCargoPlanes();
    
    // 更新所有子弹
    this.updateBullets();
    this.updateMissiles();
    this.updateItems();
    this.updateEffects();
    this.updateNotifications();
    
    // 更新轰炸系统
    this.powerupManager.updateBombingSystem();
    

    
    // 更新战斗阶段管理器（统一管理所有战斗逻辑）
    this.battlePhaseManager.update();
    
    this.checkCollisions();
    this.checkLevelUp();
    this.checkMissionComplete();
    
    // 更新进度条平滑动画
    this.updateProgressAnimation();
    } catch (error) {
      console.error('游戏更新错误:', error);
    }
  }

  // 更新所有子弹（玩家和敌机）
  updateBullets() {
    for (let i = this.playerBullets.length - 1; i >= 0; i--) {
      this.playerBullets[i].update();
      if (this.playerBullets[i].y < -10) {
        this.playerBullets.splice(i, 1);
      }
    }
    
    for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
      this.enemyBullets[i].update();
      
      // 检查子弹是否需要销毁（生命周期结束或超出边界）
      if (this.enemyBullets[i].shouldDestroy || 
          this.enemyBullets[i].y > this.screenHeight + 10 ||
          this.enemyBullets[i].x < -50 || 
          this.enemyBullets[i].x > this.screenWidth + 50) {
        this.enemyBullets.splice(i, 1);
      }
    }
  }
  
  // 更新所有导弹
  updateMissiles() {
    // 更新导弹模式
    if (this.powerupManager) {
      this.powerupManager.updateMissileMode();
    }
    
    for (let i = this.missiles.length - 1; i >= 0; i--) {
      this.missiles[i].update(this.enemies);
      
      // 检查导弹是否超出边界或存活时间结束
      if (this.missiles[i].y < -50 || this.missiles[i].y > this.screenHeight + 50 ||
          this.missiles[i].x < -50 || this.missiles[i].x > this.screenWidth + 50 ||
          this.missiles[i].life <= 0) {
        this.missiles.splice(i, 1);
      }
    }
  }
  
  // 更新所有道具
  updateItems() {
    for (let i = this.items.length - 1; i >= 0; i--) {
      this.items[i].update();
      if (this.items[i].y > this.screenHeight + 50) {
        this.items.splice(i, 1);
      }
    }
  }
  

  
  // 更新所有视觉效果
  updateEffects() {
    for (let i = this.effects.length - 1; i >= 0; i--) {
      this.effects[i].update();
      if (this.effects[i].life <= 0) {
        this.effects.splice(i, 1);
      }
    }
  }

  // 更新通知
  updateNotifications() {
    this.notificationSystem.updateNotifications();
  }

  // 碰撞检测
  checkCollisions() {
    this.collisionDetector.checkCollisions();
  }

  // 渲染游戏场景（供暂停时使用）
  renderGame() {
    this.gameUI.renderGame();
  }

  // 渲染通知
  renderNotifications() {
    this.notificationSystem.renderNotifications();
  }

  // 轰炸机渲染（委托给PowerupManager）
  renderBombers() {
    this.powerupManager.renderBombers(this.ctx);
  }

  // 游戏渲染（状态分发、界面协调）
  render() {
    this.ctx.fillStyle = '#000020';
    this.ctx.fillRect(0, 0, this.screenWidth, this.screenHeight);
    
    // 应用画面抖动效果
    this.ctx.save();
    this.shakeEffect.applyToContext(this.ctx);
    
    this.background.render(this.ctx);
    
    if (this.gameState === 'menu') {
      this.menuSystem.renderMenu();
      // 恢复Canvas上下文（确保变换矩阵正确恢复）
      this.ctx.restore();
      return;
    }
    
    if (this.gameState === 'shop') {
      this.shopSystem.renderShop();
      // 在商店页面也需要渲染通知
      this.renderNotifications();
      // 恢复Canvas上下文（确保变换矩阵正确恢复）
      this.ctx.restore();
      return;
    }
    
    if (this.gameState === 'paused') {
      this.menuSystem.renderPaused();
      // 恢复Canvas上下文（确保变换矩阵正确恢复）
      this.ctx.restore();
      return;
    }
    
    if (this.gameState === 'pause_menu') {
      this.menuSystem.renderPauseMenu();
      // 恢复Canvas上下文（确保变换矩阵正确恢复）
      this.ctx.restore();
      return;
    }
    
    if (this.gameState === 'dying') {
      this.gameUI.renderDying();
      // 恢复Canvas上下文（确保变换矩阵正确恢复）
      this.ctx.restore();
      return;
    }
    
    if (this.gameState === 'passenger_dying') {
      this.gameUI.renderPassengerDying();
      // 恢复Canvas上下文（确保变换矩阵正确恢复）- 修复客机死亡时画面跟随移动的bug
      this.ctx.restore();
      return;
    }
    
    if (this.gameState === 'gameover') {
      this.menuSystem.renderGameOver();
      // 恢复Canvas上下文（确保变换矩阵正确恢复）
      this.ctx.restore();
      return;
    }
    
    if (this.gameState === 'mission_complete') {
      this.menuSystem.renderMissionComplete();
      // 恢复Canvas上下文（确保变换矩阵正确恢复）
      this.ctx.restore();
      return;
    }
    
    if (this.gameState === 'passenger_failed') {
      this.menuSystem.renderPassengerFailed();
      // 恢复Canvas上下文（确保变换矩阵正确恢复）
      this.ctx.restore();
      return;
    }
    
    // 渲染游戏场景
    this.renderGame();
    this.renderBombers();

    this.ui.render(this.ctx);
    
    // 恢复Canvas上下文（结束抖动变换）
    this.ctx.restore();
  }

  // 主游戏循环（FPS控制、错误处理）
  loop() {
    try {
    const currentTime = Date.now();
    const deltaTime = currentTime - this.lastFrameTime;
    
    if (deltaTime >= 1000 / this.fps) {
      this.update();
      this.render();
      this.lastFrameTime = currentTime;
    }
    
    requestAnimationFrame(() => this.loop());
    } catch (error) {
      console.error('游戏循环错误:', error);
      // 如果出现错误，尝试重新启动游戏循环
      setTimeout(() => this.loop(), 1000);
    }
  }

  // 销毁游戏资源
  destroy() {
    // 销毁音频资源
    if (this.audioManager) {
      this.audioManager.destroy();
    }
  }
}

export { GameEngine }; 