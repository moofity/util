'use strict';

const co = require('co');
const debug = require('debug')('injector');
const PENDING = Symbol('PENDING');

class Injector {
    constructor(config, groupped = false) {
        this._config = {};
        this._byTagName = {};
        this._byTagNameOrder = {};
        this._services = { $injector: { instance: this } };
        this._revDepsMap = {};

        if (config) {
            if (groupped) {
                this._loadGrouppedConfig(config);
            } else {
                this._loadConfig(config);
            }
        }
    }

    /**
     * @param {string} serviceName
     * @return {boolean}
     */
    exists(serviceName) {
        return !!(this._config[serviceName] || this._services[serviceName]);
    }

    /**
     * @param {string} serviceName
     * @return {any}
     */
    get(serviceName) {
        return this._get(serviceName, []).instance;
    }

    /**
     * @param {string} serviceName
     * @param {string[]} history
     *
     * @return {any}
     */
    _get(serviceName, history) {
        try {
            const historyWithService = history.concat([serviceName]);

            if (this._services[serviceName] != null) {
                if (this._services[serviceName] === PENDING) {
                    throw new Error(`Circle in dependency graph: ${serviceName} is being required by a dependent, chain: ` +
                        (history ? 'chain: ' + history.join('->') : ''));
                }

                return this._services[serviceName];
            }

            if (!this._config[serviceName]) {
                throw new Error(`Injector: unknown dependency ${serviceName}! ${history ? 'chain: ' + history.join('->') : ''}`);
            } else {
                this._services[serviceName] = PENDING;

                const entry = this._config[serviceName];

                switch (entry.type) {
                    case 'alias':
                        if (entry.target == null) {
                            throw new Error('Injector: alias type require "target" attribute to be set!', entry);
                        }

                        this._services[serviceName] = this._get(entry.target, historyWithService);
                        break;

                    case 'value':
                        const args = this._arguments(null, entry.inject, historyWithService);

                        if (typeof entry.value !== 'function') {
                            throw new Error(`Config ${serviceName}::value expected to be a function!`);
                        }

                        this._setRevDepsMapItems(serviceName, entry.inject);

                        this._services[serviceName] = { 
                            deps: entry.inject,
                            instance: entry.value(...args)
                        };
                        break;

                    case 'constant':
                        this._services[serviceName] = { instance: entry.value };
                        break;

                    case 'provider': {
                        const _class = entry && typeof entry.class === 'function' && entry.class();

                        if (typeof _class !== 'function') {
                            throw new Error(`Provider should have "class" attribute returning real class! (${serviceName}, ${JSON.stringify(entry)})`);
                        }

                        const classInject = this._collectInject(_class);
                        const properties = this._combineProperties(
                            entry.injectProperties, classInject.injectProperties);
                        const args = this._arguments(classInject.inject, entry.inject, historyWithService);
                        const deps = this._collectDependencies(
                                classInject.inject, classInject.injectProperties, entry.inject, entry.injectProperties);
                        
                        this._setRevDepsMapItems(serviceName, deps);
                        
                        this._services[serviceName] = {
                            deps,
                            instance: (...props) => {
                                const inst = entry.static
                                    ? _class[entry.static].apply(_class, args.concat(props))
                                    : new _class(...args, ...props);

                                if (properties) {
                                    this._injectProperties(inst, properties, historyWithService);
                                }

                                return inst;
                            }
                        };

                        break;
                    }

                    case 'factory': {
                        if (entry.method) {
                            let factory;

                            switch (typeof entry.factory) {
                                case 'function':
                                    factory = this._createService(serviceName, entry.factory(), entry, historyWithService);
                                    break;
                                case 'string':
                                    factory = this._get(entry.factory, historyWithService);
                                    break;
                                case 'object':
                                    factory = { instance: entry.factory };
                                    break;
                                default:
                                    throw new Error('Factory-method should have "factory" attribute!', entry);
                            }

                            let { deps, instance } = factory;

                            this._setRevDepsMapItems(serviceName, deps);

                            this._services[serviceName] = {
                                deps,
                                instance: (...args) => instance[entry.method].apply(instance, args)
                            };
                        } else {
                            const _factory = entry && typeof entry.factory === 'function' && entry.factory();

                            if (typeof _factory !== 'function') {
                                throw new Error(`Factory should have "factory" attribute returning function! (${serviceName}, ${JSON.stringify(entry)})`);
                            }

                            const classInject = this._collectInject(_factory);
                            const args = this._arguments(classInject.inject, entry.inject, historyWithService);
                            const deps = this._collectDependencies(classInject.inject, null, entry.inject);

                            this._setRevDepsMapItems(serviceName, deps);

                            this._services[serviceName] = {
                                deps,
                                instance: _factory(...args)
                            };
                        }

                        break;
                    }

                    default:
                    case 'service': {
                        const _class = entry && typeof entry.class === 'function' && entry.class();

                        if (typeof _class !== 'function') {
                            throw new Error(`Service should have "class" attribute returning real class! (${serviceName}, ${JSON.stringify(entry)})`);
                        }

                        this._services[serviceName] = this._createService(serviceName, _class, entry, historyWithService);

                        break;
                    }
                }

                return this._services[serviceName];
            }
        } catch (err) {
            debug(serviceName);
            throw err;
        }
    }

