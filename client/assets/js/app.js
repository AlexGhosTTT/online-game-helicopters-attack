window.addEventListener('load', () => {

    let socket = io();

    let inputNickName = document.getElementById('inputNickName');
    let inputNickNameButton = document.getElementById('inputNickNameButton');

    inputNickNameButton.addEventListener('click', () => {

        socket.emit('sendNickName', inputNickName.value);
        inputNickName.value = '';

    });

    let signin = document.getElementById('signin');
    let mainDivGame = document.getElementById('mainDivGame');

    socket.on('accessPlayerPlace', (data) => {

        if (data) {
            signin.style.display = 'none';
            mainDivGame.style.display = 'block';
        };

    });

    let placeMessage = document.getElementById('placeMessage');
    let inputMessage = document.getElementById('inputMessage');
    let sendMessage = document.getElementById('sendMessage');

    socket.on('addMessageToChat', (data) => {

        let li = document.createElement('li');

        let spanTime = document.createElement('span');
        spanTime.innerHTML = data.time + ' ';

        let spanName = document.createElement('span');
        spanName.innerHTML = data.player + ': ';

        li.appendChild(spanTime);
        li.appendChild(spanName);

        li.classList.add('list-group-item');

        if (!data.basic) {

            if (placeMessage.children.length % 2) {
                li.classList.add('ist-group-item-text');
            } else {
                li.classList.add('list-group-item-info');
            }

        } else {

            if (data.isSuccess) {
                li.classList.add('list-group-item-success');
            } else {
                li.classList.add('list-group-item-danger');
            }

        }

        li.innerHTML += data.message;

        placeMessage.appendChild(li);

    });

    sendMessage.addEventListener('click', () => {

        if (inputMessage.value !== '') {

            socket.emit('sendMessageToChat', inputMessage.value);

            inputMessage.value = '';
        }

    });

    let game_area = document.getElementById('game_area').getContext('2d');

    let playerId = null;
    let spriteAminationCounter = 0;
    let startTime;

    class Player {

        constructor(pack) {

            this.id = pack.id;
            this.nickName = pack.nickName;
            this.direction = pack.direction;
            this.shoot = pack.shoot;
            this.img = pack.image === 1 ? imagePackage.greenHelicopterSpriteSheet : imagePackage.grayHelicopterSpriteSheet;
            this.x = pack.x;
            this.y = pack.y;
            this.hp = pack.hp;
            this.hpMax = pack.hpMax;
            this.score = pack.score;
            this.isDiedObj = pack.isDiedObj;

            Player.list[this.id] = this;

        };


        drawPlayer(spriteAminationCounter) {

            if (this.isDiedObj.isDied) {
                this.drawPlayerExplosion(spriteAminationCounter, this.isDiedObj.isDiedX, this.isDiedObj.isDiedY);
            };

            this.drawPlayerInterface();

            this.drawPlayerImage(spriteAminationCounter);

        };

        drawPlayerInterface() {

            let hpWidth = 50 * this.hp / this.hpMax;

            game_area.fillStyle = 'black';
            game_area.font = "8px monospace";

            game_area.textBaseline = 'middle';
            game_area.textAlign = "center";

            game_area.fillText(this.nickName, this.x, this.y - 50);

            game_area.fillStyle = 'red';

            game_area.fillRect(this.x - hpWidth / 2, this.y - 40, hpWidth, 4);

        };

        drawPlayerImage(spriteAminationCounter) {

            let w = (this.img.width / 4) / 2;
            let h = (this.img.height / 4) / 2;

            let frameWidth = this.img.width / 4;
            let frameHeigth = this.img.height / 4;

            let flyMode = Math.floor(spriteAminationCounter) % 4;

            let position = this.direction * 2;

            if (this.shoot) {
                ++position;
            };

            game_area.drawImage(this.img, flyMode * frameWidth, frameHeigth * position, frameWidth, frameHeigth, this.x - w / 2, this.y - h / 2, w, h);
        };

        drawPlayerExplosion(spriteAminationCounter, x, y) {

            let explosionImage = imagePackage.explosionSpriteSheet;

            let frameWidth = explosionImage.width / 12;
            let frameHeigth = explosionImage.height / 1;

            let flyMode = Math.floor(spriteAminationCounter) % 13;

            game_area.drawImage(explosionImage, flyMode * frameWidth, 0, frameWidth, frameHeigth, x - frameWidth / 2, y - frameHeigth / 2, frameWidth, frameHeigth);

        };
    };

    Player.list = {};

    class Bullet {

        constructor(pack) {
            this.id = pack.id;
            this.direction = pack.direction;
            this.x = pack.x;
            this.y = pack.y;

            Bullet.list[this.id] = this;
        };

        drawBullet() {

            let w = imagePackage.bullet.width / 3;
            let h = imagePackage.bullet.height / 3;

            game_area.drawImage(imagePackage.bullet, 0, 0, imagePackage.bullet.width, imagePackage.bullet.height, this.x - w / 2, this.y - h / 2, w, h);
        };

    };

    Bullet.list = {};

    class Rocket {

        constructor(pack) {
            this.id = pack.id;
            this.direction = pack.direction;
            this.x = pack.x;
            this.y = pack.y;

            Rocket.list[this.id] = this;

        };

        drawRocket() {

            let w = (imagePackage.rocket.width / 2) / 10;
            let h = (imagePackage.rocket.height / 1) / 10;

            let frameWidth = imagePackage.rocket.width / 2;
            let frameHeigth = imagePackage.rocket.height / 1;

            game_area.drawImage(imagePackage.rocket, frameWidth * this.direction, 0, frameWidth, frameHeigth, this.x - w / 2, this.y - h / 2, w, h);
        };

    };

    Rocket.list = {};

    class Help {

        constructor(pack) {

            this.id = pack.id;
            this.x = pack.x;
            this.y = pack.y;

            Help.list[this.id] = this;

        };

        drawHelp() {

            let w = imagePackage.medicalKit.width / 6;
            let h = imagePackage.medicalKit.height / 6;

            game_area.drawImage(imagePackage.medicalKit, 0, 0, imagePackage.medicalKit.width, imagePackage.medicalKit.height, this.x - w / 2, this.y - h / 2, w, h);
        };

    };

    Help.list = {};

    let drawBackground = () => {
        game_area.drawImage(imagePackage.background, 0, 0, 1280, 720);
    }

    let drawScore = () => {

        game_area.fillStyle = 'black';
        game_area.textAlign = "start";
        game_area.font = "25px monospace";

        game_area.fillText('Score: ' + Player.list[playerId].score, 15, 25);
    }

    document.onkeydown = (event) => {

        if (event.keyCode === 68) { //d
            socket.emit('keyPress', { imputId: 'rigth', state: true });
        } else if (event.keyCode === 83) { //s
            socket.emit('keyPress', { imputId: 'down', state: true });
        } else if (event.keyCode === 65) { //a
            socket.emit('keyPress', { imputId: 'left', state: true });
        } else if (event.keyCode === 87) { //w
            socket.emit('keyPress', { imputId: 'up', state: true });
        } else if (event.keyCode === 32) { //space
            socket.emit('keyPress', { imputId: 'space', state: true });
        } else if (event.keyCode === 16) { //shift
            socket.emit('keyPress', { imputId: 'shift', state: true });
        }
    };

    document.onkeyup = (event) => {

        if (event.keyCode === 68) { //d
            socket.emit('keyPress', { imputId: 'rigth', state: false });
        } else if (event.keyCode === 83) { //s
            socket.emit('keyPress', { imputId: 'down', state: false });
        } else if (event.keyCode === 65) { //a
            socket.emit('keyPress', { imputId: 'left', state: false });
        } else if (event.keyCode === 87) { //w
            socket.emit('keyPress', { imputId: 'up', state: false });
        } else if (event.keyCode === 32) { //space
            socket.emit('keyPress', { imputId: 'space', state: false });
        } else if (event.keyCode === 16) { //shift
            socket.emit('keyPress', { imputId: 'shift', state: false });
        }
    };

    setInterval(() => {

        game_area.clearRect(0, 0, 800, 600);
        drawBackground();

        for (let i in Player.list) {
            Player.list[i].drawPlayer(spriteAminationCounter);
        };

        for (let i in Bullet.list) {
            Bullet.list[i].drawBullet();
        };

        for (let i in Rocket.list) {
            Rocket.list[i].drawRocket();
        };

        for (let i in Help.list) {
            Help.list[i].drawHelp();
        };

        drawScore();

        spriteAminationCounter += 0.75;

        //startTime = Date.now();
        //socket.emit('ping');
     
    }, 1000 / 30);

    //socket.on('pong', function () {
    //    latency = Date.now() - startTime;
    //    console.log(latency);
    //});

    socket.on('init', (data) => {

        if (data.playerId) {
            playerId = data.playerId;
        }

        for (let i = 0; i < data.player.length; i++) {
            new Player(data.player[i]);
        };

        for (let i = 0; i < data.bullet.length; i++) {
            new Bullet(data.bullet[i]);
        };

        for (let i = 0; i < data.rocket.length; i++) {
            new Rocket(data.rocket[i]);
        };

        for (let i = 0; i < data.help.length; i++) {
            new Help(data.help[i]);
        };

    });

    socket.on('update', (data) => {

        for (let i = 0; i < data.player.length; i++) {

            let serverPlayer = data.player[i];
            let localPlayer = Player.list[serverPlayer.id];

            localPlayer.x = serverPlayer.x;
            localPlayer.y = serverPlayer.y;
            localPlayer.nickName = serverPlayer.nickName;
            localPlayer.hp = serverPlayer.hp;
            localPlayer.score = serverPlayer.score;
            localPlayer.direction = serverPlayer.direction;
            localPlayer.shoot = serverPlayer.shoot;
            localPlayer.isDiedObj = serverPlayer.isDiedObj;

        };

        for (let i = 0; i < data.bullet.length; i++) {

            let serverBullet = data.bullet[i];
            let localBullet = Bullet.list[serverBullet.id];

            localBullet.x = serverBullet.x;
            localBullet.y = serverBullet.y;
            localBullet.direction = serverBullet.direction;

        };

        for (let i = 0; i < data.rocket.length; i++) {

            let serverRocket = data.rocket[i];
            let localRocket = Rocket.list[serverRocket.id];

            localRocket.x = serverRocket.x;
            localRocket.y = serverRocket.y;
            localRocket.direction = serverRocket.direction;

        };

        for (let i = 0; i < data.help.length; i++) {

            let serverHelp = data.help[i];
            let localHelp = Help.list[serverHelp.id];

            localHelp.x = serverHelp.x;
            localHelp.y = serverHelp.y;

        };

    });

    socket.on('remove', (data) => {

        for (let i = 0; i < data.player.length; i++) {
            delete Player.list[data.player[i]];
        };

        for (let i = 0; i < data.bullet.length; i++) {
            delete Bullet.list[data.bullet[i]];
        };

        for (let i = 0; i < data.rocket.length; i++) {
            delete Rocket.list[data.rocket[i]];
        };

        for (let i = 0; i < data.help.length; i++) {
            delete Help.list[data.help[i]];
        };

    });

    socket.on('disconnect', (data) => {
      
        let li = document.createElement('li');

        li.classList.add('list-group-item');
        li.classList.add('list-group-item-danger');

        li.innerHTML += 'Connection lost...';

        placeMessage.appendChild(li);

        Player.list = {};
        Bullet.list = {};
        Rocket.list = {};
        Help.list = {};

        setTimeout(() => {

            let ul = document.querySelector('ul');

            while (ul.firstChild) {
                ul.removeChild(ul.firstChild);
            };

            signin.style.display = 'table';
            mainDivGame.style.display = 'none';

        }, 5000);

    });

});
