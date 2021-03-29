const { pathToFileURL } = require('url')

// function to remove duplicate file strings
// eg. ' - Copy' or '({number})' etc.
const processfName = (f) => {
    // const fName = basename(f)
    return f.replace(/\(\d+\)/, '').replace(/ - Copy/, '')
}


// function to find duplicates from a sorted array
// in: sorted array to find duplicates from
// out: array of objects containing duplicates
const findDups = (dict) => {
    const len = Object.keys(dict).length

    let matches = []
    let processedDict = {}

    if (len === 0) return matches

    for (const [file, urlArr] of Object.entries(dict)) {
        const processedFile = processfName(file)

        if (typeof processedDict[processedFile] === 'undefined') {
            processedDict[processedFile] = urlArr
        } else {
            processedDict[processedFile] = [...processedDict[processedFile], ...urlArr]
        }
    }

    for (const [file, urlArr] of Object.entries(processedDict)) {

        if (urlArr.length > 1) {
            let newUrlArr = []

            urlArr.forEach(url => {
                newUrlArr.push({
                    'path': url,
                    'fileURL': pathToFileURL(url).href
                })
            })

            matches.push({ 'basename': file, 'urls': newUrlArr })
        }
    }

    return matches
}


// image file extensions
const extensions = ['jpeg', 'jpg', 'png', 'gif', 'tif', 'tiff', 'bmp']


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


// exports
module.exports = {
    findDups,
    extensions,
    verifyFile
}