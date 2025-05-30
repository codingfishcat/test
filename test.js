const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // 獲取應用程式版本
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  
  // 檢查更新
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  
  // 下載並安裝更新
  downloadAndInstallUpdate: () => ipcRenderer.invoke('download-and-install-update'),
  
  // 安裝更新（重啟應用程式）
  installUpdate: () => ipcRenderer.invoke('install-update'),
  
  // 監聽更新事件
  onUpdateStatus: (callback) => ipcRenderer.on('update-status', callback),
  onUpdateAvailable: (callback) => ipcRenderer.on('update-available', callback),
  onUpdateNotAvailable: (callback) => ipcRenderer.on('update-not-available', callback),
  onUpdateError: (callback) => ipcRenderer.on('update-error', callback),
  onDownloadProgress: (callback) => ipcRenderer.on('download-progress', callback),
  onUpdateDownloaded: (callback) => ipcRenderer.on('update-downloaded', callback),
  
  // 移除監聽器
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
});