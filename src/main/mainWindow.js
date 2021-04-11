
// create main window
const createMainWindow = () => {

    const { BrowserWindow, app, Menu } = require('electron')
    const os = require('os')
    const { pathToFileURL } = require('url')
    const { join } = require('path')
    const { setMainWindow, getMainWindowTitle } = require('../global')
    const { getMainMenu } = require('./menu')
    const { beforeMainWindowClose } = require('./utils')


    const mainWindow = new BrowserWindow({
        backgroundColor: '#252525',
        width: 1366,
        minWidth: 1260,
        height: 768,
        minHeight: 635,
        title: getMainWindowTitle(),
        webPreferences: {
            contextIsolation: true,
            enableRemoteModule: false,
            preload: join(__dirname, '..', 'renderer', 'preload.js')
        }
    })

    setMainWindow(mainWindow)

    const homeHTMLPath = join(__dirname, '..', 'renderer', 'home.html')
    mainWindow.loadURL(pathToFileURL(homeHTMLPath).href)

    const mainMenu = getMainMenu()
    Menu.setApplicationMenu(mainMenu)

    setMainWindow(mainWindow)

    mainWindow.webContents.on('did-finish-load', () => {
        mainWindow.webContents.send('home:username', os.userInfo().username)
    })

    // check for matches data on close
    mainWindow.on('close', beforeMainWindowClose)

    mainWindow.on('closed', () => app.quit())
}



const { ipcMain } = require('electron')
const { ipcMainDelete, ipcMainCheckExistence, openFile } = require('./utils')
const { createScanWindow } = require('./scanWindow')
const { getMainWindow } = require('../global')



// home:scan
ipcMain.on('home:scan', createScanWindow)

// home:open
ipcMain.on('home:open', openFile)

// home:quit
ipcMain.on('home:quit', () => getMainWindow().close())

// main:delete
ipcMain.on('main:delete', ipcMainDelete)

// main:checkExistence
ipcMain.on('main:checkExistence', ipcMainCheckExistence)



// export
module.exports = {
    createMainWindow
}
