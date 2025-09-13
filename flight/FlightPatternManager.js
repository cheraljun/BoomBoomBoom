// 风暴之书 - 飞行模式管理器模块

import { Enemy } from '../combat/Enemy.js';

// 客机类 - 过境保护任务版本
class Passenger {
  constructor(startX, startY, targetX, targetY, gameInstance = null) {
    this.gameInstance = gameInstance;
    
    // 客机基本属性
    this.width = 60;
    this.height = 80;
    this.speed = 2.0; // 提高速度，快速通过战区
    this.health = 100; // 客机血量
    this.maxHealth = 100;
    
    // 过境飞行设置
    this.startX = startX;
    this.startY = startY;
    this.targetX = targetX;
    this.targetY = targetY;
    this.x = startX;
    this.y = startY;
    
    // 计算直线飞行方向和距离
    const dx = targetX - startX;
    const dy = targetY - startY;
    this.totalDistance = Math.sqrt(dx * dx + dy * dy);
    this.direction = Math.atan2(dy, dx);
    
    // 速度向量
    this.vx = Math.cos(this.direction) * this.speed;
    this.vy = Math.sin(this.direction) * this.speed;
    
    // 飞行状态
    this.flightTimer = 0;
    this.hasCompletedEscape = false;
    
    // 维修系统
    this.repairState = 'flying'; // 'flying' | 'repairing' | 'repaired'
    this.repairPoints = this.generateRepairPoints(); // 生成维修点
    this.currentRepairIndex = 0; // 当前维修点索引
    this.repairTimer = 0; // 当前维修点计时器
    this.currentRepairPoint = null; // 当前维修点对象
    
    // 重新计算总任务时间（包含维修时间）
    this.estimatedFlightTime = this.calculateTotalMissionTime();
    
    // 随机选择客机图片（1-3）
    this.spriteIndex = Math.floor(Math.random() * 3) + 1;
  }

  update() {
    // 检查是否已经完成逃脱或被击毁，停止所有更新
    if (this.hasCompletedEscape || this.isDestroyed()) {
      return; // 客机生命周期结束，停止所有更新
    }
    
    // 飞行时间记录
    this.flightTimer++;
    
    // 根据当前状态执行不同逻辑
    if (this.repairState === 'repairing') {
      this.updateRepairing();
    } else {
      this.updateFlying();
    }
  }
  
    // 更新飞行状态
  updateFlying() {
    // 继续原来的直线飞行
    this.x += this.vx;
    this.y += this.vy;
    
    // 检查是否需要触发维修
    if (this.currentRepairIndex < this.repairPoints.length) {
      const repairPoint = this.repairPoints[this.currentRepairIndex];
      if (!repairPoint.triggered && this.shouldTriggerRepair(repairPoint)) {
        this.startRepair(repairPoint);
        return;
      }
    }
    
    // 检查是否到达最终目标点或飞出屏幕
    if (this.hasReachedTarget() || this.hasExitedScreen()) {
      this.hasCompletedEscape = true;
    }
  }
  
  // 更新维修状态
  updateRepairing() {
    this.repairTimer++;
    

    
    // 检查维修是否完成
    if (this.repairTimer >= this.currentRepairPoint.duration * 60) { // 转换为帧数(60fps)
      this.completeRepair();
    }
  }

  // 检查是否到达目标点
  hasReachedTarget() {
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const distanceToTarget = Math.sqrt(dx * dx + dy * dy);
    
    // 如果距离目标点很近，认为已到达
    return distanceToTarget < 50;
  }


  
  takeDamage(damage) {
    this.health -= damage;
    if (this.health <= 0) {
      this.health = 0;
      // 客机被击毁的逻辑可以在这里添加
    }
  }
  
  isDestroyed() {
    return this.health <= 0;
  }
  
  hasExitedScreen() {
    const screenWidth = this.gameInstance ? this.gameInstance.screenWidth : 800;
    const screenHeight = this.gameInstance ? this.gameInstance.screenHeight : 600;
    
    return this.x < -100 || this.x > screenWidth + 100 || 
           this.y < -100 || this.y > screenHeight + 100;
  }
  
