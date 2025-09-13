// 菜单系统 - 游戏菜单界面管理器
import { GAME_CONFIG } from '../config/GameConfig.js';

class MenuSystem {
  constructor(game) {
    this.game = game;
    this.ctx = game.ctx;
    this.screenWidth = game.screenWidth;
    this.screenHeight = game.screenHeight;
  }

  // 主菜单触摸响应
  handleMenuTouch(x, y) {
    const centerX = this.screenWidth / 2;
    const centerY = this.screenHeight / 2;
    
    // 开始游戏按钮
    if (x >= centerX - 100 && x <= centerX + 100 && 
        y >= centerY - 20 && y <= centerY + 20) {
      this.game.startGame();
      return;
    }
    
    // 商店按钮
    if (x >= centerX - 100 && x <= centerX + 100 && 
        y >= centerY + 40 && y <= centerY + 80) {
      this.game.gameState = 'shop';
      return;
    }
    


  }

  // 暂停菜单触摸响应
  handlePauseMenuTouch(x, y) {
    // 暂停菜单按钮检测 - 精确的按钮区域
    const centerX = this.screenWidth / 2;
    const centerY = this.screenHeight / 2;
    
    // 继续游戏按钮 (上方)
    if (x >= centerX - 100 && x <= centerX + 100 && 
        y >= centerY - 80 && y <= centerY - 40) {
      this.game.gameState = 'playing';
      return;
    }
    
    // 重新开始按钮 (中间)
    if (x >= centerX - 100 && x <= centerX + 100 && 
        y >= centerY - 20 && y <= centerY + 20) {
      // 重新开始：先重置到主菜单状态，再开始新的任务游戏
      this.game.resetGame(); // 重置所有状态包括missionSystemEnabled
      this.game.startGame(); // 开始新的任务模式游戏
      return;
    }
    
    // 返回主菜单按钮 (下方)
    if (x >= centerX - 100 && x <= centerX + 100 && 
        y >= centerY + 40 && y <= centerY + 80) {
      this.game.resetGame();
      return;
    }
  }
  
  // 游戏结束界面触摸响应（简化版本）
  handleGameOverTouch(x, y) {
    const centerX = this.screenWidth / 2;
    const centerY = this.screenHeight / 2;
    
    // 确认按钮（返回主菜单）
    if (x >= centerX - 60 && x <= centerX + 60 && 
        y >= centerY + 50 && y <= centerY + 90) {
      this.game.resetGame();
      return;
    }
  }

  // 任务完成界面触摸响应
  handleMissionCompleteTouch(x, y) {
    const centerX = this.screenWidth / 2;
    const centerY = this.screenHeight / 2;
    
    // 结束任务按钮
    if (x >= centerX - 120 && x <= centerX - 20 && 
        y >= centerY + 50 && y <= centerY + 90) {
      this.game.resetGame();
      return;
    }
    
    // 继续飞行按钮（无尽模式）
    if (x >= centerX + 20 && x <= centerX + 120 && 
        y >= centerY + 50 && y <= centerY + 90) {
      // 禁用任务系统，切换到无尽模式
      this.game.missionSystemEnabled = false;
      this.game.gameState = 'playing';
      // 无尽模式下不显示通知，直接进入游戏
      return;
    }
  }

  // 护航失败界面触摸响应
  handlePassengerFailedTouch(x, y) {
    const centerX = this.screenWidth / 2;
    const centerY = this.screenHeight / 2;
    
    // 重新开始按钮
    if (x >= centerX - 120 && x <= centerX - 20 && 
        y >= centerY + 50 && y <= centerY + 90) {
      this.game.resetGame();
      return;
    }
    
    // 返回主菜单按钮
    if (x >= centerX + 20 && x <= centerX + 120 && 
        y >= centerY + 50 && y <= centerY + 90) {
      this.game.gameState = 'menu';
      return;
    }
  }

