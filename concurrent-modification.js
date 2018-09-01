'use strict';

const Sequelize = require('sequelize');
const TError = require('./error');

function check(options, callback) {
    const { model, where, data, fieldToCompare } = options;
    return model.sequelize.transaction({
        isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED
    }, t => {
        return model.findOne({
            where,
            transaction: t,
            lock: t.LOCK.UPDATE
        }).then(entity => {
            let existingDate = entity[fieldToCompare];
            if (existingDate instanceof Date) { // sometimes the field is a number, not a date
                existingDate = entity[fieldToCompare].toISOString(); // the other field was already converted to ISO by JSON parsing
            }
            // the other field was already converted to ISO by JSON parsing if it was a Date, or it's a number or number string if it was a BIGINT

            if (existingDate != data[fieldToCompare]) {
                throw new TError(TError.codes.CONCURRENT_MODIFICATION, 'Concurrent modification', entity);
            }
            return callback(entity, t);
        });
    });
}

module.exports = {
    check
};
