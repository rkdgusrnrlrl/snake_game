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

function getLocalBranchs(stdout) {
    var branchs = stdout.split("\n").map((branch) => branch.replace(/(^\s*)/g, ''));
    return branchs;
}
gulp.task('default', function() {
    git.exec({args : 'branch'}, function (err, stdout) {
        var pushedBranch = argv.b || '';
        if (pushedBranch !== '') {
            var branchs = getLocalBranchs(stdout);
            var currentBranch = getCurrentBranch(branchs);
            console.log("현재 브랜치 : "+currentBranch);

            //현재 브런치가 push 된 브런치랑 같은지 파악
            if (pushedBranch !== currentBranch) {
                if (isExist(branchs, pushedBranch)) {
                    git.checkout(pushedBranch
                        , {quiet : false}
                        , (err) => errHandler(err) );
                    console.log("체크아웃 끗");
                } else {
                    git.checkout("origin/"+pushedBranch
                        , {args: '-t',quiet : false}
                        , (err) => errHandler(err));
                }
            }
            git.pull('origin', pushedBranch, {quiet : false}, (err) => errHandler(err))
         } else {
             console.log("브런치명을 넣어주세요");
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