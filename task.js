'use strict';

/**
 * Task is analog for 'co' library, but it can be terminated or aborted
 * 
 * here is an example:
 * let process = Taks(function*(...args) {
 *    _ try {
 *   |      yield longOperation();
 *   |      yield anotherLongOperation();
 *   A      yield* anotherLongProcess();
 *   |      ...
 *   |_     yield oneMoreLongOpearion();
 *    _ } catch (error) {
 *   |      yield setError();
 *   B      yield setErrorStatus();
 *   |_     ...
 *    _ } finally {
 *   |      yield cleanupTemporaryTables();
 *   C      yield cleanupRedisRecords();
 *   |_     ...
 *      }
 * });
 * 
 * process.start(...args); // executing section A
 * 
 * ...
 * ... 
 * 
 * ... // and then
 * process.abort(); // leaving section A going directly into C
 * ... // or
 * process.error(new Error("Some error happened!")); // leaving section A entering into B and then into C
 * 
 */

const co = require('co');

function isGenerator(obj) {
    return typeof obj.next === 'function' && typeof obj.throw === 'function';
}

function isGeneratorFunction(obj) {
    let constructor = obj.constructor;
    if (!constructor) return false;
    if ('GeneratorFunction' === constructor.name || 'GeneratorFunction' === constructor.displayName) return true;
    return isGenerator(constructor.prototype);
}

class Task {
    constructor(gen) {
        this._gen = gen;
        this._error = null;

        this._next = this._next.bind(this);
        this._fail = this._fail.bind(this);
    }

    start(...args) {
        this._iter = this._gen(...args);

        let promise = new Promise((resolve, reject) => {
            this._resolve = resolve;
            this._reject = reject;
        });

        this._next();

        return promise;
    }

    abort(symbol) {
        this._abort = {symbol};
        this._handleNext(this._iter.return());
    }

    error(error) {
        this._error = {error};
        this._handleNext(this._iter.throw(error));
    }

    _handle({value, done}) {
        if (done) {
            return Promise.resolve(value);
        } else {
            return co(value).then(this._next, this._fail);
        }
    }

    _next(res) {
        return this._handleNext(this._iter.next(res));
    }

    _handleNext(res) {
        return this._handle(res)
            .then(value => {
                    if (this._error) {
                        this._reject(this._error.error);
                    } else if (this._abort) {
                        this._resolve(this._abort.symbol);
                    } else {
                        this._resolve(value);
                    }
                }, 
                this._reject);
    }

    _fail(err) {
        throw err;
    }
}

module.exports = Task;