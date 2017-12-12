function PokerManager() {
    // this.genAllPokers();
}

PokerManager.prototype.genAllPokers = function () {
    var pokers = this.shuffle();
    var pokerList1 = [];
    var pokerList2 = [];
    var pokerList3 = [];
    var pokerList4 = [];
    
    for (var i = 0, len = pokers.length - 3; i < len; i++) {
        var poker = pokers[i];
        if(i % 3 == 0){
            pokerList1.push(poker);
        } else if(i % 3 == 1){
            pokerList2.push(poker);
        } else {
            pokerList3.push(poker);
        }
    }

    pokerList4.push(pokers[pokers.length - 3]);
    pokerList4.push(pokers[pokers.length - 2]);
    pokerList4.push(pokers[pokers.length - 1]);

    return [pokerList1, pokerList2, pokerList3, pokerList4];
}

PokerManager.prototype.shuffle = function () {
    var list = [];
    for (var i = 0; i < 54; i++) {
        list.push(i);
    }
    list.shuffle();
    return list;
}

Array.prototype.shuffle = function () {
    var input = this, index, temp;
    for (var i = 0, len = input.length; i < len; i++) {
        index = Math.floor(Math.random() * (len - i)) + i;
        if (index !== i) {
            temp = input[i];
            input[i] = input[index];
            input[index] = temp;
        }
    }
    return input;
}

module.exports = PokerManager;