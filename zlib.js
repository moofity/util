'use strict';

const zlib = require('zlib');

module.exports = {
    gzip(...params) {
        return new Promise((resolve, reject) => {
            zlib.gzip(...params, (err, buffer) => {
                if (err) {
                    reject(buffer);
                } else {
                    resolve(buffer);
                }
            });
        });
    },
    deflate(...params) {
        return new Promise((resolve, reject) => {
            zlib.deflate(...params, (err, buffer) => {
                if (err) {
                    reject(buffer);
                } else {
                    resolve(buffer);
                }
            });
        });
    },
    // this handles both deflate and gzip
    unzip(...params) {
        return new Promise((resolve, reject) => {
            zlib.unzip(...params, (err, buffer) => {
                if (err) {
                    reject(buffer);
                } else {
                    resolve(buffer);
                }
            });
        });
    }
};
