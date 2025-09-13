// 风暴之书 - 画面抖动效果管理器

/**
 * 画面抖动效果管理器
 * 实现轰炸击中敌机时的画面抖动效果
 */
export class ShakeEffect {
  constructor() {
    this.isActive = false;        // 是否正在抖动
    this.intensity = 0;           // 抖动强度
    this.duration = 0;            // 抖动持续时间（帧数）
    this.timer = 0;               // 当前计时
    this.offsetX = 0;             // X轴偏移
    this.offsetY = 0;             // Y轴偏移
  }

  /**
   * 开始抖动效果
   * @param {number} intensity - 抖动强度（像素）
   * @param {number} duration - 持续时间（帧数）
   */
  start(intensity = 8, duration = 15) {
    this.isActive = true;
    this.intensity = intensity;
    this.duration = duration;
    this.timer = 0;
  }

  /**
   * 更新抖动状态
   */
  update() {
    if (!this.isActive) {
      this.offsetX = 0;
      this.offsetY = 0;
      return;
    }

    this.timer++;
    
    if (this.timer >= this.duration) {
      // 抖动结束
      this.isActive = false;
      this.intensity = 0;
      this.offsetX = 0;
      this.offsetY = 0;
    } else {
      // 计算当前抖动强度（逐渐减弱）
      const progress = this.timer / this.duration;
      const currentIntensity = this.intensity * (1 - progress * 0.8); // 80%衰减
      
      // 生成随机偏移
      this.offsetX = (Math.random() - 0.5) * currentIntensity * 2;
      this.offsetY = (Math.random() - 0.5) * currentIntensity * 2;
    }
  }

  /**
   * 应用抖动变换到Canvas上下文
   * @param {CanvasRenderingContext2D} ctx - Canvas上下文
   */
  applyToContext(ctx) {
    if (this.isActive && (this.offsetX !== 0 || this.offsetY !== 0)) {
      ctx.translate(this.offsetX, this.offsetY);
    }
  }

  /**
   * 重置抖动效果
   */
  reset() {
    this.isActive = false;
    this.intensity = 0;
    this.timer = 0;
    this.offsetX = 0;
    this.offsetY = 0;
  }
} 