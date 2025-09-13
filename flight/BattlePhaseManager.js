// 风暴之书 - 战斗阶段管理器模块

import { Enemy } from '../combat/Enemy.js';

// 战斗阶段管理器 - 统一管理战斗节奏
class BattlePhaseManager {
  constructor(gameInstance) {
    this.gameInstance = gameInstance;
    
    // 战斗阶段系统
    this.battlePhase = 'warmup'; // 'warmup' | 'intense' | 'rest' | 'passenger' | 'passenger_end' | 'boss'
    this.phaseTimer = 0;
    this.phaseStartTime = Date.now();
    this.hasCompletedWarmup = false; // 热身期只出现一次的标志
    
    // 客机任务结束状态
    this.passengerEndReason = ''; // 'escaped' | 'destroyed'
    
    // 阶段配置
    this.phaseConfig = {
      warmup: { duration: 5 }, // 5秒热身期（只在游戏开始时）
      intense: { largeEnemyCount: 0, targetCount: 0 }, // 高强度期（动态）
      rest: { duration: 0 }, // 休息期（随机1-3秒）
      passenger: { duration: 0 }, // 客机任务期（客机生命周期，随机10-20秒）
      boss: { active: false } // Boss阶段（动态时长）
    };
    
    // 客机任务状态
    this.passengerMission = {
      active: false,
      passenger: null,
      startTime: 0
    };
    
    // Boss系统
    this.bossSystem = {
      lastBossTime: 0,
      warningActive: false,
      bossActive: false
    };
  }
  
  // 主要更新方法 - 统一管理所有战斗阶段
  update() {
    this.phaseTimer++;
    
    // 根据当前阶段执行相应逻辑
    switch (this.battlePhase) {
      case 'warmup':
        this.updateWarmupPhase();
        break;
      case 'intense':
        this.updateIntensePhase();
        break;
      case 'rest':
        this.updateRestPhase();
        break;
      case 'passenger':
        this.updatePassengerPhase();
        break;
      case 'passenger_end':
        this.updatePassengerEndPhase();
        break;
      case 'boss':
        this.updateBossPhase();
        break;
    }
  }
  
  // 热身期更新
  updateWarmupPhase() {
    const elapsed = this.phaseTimer / 60; // 转换为秒
    
    if (elapsed >= this.phaseConfig.warmup.duration) {
      this.hasCompletedWarmup = true; // 标记热身期已完成
      this.startIntensePhase();
    }
  }
  
  // 开始高强度期
  startIntensePhase() {
    this.battlePhase = 'intense';
    this.phaseTimer = 0;
    this.phaseStartTime = Date.now();
    
    // 随机决定大型敌机数量（2-12架）
    const targetCount = 2 + Math.floor(Math.random() * 11);
    this.phaseConfig.intense.targetCount = targetCount;
    this.phaseConfig.intense.largeEnemyCount = 0;
    
    // 无尽模式下不显示通知
    if (this.gameInstance.missionSystemEnabled) {
      this.gameInstance.addNotification('怪兽出现！');
    }
  }
  
  // 高强度期更新
  updateIntensePhase() {
    // 检查是否需要生成大型敌机
    const { largeEnemyCount, targetCount } = this.phaseConfig.intense;
    
    if (largeEnemyCount < targetCount) {
      // 每1-3秒生成一架大型敌机
      const shouldSpawn = Math.random() < 0.02; // 2%概率，平均1.5秒
      if (shouldSpawn) {
        this.gameInstance.enemySpawner.spawnLargeEnemy();
        this.phaseConfig.intense.largeEnemyCount++;
      }
    }
    
    // 检查是否所有大型敌机都被清理
    if (largeEnemyCount >= targetCount) {
      const hasLargeEnemies = this.gameInstance.enemies.some(e => e.type === 'large');
      if (!hasLargeEnemies) {
        this.startBossPhase();
      }
    }
  }
  
  // 开始休息期
  startRestPhase() {
    this.battlePhase = 'rest';
    this.phaseTimer = 0;
    this.phaseStartTime = Date.now();
    
    // 随机休息时间：1-3秒
    this.phaseConfig.rest.duration = 1 + Math.random() * 2;
    
    this.gameInstance.addNotification('休息时间');
  }
  
  // 休息期更新
  updateRestPhase() {
    const elapsed = this.phaseTimer / 60; // 转换为秒
    
    if (elapsed >= this.phaseConfig.rest.duration) {
      this.startIntensePhase(); // 休息期结束后进入高强度期，形成循环
    }
  }
  
