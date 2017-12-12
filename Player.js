function Player(id, name, socketId) {
    this.id = id;
    this.name = name;
    this.socketId = socketId;
    this.ready = false;
    this.index = 0;
    this.roomNum = 0;
    this.isLord = false;
    this.pokerList = [];
}

module.exports = Player;