var util = require('util'),
    EntityModel = require('beamQuest/model/entity'),
    ScheduleTarget = require('beamQuest/scheduleTarget'),
    EntityListener = require('beamQuest/listener/entity');

/**
 * すべてのmob、playerの基底クラス。
 * HPの増減、ステータス異常、死亡処理など敵味方関係のない共通の処理はここに書く
 * @constructor
 * @param {Object} modelData
 * @extends {bq.ScheduleTarget}
 */
var Entity = function(modelData) {
    ScheduleTarget.apply(this, arguments);
};
util.inherits(Entity, ScheduleTarget);

/**
 * ctrlをnewしたあとは必ずこれを呼んでmodel(各種ステータスとか)をセットすること
 * @param {model.Entity} model
 */
Entity.prototype.setModel = function(model) {
    this.model = model;

    this.model.on('addHp', _.bind(this.handleAddHp, this));
};

/**
 * @param {number} amount
 * @param {boolean} isCritical
 * @protected
 */
Entity.prototype.handleAddHp = function(amount, isCritical) {
    var hpData = [
        {entity: this.model, hpAmount: amount, isCritical: isCritical}
    ];
    EntityListener.getInstance().updateHp(hpData);
    if (this.model.hp <= 0) {
        this.death();
    }
};

/**
 * 死亡フラグ
 * @protected
 */
Entity.prototype.death = function() {
    // playerとかmobとかでoverrideする
};

module.exports = Entity;
