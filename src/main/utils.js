const { dialog, app } = require('electron')
const { readFileSync, writeFileSync, readdirSync, statSync, unlinkSync } = require('fs')
const { normalize } = require('path')
const trash = require('trash')
const { findDups } = require('./scan')
const { getState, setState, extensions, getMainWindow, getScanWindow, initialState, getMainWindowTitle } = require('../global')



// get unsaved state
const getUnsavedState = () => {

    const state = getState()
    if (state.stage === 'unsaved' && state.data.length > 0) return state
    return null
}



// move image to recycle bin/trash
const moveToBin = async (url) => {
    await trash(url)
}



// generate current timestamp
const getTimestamp = () => {

    const time = new Date()
    return `${time.getFullYear()}${time.getMonth() + 1}${time.getDate()}_${time.getHours()}${time.getMinutes()}`
}



// save scan dialog
const saveScanDialog = (window, filename) => {

    return dialog.showSaveDialogSync(window, {
        title: 'Save Scan Data',
        defaultPath: normalize(`${app.getPath('documents')}/${filename}`),
        filters: [
            { name: 'JSON file', extensions: ['json'] }
        ]
    })
}



// save scan result locally
const saveScan = (data, window) => {

    const fName = `duplicates_${getTimestamp()}.json`

    const dir = saveScanDialog(window, fName)

    if (dir) {
        writeFileSync(dir, JSON.stringify(data, null, 4))
        return true
    }
    return false
}



