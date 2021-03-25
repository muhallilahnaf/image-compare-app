// imports
const { app, Menu, shell } = require('electron')
const { openFile } = require('./files')


// Build menu from template
const mainMenu = (createSWindow) => {

    const createScanWindow = createSWindow

    // main menu template
    let mainMenuTemplate = [
        {
            label: 'Scan',
            accelerator: process.platform == 'darwin' ? 'Command+R' : 'Ctrl+R',
            click: createScanWindow
        },
        {
            label: 'Check',
            submenu: [
                {
                    label: 'Open JSON File',
                    accelerator: process.platform == 'darwin' ? 'Command+O' : 'Ctrl+O',
                    click: openFile
                },
                {
                    label: 'Save JSON File',
                    accelerator: process.platform == 'darwin' ? 'Command+S' : 'Ctrl+S',
                    click: () => {
                        console.log(global.tanna)
                    }
                }
            ]
        },
        {
            label: 'About',
            click: () => shell.openExternal('https://muhallilahnaf.github.io')
        },
        {
            label: 'Quit',
            accelerator: process.platform == 'darwin' ? 'Command+Q' : 'Ctrl+Q',
            click: () => app.quit()
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
    mainMenu
}