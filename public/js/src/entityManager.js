/**
 * @fileoverview Entity (player, mob, npc) の行動などなどを管理する
 */

/**
 * @class
 * @extends cc.Class
 */
bq.EntityManager = cc.Class.extend({
    otherPlayers_: {},
    enemys_: {},
    npcs_: {},
    ctor: function() {
    },

    /**
     * サーバからmapIdに指定したマップ上に存在するEntity一覧を取得してきて更新する
     * @param {number} mapId
     */
    updateEntitiesByMapId: function(mapId) {
        var soc = bq.Socket.getInstance();
        soc.requestEntitiesByMapId(mapId, $.proxy(function(data) {
            var players = _.reject(data.players, function(player) {
                return bq.player.name === player.id;
            });
            this.createOtherPlayers(players);
            this.createMobs(data.mobs);
            bq.MessageLog.getInstance().addSystemMsg('この辺にはオンラインのプレイヤーが' + players.length + '人いるようだ');
        }, this));
    },


    removeOtherPlayer: function(id) {
        if (this.otherPlayers_[id]) {
            delete this.otherPlayers_[id];
        }
    },

    /**
     * @return {Object}
     */
    getOtherPlayers: function() {
        return this.otherPlayers_;
    },

    /**
     * @return {Object}
     */
    getEnemys: function() {
        return this.enemys_;
    },

    /**
     * 他プレイヤーのチャットを受信したら吹き出しを表示する
     * @param {bq.model.Chat} chatData
     */
    chat: function(chatData) {
        var targetOther = this.otherPlayers_[chatData.userId];
        if (targetOther) {
            var msgLog = bq.MessageLog.getInstance();
            msgLog.addChatMsg(chatData.userId + ': ' + chatData.message);
            targetOther.showMessage(chatData.message);
        }
    },

    /**
     * 他プレイヤーが動いたという情報がサーバから帰ってきたら呼ばれる
     * @param {bq.model.PlayerMove} moveData
     */
    moveTo: function(moveData) {
        var otherPlayer = this.otherPlayers_[moveData.userId];
        if (!otherPlayer) {
            this.createOtherPlayer(moveData);
        } else {
            otherPlayer.moveTo(cc.p(moveData.x, moveData.y), moveData.direction);
        }
    },

    /**
     * MobがPOPする時に呼ばれる
     * @param {Object} data
     */
    popMob: function(data) {
        this.createMob(data.mob);
    },

    /**
     * mobが死んだら呼ばれる
     * @param {Object} data
     */
    killMob: function(data) {
        var enemy = this.enemys_[data.entity.id];
        if (enemy) {
            enemy.kill(null, function() {
                bq.space.removeShape(enemy.shape_);
                delete this.enemys_[data.entity.id];
            }.bind(this));
        }
    },

    /**
     * playerが死んだら呼ばれる
     * @param {Object} data
     */
    killPlayer: function(data) {
        var player = this.otherPlayers_[data.entity.name];
        if (player) {
            player.kill(true);
        } else if (bq.player.name === data.entity.name) {
            bq.player.kill();
        }
    },

    /**
     * 他playerが復活したら呼ばれる
     * @param {Object} data
     */
    respawnOtherPlayer: function(data) {
        var player = this.otherPlayers_[data.entity.name];
        if (player) {
            player.respawn();
        }
    },

    /**
     * Entityにビームが当たったら呼ばれる
     * TODO: いまんとこenemyだけ
     * @param {Object} data
     */
    hitEntity: function(data) {
        // ビームを消す
        bq.BeamManager.getInstance().disposeBeam(data);
    },

    // ビームと敵があたった時によばれる
    collisionCallback : function ( arbiter, space ) {

        var shapes = arbiter.getShapes();
        var enemy = bq.EntityManager.getInstance().getEnemys()[shapes[1].id];
        space.addPostStepCallback(function(){
            var data = {};
            data.entity  = enemy.getModel();
            data.beamPos = enemy.getPosition();
            data.hpAmount = -10; // これも
            data.beamTag = shapes[0].tag;

            bq.EntityManager.getInstance().hitEntity(data);
        });

        return true;
    },

    /**
     * @param {Object}
     */
    createOtherPlayers: function(players) {
        _.each(players, $.proxy(function(player) {
            var playerMove = new bq.model.PlayerMove({
                userId: player.id,
                mapId: player.position.mapId,
                x: player.position.x,
                y: player.position.y
            });
            this.createOtherPlayer(playerMove);
        }, this));
    },

    /**
     * @param {bq.model.PlayerMove} moveData
     */
    createOtherPlayer: function(moveData) {
        if (this.otherPlayers_[moveData.userId]) {
            return;
        }
        var other = new bq.entity.Entity('b0_0.png', bq.entity.Player.KEY_FRAME_MAP);
        other.updateAnimation(bq.entity.EntityState.Mode.stop, bq.entity.EntityState.Direction.bottom);
        other.name = moveData.userId;
        other.showName(moveData.userId, true);
        other.setPosition(cc.p(moveData.x, moveData.y));
        bq.baseLayer.addChild(other, bq.config.zOrder.PLAYER);
        this.otherPlayers_[moveData.userId] = other;
    },

    /**
     * @param {Object} mobs
     */
    createMobs: function(mobs) {
        _.each(mobs, $.proxy(function(mob) {
            this.createMob(mob);
        }), this);
    },

    /**
     * @param {Object} mob
     */
    createMob: function(mob) {
        var mobModel = new bq.model.Mob(mob);
        var x = mobModel.position.x;
        var y = mobModel.position.y;
        var enemy_id = 1;
        var enemy = new bq.entity.Enemy(enemy_id);
        enemy.setModel(mobModel);
        enemy.setPosition(cc.p(x, y));
        bq.baseLayer.addChild(enemy, bq.config.zOrder.PLAYER - 1);
        this.enemys_[mobModel.id] = enemy;
    },

    /**
     * mobの移動
     * @param {Object}
     */
    mobMoveTo: function(data) {
        var enemy =  this.enemys_[data.mob.id];
        if (enemy) {
            enemy.setPosition(cc.p(data.mob.position.x, data.mob.position.y));
            // var act = cc.MoveTo.create(0.1, cc.p(data.mob.position.x, data.mob.position.y));
            // enemy.runAction(act);
        }
    },

    /**
     * mobがタゲった
     * @param {Object}
     */
    mobTargetTo: function(data) {
        var enemy =  this.enemys_[data.mob.id];
        var target;
        if (data.target.id === bq.player.name) {
            target = bq.player;
        } else {
            target = this.otherPlayers_[data.target.id];
        }
        if (enemy && target) {
            enemy.targetTo(target);
        }
    },

    /**
     * mobが近接攻撃の構えを取った
     * @param {Object.<mob: Object, range: number, castTime: number>} data
     */
    startAttackShortRange: function(data) {
        var enemy =  this.enemys_[data.mobId];
        if (enemy) {
            enemy.showMessage('ころちゅ');
        }
    },

    /**
     * Entityがキャストを開始した
     * @param {Object.<mapId: string, userId: string, skill: bq.model.Skill>} data
     */
    cast: function(data) {
        var entity = this.getEntityById_(data.userId);
        if (entity) {
            entity.cast(data);
        }
    },

    /**
     * @param {Object.<skill: bq.model.Skill, userId: string, targetPos: bq.model.Position>} data
     */
    fireSkill: function(data) {
        var entity = this.getEntityById_(data.userId);
        if (entity) {
            entity.fireSkill(data.skill, data.targetPos);
        }
    },

    /**
     * hpに増減があった
     * @param {Array.<Object>} data
     */
    updateHp: function(data) {
        _.forEach(data.hpDatas, function(hpData) {
            if (hpData.entity.id === bq.player.name) {
                bq.player.updateHp(hpData);
            } else {
                var enemy = this.enemys_[hpData.entity.id];
                var player = this.otherPlayers_[hpData.entity.id];
                if (enemy) {
                    enemy.updateHp(hpData);
                } else if (player) {
                    player.updateHp(hpData);
                }
            }
        }.bind(this));
    },

    /**
     * レベルアップした
     * @param {bq.model.Player} model
     */
    levelUp: function(model) {
        if (model.id === bq.player.name) {
            bq.player.setModel(model);
            bq.player.levelUp();
        }
        var msg = model.id + ' はレベル' + model.lv + 'になった！';
        bq.MessageLog.getInstance().addStatusMsg(msg);
    },

    logout: function(data) {
        var logoutPlayer =  this.otherPlayers_[data.userId];
        if (logoutPlayer) {
            this.announceLogInOutMsg_(data.userId, 'がログアウトした。');
            logoutPlayer.removeFromParent();
            this.removeOtherPlayer(data.userId);
            bq.soundManager.playEffect(s_SeLogout);
        }
    },

    login: function(data) {
        this.announceLogInOutMsg_(data.userId, 'がログインした。');
        bq.soundManager.playEffect(s_SeLogin);
    },

    /**
     *
     * @param {string} userId
     * @param {string} suffix 〜がログインした　みたいな
     * @private
     */
    announceLogInOutMsg_: function(userId, suffix) {
        var now = new Date();
        var msg = ('0' + now.getHours()).slice(-2) + ':' +
            ('0' + now.getMinutes()).slice(-2) + ' ' + userId + ' ' + suffix;
        bq.MessageLog.getInstance().addSystemMsg(msg);
    },

    /**
     * IDから判断してEntityを返す
     * @param {string} entityId
     * @return {bq.entity.Entity}
     * @private
     */
    getEntityById_: function(entityId) {
        var enemy = this.enemys_[entityId];
        if (enemy) {
            return enemy;
        }

        var otherPlayer = this.otherPlayers_[entityId];
        if (otherPlayer) {
            return otherPlayer;
        }

        if (bq.player.name === entityId) {
            return bq.player;
        }

        return null;
    }
});


bq.EntityManager.instance_ = new bq.EntityManager();

bq.EntityManager.getInstance = function() {
    return bq.EntityManager.instance_;
};
