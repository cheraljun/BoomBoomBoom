// 风暴之书 - 道具效果管理器模块

import { GAME_CONFIG } from '../config/GameConfig.js';
import { PlayerBullet } from '../combat/PlayerBullet.js';
import { ExplosionEffect } from '../effects/ExplosionEffect.js';
import { DestroyAnimation } from '../effects/DeathAnimation.js';

// 轰炸机专用导弹类
class BomberMissile {
  constructor(x, y, level, gameInstance = null) {
    this.x = x;
    this.y = y;
    this.level = level;
    this.speed = GAME_CONFIG.missile.speed;
    this.damage = 50; // 修改：固定伤害50
    this.explosionRadius = 60; // 修改：适当减小爆炸半径
    this.target = null;
    this.vx = 0;
    this.vy = -this.speed;
    this.turnSpeed = GAME_CONFIG.missile.turnSpeed;
    this.trail = []; // 导弹尾迹
    this.maxTrailLength = 8;
    this.life = 300; // 导弹存活时间
    this.gameInstance = gameInstance; // 添加游戏实例引用
    this.missileImage = null; // 导弹图片缓存
    this.loadBomberMissileImage();
  }
  
  loadBomberMissileImage() {
    if (this.gameInstance && this.gameInstance.imageManager) {
      this.missileImage = wx.createImage();
      this.missileImage.src = 'resources/pic/missiles/bomber_01.png';
    }
  }
  
  update(enemies) {
    this.life--;
    if (this.life <= 0) return;
    
    // 每3帧记录一次尾迹，减少计算
    if (this.life % 3 === 0) {
      this.trail.push({ x: this.x, y: this.y });
      if (this.trail.length > this.maxTrailLength) {
        this.trail.shift();
      }
    }
    
    // 每5帧寻找一次目标，减少计算频率
    if (!this.target || this.target.hp <= 0 || this.life % 5 === 0) {
      this.findTarget(enemies);
    }
    
    // 追踪目标
    if (this.target) {
      const dx = this.target.x - this.x;
      const dy = this.target.y - this.y;
      const distanceSq = dx * dx + dy * dy; // 避免开方运算
      
      if (distanceSq > 1) { // 使用平方比较
        const distance = Math.sqrt(distanceSq);
        
        // 计算期望的速度方向
        const desiredVx = (dx / distance) * this.speed;
        const desiredVy = (dy / distance) * this.speed;
        
        // 平滑转向
        this.vx += (desiredVx - this.vx) * this.turnSpeed;
        this.vy += (desiredVy - this.vy) * this.turnSpeed;
        
        // 简化速度限制 - 避免重复开方
        const currentSpeedSq = this.vx * this.vx + this.vy * this.vy;
        if (currentSpeedSq > this.speed * this.speed) {
          const speedRatio = this.speed / Math.sqrt(currentSpeedSq);
          this.vx *= speedRatio;
          this.vy *= speedRatio;
        }
      }
    }
    
    // 更新位置
    this.x += this.vx;
    this.y += this.vy;
  }
  
