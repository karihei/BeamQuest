/// <reference path="../../../typings/node_redis/node_redis.d.ts" />
/// <reference path="../../../typings/config/config.d.ts" />
var redis = require('redis');
var config = require('config');

var CONFIG = config.kvs;

/**
* @fileoverview オンメモリのKVS的なやつ。redisに置き換える？
*/
var SessionStore = (function () {
    function SessionStore() {
        this.session_ = {};
        this.isEnd = false;
    }
    SessionStore.prototype.get = function (key, callback) {
        if (this.isEnd) {
            callback('connection already closed', null);
        }
        if (key in this.session_) {
            callback(null, this.session_[key]);
        } else {
            callback(null, null);
        }
    };

    SessionStore.prototype.set = function (key, value) {
        this.session_[key] = value;
    };

    SessionStore.prototype.del = function (key) {
        delete this.session_[key];
    };

    SessionStore.prototype.flushall = function (callback) {
        if (this.isEnd) {
            callback(false);
        }
        this.session_ = {};
        logger.info('kvs flushall');
        callback(true);
    };

    SessionStore.prototype.end = function () {
        this.isEnd = true;
    };

    SessionStore.createClient = function () {
        logger.info('kvs type: ' + CONFIG.type);
        if (CONFIG.type === 'memory') {
            return SessionStore;
        } else if (CONFIG.type === 'redis') {
            var client = redis.createClient(CONFIG.port, CONFIG.host);
            client.auth(CONFIG.pass);
            return client;
        }
        return null;
    };
    return SessionStore;
})();

module.exports = SessionStore;
//# sourceMappingURL=kvs.js.map
