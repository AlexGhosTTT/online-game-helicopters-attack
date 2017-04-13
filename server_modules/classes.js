const GUID = require('./GUID.js');

let initPack = { player: [], bullet: [], rocket: [], help: [] };
let removePack = { player: [], bullet: [], rocket: [], help: [] };

BasicFrame = class BasicFrame {

    constructor(id) {

        this.id = id;
        this.x;
        this.y;

        this.spdX = 0;
        this.spdY = 0;

        this.update = () => {
            this.updatePosition();
        };

        this.updatePosition = () => {
            this.x += this.spdX;
            this.y += this.spdY;
        };

    };

};

BasicFrame.getFrameUpdateData = () => {

    let pack = {

        initPack: {
            player: initPack.player,
            bullet: initPack.bullet,
            rocket: initPack.rocket,
            help: initPack.help,
        },

        updatePack: {
            player: Player.update(),
            bullet: Bullet.update(),
            rocket: Rocket.update(),
            help: Help.update(),
        },

        removePack: {
            player: removePack.player,
            bullet: removePack.bullet,
            rocket: removePack.rocket,
            help: removePack.help,
        }
    };

    initPack.player = [];
    initPack.bullet = [];
    initPack.rocket = [];
    initPack.help = [];

    removePack.player = [];
    removePack.bullet = [];
    removePack.rocket = [];
    removePack.help = [];

    return pack;

};



BasicAmmoFrame = class BasicAmmoFrame extends BasicFrame {

    constructor(id, speed, player, angle, direction) {

        super(id);

        this.spdX = Math.cos(angle / 180 * Math.PI) * speed;
        this.spdY = Math.sin(angle / 180 * Math.PI) * speed;

        this.player = player;

        this.direction = direction;

        this.timer = 0;
        this.toRemove = false;

    };

    getDistance(pt) {
        return Math.sqrt(Math.pow(this.x - pt.x, 2) + Math.pow(this.y - pt.y, 2));
    };

    updatePlayerLocation(player) {

        player.isDiedObj.isDied = true;
        player.isDiedObj.isDiedX = player.x;
        player.isDiedObj.isDiedY = player.y;

        player.hp = player.hpMax;
        player.direction = player.setDirection();

        player.x = -999;
        player.y = -999;

        setTimeout(() => {

            player.x = player.generateHorizontalPosition(player.direction);
            player.y = player.getRandomArbitrary(0, 720);

            player.isDiedObj.isDied = false;
            player.isDiedObj.isDiedX = null;
            player.isDiedObj.isDiedY = null;

        }, 450);

    };

};



Help = class Help {

    constructor() {

        this.id = GUID();

        this.x = this.getRandomArbitrary(0, 1280);
        this.y = this.getRandomArbitrary(0, 720);

        this.toRemove = false;

        Help.list[this.id] = this;

        initPack.help.push(this.getInitPack());
    };

    updateHelp() {

        for (let i in Player.list) {

            let player = Player.list[i];

            if (this.getDistance(player) < 32) {

                player.hp = player.hpMax;

                this.toRemove = true;
            }
        }

    };

    getInitPack() {

        return {
            id: this.id,
            x: this.x,
            y: this.y,
        };

    }

    getUpdatePack() {

        return {
            id: this.id,
            x: this.x,
            y: this.y,
        };

    }

    getRandomArbitrary(min, max) {
        return Math.floor(Math.random() * (max - min) + min);
    };

    getDistance(pt) {
        return Math.sqrt(Math.pow(this.x - pt.x, 2) + Math.pow(this.y - pt.y, 2));
    };

}

Help.list = {};

Help.update = () => {

    let pack = [];

    for (let i in Help.list) {

        let help = Help.list[i];
        help.updateHelp();

        if (help.toRemove) {

            removePack.help.push(help.id);

            delete Help.list[i];
        } else {
            pack.push(help.getUpdatePack());
        }
    };

    return pack;

};

Help.getAllInitPack = () => {
    let helps = [];

    for (let i in Help.list) {
        helps.push(Help.list[i].getInitPack());
    }

    return helps;
};



