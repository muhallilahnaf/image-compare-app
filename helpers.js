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

module.exports = {
    findDups,
    extensions
}