'use strict';

function * jsonToString(item) {
    let flag = false;

    switch (true) {
        case Array.isArray(item):
            yield '[';
            for (let i = 0; i < item.length; i++) {
                const gen = jsonToString(item[i]);

                if (flag) {
                    yield ',';
                } else {
                    flag = true;
                }

                for (let j of gen) {
                    yield j;
                }
            }

            yield ']';
            break;
        case item === null ||
        (typeof item === 'number' && (isNaN(item) || !isFinite(item))):
            yield 'null';
            break;
        case typeof item === 'number':
        case typeof item === 'boolean':
            yield String(item);
            break;

        case typeof item === 'object': {
            yield '{';
            const keys = Object.keys(item);

            for (let i = 0; i < keys.length; i++) {
                const key = keys[i];

                if (typeof item[key] === 'undefined') {
                    continue;
                }

                if (flag) {
                    yield ',';
                } else {
                    flag = true;
                }

                const gen = jsonToString(item[key]);

                yield `${JSON.stringify(key)}:`;

                for (let j of gen) {
                    yield j;
                }
            }

            yield '}';
            break;
        }

        case typeof item === 'string':
            yield JSON.stringify(item);
            break;
        default:
            yield 'null';
            break;

    }
}

module.exports = {
    jsonToString
};