  findTarget(enemies) {
    let closestDistance = Infinity;
    this.target = null;
    
    for (const enemy of enemies) {
      if (enemy.hp <= 0) continue;
      
      const dx = enemy.x - this.x;
      const dy = enemy.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < closestDistance && distance < GAME_CONFIG.missile.lockRange) {
        closestDistance = distance;
        this.target = enemy;
      }
    }
  }
  
  render(ctx) {
    ctx.save();
    
    // 绘制导弹主体
    ctx.globalAlpha = 1;
    
    // 计算导弹角度
    const angle = Math.atan2(this.vy, this.vx) + Math.PI / 2;
    
    ctx.translate(this.x, this.y);
    ctx.rotate(angle);
    
    if (this.missileImage && this.missileImage.complete) {
      // 使用轰炸机专用导弹图片（放大1.5倍）
      const scale = 1.5;
      ctx.drawImage(this.missileImage, -8 * scale, -18 * scale, 16 * scale, 36 * scale);
    } else {
      // 后备渲染：原始样式
      ctx.fillStyle = GAME_CONFIG.colors.red;
      ctx.fillRect(-5, -18, 10, 12); // 更大的头部
      
      ctx.fillStyle = GAME_CONFIG.colors.yellow;
      ctx.fillRect(-4, -6, 8, 18); // 更大的身体
      
      // 更大的导弹尾翼
      ctx.fillStyle = GAME_CONFIG.colors.silver;
      ctx.fillRect(-6, 8, 3, 6); // 左尾翼
      ctx.fillRect(3, 8, 3, 6);  // 右尾翼
      
      // 添加导弹细节，让它更有威慑力
      ctx.fillStyle = GAME_CONFIG.colors.white;
      ctx.fillRect(-1, -15, 2, 8); // 头部高光
      ctx.fillRect(-2, -3, 4, 2);  // 身体标记
    }
    
    ctx.restore();
  }
}

// 追踪导弹类
class TrackingMissile {
  constructor(x, y, level, gameInstance = null) {
    this.x = x;
    this.y = y;
    this.level = level;
    this.speed = GAME_CONFIG.missile.speed;
    this.damage = 50; // 修改：固定伤害50
    this.explosionRadius = 60; // 修改：适当减小爆炸半径
    this.target = null;
    this.vx = 0;
    this.vy = -this.speed;
    this.turnSpeed = GAME_CONFIG.missile.turnSpeed;
    this.trail = []; // 导弹尾迹
    this.maxTrailLength = 8;
    this.life = 300; // 导弹存活时间
    this.gameInstance = gameInstance; // 添加游戏实例引用
    this.missileImage = null; // 导弹图片缓存
  }
  
  update(enemies) {
    this.life--;
    if (this.life <= 0) return;
    
    // 每3帧记录一次尾迹，减少计算
    if (this.life % 3 === 0) {
      this.trail.push({ x: this.x, y: this.y });
      if (this.trail.length > this.maxTrailLength) {
        this.trail.shift();
      }
    }
    
    // 每5帧寻找一次目标，减少计算频率
    if (!this.target || this.target.hp <= 0 || this.life % 5 === 0) {
      this.findTarget(enemies);
    }
    
    // 追踪目标
    if (this.target) {
      const dx = this.target.x - this.x;
      const dy = this.target.y - this.y;
      const distanceSq = dx * dx + dy * dy; // 避免开方运算
      
      if (distanceSq > 1) { // 使用平方比较
        const distance = Math.sqrt(distanceSq);
        
        // 计算期望的速度方向
        const desiredVx = (dx / distance) * this.speed;
        const desiredVy = (dy / distance) * this.speed;
        
        // 平滑转向
        this.vx += (desiredVx - this.vx) * this.turnSpeed;
        this.vy += (desiredVy - this.vy) * this.turnSpeed;
        
        // 简化速度限制 - 避免重复开方
        const currentSpeedSq = this.vx * this.vx + this.vy * this.vy;
        if (currentSpeedSq > this.speed * this.speed) {
          const speedRatio = this.speed / Math.sqrt(currentSpeedSq);
          this.vx *= speedRatio;
          this.vy *= speedRatio;
        }
      }
    }
    
    // 更新位置
    this.x += this.vx;
    this.y += this.vy;
  }
  
