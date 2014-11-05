Wechat client
======

Run this client with phantomjs.

## How it works

1. Open [wechat web client](https://wx.qq.com)
2. Push QR code to control & wait for login
3. Communicate with control with jsonp

## Protocol

The protocol is based on HTTP POST. This client can be controlled by any web application that conforms to this protocol. To run the client with specific http endpoint, run with endpoint argument ```phantomjs main.coffee --endpoint=http(s)://host:port/path```. Extra query string parameters including the timestamp and the currently signed in wechat id will be appended to the url, e.g. http(s)://host:port/path?_=1415167890000&id=bestmike007, when composing a post request. There is currently no means to authenticate the request, so please either use internal network or validate the request source.

This client will constantly and sequencially send post requests to your endpoint. And the client uses the wechat id as the unique identifier for a wechat user. This client does not support group chat for now.

This client uses the post request body to receive messages and the post response body to send commands. Both request body and response body are string representation of JSON arrays, which contains 0..N command objects. For example:

<pre>Request body:
[{ c: 'receive', from: 'bestmike007', msg: 'Hello!' }]
Response body:
[{ c: 'send', to: 'bestmike007', msg: 'Hello world!' }, { c: 'add', id: 'mysterious' } ]
</pre>

### Wechat Sign-in

The wechat web client uses a QR code to sign in. So before the client is available, we need a QR code image to scan on the smartphone. In this stage, the client will send an image url to ```<endpoint>?cmd=login``` with the image url in the post body.

<pre><code>POST <endpoint>?cmd=login HTTP/1.1
Host: xxx
...Headers...

https://login.weixin.qq.com/qrcode/12345678901234?t=webwx
</code></pre>

To be done: use an android emulator to run the wechat android client and programmatically control the client to scan the code and login automatically.

### Add Friend Request

Use the unique wechat id to send a friend request. Command object in response body example:

<pre>{
  c: 'add', // The command type
  id: 'bestmike007' // The unique wechat id to send a friend request
}</pre>

### Send a Message

Send a message to a specific wechat user. For now only text message is supported. Command object in response body example:

<pre>{
  c: 'send', // The command type
  to: 'bestmike007', // The wechat id to send message to
  msg: 'Hello world!' // The message to be sent
}</pre>

### Receive a Message

Receive a message from wechat client. Command object in request body example:

<pre>{
  c: 'receive', // The command type
  from: 'bestmike007', // The wechat id to send message to
  msg: 'Hello world!' // The message to be sent
}</pre>

## To be done

1. Multi-media messages
2. Group messages