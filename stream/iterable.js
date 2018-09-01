'use strict';

const { ReadableStream } = require('./wrapper');

class IterableStream extends ReadableStream {
    constructor(iter) {
        super({ objectMode: true, highWaterMark: 0 });

        this.__iter = iter;
    }

    _chunk(size) {
        const array = [];

        let length = 0;
        let iter = this.__iter.next();

        while (length < size) {
            if (!iter.done) {
                length += iter.value.length;
                array.push(iter.value);
            }

            iter = this.__iter.next();

            if (iter.done) {
                break;
            }
        }

        return { value: array.join(''), done: iter.done };
    }

    _read() {
        while (true) {
            const iter = this._chunk(1024 * 1024);

            if (iter.done) {
                if (iter.value) {
                    this.push(iter.value);
                }

                this.push(null);
                break;
            } else {
                if (!this.push(iter.value)) {
                    break;
                }
            }
        }
    }
}

class IterableArrayStream extends IterableStream {
    constructor(array, chunkSize) {
        super({ objectMode: true, highWaterMark: 0 });
        this.chunkSize = chunkSize;
        this.array = array;
    }

    _chunk() {
        const value = this.array.splice(0, this.chunkSize);
        return { value, done: !this.array.length };
    }
}

module.exports = { IterableStream, IterableArrayStream };