  findTarget(enemies) {
    let closestDistance = Infinity;
    this.target = null;
    
    for (const enemy of enemies) {
      if (enemy.hp <= 0) continue;
      
      const dx = enemy.x - this.x;
      const dy = enemy.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < closestDistance && distance < GAME_CONFIG.missile.lockRange) {
        closestDistance = distance;
        this.target = enemy;
      }
    }
  }
  
  render(ctx) {
    // 尝试使用图片渲染导弹
    let image = null;
    if (this.gameInstance && this.gameInstance.imageManager) {
      // 使用固定的missile_01图片
      if (!this.missileImage) {
        this.missileImage = wx.createImage();
        this.missileImage.src = 'resources/pic/missiles/missile_01.png';
      }
      image = this.missileImage;
    }
    
    ctx.save();
    
    // 绘制导弹主体
    ctx.globalAlpha = 1;
    
    // 计算导弹角度
    const angle = Math.atan2(this.vy, this.vx) + Math.PI / 2;
    
    ctx.translate(this.x, this.y);
    ctx.rotate(angle);
    
    if (image && image.complete) {
      // 使用图片渲染导弹（放大1.5倍）
      const scale = 1.5;
      ctx.drawImage(image, -8 * scale, -18 * scale, 16 * scale, 36 * scale);
    } else {
      // 后备渲染：原始样式
    // 更大的导弹主体（红色头部 + 黄色身体）
    ctx.fillStyle = GAME_CONFIG.colors.red;
    ctx.fillRect(-5, -18, 10, 12); // 更大的头部
    
    ctx.fillStyle = GAME_CONFIG.colors.yellow;
    ctx.fillRect(-4, -6, 8, 18); // 更大的身体
    
    // 更大的导弹尾翼
    ctx.fillStyle = GAME_CONFIG.colors.silver;
    ctx.fillRect(-6, 8, 3, 6); // 左尾翼
    ctx.fillRect(3, 8, 3, 6);  // 右尾翼
    
    // 添加导弹细节，让它更有威慑力
    ctx.fillStyle = GAME_CONFIG.colors.white;
    ctx.fillRect(-1, -15, 2, 8); // 头部高光
    ctx.fillRect(-2, -3, 4, 2);  // 身体标记
    }
    
    ctx.restore();
  }
}

// 僚机类
class Wingman {
  constructor(id = 1, gameInstance = null, position = 'left', bulletCount = 1) {
    this.x = 0;
    this.y = 0;
    this.id = id;
    this.gameInstance = gameInstance;
    this.position = position; // 'left' 或 'right'
    this.bulletCount = bulletCount; // 子弹数量：1、2、3
    
    // 根据位置设置偏移
    if (position === 'left') {
      this.offsetX = -30;
      this.offsetY = -15;
    } else {
      this.offsetX = 30;
      this.offsetY = -15;
    }
    
    this.width = 20;
    this.height = 25;
    this.shootTimer = 0;
    
    // 固定射速
    this.fireRate = 25;
  }
  
  update(player) {
    const targetX = player.x + this.offsetX;
    const targetY = player.y + this.offsetY;
    
    this.x += (targetX - this.x) * 0.1;
    this.y += (targetY - this.y) * 0.1;
    
    this.shootTimer++;
  }
  
  canShoot() {
    // 根据等级调整射击频率
    return this.shootTimer % this.fireRate === 0;
  }
  
  shoot() {
    const bullets = [];
    const wingmanDamage = 5; // 僚机子弹伤害，比玩家子弹稍低但足够有效
    
    if (this.bulletCount === 1) {
      // 单发
      bullets.push(new PlayerBullet(this.x, this.y, 'silver', wingmanDamage, 1, 0, this.gameInstance, true, 'wingman'));
    } else if (this.bulletCount === 2) {
      // 双发
      bullets.push(new PlayerBullet(this.x - 6, this.y, 'silver', wingmanDamage, 1, 0, this.gameInstance, true, 'wingman'));
      bullets.push(new PlayerBullet(this.x + 6, this.y, 'silver', wingmanDamage, 1, 0, this.gameInstance, true, 'wingman'));
    } else if (this.bulletCount === 3) {
      // 三发
      bullets.push(new PlayerBullet(this.x - 8, this.y, 'silver', wingmanDamage, 1, 0, this.gameInstance, true, 'wingman'));
      bullets.push(new PlayerBullet(this.x, this.y, 'silver', wingmanDamage, 1, 0, this.gameInstance, true, 'wingman'));
      bullets.push(new PlayerBullet(this.x + 8, this.y, 'silver', wingmanDamage, 1, 0, this.gameInstance, true, 'wingman'));
    }
    
    return bullets;
  }
  
