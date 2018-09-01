'use strict';

const { TransformStream } = require('./wrapper');

class MapChunkStream extends TransformStream {
    constructor(callback) {
        super({ objectMode: true, highWaterMark: 0 });

        this.__callback = callback;
        this.__index = 0;
    }

    _transform(data, _, cb) {
        let result = [];
        try {
            result = data.map(d => this.__callback(d, this.__index++));
        } catch (err) {
            console.log(err.stack);
            cb(err);
            return;
        }
        cb(null, result);
    }
}

module.exports = MapChunkStream;
