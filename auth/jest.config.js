/**
 * Jest configuration for the auth service.
 *
 * Coverage is collected from the application source. A few files are excluded:
 *  - src/index.js          : process bootstrap (started in Docker/k8s, not unit-tested)
 *  - src/persistence/mysql.js : the production driver; the SQLite driver is the
 *    one exercised by the test suite. MySQL is validated via compose/k8s.
 */
module.exports = {
    // Generous timeout so the integration suite (db.init runs migrations) also
    // passes inside the Docker `test` stage when the image is cross-built for
    // linux/amd64 on an arm64 host, where qemu emulation is ~10x slower than
    // native. The default 5000ms is too tight for the beforeAll hooks there.
    testTimeout: 60000,
    collectCoverageFrom: [
        'src/**/*.js',
        '!src/index.js',
        '!src/persistence/mysql.js',
        '!src/migrations/**',
        // Infra wrappers exercised via compose/k8s, not unit tests (like mysql.js).
        '!src/cache.js',
        '!src/bus.js',
    ],
    coverageThreshold: {
        global: {
            statements: 75,
            branches: 65,
            functions: 75,
            lines: 75,
        },
    },
};
