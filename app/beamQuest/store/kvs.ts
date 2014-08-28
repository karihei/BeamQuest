/// <reference path="../../../typings/node_redis/node_redis.d.ts" />
/// <reference path="../../../typings/config/config.d.ts" />

import redis = require('redis');
import config = require('config');

declare var logger: any;

var CONFIG = config.kvs;

/**
 * @fileoverview オンメモリのKVS的なやつ。redisに置き換える？
 */
class SessionStore {
    private static instance_:SessionStore;
    public static getInstance():SessionStore {
        if (SessionStore.instance_ === undefined) {
            SessionStore.instance_ = new SessionStore();
        }
        return SessionStore.instance_;
    }

    constructor() {
        if (SessionStore.instance_){
            throw new Error("Error: Instantiation failed: Use SessionStore.getInstance() instead of new.");
        }
        SessionStore.instance_ = this;

        this.session_ = {};
        this.isEnd =  false;
    }

    private session_: Object;
    private isEnd: boolean;

    get(key, callback) {
        if (this.isEnd) {
            callback('connection already closed', null);
        }
        if (key in this.session_) {
            callback(null, this.session_[key]);
        }
        else {
            callback(null, null);
        }
    }

    set(key, value) {
        this.session_[key] = value;
    }

    del(key) {
        delete this.session_[key];
    }

    flushall(callback) {
        if (this.isEnd) {
            callback(false);
        }
        this.session_ = {};
        logger.info('kvs flushall');
        callback(true);
    }

    end() {
        this.isEnd = true;
    }

}

export function createClient(): any {
    logger.info('kvs type: ' + CONFIG.type);
    if (CONFIG.type === 'memory') {
        return SessionStore.getInstance();
    } else if (CONFIG.type === 'redis') {
        var client = redis.createClient(CONFIG.port, CONFIG.host);
        client.auth(CONFIG.pass);
        return client;
    }
    return null;
}