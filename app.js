const { app, BrowserWindow } = require('electron');
const path = require('node:path');
const { updateElectronApp } = require('update-electron-app');

updateElectronApp({ notifyUser: true });

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'script.js')
    }
  });
  mainWindow.loadFile('app.html');
};

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
