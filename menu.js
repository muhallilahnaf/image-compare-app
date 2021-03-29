// imports
const { app, Menu, shell } = require('electron')
const { openFile, saveScanMenu } = require('./files')

let mainWindow
const getMainWindow = (m) => mainWindow = m

// Build menu from template
const mainMenu = (createSWindow) => {

    const createScanWindow = createSWindow

    // main menu template
    let mainMenuTemplate = [
        {
            label: 'File',
            submenu: [
                {
                    label: 'Scan',
                    accelerator: process.platform == 'darwin' ? 'Command+X' : 'Ctrl+X',
                    click: createScanWindow
                },
                {
                    type: 'separator'
                },
                {
                    label: 'Open Scan Data',
                    accelerator: process.platform == 'darwin' ? 'Command+O' : 'Ctrl+O',
                    click: openFile
                },
                {
                    label: 'Save Scan Data',
                    accelerator: process.platform == 'darwin' ? 'Command+S' : 'Ctrl+S',
                    click: saveScanMenu
                },
                {
                    type: 'separator'
                },
                {
                    label: 'Quit',
                    accelerator: process.platform == 'darwin' ? 'Command+Q' : 'Ctrl+Q',
                    click: () => mainWindow.close()
                }
            ]
        },
        {
            label: 'About',
            submenu: [
                {
                    label: 'Website',
                    click: () => shell.openExternal('https://muhallilahnaf.github.io/apps.html')
                }
            ]
        }
    ]

    // If OSX, add empty object to menu
    if (process.platform == 'darwin') {
        mainMenuTemplate.unshift({})
    }

    // Add developer tools option if in dev
    if (process.env.NODE_ENV !== 'production') {
        mainMenuTemplate.push({
            label: 'Developer Tools',
            submenu: [
                {
                    role: 'reload'
                },
                {
                    label: 'Toggle DevTools',
                    accelerator: process.platform == 'darwin' ? 'Command+I' : 'Ctrl+I',
                    click: (item, focusedWindow) => {
                        focusedWindow.toggleDevTools()
                    }
                }
            ]
        })
    }

    return Menu.buildFromTemplate(mainMenuTemplate)
}


// exports
module.exports = {
    mainMenu,
    getMainWindow
}