/**
 * ターゲットにラインをニョーンて伸ばす。FF12/FF14のアレやね。
 */
bq.entity.TargetLine = cc.Node.extend({
    /**
     * @param {bq.entity.Entity} source
     * @param {bq.entity.Entity} target
     */
    ctor: function(source, target) {
        this._super();

        /**
         * タゲる人
         * @type {bq.entity.Entity}
         * @private
         */
        this.source_ = source;

        /**
         * タゲられる人
         * @type {bq.entity.Entity}
         * @private
         */
        this.target_ = target;

        /**
         * 線分の末尾
         * @private
         */
        this.tail_;

        /**
         * 線分先頭
         * @private
         */
        this.head_;

        this.step_ = 1;
        this.maxStep_ = 10;

        this.scheduleUpdate();
        this.schedule(this.clearLine, 3);
        this.isActive_ = false;
        bq.baseLayer.addChild(this);
    },

    update: function() {
        if (this.isActive_) {
            this.updateLine_();
            if (this.maxStep_ > this.step_) {
                this.step_++;
            }
        }
    },

    initLine_: function() {
        var head = cc.Sprite.create();
        head.setTextureRect(cc.rect(0,0,3,3));
        head.setColor(cc.c3b(255,10,10));
        head.setPosition(this.source_.getPosition());
        this.head_ = head;
        this.addChild(this.head_);

        var tail = cc.Sprite.create();
        tail.setPosition(this.target_.getPosition());
        this.tail_ = tail;
        this.addChild(this.tail_);

        this.line_ = cc.DrawNode.create();
        this.addChild(this.line_, 10);
    },

    updateLine_: function() {
        var p1 = this.source_.getPosition();
        var p2 = this.target_.getPosition();
        var ratio = this.step_ / this.maxStep_;
        var pSub = cc.pSub(p2, p1);

        this.tail_.setPosition(p1);
        this.head_.setPosition(cc.pAdd(p1, cc.pMult(pSub, ratio)));

        this.line_.clear();
        this.line_.drawSegment(this.tail_.getPosition(), this.head_.getPosition(), 2, cc.c4f(1, 0, 0, 0.6));
        this.line_.drawSegment(this.tail_.getPosition(), this.head_.getPosition(), 1, cc.c4f(1, 0.8, 0.8, 0.7));
    },

    /**
     */
    drawLine: function() {
        this.initLine_();
        bq.soundManager.playEffect(s_SeTargetLine);
        this.isActive_ = true;
    },

    clearLine: function() {
        var fadeOut = cc.FadeOut.create(0.5);
        var callFunc = cc.CallFunc.create(function() {
            this.isActive_ = false;
            this.line_.clear();
            this.step_ = 1;
            this.tail_.removeFromParent();
            this.head_.removeFromParent();
            this.line_.removeFromParent();
        }.bind(this));

        this.runAction(cc.Sequence.create(fadeOut, callFunc));
    }

});