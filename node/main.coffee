Page = require('webpage')
page = null

startWechatClient = ->
    page.close() if page != null
    page = Page.create()
    page.onConsoleMessage = (msg) ->
        if msg == 'container_reset'
            console.log "Container is reset. Please re-login."
            startWechatClient()
            return
        console.log msg
    page.viewportSize = {
        width: 1024
        height: 768
    }
    page.open "https://wx.qq.com/", (status) ->
        (console.log 'Unable to load weixin web client.'; return) if status != 'success'
        waitLogin()

isWebWechat = ->
    page.evaluate ->
        location.host == "wx.qq.com" && typeof jQuery == 'function' && typeof WebMM == 'object'
currentUser = ->
    page.evaluate -> WebMM.model("account").getUserName()
loggedIn = ->
    page.evaluate ->
        WebMM.model("account").getUserName() != null

waitLogin = ->
    console.log "Waiting for user login..."
    i = setInterval ->
        unless isWebWechat()
            clearInterval i
            console.log "This might not be the wechat web client page, restarting..."
            startWechatClient()
            return
        if loggedIn()
            clearInterval i
            console.log "User login: #{currentUser()}"
            page.render 'client.png'
            startController()
            return
        page.render 'qr.png'
    , 3000

startController = ->
    page.evaluate ->
        class Ctrl
            self = null
            poller = null
            contact = WebMM.model 'contact'
            alias = {}
            _getContact = (id) ->
                return alias[id] if alias[id]
                a = {}
                for k, v of contact.getAllContacts()
                    a[v.Alias || v.UserName] = v
                alias = a
                a[id]
            _onMessage = (msg)->
                #WebMM.model('message').markMsgsRead(msg)
                console.log msg
                return
            _poll = ->
                if WebMM.model("account").getUserName() == null
                    self.dispose()
                    return
                $('.unreadDot:visible').parent().click()

            constructor: () ->
                self = this
                $(document.body).on 'globalevent', (i, e) -> 
                    _onMessage e.data if e.type == 'messageAdded' || e.type == 'messagePrepend'
                poller = setInterval _poll, 1000
                console.log 'Wechat client controller started...'
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
                clearInterval poller
                console.log "container_reset"
                window.onbeforeunload = null
                location.reload()
                return
        window.ctrl = new Ctrl()
        return

startWechatClient()