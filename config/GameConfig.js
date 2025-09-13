// 风暴之书 - 微信小游戏

// 游戏配置
const GAME_CONFIG = {
  canvas: {
    width: wx.getSystemInfoSync().windowWidth,
    height: wx.getSystemInfoSync().windowHeight
  },
  colors: {
    silver: '#C0C0C0',
    shadow: '#404040', 
    red: '#DC143C',
    blood: '#8B0000',
    orange: '#FF8C00',
    white: '#FFFFFF',
    yellow: '#FFD700',
    green: '#32CD32'
  },
  player: {
    width: 32,
    height: 40,
    speed: 8,
    maxLives: 9,
    bulletSpeed: 12,
    fireRate: 8, // 恢复原始发射频率（每秒8发）
    maxMissiles: 9,
    maxSuperBombs: 3,
    bulletDamage: 8, // 子弹基础伤害
    maxWingmen: 2,
    maxWingmenLevel: 3
  },
  enemy: {
    spawnRate: 0.012,  // 减少基础生成频率，适应放大后的图片
    maxSimultaneousSpawn: 2, // 减少基础数量
    spacing: 150       // 增加间距，避免过于密集
  },
  cargo: {
    spawnRate: 0.003,  // 货机生成频率（原道具生成频率）
    itemSpeed: 2,      // 掉落道具的移动速度
    itemSize: 60       // 掉落道具的大小
  },
  missile: {
    speed: 10,
    turnSpeed: 0.15,
    lockRange: 200,
    damage: 10000, // 大幅增加基础伤害，确保一击必杀
    explosionRadius: 80
  }
};

// 导出游戏配置
export { GAME_CONFIG }; 