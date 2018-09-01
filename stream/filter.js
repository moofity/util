'use strict';

const { TransformStream } = require('./wrapper');

class FilterStream extends TransformStream {
    constructor(callback) {
        super({ objectMode: true, highWaterMark: 0 });

        this.__callback = callback;
    }

    _transform(data, _, cb) {
        try {
            if (this.__callback(data)) {
                cb(null, data);
            } else {
                cb();
            }
        } catch (err) {
            cb(err);
        }
    }
}


module.exports = FilterStream;