  // 主菜单渲染（标题、开始、商店、积分显示）
  renderMenu() {
    const centerX = this.screenWidth / 2;
    const centerY = this.screenHeight / 2;
    
    this.ctx.fillStyle = GAME_CONFIG.colors.white;
    this.ctx.font = 'bold 48px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('风暴之书', centerX, centerY - 60);
    
    // 开始游戏按钮
    this.ctx.fillStyle = GAME_CONFIG.colors.green;
    this.ctx.fillRect(centerX - 100, centerY - 20, 200, 40);
    this.ctx.strokeStyle = GAME_CONFIG.colors.white;
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(centerX - 100, centerY - 20, 200, 40);
    
    this.ctx.fillStyle = GAME_CONFIG.colors.white;
    this.ctx.font = 'bold 24px Arial';
    this.ctx.fillText('开始', centerX, centerY + 5);
    
    // 商店按钮
    this.ctx.fillStyle = GAME_CONFIG.colors.green;
    this.ctx.fillRect(centerX - 100, centerY + 40, 200, 40);
    this.ctx.strokeStyle = GAME_CONFIG.colors.white;
    this.ctx.strokeRect(centerX - 100, centerY + 40, 200, 40);
    
    this.ctx.fillStyle = GAME_CONFIG.colors.white;
    this.ctx.font = 'bold 24px Arial';
    this.ctx.fillText('商店', centerX, centerY + 65);
    


    
    // 显示击杀数据
    this.ctx.font = '18px Arial';
    this.ctx.fillStyle = GAME_CONFIG.colors.yellow;
    this.ctx.fillText(`击杀: ${this.game.dataManager.getTotalKills()}`, centerX, centerY + 160);
    this.ctx.fillText(`最高击杀: ${this.game.dataManager.getHighestKills()}`, centerX, centerY + 180);
    this.ctx.fillText(`拯救: ${this.game.dataManager.getTotalRescues()}`, centerX, centerY + 200);
  }

  // 暂停画面渲染（半透明遮罩、暂停文字）
  renderPaused() {
    // 继续渲染游戏场景但稍暗
    this.game.renderGame();
    
    // 半透明遮罩
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.ctx.fillRect(0, 0, this.screenWidth, this.screenHeight);
    
    // 暂停文字
    this.ctx.fillStyle = GAME_CONFIG.colors.white;
    this.ctx.font = 'bold 48px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('游戏已暂停', this.screenWidth / 2, this.screenHeight / 2 - 20);
    
    this.ctx.font = '24px Arial';
    this.ctx.fillText('点击屏幕继续', this.screenWidth / 2, this.screenHeight / 2 + 40);
  }
  
  // 暂停菜单渲染（继续、重新开始、返回主菜单）
  renderPauseMenu() {
    // 继续渲染游戏场景但更暗
    this.game.renderGame();
    
    // 深色半透明遮罩
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(0, 0, this.screenWidth, this.screenHeight);
    
    const centerX = this.screenWidth / 2;
    const centerY = this.screenHeight / 2;
    
    // 标题
    this.ctx.fillStyle = GAME_CONFIG.colors.white;
    this.ctx.font = 'bold 36px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('游戏暂停', centerX, centerY - 120);
    
    // 继续游戏按钮
    this.ctx.fillStyle = GAME_CONFIG.colors.green;
    this.ctx.fillRect(centerX - 100, centerY - 80, 200, 40);
    this.ctx.strokeStyle = GAME_CONFIG.colors.white;
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(centerX - 100, centerY - 80, 200, 40);
    
    this.ctx.fillStyle = GAME_CONFIG.colors.white;
    this.ctx.font = 'bold 20px Arial';
    this.ctx.fillText('继续游戏', centerX, centerY - 55);
    
    // 重新开始按钮
    this.ctx.fillStyle = GAME_CONFIG.colors.red;
    this.ctx.fillRect(centerX - 100, centerY - 20, 200, 40);
    this.ctx.strokeStyle = GAME_CONFIG.colors.white;
    this.ctx.strokeRect(centerX - 100, centerY - 20, 200, 40);
    
    this.ctx.fillStyle = GAME_CONFIG.colors.white;
    this.ctx.fillText('重新开始', centerX, centerY + 5);
    
    // 返回主菜单按钮
    this.ctx.fillStyle = GAME_CONFIG.colors.orange;
    this.ctx.fillRect(centerX - 100, centerY + 40, 200, 40);
    this.ctx.strokeStyle = GAME_CONFIG.colors.white;
    this.ctx.strokeRect(centerX - 100, centerY + 40, 200, 40);
    
    this.ctx.fillStyle = GAME_CONFIG.colors.white;
    this.ctx.font = 'bold 20px Arial';
    this.ctx.fillText('返回主菜单', centerX, centerY + 65);
  }

  // 游戏结束界面（简化版本）
  renderGameOver() {
    // 半透明背景
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(0, 0, this.screenWidth, this.screenHeight);
    
    const centerX = this.screenWidth / 2;
    const centerY = this.screenHeight / 2;
    
    // 鼓励文字
    this.ctx.fillStyle = GAME_CONFIG.colors.white;
    this.ctx.font = 'bold 32px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('已经很棒了，继续加油！', centerX, centerY - 50);
    
    // 任务进度显示（如果有的话）
    if (this.game.missionSystemEnabled && this.game.totalMissions > 0) {
      this.ctx.font = '20px Arial';
      this.ctx.fillStyle = GAME_CONFIG.colors.yellow;
      this.ctx.fillText(`任务进度: ${this.game.completedMissions}/${this.game.totalMissions}`, centerX, centerY - 10);
    }
    
    // 击杀统计
    this.ctx.font = '18px Arial';
    this.ctx.fillStyle = GAME_CONFIG.colors.white;
    this.ctx.fillText(`本局击杀: ${this.game.killCount}`, centerX, centerY + 20);
    
    // 确认按钮（单个按钮，居中）
    this.ctx.fillStyle = GAME_CONFIG.colors.green;
    this.ctx.fillRect(centerX - 60, centerY + 50, 120, 40);
    this.ctx.strokeStyle = GAME_CONFIG.colors.white;
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(centerX - 60, centerY + 50, 120, 40);
    
    this.ctx.fillStyle = GAME_CONFIG.colors.white;
    this.ctx.font = '20px Arial';
    this.ctx.fillText('确认', centerX, centerY + 75);
  }

