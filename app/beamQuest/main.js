var ping = require('beamQuest/listener/ping'),
    login = require('beamQuest/listener/login'),
    world = require('beamQuest/listener/world'),
    beam = require('beamQuest/listener/beam'),
    entity = require('beamQuest/listener/entity'),
    skill = require('beamQuest/listener/skill'),
    entities = require('beamQuest/store/entities'),
    item = require('beamQuest/listener/item'),
    mapStore = require('beamQuest/store/maps'),
    Scheduler = require('beamQuest/scheduler'),
    usage = require('usage');

exports.start = function(io) {
    /**
     * 依存関係のある初期化処理を逐次実行する
     * @private
     */
    function initDependencies_() {
        var mapDeferred = mapStore.init();
        mapDeferred.then(init_);
    }

    function init_() {
        var config = {
            STEP_INTERVAL: 30 // mainループの間隔(msec)
        };
        entities.init();
        _.each(mapStore.getMaps(), function(map) {
            map.initMobs();
        }.bind(this));


        io.sockets.on('connection', function(socket) {
            login.listen(socket, io);
            world.listen(socket);
            beam.listen(socket, io);
            skill.listen(socket, io);
            entity.listen(socket, io);
            item.listen(socket, io);
            ping.listen(socket);

            // チャット
            socket.on('message:update', function(data) {
                socket.broadcast.emit('notify:message', data);
            });

            socket.emit('connected');
        });
        setInterval(main, config.STEP_INTERVAL);
        setInterval(logUsage, 1000);
    }

    function main() {
        Scheduler.getInstance().update();
    }

    function logUsage() {
        "use strict";

        usage.lookup(process.pid, function(err, result) {
            logger.debug('cpu: ' + result.cpu + ', memory: ' + result.memory);
        });
    }

    initDependencies_();
};