  render(ctx) {
    // 尝试使用图片渲染客机
    let image = null;
    if (this.gameInstance && this.gameInstance.imageManager) {
      image = this.gameInstance.imageManager.getPassengerImage(this.spriteIndex);
    }
    
    ctx.save();
    
    // 计算客机朝向角度（类似导弹）
    const angle = Math.atan2(this.vy, this.vx) + Math.PI / 2;
    
    ctx.translate(this.x, this.y);
    ctx.rotate(angle);
    
    if (image && image.complete) {
      // 使用图片渲染客机（原图大小）
      const scale = 1.0; // 按照原图大小显示
      const scaledWidth = this.width * scale;
      const scaledHeight = this.height * scale;
      
      ctx.drawImage(image, 
        -scaledWidth/2, 
        -scaledHeight/2, 
        scaledWidth, 
        scaledHeight
      );
    } else {
      // 后备渲染：明显的客机轮廓（增强可见性）
      // 主体 - 亮黄色，更容易看到
      ctx.fillStyle = '#FFD700';
      ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
      
      // 添加客机标识 - 蓝色
      ctx.fillStyle = '#4169E1';
      ctx.fillRect(-this.width/4, -this.height/3, this.width/2, this.height/6);
      
      // 机翼 - 银色
      ctx.fillStyle = '#C0C0C0';
      ctx.fillRect(-this.width/2 - 10, -this.height/6, 20, this.height/3);
      ctx.fillRect(this.width/2 - 10, -this.height/6, 20, this.height/3);
      
      // 添加白色边框增强可见性
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.strokeRect(-this.width/2, -this.height/2, this.width, this.height);
      
      // 添加"客机"文字标识
      ctx.fillStyle = '#000000';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('客机', 0, 5);
    }
    
    // 绘制血量条（只在受到攻击时显示）
    if (this.health < this.maxHealth) {
      // 血条背景（红色）
      ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
      ctx.fillRect(-this.width/2, -this.height/2 - 15, this.width, 5);
      
      // 血条前景（绿色，根据血量比例）
      ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
      const healthWidth = (this.health / this.maxHealth) * this.width;
      ctx.fillRect(-this.width/2, -this.height/2 - 15, healthWidth, 5);
      
      // 血条边框（白色）
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.lineWidth = 1;
      ctx.strokeRect(-this.width/2, -this.height/2 - 15, this.width, 5);
    }
    
    ctx.restore();
    
    // 绘制维修状态（在恢复坐标系后绘制，避免旋转影响）
    this.renderRepairStatus(ctx);
  }
  
  // 绘制维修状态和进度条
  renderRepairStatus(ctx) {
    ctx.save();
    
    // 维修进度条（只在维修时显示）
    if (this.repairState === 'repairing' && this.currentRepairPoint) {
      this.renderRepairBar(ctx);
    }
    
    ctx.restore();
  }
  
  // 绘制维修进度条
  renderRepairBar(ctx) {
    const barWidth = 80;
    const barHeight = 8;
    const x = this.x - barWidth/2;
    const y = this.y - this.height/2 - 25; // 在客机上方显示
    
    // 背景条（深灰色）
    ctx.fillStyle = '#333333';
    ctx.fillRect(x, y, barWidth, barHeight);
    
    // 维修进度条（蓝色渐变）
    const progress = this.repairTimer / (this.currentRepairPoint.duration * 60);
    const progressWidth = barWidth * progress;
    
    // 蓝色渐变效果
    const gradient = ctx.createLinearGradient(x, y, x + progressWidth, y);
    gradient.addColorStop(0, '#4A90E2');    // 浅蓝
    gradient.addColorStop(1, '#357ABD');    // 深蓝
    
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, progressWidth, barHeight);
    