    _getType(serviceName) {
        const entry = this._config[serviceName];

        if (entry) {
            switch (entry.type) {
                case 'alias': return this._getType(entry.target);
                case 'provider': 
                case 'factory': return Function;
                case 'value': return null;
                case 'constant': return (entry.value != null) ? entry.value.contructor : null;
                default: return entry.class()
            }
        }

        return null;
    }

    _setRevDepsMapItems(serviceName, deps) {
        if (Array.isArray(deps)) {
            for (let dep of deps) {
                if (Array.isArray(this._revDepsMap[dep])) {
                    this._revDepsMap[dep].push(serviceName);
                } else {
                    this._revDepsMap[dep] = [serviceName];
                }
            }
        }
    }

    _createService(serviceName, _class, entry, historyWithService) {
        const classInject = this._collectInject(_class);
        const properties = this._combineProperties(entry.injectProperties, classInject.injectProperties);
        const args = this._arguments(classInject.inject, entry.inject, historyWithService);

        let instance;
        let deps = this._collectDependencies(
            classInject.inject,
            classInject.injectProperties,
            entry.inject,
            entry.injectProperties
        );

        if (entry.static) {
            instance = _class[entry.static].apply(_class, args);
        } else {
            instance = new _class(...args);
        }

        if (properties) {
            this._injectProperties(instance, properties, historyWithService);
        }

        this._setRevDepsMapItems(serviceName, deps);

        return { instance, deps };
    }

    constant(key, value) {
        if (this._config[key]) {
            throw new Error(`Injector: Service with name ${key} already exist`);
        }

        this._config[key] = { type: 'constant', value };
    }

    /**
     * @param {string} tagName
     * @param {string[]} history
     * @returns {object}
     */
    getByTag(tagName, history = []) {
        return this._byTagName[tagName] == null ? {} :
            this._byTagName[tagName].reduce((a, i) => {
                a[i] = this._get(i, history).instance;
                return a;
            }, {});
    }

    /**
     * @param {string} tagName
     * @param {string[]} history
     * @returns {any[]}
     */
    getByTagAsArray(tagName, history = []) {
        const result =
            this._byTagName[tagName] == null ? [] :
                this._byTagName[tagName]
                    .map(i => this._get(i, history).instance);

        const map = result.map((item, i) => ({ order: this._byTagNameOrder[tagName][i], item }));
        map.sort((a, b) => a.order - b.order);

        return map.map(x => x.item);
    }

