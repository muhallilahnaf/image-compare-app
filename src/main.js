const { app } = require('electron')
const { createMainWindow } = require('./main/mainWindow')

// SET ENV
process.env.NODE_ENV = 'development'


// application user model ID for windows
app.setAppUserModelId('imageCompare')


// Listen for app to be ready
app.on('ready', createMainWindow)
