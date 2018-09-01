'use strict';

class Matrix {
    /**
     * Create a matrix
     * @param width {number}
     * @param [height] {number}
     * @returns {Matrix}
     */
    constructor(width, height) {
        this.width = width;
        this.height = height || width;

        this._ = new Array(this.width);
        for (let i = 0; i < this.width; i++) {
            this._[i] = new Array(this.height);
        }
    }

    /**
     * Fill matrix with values or apply function for each element
     * @param param {Function|any}
     * @return {Matrix}
     */
    fill(param) {
        if (typeof param === 'function') {
            this._fillWithFunction(param);
        } else {
            this._fillWithValue(param);
        }
        return this;
    }

    _fillWithValue(value) {
        for (let i = 0; i < this.width; i++) {
            this._[i].fill(value);
        }
    }

    _fillWithFunction(func) {
        for (let i = 0; i < this.width; i++) {
            for (let j = 0; j < this.height; j++) {
                this._[i][j] = func.call(null, i, j);
            }
        }
    }

    /**
     * Apply function for each element in matrix
     * @param callback {Function}
     * @return {Matrix}
     */
    each(callback) {
        for (let i = 0; i < this.width; i++) {
            for (let j = 0; j < this.height; j++) {
                callback.call(null, this._[i][j], i, j);
            }
        }
        return this;
    }

    /**
     * Replace each element of matrix with value returned from callback. Return new Matrix instance.
     * @param callback {Function}
     * @return {Matrix}
     */
    map(callback) {
        let result = new Matrix(this.width, this.height);
        for (let i = 0; i < this.width; i++) {
            for (let j = 0; j < this.height; j++) {
                result._[i][j] = callback.call(null, this._[i][j], i, j);
            }
        }
        return result;
    }

    /**
     * Set value for diagonal
     * @param value
     * @return {Matrix}
     */
    diagonal(value) {
        let size = Math.min(this.width, this.height);
        for (let i = 0; i < size; i++) {
            this._[i][i] = value;
        }
        return this;
    }

    /**
     * Return matrix row
     * @param index {number}
     * @return {Array}
     */
    getRow(index) {
        let column = Array.from({ length: this.width });
        for (let i = 0; i < this.width; i++) {
            column[i] = this._[i][index];
        }
        return column;
    }

    static iterateUpperTriangle(size, callback) {
        for (let i = 1; i < size; i++) {
            for (let j = 0; j < i; j++) {
                callback.call(null, i, j);
            }
        }
    }

    transpose() {
        let result = new Matrix(this.height, this.width);
        for (let i = 0; i < this.width; i++) {
            for (let j = 0; j < this.height; j++) {
                result._[i][j] = this._[j][i];
            }
        }
        return result;
    }

    // for debugging
    // misleading that what are called 'columns' here are displayed as rows on the console
    print() {
        return this._.map((column, i) => i + ': ' + column.map(value => value % 1 === 0 ? value : value.toFixed(2))
            .join(', ')).join('\n');
    }
}

module.exports = Matrix;
