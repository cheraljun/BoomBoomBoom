// 风暴之书 - 数据管理器模块

// 数据存储管理器 - 支持用户识别和每局重置
class DataManager {
  constructor() {
    this.userId = null;
    this.data = {
      totalKills: 0,
      currentSessionKills: 0
    };
    this.permanentData = {
      totalKills: 0,     // 累计总击杀数不重置
      highestKills: 0,   // 单局最高击杀数
      totalRescues: 0    // 累计客机拯救数
    };
    this.initUser();
  }
  
  initUser() {
    try {
      // 尝试获取微信用户信息作为唯一标识
      this.getUserId().then(() => {
        this.loadUserData();
      });
    } catch (e) {
      this.userId = 'local_user';
      this.loadUserData();
    }
  }
  
  async getUserId() {
    try {
      // 微信小游戏获取用户唯一标识
      const userInfo = await new Promise((resolve, reject) => {
        wx.getUserInfo({
          success: resolve,
          fail: reject
        });
      });
      
      // 使用用户的openid作为唯一标识
      const loginRes = await new Promise((resolve, reject) => {
        wx.login({
          success: resolve,
          fail: reject
        });
      });
      
      this.userId = `user_${loginRes.code}`;
    } catch (e) {
      // 如果无法获取用户信息，生成一个本地唯一ID
      let localId = wx.getStorageSync('localUserId');
      if (!localId) {
        localId = 'local_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        wx.setStorageSync('localUserId', localId);
      }
      this.userId = localId;
    }
  }
  
  loadUserData() {
    try {
      const userKey = `gameData_${this.userId}`;
      const saved = wx.getStorageSync(userKey);
      if (saved) {
        this.permanentData = { ...this.permanentData, ...saved };
        // 每局开始时，从永久数据继承总击杀数
        this.data.totalKills = this.permanentData.totalKills;
        this.data.currentSessionKills = 0;
      }
    } catch (e) {
      // 加载失败，使用默认数据
    }
  }
  
  saveData() {
    try {
      // 更新永久数据
      this.permanentData.totalKills = this.data.totalKills;
      this.permanentData.highestKills = Math.max(this.permanentData.highestKills, this.data.currentSessionKills);
      
      // 保存到用户专属存储键
      const userKey = `gameData_${this.userId}`;
      wx.setStorageSync(userKey, this.permanentData);
    } catch (e) {
      // 保存失败
    }
  }
  
  addKills(kills) {
    this.data.currentSessionKills = kills;
    this.data.totalKills += kills;
    this.saveData();
  }
  
  spendKills(amount) {
    if (this.data.totalKills >= amount) {
      this.data.totalKills -= amount;
      this.saveData();
      return true;
    }
    return false;
  }
  
  getTotalKills() {
    return this.data.totalKills;
  }
  
  getHighestKills() {
    return this.permanentData.highestKills;
  }
  
  getCurrentSessionKills() {
    return this.data.currentSessionKills;
  }
  
  addRescue() {
    this.permanentData.totalRescues++;
    this.saveData();
  }
  
  getTotalRescues() {
    return this.permanentData.totalRescues;
  }
}

// 导出DataManager类
export { DataManager }; 