module.exports = (server) => {

    'use strict';
    const queue = require('cache').instance;
    const db = require('database').instance;

    function cleanup() {
        console.log('Closing HTTP server...');
        server.close(() => {
            queue.close();
            db.close();
            process.exit(0);
        });
    }

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
};
