function Room(roomNum) {
    this.roomNum = roomNum;
    this.name = 'room' + roomNum;
    this.players = [];
    this.status = 0;
    this.readyCount = 0;

    this.lordIndex = -1;
    this.currentPlayIndex = -1;

    this.lordPokers = [];

    this.lastCallIndex = -1;
    this.uncallCount = 0;
    this.callCount = 4;
}

Room.prototype.resetCall = function(){
    this.lastCallIndex = -1;
    this.uncallCount = 0;
    this.callCount = 4;
}

Room.prototype.join = function (player) {
    var len = this.players.length;
    player.index = len;
    this.players.push(player);
    if(len === 3){
        this.status = 1;
    }
}

Room.prototype.isEmpty = function(){
    return this.players.length < 3;
}

Room.prototype.leave = function(player){
    player.index = 0;
    this.players.splice(player.index, 1);
    this.status = 0;
}

Room.prototype.addReady = function(callback){
    this.readyCount++
}

module.exports = Room;