/**
 * ゲーム内のEntityの状態を保持しておくクラス
 * @constructor
 */
var Entities = function() {
    /**
     * マップごとのプレイヤー一覧
     * @typedef {
     *    mapId: {
     *       userId: model.Player
     *    }
     * }
     * @private
     */
    this.mapPlayers_ = {};

    /**
     * マップごとのmob一覧
     * @type {Object}
     * @private
     */
    this.mapMobs_ = {};
};

/**
 * @param {number} mapId
 * @param {model.Player} player
 */
Entities.prototype.addPlayer = function(mapId, player) {
    var players = this.mapPlayers_[mapId] || [];
    if (!_.contains(players, player.id)) {
        players[player.id] = player;
    }
};

/**
 * @param {number} mapId
 * @param {model.Mob} mob
 */
Entities.prototype.addMob = function(mapId, mob) {
    var mobs = this.mapMobs_[mapId] || [];
    if (!_.contains(mobs, mob.id)) {
        mobs[mob.id] = mob;
    }
};

/**
 * @param {number} mapId
 * @return {Object}
 */
Entities.prototype.getPlayersJSON = function(mapId) {
    var json = {};
    var players = this.mapPlayers_[mapId] || [];
    _.each(players, function(player, key) {
       json[key] = player.toJSON();
    });
    return json;
};

/**
 * @param {Object.{userId, mapId, x, y}} data
 */
Entities.prototype.updatePlayerPosition = function(data) {
    var player = this.mapPlayers_[data.mapId][data.userId];
    if (player) {
        player.position.mapId = data.mapId;
        player.position.x = data.x;
        player.position.y = data.y;
    }
};

var instance_ = new Entities();

module.exports = instance_;