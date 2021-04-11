'use strict'

// nodes
const sidebar = document.getElementById('sidebar')
const pic = document.getElementById('pic')
const picname = document.getElementById('picname')
const deleteButton = document.getElementById('delete')



// global variables
let matches = null
let currentIndex = null
let currentUrl = null
let currentFileUrl = null



// clear sidebar
const clearSidebar = () => {
    while (sidebar.firstChild) {
        sidebar.firstChild.remove()
    }
}



// load pic and filename in box
const loadPic = () => {

    if (currentFileUrl !== null) {
        const img = document.createElement('img')
        img.src = currentFileUrl
        pic.appendChild(img)
        picname.innerHTML = currentUrl

    } else {

        if (pic.firstChild) {
            pic.firstChild.remove()
            picname.innerHTML = ''
        }
    }
}



// reset current values
const resetCurrent = () => {
    currentUrl = null
    currentFileUrl = null
    currentIndex = null
}



// check if image exists
const checkCurrent = (node) => {
    window.api.send('main:checkExistence', node)
}



// set current values
const setCurrent = (node) => {
    currentFileUrl = node.matchesFileURL
    currentUrl = node.matchesPath
    currentIndex = node.matchesIndex
}



// remove url node from sidebar
const removeUrlNode = (url) => {
    const targetParent = document.querySelector(`.match-${currentIndex}`)
    const targetUrls = targetParent.querySelectorAll('.url')

    for (const node of targetUrls) {
        if (node.matchesPath === url) node.remove()
    }
}



// generate sidebar element
const genSidebarElement = (match, i) => {
    const div = document.createElement('div')
    div.className = `match match-${i}`
    div.matchesIndex = i

    const p = document.createElement('p')
    p.className = 'basename'
    p.innerHTML = match.basename
    div.appendChild(p)

    match.urls.forEach(urlItem => {
        const pInner = document.createElement('p')
        pInner.className = 'url'
        pInner.innerHTML = urlItem.path
        pInner.matchesIndex = i
        pInner.matchesPath = urlItem.path
        pInner.matchesFileURL = urlItem.fileURL

        pInner.addEventListener('click', e => {
            resetCurrent()
            loadPic()
            checkCurrent(e.currentTarget)
        })
        div.appendChild(pInner)
    })
    sidebar.appendChild(div)
}



// load matches data in sidebar
const loadSidebar = (m) => {
    matches = m
    clearSidebar()

    m.forEach((match, i) => genSidebarElement(match, i))
}



// main:load
window.api.receive('main:load', (matchs) => {
    loadSidebar(matchs)
})



// main:delete
deleteButton.addEventListener('click', () => {
    if (currentUrl !== null) {
        window.api.send('main:delete', { currentUrl, currentIndex })
    }
})



// main:deleted
window.api.receive('main:deleted', state => {
    loadSidebar(state.data)
    resetCurrent()
    loadPic()
})



// main:notExists
window.api.receive('main:notExists', url => {
    // say the url does not exist
    // ask if remove from data and sidebar
    // do what user says
})



// main:exists
window.api.receive('main:exists', node => {
    setCurrent(node)
    loadPic()
})