    /**
     * @param {string} tagName
     * @returns {object}
     */
    getTypesByTag(tagName) {
        return this._byTagName[tagName] == null ? {} :
            this._byTagName[tagName].reduce((a, i) => {
                a[i] = this._getType(i);
                return a;
            }, {});
    }

    define(type = 'service', name, entry) {
        entry.type = type;

        this._config[name] = entry;
        this._services[name] = undefined;

        if (Array.isArray(entry.tags)) {
            entry.tags.forEach(tagName => this._attachTag(name, tagName, entry.order));
        } else if (typeof entry.tag === 'string') {
            this._attachTag(name, entry.tag, entry.order);
        }
    }

    defineConstant(name, value) {
        return this.define('constant', name, { value });
    }

    config(config) {
        this._loadConfig(config);
    }

    /**
     * @param {string} dependency
     * @param {boolean} strict
     * @param {string[]} history
     * @returns {*}
     */
    resolve(dependency, strict = false, history = []) {
        const tagRegEx = /^([#@])(.+)$/;

        if (tagRegEx.test(dependency)) {
            const [_, op, name] = tagRegEx.exec(dependency);

            if (op === '#') {
                return this.getByTag(name, history);
            }

            return this.getByTagAsArray(name, history);
        }

        if (strict) {
            return this._get(dependency, history).instance;
        }

        return this.exists(dependency) ? this._get(dependency, history).instance : null;
    }

    destroy() {
        const collectPending = () => {
            const result = [];

            Object.keys(this._services)
                .forEach(name => {
                    const service = this._services[name];

                    if (name !== '$injector' && service
                        && !service.destroing && !service.destroyed) {
                        const { deps, instance } = service;

                        if (deps && deps.length) {
                            for (let i = 0; i < deps.length; i++) {
                                const dep = deps[i];

                                if (dep !== '$injector' && this._services[dep] && !this._services[dep].destroyed) {
                                    return;
                                }
                            }
                        }

                        service.destroing = true;

                        if (typeof instance === 'object' && instance.destroy &&
                            typeof instance.destroy === 'function') {

                            let promise = instance.destroy.constructor.name === 'GeneratorFunction'
                                ? co(instance.destroy())
                                : Promise.resolve(instance.destroy());

                            result.push(promise.then(val => {
                                service.destroing = false;
                                service.destroyed = true;
                                return val;
                            }));
                        } else {
                            service.destroing = false;
                            service.destroyed = true;
                        }
                    }
                });

            return result;
        };

        return co(function* () {
            for (;;) {
                try {
                    const pending = collectPending();

                    if (pending.length) {
                        yield Promise.all(pending);
                    } else {
                        break;
                    }
                } catch (e) {
                    debug(e);
                    break;
                }
            }
        });
    }

    fork() {
        const fork = new Injector();

        fork._config = this._config;
        fork._byTagName = this._byTagName;
        fork._byTagNameOrder = this._byTagNameOrder;

        return fork;
    }

    set(name, value) {
        if (this._services[name]) {
            this._invalidate(name);
        }

        this._services[name] = { instance: value };
    }

    _invalidate(name) {
        if (this._revDepsMap[name]) {
            for (let dep of this._revDepsMap[name]) {
                this._invalidate(dep);
                this._services[dep] = undefined;
            }
        }
    }

    _eval(any, history = []) {
        if (Array.isArray(any)) {
            return any.map(i => this._eval(i, history));
        } else if (any && typeof any === 'object') {
            return Object.keys(any).reduce((a, i) => {
                a[i] = this._eval(any[i], history);
                return a;
            }, {});
        } else if (typeof any === 'string') {
            const resolve = this.resolve(any, false, history);

            return resolve === false ? any : resolve;
        }

        return any;
    }

    _loadGrouppedConfig(config) {
        const cfg = {};

        const add = (type, items) => {
            for (let entry of Object.keys(items)) {
                cfg[entry] = items[entry];
                cfg[entry].type = type;
            }
        };

        for (const group of Object.keys(config)) {
            const items = config[group];

            switch (group) {
                case "services": add('service', items); break;
                case "aliases": add('alias', items); break;
                case "values": add('value', items); break;
                case "constants": add('constant', items); break;
                case "providers": add('provider', items); break;
                case "factories": add('factory', items); break;
                default: throw new Error(`Unknown injector category: ${group}`);
            }
        }

        return this._loadConfig(cfg);
    }

    _loadConfig(config) {
        const eager = [];

        for (let serviceName in config) {
            if (config.hasOwnProperty(serviceName)) {
                const entry = config[serviceName];

                this.define(entry.type, serviceName, entry);

                if (entry.eager) {
                    eager.push(serviceName);
                }
            }
        }

        let name;
        try {
            for (let i = 0; i < eager.length; i++) {
                name = eager[i];
                debug(`Eager initialization of ${name}`);
                this.get(name);
            }
        } catch (err) {
            throw err;
        }
    }

    _injectProperties(instance, properties, history = []) {
        const self = this;

        for (let i in properties) {
            if (properties.hasOwnProperty(i)) {
                const dependency = properties[i];

                if (properties.hasOwnProperty(i)) {
                    Object.defineProperty(instance, i, {
                        get() {
                            if (!instance[`__private_${i}`]) {
                                instance[`__private_${i}`] = self.resolve(dependency, false, history);
                            }

                            return instance[`__private_${i}`];
                        },

                        enumerable: true,
                        configurable: true
                    });
                }
            }
        }
    }

    _collectInject(_class) {
        let injectProperties;
        let inject = [];
        let proto = _class;

        while (proto && proto !== Function.prototype && proto !== Object.prototype) {
            let _inject = proto.$inject;
            let _injectProperties = proto.$injectProperties;

            if (_inject && Array.isArray(_inject)) {
                inject = inject.concat(_inject);
            }

            if (_injectProperties && typeof _injectProperties === 'object') {
                if (!injectProperties) injectProperties = {};

                injectProperties = Object.assign({}, _injectProperties, injectProperties);
            }

            proto = Object.getPrototypeOf(proto);
        }

        return { inject, injectProperties };
    }

    _combineProperties(entry, classInject) {
        return Object.assign({}, entry || {}, classInject || {});
    }

    _collectDependencies(classInject, classInjectProperties, entryInject, entryInjectProperties) {
        const result = classInject.slice();

        const appendDeps = items => {
            for (let i = 0; i < items.length; i++) {
                let item = items[i];

                if (result.indexOf(item) === -1) {
                    result.push(item);
                }
            }
        };

        if (entryInject) {
            appendDeps(Object.keys(entryInject).map(i => entryInject[i]));
        }

        if (classInjectProperties) {
            appendDeps(Object.keys(classInjectProperties).map(i => classInjectProperties[i]));
        }

        if (entryInjectProperties) {
            appendDeps(Object.keys(entryInjectProperties).map(i => entryInjectProperties[i]));
        }

        return result;
    }

    _arguments(_mapping, _override = null, history = []) {
        const mapping = Array.isArray(_mapping) ? _mapping : [];
        const override = Array.isArray(_override) ? _override : [];
        const max = Math.max(mapping.length, override.length);
        const result = [];

        for (let i = 0; i < max; i++) {
            if (override[i]) {
                result[i] = this._eval(override[i], history);
            } else {
                result[i] = this.resolve(mapping[i], true, history);
            }
        }

        return result;
    }

    _attachTag(serviceName, tagName, order = null) {
        if (!this._byTagName[tagName]) {
            this._byTagName[tagName] = [];
            this._byTagNameOrder[tagName] = [];
        }

        this._byTagName[tagName].push(serviceName);
        this._byTagNameOrder[tagName].push(order);
    }
}

module.exports = Injector;
