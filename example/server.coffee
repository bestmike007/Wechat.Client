# This is a web server that conforms to the client protocol and simple send the message back to the user.
# Run this server: phantomjs server.coffee
# Run the client: phantomjs main.coffee --endpoint=http://127.0.0.1:8180/

WebServer = require 'webserver'

server = WebServer.create()

service = server.listen 8180, keepAlive: true, (request, response) ->
    try
        response.statusCode = 200
        response.headers = {
            'Cache': 'no-cache',
            'Content-Type': 'application/json',
            'Connection': 'Keep-Alive',
            'Keep-Alive': 'timeout=5, max=100',
            'Content-Length': 0
        }
        if request.url.indexOf('cmd=login') > 0
            console.log "Request login: #{request.url}, #{request.post}"
            response.write ""
            response.close()
            return
        req = JSON.parse request.post
        rs = []
        for cmd in req
            rs.push { c: 'send', to: cmd.from, msg: "Message received: #{cmd.msg}" } if cmd.c == 'receive'
        body = JSON.stringify(rs)
        response.headers['Content-Length'] = body.length
        response.write body
        response.close()
    catch e
        console.log e.toString()

if service
    console.log "Example server running on port 8180..."
else
    console.log "Unable to bind port 8180..."
    phantom.exit()