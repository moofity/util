'use strict';
const { PassThroughStream } = require('./stream/wrapper');
const { IterableStream, IterableArrayStream } = require('./stream/iterable');
const MapStream = require('./stream/map');
const EachStream = require('./stream/each');
const FilterStream = require('./stream/filter');
const ResolveStream = require('./stream/resolve');
const ChunkStream = require('./stream/chunk');
const BufferStream = require('./stream/buffer');
const JoinStream = require('./stream/join');
const MapChunkStream = require('./stream/map-chunk');
const EachChunkStream = require('./stream/each-chunk');
const RechunkStream = require('./stream/rechunk');

const zlib = require('zlib');

const { jsonToString } = require('./stream/utils');

const su = {
    isStream(stream) {
        return stream !== null && typeof stream === 'object' && typeof stream.pipe === 'function';
    },

    isWritable(stream) {
        return this.isStream(stream) && typeof stream.write === 'function';
    },

    isReadable(stream) {
        return this.isStream(stream) && typeof stream.read === 'function';
    },

    gzip() {
        return zlib.createGzip();
    },

    deflate() {
        return zlib.createDeflate();
    },

    wait(stream) {
        const isWriteStream = this.isWritable(stream) && !this.isReadable(stream);

        return new Promise((resolve, reject) => {
            stream.on('error', err => reject(err));
            stream.on(isWriteStream ? 'finish' : 'end', data => resolve(data));
        });
    },

    dump(stream) {
        const isWriteStream = this.isWritable(stream) && !this.isReadable(stream);
        const data = [];

        return new Promise((resolve, reject) => {
            stream.on('data', chunk => data.push(chunk));
            stream.on('error', err => reject(err));
            stream.on(isWriteStream ? 'finish' : 'end', () => resolve(data));
        });
    },

    dumpChunk(stream) {
        const isWriteStream = this.isWritable(stream) && !this.isReadable(stream);
        const data = [];

        return new Promise((resolve, reject) => {
            stream.on('data', chunk => data.push(...chunk));
            stream.on('error', err => reject(err));
            stream.on(isWriteStream ? 'finish' : 'end', () => resolve(data));
        });
    },

    map(map) {
        return new MapStream(map);
    },

    each(cb) {
        return new EachStream(cb);
    },

    resolve(concurrent = Infinity) {
        return new ResolveStream(concurrent);
    },

    filter(callback) {
        return new FilterStream(callback);
    },

    join(separator) {
        return new JoinStream(separator);
    },

    chunk(size) {
        return new ChunkStream(size);
    },

    buffer(size) {
        return new BufferStream(size);
    },

    bytes(callback) {
        let counter = 0;
        const proxy = new PassThroughStream();

        proxy.on('data', chunk => (counter += Buffer.byteLength(chunk)));
        proxy.on('end', callback(counter));

        return proxy;
    },

    wrap(processor, state, callback = () => {}) {
        const proxy = new PassThroughStream();

        proxy.on('data', item => processor.process(state, item));
        proxy.on('end', item => callback(processor.end(state, item)));

        return proxy;
    },

    iter(iterator) {
        return new IterableStream(iterator);
    },

    iterArr(iterator, chunkSize) {
        return new IterableArrayStream(iterator, chunkSize);
    },

    JSON: {
        stringify(data) {
            return su.iter(jsonToString(data));
        }
    },

    mapChunk(callback) {
        return new MapChunkStream(callback);
    },

    eachChunk(callback) {
        return new EachChunkStream(callback);
    },

    rechunk(chunkSize) {
        return new RechunkStream(chunkSize);
    }
};

module.exports = su;