  // 开始客机任务期
  startPassengerPhase() {
    this.battlePhase = 'passenger';
    this.phaseTimer = 0;
    this.phaseStartTime = Date.now();
    
    // 生成客机
    this.spawnPassenger();
    
    // 无尽模式下不显示通知
    if (this.gameInstance.missionSystemEnabled) {
      this.gameInstance.addNotification('民航客机进入危险区域');
    }
  }
  
  // 客机任务期更新
  updatePassengerPhase() {
    // 更新客机任务
    this.updatePassengerMission();
    
    // 立即检查客机任务是否完成（客机离开屏幕或被击毁）
    // 这个检查必须在updatePassengerMission之后立即执行，确保状态变化立即生效
    if (!this.passengerMission.active) {
      return; // 任务完成，立即返回，不再执行后续逻辑（已经通过startPassengerEndPhase处理）
    }
    
    // 生成少量敌机干扰过境（增加护航难度）
    if (Math.random() < 0.012) { // 稍微提高生成概率，增加挑战
      const enemyType = Math.random() < 0.7 ? 'small' : 'medium';
      this.gameInstance.enemySpawner.spawnSingleEnemy(enemyType);
    }
  }
  

  
  // 开始客机任务结束过渡阶段
  startPassengerEndPhase(reason) {
    this.battlePhase = 'passenger_end';
    this.phaseTimer = 0;
    this.phaseStartTime = Date.now();
    this.passengerEndReason = reason;
    
    // 立即重置客机任务状态
    this.resetPassengerMission();
  }
  
  // 客机任务结束过渡阶段更新
  updatePassengerEndPhase() {
    // 立即进入休息期
    this.startRestPhase();
  }
  
  // 生成客机（使用现有的FlightPatternManager）
  spawnPassenger() {
    // 无尽模式下不生成客机
    if (!this.gameInstance.missionSystemEnabled) return;
    
    if (this.passengerMission.active) return;
    
    const passenger = this.gameInstance.flightPatternManager.generatePassenger(this.gameInstance);
    
    // 确保游戏实例有passengers数组
    if (!this.gameInstance.passengers) {
      this.gameInstance.passengers = [];
    }
    
    this.gameInstance.passengers.push(passenger);
    
    // 更新任务状态
    this.passengerMission.active = true;
    this.passengerMission.passenger = passenger;
    this.passengerMission.startTime = Date.now();
    
    // 任务系统：客机出现时开始任务，但不算完成（等待客机安全逃脱）
  }
  
  // 更新客机任务
  updatePassengerMission() {
    if (!this.passengerMission.active || !this.passengerMission.passenger) return;
    
    const passenger = this.passengerMission.passenger;
    
    // 检查客机状态 - 优先检查逃脱状态，然后检查击毁状态
    if (passenger.hasCompletedEscape) {
      this.onPassengerEscaped();
    } else if (passenger.isDestroyed()) {
      this.onPassengerDestroyed();
    }
  }
  
  // 客机被击毁
  onPassengerDestroyed() {
    this.gameInstance.addNotification('客机坠毁');
    
    // 注意：游戏状态已在死亡序列中设置，这里只做最终处理
  }
  
  // 客机安全逃脱
  onPassengerEscaped() {
    this.gameInstance.addNotification('客机已远离危险区');
    
    // 增加拯救计数
    this.gameInstance.dataManager.addRescue();
    
    // 任务完成，增加任务计数（用于显示）
    this.gameInstance.missionCount++;
    
    // 任务系统：客机成功逃脱时才算任务真正完成
    if (this.gameInstance.missionSystemEnabled) {
      this.gameInstance.completedMissions++;
    }
    
    // 进入客机任务结束过渡阶段
    this.startPassengerEndPhase('escaped');
  }
  

  
  // 重置客机任务
  resetPassengerMission() {
    this.passengerMission.active = false;
    this.passengerMission.passenger = null;
    this.passengerMission.startTime = 0;
  }
  

  
  // 开始Boss阶段
  startBossPhase() {
    this.battlePhase = 'boss';
    this.phaseTimer = 0;
    this.phaseStartTime = Date.now();
    this.bossSystem.warningActive = true;
    this.bossSystem.bossActive = true;
    
    // 无尽模式下不显示通知
    if (this.gameInstance.missionSystemEnabled) {
      this.gameInstance.addNotification('BOSS即将出现');
      this.gameInstance.addNotification('正在清理战场...');
    }
  }
  
  // Boss阶段更新
  updateBossPhase() {
    // 如果还在预警阶段，等待敌机清场
    if (this.bossSystem.warningActive) {
      const nonBossEnemyCount = this.gameInstance.enemies.filter(e => e.type !== 'boss').length;
      
      // 所有非Boss敌机都清理完毕后生成Boss
      if (nonBossEnemyCount === 0) {
        this.spawnBoss();
      }
    } else {
      // Boss已生成，检查Boss是否还活着
      const hasBoss = this.gameInstance.enemies.some(e => e.type === 'boss');
      if (!hasBoss && this.phaseConfig.boss.active) {
        this.onBossDefeated();
      }
    }
  }
  