// save scan result from menu
const saveScanFromMenu = () => {

    const mainWindow = getMainWindow()
    let state = getUnsavedState()

    if (state && saveScan(state.data, mainWindow)) {
        setState(initialState)
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



// ask to save and save if yes
const askToSave = (win, data, msg, stage) => {

    const ans = dialog.showMessageBoxSync(win, {
        message: msg,
        type: 'question',
        buttons: ['Save', `${stage} Without Saving`],
        title: `Save Data Before ${stage}`,
        cancelId: 2
    })

    if (ans === 0 && saveScan(data, win)) {
        setState(initialState)

        if (stage === 'Exit') win.close()
    }
    if (ans === 1) {
        setState(initialState)

        if (stage === 'Exit') win.close()
    }
}



// check if state has unsaved data on main window close
const beforeMainWindowClose = (e) => {

    const state = getUnsavedState()

    if (state) {
        e.preventDefault()
        const mainWindow = getMainWindow()
        const msg = 'Save data before exit?'
        askToSave(mainWindow, state.data, msg, 'Exit')
    }
}



// show file open dialog allowing only json file
const openFileJSON = (window) => {

    return dialog.showOpenDialogSync(window, {
        title: 'Select Scan Data',
        defaultPath: normalize(app.getPath('documents')),
        filters: [
            { name: 'JSON file', extensions: ['json'] }
        ],
        properties: ['openFile']
    })
}



// set new file data and title
const setDataAndTitle = (data, window, filename) => {

    let newState = {
        'stage': 'initial',
        'data': data
    }
    setState(newState)
    window.setTitle(`${getMainWindowTitle()} [${filename}]`)

    window.webContents.send('main:load', data)
}



// verify file data before load
const verifyFile = (data) => {
    if (!Array.isArray(data)) {
        console.log('data not array')
        return false
    }

    for (const item of data) {

        if (typeof item !== 'object') {
            console.log('item not object')
            return false
        }
        if (!item.basename || !item.urls) {
            console.log('basename or urls not exist')
            return false
        }
        if (typeof item.basename !== 'string') {
            console.log('basename not string')
            return false
        }
        if (!Array.isArray(item.urls)) {
            console.log('urls not array')
            return false
        }

        for (const dir of item.urls) {

            if (typeof dir !== 'object') {
                console.log('dir not object')
                return false
            }
            if (!dir.path || !dir.fileURL) {
                console.log('path or fileurl not exist')
                return false
            }
            if (typeof dir.path !== 'string' || typeof dir.fileURL !== 'string') {
                console.log('path or fileurl not string')

                return false
            }
        }
    }
    return true
}



// read and open file
const readAndOpenFile = (file, window) => {

    let data = readFileSync(file[0], 'utf8')
    data = JSON.parse(data)

    if (verifyFile(data)) {

        setDataAndTitle(data, window, file[0])
    } else {
        const reply = dialog.showMessageBoxSync(window, {
            message: 'The file is of incorrect format.',
            type: 'error',
            buttons: ['Open New File', 'OK'],
            defaultId: 1,
            title: 'Incorrect Format'
        })

        if (reply === 0) openFile()
    }
}



// open scan file from menu
const openFile = () => {

    const mainWindow = getMainWindow()
    const state = getUnsavedState()

    if (state) {
        const msg = 'Save previous changes before opening a file?'
        askToSave(mainWindow, state.data, msg, 'Open')
    }

    const file = openFileJSON(mainWindow)

    if (file) readAndOpenFile(file, mainWindow)
}



// ipc main on scan:add
const ipcMainScanAdd = (e, item) => {

    const scanWindow = getScanWindow()

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



// update state after delete
const updateStateOnDelete = (obj, url) => {
    let state = getState()
    let urls = state.data[obj.currentIndex].urls
    urls = urls.filter(urlItem => urlItem.path !== url)
    state.data[obj.currentIndex].urls = urls

    if (urls.length === 0) {
        state.data.splice(obj.currentIndex, 1)
    }

    state.stage = 'unsaved'
    setState(state)
}



// ipc main on main:delete
const ipcMainMainDelete = (e, obj) => {

    const mainWindow = getMainWindow()
    const url = obj.currentUrl

    const ans = dialog.showMessageBoxSync(mainWindow, {
        message: `Delete '${url}'?`,
        type: 'question',
        buttons: ['No', 'Move to Recycle Bin/Trash', 'Delete Permanently'],
        title: 'Delete Image',
        cancelId: 0,
    })

    if (ans === 1) moveToBin(url)
    if (ans === 2) unlinkSync(url)
    if (ans !== 0) {
        updateStateOnDelete(obj, url)
        mainWindow.webContents.send('main:deleted', getState())
    }
}



// scan image files and create a dictionary
const scanImages = (dirList) => {

    let fileDict = {}

    // add to fileDict variable
    const addToFileDict = (file, url) => {
        if (typeof fileDict[file] === 'undefined') {
            fileDict[file] = [url]
        } else if (!fileDict[file].includes(url)) {
            fileDict[file].push(url)
        }
    }

    // scan dirs recursively and identify files and folders
    const scanDir = (dir) => {
        const items = readdirSync(dir)

        items.forEach(item => {
            const fullItem = normalize(`${dir}/${item}`)
            try {
                const stats = statSync(fullItem)

                if (stats.isFile()) {
                    const ext = item.substring(item.lastIndexOf('.') + 1)

                    if (extensions.some(e => e.toLowerCase() == ext)) addToFileDict(item, fullItem)

                } else if (stats.isDirectory()) {
                    scanDir(normalize(fullItem))
                }
            } catch (err) { console.log(err) }
        })
    }

    dirList.forEach(dir => scanDir(dir))

    return fileDict
}



// alert that no duplicates found
const alertDupsNotFound = (window) => {
    const ans = dialog.showMessageBoxSync(window, {
        message: 'No duplicates found.',
        type: 'info',
        buttons: ['OK'],
        title: 'Scan Result'
    })

    if (ans === 0) window.close()
}



// alert that duplicates found
const alertDupsFound = (window, len) => {
    return dialog.showMessageBoxSync(window, {
        message: `${len} duplicate(s) found.`,
        type: 'question',
        buttons: ['Check Now', 'Save Scan Data'],
        title: 'Scan Result',
        cancelId: 2,
        detail: 'Check Now: check the duplicate images manually now\nSave Scan Data: save the scan results to check manually in the app later'
    })
}



// ipc main on scan:start
const ipcMainScanStart = (e, dirs) => {

    const state = getUnsavedState()
    const scanWindow = getScanWindow()

    if (state) {
        const msg = 'Save previous changes before new scan?'
        askToSave(scanWindow, state.data, msg, 'Scan')
    }

    const dirList = dirs.filter(dir => dir != '')

    const fileDict = scanImages(dirList)

    const matches = findDups(fileDict)

    scanWindow.webContents.send('scan:finish', 'finished')

    if (matches.length) {
        const ans = alertDupsFound(scanWindow, matches.length)

        if (ans === 0) {
            const newState = {
                'stage': 'unsaved',
                'data': matches
            }
            setState(newState)

            scanWindow.close()

            const mainWindow = getMainWindow()
            mainWindow.webContents.send('main:load', matches)

        } else if (ans === 1 && saveScan(matches, scanWindow)) {
            setState(initialState)
            scanWindow.close()
        }

    } else alertDupsNotFound(scanWindow)
}



// export
module.exports = {
    saveScanFromMenu,
    openFile,
    beforeMainWindowClose,
    ipcMainMainDelete,
    ipcMainScanAdd,
    ipcMainScanStart
}
