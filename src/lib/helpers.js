export function generateRandomID() {
    return (
        Date.now().toString(36) + Math.random().toString(36).substring(2)
    );
}

export const capitalizeFirstLetter = (word) =>
    word.charAt(0).toUpperCase() + word.slice(1);

export let po = {
    "A4-L": {
        actualWidth: 1123,
        actualHeight: 794,
        containerWidth: 842,
        containerHeight: 595,
        fontSize: 1
    },
    "A4-P": {
        actualWidth: 794,
        actualHeight: 1123,
        containerWidth: 595,
        containerHeight: 842,
        fontSize: 0.708
    },
    "USL-L": {
        actualWidth: 1056,
        actualHeight: 816,
        containerWidth: 792,
        containerHeight: 612,
        fontSize: 1
    },
    "USL-P": {
        actualWidth: 816,
        actualHeight: 1056,
        containerWidth: 612,
        containerHeight: 792,
        fontSize: 0.773
    },
};

export function moveItem(items, from, to) {
    // remove `from` item and store it
    var f = items.splice(from, 1)[0];
    // insert stored item into position `to`
    items.splice(to, 0, f);
    return items;
}

export function cloneDeep(obj) {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }

    if (Array.isArray(obj)) {
        let arrCopy = [];
        obj.forEach((v, i) => arrCopy[i] = cloneDeep(v));
        return arrCopy;
    }

    if (typeof obj === 'object') {
        let objCopy = {};
        for (let key in obj) {
            if (obj.hasOwnProperty(key)) {
                objCopy[key] = cloneDeep(obj[key]);
            }
        }
        return objCopy;
    }

    throw new Error('Unable to copy object: object type not supported.');
}