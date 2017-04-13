/// <reference path="server_modules/classes.js" />
let express = require('express');
let app = express();
let serv = require('http').Server(app);

app.get('/', (req, res) => { res.sendFile(__dirname + '/client/index.html'); });

app.use('/client', express.static(__dirname + '/client'));

serv.listen(2000);
console.log('Server Started.');

let SOCKET_LIST = {};

let GUID = require('./server_modules/GUID.js');
require('./server_modules/classes.js');

let io = require('socket.io')(serv, {});
io.sockets.on('connection', (socket) => {

    socket.id = GUID();
    SOCKET_LIST[socket.id] = socket;

    Player.onConnect(socket);

    socket.on('sendNickName', (data) => {

        if (data === '') {
            socket.emit('accessPlayerPlace', false);
            return;
        }

        Player.list[socket.id].nickName = data;

        socket.emit('accessPlayerPlace', true);

        let messagePack = createMessage(socket, 'was connected!', true, true);

        for (var i in SOCKET_LIST) {
            SOCKET_LIST[i].emit('addMessageToChat', messagePack);
        };

    });

    socket.on('disconnect', () => {

        if (!Player.list[socket.id]) {
            delete SOCKET_LIST[socket.id];
            return;
        }

        let messagePack = createMessage(socket, 'was disconnected!', true, false);

        for (var i in SOCKET_LIST) {
            SOCKET_LIST[i].emit('addMessageToChat', messagePack);
        };

        Player.onDisconnect(socket);

        delete SOCKET_LIST[socket.id];
    });

    socket.on('sendMessageToChat', (data) => {

        let messagePack = createMessage(socket, data, false, null);

        for (var i in SOCKET_LIST) {
            SOCKET_LIST[i].emit('addMessageToChat', messagePack);
        };

    });

    socket.on('ping', () => {

        socket.emit('pong');

    });

});

createMessage = (socket, message, basic, isSuccess) => {

    let playerName = Player.list[socket.id].nickName;

    let currentTime = new Date();

    let time = currentTime.getHours() + ':' + currentTime.getMinutes() + ':' + currentTime.getSeconds();

    let pack = {
        player: playerName,
        time: time,
        message: message,
        basic: basic,
        isSuccess: isSuccess
    };

    return pack;

}

let helpGenerator = new Promise((resolve, reject) => {

    let newHelp;

    setInterval(() => {

        newHelp = new Help();

        setTimeout(() => { newHelp.toRemove = true; }, 10000);

    }, 25000);

});

setInterval(() => {

    let packs = BasicFrame.getFrameUpdateData();

    helpGenerator

    for (let i in SOCKET_LIST) {

        let socket = SOCKET_LIST[i];

        socket.emit('init', packs.initPack);
        socket.emit('update', packs.updatePack);
        socket.emit('remove', packs.removePack);
    };

}, 1000 / 30);
