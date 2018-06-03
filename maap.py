import json
import aiohttp
from aiohttp import web, WSCloseCode

routes = web.RouteTableDef()

@routes.get('/')
async def hello(request):
    return web.Response(text='<a href="/static/index.html">Go here</a>', content_type='text/html')

sockets = set()
state = json.dumps([[[0 for column in range(20)] for row in range(20)] for layer in range(3)])

@routes.get('/ws')
async def websocket_handler(request):
    global state

    ws = web.WebSocketResponse()
    await ws.prepare(request)
    sockets.add(ws)
    if state:
        await ws.send_str(state)
    
    async for msg in ws:
        if msg.type == aiohttp.WSMsgType.TEXT:
            if msg.data == 'close':
                sockets.remove(ws)
                await ws.close()
            else:
                state = msg.data
                for socket in sockets:
                    if socket is ws:
                        continue
                    await socket.send_str(msg.data)
        elif msg.type == aiohttp.WSMsgType.ERROR:
            sockets.remove(ws)
            print('ws connection closed with exception %s' %
                  ws.exception())

    print('websocket connection closed')

    return ws

async def on_shutdown(app):
    for ws in sockets:
        await ws.close(code=WSCloseCode.GOING_AWAY,
                       message='Server shutdown')

app = web.Application()
app.router.add_routes(routes)
app.router.add_static('/static', './static')
app.on_shutdown.append(on_shutdown)
web.run_app(app)



