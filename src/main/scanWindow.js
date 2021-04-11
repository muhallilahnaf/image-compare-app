const { ipcMain } = require('electron')
const { ipcScanAdd, ipcScanStart } = require('./utils')



// create scan window
const createScanWindow = () => {

    const { BrowserWindow } = require('electron')
    const { join } = require('path')
    const { pathToFileURL } = require('url')
    const { getMainWindow, setScanWindow } = require('../global')

    const scanWindow = new BrowserWindow({
        parent: getMainWindow(),
        modal: true,
        backgroundColor: '#252525',
        width: 800,
        height: 400,
        resizable: false,
        title: 'Add Folders to Scan',
        webPreferences: {
            contextIsolation: true,
            enableRemoteModule: false,
            preload: join(__dirname, '..', 'renderer', 'preload.js')
        }
    })

    const scanWindowHTMLPath = join(__dirname, '..', 'renderer', 'scanWindow.html')
    scanWindow.loadURL(pathToFileURL(scanWindowHTMLPath).href)

    scanWindow.menuBarVisible = false

    setScanWindow(scanWindow)

    // Handle garbage collection
    scanWindow.on('close', () => setScanWindow(null))
}



// scan:add
ipcMain.on('scan:add', ipcScanAdd)



// scan:start
ipcMain.on('scan:start', ipcScanStart)



// export
module.exports = {
    createScanWindow
}
