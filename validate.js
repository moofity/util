'use strict';

/**
 *
 * @param obj
 * @param schema
 * @return {[*,*]}
 */
function validate(obj, schema) {
    const errors = [];
    let value;

    if (obj == null && !schema.required) {
        return [schema.default, errors];
    } else if (schema.required && obj == null) {
        errors.push('required');
    } else if (schema.type) {
        switch (schema.type) {
            case 'Number':
                value = parseFloat(obj);

                if (isNaN(value))
                    errors.push('not a number');
                break;
            case 'Boolean':
                switch (typeof obj) {
                    case 'number': value = Boolean(obj); break;
                    case 'boolean': value = obj; break;
                    case 'string': {
                        const lcval = obj.toLowerCase();

                        if (~['true', 'false', ''].indexOf(lcval)) {
                            value = lcval === 'true';
                        } else {
                            errors.push('not a boolean');
                        }

                        break;
                    }

                    default: errors.push('not a boolean');
                }
                break;

            case 'String':
                if (~['number', 'boolean', 'string'].indexOf(typeof obj))
                    value = String(obj);
                else
                    errors.push('not a string');
                break;

            case 'Enum': {
                if (typeof obj !== 'string') {
                    errors.push('not a enum');
                } else if (schema.variants.indexOf(obj) === -1) {
                    errors.push(`wrong enum variant, expected one of [${schema.variants.join(', ')}]`);
                } else {
                    value = obj;
                }

                break;
            }

            case 'Object': {
                if (typeof obj !== 'object') {
                    errors.push('not an object');
                } else {
                    if (schema.properties) {
                        const keys = Object.keys(schema.properties);
                        value = {};

                        for (let i = 0; i < keys.length; i++) {
                            const key = keys[i];

                            const [val, errs] = validate(obj[key], schema.properties[key]);
                            if (val != null) value[key] = val;

                            errors.push(...errs.map(i => `${key}: ${i}`));
                        }
                    } else {
                        value = obj;
                    }
                }

                break;
            }

            case 'Array': {
                if (!Array.isArray(obj)) {
                    errors.push('not an array');
                } else {
                    if (schema.items) {
                        value = [];

                        for (let i = 0; i < obj.length; i++) {
                            const item = obj[i];
                            const [val, errs] = validate(item, schema.items);

                            if (val != null) value[i] = val;

                            errors.push(...errs.map(j => `${i}: ${j}`));
                        }
                    } else {
                        value = obj;
                    }
                }

                break;
            }

            case 'DateTime':
                if (obj instanceof Date && !isNaN(obj.valueOf())) {
                    value = obj;
                } else if (typeof obj === 'string') {
                    const tmp = Date.parse(obj);

                    if (isNaN(tmp)) {
                        errors.push('wrong date format');
                    } else {
                        value = new Date(tmp);
                    }
                } else {
                    errors.push('not a string');
                }

                break;

            default:
                break;
        }
    }

    return [value, errors];
}

module.exports = validate;
