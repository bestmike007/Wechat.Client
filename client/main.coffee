Page = require('webpage')
class WechatClient
    self = this
    page = null
    status = null
    monitor = null
    endpoint = null
    _isWebWechat = ->
        page != null && page.evaluate ->
            location.host == "wx.qq.com" && typeof jQuery == 'function' && typeof WebMM == 'object'
    _initializePage = ->
        page.close() if page != null
        page = Page.create()
        page.onConsoleMessage = (msg) ->
            if msg == 'container_reset'
                console.log "Container is reset. Please re-login."
                _initializePage()
                return
            console.log msg
        page.settings.webSecurityEnabled = false
        page.settings.localToRemoteUrlAccessEnabled = true
        page.viewportSize = {
            width: 1024
            height: 768
        }
        console.log "Loading wechat client web page..."
        page.open "https://wx.qq.com/", (status) ->
            (console.log 'Unable to load weixin web client.'; return) if status != 'success'
            (console.log 'https://wx.qq.com/ loaded but does not seem to be the wechat web client page.'; return) if !_isWebWechat()
            console.log "Wechat web loaded, waiting for login.."
    _injectCtrl = ->
        return null if page.evaluate -> typeof Ctrl == 'function' && typeof ctrl == 'object'
        page.evaluate (endpoint) ->
            class Ctrl
                self = this
                i = null
                poller = null
                contact = WebMM.model 'contact'
                alias = {}
                inbox = []
                _currentUser = ->
                    WebMM.model("account").getUserName()
                _loggedIn = ->
                    _currentUser() != null
                _startCtrl = ->
                    $(document.body).on 'globalevent', (i, e) -> 
                        _onMessage e.data if e.type == 'messageAdded' || e.type == 'messagePrepend'
                    poller = setInterval _poll, 1000
                    console.log 'Wechat client controller started...'
                _waitLogin = ->
                    console.log "Waiting for user login..."
                    i = setInterval ->
                        if _loggedIn()
                            clearInterval i
                            console.log "User login: #{_currentUser()}"
                            _startCtrl()
                            return
                        imgUrl = $('#loginQrCode').attr('src')
                        _endpoint = if endpoint.indexOf('?') > 0 then "#{endpoint}&cmd=login" else "#{endpoint}?cmd=login"
                        console.log "Sending image url #{imgUrl} to endpoint #{_endpoint}"
                        $.post _endpoint, imgUrl, ->
                            console.log "QR code url #{imgUrl} sent to #{_endpoint}"
                    , 3000
                _getContact = (id) ->
                    return alias[id] if alias[id]
                    a = {}
                    for k, v of contact.getAllContacts()
                        a[v.Alias || v.UserName] = v
                    alias = a
                    a[id]
                _userToId = (username) ->
                    for k,v of contact.getAllContacts()
                        return v.Alias || v.UserName if v.UserName == username || v.Alias == username
                    return null
                _onMessage = (msg)->
                    console.log JSON.stringify msg
                    return null if msg.actualSender == msg.FromUserName
                    inbox.push {
                        c: 'receive'
                        msg: msg.actualContent
                        from: _userToId msg.actualSender
                    }
                _poll = ->
                    (self.dispose(); return) if !_loggedIn()
                    $('.unreadDot:visible').parent().click()
                    msgs = inbox
                    inbox = []
                    $.post endpoint, JSON.stringify msgs, (data) ->
                        (console.log "Unable to identify response body from controller server. #{JSON.stringify(data)}"; return) if $.isArray data
                        for msg in data
                            self.send msg.to, msg.msg if msg.c == 'send'
                            self.addContact msg.id, msg.msg if msg.c == 'add'
                    , 'json'
                constructor: () ->
                    _waitLogin()
                isContact: (id) ->
                    c = _getContact(id)
                    return false if c == null
                    WebMM.util.isContact c.UserName
                send: (id, msg) ->
                    unless self.isContact id
                        return 'e_nonexists_contact'
                    WebMM.logic("sendMsg").sendText {
                        Msg: {
                            FromUserName: WebMM.model("account").getUserName()
                            ToUserName: _getContact(id).UserName
                            Type: 1
                            Content: msg
                        }
                    }, {}
                    return "s_sent"
                addContact: (id, msg) ->
                    WebMM.logic("userverify").verify id, WebMM.Constants.MM_VERIFYUSER_SENDREQUEST, msg, 0
                dispose: ->
                    clearInterval poller if poller != null
                    console.log "container_reset"
                    window.onbeforeunload = null
                    location.reload()
                    return
            window.Ctrl = Ctrl
            window.ctrl = new Ctrl()
        , endpoint
    constructor: (_endpoint) ->
        endpoint = _endpoint
        _initializePage()
        monitor = setInterval ->
                page.render "screen.png"
                if _isWebWechat()
                    _injectCtrl()
                else
                   _initializePage()
            , 3000
        return
    close: ->
        clearInterval monitor
        page.close() if page != null

system = require 'system'
args = system.args
endpoint = "http://127.0.0.1:8180/"
for arg in args
    endpoint = arg.substring(11) if arg.indexOf('--endpoint=') == 0

client = new WechatClient(endpoint)