  render(ctx) {
    // 使用图片渲染僚机
    let image = null;
    if (this.gameInstance && this.gameInstance.imageManager) {
      image = this.gameInstance.imageManager.getWingmanImage(this.id);
    }
    
    if (image && image.complete && image.naturalWidth > 0) {
      // 图片加载成功，使用图片渲染（放大1.5倍）
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
      // 后备渲染 - 使用更明显的颜色（放大1.5倍）
      const scale = 1.5;
      const scaledWidth = this.width * scale;
      const scaledHeight = this.height * scale;
      
      ctx.fillStyle = '#FF6B6B'; // 红色，更容易看到
      ctx.fillRect(this.x - scaledWidth/2, this.y - scaledHeight/2, scaledWidth, scaledHeight);
      
      // 添加边框和文字标识（放大1.5倍）
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.strokeRect(this.x - scaledWidth/2, this.y - scaledHeight/2, scaledWidth, scaledHeight);
      
      // 添加等级文字
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`L${this.level}`, this.x, this.y + 4);
    }
  }
}

// 轰炸机类
class Bomber {
  constructor(gameInstance = null) {
    this.gameInstance = gameInstance;
    
    // 轰炸机尺寸
    this.width = 80;
    this.height = 60;
    this.speed = 1.5; // 稍慢一点，给更多轰炸时间
    
    // 多方向飞行路线（模仿客机/货机）
    this.setupFlightRoute();
    
    // 轰炸相关属性 - 连续爆炸系统
    this.lastBombTime = 0;
    this.bombInterval = 3 + Math.random() * 5; // 3-8帧间隔（超高频连续）
    // 飞行状态（完全模仿客机/货机）
    this.flightTimer = 0;
    this.hasCompletedEscape = false;
    
    // 爆炸队列系统 - 实现连续"嘣嘣嘣"效果
    this.explosionQueue = [];
    this.maxConcurrentExplosions = 15; // 同时最多15个爆炸在准备中，确保持续轰炸
    this.explosionDelay = 2; // 每2帧投放一个炸弹
    
    // 预填充爆炸队列，确保轰炸机一出现就开始轰炸
    this.prefillExplosionQueue();
    
    // 轰炸机图片
    this.bomberImage = null;
    this.loadBomberImage();
  }
  
  setupFlightRoute() {
    const screenWidth = this.gameInstance.screenWidth;
    const screenHeight = this.gameInstance.screenHeight;
    
    // 定义多种飞行路线（学习客机/货机的路线系统）
    const routes = [
      // 左到右（水平穿越）
      {
        startX: -100,
        startY: 50 + Math.random() * 100, // 屏幕上方
        targetX: screenWidth + 100,
        targetY: 50 + Math.random() * 100
      },
      // 右到左（水平穿越）
      {
        startX: screenWidth + 100,
        startY: 50 + Math.random() * 100,
        targetX: -100,
        targetY: 50 + Math.random() * 100
      },
      // 上到下（垂直穿越）- 从上方飞入
      {
        startX: screenWidth * 0.2 + Math.random() * screenWidth * 0.6,
        startY: -100,
        targetX: screenWidth * 0.2 + Math.random() * screenWidth * 0.6,
        targetY: screenHeight * 0.3 // 只飞到屏幕中上部
      },
      // 对角穿越（左上到右下）
      {
        startX: -100,
        startY: 30,
        targetX: screenWidth + 100,
        targetY: screenHeight * 0.4
      },
      // 对角穿越（右上到左下）
      {
        startX: screenWidth + 100,
        startY: 30,
        targetX: -100,
        targetY: screenHeight * 0.4
      }
    ];
    
    const route = routes[Math.floor(Math.random() * routes.length)];
    
    // 设置起点和终点
    this.startX = route.startX;
    this.startY = route.startY;
    this.targetX = route.targetX;
    this.targetY = route.targetY;
    this.x = this.startX;
    this.y = this.startY;
    
    // 计算飞行方向和速度向量
    const dx = this.targetX - this.startX;
    const dy = this.targetY - this.startY;
    this.totalDistance = Math.sqrt(dx * dx + dy * dy);
    this.direction = Math.atan2(dy, dx);
    
    // 速度向量（用于移动和朝向）
    this.vx = Math.cos(this.direction) * this.speed;
    this.vy = Math.sin(this.direction) * this.speed;
  }
  
