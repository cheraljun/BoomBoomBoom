// 碰撞检测系统 - 碰撞检测管理器
import { DestroyAnimation } from '../effects/DeathAnimation.js';
import { ExplosionEffect } from '../effects/ExplosionEffect.js';

class CollisionDetector {
  constructor(game) {
    this.game = game;
  }

  // 完整碰撞检测（玩家子弹vs敌机、导弹vs敌机、敌机子弹vs玩家、敌机vs玩家、玩家vs道具）
  checkCollisions() {
    // 玩家子弹 vs 敌机 - 优化版
    bulletLoop: for (let i = this.game.playerBullets.length - 1; i >= 0; i--) {
      const bullet = this.game.playerBullets[i];
      
      for (let j = this.game.enemies.length - 1; j >= 0; j--) {
        const enemy = this.game.enemies[j];
        
        // 检查敌机是否存在（防止轰炸时删除敌机导致的空指针）
        if (!enemy) continue;
        
        // 快速边界检查
        if (enemy.y <= -enemy.height || 
            bullet.x < enemy.x - enemy.width/2 || bullet.x > enemy.x + enemy.width/2 ||
            bullet.y < enemy.y - enemy.height/2 || bullet.y > enemy.y + enemy.height/2) {
          continue;
        }
        
        // 碰撞处理
          enemy.takeDamage(bullet.damage);
          
          // 普通模式：子弹消失
          this.game.playerBullets.splice(i, 1);
          
          if (enemy.hp <= 0) {
            this.game.killCount++;
            
            // 任务系统：增加当前任务段击杀计数
            if (this.game.missionSystemEnabled) {
              this.game.currentTaskKills++;
              // 注：不需要重置计数，因为当客机任务开始时会自然过渡到下一段
            }
            
            // 播放中小敌机死亡音效（不包括Boss）
            if (enemy.type !== 'boss' && this.game.audioManager) {
              this.game.audioManager.playEnemyDeathSound();
            }
            
            // 添加摧毁动画
            const destroyType = enemy.type === 'boss' ? 'boss' : 
                               enemy.type === 'large' ? 'large' : 'normal';
            this.game.effects.push(new DestroyAnimation(enemy.x, enemy.y, destroyType));
            
            this.game.enemies.splice(j, 1);
            
            if (enemy.type === 'boss' && Math.random() < 0.3) {
              enemy.spawnEnemyMinions(this.game);
            }
            
            // BOSS死亡时通知BattlePhaseManager
            if (enemy.type === 'boss') {
              this.game.lastBossTime = Date.now();
              this.game.battlePhaseManager.onBossDefeated();
            }
          }
        
        continue bulletLoop; // 子弹已处理，跳到下一个子弹
      }
    }
    
    // 导弹 vs 敌机
    for (let i = this.game.missiles.length - 1; i >= 0; i--) {
      const missile = this.game.missiles[i];
      
      for (let j = this.game.enemies.length - 1; j >= 0; j--) {
        const enemy = this.game.enemies[j];
        
        const dx = missile.x - enemy.x;
        const dy = missile.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 30) {
          // 爆炸效果：对范围内所有敌机造成伤害
          const explosionX = missile.x;
          const explosionY = missile.y;
          
          for (let k = this.game.enemies.length - 1; k >= 0; k--) {
            const nearbyEnemy = this.game.enemies[k];
            const nearbyDx = explosionX - nearbyEnemy.x;
            const nearbyDy = explosionY - nearbyEnemy.y;
            const nearbyDistance = Math.sqrt(nearbyDx * nearbyDx + nearbyDy * nearbyDy);
            
            if (nearbyDistance < missile.explosionRadius) {
              const damage = nearbyDistance < 30 ? missile.damage : Math.floor(missile.damage * 0.6);
              nearbyEnemy.takeDamage(damage);
              
              if (nearbyEnemy.hp <= 0) {
                // 播放中小敌机死亡音效（不包括Boss）
                if (nearbyEnemy.type !== 'boss' && this.game.audioManager) {
                  this.game.audioManager.playEnemyDeathSound();
                }
                
                // 添加摧毁动画
                const destroyType = nearbyEnemy.type === 'boss' ? 'boss' : 
                                   nearbyEnemy.type === 'large' ? 'large' : 'normal';
                this.game.effects.push(new DestroyAnimation(nearbyEnemy.x, nearbyEnemy.y, destroyType));
                
                this.game.killCount++;
                
                // 任务系统：增加当前任务段击杀计数（导弹击杀）
                if (this.game.missionSystemEnabled) {
                  this.game.currentTaskKills++;
                }
                
                // Boss召唤小兵处理
                if (nearbyEnemy.type === 'boss' && Math.random() < 0.3) {
                  nearbyEnemy.spawnEnemyMinions(this.game);
                }
                
                this.game.enemies.splice(k, 1);
                if (k < j) j--;
                
                // BOSS死亡时重置敌机生成标志
                if (nearbyEnemy.type === 'boss') {
                  this.game.lastBossTime = Date.now();
                  this.game.battlePhaseManager.onBossDefeated();
                }
              }
            }
          }
          
          // 添加导弹击中爆炸效果（使用摧毁动画素材）
          this.game.effects.push(new DestroyAnimation(explosionX, explosionY, 'normal'));
          this.game.missiles.splice(i, 1);
          break;
        }
      }
    }
    
