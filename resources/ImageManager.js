// 风暴之书 - 图片资源管理器模块

// 图片资源管理器
class ImageManager {
  constructor() {
    this.images = {};
    this.loadImages();
  }
  
  loadImages() {
    // 敌机图片
    const enemyTypes = ['medium', 'large']; // 移除small，单独处理
    const enemyCounts = { medium: 4, large: 5 };
    
    for (const type of enemyTypes) {
      this.images[type] = [];
      for (let i = 1; i <= enemyCounts[type]; i++) {
        const img = wx.createImage();
        img.src = `resources/pic/enemies/enemy_${type}_${String(i).padStart(2, '0')}.png`;
        this.images[type].push(img);
      }
    }
    
    // 小型敌机：只使用一张图片
    this.images.small = [];
    const smallImg = wx.createImage();
    smallImg.src = 'resources/pic/enemies/enemy_small.png';
    this.images.small.push(smallImg);
    
    // Boss图片
    this.images.boss = [];
    for (let i = 1; i <= 3; i++) {
      const img = wx.createImage();
      img.src = `resources/pic/bosses/boss_${String(i).padStart(2, '0')}.png`;
      this.images.boss.push(img);
    }
    
    // 僚机图片
    this.images.wingman = [];
    for (let i = 1; i <= 4; i++) {
      const img = wx.createImage();
      const src = `resources/pic/wingmen/wingman_${String(i).padStart(2, '0')}.png`;
      img.src = src;
      this.images.wingman.push(img);
    }
    
    // 玩家图片
    this.images.player = [];
    const playerTypes = ['main', 'left', 'right'];
    for (const type of playerTypes) {
      const img = wx.createImage();
      img.src = `resources/pic/players/player_${type}.png`;
      this.images.player.push(img);
    }
    
    // 敌机子弹图片
    this.images.enemyBullet = [];
    for (let i = 1; i <= 3; i++) {
      const img = wx.createImage();
      img.src = `resources/pic/enemybullets/bullet_${String(i).padStart(2, '0')}.png`;
      this.images.enemyBullet.push(img);
    }
    
    // THROW弹幕专用图片
    this.images.throwBullet = [];
    for (let i = 1; i <= 3; i++) {
      const img = wx.createImage();
      img.src = `resources/pic/enemybullets/throw_${String(i).padStart(2, '0')}.png`;
      this.images.throwBullet.push(img);
    }
    
    // 补给品图片
    this.images.powerup = {};
    const powerupTypes = [
      { type: 'bomb', file: 'powerup_bomb.png' },         // 叛乱炸弹
      { type: 'double', file: 'powerup_double_bullet.png' }, // 双倍子弹
      { type: 'life', file: 'powerup_life.png' },         // 生命
      { type: 'wingman', file: 'powerup_wingman.png' },   // 僚机
      { type: 'mission', file: 'powerup_mission.png' },   // 任务道具（导弹）
      // 暂停功能改为文字显示，不需要图片
    ];
    
    for (const powerup of powerupTypes) {
      const img = wx.createImage();
      img.src = `resources/pic/powerups/${powerup.file}`;
      this.images.powerup[powerup.type] = img;
    }
    
    // 玩家子弹图片系统 - 支持多种组合
    this.images.playerBullet = {};
    const playerBulletTypes = [
      { type: 'single', file: 'player_bullet_01.png' },     // 1发子弹
      { type: 'double', file: 'player_bullet_02.png' },     // 2发子弹
      { type: 'quad', file: 'player_bullet_03.png' },       // 4发子弹
      { type: 'octa', file: 'player_bullet_04.png' },       // 8发子弹
      { type: 'deca', file: 'player_bullet_05.png' },       // 10发子弹
      { type: 'wingman', file: 'wingmen_bullet.png' }       // 僚机子弹
    ];
    
    for (const bullet of playerBulletTypes) {
      const img = wx.createImage();
      img.src = `resources/pic/playerbullets/${bullet.file}`;
      this.images.playerBullet[bullet.type] = img;
    }
    
    // 客机图片
    this.images.passenger = [];
    for (let i = 1; i <= 3; i++) {
      const img = wx.createImage();
      img.src = `resources/pic/passenger/passenger_${String(i).padStart(2, '0')}.png`;
      this.images.passenger.push(img);
    }
    
    // 货机图片
    this.images.cargo = wx.createImage();
    this.images.cargo.src = 'resources/pic/powerups/cargo_01.png';
  }
  