    // 白色边框
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, barWidth, barHeight);
    
    // 维修状态文字和倒计时
    const remainingTime = Math.ceil(this.currentRepairPoint.duration - this.repairTimer / 60);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`维修中... ${remainingTime}秒`, this.x, y - 5);
    
    // 维修进度百分比
    ctx.font = '10px Arial';
    ctx.fillText(`${Math.round(progress * 100)}%`, this.x, y + barHeight + 15);
  }
  
  // ===== 维修系统相关方法 =====
  
  // 生成维修点
  generateRepairPoints() {
    const repairPoints = [];
    
    // 只设置一个维修点，在飞行路线的50%位置触发
    const progress = 0.4 + Math.random() * 0.2; // 40%-60%位置随机
    
    repairPoints.push({
      progress: progress, // 记录飞行进度而不是具体坐标
      duration: 15 + Math.random() * 10, // 15-25秒随机维修时间
      triggered: false // 是否已经触发
    });
    
    return repairPoints;
  }
  

  
  // 计算总任务时间（包含维修时间）
  calculateTotalMissionTime() {
    const flightTime = this.totalDistance / this.speed / 60; // 飞行时间（秒）
    const repairTime = this.repairPoints.reduce((total, point) => total + point.duration, 0); // 总维修时间（秒）
    const totalTime = flightTime + repairTime;
    
    return Math.round(totalTime);
  }
  
  // 计算当前飞行进度（0-1之间）
  getFlightProgress() {
    // 计算从起点到当前位置的距离
    const currentDistance = Math.sqrt(
      Math.pow(this.x - this.startX, 2) + 
      Math.pow(this.y - this.startY, 2)
    );
    // 返回飞行进度（0-1之间）
    return Math.min(currentDistance / this.totalDistance, 1.0);
  }

  // 检查是否应该触发维修
  shouldTriggerRepair(repairPoint) {
    // 使用统一的飞行进度计算方法
    const currentProgress = this.getFlightProgress();
    
    // 如果飞行进度达到维修点进度，触发维修
    return currentProgress >= repairPoint.progress;
  }
  
  // 开始维修
  startRepair(repairPoint) {
    this.repairState = 'repairing';
    this.currentRepairPoint = repairPoint;
    this.repairTimer = 0;
    repairPoint.triggered = true; // 标记为已触发
    
    // 不改变位置，客机在当前位置停下维修
  }
  
  // 完成维修
  completeRepair() {
    this.repairState = 'flying';
    this.currentRepairIndex++;
    this.repairTimer = 0;
    this.currentRepairPoint = null;
  }
}

// 飞行模式管理器
class FlightPatternManager {
  constructor() {
    this.patterns = {
      // 小敌机飞行模式（不射击）- 禁止斜飞，只要垂直/水平/弧形
      small: [
        'straight',        // 直线下降
        'side_arc',        // 侧边弧形进入
        'horizontal_sweep', // 水平横扫
        'lshape'          // L型转弯（水平→垂直）
      ],
      // 编队模式
      formation: [
        'line',         // 直线编队
        'vformation',   // V字编队
        'diamond',      // 菱形编队
        'circle'        // 圆形编队
      ]
    };
  }
  
  getRandomPattern(type) {
    const patterns = this.patterns[type] || this.patterns.small;
    return patterns[Math.floor(Math.random() * patterns.length)];
  }
  
  // 计算飞行路径上的位置 - 军事化直线飞行设计（禁止斜向飞行）
  calculatePosition(pattern, enemy, frameCount) {
    const currentX = enemy.x;
    const currentY = enemy.y;
    
    switch (pattern) {
      case 'straight':
        // 标准直线下降
        return {
          x: currentX,
          y: currentY + enemy.speed
        };
        
      case 'side_arc':
        // 弧形进入 - 完全避免斜飞，分阶段：水平→垂直
        if (frameCount < 60) {
          // 第一阶段：纯水平轻微摆动，不向下移动
          const arcProgress = frameCount / 60;
          const arcX = Math.sin(arcProgress * Math.PI * 2) * 2; // 减小摆动幅度
          return {
            x: currentX + arcX * (enemy.arcDirection || 1),
            y: currentY // 完全不向下移动
          };
        } else {
          // 第二阶段：纯垂直直线下降
          return {
            x: currentX,
            y: currentY + enemy.speed
          };
        }
        
      case 'horizontal_sweep':
        // 水平横扫 - 纯水平移动后纯垂直下降
        if (frameCount < 100) {
          // 前1.7秒纯水平移动，不向下
          return {
            x: currentX + (enemy.sweepDirection || 1) * enemy.speed,
            y: currentY // 完全不向下移动
          };
        } else {
          // 后面纯垂直下降
          return {
            x: currentX,
            y: currentY + enemy.speed
          };
        }
        
      case 'lshape':
        if (frameCount < 80) {
          // 第一阶段：纯水平移动，不向下
          return {
            x: currentX + (enemy.lDirection || 1) * enemy.speed,
            y: currentY // 完全不向下移动
          };
        } else {
          // 第二阶段：纯垂直下降
          return {
            x: currentX,
            y: currentY + enemy.speed
          };
        }
        
      default:
        // 默认直线飞行
        return { 
          x: currentX, 
          y: currentY + enemy.speed 
        };
    }
  }
  
