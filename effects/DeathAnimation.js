// 风暴之书 - 摧毁动画模块

// 摧毁动画系统类
class DestroyAnimation {
  constructor(x, y, type = 'normal') {
    this.x = x;
    this.y = y;
    this.type = type; // 'normal', 'large', 'boss'
    this.animationCount = type === 'normal' ? 1 : 
                          type === 'large' ? 2 : 5; // Boss更多动画
    this.animations = []; // 多个动画实例
    
    // Boss摧毁动画持续1秒，其他快速结束
    if (type === 'boss') {
      this.life = 60; // 1秒 * 60FPS = 60帧
      this.maxLife = 60;
    } else {
      this.life = 7; // 7帧动画，更快
      this.maxLife = 7;
    }
    this.frame = 0; // 当前帧数
    
    // 加载DESTROY图片
    this.loadDestroyImages();
  }
  
  // 加载DESTROY图片
  loadDestroyImages() {
    try {
      // 加载destroy_01和destroy_02
      const destroy01 = wx.createImage();
      destroy01.src = 'resources/pic/destroy/destroy_01.png';
      const destroy02 = wx.createImage();
      destroy02.src = 'resources/pic/destroy/destroy_02.png';
      
      // 为每个动画实例创建图片
      for (let i = 0; i < this.animationCount; i++) {
        const anim = {
          image1: destroy01,
          image2: destroy02,
          x: this.x + (Math.random() - 0.5) * 40, // 随机偏移
          y: this.y + (Math.random() - 0.5) * 40,
          scale: 1 + Math.random() * 0.5, // 随机缩放
          rotation: Math.random() * 360 // 随机旋转
        };
        this.animations.push(anim);
      }
    } catch (e) {
      // 图片加载失败，忽略错误
    }
  }
  
  update() {
    this.life--;
    this.frame++;
    return this.life > 0;
  }
  
  render(ctx) {
    this.animations.forEach(anim => {
      ctx.save();
      ctx.translate(anim.x, anim.y);
      ctx.scale(anim.scale, anim.scale);
      ctx.rotate(anim.rotation * Math.PI / 180);
      
      // 播放destroy_01和destroy_02
      let currentImage = null;
      if (this.type === 'boss') {
        // Boss动画持续播放，每15帧切换一次图片（1秒内切换4次）
        const imageIndex = Math.floor(this.frame / 15) % 2;
        currentImage = imageIndex === 0 ? anim.image1 : anim.image2;
      } else {
        // 普通动画快速播放（7帧：前3帧显示destroy_01，后4帧显示destroy_02）
        if (this.frame < 3) {
          currentImage = anim.image1;
        } else {
          currentImage = anim.image2;
        }
      }
      
      // 绘制当前图片（保持原始大小）
      if (currentImage && currentImage.width > 0) {
        ctx.drawImage(
          currentImage, 
          -currentImage.width / 2, 
          -currentImage.height / 2
        );
      }
      
      ctx.restore();
    });
  }
}

// 导出DestroyAnimation类
export { DestroyAnimation }; 