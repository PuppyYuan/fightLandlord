module.exports = PokerHelper;

var PokerType = {
    one: 'one',
    pair: 'pair',
    three: 'three',
    four: 'four',
    plane: 'plane',
    row: 'row',
    multiPair: 'multiPair',
    bomb: 'bomb',
}

var ExceptionType = {
    WRONG_POKER_TYPE: '错误的牌型',
    NOT_SAME_POKER_TYPE: '跟上家牌型不一致',
}

var Type = {
    a: 'one',
    b: 'paire',
    c: 'three',
    d: 'bomb',
    aa: 'bomb',
    ca: 'three',
    cb: 'three',
    daa: 'four',
    db: 'four',
    dbb: 'four',
    aaaaa: 'row',
    bbb: 'multiPair',
    cc: 'plane',
    ccaa: 'plane',
    ccb: 'plane',
    ccbb: 'plane',
    ccc: 'plane',
    cccaaa: 'plane',
    cccba: 'plane',
    cccbbb: 'plane',
    cccc: 'plane',
    ccccaaaa: 'plane',
    ccccbb: 'plane',
    ccccbaa: 'plane',
    ccccc: 'plane',
    cccccaaaaa: 'plane',
}

function PokerHelper() {}

PokerHelper.prototype.getPokerWrapper = function (pokerList) {

    if (!pokerList || pokerList.length === 0) {
        throw ExceptionType.WRONG_POKER_TYPE;
    }

    var pokerWrapper = new PokerWrapper(pokerList);

    var pokerMap = new PokerMap();

    for (var i = 0; i < pokerList.length; i++) {
        var poker = pokerList[i];

        var weight = this.getWeight(poker);
        var count = pokerMap[weight];
        if (!count) {
            count = 0;
        }
        pokerMap[weight] = ++count;
    }

    var countList = new Array();
    for (var weight in pokerMap) {
        countList.push(pokerMap[weight])
    }

    countList.sort(function (a, b) {
        return b - a;
    });

    var type = countList.join('');

    type = type.replace(/1/g, 'a').replace(/2/g, 'b').replace(/3/g, 'c').replace(/4/g, 'd');

    // 顺子
    var pattern = /a+/g;
    var array = pattern.exec(type);
    if (array && array[0].length === type.length && type.length > 5) {
        type = 'aaaaa';
    }

    // 连对
    var patter2 = /b+/g;
    var array2 = patter2.exec(type);
    if (array2 && array2[0].length === type.length && type.length > 3) {
        type = 'bbb';
    }

    try {
        var executorKey = Type[type];

        var executor = new Executor();

        return executor[executorKey](pokerMap, pokerWrapper);

    } catch (err) {
        throw ExceptionType.WRONG_POKER_TYPE;
    }
}

PokerHelper.prototype.getWeight = function (poker) {

    if (poker === 52) {
        return 13;
    } else if (poker === 53) {
        return 14;
    } else {
        return parseInt(poker / 4);
    }
}

function PokerWrapper(pokerList) {
    this.pokerList = pokerList;

    this.leadValue;
    this.pokerType;
    this.size = pokerList.length;
}

PokerWrapper.prototype.follow = function (targetPokerList) {
    var canFollow = false;

    var targetPokerWrapper = new PokerHelper().getPokerWrapper(targetPokerList);

    if (targetPokerWrapper.pokerType == this.pokerType) {
        if (targetPokerWrapper.size != this.size) {
            throw '所选牌与上一手牌数量不一致';
        } else if (Number(targetPokerWrapper.leadValue) <= Number(this.leadValue)) {
            throw '所选牌必须大于上一首牌';
        } else {
            canFollow = true;
        }
    } else if (PokerType.bomb == targetPokerWrapper.pokerType) {
        canFollow = true;
    } else {
        throw ExceptionType.NOT_SAME_POKER_TYPE;
    }

    return {
        canFollow: canFollow,
        targetPokerWrapper: targetPokerWrapper
    }
}

function PokerMap() {}

function Executor() {}

// 炸弹
Executor.prototype.bomb = function (map, pokerWrapper) {

    var value = 0;
    for (var weight in map) {
        value = weight;
        break;
    }

    pokerWrapper.leadValue = value;
    pokerWrapper.pokerType = PokerType.bomb;
    pokerWrapper.size = 0;
    return pokerWrapper;
}

