// 风暴之书 - 音频管理器模块
// 微信小游戏音频系统

// 音频管理器类
class AudioManager {
  constructor() {
    // 音频管理器初始化
    this.audioPools = {}; // 音频池
    this.poolIndexes = {}; // 池索引
    this.maxPoolSize = 20; // 最大池大小
    
    // 新增：全局音量控制
    this.globalVolume = 1.0; // 全局音量，范围0.0-1.0
    this.masterVolume = 1.0; // 主音量，范围0.0-1.0
    
    this.loadAudioFiles();
  }

  // 加载音频文件
  loadAudioFiles() {
    // 客机音效池（动态实例）
    this.audioPools.passenger = [];
    this.poolIndexes.passenger = 0;
    this.createAudioPool('passenger', 'resources/sound/passenger_plane.mp3', 3); // 初始3个实例

    // 轰炸机进场音效池（动态实例）
    this.audioPools.bomber = [];
    this.poolIndexes.bomber = 0;
    this.createAudioPool('bomber', 'resources/sound/bomber_arrival.mp3', 2); // 初始2个实例

    // 导弹发射音效池（动态实例）
    this.audioPools.missile = [];
    this.poolIndexes.missile = 0;
    this.createAudioPool('missile', 'resources/sound/missile_launch.mp3', 5); // 初始5个实例

    // 敌机死亡音效池（动态实例，支持大量同时播放）
    this.audioPools.enemyDeath = [];
    this.poolIndexes.enemyDeath = 0;
    this.createAudioPool('enemyDeath', 'resources/sound/enemy_death.mp3', 8); // 初始8个实例

    // 收集道具音效池（动态实例）
    this.audioPools.itemCollect = [];
    this.poolIndexes.itemCollect = 0;
    this.createAudioPool('itemCollect', 'resources/sound/item_collect.mp3', 3); // 初始3个实例

    // 货机补给音效池（动态实例）
    this.audioPools.cargoComing = [];
    this.poolIndexes.cargoComing = 0;
    this.createAudioPool('cargoComing', 'resources/sound/cargo_coming.mp3', 2); // 初始2个实例

    // Boss射击音效池（动态实例）
    this.audioPools.bossShoot = [];
    this.poolIndexes.bossShoot = 0;
    this.createAudioPool('bossShoot', 'resources/sound/boss_shoot.mp3', 5); // 初始5个实例
  }

  // 创建音频池
  createAudioPool(type, src, initialCount) {
    for (let i = 0; i < initialCount; i++) {
      this.createAudioInstance(type, src);
    }
  }

  // 创建音频实例
  createAudioInstance(type, src) {
    const audio = wx.createInnerAudioContext();
    audio.src = src;
    audio.loop = false;
    audio.volume = 1;
    
    // 播放完成后自动清理（如果池太大）
    audio.onEnded(() => {
      this.cleanupAudioPool(type);
    });
    
    this.audioPools[type].push(audio);
    return audio;
  }

  // 清理音频池（保持合理大小）
  cleanupAudioPool(type) {
    if (this.audioPools[type].length > this.maxPoolSize) {
      // 移除已播放完成的音频实例
      this.audioPools[type] = this.audioPools[type].filter(audio => {
        if (audio.paused) {
          audio.destroy();
          return false;
        }
        return true;
      });
    }
  }

  // 播放音效（通用方法）
  playSound(type, src) {
    let audio = null;
    
    // 寻找可用的音频实例
    for (let i = 0; i < this.audioPools[type].length; i++) {
      const index = (this.poolIndexes[type] + i) % this.audioPools[type].length;
      const testAudio = this.audioPools[type][index];
      
      if (testAudio.paused) {
        audio = testAudio;
        this.poolIndexes[type] = (index + 1) % this.audioPools[type].length;
        break;
      }
    }
    
    // 如果没有可用的实例，创建新的
    if (!audio) {
      audio = this.createAudioInstance(type, src);
    }
    
    // 播放音频
    audio.play();
  }

    // 播放客机音效
  playPassengerSound() {
    this.playSound('passenger', 'resources/sound/passenger_plane.mp3');
  }
  
  // 播放轰炸机进场音效
  playBomberSound() {
    this.playSound('bomber', 'resources/sound/bomber_arrival.mp3');
  }
  
  // 播放导弹发射音效
  playMissileSound() {
    this.playSound('missile', 'resources/sound/missile_launch.mp3');
  }
  
  // 播放中小敌机死亡音效
  playEnemyDeathSound() {
    this.playSound('enemyDeath', 'resources/sound/enemy_death.mp3');
  }
  
  // 播放收集道具音效
  playItemCollectSound() {
    this.playSound('itemCollect', 'resources/sound/item_collect.mp3');
  }
  
  // 播放货机补给音效
  playCargoComingSound() {
    this.playSound('cargoComing', 'resources/sound/cargo_coming.mp3');
  }

  // 播放Boss射击音效
  playBossShootSound() {
    this.playSound('bossShoot', 'resources/sound/boss_shoot.mp3');
  }

  // 停止音效（通用方法）
  stopSound(type) {
    if (this.audioPools[type]) {
      this.audioPools[type].forEach(audio => {
        audio.stop();
      });
    }
  }

  // 停止客机音效
  stopPassengerSound() {
    this.stopSound('passenger');
  }

  // 停止轰炸机音效
  stopBomberSound() {
    this.stopSound('bomber');
  }

  // 停止导弹发射音效
  stopMissileSound() {
    this.stopSound('missile');
  }

  // 停止敌机死亡音效
  stopEnemyDeathSound() {
    this.stopSound('enemyDeath');
  }

  // 停止收集道具音效
  stopItemCollectSound() {
    this.stopSound('itemCollect');
  }

  // 设置音量
  setVolume(type, volume) {
    if (this.audioPools[type]) {
      this.audioPools[type].forEach(audio => {
        audio.volume = Math.max(0, Math.min(1, volume));
      });
    }
  }

  // 新增：设置全局音量
  setGlobalVolume(volume) {
    this.globalVolume = Math.max(0, Math.min(1, volume));
    this.applyGlobalVolume();
  }

  // 新增：设置主音量
  setMasterVolume(volume) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    this.applyGlobalVolume();
  }

  // 新增：应用全局音量到所有音频
  applyGlobalVolume() {
    const finalVolume = this.globalVolume * this.masterVolume;
    
    for (const key in this.audioPools) {
      if (this.audioPools[key]) {
        this.audioPools[key].forEach(audio => {
          // 保持相对音量比例，但应用全局音量
          const relativeVolume = audio.volume / this.globalVolume;
          audio.volume = relativeVolume * finalVolume;
        });
      }
    }
  }

  // 新增：获取当前音量信息
  getVolumeInfo() {
    return {
      globalVolume: this.globalVolume,
      masterVolume: this.masterVolume,
      finalVolume: this.globalVolume * this.masterVolume
    };
  }

  // 销毁音频资源
  destroy() {
    // 销毁所有音频池
    for (const key in this.audioPools) {
      if (this.audioPools[key]) {
        this.audioPools[key].forEach(audio => {
          audio.destroy();
        });
      }
    }
  }
}

// 导出音频管理器
export { AudioManager }; 