  // 预填充爆炸队列，确保轰炸机一出现就开始密集轰炸
  prefillExplosionQueue() {
    // 立即填满队列，确保轰炸效果从一开始就很密集
    for (let i = 0; i < this.maxConcurrentExplosions; i++) {
      const bombX = Math.random() * this.gameInstance.screenWidth;
      const bombY = Math.random() * this.gameInstance.screenHeight * 0.8 + this.gameInstance.screenHeight * 0.1;
      
      this.explosionQueue.push({
        x: bombX,
        y: bombY,
        timer: Math.floor(Math.random() * 20) + 5, // 5-25帧后爆炸，分散时间
        scale: 0.8 + Math.random() * 0.7
      });
    }
  }
  
  loadBomberImage() {
    if (this.gameInstance && this.gameInstance.imageManager) {
      this.bomberImage = wx.createImage();
      this.bomberImage.src = 'resources/pic/powerups/bomber_01.png'; // 正确的轰炸机图片路径
    }
  }
  
    update() {
    // 检查是否已经飞出屏幕（完全模仿货机逻辑）
    if (this.hasCompletedEscape) {
      return;
    }
    
    // 飞行时间记录
    this.flightTimer++;
    
    // 继续直线飞行（完全模仿货机）
    this.x += this.vx;
    this.y += this.vy;
    
    // 持续轰炸逻辑 - 整个飞行过程都在轰炸
    this.continuousBombing();
    
    // 检查是否飞出屏幕
    if (this.hasExitedScreen()) {
      this.hasCompletedEscape = true;
    }
  }
  
  // 持续轰炸逻辑
  continuousBombing() {
    // 持续生成爆炸位置到队列
    this.lastBombTime++;
    if (this.lastBombTime >= this.bombInterval) {
      this.queueNewExplosion();
      this.lastBombTime = 0;
      this.bombInterval = 3 + Math.random() * 5; // 重新随机间隔（3-8帧）
    }
    
    // 处理爆炸队列 - 实现连续"嘣嘣嘣"效果
    this.processExplosionQueue();
  }
  
  hasExitedScreen() {
    // 完全模仿货机的hasExitedScreen逻辑
    const screenWidth = this.gameInstance ? this.gameInstance.screenWidth : 800;
    const screenHeight = this.gameInstance ? this.gameInstance.screenHeight : 600;
    
    return this.x < -100 || this.x > screenWidth + 100 || 
           this.y < -100 || this.y > screenHeight + 100;
  }
  
  // 检查轰炸机是否仍然活跃（模仿货机逻辑）
  isActive() {
    return !this.hasCompletedEscape;
  }
  