  // 任务完成界面渲染
  renderMissionComplete() {
    // 半透明背景
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(0, 0, this.screenWidth, this.screenHeight);
    
    const centerX = this.screenWidth / 2;
    const centerY = this.screenHeight / 2;
    
    // 标题
    this.ctx.fillStyle = GAME_CONFIG.colors.green;
    this.ctx.font = 'bold 42px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('客机任务完成！', centerX, centerY - 100);
    
    // 任务统计
    this.ctx.fillStyle = GAME_CONFIG.colors.white;
    this.ctx.font = '24px Arial';
    this.ctx.fillText(`拯救客机: ${this.game.missionCount}/${this.game.totalMissions}`, centerX, centerY - 40);
    this.ctx.fillText(`本局击杀: ${this.game.killCount}`, centerX, centerY - 10);
    
    // 结束任务按钮
    this.ctx.fillStyle = GAME_CONFIG.colors.green;
    this.ctx.fillRect(centerX - 120, centerY + 50, 100, 40);
    this.ctx.strokeStyle = GAME_CONFIG.colors.white;
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(centerX - 120, centerY + 50, 100, 40);
    
    this.ctx.fillStyle = GAME_CONFIG.colors.white;
    this.ctx.font = '18px Arial';
    this.ctx.fillText('结束', centerX - 70, centerY + 75);
    
    // 继续飞行按钮（无尽模式）
    this.ctx.fillStyle = GAME_CONFIG.colors.orange;
    this.ctx.fillRect(centerX + 20, centerY + 50, 100, 40);
    this.ctx.strokeStyle = GAME_CONFIG.colors.white;
    this.ctx.strokeRect(centerX + 20, centerY + 50, 100, 40);
    
    this.ctx.fillStyle = GAME_CONFIG.colors.white;
    this.ctx.fillText('继续', centerX + 70, centerY + 75);
  }

  // 护航失败界面渲染
  renderPassengerFailed() {
    // 半透明背景
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(0, 0, this.screenWidth, this.screenHeight);
    
    const centerX = this.screenWidth / 2;
    const centerY = this.screenHeight / 2;
    
    // 主标题 - 鼓励色调
    this.ctx.fillStyle = GAME_CONFIG.colors.orange;
    this.ctx.font = 'bold 36px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('你已经做得很棒了！', centerX, centerY - 120);
    
    // 副标题
    this.ctx.fillStyle = GAME_CONFIG.colors.white;
    this.ctx.font = '24px Arial';
    this.ctx.fillText('守护客机是艰难的任务', centerX, centerY - 80);
    
    // 成绩统计
    this.ctx.font = '20px Arial';
    this.ctx.fillText(`击杀敌机: ${this.game.killCount}`, centerX, centerY - 40);
    if (this.game.missionCount > 0) {
      this.ctx.fillText(`成功护航: ${this.game.missionCount}`, centerX, centerY - 10);
    }
    
    // 重新开始按钮
    this.ctx.fillStyle = GAME_CONFIG.colors.green;
    this.ctx.fillRect(centerX - 120, centerY + 50, 100, 40);
    this.ctx.strokeStyle = GAME_CONFIG.colors.white;
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(centerX - 120, centerY + 50, 100, 40);
    
    this.ctx.fillStyle = GAME_CONFIG.colors.white;
    this.ctx.font = '18px Arial';
    this.ctx.fillText('重新开始', centerX - 70, centerY + 75);
    
    // 返回主菜单按钮
    this.ctx.fillStyle = GAME_CONFIG.colors.shadow;
    this.ctx.fillRect(centerX + 20, centerY + 50, 100, 40);
    this.ctx.strokeStyle = GAME_CONFIG.colors.white;
    this.ctx.strokeRect(centerX + 20, centerY + 50, 100, 40);
    
    this.ctx.fillStyle = GAME_CONFIG.colors.white;
    this.ctx.fillText('主菜单', centerX + 70, centerY + 75);
  }
}

export { MenuSystem }; 