Player = class Player extends BasicFrame {

    constructor(id, nickName) {

        super(id);

        this.nickName = nickName;

        this.direction = this.setDirection();
        this.image = this.direction;

        this.x = this.generateHorizontalPosition(this.direction);
        this.y = this.getRandomArbitrary(0, 720);

        this.pressingRigth = false;
        this.pressingLeft = false;
        this.pressingUp = false;
        this.pressingDown = false;

        this.pressingAttack = false;
        this.pressingSupetAttack = false;

        this.maxSpd = 3.5;
        this.hp = 50;
        this.hpMax = 50;
        this.score = 0;

        this.bulletChoker = 5;
        this.rocketChoker = 10;

        this.isDiedObj = {
            isDied: false,
            isDiedX: null,
            isDiedY: null
        };

        Player.list[this.id] = this;

        initPack.player.push(this.getInitPack());
    };

    updatePlayer() {

        this.updatePlayerPosition();

        this.update();

        this.teleportPosition(this.update);

        if (this.pressingAttack) {

            if (this.direction) {
                this.shootBullet(180);
            } else {
                this.shootBullet(-360);
            };

        };

        if (this.pressingSupetAttack) {

            if (this.direction) {
                this.shootRocket(180);
            } else {
                this.shootRocket(-360);
            };

        };

    };

    updatePlayerPosition() {
        if (this.pressingRigth) {
            this.spdX = this.maxSpd;
        } else if (this.pressingLeft) {
            this.spdX = -this.maxSpd;
        } else {
            this.spdX = 0;
        }

        if (this.pressingUp) {
            this.spdY = -this.maxSpd;
        } else if (this.pressingDown) {
            this.spdY = this.maxSpd;
        } else {
            this.spdY = 0;
        }
    };

    teleportPosition(funk) {
        if (this.x <= -70) {
            this.x = 1350;
        } else if (this.x >= 1350) {
            this.x = -70;
        } else if (this.y <= -30) {
            this.y = 740;
        } else if (this.y >= 740) {
            this.y = -30;
        }

        funk();
    };

    shootBullet(angle) {

        let choker = this.bulletChoker % 6;

        if (choker === 5) {

            let bullet = new Bullet(this.id, angle, this.direction);

            if (this.direction) {
                bullet.x = this.x - 60;
            } else {
                bullet.x = this.x + 60;
            }

            bullet.y = this.y + 20;

        }

        this.bulletChoker++;

    };

    shootRocket(angle) {

        let choker = this.rocketChoker % 11;

        if (choker === 10) {

            let rocket = new Rocket(this.id, angle, this.direction);

            if (this.direction) {
                rocket.x = this.x - 30;
            } else {
                rocket.x = this.x + 30;
            }

            rocket.y = this.y + 10;

        }

        this.rocketChoker++;

    };

    getInitPack() {

        return {
            id: this.id,
            nickName: this.nickName,
            direction: this.direction,
            shoot: this.pressingAttack,
            image: this.image,
            x: this.x,
            y: this.y,
            hp: this.hp,
            hpMax: this.hpMax,
            score: this.score,
            isDiedObj: this.isDiedObj
        };

    };

    getUpdatePack() {

        return {
            id: this.id,
            nickName: this.nickName,
            direction: this.direction,
            shoot: this.pressingAttack,
            x: this.x,
            y: this.y,
            hp: this.hp,
            score: this.score,
            isDiedObj: this.isDiedObj
        };

    };

    getRandomArbitrary(min, max) {
        return Math.floor(Math.random() * (max - min) + min);
    };

    setDirection() {
        return this.getRandomArbitrary(0, 2);
    };

    generateHorizontalPosition(direction) {

        let x = null;

        if (!this.direction) {
            x = this.getRandomArbitrary(0, 640);
        } else {
            x = this.getRandomArbitrary(640, 1280);
        }

        return x;
    };

};

Player.list = {};

Player.onConnect = (socket) => {

    let player = new Player(socket.id, 'Not ready!');

    console.log('Player ' + socket.id + ' was connected!');

    socket.on('keyPress', (data) => {

        if (data.imputId === 'rigth') { //d
            player.pressingRigth = data.state;
            player.direction = 0;
        } else if (data.imputId === 'down') { //s
            player.pressingDown = data.state;
        } else if (data.imputId === 'left') { //a
            player.pressingLeft = data.state;
            player.direction = 1;
        } else if (data.imputId === 'up') { //w
            player.pressingUp = data.state;
        } else if (data.imputId === 'space') { //space
            player.pressingAttack = data.state;
        } else if (data.imputId === 'shift') { //shift
            player.pressingSupetAttack = data.state;
        }

    });

    socket.emit('init', {
        playerId: socket.id,
        player: Player.getAllInitPack(),
        bullet: Bullet.getAllInitPack(),
        rocket: Rocket.getAllInitPack(),
        help: Help.getAllInitPack(),
    });

};

