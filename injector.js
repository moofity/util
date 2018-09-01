'use strict';

function check(condition, message) {
    if (!condition) {
        throw new Error(message || 'Dependency injection error');
    }
}

const CONSTR_ARGS = /^class\s+[^]*\s+constructor\(\s*([^\)]*)\)/m;
const FN_ARG = /^\s*(_?)(.+?)\1\s*$/;
const STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;


class Injector {

    constructor(typesByName) {
        this._instances = {};
        if (typesByName) this.addAll(typesByName);
    }

    get(name) {
        return this._instances[name];
    }

    addInstance(name, instance) {
        check(this._instances[name] == null, `Instance with name ${name} already registered`);
        this._instances[name] = instance;
    }

    add(name, type) {
        check(this._instances[name] == null, `Instance with name ${name} already registered`);
        let inputParams = this._getInputParams(type);
        this._instances[name] = new type(...inputParams); // eslint-disable-line new-cap
        return this._instances[name];
    }

    _getInputParams(type) {
        let inputParams = [];

        let argCount = this._getArgumentCount(type);
        let injectCount = type.$inject ? type.$inject.length : 0;
        check(injectCount === argCount,
            `Incorrect number of $inject parameters for type ${type.name}, expected ${argCount}, found ${injectCount}`);

        if (type.$inject) {
            type.$inject.forEach(inputName => {
                check(this._instances[inputName] != null, `Can't find injectable ${inputName} for type ${type.name}`);
                inputParams.push(this._instances[inputName]);
            });
        }
        return inputParams;
    }

    addAll(typesByName) {
        let order = this._getTopologicalOrder(typesByName);

        order.forEach(name => {
            this.add(name, typesByName[name]);
        });
    }

    _getTopologicalOrder(typesByName) {
        let order = [];
        let unvisited = Object.keys(typesByName);
        let status = {};

        while (unvisited.length > 0) {
            let name = unvisited[0];
            this._buildTopologicalOrder(name, typesByName, [], order, unvisited, status);
        }
        return order;
    }

    _buildTopologicalOrder(name, typesByName, stack, order, unvisited, status) {
        if (this._instances[name] != null) return;
        if (typesByName[name] == null) throw new Error(`Can't find injectable ${name} for type ${stack.pop()}`);

        let type = typesByName[name];
        if (status[name] == null) {
            stack.push(name);
            status[name] = 'VISITED';
            if (type.$inject) {
                type.$inject.forEach(inputName => {
                    this._buildTopologicalOrder(inputName, typesByName, stack, order, unvisited, status);
                });
            }
            stack.pop();
            order.push(name);
            unvisited.splice(unvisited.indexOf(name), 1);
            status[name] = 'PROCESSED';
        } else if (status[name] === 'VISITED') {
            throw new Error(`Circle in dependency graph: ${stack}, ${name}`);
        }
    }

    _getArgumentCount(type) {
        let argNames = [];
        let fnText = type.toString().replace(STRIP_COMMENTS, '');

        let argDecl = fnText.match(CONSTR_ARGS);
        if (argDecl == null) return 0;

        argDecl[1].split(',').forEach(arg => {
            arg.replace(FN_ARG, (all, underscore, name) => {
                argNames.push(name);
            });
        });
        return argNames.length;
    }
}

module.exports = Injector;