  // 添加新的爆炸位置到队列
  queueNewExplosion() {
    if (!this.gameInstance) return;
    
    // 每次尽可能多地添加爆炸点，确保队列始终满员
    const bombCount = 3 + Math.floor(Math.random() * 4); // 3-6颗炸弹
    
    for (let i = 0; i < bombCount; i++) {
      // 持续补充队列，保持高密度轰炸
      if (this.explosionQueue.length < this.maxConcurrentExplosions) {
        // 随机分布在整个屏幕区域，确保地毯式覆盖
        const bombX = Math.random() * this.gameInstance.screenWidth;
        const bombY = Math.random() * this.gameInstance.screenHeight * 0.8 + this.gameInstance.screenHeight * 0.1; // 10%-90%屏幕高度
        
        this.explosionQueue.push({
          x: bombX,
          y: bombY,
          timer: Math.floor(Math.random() * 8) + 2, // 2-10帧后爆炸，超短时间分布
          scale: 0.8 + Math.random() * 0.7 // 0.8-1.5倍大小
        });
      }
    }
  }
  
  // 处理爆炸队列，实现连续"嘣嘣嘣"效果
  processExplosionQueue() {
    if (!this.gameInstance) return;
    
    for (let i = this.explosionQueue.length - 1; i >= 0; i--) {
      const bomb = this.explosionQueue[i];
      bomb.timer--;
      
      // 时间到了，触发爆炸
      if (bomb.timer <= 0) {
        this.triggerSingleExplosion(bomb.x, bomb.y, bomb.scale);
        this.explosionQueue.splice(i, 1); // 移除已爆炸的炸弹
      }
    }
  }
  
  // 触发单个爆炸效果和音效
  triggerSingleExplosion(x, y, scale) {
    // 创建爆炸视觉效果（只要图片，不要圈圈）
    const deathAnimation = new DestroyAnimation(x, y, 'large');
    
    this.gameInstance.effects.push(deathAnimation);
    
    // 播放爆炸音效（使用敌机死亡音效模拟）
    if (this.gameInstance.audioManager) {
      this.gameInstance.audioManager.playEnemyDeathSound();
    }
    
    // 检查爆炸范围内的敌机并摧毁它们
    this.destroyEnemiesInRange(x, y, 80 * scale);
  }
  
  destroyEnemiesInRange(bombX, bombY, explosionRadius) {
    if (!this.gameInstance.enemies) return;
    
    let enemiesDestroyed = 0; // 统计本次爆炸摧毁的敌机数量
    
    for (let i = this.gameInstance.enemies.length - 1; i >= 0; i--) {
      const enemy = this.gameInstance.enemies[i];
      const dx = enemy.x - bombX;
      const dy = enemy.y - bombY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance <= explosionRadius) {
        // 摧毁敌机
        if (enemy.takeDamage) {
          enemy.takeDamage(9999); // 足够大的伤害直接摧毁
        }
        
        // 添加分数
        if (this.gameInstance.addScore) {
          this.gameInstance.addScore(enemy.score || 10);
        }
        
        // 播放敌机死亡音效
        if (this.gameInstance.audioManager) {
          this.gameInstance.audioManager.playEnemyDeathSound();
        }
        
        // 移除敌机
        this.gameInstance.enemies.splice(i, 1);
        enemiesDestroyed++;
      }
    }
    
    // 如果本次爆炸摧毁了敌机，则触发画面抖动效果（每次爆炸只触发一次）
    if (enemiesDestroyed > 0 && this.gameInstance.shakeEffect) {
      // 根据摧毁敌机数量调整抖动强度，但限制最大值
      const intensity = Math.min(8 + enemiesDestroyed * 2, 16);
      this.gameInstance.shakeEffect.start(intensity, 25); // 持续25帧
    }
    
