// 游戏UI - 游戏内界面管理器
import { GAME_CONFIG } from '../config/GameConfig.js';

// 技能UI类
class SkillUI {
  constructor(game) {
    this.game = game;
    this.buttons = [
      // 暂停功能改为左下角固定按钮，不再需要双击飞机
    ];
    
    this.updateButtonPositions();
  }
  
  updateButtonPositions() {
    const startY = this.game.screenHeight - 200;
    this.buttons.forEach((button, index) => {
      button.x = 20;
      button.y = startY + (index * 50);
    });
  }
  
  handleTouch(x, y) {
    const buttonSize = 40;
    const margin = 20;
    const spacing = 10;
    
    // 检查暂停按钮（最下方）
    const pauseButtonX = margin;
    const pauseButtonY = this.game.screenHeight - buttonSize - margin;
    
    if (x >= pauseButtonX && x <= pauseButtonX + buttonSize &&
        y >= pauseButtonY && y <= pauseButtonY + buttonSize) {
      // 点击暂停按钮，进入暂停菜单
      this.game.gameState = 'pause_menu';
      return true;
    }
    
    // 检查轰炸按钮（暂停按钮上方）
    const bombButtonX = margin;
    const bombButtonY = pauseButtonY - buttonSize - spacing;
    
    if (x >= bombButtonX && x <= bombButtonX + buttonSize &&
        y >= bombButtonY && y <= bombButtonY + buttonSize) {
      // 点击轰炸按钮，直接执行轰炸
      if (this.game.sessionBombs > 0) {
        this.game.sessionBombs--;
        if (this.game.player) {
          this.game.player.superBombs = this.game.sessionBombs; // 同步到玩家
        }
        // 执行轰炸
        this.game.powerupManager.activateBombing();
        this.game.addNotification('轰炸启动!');
      } else {
        this.game.addNotification('没有轰炸道具!');
      }
      return true;
    }
    
    // 检查自动测试按钮（轰炸按钮上方）
    const autoTestButtonX = margin;
    const autoTestButtonY = bombButtonY - buttonSize - spacing;
    
    if (x >= autoTestButtonX && x <= autoTestButtonX + buttonSize &&
        y >= autoTestButtonY && y <= autoTestButtonY + buttonSize) {
      // 点击自动测试按钮，切换自动测试状态
      this.game.toggleAutoTest();
      this.game.addNotification(this.game.autoTestEnabled ? '自动测试: 开启' : '自动测试: 关闭');
      return true;
    }
    

    
    // 检查其他技能按钮（当前为空）
    for (const button of this.buttons) {
      if (x >= button.x && x <= button.x + button.width &&
          y >= button.y && y <= button.y + button.height) {
        
        if (button.isAvailable()) {
          // 其他技能按钮处理逻辑（当前为空）
          return true;
        }
      }
    }
    return false;
  }
  
  render(ctx) {
    this.buttons.forEach(button => {
      const available = button.isAvailable();
      
      ctx.fillStyle = available ? GAME_CONFIG.colors.green : GAME_CONFIG.colors.shadow;
      ctx.fillRect(button.x, button.y, button.width, button.height);
      
      ctx.strokeStyle = GAME_CONFIG.colors.white;
      ctx.strokeRect(button.x, button.y, button.width, button.height);
      
      ctx.fillStyle = GAME_CONFIG.colors.white;
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      
      // 所有按钮只显示文字，居中显示
      ctx.fillText(button.text, button.x + button.width/2, button.y + button.height/2 + 5);
    });
  }
}

class GameUI {
  constructor(game) {
    this.game = game;
    this.ctx = game.ctx;
    this.screenWidth = game.screenWidth;
    this.screenHeight = game.screenHeight;
  }

  // 自定义圆角矩形绘制方法（兼容性更好）
  drawRoundRect(ctx, x, y, width, height, radius) {
    // 直接使用自定义圆角矩形实现，不尝试原生方法
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
  }

