'use strict';


exports.toNumber = function (param) {
    if (param === undefined || param === 'undefined') return;
    if (param === null || param === '' || param === 'null') return null;

    let value = Number(param);
    if (Number.isNaN(value) || !isFinite(value)) {
        throw new Error(`Invalid number query parameter:${param}`);
    }
    return value;
};

exports.toBoolean = function (param) {
    if (param === undefined) return;
    if (param == null || param === '') return null;

    return param === 'true' || param === 'TRUE';
};

exports.removeNonWordChars = function (str) {
    // \W - Matches any non-word character. Equivalent to [^A-Za-z0-9_].
    // @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions
    return str.replace(/\W+/g, '');
};
