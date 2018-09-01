'use strict';

function isEmptyAttributeValue(value) {
    return value == null || value === '';
}

function toCamelCase(type) {
    if (type == null) return;
    if (!type.includes('-') && !type.includes('_')) return type;
    type = type.toLowerCase().replace(/[\-_\s]+(.)?/g, (match, chr) => (chr ? chr.toUpperCase() : ''));
    return type.substr(0, 1).toLowerCase() + type.substr(1);
}

function asyncForEach(items, onStep) {
    return new Promise((resolve, reject) => {
        let i = 0;
        next();

        function next() {
            if (i >= items.length) {
                resolve();
                return;
            }

            onStep(items[i], i).then(() => {
                i++;
                next();
            }, reject);
        }
    });
}

module.exports = {
    isEmptyAttributeValue,
    toCamelCase,
    asyncForEach
};
