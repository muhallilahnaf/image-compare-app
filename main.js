// imports
const { app, BrowserWindow, Menu, ipcMain } = require('electron')
const url = require('url')
const path = require('path')
const { mainMenu } = require('./menu')
const { sendMain, sendScan } = require('./files')


// SET ENV
process.env.NODE_ENV = 'development'


// global variables
let mainWindow
let scanWindow
let mainWindowTitle = 'image comparison tool'


// main window
const createMainWindow = () => {

    // Create new window
    mainWindow = new BrowserWindow({
        width: 1366,
        minWidth: 1260,
        height: 768,
        minHeight: 635,
        title: mainWindowTitle,
        webPreferences: {
            contextIsolation: true,
            enableRemoteModule: false,
            preload: path.join(__dirname, 'preload.js')
        }
    })

    // Load html in window
    mainWindow.loadURL(
        url.fileURLToPath(`file:///${__dirname}/mainWindow.html`)
    )

    // Quit app when closed
    mainWindow.on('closed', () => app.quit())

    // Insert menu
    Menu.setApplicationMenu(mainMenu(createScanWindow))

    // send to files.js
    sendMain(mainWindow, mainWindowTitle)

}


// scan window
const createScanWindow = () => {

    // Create new window
    scanWindow = new BrowserWindow({
        parent: mainWindow,
        modal: true,
        width: 800,
        height: 400,
        resizable: false,
        title: 'Add Folders to Scan',
        webPreferences: {
            contextIsolation: true,
            enableRemoteModule: false,
            preload: path.join(__dirname, 'preload.js')
        }
    })

    // Load html in window
    scanWindow.loadURL(
        url.fileURLToPath(`file:///${__dirname}/scanWindow.html`)
    )

    // hide menu
    scanWindow.menuBarVisible = false

    // send to files.js
    sendScan(scanWindow)

    // Handle garbage collection
    scanWindow.on('close', () => {
        scanWindow = null
    })
}



// Listen for app to be ready
app.on('ready', createMainWindow)


// Catch dim
ipcMain.on('dim', (e, item) => {
    console.log(item)
})

