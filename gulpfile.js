var gulp = require('gulp');
var spawn = require('child_process').spawn;

function runJekyll(options) {
  options = options || {};
  var args = ['build'];
  if (options.watch) {
    args.push('--watch');
  }

  return new Promise(function(resolve, reject) {
    var jekyllCmd = spawn('jekyll', args, {stdio: 'inherit'});
    jekyllCmd.on('exit', function(code) {
      resolve(code === 0 ? null : 'ERROR: Jekyll process exited with code: ' + code);
    });
  });
}

gulp.task('install', function() {
  return new Promise(function(resolve, reject) {
    var spawn = require('child_process').spawn;
    var installCmd = spawn('bundle', ['install'], {stdio: 'inherit'});
    installCmd.on('exit', function(code) {
      resolve(code === 0 ? null : 'ERROR: Installation exited with code: ' + code);
    });
  });
});

gulp.task('watch', function() {
  return runJekyll({watch: true});
});

gulp.task('default', function() {
  return runJekyll();
});
