const Page = require('webpage');
const ClientController = require('./ctrl');
phantom.outputEncoding = 'utf8';

const WechatClient = function(endpoint) {
  let page = status = monitor = null;
  const _isWebWechat = () => {
    return page !== null && page.evaluate(function() {
      return location.host === "wx.qq.com" && typeof jQuery === 'function' && typeof MM === 'object' && typeof MMCgi === 'object';
    });
  };
  _initializePage = () => {
    if (page !== null) {
      page.close();
    }
    page = Page.create();
    page.onConsoleMessage = msg => {
      if (msg === 'container_reset') {
        console.log("Container is reset. Please re-login.");
        _initializePage();
        return;
      }
      console.log(msg);
    };
    page.settings.webSecurityEnabled = false;
    page.settings.localToRemoteUrlAccessEnabled = true;
    page.viewportSize = {
      width: 1024,
      height: 768
    };
    console.log("Loading wechat client web page...");
    page.open("https://wx.qq.com/", status => {
      if (status !== 'success') {
        console.log('Unable to load weixin web client.');
        return;
      }
      if (!_isWebWechat()) {
        console.log('https://wx.qq.com/ loaded but does not seem to be the wechat web client page.');
        return;
      }
      return console.log("Wechat web loaded, waiting for login..");
    });
  };
  _injectCtrl = () => {
    if (page.evaluate(function() {
      return typeof Ctrl === 'function' && typeof ctrl === 'object';
    })) {
      return null;
    }
    return page.evaluate(ClientController, endpoint);
  };
  _initializePage();
  monitor = setInterval(() => {
    page.render("screen.png");
    if (_isWebWechat()) {
      return _injectCtrl();
    } else {
      return _initializePage();
    }
  }, 3000);
  this.close = function() {
    clearInterval(monitor);
    if (page !== null) {
      return page.close();
    }
  };
};

let system = require('system'),
    endpoint = "http://127.0.0.1:8180/";

system.args.filter(arg => arg.indexOf('--endpoint=') === 0).forEach(arg => endpoint = arg.substring(11));

let client = new WechatClient(endpoint);