    // 清除敌机子弹
    if (this.gameInstance.enemyBullets) {
      for (let i = this.gameInstance.enemyBullets.length - 1; i >= 0; i--) {
        const bullet = this.gameInstance.enemyBullets[i];
        const dx = bullet.x - bombX;
        const dy = bullet.y - bombY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance <= explosionRadius) {
          this.gameInstance.enemyBullets.splice(i, 1);
        }
      }
    }
  }
  
  render(ctx) {
    if (this.hasCompletedEscape) return;
    
    ctx.save();
    
    // 计算轰炸机朝向角度（像客机和货机一样）
    const angle = Math.atan2(this.vy, this.vx) + Math.PI / 2;
    
    ctx.translate(this.x, this.y);
    ctx.rotate(angle);
    
    if (this.bomberImage && this.bomberImage.complete) {
      // 使用轰炸机图片（放大一倍）
      const scale = 2.0;
      const scaledWidth = this.width * scale;
      const scaledHeight = this.height * scale;
      
      ctx.drawImage(this.bomberImage, 
        -scaledWidth/2, 
        -scaledHeight/2, 
        scaledWidth, 
        scaledHeight
      );
    } else {
      // 后备渲染：深绿色矩形表示轰炸机
      ctx.fillStyle = '#2F4F2F';
      ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
      
      // 添加标识
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('轰炸机', 0, 4);
    }
    
    ctx.restore();
  }
  

}

// 道具效果管理器类
class PowerupManager {
  constructor(gameInstance) {
    this.gameInstance = gameInstance;
    
    // 新增：导弹模式管理
    this.missileMode = {
      active: false,
      lastFireTime: 0,
      fireInterval: 0,
      startTime: 0
    };
    
    // 轰炸系统管理
    this.bombers = [];
    this.bombingActive = false;
    
    // 新增：音效控制标志
    this.soundFlags = {
      missileFirstShot: false,    // 导弹模式第一次发射音效标志
      bomberFirstShot: false      // 轰炸第一次音效标志
    };
  }
  
  // 道具收集处理
  collectItem(item) {
    if (!item || !this.gameInstance || !this.gameInstance.player) {
      return;
    }
    
    const player = this.gameInstance.player;
    
    // 播放收集道具音效
    if (this.gameInstance.audioManager) {
      this.gameInstance.audioManager.playItemCollectSound();
    }
    
    switch (item.type) {
      case '双倍火力':
        player.upgradeBulletLevel();
        this.gameInstance.addNotification('火力升级!');
        break;
        
      case '轰炸':
        // 直接增加统一的轰炸数量
        this.gameInstance.sessionBombs++;
        player.superBombs = this.gameInstance.sessionBombs; // 同步到玩家
        this.gameInstance.addNotification('获得轰炸!');
        break;
        
      case '追踪导弹':
        // 修改：激活导弹模式而不是增加数量
        this.activateMissileMode();
        this.gameInstance.addNotification('获得导弹!');
        break;
        
      case '生命补给':
        player.health = Math.min(player.maxHealth, player.health + 50);
        this.gameInstance.addNotification('生命恢复!');
        break;
        
      case '战斗僚机':
        if (player.wingmenLevel < 6) {
          player.wingmenLevel++;
          this.updateWingmen(player.wingmenLevel);
          this.gameInstance.addNotification(`僚机支援! 当前火力: ${player.wingmenLevel}/6`);
        }
        break;
        
      default:
        break;
    }
  }
  
  // 导弹模式管理方法
  
  // 激活导弹模式
  activateMissileMode() {
    this.missileMode.active = true;
    this.missileMode.startTime = Date.now();
    this.missileMode.lastFireTime = Date.now();
    this.missileMode.fireInterval = 10 + Math.random() * 990; // 0.01-1秒随机
    
    // 重置导弹音效标志，允许下次获得道具时播放音效
    this.soundFlags.missileFirstShot = false;
  }
  
  // 停用导弹模式
  deactivateMissileMode() {
    this.missileMode.active = false;
  }
  
  // 更新导弹模式
  updateMissileMode() {
    if (!this.missileMode.active) return;
    
    const now = Date.now();
    if (now - this.missileMode.lastFireTime >= this.missileMode.fireInterval) {
      this.fireMissile();
      this.missileMode.lastFireTime = now;
      this.missileMode.fireInterval = 10 + Math.random() * 990; // 下次发射间隔重新随机
    }
  }
  
