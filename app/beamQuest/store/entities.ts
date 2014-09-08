/// <reference path="../../../typings/deferred/deferred.d.ts" />

import EntityListener = require('beamQuest/listener/entity');
import MapStore = require('beamQuest/store/maps');
import MapModel = require('beamQuest/model/fieldMap');
import PositionModel = require('beamQuest/model/position');
import EntityCtrl = require('beamQuest/ctrl/entity');
import PlayerCtrl = require('beamQuest/ctrl/player');
import MobCtrl = require('beamQuest/ctrl/mob/mob');
import deferred = require('deferred');

declare var logger: any;

/**
 * ゲーム内のEntityの状態を保持しておくクラス
 */
class EntitiesStore {
    private static instance_:EntitiesStore;
    public static getInstance():EntitiesStore {
        if (EntitiesStore.instance_ === undefined) {
            EntitiesStore.instance_ = new EntitiesStore();
        }
        return EntitiesStore.instance_;
    }

    constructor() {
        if (EntitiesStore.instance_){
            throw new Error("Error: Instantiation failed: Use EntitiesStore.getInstance() instead of new.");
        }
        EntitiesStore.instance_ = this;

        this.mapPlayers_ = [];
        this.mapMobs_ = [];
        this.mapNpcs_ = {};
    }

    /** マップごとのプレイヤー一覧 */
    private mapPlayers_:PlayerCtrl[];

    /** マップごとのmob一覧 */
    private mapMobs_:MobCtrl[];

    /**
     * マップごとのnpc一覧
     * @type {Object}
     */
    private mapNpcs_;

    init() {
        this.mapPlayers_ = [];
        this.mapMobs_ = [];
        this.mapNpcs_ = [];
    }

    /**
     * @param {ctrl.Player} player
     */
    addPlayer(player:any) {
        var isAdd = !_.contains(this.mapPlayers_, player.model.id);

        if (isAdd) {
            this.mapPlayers_[player.model.id] = player;
        }
        logger.info('player add [mapId=' + player.model.position.mapId + ',playerId=' + player.model.id + ',isAdd=' + isAdd + ']');
    }

    /**
     * @param {string} playerId
     * @return {ctrl.Player}
     */
    getPlayerById(playerId) : PlayerCtrl {
        return this.mapPlayers_[playerId] || null;
    }

    /**
     * @return PlayerCtrl[]
     */
    getPlayers() {
        return this.mapPlayers_;
    }

    /**
     * @param {number} mapId
     * @return {PlayerCtrl[]}
     */
    getPlayersByMapId(mapId:number) {
        return _.filter(this.mapPlayers_, (player:PlayerCtrl) => {
            return player.model.mapId === mapId;
        });
    }

    /**
     * @param {ctrl.Player} player
     */
    removePlayer(player:any) {

        if (this.mapPlayers_[player.model.id]) {
            delete this.mapPlayers_[player.model.id];
            logger.info('player remove [mapId=' + player.model.position.mapId + ',playerId=' + player.model.id + ']');
        } else {
            logger.warn('cannot remove player [mapId=' + player.model.position.mapId + ',playerId=' + player.model.id + ']');
        }
    }

    /**
     * @param {model.Map} map
     * @param {ctrl.Mob} mob
     */
    addMob(map:MapModel, mob:any) {
        if (!_.contains(this.mapMobs_, mob.model.id)) {
            this.mapMobs_[mob.model.id] = mob;
            map.mobCount++;
            EntityListener.getInstance().popMob(mob);
        }
    }

    /**
     * @param {ctrl.Mob} mob
     */
    removeMob(mob:any) {
        var map:any = MapStore.getInstance().getMapById(mob.model.position.mapId);
        if (map) {
            map.model.mobCount--;
            delete this.mapMobs_[map.model.id][mob.model.id];
            mob.dispose();
        }
    }

    /**
     * @return {MobCtrl[]}
     */
    getMobs() {
        return this.mapMobs_;
    }

    /**
     * @param {string} mobId
     * @return {ctrl.Mob}
     */
    getMobById(mobId) {
        return this.mapMobs_[mobId] || null;
    }

    /**
     * @return {Object}
     */
    getPlayersJSON() {
        var json = {};
        _.each(this.mapPlayers_, (player:PlayerCtrl, key) => {
            json[key] = player.model.toJSON();
        });
        return json;
    }


    /**
     * @return {Object}
     */
    getMobsJSON() {
        var json = {};
        _.each(this.mapMobs_, (mob:any, key) => {
            json[key] = mob.model.toJSON();
        });
        return json;
    }

    /**
     * @param {Object.{userId, mapId, x, y}} data
     */
    updatePlayerPosition(data) {
        var player = this.mapPlayers_[data.userId];
        if (player) {
            player.model.position.mapId = data.mapId;
            player.model.position.x = data.x;
            player.model.position.y = data.y;
        }
    }

    /**
     * 指定座標を中心とする半径rの円内に含まれるMobを返す
     * @param {model.Position} targetPos
     * @param {number} r
     * @return {Array.<ctrl.Entity>}
     */
    getMobsByRadius(targetPos:PositionModel, r): EntityCtrl[] {
        return this.getEntitiesStoreByRadiusInternal_(targetPos, r, this.getMobs());
    }

    /**
     * 指定座標を中心とする半径rの円内に含まれるPlayerを返す
     * @param {model.Position} targetPos
     * @param {number} r
     * @return {Array.<ctrl.Entity>}
     */
    getPlayersByRadius(targetPos:PositionModel, r): EntityCtrl[] {
        var players:any = this.getPlayersByMapId(targetPos.mapId);
        return this.getEntitiesStoreByRadiusInternal_(targetPos, r, players);
    }

    /**
     * @param {Position} targetPos
     * @param {number} r
     * @param {MobCtrl[]} entities
     * @return {Array.<ctrl.Entity>}
     */
    private getEntitiesStoreByRadiusInternal_(targetPos, r, entities:MobCtrl[]): EntityCtrl[] {
        var result = [];
        var r2 = Math.pow(r, 2);

        _.forEach(entities, (entity:any) => {
            var px = entity.model.position.x - targetPos.x;
            var py = entity.model.position.y - targetPos.y;
            var entDist = Math.pow(px, 2) + Math.pow(py, 2);
            if (r2 >= entDist) {
                result.push(entity);
            }
        });
        return result;
    }
}

export = EntitiesStore;
