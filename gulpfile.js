var gulp = require('gulp');
var del = require('del');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var runSequence = require('run-sequence');
var $ = require('gulp-load-plugins')({lazy: true});

gulp.task('help', $.taskListing);

gulp.task('default', ['help']);

gulp.task('test', function () {
  return gulp.src([
            'node_modules/sinon/pkg/sinon.js',
            'node_modules/sinon-stub-promise/index.js',
            'node_modules/axios/dist/axios.min.js',
            'node_modules/pubsub-js/src/pubsub.js',
            'node_modules/q/q.js',
            'node_modules/qretry/build/qretry.min.js',
            'node_modules/jasmine-ajax/lib/mock-ajax.js',
            'src/auto-retry.js',
            'src/autoRetrySpec.js'])
    .pipe($.karma({
      configFile: 'karma.conf.js',
      action: 'run'
    }));
});

gulp.task('bump-patch', function () {
  return gulp.src(['package.json', 'bower.json'])
    .pipe($.bump())
    .pipe(gulp.dest('./'));
});

gulp.task('bump-minor', function () {
  return gulp.src(['package.json', 'bower.json'])
    .pipe($.bump({type: 'minor'}))
    .pipe(gulp.dest('./'));
});

gulp.task('bump-major', function () {
  return gulp.src(['package.json', 'bower.json'])
    .pipe($.bump({type: 'major'}))
    .pipe(gulp.dest('./'));
});

gulp.task('clean-dist', function () {
  del(['dist/*'], function (err, deletedFiles) {
    if (deletedFiles && deletedFiles.length > 0)
      console.error('\n Files deleted: \n', deletedFiles.join(',\n '));
  });
});

gulp.task('browserify', function() {
  var b = browserify({
    entries: 'index.js',
    debug: true
  });
  return b.bundle()
    .pipe(source('auto-retry.js'))
    .pipe(gulp.dest('dist/'));
});


gulp.task('minify', function() {
  return gulp
    .src(['dist/auto-retry.js'])
    .pipe(gulp.dest('dist/'))
    .pipe($.rename({
      suffix: '.min'
    }))
    .pipe($.uglify())
    .pipe(gulp.dest('dist/'));
});

gulp.task('build', function() {
  runSequence('clean-dist','browserify','minify')
});

