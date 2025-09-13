// 风暴之书 - 爆炸效果模块

import { GAME_CONFIG } from '../config/GameConfig.js';

// 爆炸效果类
class ExplosionEffect {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 0;
    this.maxRadius = 60;
    this.life = 15; // 减少生命周期，让爆炸效果更快
    this.alpha = 1;
  }
  
  update() {
    this.life--;
    this.radius += 4; // 增加扩散速度
    this.alpha = this.life / 15; // 对应新的生命周期
  }
  
  render(ctx) {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.strokeStyle = GAME_CONFIG.colors.orange;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

// Boss警告效果类
class BossWarningEffect {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.scale = 0.5;
    this.alpha = 1;
    this.life = 60; // 减少到1秒
    this.flashTimer = 0;
    this.maxFlashes = 4; // 最多闪烁4次
    this.flashInterval = 15; // 每15帧闪烁一次
  }
  
  update() {
    this.life--;
    this.flashTimer++;
    
    if (this.scale < 1.2) { // 减少最大缩放
      this.scale += 0.01;
    }
    
    this.alpha = this.life > 30 ? 1 : (this.life / 30);
  }
  
  render(ctx) {
    ctx.save();
    
    // 限制闪烁次数
    const flashCount = Math.floor(this.flashTimer / this.flashInterval);
    if (flashCount < this.maxFlashes && Math.floor(this.flashTimer / this.flashInterval) % 2 === 0) {
      ctx.globalAlpha = this.alpha;
      ctx.fillStyle = GAME_CONFIG.colors.red;
      
      // 使用更小的字体避免溢出
      const fontSize = Math.min(28 * this.scale, 32);
      ctx.font = `bold ${fontSize}px Arial`;
      ctx.textAlign = 'center';
      
      // 检查文本宽度是否超出屏幕
      const text = '[警告] BOSS [警告]';
      const textMetrics = ctx.measureText(text);
      const textWidth = textMetrics.width;
      
      if (textWidth < this.x * 1.8) { // 确保文本不会溢出屏幕
        ctx.fillText(text, this.x, this.y);
      
      // 外发光效果
      ctx.shadowColor = GAME_CONFIG.colors.red;
        ctx.shadowBlur = 15;
        ctx.fillText(text, this.x, this.y);
      }
    }
    
    ctx.restore();
  }
}

// 导出效果类
export { ExplosionEffect, BossWarningEffect }; 