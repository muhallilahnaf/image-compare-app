// global variables
let mainWindow
let scanWindow

let mainWindowTitle = 'image comparison tool'

const initialState = { 'stage': 'initial', 'data': [] }

let state = initialState


// get-set
const getState = () => state
const setState = (newState) => state = newState

const getMainWindow = () => mainWindow
const setMainWindow = (newMainWindow) => mainWindow = newMainWindow

const getScanWindow = () => scanWindow
const setScanWindow = (newScanWindow) => scanWindow = newScanWindow

const getMainWindowTitle = () => mainWindowTitle
const setMainWindowTitle = (newMainWindowTitle) => mainWindowTitle = newMainWindowTitle


// export
module.exports = {
    getState,
    setState,
    getMainWindow,
    setMainWindow,
    getScanWindow,
    setScanWindow,
    getMainWindowTitle,
    setMainWindowTitle,
    initialState
}
