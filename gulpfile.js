var gulp = require('gulp');
var jshint = require('gulp-jshint');
var spawn = require('child_process').spawn;

gulp.task('install', function() {
  return new Promise(function(resolve, reject) {
    var spawn = require('child_process').spawn;
    var installCmd = spawn('bundle', ['install'], {stdio: 'inherit'});
    installCmd.on('exit', function(code) {
      resolve(code === 0 ? null : 'ERROR: Installation exited with code: ' + code);
    });
  });
});

gulp.task('jshint', function() {
  return gulp.src('src/static/js/**/*.js')
    .pipe(jshint({lookup: true}))
    .pipe(jshint.reporter('default', {verbose: true}));
    //.pipe(jshint.reporter('fail'));
});

gulp.task('jekyll', ['jshint'], function() {
  return new Promise(function(resolve, reject) {
    var jekyllCmd = spawn('jekyll', ['build'], {stdio: 'inherit'});
    jekyllCmd.on('exit', function(code) {
      resolve(code === 0 ? null : 'ERROR: Jekyll process exited with code: ' + code);
    });
  });
});

gulp.task('watch', ['jekyll'], function() {
  return gulp.watch('src/**/*', ['jekyll']);
});

gulp.task('default', ['jekyll']);
