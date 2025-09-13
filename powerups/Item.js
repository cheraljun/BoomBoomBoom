// 风暴之书 - 道具基类模块

import { GAME_CONFIG } from '../config/GameConfig.js';

// 道具类
class Item {
  constructor(x, y, type, gameInstance = null) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.speed = GAME_CONFIG.cargo.itemSpeed;
    this.size = GAME_CONFIG.cargo.itemSize;
    this.animationFrame = 0;
    this.startX = x;
    this.startY = y;
    this.gameInstance = gameInstance;
  }
  
  update() {
    this.animationFrame++;
    
    // S形曲线运动
    const progress = (this.y - this.startY) / 300;
    const curve = Math.sin(progress * Math.PI * 2) * 30;
    this.x = this.startX + curve;
    
    this.y += this.speed;
  }
  
  render(ctx) {
    const itemSize = 40; // 比敌机小一些
    
    // 尝试使用图片渲染
    let image = null;
    if (this.gameInstance && this.gameInstance.imageManager) {
      image = this.gameInstance.imageManager.getPowerupImage(this.type);
    }
    
    if (image && image.complete) {
      // 使用图片渲染（保持原始大小）
      ctx.drawImage(image, 
        this.x - itemSize/2, 
        this.y - itemSize/2, 
        itemSize, 
        itemSize
      );
    } else {
      // 后备渲染：小方块道具（保持原始大小）
      const boxSize = 30;
      ctx.fillStyle = this.getColor();
      ctx.fillRect(this.x - boxSize/2, this.y - boxSize/2, boxSize, boxSize);
    
    // 白色边框（保持原始大小）
    ctx.strokeStyle = GAME_CONFIG.colors.white;
    ctx.lineWidth = 1;
    ctx.strokeRect(this.x - boxSize/2, this.y - boxSize/2, boxSize, boxSize);
    
    // 文字标签
    ctx.fillStyle = GAME_CONFIG.colors.white;
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    const shortText = this.getShortText();
    ctx.fillText(shortText, this.x, this.y + 3);
    }
  }
  
  getShortText() {
    const textMap = {
      '双倍火力': '双倍',
      '轰炸': '轰炸',
      '追踪导弹': '导弹',
      '生命补给': '生命',
      '战斗僚机': '僚机'
    };
    return textMap[this.type] || this.type;
  }
  
  getColor() {
    const colors = {
      '双倍火力': GAME_CONFIG.colors.orange,
      '轰炸': GAME_CONFIG.colors.yellow,
      '追踪导弹': GAME_CONFIG.colors.green,
      '生命补给': GAME_CONFIG.colors.silver,
      '战斗僚机': GAME_CONFIG.colors.shadow
    };
    return colors[this.type] || GAME_CONFIG.colors.white;
  }
}

// 导出Item类
export { Item }; 