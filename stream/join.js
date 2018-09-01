'use strict';

const { TransformStream } = require('./wrapper');

class JoinStream extends TransformStream {
    constructor(separator) {
        super({ objectMode: true, highWaterMark: 0 });

        this.__separator = separator;
        this.__firstSent = false;
    }

    _transform(data, _, cb) {
        if (!this.__firstSent) {
            this.__firstSent = true;
        } else {
            this.push(typeof this.__separator === 'function' ? this.__separator() : this.__separator);
        }

        cb(null, data);
    }
}

module.exports = JoinStream;
