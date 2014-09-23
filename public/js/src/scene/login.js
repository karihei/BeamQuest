/**
 * @class
 * @extends cc.Layer
 */
bq.scene.LoginLayer = cc.Layer.extend({
    status: {
        SUCCESS: 'success', // ログイン成功
        CREATE: 'create',   // サインアップ成功
        ERROR: 'error'        // ログイン失敗
    },
    init: function() {
        this._super();
        this.defaultPlaceHolder_ = '< click here >';
    },

    onEnter: function() {
        this._super();
        var size = cc.director.getWinSize();
        var title = bq.Label.createWithShadow('- Beam Quest Online -', 50);
        title.setPosition(cc.p(size.width/2, size.height - 100));
        this.addChild(title);

        var label = bq.Label.create('キャラクター名を入力してください。', 16);
        label.setPosition(cc.p(size.width/2, size.height/2 + 50));
        this.addChild(label);

        var nameField = new cc.TextFieldTTF(this.defaultPlaceHolder_, 'systemFont', 32);
        this.addChild(nameField);
        nameField.setPosition(cc.p(size.width / 2, size.height / 2));
        this.nameField_ = nameField;

        var versionLabel = bq.Label.create(bq.config.version);
        var versionSize = versionLabel.getContentSize();
        versionLabel.setPosition(cc.p(size.width - versionSize.width, versionSize.height));
        this.addChild(versionLabel);

        cc.eventManager.addListener(cc.EventListener.create({
            event: cc.EventListener.KEYBOARD,

            onKeyReleased: function(key) {
                if (key === cc.KEY.enter) {
                    this.processLogin_(this.nameField_.getContentText());
                }
            }.bind(this)
        }), this);

        cc.eventManager.addListener(cc.EventListener.create({
            event: cc.EventListener.MOUSE,

            onMouseUp: function(evt) {
                var rect = this.getTextInputRect_(this.nameField_);
                var point = evt.getLocation();
                this.enableIME_(cc.rectContainsPoint(rect, point));
            }.bind(this)
        }), this);
    },

    /**
     * ログイン処理を進める
     * @param {string} userId
     * @private
     */
    processLogin_: function(userId) {
        var soc = bq.Socket.getInstance();
        var hash = cc.sys.localStorage.getItem('userHash:' + userId);
        if (!hash) {
            hash = this.createHash_(userId);
        }

        soc.tryLogin(userId, hash, function(data) {
            if (data.result === this.status.SUCCESS) {
                cc.sys.localStorage.setItem('userHash:' + userId, hash);
                console.log(userId + 'がログインしました。');
                this.welcomeToBeamQuestWorld_(userId, data);
            } else if (data.result === this.status.ERROR) {
                this.loginFailed_(data.message);
            }
        }, this);
    },

    /**
     * フィールド画面へ飛ぶ
     * @param {string} userId
     * @private
     */
    welcomeToBeamQuestWorld_: function(userId, data) {
        this.initPlayer_(userId, data);
        bq.Socket.getInstance().initAfterLogin();
        if (data.player.position.mapId == '1') {
            bq.loadingTo(new bq.scene.BeamQuestWorldScene());
        } else if (data.player.position.mapId == '2') {
            bq.loadingTo(new bq.scene.BeamQuestWorldScene2());
        }
    },

    /**
     * 主人公を生成してbq.playerにセットする
     * @param {string} userId
     * @private
     */
    initPlayer_: function(userId, data) {
        // TODO: このクラスでframeCacheにセットするのはハイパー違和感があるので初期設定用のクラスとか作ってやりたい
        // init frame cache
        cc.spriteFrameCache.addSpriteFrames(s_PlistPlayerWalking, s_ImgPlayerWalking);
        cc.spriteFrameCache.addSpriteFrames(s_PlistSimpleBeam, s_ImgSimpleBeam);
        cc.spriteFrameCache.addSpriteFrames(s_PlistPlayerMisc, s_ImgPlayerMisc);

        var player = new bq.entity.Player();
        var hud = bq.Hud.getInstance();
        hud.initPlayer(player);
        var position = data.player.position;
        player.setPosition(cc.p(position.x, position.y));

        player.setModel(new bq.model.Player(data.player));
        player.setProfile({name: userId});
        player.showName();
        bq.player = player;

    },

    /**
     * ログイン失敗した時の処理
     * @param {string} message
     * @private
     */
    loginFailed_: function(message) {
        var failedLabel = bq.Label.create(message);
        var nameP = this.nameField_.getPosition();
        failedLabel.setPosition(nameP.x + 10, nameP.y - 30);
        this.addChild(failedLabel);
        // 数秒後に消えるように
        _.delay(_.bind(function() {
            "use strict";
            this.removeChild(failedLabel);
        }, this), 2000);
    },

    /**
     * パスワードの代わりにランダムハッシュを使う
     * @param {string} userId
     * @return {string}
     * @private
     */
    createHash_: function(userId) {
        var randomStr = userId + new Date().toString();
        return CybozuLabs.MD5.calc(randomStr);
    },

    /** @override */
    onTouchesEnded: function() {
        var userName = window.prompt('キャラクター名を入力してください', '');
        if (userName) {
            this.processLogin_(userName);
        }
    },

    /**
     * テキストフィールドにフォーカスが当たった/外れたらIMEをattach/detachする
     * @param {boolean} isClicked
     * @private
     */
    enableIME_: function(isClicked) {
        if (isClicked) {
            this.nameField_.attachWithIME();
            this.nameField_.setPlaceHolder('|');
        } else {
            this.nameField_.detachWithIME();
            this.nameField_.setPlaceHolder(this.defaultPlaceHolder_);
        }
    },

    /**
     * @param {cc.Node} node
     * @return {cc.rect}
     * @private
     */
    getTextInputRect_: function (node) {
        var pos = node.getPosition();
        var cs = node.getContentSize();
        var rc = cc.rect(pos.x, pos.y, cs.width, cs.height);
        rc.x -= rc.width / 2;
        rc.y -= rc.height / 2;
        return rc;
    }
});

/**
 * @class
 * @extends cc.Scene
 */
bq.scene.LoginScene = bq.scene.extend({
    onEnter: function() {
        this._super();
        var layer = new bq.scene.LoginLayer();
        layer.init();
        this.addChild(layer);
    }
});
