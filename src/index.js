const { app, BrowserWindow } = require('electron')
const path = require('node:path')

function createWindow() {
  const win = new BrowserWindow({
    width: 420,
    height: 240,
    frame:false,
    hasShadow: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#00FFFFFF',
    titleBarStyle: 'customButtonsOnHover',
    // resizable:false,
    transparent: true,
    webPreferences: {
      preload: path.join(__dirname, 'render', 'index.js')
    }
  })
  win.loadFile('./src/index.html')
}

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})