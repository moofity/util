'use strict';

const { TransformStream } = require('./wrapper');

class ResolveStream extends TransformStream {
    constructor(concurrent = 0) {
        super({ objectMode: true, highWaterMark: concurrent });
    }

    _transform(data, _, cb) {
        if (typeof data === 'object' && typeof data.then === 'function') {
            data.then(
                batch => cb(null, batch),
                err => cb(err));
        } else {
            cb(null, data);
        }
    }
}

module.exports = ResolveStream;
