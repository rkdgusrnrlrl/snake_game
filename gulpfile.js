/**
 * Created by khk on 2016-06-22.
 */
var gulp = require('gulp');
var nodemon = require('gulp-nodemon');
var git = require('gulp-git');
var path = require('path');
var argv = require('yargs').argv;

gulp.task('pull', function(){
    var branch = argv.b || "master";
    git.pull('origin', branch.trim() ,{quiet: false},function (err) {
        if (err) {
            console.log(err.message);
        }
    });
});

gulp.task('runner', () => {
    var stream = nodemon({
        script : "bin/www",
        ignore: [
            'public/',
            'node_modules/'
        ]
        /*
        ,tasks: function (files) {
            var tasks = [];
            files.forEach((file) => {
                if (path.basename(file) == "component.react.js") {
                tasks.push('reactCompile');
            }
        })
            return tasks;
        }*/
    })
    return stream
})

gulp.task('default', ['pull', 'runner']);