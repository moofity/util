'use strict';

const crypto = require('crypto');
const path = require('path');

let self = {
    /**
     *
     * @param params {Object}
     * @param params.protocol {string}
     * @param params.username {string}
     * @param params.password {string}
     * @param params.host {string|number}
     * @param params.port {string|number}
     * @param [params.database] {string|number}
     * @return {string}
     */
    buildConnectionString(params) {
        let parts = `${params.protocol}://`;
        if (params.username.length > 0 || params.password.length > 0) {
            parts += `${params.username}:${params.password}@`;
        }
        parts += `${params.host}:${params.port}${params.database ? `/${params.database}` : ''}`;
        return parts;
    },
    /**
     *
     * @param string {string}
     * @return {{}}
     */
    parseConnectionString(string) {
        let params = {};
        let parts = string.split('://');
        params.protocol = parts[0];
        if (string.includes('@')) {
            let [credentials, path] = parts[1].split('@');
            let [username, password] = credentials.split(':');
            params.username = username;
            params.password = password;
            parts[1] = path;
        }
        parts = parts[1].split(':');
        params.host = parts[0];
        parts = parts[1].split('/');
        params.port = parts[0];
        params.database = parts[1];
        return params;
    },
    /**
     *
     * @param workerId {string | number}
     * @param object {Object}
     * @return {Array<string>}
     */
    buildLaunchParamsFromObject(workerId, object) {
        let params = [];
        Object.keys(object).forEach((key) => {
            params.push(`${key}=${object[key]}`);
        });
        params.push(`workerId=${workerId}`);
        return params;
    },
    getRequestBody(body) {
        let keys;
        try {
            keys = Object.keys(body);
            if (keys.length < 50) {
                return keys;
            }
            throw new Error('too many keys');
        } catch (e) {
            try {
                return {
                    length: (keys ? keys.length : body.length)
                };
            } catch (e2) {
                return null;
            }
        }
    },
    getUserIdFromSession(session) {
        return session && session.user && session.user.id;
    },
    getRequestDetails(req) {
        let headers = JSON.parse(JSON.stringify(req.headers));
        delete headers['x-trx-auth'];

        return {
            url: req.url,
            query: req.query,
            body: self.getRequestBody(req.body),
            userAgent: req.header['user-agent'],
            origin: req.header.origin,
            method: req.method,
            headers,
            correlationID: (req.header['x-correlationid'])
        };
    },

    makePassword(v) {
        let salt = 'j_}26S86Z}7}ZGC$+*(4%?W10+r*=%>!"5^#Y/q';
        return crypto.createHash('sha1').update(v + salt).digest('hex');
    },

    collectRuntimeParams() {
        let params = {};
        for (let i = 2; i < process.argv.length; i++) {
            let key = process.argv[i].split('=')[0];
            params[key] = process.argv[i].split('=')[1];
        }
        return params;
    },

    parseCookie(cookie = '') {
        let ret = {};
        let keys = cookie.split(' ');
        keys.forEach(key => {
            key = key.split(/=|;/g);
            ret[key[0]] = key[1];
        });
        return ret;
    },

    computeEtagsForPropsFunctor(attrs) {
        return function (instance) {
            let row;
            if (typeof instance.get === 'function') {
                row = instance.get();
            } else {
                row = instance;
            }
            let etags = row.etags || {};
            attrs.forEach((attribute) => {
                if (row.hasOwnProperty(attribute)) {
                    etags[attribute] = self.makePassword(JSON.stringify(row[attribute]));
                }
            });
            row.etags = etags;
            if (typeof instance.set === 'function') {
                instance.set(row);
            }
        };
    },

    getServiceDirname(name) {
        return path.join(__dirname.substr(0, __dirname.lastIndexOf('trx_util') - 1), `srv_${name}`);
    }
};

module.exports = self;