  // 生成编队 - 雷电战机风格，所有飞机同步移动，强化重叠检测
  generateFormation(type, centerX, centerY, count, enemyType, level, playerPower, gameInstance, flightPattern = null) {
    const enemies = [];
    
      // 强化编队重叠检测：检查是否与现有敌机重叠
  const checkFormationOverlap = (testX, testY, enemyType) => {
    // 根据敌机类型设置不同的安全距离
    const safeDistance = enemyType === 'small' ? 100 : enemyType === 'medium' ? 120 : 150;
    
      return gameInstance.enemies.some(existingEnemy => {
        const dx = existingEnemy.x - testX;
        const dy = existingEnemy.y - testY;
      return Math.sqrt(dx * dx + dy * dy) < safeDistance;
      });
    };
    
  // 尝试找到不重叠的位置 - 增加尝试次数
    let attempts = 0;
    let finalCenterX = centerX;
    let finalCenterY = centerY;
    
  // 确保生成在安全区域内（10%-90%）
  const safeZoneStart = gameInstance.screenWidth * 0.1;
  const safeZoneEnd = gameInstance.screenWidth * 0.9;
  
  while (checkFormationOverlap(finalCenterX, finalCenterY, enemyType) && attempts < 10) {
    finalCenterX = safeZoneStart + Math.random() * (safeZoneEnd - safeZoneStart);
    finalCenterY = centerY - Math.random() * 80;
      attempts++;
    }
    
  // 如果仍然重叠，强制选择安全位置
  if (attempts >= 10) {
    finalCenterX = gameInstance.screenWidth / 2;
    finalCenterY = -100 - Math.random() * 100;
  }
  
  // 边界检查 - 确保在安全区域内，增加安全边距
  finalCenterX = Math.max(safeZoneStart + 80, Math.min(safeZoneEnd - 80, finalCenterX));
  finalCenterY = Math.min(-60, finalCenterY);
    
    // 编队共享属性
    const formationId = Math.random().toString(36); // 编队唯一ID
    const sharedFlightPattern = flightPattern || this.getRandomPattern('small'); // 使用传入的飞行模式
    const sharedFlightFrameCount = 0; // 编队统一动作帧数
    
    // 设置编队相对位置
    const positions = this.getFormationPositions(type, count);
    
    for (let i = 0; i < positions.length; i++) {
      const pos = positions[i];
      const enemy = new Enemy(
        finalCenterX + pos.x, 
        finalCenterY + pos.y, 
        enemyType, level, 1, 'top', gameInstance
      );
      
      // 编队同步设置
      enemy.formationId = formationId;
      enemy.formationLeader = i === 0; // 第一架是领队
      enemy.formationOffset = pos; // 保存相对位置
      enemy.flightPattern = sharedFlightPattern;
      enemy.flightFrameCount = sharedFlightFrameCount;
      enemy.canShootFlag = false; // 小敌机不射击
      enemy.shootTimer = 60; // 固定延迟，不随机
      
      // 设置飞行模式参数
      if (sharedFlightPattern === 'lshape') {
        enemy.lDirection = Math.random() < 0.5 ? -1 : 1;
      }
      if (sharedFlightPattern === 'side_arc') {
        enemy.arcDirection = finalCenterX < gameInstance.screenWidth / 2 ? 1 : -1; // 根据起始位置决定弧形方向
      }
      if (sharedFlightPattern === 'horizontal_sweep') {
        enemy.sweepDirection = finalCenterX < gameInstance.screenWidth / 2 ? 1 : -1; // 根据起始位置决定横扫方向
      }
      
      enemies.push(enemy);
    }
    
    return enemies;
  }
  
