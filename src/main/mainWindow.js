const { BrowserWindow, app, Menu, ipcMain } = require('electron')
const { join } = require('path')
const { pathToFileURL } = require('url')
const { setMainWindow, getMainWindowTitle } = require('../global')
const { getMainMenu } = require('./menu')
const { beforeMainWindowClose, ipcMainMainDelete } = require('./utils')



// create main window
const createMainWindow = () => {

    const mainWindow = new BrowserWindow({
        backgroundColor: '#252525',
        icon: join(__dirname, '..', '..', 'assets', 'icons', 'png', '64x64.png'),
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

    const mainWindowHTMLPath = join(__dirname, '..', 'renderer', 'mainWindow.html')
    mainWindow.loadURL(pathToFileURL(mainWindowHTMLPath).href)

    const mainMenu = getMainMenu()
    Menu.setApplicationMenu(mainMenu)

    setMainWindow(mainWindow)

    // check for matches data on close
    mainWindow.on('close', beforeMainWindowClose)

    mainWindow.on('closed', () => app.quit())
}



// main:delete
ipcMain.on('main:delete', ipcMainMainDelete)



// export
module.exports = {
    createMainWindow
}
