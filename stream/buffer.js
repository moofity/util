'use strict';

const {TransformStream} = require('./wrapper');

class BufferStream extends TransformStream {
    constructor(size=100, objectMode=false) {
        super({ objectMode, highWaterMark: 0 });

        this.__objectMode = objectMode;
        this.__size = size;
        this.__buffer = [];
    }

    _transform(data, _, cb) {
        try {
            this.__buffer.push(this.__objectMode ? data : Buffer.from(data));

            if (this.__buffer.length >= this.__size) {
                this.__flushBuffer();
            }

            cb();
        } catch (err) {
            console.log(err.stack);
            cb(err);
        }
    }

    _flush(cb) {
        if (this.__buffer.length) {
            this.__flushBuffer();
        }

        cb();
    }

    __flushBuffer() {
        if (this.__objectMode) {
            this.push(Buffer.concat(this.__buffer));
        } else {
            for (let i = 0; i < this.__buffer.length; i++) {
                this.push(this.__buffer[i]);
            }
        }

        this.__buffer = [];
    }
}

module.exports = BufferStream;
