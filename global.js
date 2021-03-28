let state = {
    'stage': 'initial',
    'data': []
}

// during delete : change data and unsaved *
// before main close : check if unsaved *
// before open : check if unsaved
// before scan : check if unsaved *
// after scan : after save initial, check now load data & unsaved *
// 

const setState = (newState) => {
    state = newState
}

const getState = () => state

module.exports = {
    setState,
    getState
}