const picname = document.getElementById('picname')
const scanButton = document.getElementById('scan')
const openButton = document.getElementById('open')
const quitButton = document.getElementById('quit')



window.api.receive('home:username', (username) => {
    picname.innerHTML = `Hello, ${username}!`
})

scanButton.addEventListener('click', () => {
    window.api.send('home:scan', '')
})

openButton.addEventListener('click', () => {
    window.api.send('home:open', '')
})

quitButton.addEventListener('click', () => {
    window.api.send('home:quit', '')
})
