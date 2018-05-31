
from aiohttp import web

routes = web.RouteTableDef()

@routes.get('/')
async def hello(request):
    return web.Response(text="Hello, world")

@routes.get('/ws')
async def websocket_handler(request):

    ws = web.WebSocketResponse()
    await ws.prepare(request)

    async for msg in ws:
        if msg.type == aiohttp.WSMsgType.TEXT:
            if msg.data == 'close':
                await ws.close()
            else:
                await ws.send_str(msg.data + '/answer')
        elif msg.type == aiohttp.WSMsgType.ERROR:
            print('ws connection closed with exception %s' %
                  ws.exception())

    print('websocket connection closed')

    return ws

app = web.Application()
app.router.add_routes(routes)
web.run_app(app)