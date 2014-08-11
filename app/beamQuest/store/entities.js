var MapStore = require('beamQuest/store/maps'),
    deferred = require('deferred');


/**
 * ゲーム内のEntityの状態を保持しておくクラス
 * @constructor
 */
var Entities = function() {
    /**
     * マップごとのプレイヤー一覧
     * @typedef {
     *    mapId: {
     *       userId: ctrl.Player
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

    /**
     * マップごとのnpc一覧
     * @type {Object}
     * @private
     */
    this.mapNpcs_ = {};

    this.entityListener_ = require('beamQuest/listener/entity');
};

/**
 * @return {deferred.promise}
 */
Entities.prototype.init = function() {
    var d = deferred();
    _.each(MapStore.getInstance().getMaps(), function(map) {
        this.mapPlayers_[map.model.id] = {};
        this.mapMobs_[map.model.id] = {};
        this.mapNpcs_[map.model.id] = {};

    }.bind(this));
    return d.resolve();
};

/**
 * @param {number} mapId
 * @param {ctrl.Player} player
 */
Entities.prototype.addPlayer = function(mapId, player) {
    var players = this.mapPlayers_[mapId] || [],
        isAdd = !_.contains(players, player.model.id);

    if (isAdd) {
        players[player.model.id] = player;
    }
    logger.info('player add [mapId=' + mapId + ',playerId=' + player.model.id + ',isAdd=' + isAdd + ']');
};

/**
 * @param {number} mapId
 * @param {string} playerId
 * @return {ctrl.Player}
 */
Entities.prototype.getPlayerById = function(mapId, playerId) {
    if (this.mapPlayers_[mapId]) {
        return this.mapPlayers_[mapId][playerId] || null;
    }
    return null;
};

/**
 * @return {Object}
 */
Entities.prototype.getPlayers = function() {
    return this.mapPlayers_;
};

/**
 * @param {number} mapId
 * @return {Array.<ctrl.Player>}
 */
Entities.prototype.getMobsByMapId = function(mapId) {
    return this.mapPlayers_[mapId];
};
/**
 * @param {number} mapId
 * @param {ctrl.Player} player
 */
Entities.prototype.removePlayer = function(mapId, player) {
    var players = this.mapPlayers_[mapId] || [];

    if (players[player.model.id]) {
        delete players[player.model.id];
        logger.info('player remove [mapId=' + mapId + ',playerId=' + player.model.id + ']');
    } else {
        logger.warn('cannot remove player [mapId=' + mapId + ',playerId=' + player.model.id + ']');
    }

};

/**
 * @param {model.Map} map
 * @param {ctrl.Mob} mob
 */
Entities.prototype.addMob = function(map, mob) {
    var mobs = this.mapMobs_[map.id] || [];
    if (!_.contains(mobs, mob.model.id)) {
        mobs[mob.model.id] = mob;
        map.mobCount++;
        this.entityListener_.popMob(mob);
    }
};

/**
 * @param {ctrl.Mob} mob
 */
Entities.prototype.removeMob = function(mob) {
    var map = MapStore.getInstance().getMapById(mob.model.position.mapId);
    if (map) {
        map.model.mobCount--;
        delete this.mapMobs_[map.model.id][mob.model.id];
        mob.dispose();
    }
};

/**
 * @return {Object}
 */
Entities.prototype.getMobs = function() {
    return this.mapMobs_;
};

/**
 * @param {number} mapId
 * @return {Array.<ctrl.Mob>}
 */
Entities.prototype.getMobsByMapId = function(mapId) {
    return this.mapMobs_[mapId];
};

/**
 * @param {number mapId
 * @param {string} mobId
 * @return {ctrl.Mob}
 */
Entities.prototype.getMobById = function(mapId, mobId) {
    if (this.mapMobs_[mapId]) {
        return this.mapMobs_[mapId][mobId] || null;
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
        json[key] = player.model.toJSON();
    });
    return json;
};


/**
 * @param {number} mapId
 * @return {Object}
 */
Entities.prototype.getMobsJSON = function(mapId) {
    var json = {};
    var mobs = this.mapMobs_[mapId] || [];
    _.each(mobs, function(mob, key) {
        json[key] = mob.model.toJSON();
    });
    return json;
};

/**
 * @param {Object.{userId, mapId, x, y}} data
 */
Entities.prototype.updatePlayerPosition = function(data) {
    var player = this.mapPlayers_[data.mapId][data.userId];
    if (player) {
        player.model.position.mapId = data.mapId;
        player.model.position.x = data.x;
        player.model.position.y = data.y;
    }
};

/**
 * 指定座標を中心とする半径rの円内に含まれるMobを返す
 * @param {model.Position} targetPos
 * @param {number} r
 * @return {Array.<ctrl.Entity>}
 */
Entities.prototype.getMobsByRadius = function(targetPos, r) {
    var mobs = this.getMobsByMapId(targetPos.mapId, r);
    return this.getEntitiesByRadiusInternal_(targetPos, r, mobs);
};

/**
 * 指定座標を中心とする半径rの円内に含まれるPlayerを返す
 * @param {model.Position} targetPos
 * @param {number} r
 * @return {Array.<ctrl.Entity>}
 */
Entities.prototype.getPlayersByRadius = function(targetPos, r) {
    var players = this.getPlayersByMapId(targetPos.mapId);
    return this.getEntitiesByRadiusInternal_(targetPos, r, players);
};

/**
 * @param {Array.<ctrl.Entity>} entities
 * @param {number} r
 * @return {Array.<ctrl.Entity>}
 * @private
 */
Entities.prototype.getEntitiesByRadiusInternal_ = function(targetPos, r, entities) {
    var result = [];
    var r2 = Math.pow(r, 2);

    _.forEach(entities, function(entity) {
        var px = entity.model.position.x - targetPos.x;
        var py = entity.model.position.y - targetPos.y;
            var entDist = Math.pow(px, 2) + Math.pow(py, 2);
        if (r2 >= entDist) {
            result.push(entity);
        }
    });
    return result;
};

var instance_ = new Entities();

module.exports = instance_;
