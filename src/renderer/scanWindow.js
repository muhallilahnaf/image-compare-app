'use strict'

// nodes
const form = document.getElementById('form-dir')
const plus = document.getElementById('plus')
const scan = document.getElementById('scan')
const controlFolder = document.getElementById('option-folder')
const controlFile = document.getElementById('option-file')
const controlFolderTexts = controlFolder.querySelectorAll('p')
const controlFileTexts = controlFile.querySelectorAll('p')
const extensions = document.querySelectorAll('#extensions span')



// global variables
let intervalId
let isHash = false
let isRecursive = false



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

    if (len + 1 === 4) plus.style.display = 'none'
})



// event listener for file option
controlFile.querySelector('input').addEventListener('change', () => {

    for (const node of controlFileTexts) {
        node.classList.toggle('selected')
    }

    isHash = !isHash
})



// event listener for folder option
controlFolder.querySelector('input').addEventListener('change', () => {

    for (const node of controlFolderTexts) {
        node.classList.toggle('selected')
    }

    isRecursive = !isRecursive
})



// toggle extensions
for (const extension of extensions) {
    extension.addEventListener('click', () => {
        extension.classList.toggle('selected')
    })
}



// get directories
const getDirs = () => {
    const elements = document.getElementsByClassName('dir-name')
    let dirs = []

    for (const ele of elements) {
        dirs.push(ele.value)
    }

    return dirs
}



// set scan button animation
const setScanAnimation = () => {
    let i = 1
    intervalId = setInterval(() => {
        scan.innerHTML = `Scanning${'.'.repeat(i)}`
        i === 3 ? i = 1 : i++
    }, 500);
}



const getSelections = () => {
    const selectedExt = document.querySelectorAll('#extensions .selected')
    let ext = []

    for (const node of selectedExt) {

        if (node.id === 'jpeg') ext.push('jpg', 'jpeg')
        if (node.id === 'tiff') ext.push('tif', 'tiff')
        if (node.id !== 'jpeg' && node.id !== 'tiff') ext.push(node.id)
    }

    return {
        isHash,
        isRecursive,
        ext
    }
}


// send data to main
const sendDataToMain = () => {
    const selections = getSelections()
    const dirs = getDirs()

    const data = {
        selections,
        dirs
    }
    window.api.send('scan:start', data)
}


// event listener for scan button
scan.addEventListener('click', (e) => {
    sendDataToMain()
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