  // 死亡场景渲染（高亮死亡原因、闪烁效果）
  renderDying() {
    // 继续渲染游戏场景
    this.game.background.render(this.ctx);
    
    if (this.game.player) {
      this.game.player.render(this.ctx);
    }
    
    this.game.wingmen.forEach(wingman => wingman.render(this.ctx));
    this.game.enemies.forEach(enemy => enemy.render(this.ctx));
    this.game.playerBullets.forEach(bullet => bullet.render(this.ctx));
    this.game.enemyBullets.forEach(bullet => bullet.render(this.ctx));
    this.game.missiles.forEach(missile => missile.render(this.ctx));
    this.game.items.forEach(item => item.render(this.ctx));
    this.game.effects.forEach(effect => effect.render(this.ctx));
    
    // 高亮显示死亡原因 - 突出显示碰撞对象
    if (this.game.deathCause) {
      this.ctx.save();
      
      // 闪烁效果
      const flashAlpha = (Math.floor(this.game.deathTimer / 10) % 2) ? 1.0 : 0.6;
      this.ctx.globalAlpha = flashAlpha;
      
      if (this.game.deathCause.type === 'bullet') {
        // 突出显示致命子弹
        this.ctx.fillStyle = GAME_CONFIG.colors.red;
        this.ctx.fillRect(this.game.deathCause.bullet.x - 3, this.game.deathCause.bullet.y - 8, 6, 16);
        
        // 子弹发光效果
        this.ctx.shadowColor = GAME_CONFIG.colors.red;
        this.ctx.shadowBlur = 15;
        this.ctx.fillRect(this.game.deathCause.bullet.x - 3, this.game.deathCause.bullet.y - 8, 6, 16);
      } else if (this.game.deathCause.type === 'collision') {
        // 突出显示致命敌机
        const enemy = this.game.deathCause.enemy;
        const size = enemy.type === 'small' ? 15 : enemy.type === 'medium' ? 20 : 30;
        
        this.ctx.fillStyle = GAME_CONFIG.colors.red;
        this.ctx.fillRect(enemy.x - size, enemy.y - size, size * 2, size * 2);
        
        // 敌机发光效果
        this.ctx.shadowColor = GAME_CONFIG.colors.red;
        this.ctx.shadowBlur = 20;
        this.ctx.fillRect(enemy.x - size, enemy.y - size, size * 2, size * 2);
      }
      
      // 给玩家飞机添加白色发光效果
      if (this.game.player) {
        this.ctx.shadowColor = GAME_CONFIG.colors.white;
        this.ctx.shadowBlur = 20;
        this.game.player.render(this.ctx);
      }
      
      this.ctx.restore();
    }
    
    // 渲染UI
    this.renderUI();
  }

