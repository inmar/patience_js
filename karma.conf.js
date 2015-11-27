module.exports = function(config){
    config.set({

        basePath : './',

        files : [
            'node_modules/sinon/pkg/sinon.js',
            'node_modules/jasmine-ajax/lib/mock-ajax.js',
            'src/autoRetrySpec.js'
        ],

        autoWatch : false,

        frameworks: ['jasmine','browserify'],

        browsers : ['Chrome'],

        plugins : [
            'karma-browserify',
            'karma-jasmine',
            'karma-junit-reporter',
            'karma-chrome-launcher',
            'karma-coverage'
        ],

        preprocessors: {
            'src/*.js': ['browserify'],
            'src/auto-retry.js': ['coverage']
        },

        junitReporter : {
            outputDir: 'test/',
            suite: 'unit'
        },

        coverageReporter: {
            type: 'html',
            dir: 'coverage/'
        },

        reporters: ['progress', 'junit', 'coverage']
    });
};
