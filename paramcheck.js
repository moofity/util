'use strict';

let TError = require('./error');
const toString = Object.prototype.toString;

class ParamCheck {

    static check(condition, errorMessage) {
        if (!condition) {
            throw new TError(TError.codes.ILLEGAL_ARGUMENT, errorMessage);
        }
    }

    static exists(param, errorMessage) {
        if (param === undefined || param === null) {
            throw new TError(TError.codes.ILLEGAL_ARGUMENT, errorMessage);
        }
    }
}

class TypeChecker {

    static isString(obj) {
        return toString.call(obj) === '[object String]';
    }

    static isFunction(obj) {
        return toString.call(obj) === '[object Function]';
    }

    static isDate(obj) {
        return toString.call(obj) === '[object Date]';
    }

    static isRegExp(obj) {
        return toString.call(obj) === '[object RegExp]';
    }

    static isBoolean(obj) {
        return toString.call(obj) === '[object Boolean]';
    }

    static isError(obj) {
        return toString.call(obj) === '[object Error]';
    }

    static isObject(obj) {
        return toString.call(obj) === '[object Object]';
    }

    static isNumber(obj) {
        return toString.call(obj) === '[object Number]' && !isNaN(obj);
    }

    static isArray(obj) {
        return Array.isArray ? Array.isArray(obj) : toString.call(obj) === '[object Array]';
    }

    static isNull(obj) {
        return obj === null;
    }

    static isUndefined(obj) {
        return obj === void 0;
    }

    static exists(obj) {
        return !TypeChecker.isUndefined(obj) && !TypeChecker.isNull(obj);
    }

}

module.exports = { ParamCheck, TypeChecker };
