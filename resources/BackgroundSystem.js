// 风暴之书 - 背景系统模块

import { GAME_CONFIG } from '../config/GameConfig.js';

// 背景系统类 - 单张背景图片 + 滚动效果
class BackgroundSystem {
  constructor() {
    // 获取屏幕尺寸
    this.screenWidth = GAME_CONFIG.canvas.width;
    this.screenHeight = GAME_CONFIG.canvas.height;
    
    // 滚动效果
    this.scrollY1 = 0;   // 第一张背景的Y位置
    this.scrollY2 = -this.screenHeight; // 第二张背景的Y位置（在上方）
    this.scrollSpeed = 0.5; // 滚动速度
    
    // 只使用一张背景图片
    this.background = null;
    this.loadBackground();
  }
  
  loadBackground() {
    // 只加载一张背景图片
    this.background = wx.createImage();
    this.background.src = 'resources/pic/background/background1.jpg';
  }
  
  update(gameTime, player = null) {
    // 简单的滚动更新
    this.scrollY1 += this.scrollSpeed;
    this.scrollY2 += this.scrollSpeed;
    
    // 当背景滚动出屏幕时，重置位置实现无缝循环
    if (this.scrollY1 >= this.screenHeight) {
      this.scrollY1 = this.scrollY2 - this.screenHeight;
    }
    if (this.scrollY2 >= this.screenHeight) {
      this.scrollY2 = this.scrollY1 - this.screenHeight;
    }
  }
  
  // 检查是否在场景切换中（兼容性方法）
  isSceneTransitioning() {
    return false; // 不再有场景切换
  }
  
  render(ctx) {
    // 绘制滚动的背景（直接拉伸到屏幕尺寸）
    if (this.background && this.background.complete) {
      // 绘制第一张背景（直接拉伸到逻辑屏幕尺寸）
      ctx.drawImage(
        this.background, 
        0, this.scrollY1, 
        this.screenWidth, this.screenHeight
      );
      
      // 绘制第二张背景（紧贴第一张，直接拉伸到逻辑屏幕尺寸）
      ctx.drawImage(
        this.background, 
        0, this.scrollY2, 
        this.screenWidth, this.screenHeight
      );
    } else {
      // 如果图片未加载完成，使用星空背景作为后备
      this.renderStarField(ctx);
    }
  }
  
  renderStarField(ctx) {
    // 后备的简单星空背景
    ctx.fillStyle = '#000020';
    ctx.fillRect(0, 0, this.screenWidth, this.screenHeight);
    
    // 简单的星星效果
    ctx.fillStyle = '#FFFFFF';
    for (let i = 0; i < 30; i++) {
      const x = (i * 137) % this.screenWidth;
      const y = (i * 197) % this.screenHeight;
      const size = (i % 3) + 1;
      ctx.fillRect(x, y, size, size);
    }
  }
}

// 导出BackgroundSystem类
export { BackgroundSystem }; 