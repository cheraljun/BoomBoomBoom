// 风暴之书 - 微信小游戏
// 重构后的游戏入口文件

import { GameEngine } from './core/GameEngine.js';

// 启动游戏
const game = new GameEngine();
game.loop(); 