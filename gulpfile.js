var gulp = require('gulp');
var del = require('del');
var $ = require('gulp-load-plugins')({lazy: true});

gulp.task('help', $.taskListing);

gulp.task('default', ['help']);

gulp.task('test', function () {
  return gulp.src([
            'node_modules/q/q.js',
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
      console.log('Files deleted:', deletedFiles.join(', '));
  });
});

gulp.task('minify', ['clean-dist'], function() {
  return gulp
    .src('src/autosave.js')
    .pipe(gulp.dest('dist/'))
    .pipe($.rename('autosave.min.js'))
    .pipe($.uglify())
    .pipe(gulp.dest('dist/'));
});

gulp.task('build', ['minify'], function() {
  return gulp
    .src('src/auto-retry.js')
    .pipe(gulp.dest('dist/'));
});