  // 客机死亡场景渲染（高亮死亡原因、闪烁效果）
  renderPassengerDying() {
    // 继续渲染游戏场景
    this.game.background.render(this.ctx);
    
    if (this.game.player) {
      this.game.player.render(this.ctx);
    }
    
    this.game.wingmen.forEach(wingman => wingman.render(this.ctx));
    this.game.enemies.forEach(enemy => enemy.render(this.ctx));
    this.game.passengers.forEach(passenger => passenger.render(this.ctx));
    this.game.playerBullets.forEach(bullet => bullet.render(this.ctx));
    this.game.enemyBullets.forEach(bullet => bullet.render(this.ctx));
    this.game.missiles.forEach(missile => missile.render(this.ctx));
    this.game.items.forEach(item => item.render(this.ctx));
    this.game.effects.forEach(effect => effect.render(this.ctx));
    
    // 高亮显示客机死亡原因 - 突出显示碰撞对象
    if (this.game.passengerDeathCause) {
      this.ctx.save();
      
      // 闪烁效果（与玩家死亡相同的逻辑）
      const flashAlpha = (Math.floor(this.game.deathTimer / 10) % 2) ? 1.0 : 0.6;
      this.ctx.globalAlpha = flashAlpha;
      
      if (this.game.passengerDeathCause.type === 'bullet') {
        // 突出显示致命子弹
        this.ctx.fillStyle = GAME_CONFIG.colors.red;
        this.ctx.fillRect(this.game.passengerDeathCause.bullet.x - 3, this.game.passengerDeathCause.bullet.y - 8, 6, 16);
        
        // 子弹发光效果
        this.ctx.shadowColor = GAME_CONFIG.colors.red;
        this.ctx.shadowBlur = 15;
        this.ctx.fillRect(this.game.passengerDeathCause.bullet.x - 3, this.game.passengerDeathCause.bullet.y - 8, 6, 16);
      } else if (this.game.passengerDeathCause.type === 'collision') {
        // 突出显示致命碰撞对象
        const enemy = this.game.passengerDeathCause.enemy;
        let size = 30; // 默认大小
        
        if (enemy.type === 'player') {
          size = 25; // 玩家大小
        } else if (enemy.type === 'small') {
          size = 15;
        } else if (enemy.type === 'medium') {
          size = 20;
        } else if (enemy.type === 'large') {
          size = 30;
        }
        
        this.ctx.fillStyle = GAME_CONFIG.colors.red;
        this.ctx.fillRect(enemy.x - size, enemy.y - size, size * 2, size * 2);
        
        // 碰撞对象发光效果
        this.ctx.shadowColor = GAME_CONFIG.colors.red;
        this.ctx.shadowBlur = 20;
        this.ctx.fillRect(enemy.x - size, enemy.y - size, size * 2, size * 2);
      }
      
      // 给客机添加白色发光效果（与玩家死亡相同的逻辑）
      const passenger = this.game.passengerDeathCause.passenger;
      if (passenger) {
        this.ctx.shadowColor = GAME_CONFIG.colors.white;
        this.ctx.shadowBlur = 20;
        passenger.render(this.ctx); // 渲染客机本身的图片轮廓，而不是白色矩形
      }
      
      this.ctx.restore();
    }
    
    // 渲染UI
    this.renderUI();
  }

  // 游戏场景渲染（所有游戏对象的渲染协调）
  renderGame() {
    // 渲染游戏场景（供暂停时使用）
    if (this.game.player) {
      this.game.player.render(this.ctx);
    }
    
    this.game.wingmen.forEach(wingman => wingman.render(this.ctx));
    this.game.enemies.forEach(enemy => enemy.render(this.ctx));
    this.game.passengers.forEach(passenger => passenger.render(this.ctx)); // 渲染客机
    this.game.cargoPlanes.forEach(cargo => cargo.render(this.ctx)); // 渲染货机
    this.game.playerBullets.forEach(bullet => bullet.render(this.ctx));
    this.game.enemyBullets.forEach(bullet => bullet.render(this.ctx));
    this.game.missiles.forEach(missile => missile.render(this.ctx));
    this.game.items.forEach(item => item.render(this.ctx));
    this.game.effects.forEach(effect => effect.render(this.ctx));
    
    // 渲染轰炸机
    if (this.game.powerupManager) {
      this.game.powerupManager.renderBombers(this.ctx);
    }
    

    
    this.renderUI();
    this.game.renderNotifications();
  }

  // 游戏内UI渲染（分数、等级、连击、生命、装备）
  renderUI() {
    // 渲染任务进度系统（移到左上角）
    this.renderMissionProgress();
    
    // 移除右侧垂直血条，现在在左边显示横向血条
    // this.renderHealthBar();

    // 渲染左下角暂停按钮
    this.renderGameButtons();
  }
  
