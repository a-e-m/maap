(function() {

// state and data:
var state = {
    tool: 'brush',
    colors: ['black', 'red', 'green', 'blue', 'orange', 'yellow', '#444', '#ccc'],
    color: 1,
    wsUri: "ws://localhost:8080/ws",
    mapData: [[0, 0, 1], [1, 1, 2], [2, 1, 2]],
    tileSize: 64
};

// main logic:
makeMap(state.mapData);
var websocket = new WebSocket(state.wsUri);

// event handlers:
function handleColor(event) {
    var elem = $(event.target);
    state.color = elem.data('color');
}

_.each(state.colors, function(color, index) {
    var sample = $('<div class="color"></div>')
        .css('background-color', color)
        .data('color', index)
        .click(handleColor);
    $('#colorBar').append(sample); 
});

var toolStates = {
    brush: {
        down: false
    }
};
$(window).mousedown(handleTool).mouseup(handleTool).blur(handleTool);

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
    }
}

function handleTool(event) {
    if (state.tool === 'brush') {
        return handleBrush(event);
    } else {
        console.log('tool ' + state.tool + 'not recognized');
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
    console.log(evt.data);
    state.mapData = JSON.parse(evt.data);
    makeMap(state.mapData);
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

function changeSquare(elem) {
    var x = gridX(parseInt(elem.css('left'))),
        y = gridY(parseInt(elem.css('top')));
        value = state.mapData[y][x];
    state.mapData[y][x] = state.color;
    makeMap(state.mapData);
    sendMap();
}

function makeMap(data) {
    $('.square').remove();
    _.each(data, function(row, y) {
        _.each(row, function(item, x) {
            var square = $('<div class="square"></div>')
                .css('background-color', state.colors[item])
                .css('left', pixelX(x))
                .css('top', pixelY(y));
            $('#map').append(square);
        });
    });
}
    
})();