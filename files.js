// imports
const { dialog, ipcMain } = require('electron')
const { open, close, readFile, writeFile, readdirSync, statSync } = require('fs')
const { extensions, findDups } = require('./helpers')


// vars
let mainWindow
let mainWindowTitle
let scanWindow


// open file function for check menu
const openFile = () => {

    // show file open dialog allowing only json file
    dialog.showOpenDialog(mainWindow, {
        filters: [
            { name: 'JSON file', extensions: ['json'] }
        ],
        properties: ['openFile']
    }).then(res => {

        // read json file
        if (!res.canceled) {
            mainWindow.setTitle(`${mainWindowTitle} [${res.filePaths[0]}]`)

            readFile(res.filePaths[0], 'utf8', (err, data) => {
                if (err) throw err
                console.log(JSON.parse(data))
            })
        } else {
            console.log('cancelled')
        }
    })
}


// get main window global vars
const sendMain = (mWindow, mTitle) => {
    mainWindow = mWindow
    mainWindowTitle = mTitle
}


// get global vars value
const sendScan = (sWindow) => {
    scanWindow = sWindow
}


// open folder function for scan window
const openFolder = (item) => {

    // show folder open dialog attached to scan window
    dialog.showOpenDialog(scanWindow, {
        properties: ['openDirectory']
    }).then(res => {

        console.log(res.filePaths[0], item)
        if (!res.canceled) {
            scanWindow.webContents.send('scan:add', {
                number: item,
                dir: res.filePaths[0]
            })
        } else {
            console.log('cancelled')
        }
    })
}


// scan:add
ipcMain.on('scan:add', (e, item) => {
    openFolder(item)
})


// scan:start
ipcMain.on('scan:start', (e, dirs) => {

    let fileList = []

    const addToList = (file) => fileList.push(file)

    const scanDir = (dir) => {
        const items = readdirSync(dir)

        // loop for each file/subdir inside dir
        items.forEach(item => {
            try {
                const stats = statSync(`${dir}\\${item}`)

                // check if its subdir or file
                if (stats.isFile()) {
                    const ext = item.substring(item.lastIndexOf('.') + 1)

                    if (extensions.some(e => e.toLowerCase() == ext)) addToList(item)

                } else if (stats.isDirectory()) {
                    scanDir(`${dir}\\${item}`)
                }
            } catch (err) { console.log(err) }
        })
    }

    const dirList = dirs.filter(dir => dir != '')

    // loop for each dir from input
    dirList.forEach(dir => scanDir(dir))

    console.log(fileList)

    fileList = fileList.sort()
    const matches = findDups(fileList)

    if (matches.length) {
        console.log('match(es) found', matches)
    } else {
        console.log('no matches found')
    }
    scanWindow.webContents.send('scan:finish', 'finished')
})


// exports
module.exports = {
    openFile,
    sendMain,
    sendScan
}