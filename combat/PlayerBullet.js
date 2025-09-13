// 风暴之书 - 玩家子弹类模块

import { GAME_CONFIG } from '../config/GameConfig.js';

// 玩家子弹类
class PlayerBullet {
  constructor(x, y, type, damage, tier, laserLevel = 0, gameInstance = null, isWingman = false, bulletStyle = 'single') {
    this.x = x;
    this.y = y;
    this.type = type;
    this.damage = damage;
    this.tier = tier;
    this.laserLevel = laserLevel;
    this.speed = GAME_CONFIG.player.bulletSpeed;
    this.gameInstance = gameInstance;
    this.isWingman = isWingman;
    this.bulletStyle = bulletStyle;
    
    // 根据轰炸等级调整子弹大小
    let sizeMultiplier = 1;
    if (laserLevel > 0) {
      sizeMultiplier = 1 + laserLevel * 0.5; // 轰炸等级越高，子弹越大
    }
    
    // this.width = (8 + tier * 2) * sizeMultiplier;  // 调大适应图片
    // this.height = (16 + tier * 3) * sizeMultiplier;
    this.width = 8 * sizeMultiplier;  // 固定大小，不随威力等级变化
    this.height = 16 * sizeMultiplier;
  }
  
  update() {
    this.y -= this.speed;
  }
  
  render(ctx) {
    // 使用新的图片子弹系统（完全取代Canvas矩形）
    let image = null;
    if (this.gameInstance && this.gameInstance.imageManager) {
      const bulletType = this.isWingman ? 'wingman' : this.bulletStyle;
      image = this.gameInstance.imageManager.getPlayerBulletImage(bulletType);
    }
    
    if (image && image.complete) {
      // 纯图片渲染 + 轰炸特效
      if (this.laserLevel > 0) {
        ctx.save();
        
        // 轰炸模式：图片+发光效果
        if (this.laserLevel >= 3) {
          ctx.shadowColor = GAME_CONFIG.colors[this.type];
          ctx.shadowBlur = 8 + this.laserLevel * 3;
        }
        
        // 绘制子弹图片（放大1.5倍）
        const scale = 1.5;
        const scaledWidth = this.width * scale;
        const scaledHeight = this.height * scale;
        
        ctx.drawImage(image, 
          this.x - scaledWidth/2, 
          this.y - scaledHeight/2, 
          scaledWidth, 
          scaledHeight
        );
        
        // 高等级轰炸：在图片上叠加炫酷光芒
        if (this.laserLevel >= 2) {
          ctx.shadowBlur = 0;
          ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.globalCompositeOperation = 'lighter'; // 叠加模式
          const coreWidth = this.width * 0.7;
          const coreHeight = this.height * 0.9;
          ctx.fillRect(this.x - coreWidth/2, this.y - coreHeight/2, coreWidth, coreHeight);
          ctx.globalCompositeOperation = 'source-over'; // 恢复正常模式
        }
        
        ctx.restore();
      } else {
        // 普通子弹：纯图片，炫酷简洁（放大1.5倍）
        const scale = 1.5;
        const scaledWidth = this.width * scale;
        const scaledHeight = this.height * scale;
        
        ctx.drawImage(image, 
          this.x - scaledWidth/2, 
          this.y - scaledHeight/2, 
          scaledWidth, 
          scaledHeight
        );
      }
    } else {
      // 后备渲染 - 确保子弹可见
      if (this.isWingman) {
        // 僚机子弹：蓝色小圆点
        ctx.fillStyle = '#4169E1'; // 蓝色
        ctx.beginPath();
        ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // 添加白色边框
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1;
        ctx.stroke();
      } else {
        // 延迟渲染：图片未加载完成时不渲染，等下一帧
        return;
      }
    }
  }
}

export { PlayerBullet }; 