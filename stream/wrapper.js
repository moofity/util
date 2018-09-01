'use strict';

const OriginalStream = require('stream').Stream;
const { Readable,
        Writable,
        Transform,
        Duplex,
        PassThrough } = require('stream');

function trait(parent) {
    return {
        pipe(stream, ...args) {
            stream.on('_error', err => stream.emit('error', err));
            this.on('error', err => stream.emit('_error', err));

            return parent.prototype.pipe.call(this, stream, ...args);
        }
    };
}

class Stream extends OriginalStream {}
Object.assign(Stream.prototype, trait(Stream));

class ReadableStream extends Readable {}
Object.assign(ReadableStream.prototype, trait(Readable));

class WritableStream extends Writable {}
Object.assign(WritableStream.prototype, trait(Writable));

class TransformStream extends Transform {}
Object.assign(TransformStream.prototype, trait(Transform));

class DuplexStream extends Duplex {}
Object.assign(DuplexStream.prototype, trait(Duplex));

class PassThroughStream extends PassThrough {}
Object.assign(PassThroughStream.prototype, trait(PassThrough));

module.exports = {
    Stream,
    ReadableStream,
    WritableStream,
    TransformStream,
    DuplexStream,
    PassThroughStream
};
