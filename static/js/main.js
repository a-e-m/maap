(function() {

var players = ['repeating-linear-gradient(45deg,#606dbc,#606dbc 10px,#465298 10px,#465298 20px)',
'repeating-linear-gradient(45deg,yellow,yellow 10px,green 10px,green 20px)',
'repeating-linear-gradient(45deg,red,red 10px,orange 10px,orange 20px)'];

// state and data:
var state = {
    tool: 'brush',
    colors: ['rgba(0, 0, 0, 0)', 'black', 'white', 'red', 'maroon', 'orange', 'yellow', 'green', '#01410f', 'skyblue', 'blue', 'purple', '#4a2e13', 'tan', '#444', '#ccc'].concat(players),
    color: 1,
    layer: +$('.layer:checked').attr('value'),
    wsUri: "ws://localhost:8080/ws",
    mapData: [[[0, 0, 0], [0, 0, 0], [0, 0, 0]]],
    tileSize: 64
};

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
        down: false
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

$('#map').mousedown(handleTool);
$(window).mouseup(handleTool).blur(handleTool);

function handleBrush(event) {
    if (event.type === 'mousedown') {
        toolStates.brush.down = true;
        $('#map').mousemove(handleTool);
        changeSquare($(event.target));
    } else if (event.type === 'mousemove') {
        if (toolStates.brush.down) {
            changeSquare($(event.target));
        }
    }
    else if (event.type === 'mouseup' || event.type === 'blur') {
        toolStates.brush.down = false;
        $('#map').off('mousemove');
        sendMap();
    }
}

function handleMove(event) {
    if (event.type === 'mousedown') {
        $('#map').mousemove(handleTool);
        toolStates.move.start = $(event.target);
        console.log('saved', event.target);
    } else if (event.type === 'mouseup' || event.type === 'blur') {
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
    if (event.type === 'mouseup') {
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

function changeSquare(elem, color) {
    var x = gridX(parseInt(elem.css('left'))),
        y = gridY(parseInt(elem.css('top')));
    state.mapData[state.layer][y][x] = (color === undefined) ? state.color : color;
    makeMap(state.mapData, state.layer);
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
                .data('colorIndex', item);
            $('#map').append(square);
        });
    });
}
var makeMap = _.debounce(makeMapOld, 10);

})();