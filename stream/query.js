'use strict';

const { ReadableStream } = require('./wrapper');

class QueryStream extends ReadableStream {
    // If the batch is too large, processing the whole batch (and blocking the event loop) takes too much time
    // It is a problem when we abort the worker: if the event loop is blocked, the abort can't be performed
    constructor(cursor, batch = 5000) {
        super({ objectMode: true, highWaterMark: 0 });

        this._batchSize = batch;
        this._cursor = cursor;
        this._pending = null;
    }

    _queryNextBatch() {
        return new Promise((resolve, reject) => {
            this._cursor.read(this._batchSize, (err, rows) => {
                if (err) {
                    console.error(err.stack);
                    this._cursor.close(() => reject(err));
                } else if (rows.length) {
                    resolve(rows);
                } else {
                    this._cursor.close(() => resolve(null));
                }
            });
        });
    }

    _read() {
        if (this._pending == null) {
            this._pending = this._queryNextBatch();
        }

        this._pending.then(buff => {
            this._pending = this._queryNextBatch();

            this.push(buff);
        }, err => this.emit('error', err));
    }
}

module.exports = QueryStream;
