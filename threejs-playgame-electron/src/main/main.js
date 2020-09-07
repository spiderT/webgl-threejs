const { app, globalShortcut } = require('electron');
const setAppMenu = require('./menus');
const setTray = require('./tray');
const { createLoginWindow, show, close, createWindow } = require('./windows');
const path = require('path');

// 开机自启动
app.setLoginItemSettings({
  openAtLogin: true,
});

app.whenReady().then(() => {
  setAppMenu();
  if (process.platform === 'darwin') {
    app.dock.setIcon(path.join(__dirname, '../resources/images/zhizhuxia_big.png'));
  }
});

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', show);

  app.on('ready', () => {
    createLoginWindow();
    createWindow();
    setTray();
  });

  app.on('activate', show);

  app.on('before-quit', close);

  app.on('will-quit', () => {
    globalShortcut.unregisterAll();
  });
}
