'use strict'

// nodes
const form = document.getElementById('form-dir')
const plus = document.getElementById('plus')
const scan = document.getElementById('scan')



// global variables
let intervalId



// event listener for first add folder button
document.getElementsByClassName('add-dir')[0].addEventListener('click', (e) => {
    e.preventDefault()
    const targetNo = /\d/.exec(e.target.className)
    window.api.send('scan:add', targetNo)
})



// generate directory element
const genAddDir = (len) => {
    const div = document.createElement('div')
    div.className = 'directory'

    const button = document.createElement('button')
    button.className = `add-dir add-${len + 1}`
    button.innerHTML = 'Add Folder'
    button.addEventListener('click', (e) => {
        e.preventDefault()
        const targetNo = /\d/.exec(e.target.className)
        window.api.send('scan:add', targetNo)
    })

    const input = document.createElement('input')
    input.setAttribute('type', 'text')
    input.setAttribute('readonly', 'true')
    input.className = `dir-name name-${len + 1}`

    div.appendChild(button)
    div.appendChild(input)

    return div
}



// event listener for plus button
plus.addEventListener('click', (e) => {
    e.preventDefault()
    const len = document.getElementsByClassName('add-dir').length

    const div = genAddDir(len)
    form.insertBefore(div, form.lastElementChild)

    if (len + 1 === 5) plus.style.display = 'none'
})



// send dirs to main process
const sendDirsToMain = () => {
    const elements = document.getElementsByClassName('dir-name')
    let dirs = []

    for (const ele of elements) {
        dirs.push(ele.value)
    }

    window.api.send('scan:start', dirs)
}



// set scan button animation
const setScanAnimation = () => {
    let i = 1
    intervalId = setInterval(() => {
        scan.innerHTML = `Scanning${'.'.repeat(i)}`
        i === 3 ? i = 1 : i++
    }, 500);
}



// event listener for scan button
scan.addEventListener('click', (e) => {
    sendDirsToMain()
    scan.setAttribute('disabled', 'true')
    setScanAnimation()
})



// receive info from main for scan:add
window.api.receive('scan:add', (data) => {
    document.querySelector(`.name-${data.number}`).value = data.dir
})



// receive info from main for scan:finish
window.api.receive('scan:finish', (data) => {
    clearInterval(intervalId)
    scan.removeAttribute('disabled')
    scan.innerHTML = 'Scan'
})
