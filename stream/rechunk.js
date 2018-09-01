'use strict';

const {TransformStream} = require('./wrapper');

class RechunkStream extends TransformStream {
    constructor(chunkSize) {
        super({ objectMode: true, highWaterMark: 0 });

        this.__chunkSize = chunkSize;
        this.__buffer = [];
    }

    _transform(chunk, _, cb) {
        chunk.forEach(item => {
            this.__buffer.push(item);
        });

        if (this.__buffer.length < this.__chunkSize) {
            cb();
        } else {
            cb(null, this.__buffer.splice(0));
        }
    }

    _flush(cb) {
        if (this.__buffer.length) {
            this.push(this.__buffer)
        }

        cb();
    }
}

module.exports = RechunkStream;
