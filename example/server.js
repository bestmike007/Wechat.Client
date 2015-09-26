phantom.outputEncoding = 'utf8';
var WebServer = require('webserver');
var server = WebServer.create();

var service = server.listen(8180, {
  keepAlive: true
}, function(request, response) {
  var body, cmd, e, error, i, len, req, rs;
  body = '';
  try {
    if (request.url.indexOf('cmd=login') > 0) {
      console.log("Request login: " + request.url + ", " + request.post);
      return;
    }
    req = JSON.parse(request.post);
    rs = [];
    for (i = 0, len = req.length; i < len; i++) {
      cmd = req[i];
      if (cmd.c === 'receive') {
        rs.push({
          c: 'send',
          to: cmd.from,
          msg: escape("Message received: " + (unescape(cmd.msg)))
        });
      }
    }
    body = JSON.stringify(rs);
    if (rs.length > 0) {
      return console.log("Sending commands: " + body);
    }
  } catch (error) {
    e = error;
    return console.log(e.toString());
  } finally {
    response.statusCode = 200;
    response.headers = {
      'Cache': 'no-cache',
      'Content-Type': 'application/json',
      'Connection': 'Keep-Alive',
      'Keep-Alive': 'timeout=5, max=100',
      'Content-Length': body.length
    };
    response.write(body);
    response.close();
  }
});

if (service) {
  console.log("Example server running on port 8180...");
} else {
  console.log("Unable to bind port 8180...");
  phantom.exit();
}