  // 任务进度渲染（紧凑状态栏设计）
  renderMissionProgress() {
    // 无尽模式下完全不显示任务相关UI
    if (!this.game.missionSystemEnabled) return;
    
    // 只在任务系统启用且游戏进行中时显示
    if (this.game.gameState !== 'playing') return;
    
    const startX = 15;
    const startY = 60; // 再往下移一点
    const lineHeight = 22;
    const uniformFont = 'bold 16px Arial'; // 统一字体大小
    
    // 使用平滑动画的显示进度值
    const progress = this.game.displayProgress || 0;
    
    // 计算击杀进度数据
    const killRatio = this.game.calculateKillProgressRatio();
    const progressPerTask = 1 / this.game.totalMissions;
    const maxKillContribution = progressPerTask * 0.75;
    const killPercent = (killRatio * maxKillContribution * 100).toFixed(1);
    
    let currentY = startY;
    
    // 1. 阶段信息（统一字体）
    if (this.game.battlePhaseManager) {
      const phaseInfo = this.game.battlePhaseManager.getCurrentPhaseInfo();
      const phaseNames = {
        'warmup': '热身期',
        'intense': '高强度期', 
        'rest': '休息期',
        'passenger': '客机任务',
        'passenger_end': '任务结束',
        'boss': 'Boss阶段'
      };
      const phaseName = phaseNames[phaseInfo.phase] || phaseInfo.phase;
      
      this.ctx.fillStyle = '#AAAAAA';
      this.ctx.font = uniformFont; // 统一字体
      this.ctx.textAlign = 'left';
      this.ctx.fillText(`[${phaseName}] ${phaseInfo.progress}`, startX, currentY);
      currentY += lineHeight;
    }
    
    // 2. 击杀信息（统一字体）
    this.ctx.font = uniformFont; // 统一字体
    this.ctx.textAlign = 'left';
    
    // 黑色描边
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 3;
    this.ctx.strokeText(`击杀 ${this.game.currentTaskKills}个 (+${killPercent}%)`, startX, currentY);
    
    // 红色文字
    this.ctx.fillStyle = '#CC0000';
    this.ctx.fillText(`击杀 ${this.game.currentTaskKills}个 (+${killPercent}%)`, startX, currentY);
    currentY += lineHeight;
    
    // 3. 客机任务信息（统一字体）
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = uniformFont; // 统一字体
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`客机任务 ${this.game.completedMissions}/${this.game.totalMissions}`, startX, currentY);
    currentY += lineHeight;
    
    // 4. 游戏进度标签和进度条（修复间距）
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = uniformFont; // 统一字体
    this.ctx.textAlign = 'left';
    this.ctx.fillText('游戏进度', startX, currentY);
    currentY += 5; // 改为与HP标签一致的间距
    
    const barWidth = 120;
    const barHeight = 8;
    const barX = startX;
    const barY = currentY;
    
    // 进度条背景
    this.ctx.fillStyle = '#333333';
    this.ctx.fillRect(barX, barY, barWidth, barHeight);
    
    // 进度条填充
    const progressWidth = barWidth * progress;
    if (progressWidth > 0) {
      this.ctx.fillStyle = '#0099CC';
      this.ctx.fillRect(barX, barY, progressWidth, barHeight);
    }
    
    // 白色边框
    this.ctx.strokeStyle = '#FFFFFF';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(barX, barY, barWidth, barHeight);
    
