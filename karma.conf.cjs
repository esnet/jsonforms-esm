const Path = require( "path" );

module.exports = function( config ) {
    config.set( {
        frameworks: [
            "jasmine",
        ],
        client: {
            jasmine: {
                random: false
            }
        },
        files: [
            // tests
            { pattern: "tests/*.js", type: "module" },
            // files tests rely on
            { pattern: "dist/**/*.js", type: "module", included: true, served: true },
        ],
        reporters: ['dots'],
        exclude: [
            "src/components/lib/leaflet.js",
            "src/components/old/*"
        ],
        browsers: ["ChromeHeadless"],
        singleRun: false
    } );
};
