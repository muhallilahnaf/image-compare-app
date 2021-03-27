// imports
const { dialog, ipcMain, app } = require('electron')
const { open, close, readFile, writeFileSync, readdirSync, statSync, unlinkSync } = require('fs')
const { extensions, findDups } = require('./helpers')
const { normalize } = require('path')
const trash = require('trash')


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


// save scan result locally
const saveScan = (m) => {
    const saveToDir = dialog.showSaveDialogSync(scanWindow, {
        title: 'Save Scan Data',
        defaultPath: normalize(`${app.getPath('documents')}/duplicates.json`),
        filters: [
            { name: 'JSON file', extensions: ['json'] }
        ]
    })

    if (saveToDir) {
        console.log(saveToDir)
        writeFileSync(saveToDir, JSON.stringify(m, null, 4))
        scanWindow.close()
    } else {
        console.log('not saved')
    }
}


// move image to recycle bin/trash
const moveToBin = async (url) => {
    await trash(url)
}


// scan:add
ipcMain.on('scan:add', (e, item) => {
    openFolder(item)
})


// scan:start
ipcMain.on('scan:start', (e, dirs) => {

    // variable to save files
    let fileDict = {}

    // add to fileDict variable
    const addToDict = (file, url) => {
        if (typeof fileDict[file] === 'undefined') {
            fileDict[file] = [url]
        } else if (!fileDict[file].includes(url)) {
            fileDict[file].push(url)
        }
    }

    // scan dirs recursively and identify files and folders
    const scanDir = (dir) => {
        const items = readdirSync(dir)

        // loop for each file/subdir inside dir
        items.forEach(item => {
            const fullItem = normalize(`${dir}/${item}`)
            try {
                const stats = statSync(fullItem)

                // check if its subdir or file
                if (stats.isFile()) {
                    const ext = item.substring(item.lastIndexOf('.') + 1)

                    if (extensions.some(e => e.toLowerCase() == ext)) addToDict(item, fullItem)

                } else if (stats.isDirectory()) {
                    scanDir(normalize(fullItem))
                }
            } catch (err) { console.log(err) }
        })
    }

    // filter out empty dir strings just in case
    const dirList = dirs.filter(dir => dir != '')

    // loop for each dir from input
    dirList.forEach(dir => scanDir(dir))

    console.log(fileDict)

    // generate matches array
    const matches = findDups(fileDict)

    // send signal to scan window telling scan finished
    scanWindow.webContents.send('scan:finish', 'finished')

    if (matches.length) {
        // if matches found, ask if check now or later
        console.log('match(es) found', matches)
        const butIndex = dialog.showMessageBoxSync(scanWindow, {
            message: `${matches.length} duplicate(s) found.`,
            type: 'question',
            buttons: ['Check Now', 'Save For Later'],
            title: 'Scan Result',
            cancelId: 2,
            detail: 'Check Now: check the duplicate images manually now\nSave For Later: save the scan results to check manually in the app later'
        })


        if (butIndex === 0) {
            // check now
            scanWindow.close()
            mainWindow.webContents.send('main:load', matches)
            console.log('check now')
        } else if (butIndex === 1) {
            // save matches in a file for later
            saveScan(matches)
        }


    } else {
        // if no matches found, alert user
        const butIndex = dialog.showMessageBoxSync(scanWindow, {
            message: 'No duplicates found.',
            type: 'info',
            buttons: ['OK'],
            title: 'Scan Result'
        })

        if (butIndex === 0) scanWindow.close()
    }
})


// main:delete
ipcMain.on('main:delete', (e, url) => {
    const delIndex = dialog.showMessageBoxSync(mainWindow, {
        message: `Delete '${url}'?`,
        type: 'question',
        buttons: ['No', 'Move to Recycle Bin/Trash', 'Delete Permanently'],
        title: 'Delete Image',
        cancelId: 0,
    })

    if (delIndex === 1) moveToBin(url)
    if (delIndex === 2) unlinkSync(url)
    if (delIndex !== 0) mainWindow.webContents.send('main:deleted', url)
})

// exports
module.exports = {
    openFile,
    sendMain,
    sendScan
}