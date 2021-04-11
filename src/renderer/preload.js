// SO answer for doing this (tl;dr security purpose):
// https://stackoverflow.com/a/59888788/13846480 

const { ipcRenderer, contextBridge } = require('electron')

contextBridge.exposeInMainWorld('api', {
    send: (channel, data) => {
        // whitelist channels
        let validChannels = [
            'scan:add',
            'scan:start',
            'main:delete',
            'main:checkExistence',
            'home:scan',
            'home:open',
            'home:save',
            'home:quit'
        ]

        if (validChannels.includes(channel)) {
            ipcRenderer.send(channel, data)
        }
    },
    receive: (channel, func) => {
        let validChannels = [
            'scan:add',
            'scan:finish',
            'main:load',
            'main:deleted',
            'main:exists',
            'main:notExists',
            'home:username'
        ]

        if (validChannels.includes(channel)) {
            ipcRenderer.on(channel, (e, ...args) => {
                func(...args)
            })
        }
    }
})
