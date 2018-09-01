'use strict';

const { Readable } = require('stream');

module.exports = {
    streamToString(stream) {
        return new Promise((resolve, reject) => {
            let result = '';
            stream.on('data', buffer => {
                result += buffer.toString();
            });
            stream.on('error', err => {
                reject(err);
            });
            stream.on('end', () => {
                resolve(result);
            });
        });
    },
    streamToBuffer(stream) {
        return new Promise((resolve, reject) => {
            const chunks = [];
            stream.on('data', (chunk) => {
                chunks.push(chunk);
            });
            stream.on('error', err => {
                reject(err);
            });
            stream.on('end', () => {
                const data = Buffer.concat(chunks);
                resolve(data);
            });
        });
    },
    stringToStream(content) {
        const stream = new Readable();
        stream.push(content);
        stream.push(null);
        return stream;
    }
};
