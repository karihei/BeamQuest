/**
 * 経験値バー
 * @constructor
 */
bq.hud.HotBar = bq.hud.HudItem.extend({
    ctor: function() {
        this.container_ = $('#bq-hot-bar');
    },

    /** @override */
    enable: function(enabled) {
        this.container_.hide(enabled);
    },

    /**
     * @param {number} num 0-9の数字
     */
    select: function(num) {
        var selectedItem = $('#bq-hot-bar-item-' + num);
        $('.bq-hot-bar-item').each(function(index, item) {
            if ($(item).attr('id') === $(selectedItem).attr('id')) {
                $(item).addClass('bq-hot-bar-item-selected');
            } else {
                $(item).removeClass('bq-hot-bar-item-selected');
            }
        });
    }

});