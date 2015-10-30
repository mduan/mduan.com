var gulp = require('gulp');
var spawn = require('child_process').spawn;

gulp.task('install', function(cb) {
  var spawn = require('child_process').spawn;
  var install = spawn('bundle', ['install'], {stdio: 'inherit'});
  install.on('exit', function(code) {
    cb(code === 0 ? null : 'ERROR: Installation exited with code: ' + code);
  });
});

gulp.task('jekyll', function (cb){
  // After build: cleanup HTML
  var jekyll = spawn('bundle', ['install'], {stdio: 'inherit'});

  jekyll.on('exit', function(code) {
    cb(code === 0 ? null : 'ERROR: Jekyll process exited with code: ' + code);
  });
});

gulp.task('default', ['jekyll'], function() {
  // place code for your default task here
});
