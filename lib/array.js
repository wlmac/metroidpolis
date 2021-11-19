exports.getElementByProperty = (array, targetId, targetValue) => {
    for (var i = 0; i < array.length; i++) {
        if (array[i][targetId] === targetValue) {
            return i;
        }
    }
    return -1;
}