(function() {

var players = ['repeating-linear-gradient(45deg,#606dbc,#606dbc 10px,#465298 10px,#465298 20px)',
'repeating-linear-gradient(45deg,yellow,yellow 10px,green 10px,green 20px)',
'repeating-linear-gradient(45deg,red,red 10px,orange 10px,orange 20px)',
'radial-gradient(circle, rgba(234,244,0,1) 0%, rgba(228,10,10,1) 100%)',
'radial-gradient(circle, rgba(0,244,28,1) 0%, rgba(10,161,228,1) 100%)',
'radial-gradient(circle, rgba(131,3,131,1) 0%, rgba(0,38,244,1) 100%)',
'radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(0,0,0,1) 100%)',];

var effects = ['linear-gradient(90deg, rgba(2,0,36,1) 0%, rgba(0,212,255,0.19089642693014708) 100%)', 
'linear-gradient(90deg, rgba(242,8,8,1) 0%, rgba(255,198,5,0.8127451664259454) 100%)',
'linear-gradient(90deg, rgba(251,173,3,1) 0%, rgba(255,248,0,0.3225490879945728) 100%)',
'linear-gradient(90deg, rgba(3,251,69,1) 0%, rgba(142,255,0,0.37296925606179976) 100%)',
'linear-gradient(90deg, rgba(3,245,251,0.8183474073223039) 0%, rgba(241,255,253,0.37296925606179976) 100%)',
'linear-gradient(90deg, rgba(255,255,255,0.8519608527004552) 0%, rgba(241,255,253,0.37296925606179976) 100%)'];

var bg = [
];

// state and data:
var state = {
    tool: 'brush',
    colors: ['rgba(0, 0, 0, 0)', 'black', 'white', 'red', 'maroon', 'orange', 'yellow', 'green', '#01410f', 'skyblue', 'blue', 'purple', '#4a2e13', 'tan', '#444', '#ccc'].concat(players).concat(effects),
    color: 1,
    layer: +$('.layer:checked').attr('value'),
    wsUri: "ws://" + window.location.host + "/ws",
    mapData: [[[0, 0, 0], [0, 0, 0], [0, 0, 0]]],
    tileSize: 64
};

if (player) {
    state.tool = 'move';
    state.layer = 1;
    $('#layerBar').hide();
    $('#colorBar').hide();
    $('#toolBar').hide();
    $('#map').css('left', 0).css('top', 0);
}

// main logic:
var websocket = new WebSocket(state.wsUri);

// event handlers:
$('.layer').click(function(event) {
    var elem = $(event.target);
    var index = parseInt(elem.attr('id').replace('layer', ''));
    state.layer = index;
});

function handleColor(event) {
    var elem = $(event.target);
    state.color = elem.data('color');
}

_.each(state.colors, function(color, index) {
    var sample = $('<input type="radio" name="color" class="color" value="' + index + '">')
        .css('background', color)
        .data('color', index)
        .click(handleColor);
    $('#colorBar').append(sample); 
});

var toolStates = {
    brush: {
        down: false,
        erase: false
    },
    move: {
        start: null
    }
};

$('.tool').click(function(event) {
    var elem = $(event.target);
    state.tool = elem.attr('id');
    $('.tool').css('color', 'black');
    elem.css('color', 'white');
});

$('#map').mousedown(handleTool).on('touchstart', handleTool);
$(window).mouseup(handleTool).blur(handleTool).on('contextmenu', handleTool).on('touchend', handleTool);;

function handleBrush(event) {
    var color;
    if (event.type === 'mousedown' || event.type === 'touchstart') {
        toolStates.brush.down = true;
        $('#map')
            .on('touchmove mousemove', handleTool);
        if (event.which == 3) {
            color = 0;
            toolStates.brush.erase = true;
        }
        changeSquare($(event.target), color);
    } else if (event.type === 'mousemove' || event.type === 'touchmove') {
        if (toolStates.brush.down) {
            if (toolStates.brush.erase)
                color = 0;
            changeSquare($(event.target), color);
        }
    }
    else if (event.type === 'mouseup' || event.type === 'blur' || event.type === 'touchend') {
        toolStates.brush.down = false;
        toolStates.brush.erase = false;
        $('#map')
            .off('mousemove touchmove');
        sendMap();
    } else {
        event.preventDefault();
        event.stopPropagation();
    }
}

function handleMove(event) {
    if (event.type === 'mousedown' || event.type === 'touchstart') {
        $('#map').mousemove(handleTool);
        toolStates.move.start = $(event.target);
    } else if (event.type === 'mouseup' || event.type === 'blur' || event.type === 'touchend') {
        var start = toolStates.move.start;
        var end = $(event.target);
        if (start === null || !end.hasClass('square'))
            return;
        toolStates.move.start = null;
        var color = getColor(start);
        if (color === 0 || getColor(end) !== 0)
            return;
        changeSquare(start, 0);
        changeSquare(end, color);
        $('#map').off('mousemove');
        makeMap(state.mapData, state.layer);
        sendMap();
    }
}

function handleClear(event) {
    if (event.type === 'mouseup' || event.type === 'touchstart') {
        if (!$(event.target).hasClass('square'))
            return;
        _.each(state.mapData[state.layer], function(row) {
            _.fill(row, 0);
        });
        makeMap(state.mapData, state.layer);
        sendMap();
    }
}

function handleTool(event) {
    if (state.tool === 'brush') {
        return handleBrush(event);
    } else if (state.tool === 'move') {
        return handleMove(event);
    } else if (state.tool === 'clear') {
        return handleClear(event);
    } else {
        console.log('tool ' + state.tool + ' not recognized');
    }
}

// websocket handlers:
websocket.onopen = function(evt) { onOpen(evt) };
websocket.onclose = function(evt) { onClose(evt) };
websocket.onmessage = function(evt) { onMessage(evt) };
websocket.onerror = function(evt) { onError(evt) };

function onOpen(evt) {
    console.log('CONNECTED');
}

function onClose(evt) {
    console.log("DISCONNECTED");
}

function onMessage(evt) {
    state.mapData = JSON.parse(evt.data);
    makeMapOld(state.mapData, 0);
    makeMapOld(state.mapData, 1);
    makeMapOld(state.mapData, 2);
}

function onError(evt) {
    console.log('error: ' + evt.data);
}

// Helper functions:
function pixelX(x) {
    return x * state.tileSize;
}

function pixelY(y) {
    return y * state.tileSize;
}

function gridX(x) {
    return Math.floor(x / state.tileSize);
}

function gridY(y) {
    return Math.floor(y / state.tileSize);
}

var sendMap = _.debounce(
function() {
    websocket.send(JSON.stringify(state.mapData));
},
500);

function getColor(elem) {
    var x = gridX(parseInt(elem.css('left'))),
        y = gridY(parseInt(elem.css('top')));
    return state.mapData[state.layer][y][x];
}

function getSquareId(layer, y, x) {
    return 'square' + layer + '-' + y + '-' + x;
}

function changeSquare(elem, color) {
    var x = gridX(parseInt(elem.css('left'))),
        y = gridY(parseInt(elem.css('top')));
    if (color === undefined) {
        color = state.color;
    }
    state.mapData[state.layer][y][x] = color;
    var elem = $('#' + getSquareId(state.layer, y, x));
    elem
        .css('background', state.colors[color])
        .data('colorIndex', color);
    //makeMap(state.mapData, state.layer);
}

function makeMapOld(data, layer) {
    if (layer === undefined) 
        layer = state.layer;
    $('.layer' + layer).remove();
    _.each(data[layer], function(row, y) {
        _.each(row, function(item, x) {
            var square = $('<div class="square"></div>')
                .css('background', state.colors[item])
                .css('left', pixelX(x))
                .css('top', pixelY(y))
                .addClass('layer' + layer)
                .data('layerIndex', layer)
                .data('colorIndex', item)
                .attr('id', getSquareId(layer, y, x));
            $('#map').append(square);
        });
    });
}
var makeMap = _.debounce(makeMapOld, 10);

})();