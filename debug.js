'use strict';

const debug = require('debug');

class TraceableLog {
    constructor(source) {
        this._sequence = 0;
        this._source = source || 'unknown';
    }

    log(...args) {
        console.log(`TraceableLog->log Log from transaction: <${this._source}> #${(this._sequence++)}:`, args);
    }

    static create(source) {
        return new TraceableLog(source);
    }
}

module.exports = (serviceName) => {
    const log = debug(`${serviceName}:log`);
    const error = debug(`${serviceName}:error`);
    log.log = console.log.bind(console);
    return { log, error, traceableLogFactory: TraceableLog };
};