  getRandomEnemyImage(type) {
    if (!this.images[type] || this.images[type].length === 0) return null;
    const randomIndex = Math.floor(Math.random() * this.images[type].length);
    return this.images[type][randomIndex];
  }
  
  getEnemyImage(type, imageName) {
    if (!this.images[type] || this.images[type].length === 0) {
      return null;
    }
    
    // 支持具体图片名字
    const imageMap = {
      // 小型敌机
      'enemy_small.png': this.images.small[0],
      
      // 中型敌机
      'enemy_medium_01.png': this.images.medium[0],
      'enemy_medium_02.png': this.images.medium[1], 
      'enemy_medium_03.png': this.images.medium[2],
      'enemy_medium_04.png': this.images.medium[3],
      
      // 大型敌机
      'enemy_large_01.png': this.images.large[0],
      'enemy_large_02.png': this.images.large[1],
      'enemy_large_03.png': this.images.large[2], 
      'enemy_large_04.png': this.images.large[3],
      'enemy_large_05.png': this.images.large[4],
      
      // Boss
      'boss_01.png': this.images.boss[0],
      'boss_02.png': this.images.boss[1],
      'boss_03.png': this.images.boss[2]
    };
    
    return imageMap[imageName] || this.images[type][0]; // 默认使用第一张
  }
  
  getWingmanImage(level) {
    const index = Math.max(0, Math.min(level - 1, this.images.wingman.length - 1));
    return this.images.wingman[index];
  }
  
  getEnemyBulletImage(imageName) {
    // 支持具体图片名字
    const imageMap = {
      'bullet_01.png': this.images.enemyBullet[0],
      'bullet_02.png': this.images.enemyBullet[1], 
      'bullet_03.png': this.images.enemyBullet[2]
    };
    
    return imageMap[imageName] || this.images.enemyBullet[1]; // 默认使用bullet_02.png
  }
  
  getThrowBulletImage(index) {
    // 调整索引，因为图片是1-3，但数组是0-2
    const adjustedIndex = Math.max(0, Math.min(index - 1, this.images.throwBullet.length - 1));
    if (!this.images.throwBullet[adjustedIndex]) return this.images.throwBullet[0];
    return this.images.throwBullet[adjustedIndex];
  }
  
  getRandomEnemyBulletImage() {
    if (!this.images.enemyBullet || this.images.enemyBullet.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * this.images.enemyBullet.length);
    return this.images.enemyBullet[randomIndex];
  }
  
  getPowerupImage(type) {
    // 映射补给品类型到图片类型
    const typeMap = {
      '双倍火力': 'double',
      '轰炸': 'bomb',
      '追踪导弹': 'mission',  // 使用任务道具图片
      '生命补给': 'life',
      '战斗僚机': 'wingman'   // 使用专门的僚机图片
      // 暂停功能改为文字显示，不需要图片映射
    };
    
    const imageType = typeMap[type] || 'bomb';
    return this.images.powerup[imageType] || null;
  }
  
  getPlayerBulletImage(type = 'single') {
    // 如果传入的type在playerBullet中不存在，返回默认的single类型
    return this.images.playerBullet[type] || this.images.playerBullet['single'] || null;
  }
  
  getPassengerImage(index) {
    // 调整索引，因为图片是1-3，但数组是0-2
    const adjustedIndex = Math.max(0, Math.min(index - 1, this.images.passenger.length - 1));
    if (!this.images.passenger[adjustedIndex]) return this.images.passenger[0];
    return this.images.passenger[adjustedIndex];
  }
  
  getCargoImage() {
    return this.images.cargo;
  }
}

// 导出ImageManager类
export { ImageManager }; 