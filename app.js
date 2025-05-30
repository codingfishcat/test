const { app, BrowserWindow, ipcMain, dialog } = require('electron'); // Add dialog
const path = require('node:path');
const { autoUpdater } = require('electron-updater'); // Import autoUpdater

// Configure autoUpdater logging (optional but recommended for debugging)
// autoUpdater.logger = require('electron-log');
// autoUpdater.logger.transports.file.level = 'info';

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'test.js'),
      contextIsolation: true, // Recommended for security
      nodeIntegration: false // Recommended for security
    }
  });

  mainWindow.loadFile('app.html');

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();
};

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  // Start checking for updates after the app is ready
  // You might want to delay this check slightly, or trigger it via user action
  autoUpdater.checkForUpdatesAndNotify();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

// --- electron-updater event listeners ---

autoUpdater.on('checking-for-update', () => {
  console.log('Checking for update...');
  // You can send a message to your renderer process to update UI
  // mainWindow.webContents.send('update-message', 'Checking for update...');
});

autoUpdater.on('update-available', (info) => {
  console.log('Update available:', info);
  // Send message to renderer or show a dialog
  dialog.showMessageBox({
    type: 'info',
    title: 'Update Available',
    message: `A new version ${info.version} is available! Downloading now...`,
    buttons: ['OK']
  });
});

autoUpdater.on('update-not-available', (info) => {
  console.log('Update not available:', info);
  // Send message to renderer or show a dialog
  // dialog.showMessageBox({
  //   type: 'info',
  //   title: 'No Update',
  //   message: 'You are running the latest version.',
  //   buttons: ['OK']
  // });
});

autoUpdater.on('error', (err) => {
  console.error('Error in auto-updater:', err);
  dialog.showErrorBox('Update Error', `Error checking for updates: ${err.message}`);
});

autoUpdater.on('download-progress', (progressObj) => {
  let log_message = "Download speed: " + progressObj.bytesPerSecond;
  log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
  log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
  console.log(log_message);
  // You can send download progress to your renderer process to display a progress bar
  // mainWindow.webContents.send('download-progress', progressObj.percent);
});

autoUpdater.on('update-downloaded', (info) => {
  console.log('Update downloaded; will install in 5 seconds...');
  // Send message to renderer or show a dialog prompting user to restart
  dialog.showMessageBox({
    type: 'info',
    title: 'Update Ready',
    message: 'A new version has been downloaded. Restart the application to apply the update.',
    buttons: ['Restart', 'Later']
  }).then((buttonIndex) => {
    if (buttonIndex.response === 0) { // 'Restart' button
      autoUpdater.quitAndInstall();
    }
  });
});