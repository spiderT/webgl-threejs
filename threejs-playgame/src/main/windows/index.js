const { BrowserWindow, ipcMain, nativeTheme } = require('electron');
const isDev = require('electron-is-dev');
const path = require('path');

let win,
  willQuitApp = false;

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});

function createWindow() {
  // 创建浏览器窗口
  win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
    },
    minWidth: 800,
    minHeight: 600,
    // titleBarStyle: 'hiddenInset',
    show: false, // 先隐藏
    icon: path.join(__dirname, '../../resources/images/zhizhuxia.png'),
    backgroundColor: '#f3f3f3', // 优化白屏，设置窗口底色
  });

  global.sharedObject = {
    mainId: win.webContents.id,
  };


  win.on('ready-to-show', () => win.show()); // 初始化后显示

  win.on('close', (e) => {
    console.log('close', willQuitApp);
    if (willQuitApp) {
      win = null;
    } else {
      e.preventDefault();
      win.hide();
    }
  });

  if (isDev) {
    win.loadURL('http://localhost:9200');
  } else {
    win.loadFile(path.join(__dirname, '../../../build/index.html'));
  }

}

function show() {
  win && win.show();
}

function close() {
  willQuitApp = true;
  win && win.close();
}

function send(channel, ...args) {
  win && win.webContents.send(channel, ...args);
}

module.exports = {
  createWindow,
  show,
  close,
  send,
};