// 四带X
Executor.prototype.four = function (map, pokerWrapper) {

    for (var weight in map) {

        var count = map[weight];
        if (count === 4) {
            pokerWrapper.leadValue = weight;
            pokerWrapper.pokerType = PokerType.four;
        }
    }

    return pokerWrapper;
}

// 连对
Executor.prototype.multiPair = function (map, pokerWrapper) {

    var weightList = new Array();
    for (var weight in map) {
        weightList.push(weight);
    }

    weightList.sort(function (a, b) {
        return a - b;
    });

    // 连对最大牌值A
    if (weightList[weightList.length - 1] > 11) {
        throw ExceptionType.WRONG_POKER_TYPE;
    }

    var weightSum = 0;
    for (var i = 0; i < weightList.length; i++) {
        weightSum += Number(weightList[i]);
    }

    var n = weightList.length;
    var a1 = weightList[0];
    var an = weightList[n - 1];

    var targetSum = (Number(a1) + Number(an)) * n / 2;
    if (weightSum == targetSum && (an - a1) / (n - 1) == 1) {
        pokerWrapper.leadValue = a1;
        pokerWrapper.pokerType = PokerType.multiPair;
        return pokerWrapper;
    } else {
        throw ExceptionType.WRONG_POKER_TYPE;
    }

}

// 单张
Executor.prototype.one = function (map, pokerWrapper) {
    var size = 0;
    var count = 0;
    var value = 0;

    for (var weight in map) {
        value = weight;
        size++;
        count = map[weight];
    }

    if (size == 1 && count == 1) {
        pokerWrapper.leadValue = value;
        pokerWrapper.pokerType = PokerType.one;
        return pokerWrapper;
    } else {
        throw ExceptionType.WRONG_POKER_TYPE;
    }
}

// 一对
Executor.prototype.pair = function (map, pokerWrapper) {

    var size = 0;
    var count = 0;
    var value = 0;

    for (var weight in map) {
        value = weight;
        size++;
        count = map[weight];
    }

    if (size == 1 && count == 2) {
        pokerWrapper.leadValue = value;
        pokerWrapper.pokerType = PokerType.pair;
        return pokerWrapper;
    } else {
        throw ExceptionType.WRONG_POKER_TYPE;
    }
}

// 飞机
Executor.prototype.plane = function (map, pokerWrapper) {

    var weightList = new Array();
    for (var weight in map) {
        if (map[weight] === 3) {
            weightList.push(weight);
        }
    }

    weightList.sort(function (a, b) {
        return a - b;
    });

    // 连对最大牌值A
    if (weightList[weightList.length - 1] > 11) {
        throw ExceptionType.WRONG_POKER_TYPE;
    }

    var valueSum = 0;
    for (var i = 0; i < weightList.length; i++) {
        valueSum += Number(weightList[i]);
    }

    var n = weightList.length;
    var a1 = weightList[0];
    var an = weightList[n - 1];

    var targetSum = (Number(a1) + Number(an)) * n / 2;
    if (valueSum == targetSum && (an - a1) / (n - 1) == 1) {
        pokerWrapper.leadValue = a1;
        pokerWrapper.pokerType = PokerType.plane;
        return pokerWrapper;
    } else {
        throw ExceptionType.WRONG_POKER_TYPE;
    }
}

// 顺子
Executor.prototype.row = function (map, pokerWrapper) {
    var weightList = new Array();

    for (var weight in map) {
        weightList.push(weight);
    }

    weightList.sort(function (a, b) {
        return a - b;
    });

    // 顺子最大牌值A
    if (weightList[weightList.length - 1] > 11) {
        throw ExceptionType.WRONG_POKER_TYPE;
    }

    var valueSum = 0;
    for (var i = 0; i < weightList.length; i++) {
        valueSum += Number(weightList[i]);
    }

    var n = weightList.length;
    var a1 = weightList[0];
    var an = weightList[n - 1];

    var targetSum = (Number(a1) + Number(an)) * n / 2;

    if (valueSum == targetSum && (an - a1) / (n - 1) == 1) {
        pokerWrapper.leadValue = a1;
        pokerWrapper.pokerType = PokerType.row;
        return pokerWrapper;
    } else {
        throw ExceptionType.WRONG_POKER_TYPE;
    }
}

Executor.prototype.three = function (map, pokerWrapper) {

    for (var weight in map) {
        var count = map[weight];
        if (count == 3) {
            pokerWrapper.leadValue = weight;
            pokerWrapper.pokerType = PokerType.three;
        }
    }

    return pokerWrapper;
}