  // 生成Boss
  spawnBoss() {
    const boss = new Enemy(
      this.gameInstance.screenWidth / 2, 
      -150, 
      'boss', 
      this.gameInstance.level, 
      1, 
      'top', 
      this.gameInstance
    );
    boss.shootTimer = Math.floor(Math.random() * 30);
    
    this.gameInstance.enemies.push(boss);
    
    // Boss生成完毕
    this.bossSystem.warningActive = false;
    this.phaseConfig.boss.active = true;
    this.bossSystem.lastBossTime = Date.now();
    
    this.gameInstance.addNotification('BOSS出现');
    this.gameInstance.addNotification('准备战斗！');
  }
  
  // Boss死亡后重置系统
  onBossDefeated() {
    this.bossSystem.bossActive = false;
    this.phaseConfig.boss.active = false;
    
    // 无尽模式下不显示通知
    if (this.gameInstance.missionSystemEnabled) {
      this.gameInstance.addNotification('Boss被击败！');
    }
    
    // 根据游戏模式决定下一阶段
    if (this.gameInstance.missionSystemEnabled) {
      // 任务模式：Boss被击败后进入客机任务
      this.startPassengerPhase();
    } else {
      // 无尽模式：Boss被击败后直接进入休息期
      this.startRestPhase();
    }
  }
  
  // 获取当前阶段信息
  getCurrentPhaseInfo() {
    const elapsed = this.phaseTimer / 60;
    let duration = 0;
    
    switch (this.battlePhase) {
      case 'warmup':
        duration = this.phaseConfig.warmup.duration;
        break;
      case 'rest':
        duration = Math.round(this.phaseConfig.rest.duration);
        break;
      case 'passenger':
        if (this.passengerMission.active && this.passengerMission.passenger) {
          const passenger = this.passengerMission.passenger;
          const flightTime = Math.round(passenger.flightTimer / 60);
          const estimatedTime = passenger.estimatedFlightTime;
          return {
            phase: this.battlePhase,
            elapsed: Math.round(elapsed),
            duration: `预计${estimatedTime}秒`,
            progress: `飞行中 ${flightTime}/${estimatedTime}秒`
          };
        } else {
          duration = '等待任务';
        }
        break;
      case 'passenger_end':
                  const statusText = this.passengerEndReason === 'escaped' ? '客机安全离开' : '客机任务失败';
        return {
          phase: this.battlePhase,
          elapsed: Math.round(elapsed),
          duration: '护航结束',
          progress: `${statusText}，任务结束`
        };
      case 'boss':
        if (this.bossSystem.warningActive) {
          return {
            phase: this.battlePhase,
            elapsed: Math.round(elapsed),
            duration: '清理战场',
            progress: '准备Boss战斗'
          };
        } else {
          return {
            phase: this.battlePhase,
            elapsed: Math.round(elapsed),
            duration: 'Boss战斗',
            progress: 'Boss战斗进行中'
          };
        }
      case 'intense':
        const { largeEnemyCount, targetCount } = this.phaseConfig.intense;
        return {
          phase: this.battlePhase,
          elapsed: Math.round(elapsed),
          duration: '动态',
          progress: `${largeEnemyCount}/${targetCount}架大型敌机`
        };
    }
    
    return {
      phase: this.battlePhase,
      elapsed: Math.round(elapsed),
      duration: duration,
      progress: duration === '动态' || typeof duration === 'string' ? duration : `${Math.round(elapsed)}/${duration}秒`
    };
  }
  
  // 检查当前阶段是否允许生成敌机
  canSpawnEnemies() {
    switch (this.battlePhase) {
      case 'warmup':
        return true; // 热身期生成小/中型敌机
      case 'intense':
        return true; // 高强度期生成所有类型敌机
      case 'rest':
        return false; // 休息期不生成新敌机
      case 'passenger':
        return true; // 客机任务期生成少量炮灰机
      case 'boss':
        return false; // Boss阶段不生成其他敌机（Boss会召唤小兵）
      default:
        return false;
    }
  }
  
  // 获取当前阶段允许的敌机类型
  getAllowedEnemyTypes() {
    switch (this.battlePhase) {
      case 'warmup':
        return ['small', 'medium'];
      case 'intense':
        return ['small', 'medium', 'large'];
      case 'passenger':
        return ['small', 'medium']; // 只生成炮灰机
      case 'boss':
        return []; // Boss阶段不生成其他敌机
      default:
        return [];
    }
  }
}

// 导出类
export { BattlePhaseManager }; 