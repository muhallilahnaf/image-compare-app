// function to find duplicates from a sorted array
// in: sorted array to find duplicates from
// out: array of objects containing duplicates
const findDups = (arr) => {
    const len = arr.length
    let matches = []

    if (len === 0 || len === 1) return matches

    let i = 0
    let j = 1

    while (j < len) {

        if (arr[i] !== arr[j]) {
            i++
            arr[i] = arr[j]
            j++
        } else {
            matches.push({
                one: arr[i],
                another: arr[j]
            })
            j++
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