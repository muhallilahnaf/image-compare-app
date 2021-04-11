
// find duplicates from scanned data
const findDups = async (dict) => {

    const { pathToFileURL } = require('url')
    const { statSync } = require('fs')
    const { basename } = require('path')
    const Jimp = require('jimp')

    const fileDict = dict.fileDict
    const sizeArr = dict.sizeArr

    const lenFile = Object.keys(fileDict).length
    const lenSize = sizeArr.length

    let matches = []
    let removePaths = []

    if (lenFile === 0) return matches

    for (const [file, urlArr] of Object.entries(fileDict)) {

        if (urlArr.length > 1) {
            let newUrlArr = []

            urlArr.forEach(url => {
                newUrlArr.push({
                    path: url,
                    fileURL: pathToFileURL(url).href
                })
                removePaths.push(url)
            })

            matches.push({ basename: file, urls: newUrlArr })
        }
    }

    if (lenSize === 0) return matches

    const checkSizeArr = sizeArr.filter(url => !removePaths.includes(url))

    let sizeDict = {}

    checkSizeArr.forEach(url => {

        const size = statSync(url).size.toString()

        if (typeof sizeDict[size] === 'undefined') {
            sizeDict[size] = [url]

        } else if (!sizeDict[size].includes(url)) {
            sizeDict[size].push(url)
        }
    })

    let hashMatchPromises = []

    for (const [size, urlArr] of Object.entries(sizeDict)) {

        if (urlArr.length > 1) {

            const hashArr = await Promise.all(urlArr.map(async (url) => {

                const image = await Jimp.read(url)

                return {
                    url,
                    hash: await image.pHash()
                }

            }))

            const hashLen = hashArr.length

            for (let i = 0; i < hashLen; i++) {

                for (let j = i + 1; j < hashLen; j++) {

                    if (Jimp.compareHashes(hashArr[i].hash, hashArr[j].hash) < 0.15) {

                        if (hashMatchPromises.length === 0) {

                            hashMatchPromises.push(
                                new Set()
                                    .add(hashArr[i].url)
                                    .add(hashArr[j].url)
                            )
                        } else {
                            let included = false
                            for (const set of hashMatchPromises) {

                                if (set.has(hashArr[i].url)) {

                                    set.add(hashArr[j].url)
                                    included = true
                                    break
                                }

                                if (set.has(hashArr[j].url)) {

                                    set.add(hashArr[i].url)
                                    included = true
                                    break
                                }
                            }

                            if (!included) {

                                hashMatchPromises.push(
                                    new Set()
                                        .add(hashArr[i].url)
                                        .add(hashArr[j].url)
                                )
                            }
                        }

                    }
                }
            }
        }
    }

    const hashMatches = await Promise.all(hashMatchPromises)

    const newMatches = hashMatches.map(set => {

        let newUrlArr = []

        for (const url of set) {

            newUrlArr.push({
                path: url,
                fileURL: pathToFileURL(url).href
            })
        }

        return { basename: basename(newUrlArr[0].path), urls: newUrlArr }
    })

    return [...matches, ...newMatches]
}



// export
module.exports = {
    findDups
}