Player.onDisconnect = (socket) => {
    console.log('Player ' + socket.id + ' was disconnected!');
    removePack.player.push(socket.id);
    delete Player.list[socket.id];
};

Player.update = () => {

    let pack = [];

    for (let i in Player.list) {

        let player = Player.list[i];
        player.updatePlayer();

        pack.push(player.getUpdatePack());
    };

    return pack;
}

Player.getAllInitPack = () => {
    let players = [];

    for (let i in Player.list) {
        players.push(Player.list[i].getInitPack());
    }

    return players;
}



Bullet = class Bullet extends BasicAmmoFrame {

    constructor(player, angle, direction) {

        super(GUID(), 10, player, angle, direction);

        Bullet.list[this.id] = this;

        initPack.bullet.push(this.getInitPack());

    };

    updateBullet() {

        if (this.timer++ > 200) {
            this.toRemove = true;
        }

        this.update();

        for (let i in Player.list) {

            let player = Player.list[i];

            if (this.getDistance(player) < 32 && this.player !== player.id) {

                player.hp -= 2;

                if (player.nickName === 'Not ready!') {
                    return;
                }

                if (player.hp <= 0) {

                    let shooter = Player.list[this.player];

                    if (shooter) {
                        shooter.score += 1;
                    }

                    this.updatePlayerLocation(player);
                }

                this.toRemove = true;
            }
        }

        for (let i in Help.list) {

            let help = Help.list[i];

            if (this.getDistance(help) < 32) {

                help.toRemove = true;

                this.toRemove = true;
            };
        };

    };

    getInitPack() {

        return {
            id: this.id,
            direction: this.direction,
            x: this.x,
            y: this.y
        };

    };

    getUpdatePack() {

        return {
            id: this.id,
            direction: this.direction,
            x: this.x,
            y: this.y
        };

    };

};

Bullet.list = {};

Bullet.update = () => {

    let pack = [];

    for (let i in Bullet.list) {

        let bullet = Bullet.list[i];
        bullet.updateBullet();

        if (bullet.toRemove) {
            removePack.bullet.push(bullet.id);
            delete Bullet.list[i];
        } else {
            pack.push(bullet.getUpdatePack());
        }
    };

    return pack;
};

Bullet.getAllInitPack = () => {
    let bullets = [];

    for (let i in Bullet.list) {
        bullets.push(Bullet.list[i].getInitPack());
    }
    return bullets;
};



Rocket = class Rocket extends BasicAmmoFrame {

    constructor(player, angle, direction) {

        super(GUID(), 8, player, angle, direction);

        Rocket.list[this.id] = this;

        initPack.rocket.push(this.getInitPack());

    };

    updateRocket() {

        if (this.timer++ > 200) {
            this.toRemove = true;
        }

        this.update();

        for (let i in Player.list) {

            let player = Player.list[i];

            if (this.getDistance(player) < 32 && this.player !== player.id) {

                if (player.nickName === 'Not ready!') {
                    return;
                }

                player.hp -= 10;

                if (player.hp <= 0) {

                    let shooter = Player.list[this.player];

                    if (shooter) {
                        shooter.score += 1;
                    }

                    this.updatePlayerLocation(player);
                }

                this.toRemove = true;
            }
        }

        for (let i in Help.list) {

            let help = Help.list[i];

            if (this.getDistance(help) < 32) {

                help.toRemove = true;

                this.toRemove = true;
            };
        };

    };

    getInitPack() {

        return {
            id: this.id,
            direction: this.direction,
            x: this.x,
            y: this.y
        };

    };

    getUpdatePack() {

        return {
            id: this.id,
            direction: this.direction,
            x: this.x,
            y: this.y
        };

    };

};

Rocket.list = {};

Rocket.update = () => {

    let pack = [];

    for (let i in Rocket.list) {

        let rocket = Rocket.list[i];
        rocket.updateRocket();

        if (rocket.toRemove) {
            removePack.rocket.push(rocket.id);
            delete Rocket.list[i];
        } else {
            pack.push(rocket.getUpdatePack());
        }
    };

    return pack;
};

Rocket.getAllInitPack = () => {
    let rockets = [];

    for (let i in Rocket.list) {
        rockets.push(Rocket.list[i].getInitPack());
    }
    return rockets;
};
