export default function(endpoint) {
  window.Ctrl = class Ctrl {
    constructor() {
      // TODO: handle new messages and provide a micro API service using phantom http server.
    }
    wechat() {
      let injector = angular.element(document.body).injector();
      return {
        injector,
        contact: injector.get('contactFactory'),
        util: injector.get('utilFactory'),
        account: injector.get('accountFactory'),
        chat: injector.get('chatFactory')
      }
    }
    isLogin() {
      return MMCgi.isLogin;
    }
    getCurrentUser() {
      return this.wechat().account.getUserName();
    }
    sendTextMessage(to, content) {
      let chat = this.wechat().chat;
      let message = chat.createMessage({ToUserName: to, Content: content, MsgType: 1});
      chat.sendMessage(message);
    }
  }
  window.ctrl = new window.Ctrl();
}