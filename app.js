const { app, BrowserWindow } = require('electron')
const path = require('node:path')

const createWindow = () =>
  new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: { preload: path.join(__dirname, 'script.js') }
  }).loadFile('app.html')

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () =>
    BrowserWindow.getAllWindows().length || createWindow()
  )
})

app.on('window-all-closed', () =>
  process.platform !== 'darwin' && app.quit()
)
