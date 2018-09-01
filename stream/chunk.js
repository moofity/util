'use strict';

const { TransformStream } = require('./wrapper');

class ChunkStream extends TransformStream {
    constructor(chunkSize) {
        super({ objectMode: true, highWaterMark: 0 });

        this.__chunkSize = chunkSize;
        this.__buffer = [];
    }

    _transform(chunk, _, cb) {
        this.__buffer.push(chunk);

        if (this.__buffer.length < this.__chunkSize) {
            cb();
        } else {
            cb(null, this.__buffer.splice(0));
        }
    }

    _flush(cb) {
        if (this.__buffer.length) {
            this.push(this.__buffer);
        }

        cb();
    }
}

module.exports = ChunkStream;
