import json
import aiohttp
from aiohttp import web

routes = web.RouteTableDef()

@routes.get('/')
async def hello(request):
    return web.Response(text="Hello, world")

sockets = []
state = json.dumps([[[0 for column in range(20)] for row in range(20)] for layer in range(3)])

@routes.get('/ws')
async def websocket_handler(request):
    global state

    ws = web.WebSocketResponse()
    await ws.prepare(request)
    sockets.append(ws)
    if state:
        await ws.send_str(state)
    
    async for msg in ws:
        if msg.type == aiohttp.WSMsgType.TEXT:
            if msg.data == 'close':
                await ws.close()
            else:
                state = msg.data
                for socket in sockets:
                    if socket is ws:
                        continue
                    await socket.send_str(msg.data)
        elif msg.type == aiohttp.WSMsgType.ERROR:
            print('ws connection closed with exception %s' %
                  ws.exception())

    print('websocket connection closed')

    return ws

app = web.Application()
app.router.add_routes(routes)
#app.router.add_routes([web.static('/static', '/static')])
app.router.add_static('/static', './static')
web.run_app(app)



