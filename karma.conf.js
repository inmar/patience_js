module.exports = function(config){
    config.set({

        basePath : './',

        files : [
            'node_modules/q/q.js',
            'node_modules/jasmine-ajax/lib/mock-ajax.js',
            'src/auto-retry.js',
            'src/autoRetrySpec.js'
        ],

        autoWatch : false,

        frameworks: ['jasmine'],

        browsers : ['Chrome'],

        plugins : [
            'karma-jasmine',
            'karma-junit-reporter',
            'karma-chrome-launcher',
            'karma-coverage'
        ],

        preprocessors: {
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