    // 进度百分比（统一字体）
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = uniformFont; // 统一字体
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`${(progress * 100).toFixed(1)}%`, barX + barWidth + 8, barY + 6);
    
    currentY += 30; // 增加间距，避免进度条与HP标签重叠
    
    // 5. HP条
    this.renderCompactHealthBar(startX, currentY, uniformFont);
  }
  
  // 紧凑生命条渲染（修复间距重叠）
  renderCompactHealthBar(x, y, uniformFont) {
    if (!this.game.player) return;
    
    // HP标签（修复间距）
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = uniformFont; // 统一字体
    this.ctx.textAlign = 'left';
    
    // 获取当前生命数，确保不小于0
    const currentLives = Math.max(0, this.game.player.lives || 0);
    const maxLives = 3; // 游戏设计的总生命数
    
    // 显示"HP 当前生命/总生命"
    this.ctx.fillText(`HP ${currentLives}/${maxLives}`, x, y);
    
    const barWidth = 120;
    const barHeight = 8;
    const barY = y + 5; // 增加间距，避免与HP标签重叠
    const healthPercent = this.game.player.health / this.game.player.maxHealth;
    
    // 生命条背景
    this.ctx.fillStyle = '#333333';
    this.ctx.fillRect(x, barY, barWidth, barHeight);
    
    // 生命条填充
    const healthWidth = barWidth * healthPercent;
    if (healthWidth > 0) {
      let healthColor = '#CC0000';
      
      // 低血量闪烁
      if (healthPercent <= 0.25 && Math.floor(Date.now() / 200) % 2) {
        healthColor = '#FF4444';
      }
      
      this.ctx.fillStyle = healthColor;
      this.ctx.fillRect(x, barY, healthWidth, barHeight);
    }
    
    // 白色边框
    this.ctx.strokeStyle = '#FFFFFF';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(x, barY, barWidth, barHeight);
  }
  
  // 渲染左下角游戏按钮：自动测试、轰炸、暂停
  renderGameButtons() {
    const buttonSize = 40;
    const margin = 20;
    const spacing = 10; // 按钮之间的间距
    
    // 暂停按钮（最下方）
    const pauseButtonX = margin;
    const pauseButtonY = this.screenHeight - buttonSize - margin;
    
    // 绘制暂停按钮背景
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    this.ctx.fillRect(pauseButtonX, pauseButtonY, buttonSize, buttonSize);
    
    // 绘制暂停按钮边框
    this.ctx.strokeStyle = '#FFFFFF';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(pauseButtonX, pauseButtonY, buttonSize, buttonSize);
    
    // 绘制暂停图标（两条竖线）
    this.ctx.fillStyle = '#000000';
    const lineWidth = 4;
    const lineHeight = 20;
    const pauseCenterX = pauseButtonX + buttonSize / 2;
    const pauseCenterY = pauseButtonY + buttonSize / 2;
    
    // 左竖线
    this.ctx.fillRect(pauseCenterX - 8, pauseCenterY - lineHeight / 2, lineWidth, lineHeight);
    // 右竖线
    this.ctx.fillRect(pauseCenterX + 4, pauseCenterY - lineHeight / 2, lineWidth, lineHeight);
    
    // 轰炸按钮（暂停按钮上方）
    const bombButtonX = margin;
    const bombButtonY = pauseButtonY - buttonSize - spacing;
    
    // 绘制轰炸按钮背景
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    this.ctx.fillRect(bombButtonX, bombButtonY, buttonSize, buttonSize);
    
    // 绘制轰炸按钮边框
    this.ctx.strokeStyle = '#FFFFFF';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(bombButtonX, bombButtonY, buttonSize, buttonSize);
    
    // 绘制"轰炸"文字和数量
    this.ctx.fillStyle = '#FF0000'; // 红色文字
    this.ctx.font = 'bold 10px Arial';
    this.ctx.textAlign = 'center';
    const bombCenterX = bombButtonX + buttonSize / 2;
    const bombCenterY = bombButtonY + buttonSize / 2;
    
    this.ctx.fillText('轰炸', bombCenterX, bombCenterY - 2);
    this.ctx.fillText(this.game.sessionBombs || 0, bombCenterX, bombCenterY + 10);
    
    // 自动测试按钮（轰炸按钮上方）
    const autoTestButtonX = margin;
    const autoTestButtonY = bombButtonY - buttonSize - spacing;
    
    // 按钮背景颜色根据状态变化
    const autoTestBgColor = this.game.autoTestEnabled ? 'rgba(255, 165, 0, 0.8)' : 'rgba(255, 0, 0, 0.8)'; // 橙色开启，红色关闭
    this.ctx.fillStyle = autoTestBgColor;
    this.ctx.fillRect(autoTestButtonX, autoTestButtonY, buttonSize, buttonSize);
    
    // 绘制自动测试按钮边框
    this.ctx.strokeStyle = '#FFFFFF';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(autoTestButtonX, autoTestButtonY, buttonSize, buttonSize);
    
    // 绘制"自动"文字和状态
    this.ctx.fillStyle = '#FFFFFF'; // 白色文字
    this.ctx.font = 'bold 10px Arial';
    this.ctx.textAlign = 'center';
    const autoTestCenterX = autoTestButtonX + buttonSize / 2;
    const autoTestCenterY = autoTestButtonY + buttonSize / 2;
    
    this.ctx.fillText('自动', autoTestCenterX, autoTestCenterY - 2);
    this.ctx.fillText(this.game.autoTestEnabled ? '开' : '关', autoTestCenterX, autoTestCenterY + 10);
  }

}

export { SkillUI, GameUI }; 