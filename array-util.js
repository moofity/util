'use strict';

class ArrayUtil {

    constructor(array) {
        this.array = array || [];
    }

    indexBy(keyMapper, valueMapper) {
        let result = {};
        this.array.forEach(item => {
            result[keyMapper(item)] = valueMapper ? valueMapper(item) : item;
        });
        return result;
    }

    groupBy(keyMapper, valueMapper) {
        let result = {};
        this.array.forEach(item => {
            let key = keyMapper(item);
            let value = valueMapper ? valueMapper(item) : item;
            if (result[key] == null) {
                result[key] = [];
            }
            result[key].push(value);
        });
        return result;
    }

    //  Fisher-Yates Shuffle
    shuffle() {
        let counter = this.array.length;
        let temp;
        let index;

        // console.log('shuffle array of', array.length);

        // While there are elements in the array
        while (counter > 0) {
            // Pick a random index
            index = Math.floor(Math.random() * counter);

            // Decrease counter by 1
            counter--;

            // And swap the last element with it
            temp = this.array[counter];
            this.array[counter] = this.array[index];
            this.array[index] = temp;
        }

        // console.log('shuffled array of', array.length);

        return this.array;
    }

    count(param) {
        let count = 0;
        for (let i = 0; i < this.array.length; i++) {
            if (this.array[i] === param) count++;
        }
        return count;
    }

    argsort() {
        let indexes = Array.from({ length: this.array.length }, (v, i) => i);
        indexes.sort((a, b) => this.array[a] - this.array[b]);
        return indexes;
    }
}

module.exports = array => new ArrayUtil(array);
