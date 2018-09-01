'use strict';

const errorResponse = (message, code) =>
    ({
        body: {
            message // 'message key' actually for translation
        },
        status: code
    });

const DBErrors = {
    SequelizeUniqueConstraintError: errorResponse('NAME_ALREADY_EXISTS', 409),
    SequelizeForeignKeyConstraintError: errorResponse('FOREIGN_KEY_CONSTRAINT', 409),
    SequelizeCannotCoerceError: errorResponse('INVALID_TYPE_CAST_ERROR', 400)
};

module.exports = {
    DBErrors
};
