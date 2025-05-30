const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('node:path');
const { autoUpdater } = require('electron-updater');

let mainWindow;

// 設置自動更新器
autoUpdater.setFeedURL({
  provider: 'github',
  owner: 'codingfishcat',
  repo: 'test'
});

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'test.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  mainWindow.loadFile('app.html');
  
  // 開發時打開開發者工具
  mainWindow.webContents.openDevTools();
};

app.whenReady().then(() => {
  createWindow();
  
  // 啟動時檢查更新（可選）
  // autoUpdater.checkForUpdatesAndNotify();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// IPC 處理器
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('check-for-updates', async () => {
  // 檢查應用程式是否已打包
  if (!app.isPackaged) {
      console.log('在開發模式下跳過實際更新檢查，模擬結果。');
      // 模擬一個更新可用的情況
      return new Promise(resolve => {
          setTimeout(() => {
              const current = app.getVersion(); // 獲取當前版本
              const latest = '1.0.1'; // 模擬一個新版本號

              // 發送一個模擬的 "update-available" 事件給前端
              if (mainWindow) {
                  mainWindow.webContents.send('update-available', {
                      version: latest,
                      releaseNotes: '模擬更新說明：\n- 修正了一些小錯誤\n- 增加了新功能 X'
                  });
              }

              resolve({
                  hasUpdate: latest !== current,
                  currentVersion: current,
                  latestVersion: latest,
                  releaseNotes: '模擬更新說明：\n這是開發模式下的模擬更新。\n\n您可以在這裡看到更多說明。'
              });
          }, 2000); // 模擬網路延遲 2 秒
      });

      // 如果想模擬 "無更新" 的情況，可以這樣：
      // return { hasUpdate: false, currentVersion: app.getVersion(), latestVersion: app.getVersion(), releaseNotes: '已是最新版本' };
      // 如果想模擬 "檢查失敗" 的情況，可以這樣：
      // return { error: '模擬網路連線失敗，請檢查您的網路！' };
  }

  // 只有在應用程式已打包時，才執行實際的自動更新檢查
  try {
      const result = await autoUpdater.checkForUpdates();
      // autoUpdater.checkForUpdates() 在沒有更新時也會返回一個物件，只是 updateInfo 可能不包含新版本資訊
      // 這裡確保 result 和 updateInfo 存在
      if (!result || !result.updateInfo) {
          console.error('autoUpdater.checkForUpdates() 返回了非預期的結果:', result);
          throw new Error('無法獲取更新資訊，請檢查網路連線或稍後再試。');
      }

      return {
          hasUpdate: result.updateInfo.version !== app.getVersion(),
          currentVersion: app.getVersion(),
          latestVersion: result.updateInfo.version,
          releaseNotes: result.updateInfo.releaseNotes || '無更新說明'
      };
  } catch (error) {
      console.error('檢查更新失敗:', error);
      let userFacingError = '檢查更新失敗，請檢查您的網路連線或稍後再試。';
      if (error.message.includes('ERR_INTERNET_DISCONNECTED')) {
          userFacingError = '網路已斷開，請檢查您的網路連線。';
      } else if (error.message.includes('ENOTFOUND') || error.message.includes('ETIMEDOUT') || error.message.includes('ECONNREFUSED')) {
          userFacingError = '無法連接更新伺服器，請檢查您的網路連線或稍後再試。';
      } else if (error.message.includes('404')) {
          userFacingError = '更新伺服器找不到更新檔案，請確認應用程式來源正確。';
      } else if (error.message.includes('SyntaxError: Unexpected token')) { // 針對 "HTTP/1.1 4... is not valid JSON" 這類錯誤
          userFacingError = '更新伺服器返回了無效的回應，可能是網路不穩定或伺服器問題。';
      }
      return { error: userFacingError };
  }
});

ipcMain.handle('download-and-install-update', async () => {
  try {
    await autoUpdater.downloadUpdate();
    return { success: true };
  } catch (error) {
    console.error('下載更新失敗:', error);
    return { error: error.message };
  }
});

ipcMain.handle('install-update', () => {
  autoUpdater.quitAndInstall();
});

// 自動更新器事件監聽
autoUpdater.on('checking-for-update', () => {
  console.log('正在檢查更新...');
  if (mainWindow) {
    mainWindow.webContents.send('update-status', 'checking');
  }
});

autoUpdater.on('update-available', (info) => {
  console.log('發現更新:', info.version);
  if (mainWindow) {
    mainWindow.webContents.send('update-available', {
      version: info.version,
      releaseNotes: info.releaseNotes
    });
  }
});

autoUpdater.on('update-not-available', (info) => {
  console.log('已是最新版本:', info.version);
  if (mainWindow) {
    mainWindow.webContents.send('update-not-available', {
      version: info.version
    });
  }
});

autoUpdater.on('error', (err) => {
  console.error('自動更新錯誤:', err);
  if (mainWindow) {
    mainWindow.webContents.send('update-error', err.message);
  }
});

autoUpdater.on('download-progress', (progressObj) => {
  let log_message = "下載進度: " + progressObj.percent + "%";
  log_message = log_message + " (" + progressObj.transferred + "/" + progressObj.total + ")";
  console.log(log_message);
  
  if (mainWindow) {
    mainWindow.webContents.send('download-progress', {
      percent: Math.round(progressObj.percent),
      transferred: progressObj.transferred,
      total: progressObj.total
    });
  }
});

autoUpdater.on('update-downloaded', (info) => {
  console.log('更新下載完成');
  if (mainWindow) {
    mainWindow.webContents.send('update-downloaded', {
      version: info.version
    });
  }
  
  // 可以選擇自動安裝或詢問使用者
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: '更新下載完成',
    message: '更新已下載完成，是否現在重新啟動應用程式進行安裝？',
    buttons: ['現在重啟', '稍後安裝'],
    defaultId: 0
  }).then((result) => {
    if (result.response === 0) {
      autoUpdater.quitAndInstall();
    }
  });
});