'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const expect = chai.expect;
const sinon = require('sinon');

chai.use(chaiHttp);

// |==========================================
// |            Assertion Helpers
// |==========================================

const statusAndTextAssertions = (status, text) => {
    return function (res) {
        expect(res).to.have.status(status);
        expect(res).to.have.property('text', text);
    };
};

const goodCaseAssertion = (res) => {
    expect(res).to.have.status(200);
};

// |==========================================
// |           Middleware mocks
// |==========================================

const rateLimiterMock = () => {
    return function * (next) {
        yield next;
    };
};

function getSessionMiddlewareMock(user) {
    return function (app) {
        return function * (next) {
            Object.defineProperties(app.context, {
                session: {
                    get() { return { user }; },
                    set(val) {},
                }
            });
            yield next;
        };
    };
}

// |==========================================
// |            Controller mocks
// |==========================================

function* mockControllerAction(ctx) {
    ctx.status = 200;
}

// |==========================================
// |               Other mocks
// |==========================================

const redisClientMock = {
    set() { return this; },
    exec(cb) { cb(null, [true]); }
};

const redisMock = {
    get: () => Promise.resolve(),
    set: () => Promise.resolve(),
    del: () => Promise.resolve(),
    keys: () => Promise.resolve([]),
    rpush: () => Promise.resolve(),
    client: {
        watch: (inp, cb) => cb(null),
        mget: (inp, cb) => cb(null, []),
        multi: () => redisClientMock,
        on: () => {}
    }
};

const basicInjectorConfigMock = {
    UserDatabaseProvider: {
        value: { getDatabase: sinon.spy() },
        type: 'constant'
    }
};

const loggerServiceMock = {
    log: sinon.spy()
};

// |==========================================
// |                Hepers
// |==========================================

function getServerUrl(port) {
    return `http://localhost:${port}`;
}

function getStartServerAndTestRequestFn(port) {
    if (process.env.NODE_ENV === 'test' && process.env.API_TESTS_PORT) {
        port = process.env.API_TESTS_PORT;
    }

    return async function startServerAndTestRequest(server, httpMethod, path, assertion, cb) {
        try {
            const app = await server.listen(port);
            chai
                .request(getServerUrl(port))
                [httpMethod](path)
                .then(assertion)
                .then(() => app.close(() => cb()))
                .catch(err => app.close(() => cb(err)));
        } catch (err) {
            console.error(err);
            cb(err);
        }
    };
}

// |==========================================
// |                Exports
// |==========================================

module.exports = {
    mockControllerAction,
    getServerUrl,
    getSessionMiddlewareMock,
    sessionMiddlewareMock: getSessionMiddlewareMock({
        email: 'some@name.com'
    }),
    rateLimiterMock,
    getStartServerAndTestRequestFn,
    redisMock,
    loggerServiceMock,
    basicInjectorConfigMock,
    statusAndTextAssertions,
    goodCaseAssertion
};
