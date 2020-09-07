const { BrowserWindow, ipcMain } = require('electron');
const isDev = require('electron-is-dev');
const path = require('path');

let win,
  willQuitApp = false;

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});

// 登陆页
function createLoginWindow() {
  loginWin = new BrowserWindow({
    width: 300,
    height: 400,
    frame: false,
    webPreferences: {
      nodeIntegration: true,
    },
    // todo
    // resizable: false,
  });

  willQuitApp = false;
  if (isDev) {
    loginWin.loadURL('http://localhost:9999/login.html');
  } else {
    loginWin.loadFile(path.join(__dirname, '../../../build/login.html'));
  }
}

// 登录
ipcMain.on('login-error', (event, arg) => {
  console.log('login-error');
});

ipcMain.on('login-success', (event, arg) => {
  console.log('login-success');
  createWindow();
  loginWin.close();
  win.setSize(1000, 800);
  win.center();
});

ipcMain.on('close-login', (event, arg) => {
  console.log('close-login');
  loginWin && loginWin.close();
  close();
});


function createWindow() {
  // 创建浏览器窗口
  win = new BrowserWindow({
    width: 0,
    height: 0,
    webPreferences: {
      nodeIntegration: true,
    },
    minWidth: 800,
    minHeight: 600,
    titleBarStyle: 'hiddenInset',
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
    win.loadURL('http://localhost:9999');
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
  createLoginWindow,
  createWindow,
  show,
  close,
  send,
};
