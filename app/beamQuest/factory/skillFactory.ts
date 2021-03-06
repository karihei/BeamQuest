import SkillModel = require('../model/skill');
import PositionModel = require('../model/position');
import EntityCtrl = require('../ctrl/entity');
import BurnStrike = require('../skill/burnStrike');
import BioShock = require('../skill/bioShock');

declare var bq: any;

class SkillFactory {
    private static instance_:SkillFactory;
    public static getInstance():SkillFactory {
        if (SkillFactory.instance_ === undefined) {
            SkillFactory.instance_ = new SkillFactory();
        }
        return SkillFactory.instance_;
    }

    constructor() {
        if (SkillFactory.instance_){
            throw new Error("Error: Instantiation failed: Use SkillFactory.getInstance() instead of new.");
        }
        SkillFactory.instance_ = this;
    }

    /**
     * スキルmodelに該当するskillクラスをnewして返す
     * @param {!model.Skill} skillModel スキルmodel
     * @param {!ctrl.Entity} user スキル使用者
     * @param {!model.Position} targetPos スキルのターゲット座標
     */
    create(skillModel:SkillModel, user:EntityCtrl, targetPos:PositionModel) {
        var s = bq.params.Skills;
        var clazz;

        switch(skillModel.id) {
            case s.BURNSTRIKE.id:
                clazz = BurnStrike;
                break;
            case s.BIOSHOCK.id:
                clazz = BioShock;
                break;
            default:
                return null;
        }

        if (clazz) {
            return new clazz(skillModel, user, targetPos);
        } else {
            return null;
        }
    }
}

export = SkillFactory;