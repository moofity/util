'use strict';

const { TransformStream } = require('./wrapper');

class EachChunkStream extends TransformStream {
    constructor(callback) {
        super({ objectMode: true, highWaterMark: 0 });

        this.__callback = callback;
        this.__index = 0;
    }

    _transform(data, _, cb) {
        try {
            data.forEach(d => this.__callback(d, this.__index++));
        } catch (err) {
            console.log(err.stack);
            cb(err);
            return;
        }
        cb(null, data);
    }
}

module.exports = EachChunkStream;
