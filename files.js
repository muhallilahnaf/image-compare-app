// imports
const { dialog, ipcMain, app } = require('electron')
const { readFileSync, writeFileSync, readdirSync, statSync, unlinkSync } = require('fs')
const { extensions, findDups, verifyFile } = require('./helpers')
const { normalize } = require('path')
const trash = require('trash')
const { getState, setState } = require('./global')


// vars
let mainWindow
let mainWindowTitle
let scanWindow


// save scan for menu
const saveScanMenu = () => {

    // check if unsaved state
    let state = getState()

    if (state.stage === 'unsaved' && state.data.length > 0) {

        if (saveScan(state.data, mainWindow)) {
            const state = {
                'stage': 'initial',
                'data': []
            }
            setState(state)
        }
    } else {
        dialog.showMessageBoxSync(mainWindow, {
            message: 'Nothing to save!',
            type: 'info',
            buttons: ['OK'],
            defaultId: 0,
            title: 'Save Scan Data'
        })
    }

}

// open file function for check menu
const openFile = () => {

    // check if unsaved state
    let state = getState()


    if (state.stage === 'unsaved' && state.data.length > 0) {
        const ans = dialog.showMessageBoxSync(mainWindow, {
            message: 'Save previous changes before opening a file?',
            type: 'question',
            buttons: ['Save', 'Open Without Saving'],
            title: 'Save Data Before Open',
            cancelId: 2
        })

        if (ans === 0) {
            if (saveScan(state.data, mainWindow)) {
                const state = {
                    'stage': 'initial',
                    'data': []
                }
                setState(state)
            }
        }
        if (ans === 1) {
            const state = {
                'stage': 'initial',
                'data': []
            }
            setState(state)
        }
    }

    // show file open dialog allowing only json file
    const file = dialog.showOpenDialogSync(mainWindow, {
        title: 'Select Scan Data',
        defaultPath: normalize(app.getPath('documents')),
        filters: [
            { name: 'JSON file', extensions: ['json'] }
        ],
        properties: ['openFile']
    })

    if (file) {
        // read json file
        let data = readFileSync(file[0], 'utf8')
        data = JSON.parse(data)

        // verify file
        if (verifyFile(data)) {
            // set state and title
            let newState = {
                'stage': 'initial',
                'data': data
            }
            setState(newState)
            console.log(getState())
            mainWindow.setTitle(`${mainWindowTitle} [${file[0]}]`)

            // load
            mainWindow.webContents.send('main:load', data)
        } else {
            const reply = dialog.showMessageBoxSync(mainWindow, {
                message: 'The file is of incorrect format.',
                type: 'error',
                buttons: ['Open New File', 'OK'],
                defaultId: 1,
                title: 'Incorrect Format'
            })

            if (reply === 0) openFile()
        }
    }
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
    const dir = dialog.showOpenDialogSync(scanWindow, {
        title: 'Select Folder to Scan',
        defaultPath: normalize(app.getPath('pictures')),
        properties: ['openDirectory']
    })

    if (dir) {
        scanWindow.webContents.send('scan:add', {
            number: item,
            dir: dir[0]
        })
    }
}


// save scan result locally
const saveScan = (m, win) => {
    const time = new Date()
    const fName = `duplicates_${time.getFullYear()}${time.getMonth()}${time.getDate()}_${time.getHours()}${time.getMinutes()}.json`
    const saveToDir = dialog.showSaveDialogSync(win, {
        title: 'Save Scan Data',
        defaultPath: normalize(`${app.getPath('documents')}/${fName}`),
        filters: [
            { name: 'JSON file', extensions: ['json'] }
        ]
    })

    if (saveToDir) {
        console.log(saveToDir)
        writeFileSync(saveToDir, JSON.stringify(m, null, 4))
        return true
    } else {
        console.log('not saved')
        return false
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

    // check if unsaved state
    let state = getState()

    if (state.stage === 'unsaved' && state.data.length > 0) {
        const ans = dialog.showMessageBoxSync(scanWindow, {
            message: 'Save previous changes before new scan?',
            type: 'question',
            buttons: ['Save', 'Scan Without Saving'],
            title: 'Save Data Before Scan',
            cancelId: 2
        })

        if (ans === 0) {
            if (saveScan(state.data, scanWindow)) {
                const state = {
                    'stage': 'initial',
                    'data': []
                }
                setState(state)
            }
        }
        if (ans === 1) {
            const state = {
                'stage': 'initial',
                'data': []
            }
            setState(state)
        }
    }

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
            buttons: ['Check Now', 'Save Scan Data'],
            title: 'Scan Result',
            cancelId: 2,
            detail: 'Check Now: check the duplicate images manually now\nSave Scan Data: save the scan results to check manually in the app later'
        })

        if (butIndex === 0) {
            // check now
            let newState = {
                'stage': 'unsaved',
                'data': matches
            }
            setState(newState)

            scanWindow.close()
            mainWindow.webContents.send('main:load', matches)
            console.log('check now')
        } else if (butIndex === 1) {
            // save matches in a file for later
            if (saveScan(matches, scanWindow)) {
                const tmp = {
                    'stage': 'initial',
                    'data': []
                }
                setState(tmp)
                scanWindow.close()
            }
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
ipcMain.on('main:delete', (e, obj) => {
    const url = obj.currentUrl
    const delIndex = dialog.showMessageBoxSync(mainWindow, {
        message: `Delete '${url}'?`,
        type: 'question',
        buttons: ['No', 'Move to Recycle Bin/Trash', 'Delete Permanently'],
        title: 'Delete Image',
        cancelId: 0,
    })

    if (delIndex === 1) moveToBin(url)
    if (delIndex === 2) unlinkSync(url)
    if (delIndex !== 0) {

        // update state
        let state = getState()
        let urls = state.data[obj.currentIndex].urls
        urls = urls.filter(urlItem => urlItem.path !== url)
        state.data[obj.currentIndex].urls = urls

        // if no path for current file, remove that file from data
        if (urls.length === 0) {
            state.data.splice(obj.currentIndex, 1)
        }

        state.stage = 'unsaved'
        console.log(state)
        setState(state)

        // main:deleted
        mainWindow.webContents.send('main:deleted', state)
    }
})


// save before app close
const saveBeforeClose = () => {
    const ans = dialog.showMessageBoxSync(mainWindow, {
        message: 'Save data before exit?',
        type: 'question',
        buttons: ['Save', 'Exit Without Saving'],
        title: 'Save Data Before Exit',
        cancelId: 2
    })

    if (ans === 0) {
        const tmp = getState().data
        if (saveScan(tmp, mainWindow)) {
            const state = {
                'stage': 'initial',
                'data': []
            }
            setState(state)
            mainWindow.close()
        }
    }
    if (ans === 1) {
        const state = {
            'stage': 'initial',
            'data': []
        }
        setState(state)
        mainWindow.close()
    }
}

// exports
module.exports = {
    openFile,
    sendMain,
    sendScan,
    saveBeforeClose,
    saveScanMenu
}