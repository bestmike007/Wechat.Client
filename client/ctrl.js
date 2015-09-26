export default function(endpoint) {
  window.Ctrl = function() {
    var _currentUser, _getContact, _loggedIn, _onMessage, _poll, _startCtrl, _userToId, _waitLogin, alias, contact, i, inbox, poller;
    self = this;
    i = null;
    poller = null;
    contact = WebMM.model('contact');
    alias = {};
    inbox = [];
    _currentUser = function() {
      return WebMM.model("account").getUserName();
    };
    _loggedIn = function() {
      return _currentUser() !== null;
    };
    _startCtrl = function() {
      $(document.body).on('globalevent', function(i, e) {
        if (e.type === 'messageAdded' || e.type === 'messagePrepend') {
          return _onMessage(e.data);
        }
      });
      poller = setInterval(_poll, 1000);
      return console.log('Wechat client controller started...');
    };
    _waitLogin = function() {
      console.log("Waiting for user login...");
      return i = setInterval((function() {
        var _endpoint, e, error, imgUrl;
        try {
          if (_loggedIn()) {
            clearInterval(i);
            console.log("User login: " + (_currentUser()));
            _startCtrl();
            return;
          }
          imgUrl = $('#loginQrCode').attr('src');
          _endpoint = endpoint.indexOf('?') > 0 ? endpoint + "&cmd=login" : endpoint + "?cmd=login";
          console.log("Sending image url " + imgUrl + " to endpoint " + _endpoint);
          return $.post(_endpoint, imgUrl, function() {
            return console.log("QR code url " + imgUrl + " sent to " + _endpoint);
          });
        } catch (error) {
          e = error;
          return console.log(e.toString());
        }
      }), 3000);
    };
    _getContact = function(id) {
      var a, k, ref, v;
      if (alias[id]) {
        return alias[id];
      }
      a = {};
      ref = contact.getAllContacts();
      for (k in ref) {
        v = ref[k];
        a[v.Alias || v.UserName] = v;
      }
      alias = a;
      return a[id];
    };
    _userToId = function(username) {
      var k, ref, v;
      ref = contact.getAllContacts();
      for (k in ref) {
        v = ref[k];
        if (v.UserName === username || v.Alias === username) {
          return v.Alias || v.UserName;
        }
      }
      return null;
    };
    _onMessage = function(msg) {
      var e, error;
      try {
        if (msg.MsgType === -9999 || msg.FromUserName === '' || msg.actualSender !== msg.FromUserName || (msg.Status !== 3)) {
          return null;
        }
        console.log(JSON.stringify(msg));
        return inbox.push({
          c: 'receive',
          msg: escape(msg.actualContent),
          from: _userToId(msg.actualSender)
        });
      } catch (error) {
        e = error;
        return console.log(e.toString());
      }
    };
    _poll = function() {
      var e, error, msgs;
      try {
        if (!_loggedIn()) {
          self.dispose();
          return;
        }
        $('.unreadDot:visible').parent().click();
        msgs = inbox;
        inbox = [];
        if (msgs.length > 0) {
          console.log("Received messages: " + (JSON.stringify(msgs)));
        }
        return $.post(endpoint, JSON.stringify(msgs), (function(data) {
          var e, error, j, len, msg, results;
          try {
            if (!$.isArray(data)) {
              console.log("Unable to identify response body from controller server. " + (JSON.stringify(data)));
              return;
            }
            if (data.length > 0) {
              console.log("Processing server commands " + (JSON.stringify(data)));
            }
            results = [];
            for (j = 0, len = data.length; j < len; j++) {
              msg = data[j];
              if (msg.c === 'send') {
                self.send(msg.to, unescape(msg.msg));
              }
              if (msg.c === 'add') {
                results.push(self.addContact(msg.id, unescape(msg.msg)));
              } else {
                results.push(void 0);
              }
            }
            return results;
          } catch (error) {
            e = error;
            return console.log(e.toString());
          }
        }), 'json');
      } catch (error) {
        e = error;
        return console.log(e.toString());
      }
    };
    this.isContact = function(id) {
      var c;
      c = _getContact(id);
      if (c === null) {
        return false;
      }
      return WebMM.util.isContact(c.UserName);
    };
    this.send = function(id, msg) {
      if (!self.isContact(id)) {
        return 'e_nonexists_contact';
      }
      if (id === _currentUser()) {
        id = "filehelper";
      }
      WebMM.logic("sendMsg").sendText({
        Msg: {
          FromUserName: WebMM.model("account").getUserName(),
          ToUserName: _getContact(id).UserName,
          Type: 1,
          Content: msg
        }
      }, {});
      return "s_sent";
    };
    this.addContact = function(id, msg) {
      return WebMM.logic("userverify").verify(id, WebMM.Constants.MM_VERIFYUSER_SENDREQUEST, msg, 0);
    };
    this.dispose = function() {
      if (poller !== null) {
        clearInterval(poller);
      }
      console.log("container_reset");
      window.onbeforeunload = null;
      location.reload();
    };
    _waitLogin();
  };
  window.ctrl = new window.Ctrl();
}