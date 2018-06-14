import json
import time
import asyncio
from collections import defaultdict

import aiohttp
from aiohttp import web, WSCloseCode
import jinja2
import aiohttp_jinja2

WIDTH = 20
HEIGHT = 20
LAYERS = 3
PORT = 8080

routes = web.RouteTableDef()

@routes.get('/')
@aiohttp_jinja2.template('choice.html')
async def hello(request):
    return {}

def gen_blank(width=WIDTH, height=HEIGHT, layers=LAYERS):
    map_ = [[[0 for column in range(width)] for row in range(height)] for layer in range(layers)]
    return {'map': map_}

sockets = defaultdict(set)
maps = defaultdict(gen_blank)

@routes.get('/map')
@aiohttp_jinja2.template('index.html')
async def variable_handler(request):
    try:
        name = request.query['name']
    except KeyError:
        return {'error': 'name not provided', 'map': []}
    data = maps[name]
    data['name'] = name
    return data


@routes.get('/ws/{name}')
async def websocket_handler(request):
    ws = web.WebSocketResponse()
    await ws.prepare(request)
    
    name = request.match_info['name']
    sockets[name].add(ws)
    state = maps[name]
    state['name'] = name
    if state:
        await ws.send_str(json.dumps(state))
    print('sent')
    
    async for msg in ws:
        if msg.type == aiohttp.WSMsgType.TEXT:
            if msg.data == 'close':
                sockets[name].remove(ws)
                await ws.close()
            else:
                state = maps[name] = json.loads(msg.data)
                for socket in sockets[name]:
                    if socket is ws:
                        continue
                    await socket.send_str(json.dumps(state))
        elif msg.type == aiohttp.WSMsgType.ERROR:
            sockets[name].remove(ws)
            print('ws connection closed with exception %s' %
                  ws.exception())

    print('websocket connection closed')

    return ws
    
def save_maps():
    with open('data.txt', 'wt') as save:
        json.dump(maps, save)

def load_maps():
    with open('data.txt', 'rt') as save:
        return json.load(save)

async def save_loop():
    loop = asyncio.get_event_loop()
    old = await loop.run_in_executor(None, load_maps)
    maps.update(old)
    while True:
        print('saving maps')
        await loop.run_in_executor(None, save_maps)
        await asyncio.sleep(5)

async def on_shutdown(app):
    for name, group in sockets.items():
        for ws in group:
            await ws.close(code=WSCloseCode.GOING_AWAY,
                           message='Server shutdown')

async def setup():
    print('----------------------')
    print('serving on port %s' % PORT)
    app = web.Application()
    aiohttp_jinja2.setup(app,
        loader=jinja2.FileSystemLoader('./static'))
    app.router.add_routes(routes)
    app.router.add_static('/static', './static')
    app.on_shutdown.append(on_shutdown)
    
    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, '0.0.0.0', PORT)
    await site.start()

def main():
    loop = asyncio.get_event_loop()
    try:
        loop.run_until_complete(asyncio.gather(
            save_loop(),
            setup()
        ))
    except KeyboardInterrupt:
        print('stopping')
        loop.stop()

main()



