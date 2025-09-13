// 风暴之书 - 敌机子弹类模块

import { GAME_CONFIG } from '../config/GameConfig.js';

// 敌机子弹类
class EnemyBullet {
  constructor(x, y, speed, gameInstance = null, enemyType = 'medium') {
    this.x = x;
    this.y = y;
    this.speed = speed;
    this.width = 12;  // 稍微调大一点适应图片
    this.height = 16;
    this.gameInstance = gameInstance;
    this.enemyType = enemyType;
    
    // 速度分量，支持各方向移动（默认向下）
    this.velocityX = 0;
    this.velocityY = speed;
    
    // 根据敌机类型选择子弹图片风格
    this.bulletImageIndex = this.selectBulletImage(enemyType);
    
    // 弹幕系统属性
    this.imageType = 'bullet';        // 图片类型：bullet
    this.imageName = 'bullet_02.png'; // 图片名字，默认使用bullet_02.png
    this.lifeTime = 0;                // 生命周期
  }
  
  selectBulletImage(enemyType) {
    // 不同敌机类型使用不同风格的子弹
    // 现在只有3个bullet图片，所以所有类型都使用0-2的索引
    switch (enemyType) {
      case 'medium':
        // 中型敌机：使用01-03（简单子弹）
        return Math.floor(Math.random() * 3);
      case 'large': 
        // 大型敌机：使用01-03（中等子弹）
        return Math.floor(Math.random() * 3);
      case 'boss':
        // Boss：使用01-03（强力子弹）
        return Math.floor(Math.random() * 3);
      default:
        return Math.floor(Math.random() * 3);
    }
  }
  
    update() {
    // 使用速度分量更新位置
    this.x += this.velocityX;
    this.y += this.velocityY;
    
    // 生命周期管理
    if (this.lifeTime > 0) {
      this.lifeTime--;
      if (this.lifeTime <= 0) {
        // 子弹生命周期结束，标记为需要销毁
        this.shouldDestroy = true;
      }
    }
    
    // 边界检测：如果子弹离开屏幕，标记为需要销毁
    if (this.y > this.gameInstance.screenHeight + 50 || 
        this.y < -50 || 
        this.x > this.gameInstance.screenWidth + 50 || 
        this.x < -50) {
      this.shouldDestroy = true;
    }
  }
  
  render(ctx) {
    // 尝试使用图片渲染
    let image = null;
    if (this.gameInstance && this.gameInstance.imageManager) {
      // 使用标准的bullet图片
      image = this.gameInstance.imageManager.getEnemyBulletImage(this.imageName);
    }
    
    if (image && image.complete) {
      // 根据敌机类型调整子弹大小
      let renderWidth = this.width;
      let renderHeight = this.height;
      
      // 大型敌机和Boss的子弹放大3倍
      if (this.enemyType === 'large' || this.enemyType === 'boss') {
        renderWidth = this.width * 3;
        renderHeight = this.height * 3;
      }
      
      // 使用图片渲染（放大1.5倍）
      const scale = 1.5;
      const scaledWidth = renderWidth * scale;
      const scaledHeight = renderHeight * scale;
      
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
}

export { EnemyBullet }; 