    // 敌机子弹 vs 玩家
    if (this.game.player) { // 检查玩家是否存在
      for (let i = this.game.enemyBullets.length - 1; i >= 0; i--) {
        const bullet = this.game.enemyBullets[i];
        
        // 检查子弹是否存在（防止轰炸时清空数组导致的空指针）
        if (!bullet) continue;
        
        const dx = bullet.x - this.game.player.x;
        const dy = bullet.y - this.game.player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 25) {
          this.game.player.takeDamage();
          this.game.enemyBullets.splice(i, 1);
          
          if (this.game.player.lives <= 0) {
            // 记录死亡原因
            this.game.deathCause = {
              type: 'bullet',
              bullet: { x: bullet.x, y: bullet.y },
              player: { x: this.game.player.x, y: this.game.player.y }
            };
            this.game.startDeathSequence();
          }
        }
      }
    }
    
    // 敌机 vs 玩家 (碰撞) - 叛乱敌机不在enemies数组中，所以这里自动排除了叛乱敌机
    if (this.game.player) { // 检查玩家是否存在
      for (let i = this.game.enemies.length - 1; i >= 0; i--) {
        const enemy = this.game.enemies[i];
        
        // 检查敌机是否存在（防止轰炸时删除敌机导致的空指针）
        if (!enemy) continue;
        
        const dx = enemy.x - this.game.player.x;
        const dy = enemy.y - this.game.player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < 30) {
        this.game.player.takeDamage();
        enemy.takeDamage(999);
        
        // 添加爆炸效果
        this.game.effects.push(new ExplosionEffect(enemy.x, enemy.y));
        
        // 添加摧毁动画（与正常击杀相同的damage图片）
        const destroyType = enemy.type === 'boss' ? 'boss' : 
                           enemy.type === 'large' ? 'large' : 'normal';
        this.game.effects.push(new DestroyAnimation(enemy.x, enemy.y, destroyType));
        
        // Boss召唤小兵处理
        if (enemy.type === 'boss' && Math.random() < 0.3) {
          enemy.spawnEnemyMinions(this.game);
        }
        
        this.game.enemies.splice(i, 1);
        
        // BOSS死亡时通知BattlePhaseManager
        if (enemy.type === 'boss') {
          this.game.lastBossTime = Date.now();
          this.game.battlePhaseManager.onBossDefeated();
        }
        
        if (this.game.player.lives <= 0) {
          // 记录死亡原因
          this.game.deathCause = {
            type: 'collision',
            enemy: { x: enemy.x, y: enemy.y, type: enemy.type },
            player: { x: this.game.player.x, y: this.game.player.y }
          };
          this.game.startDeathSequence();
        }
      }
    }
    } // 结束玩家存在检查
    
    // 轰炸系统不需要特殊碰撞检测（轰炸机投弹时自动处理）
    
    // 客机相关碰撞检测
    this.checkPassengerCollisions();
    
    // 玩家 vs 道具
    if (this.game.player) { // 检查玩家是否存在
      for (let i = this.game.items.length - 1; i >= 0; i--) {
        const item = this.game.items[i];
        
        const dx = item.x - this.game.player.x;
        const dy = item.y - this.game.player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 40) {
          this.game.collectItem(item);
          this.game.items.splice(i, 1);
        }
      }
    }
  }
  

  
  // 客机碰撞检测
  checkPassengerCollisions() {
    for (let i = this.game.passengers.length - 1; i >= 0; i--) {
      const passenger = this.game.passengers[i];
      
      // 敌机 vs 客机
      for (let j = this.game.enemies.length - 1; j >= 0; j--) {
        const enemy = this.game.enemies[j];
        
        // 快速边界检查
        if (enemy.x - enemy.width/2 > passenger.x + passenger.width/2 || 
            enemy.x + enemy.width/2 < passenger.x - passenger.width/2 ||
            enemy.y - enemy.height/2 > passenger.y + passenger.height/2 || 
            enemy.y + enemy.height/2 < passenger.y - passenger.height/2) {
          continue;
        }
        
        // 碰撞处理
        passenger.takeDamage(20); // 敌机撞击造成20点伤害
        enemy.takeDamage(enemy.hp); // 敌机也被摧毁
        
        // 如果客机被击毁，记录死亡原因并启动死亡序列
        if (passenger.isDestroyed() && this.game.battlePhaseManager) {
          this.game.passengerDeathCause = {
            type: 'collision',
            enemy: { x: enemy.x, y: enemy.y, type: enemy.type },
            passenger: passenger // 保存完整的客机对象引用
          };
          this.game.startPassengerDeathSequence();
        }
      }
      
      // 敌机子弹 vs 客机
      for (let j = this.game.enemyBullets.length - 1; j >= 0; j--) {
        const bullet = this.game.enemyBullets[j];
        
        // 检查子弹是否存在（防止轰炸时清空数组导致的空指针）
        if (!bullet) continue;
        
        // 快速边界检查
        if (bullet.x < passenger.x - passenger.width/2 || bullet.x > passenger.x + passenger.width/2 ||
            bullet.y < passenger.y - passenger.height/2 || bullet.y > passenger.y + passenger.height/2) {
          continue;
        }
        
        // 碰撞处理
        passenger.takeDamage(10); // 客机受到10点伤害
        this.game.enemyBullets.splice(j, 1); // 子弹消失
        
        // 如果客机被击毁，记录死亡原因并启动死亡序列
        if (passenger.isDestroyed() && this.game.battlePhaseManager) {
          this.game.passengerDeathCause = {
            type: 'bullet',
            bullet: { x: bullet.x, y: bullet.y },
            passenger: passenger // 保存完整的客机对象引用
          };
          this.game.startPassengerDeathSequence();
        }
      }
      
      // 玩家 vs 客机（双方都受到碰撞伤害）
      if (this.game.player) {
        const player = this.game.player;
        
        // 快速边界检查
        if (!(player.x - player.width/2 > passenger.x + passenger.width/2 || 
              player.x + player.width/2 < passenger.x - passenger.width/2 ||
              player.y - player.height/2 > passenger.y + passenger.height/2 || 
              player.y + player.height/2 < passenger.y - passenger.height/2)) {
          
          // 玩家撞到客机，双方都受到伤害
          this.game.player.takeDamage(15); // 玩家扣15血
          passenger.takeDamage(15); // 客机也扣15血
          
          // 如果客机被击毁，记录死亡原因并启动死亡序列
          if (passenger.isDestroyed() && this.game.battlePhaseManager) {
            this.game.passengerDeathCause = {
              type: 'collision',
              enemy: { x: this.game.player.x, y: this.game.player.y, type: 'player' },
              passenger: passenger // 保存完整的客机对象引用
            };
            this.game.startPassengerDeathSequence();
          }
          
          // 记录死亡原因（如果玩家死亡）
          if (this.game.player.lives <= 0) {
            this.game.deathCause = {
              type: 'collision',
              enemy: { x: passenger.x, y: passenger.y, type: 'passenger' },
              player: { x: this.game.player.x, y: this.game.player.y }
            };
            this.game.startDeathSequence();
          }
        }
      }
      
      // 注意：玩家子弹 vs 客机 故意不检测，子弹可以穿过客机
    }
  }
}

export { CollisionDetector }; 