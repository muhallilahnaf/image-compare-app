const { app } = require('electron')
const { createMainWindow } = require('./main/mainWindow')

// SET ENV
process.env.NODE_ENV = 'development'


// Listen for app to be ready
app.on('ready', createMainWindow)
