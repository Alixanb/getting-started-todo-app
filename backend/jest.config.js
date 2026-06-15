/**
 * Jest configuration.
 *
 * Coverage is collected from the application source. A few files are excluded:
 *  - src/index.js          : process bootstrap (started in Docker/k8s, not unit-tested)
 *  - src/persistence/mysql.js : the production driver; the SQLite driver is the
 *    one exercised by the test suite. MySQL is validated via compose/k8s.
 *
 * Thresholds fail the build (in CI, run inside Docker where the sqlite3 binding
 * compiles and the integration tests actually execute).
 */
module.exports = {
    collectCoverageFrom: [
        'src/**/*.js',
        '!src/index.js',
        '!src/persistence/mysql.js',
        '!src/migrations/**',
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
