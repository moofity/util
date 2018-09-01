const pg = require('pg');
const Cursor = require('pg-cursor');
const crypto = require('crypto');
const QueryStream = require('../stream/query');
const TypeChecker = require('paramcheck').TypeChecker;
const debug = require('debug')('DatabaseWrapper');

class Database {

    constructor(databaseNumber, pgConnection) {
        this._databaseNumber = databaseNumber;
        this._pgConnection = pgConnection;
    }

    getConnection(level = 0) {
        return this._pgConnection(this._databaseNumber, level);
    }

    insert(table, cols, row, level = 0) {
        const values = [];
        const parts = [];

        for (let j = 0; j < cols.length; j++) {
            values.push(row[j]);
            parts.push(`\$${values.length}`);
        }

        return this.query(`INSERT INTO ${table} ("${cols.join('","')}") VALUES (${parts.join(',')})`, values, level);
    }

    batchInsert(table, cols, rows, level = 0) {
        if (rows.length) {
            const values = [];
            const frags = [];

            for (let i = 0; i < rows.length; i++) {
                const row = rows[i];
                const parts = [];

                for (let j = 0; j < cols.length; j++) {
                    /* null and numbers are not parametrized: there is no danger of sql injection, and the number of
                     * parameters in a single query is already at its limit with the batch size we use for events */
                    if (TypeChecker.isNull(row[j]) || TypeChecker.isUndefined(row[j])) {
                        parts.push('NULL');
                    } else if (TypeChecker.isNumber(row[j])) {
                        parts.push(`${row[j]}`);
                    } else {
                        values.push(row[j]);
                        parts.push(`\$${values.length}`);
                    }
                }

                frags.push(`(${parts.join(',')})`);
            }
            const sql = `INSERT INTO ${table} ("${cols.join('","')}") VALUES ${frags.join(',')}`;
            return this.query(sql, values, level);
        }

        return Promise.resolve(true);
    }

    query(text, values = [], level = 0) {
        const conn = this.getConnection(level);
        let query;
        let queryNum;
        let args;

        if (TypeChecker.isObject(text)) {
            args = text;
        } else {
            args = { text, values };
        }

        const p = new Promise((resolve, reject) => {
            queryNum = crypto.randomBytes(4).toString('hex');
            debug(`Query (#${queryNum}): Executing on user database #${this._databaseNumber} level ${level}`);
            debug(`Query (#${queryNum}): ${text}`);

            query = conn.query(
                args,
                (err, result) => {
                    if (err) {
                        debug(`Query (#${queryNum}): Failed with error:`, err);
                        reject(err);
                    } else {
                        debug(`Query (#${queryNum}): Succeeded`);
                        resolve(result);
                    }
                }
            );
        });

        p.abort = () => query && pg.cancel(conn.connectionParameters, conn, query);

        return p;
    }

    queryStream(sql, values, level = 0) {
        const cursor = new Cursor(sql, values);
        const conn = this.getConnection(level);

        debug(`Query: Executing on user database #${this._databaseNumber} level ${level}`);
        debug(`Query: ${sql}`);

        conn.query(cursor);

        return new QueryStream(cursor);
    }

    beginTransaction(level = 0) {
        return this.query('BEGIN', [], level);
    }

    commitTransaction(level = 0) {
        return this.query('COMMIT', [], level);
    }

    rollbackTransaction(level = 0) {
        return this.query('ROLLBACK', [], level);
    }

}

module.exports = Database;