  // 生成客机 - 过境保护任务
  generatePassenger(gameInstance) {
    const screenWidth = gameInstance.screenWidth;
    const screenHeight = gameInstance.screenHeight;
    
    // 定义过境路线（从屏幕一侧到另一侧）
    const routes = [
      // 左到右（水平穿越）
      {
        startX: -100,
        startY: screenHeight * 0.4 + Math.random() * screenHeight * 0.4, // 40%-80%高度
        targetX: screenWidth + 100,
        targetY: screenHeight * 0.4 + Math.random() * screenHeight * 0.4
      },
      // 右到左（水平穿越）
      {
        startX: screenWidth + 100,
        startY: screenHeight * 0.4 + Math.random() * screenHeight * 0.4,
        targetX: -100,
        targetY: screenHeight * 0.4 + Math.random() * screenHeight * 0.4
      },
      // 上到下（垂直穿越）
      {
        startX: screenWidth * 0.3 + Math.random() * screenWidth * 0.4, // 30%-70%宽度
        startY: -100,
        targetX: screenWidth * 0.3 + Math.random() * screenWidth * 0.4,
        targetY: screenHeight + 100
      },
      // 对角穿越（左上到右下）
      {
        startX: -100,
        startY: screenHeight * 0.2,
        targetX: screenWidth + 100,
        targetY: screenHeight * 0.8
      },
      // 对角穿越（右上到左下）
      {
        startX: screenWidth + 100,
        startY: screenHeight * 0.2,
        targetX: -100,
        targetY: screenHeight * 0.8
      }
    ];
    
    const route = routes[Math.floor(Math.random() * routes.length)];
    
    // 播放客机音效
    if (gameInstance.audioManager) {
      gameInstance.audioManager.playPassengerSound();
    }
    
    return new Passenger(route.startX, route.startY, route.targetX, route.targetY, gameInstance);
  }
  
  // 生成货机 - 道具运输任务（学习客机的路线模式）
  generateCargo(gameInstance) {
    const screenWidth = gameInstance.screenWidth;
    const screenHeight = gameInstance.screenHeight;
    
    // 定义货机路线（学习客机的模式，从屏幕外飞入到屏幕外）
    const routes = [
      // 左到右（水平穿越）
      {
        startX: -100,
        startY: screenHeight * 0.3 + Math.random() * screenHeight * 0.4, // 30%-70%高度
        targetX: screenWidth + 100,
        targetY: screenHeight * 0.3 + Math.random() * screenHeight * 0.4
      },
      // 右到左（水平穿越）
      {
        startX: screenWidth + 100,
        startY: screenHeight * 0.3 + Math.random() * screenHeight * 0.4,
        targetX: -100,
        targetY: screenHeight * 0.3 + Math.random() * screenHeight * 0.4
      },
      // 上到下（垂直穿越）
      {
        startX: screenWidth * 0.2 + Math.random() * screenWidth * 0.6, // 20%-80%宽度
        startY: -100,
        targetX: screenWidth * 0.2 + Math.random() * screenWidth * 0.6,
        targetY: screenHeight + 100
      },
      // 对角穿越（左上到右下）
      {
        startX: -100,
        startY: screenHeight * 0.2,
        targetX: screenWidth + 100,
        targetY: screenHeight * 0.8
      },
      // 对角穿越（右上到左下）
      {
        startX: screenWidth + 100,
        startY: screenHeight * 0.2,
        targetX: -100,
        targetY: screenHeight * 0.8
      }
    ];
    
    const route = routes[Math.floor(Math.random() * routes.length)];
    
    return new CargoPlane(route.startX, route.startY, route.targetX, route.targetY, gameInstance);
  }
  
  // 获取编队位置 - 标准军事编队
  getFormationPositions(type, count) {
    const spacing = 45; // 飞机间距
    
    switch (type) {
      case 'line':
        // 横线编队
        const positions = [];
        for (let i = 0; i < count; i++) {
          positions.push({
            x: (i - (count - 1) / 2) * spacing,
            y: 0
          });
        }
        return positions;
        
      case 'vformation':
        // V字编队
        return Array.from({ length: count }, (_, i) => {
          const side = i % 2 === 0 ? 1 : -1;
          const distance = Math.floor((i + 1) / 2);
          return {
            x: side * distance * spacing * 0.8,
            y: distance * spacing * 0.6
          };
        });
        
      case 'diamond':
        // 菱形编队（最多5架）
        const diamondPos = [
          { x: 0, y: 0 },        // 中心领队
          { x: -spacing, y: spacing * 0.8 },   // 左后
          { x: spacing, y: spacing * 0.8 },    // 右后
          { x: -spacing * 0.7, y: -spacing * 0.5 }, // 左前
          { x: spacing * 0.7, y: -spacing * 0.5 }   // 右前
        ];
        return diamondPos.slice(0, count);
        
      default:
        return [{ x: 0, y: 0 }];
    }
  }
}

