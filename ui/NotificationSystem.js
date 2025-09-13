// 通知系统 - 游戏通知管理器
import { GAME_CONFIG } from '../config/GameConfig.js';

class NotificationSystem {
  constructor(game) {
    this.game = game;
    this.ctx = game.ctx;
    this.screenWidth = game.screenWidth;
    this.screenHeight = game.screenHeight;
  }

  // 显示游戏开始提示（删除提示，直接开始）
  showStartTips() {
    // 不再显示提示，直接开始
    this.game.startTips = null;
  }
  
  // 更新游戏开始序列（准备→飞行→提示→战斗）
  updateGameStartSequence() {
    this.game.startTimer++;
    
    if (this.game.gameStartPhase === 'ready') {
      // 阶段1：准备阶段，1秒后进入飞行阶段
      if (this.game.startTimer > 60) {
        this.game.gameStartPhase = 'flying';
        this.game.startTimer = 0;
      }
    } else if (this.game.gameStartPhase === 'flying') {
      // 阶段2：飞机缓缓飞入，1.5秒后进入提示阶段（提示已在开始时显示）
      if (this.game.startTimer > 90) {
        this.game.gameStartPhase = 'tips';
        this.game.startTimer = 0;
        // 不再重复显示提示，因为已在游戏开始时显示了
      }
    } else if (this.game.gameStartPhase === 'tips') {
      // 阶段3：显示提示，2.5秒后开始战斗
      if (this.game.startTimer > 150) {
        this.game.gameStartPhase = 'battle';
        this.game.startTimer = 0;
        this.game.startTips = null;
      }
    }
    // 阶段4：battle - 正常游戏进行
  }

  // 添加道具通知（左侧显示、特殊处理）
  addNotification(text) {
    // 无尽模式下不显示通知
    if (!this.game.missionSystemEnabled) return;
    
    // 道具通知 - 左侧UI区域显示
    this.game.currentItem = {
      text: text,
      life: 180,
      alpha: 0,
      slideProgress: 0
    };
  }
  


  // 更新所有通知（淡入淡出、生命周期管理）
  updateNotifications() {
    // 更新道具通知
    if (this.game.currentItem) {
      this.game.currentItem.life--;
      
      // 淡入动画
      if (this.game.currentItem.slideProgress < 1) {
        this.game.currentItem.slideProgress += 0.08;
        this.game.currentItem.slideProgress = Math.min(1, this.game.currentItem.slideProgress);
        this.game.currentItem.alpha = this.game.currentItem.slideProgress;
      } else {
        // 淡出
        if (this.game.currentItem.life < 40) {
          this.game.currentItem.alpha = this.game.currentItem.life / 40;
        } else {
          this.game.currentItem.alpha = 1;
        }
      }
      
      if (this.game.currentItem.life <= 0) {
        this.game.currentItem = null;
      }
    }
    

    
    // 更新开始提示 - 渐入渐出（与ORIGIN一致）
    if (this.game.startTips) {
      this.game.startTips.life--;
      
      const elapsed = this.game.startTips.maxLife - this.game.startTips.life;
      const fadeInTime = 30; // 0.5秒渐入，与ORIGIN一致
      const fadeOutTime = 30; // 0.5秒渐出，与ORIGIN一致
      
      if (elapsed < fadeInTime) {
        // 渐入阶段
        this.game.startTips.alpha = elapsed / fadeInTime;
      } else if (this.game.startTips.life < fadeOutTime) {
        // 渐出阶段
        this.game.startTips.alpha = this.game.startTips.life / fadeOutTime;
      } else {
        // 正常显示阶段
        this.game.startTips.alpha = 1;
      }
      
      if (this.game.startTips.life <= 0) {
        this.game.startTips = null;
      }
    }
  }

  // 渲染所有通知（道具、连击、游戏提示）
  renderNotifications() {
    // 左侧：道具通知（与UI信息集成）
    if (this.game.currentItem && this.game.currentItem.alpha > 0) {
      this.ctx.save();
      this.ctx.globalAlpha = this.game.currentItem.alpha;
      
      // 道具通知样式 - 左侧显示
      this.ctx.fillStyle = GAME_CONFIG.colors.yellow;
      this.ctx.font = 'bold 16px Arial'; // 统一字体大小与状态栏一致
      this.ctx.textAlign = 'left';
      this.ctx.strokeStyle = 'black';
      this.ctx.lineWidth = 1;
      
      // 在商店界面时，显示在四个购买按钮下方
      if (this.game.gameState === 'shop') {
        const centerX = this.screenWidth / 2;
        this.ctx.textAlign = 'center';
        this.ctx.strokeText(this.game.currentItem.text, centerX, 480);
        this.ctx.fillText(this.game.currentItem.text, centerX, 480);
      } else {
        // 紧跟状态栏下方显示，左对齐
        this.ctx.textAlign = 'left';
        this.ctx.strokeText(this.game.currentItem.text, 15, 210); // 调整位置适应新的状态栏高度
        this.ctx.fillText(this.game.currentItem.text, 15, 210);
      }
      
      this.ctx.restore();
    }
    

    
    // 中央：游戏开始提示（多行显示）
    if (this.game.startTips) {
      this.ctx.save();
      this.ctx.globalAlpha = this.game.startTips.alpha;
      
      // 开始提示样式 - 与ORIGIN保持一致
      this.ctx.fillStyle = GAME_CONFIG.colors.yellow;
      this.ctx.font = 'bold 28px Arial'; // 与ORIGIN一致
      this.ctx.textAlign = 'center';
      this.ctx.strokeStyle = 'black';
      this.ctx.lineWidth = 2; // 与ORIGIN一致
      
      // 多行显示，居中布局
      const startY = this.screenHeight / 2 - 40; // 与ORIGIN一致
      const lineHeight = 50; // 与ORIGIN一致
      
      this.game.startTips.lines.forEach((line, index) => {
        const y = startY + index * lineHeight;
        this.ctx.strokeText(line, this.screenWidth / 2, y);
        this.ctx.fillText(line, this.screenWidth / 2, y);
      });
      
      this.ctx.restore();
    }
  }
}

export { NotificationSystem }; 