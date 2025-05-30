const { app, BrowserWindow, dialog } = require('electron'); // 引入 dialog 模块用于弹窗提示
const path = require('node:path');
const { updateElectronApp } = require('update-electron-app'); // 引入自动更新模块

updateElectronApp({
  notifyUser: true, 
  logger: require('electron-log'), 
});


const createWindow = () =>
  new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: { preload: path.join(__dirname, 'script.js') }
  }).loadFile('app.html');

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () =>
    BrowserWindow.getAllWindows().length || createWindow()
  );
});

app.on('window-all-closed', () =>
  process.platform !== 'darwin' && app.quit()
);