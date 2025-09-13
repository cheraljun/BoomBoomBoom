// 商店系统 - 装备商店系统
import { GAME_CONFIG } from '../config/GameConfig.js';

class ShopSystem {
  constructor(game) {
    this.game = game;
    this.ctx = game.ctx;
    this.screenWidth = game.screenWidth;
    this.screenHeight = game.screenHeight;
  }

  // 商店界面触摸响应（购买检测、返回检测）
  handleShopTouch(x, y) {
    const centerX = this.screenWidth / 2;
    

    
    // 轰炸购买按钮
    if (x >= centerX - 150 && x <= centerX + 150) {
      if (y >= 280 && y <= 320) {
        this.purchaseSessionBombs(1, 50);
        return;
      } else if (y >= 320 && y <= 360) {
        this.purchaseSessionBombs(2, 100);
        return;
      } else if (y >= 360 && y <= 400) {
        this.purchaseSessionBombs(3, 200);
        return;
      } else if (y >= 400 && y <= 440) {
        this.purchaseSessionBombs(4, 350);
        return;
      }
    }
    
    // 返回主菜单按钮
    const returnButtonY = this.screenHeight - 60;
    if (x >= centerX - 100 && x <= centerX + 100 && 
        y >= returnButtonY && y <= returnButtonY + 40) {
      this.game.gameState = 'menu';
      return;
    }
  }


  
      // 购买当局轰炸（当局结束后失效）
  purchaseSessionBombs(count, cost) {
    const totalKills = this.game.dataManager.getTotalKills();
    if (totalKills >= cost) {
      if (this.game.dataManager.spendKills(cost)) {
        this.game.sessionBombs += count;
        // 同步到玩家轰炸数量
        if (this.game.player) {
          this.game.player.superBombs = this.game.sessionBombs;
        }
        this.game.addNotification(`购买${count}个轰炸！当前共${this.game.sessionBombs}个轰炸`);
      }
    } else {
      this.game.addNotification('击杀数不足！');
    }
  }

  // 商店界面渲染（标题、击杀数、商品列表、返回按钮）
  renderShop() {
    const centerX = this.screenWidth / 2;
    const totalKills = this.game.dataManager.getTotalKills();
    
    // 标题
    this.ctx.fillStyle = GAME_CONFIG.colors.white;
    this.ctx.font = 'bold 32px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('商店', centerX, 30);
    
    // 当前击杀数
    this.ctx.font = '18px Arial';
    this.ctx.fillStyle = GAME_CONFIG.colors.yellow;
    this.ctx.fillText(`可用击杀: ${totalKills}`, centerX, 60);
    

    
    // 轰炸购买区域
    this.ctx.fillStyle = GAME_CONFIG.colors.white;
    this.ctx.font = 'bold 20px Arial';
    this.ctx.fillText('轰炸购买:', centerX, 260);
    
    this.renderShopButton(centerX, 280, '1个轰炸 - 50击杀', totalKills >= 50);
    this.renderShopButton(centerX, 320, '2个轰炸 - 100击杀', totalKills >= 100);
    this.renderShopButton(centerX, 360, '3个轰炸 - 200击杀', totalKills >= 200);
    this.renderShopButton(centerX, 400, '4个轰炸 - 350击杀', totalKills >= 350);
    
    // 返回主菜单按钮
    const returnButtonY = this.screenHeight - 60;
    this.ctx.fillStyle = GAME_CONFIG.colors.green;
    this.ctx.fillRect(centerX - 100, returnButtonY, 200, 40);
    this.ctx.strokeStyle = GAME_CONFIG.colors.white;
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(centerX - 100, returnButtonY, 200, 40);
    
    this.ctx.fillStyle = GAME_CONFIG.colors.white;
    this.ctx.font = 'bold 20px Arial';
    this.ctx.fillText('返回主菜单', centerX, returnButtonY + 25);
  }
  
  // 商店按钮渲染（可购买状态判断）
  renderShopButton(centerX, y, text, canAfford) {
    // 按钮背景
    this.ctx.fillStyle = canAfford ? GAME_CONFIG.colors.green : GAME_CONFIG.colors.shadow;
    this.ctx.fillRect(centerX - 150, y, 300, 40);
    
    // 按钮边框
    this.ctx.strokeStyle = GAME_CONFIG.colors.white;
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(centerX - 150, y, 300, 40);
    
    // 按钮文字
    this.ctx.fillStyle = GAME_CONFIG.colors.white;
    this.ctx.font = '18px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(text, centerX, y + 25);
  }
}

export { ShopSystem }; 