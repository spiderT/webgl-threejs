const { ipcMain,  Notification } = require('electron');

module.exports = function () {

  // 收到消息 msg-receive
  ipcMain.handle('msg-receive', async (event, arg) => {
    console.log('handle msg-receive');
    const res = new Promise((resolve, reject) => {
      const notification = new Notification({
        title: arg.title,
        body: arg.body,
        hasReply: true,
      });
      notification.show();
      notification.on('reply', (e, reply) => {
        resolve({ event: 'reply', text: reply });
      });
      notification.on('close', (e) => {
        resolve({ event: 'close' });
      });
    });
    return res;
  });

};