// 货机类 - 道具运输专用
class CargoPlane {
  constructor(startX, startY, targetX, targetY, gameInstance = null) {
    this.gameInstance = gameInstance;
    
    // 货机基本属性
    this.width = 80;  // 比客机稍大
    this.height = 100;
    this.speed = 2.5; // 比客机快一点
    
    // 飞行设置
    this.startX = startX;
    this.startY = startY;
    this.targetX = targetX;
    this.targetY = targetY;
    this.x = startX;
    this.y = startY;
    
    // 计算直线飞行方向和距离
    const dx = targetX - startX;
    const dy = targetY - startY;
    this.totalDistance = Math.sqrt(dx * dx + dy * dy);
    this.direction = Math.atan2(dy, dx);
    
    // 速度向量
    this.vx = Math.cos(this.direction) * this.speed;
    this.vy = Math.sin(this.direction) * this.speed;
    
    // 飞行状态
    this.flightTimer = 0;
    this.hasCompletedEscape = false;
    this.hasDroppedItems = false; // 标记是否已经掉落过道具
    this.dropTriggerProgress = 0.3 + Math.random() * 0.4; // 在30%-70%飞行进度时掉落
  }

  update() {
    // 检查是否已经飞出屏幕
    if (this.hasCompletedEscape) {
      return;
    }
    
    // 飞行时间记录
    this.flightTimer++;
    
    // 继续直线飞行
    this.x += this.vx;
    this.y += this.vy;
    
    // 道具掉落逻辑 - 只掉落一次
    this.tryDropItems();
    
    // 检查是否飞出屏幕
    if (this.hasExitedScreen()) {
      this.hasCompletedEscape = true;
    }
  }
  
  // 尝试掉落道具 - 只在指定进度掉落一次
  tryDropItems() {
    // 如果已经掉落过道具，不再掉落
    if (this.hasDroppedItems) {
      return;
    }
    
    // 计算当前飞行进度
    const currentDistance = Math.sqrt(
      Math.pow(this.x - this.startX, 2) + 
      Math.pow(this.y - this.startY, 2)
    );
    const currentProgress = currentDistance / this.totalDistance;
    
    // 如果飞行进度达到掉落点，执行掉落
    if (currentProgress >= this.dropTriggerProgress) {
      this.dropItems();
      this.hasDroppedItems = true; // 标记已掉落，防止重复掉落
    }
  }
  
  // 掉落道具
  dropItems() {
    const dropCount = 1 + Math.floor(Math.random() * 3); // 1-3个道具
    
    for (let i = 0; i < dropCount; i++) {
      // 使用现有的道具类型选择逻辑
      const availableTypes = this.gameInstance.getAvailableItemTypes();
      if (availableTypes.length > 0) {
        const type = availableTypes[Math.floor(Math.random() * availableTypes.length)];
        
        // 在货机当前位置附近掉落道具
        const offsetX = (Math.random() - 0.5) * 40; // 40像素范围内
        const offsetY = (Math.random() - 0.5) * 40;
        
        // 调用游戏引擎的道具创建方法
        this.gameInstance.createItemAt(
          this.x + offsetX, 
          this.y + offsetY, 
          type
        );
      }
    }
  }
  
  // 检查是否飞出屏幕
  hasExitedScreen() {
    const screenWidth = this.gameInstance ? this.gameInstance.screenWidth : 800;
    const screenHeight = this.gameInstance ? this.gameInstance.screenHeight : 600;
    
    return this.x < -100 || this.x > screenWidth + 100 || 
           this.y < -100 || this.y > screenHeight + 100;
  }
  
  render(ctx) {
    // 尝试使用货机图片渲染
    let image = null;
    if (this.gameInstance && this.gameInstance.imageManager) {
      image = this.gameInstance.imageManager.getCargoImage();
    }
    
    ctx.save();
    
    // 计算货机朝向角度
    const angle = Math.atan2(this.vy, this.vx) + Math.PI / 2;
    
    ctx.translate(this.x, this.y);
    ctx.rotate(angle);
    
    if (image && image.complete) {
      // 使用图片渲染货机
      const scale = 1.0;
      const scaledWidth = this.width * scale;
      const scaledHeight = this.height * scale;
      
      ctx.drawImage(image, 
        -scaledWidth/2, 
        -scaledHeight/2, 
        scaledWidth, 
        scaledHeight
      );
    } else {
      // 后备渲染：橙色货机轮廓
      ctx.fillStyle = '#FF8C00';
      ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
      
      // 添加货机标识
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('货机', 0, 5);
    }
    
    ctx.restore();
  }
}

// 导出FlightPatternManager类、Passenger类和CargoPlane类
export { FlightPatternManager, Passenger, CargoPlane };