  // 发射导弹
  fireMissile() {
    if (this.gameInstance && this.gameInstance.missiles) {
      // 只在第一次发射时播放导弹发射音效
      if (this.gameInstance.audioManager && !this.soundFlags.missileFirstShot) {
        this.gameInstance.audioManager.playMissileSound();
        this.soundFlags.missileFirstShot = true; // 标记已播放音效
      }
      
      this.gameInstance.missiles.push(new TrackingMissile(
        this.gameInstance.player.x,
        this.gameInstance.player.y - 30,
        1, // 固定等级
        this.gameInstance
      ));
    }
  }
  
  // 检查导弹模式状态
  isMissileModeActive() {
    return this.missileMode.active;
  }
  
  // 更新僚机系统
  updateWingmen(count) {
    // 清空现有僚机
    this.gameInstance.wingmen = [];
    
    if (count >= 1) {
      // 第1次：左边1架僚机（单发）
      this.gameInstance.wingmen.push(new Wingman(1, this.gameInstance, 'left', 1));
    }
    
    if (count >= 2) {
      // 第2次：右边1架僚机（单发）
      this.gameInstance.wingmen.push(new Wingman(2, this.gameInstance, 'right', 1));
    }
    
    if (count >= 3) {
      // 第3次：左边变成双发
      this.gameInstance.wingmen[0] = new Wingman(3, this.gameInstance, 'left', 2);
    }
    
    if (count >= 4) {
      // 第4次：右边变成双发
      this.gameInstance.wingmen[1] = new Wingman(4, this.gameInstance, 'right', 2);
    }
    
    if (count >= 5) {
      // 第5次：左边变成三发
      this.gameInstance.wingmen[0] = new Wingman(5, this.gameInstance, 'left', 3);
    }
    
    if (count >= 6) {
      // 第6次：右边变成三发
      this.gameInstance.wingmen[1] = new Wingman(6, this.gameInstance, 'right', 3);
    }
  }
  
  // 轰炸道具使用入口
  clearScreen() {
    if (this.gameInstance.sessionBombs > 0) {
      // 直接减少统一的轰炸数量
      this.gameInstance.sessionBombs--;
      this.gameInstance.player.superBombs = this.gameInstance.sessionBombs; // 同步到玩家
      
      // 重置音效标志，允许下次获得道具时播放音效
      this.soundFlags.bomberFirstShot = false;
      
      // 播放轰炸音效
      if (this.gameInstance.audioManager) {
        this.gameInstance.audioManager.playBomberSound();
      }
      
      this.activateBombing();
      this.gameInstance.addNotification('轰炸开始!');
    } else {
      this.gameInstance.addNotification('没有轰炸道具!');
    }
  }
  
  // 激活轰炸
  activateBombing() {
    // 创建新的轰炸机
    const bomber = new Bomber(this.gameInstance);
    this.bombers.push(bomber);
    this.bombingActive = true;
    
    // 清除敌机子弹给玩家喘息空间
    this.gameInstance.enemyBullets = [];
  }
  
  // 更新轰炸系统
  updateBombingSystem() {
    if (!this.bombingActive || this.bombers.length === 0) return;
    
    // 更新所有轰炸机
    for (let i = this.bombers.length - 1; i >= 0; i--) {
      const bomber = this.bombers[i];
      bomber.update();
      
      // 移除不活跃的轰炸机
      if (!bomber.isActive()) {
        this.bombers.splice(i, 1);
      }
    }
    
    // 如果所有轰炸机都消失，结束轰炸
    if (this.bombers.length === 0) {
      this.bombingActive = false;
      this.gameInstance.addNotification('轰炸完成!');
    }
  }
  
  // 渲染轰炸机
  renderBombers(ctx) {
    this.bombers.forEach(bomber => bomber.render(ctx));
  }
  
  // 检查轰炸是否活跃
  isBombingActive() {
    return this.bombingActive;
  }
}

// 导出所有类
export { TrackingMissile, BomberMissile, Wingman, Bomber, PowerupManager }; 