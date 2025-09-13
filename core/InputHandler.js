// 输入处理系统 - 触摸输入管理器
class InputHandler {
  constructor(game) {
    this.game = game;
    this.touching = false;
    this.touchStartTime = 0;
    this.lastTapTime = 0;
  }

  // 绑定微信小游戏触摸事件（开始、移动、结束）
  bindEvents() {
    wx.onTouchStart((e) => {
      const touch = e.touches[0];
      
      if (this.game.gameState === 'menu') {
        this.game.menuSystem.handleMenuTouch(touch.clientX, touch.clientY);
        return;
      }
      
      if (this.game.gameState === 'shop') {
        this.game.shopSystem.handleShopTouch(touch.clientX, touch.clientY);
        return;
      }
      
      if (this.game.gameState === 'gameover') {
        this.game.menuSystem.handleGameOverTouch(touch.clientX, touch.clientY);
        return;
      }
      
          if (this.game.gameState === 'mission_complete') {
      this.game.menuSystem.handleMissionCompleteTouch(touch.clientX, touch.clientY);
      return;
    }
    
    if (this.game.gameState === 'passenger_failed') {
      this.game.menuSystem.handlePassengerFailedTouch(touch.clientX, touch.clientY);
      return;
    }
      
      if (this.game.gameState === 'paused') {
        this.game.gameState = 'playing';
        return;
      }
      
      if (this.game.gameState === 'pause_menu') {
        const touch = e.touches[0];
        this.game.menuSystem.handlePauseMenuTouch(touch.clientX, touch.clientY);
        return;
      }
      
      if (this.game.gameState !== 'playing') return;
      

      
      this.touching = true;
      this.touchStartTime = Date.now();
      
      // 检查是否点击技能按钮
      if (this.game.ui.handleTouch(touch.clientX, touch.clientY)) {
        return;
      }
      
      // 移除双击飞机暂停功能，改为左下角固定暂停按钮
      // this.game.handlePlayerTap(touch.clientX, touch.clientY);

    });
    
    wx.onTouchMove((e) => {
      if (this.game.gameState !== 'playing' || !this.touching) return;
      
      // ==> 自动测试AI Hook 开始 (可注释整个块禁用)
      // 自动测试模式下禁用玩家手动控制
      if (this.game.autoTestEnabled && this.game.player && this.game.player.autoTest && this.game.player.autoTest.enabled) {
        return;
      }
      // <== 自动测试AI Hook 结束
      
      const touch = e.touches[0];
      
      // 移动飞机 - 检查玩家是否存在
      if (this.game.player) {
        this.game.player.x = Math.max(20, Math.min(this.game.screenWidth - 20, touch.clientX));
        this.game.player.y = Math.max(50, Math.min(this.game.screenHeight - 50, touch.clientY));
      }
    });
    
    wx.onTouchEnd((e) => {
      this.touching = false;
    });
  }
  

}

export { InputHandler }; 