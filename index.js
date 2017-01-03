'use strict';

var
    argv = require('yargs').argv,
    shell = require('shelljs'),
    inquirer = require('inquirer'),
    fs = require('fs'),
    gutil = require('gulp-util'),
    success = function(msg) {
        gutil.log(gutil.colors.green(msg));
    },
    error = function(msg) {
        gutil.log(gutil.colors.red(msg));
    },
    warning = function(msg) {
        gutil.log(gutil.colors.yellow(msg));
    },
    repositories = JSON.parse(fs.readFileSync('.repositories').toString()),
    reposTools = {
        process: function(callback) {
            var auth = '';
            if (argv.u && argv.p)
                auth = argv.u + ':' + argv.p + '@';
            for (var namespace in repositories) {
                var reposByNamespace = repositories[namespace];
                for (var repo in reposByNamespace) {
                    var url = reposByNamespace[repo].url.split('://');
                    var repoUrl = url[0] + '://' + auth + url[1] + '/' + namespace + '/' + repo + '.git';

                    callback({
                        repoUrl: repoUrl,
                        path: reposByNamespace[repo].path,
                        namespace: namespace,
                        repo: repo
                    });

                }
            }
        }
    }

try {
    var currentBranch = fs.readFileSync('.branch').toString();
    if (currentBranch.trim() == '')
        currentBranch = 'master';
}
catch (err) {
    currentBranch = 'master'
}

function messageBefore(params) {
    console.log('***---------------------------------------------***');
    console.log('Try to ' + params.action + ' ' + params.namespace + '/' + params.repo);
}

function messageAfter(action, params) {
    if (action.code === 0) {
        success(params.action + ' made with success');
    }
    else {
        if (params.action == 'commit')
            warning('nothing to commit, use -f to force your action');
        //else
        //    warning(params.action + ' has failed');
    }
    console.log('***---------------------------------------------***');
}

function init(params) {
    params.action = 'init';
    messageBefore(params)
    var action = shell.exec('mkdir ' + params.path + ';cd ' + params.path + ';git clone ' + params.repoUrl + ' .');
    messageAfter(action, params);
}

function initFlow(params) {
    params.action = 'init-flow';
    messageBefore(params)
    var action = shell.exec('cd ' + params.path + ';git branch develop;git checkout develop;git pull origin develop;git push origin develop');
    messageAfter(action, params);
}

function commit(params) {
    var message = argv.m || 'update';
    params.action = 'commit';
    messageBefore(params)
    var action = shell.exec('cd ' + params.path + ';git add .;git commit -m "' + message + '"');
    messageAfter(action, params);
    if (action.code === 0)
        return true;
    else
        return false;
}

//gulp push -f -m 'force push'
//gulp push -m 'commit and try to push'
function push(params) {
    var force = argv.f || false;
    if (commit(params) || force) {
        params.action = 'Push on ' + currentBranch;
        messageBefore(params);
        var action = shell.exec('cd ' + params.path + ';git push origin ' + currentBranch);
        messageAfter(action, params);
    }
}

function pull(params) {
    params.action = 'Pull on ' + currentBranch;
    messageBefore(params);
    var action = shell.exec('cd ' + params.path + ';git pull origin ' + currentBranch);
    messageAfter(action, params);
}

function getBranchName(params) {
    var branchName = currentBranch;
    if (!branchName) {
        error('Feature name is missing')
        return false;
    }
    else {
        return branchName;
    }
}

function getOriginBranch(type) {
    switch (type) {
        case 'feature':
            return 'develop';
        case 'release':
            return 'develop';
        case 'hotfix':
            return 'master';
    }
}

function getMergeBranch(type) {
    switch (type) {
        case 'feature':
            return 'develop';
        case 'release':
            return 'master';
        case 'hotfix':
            return 'master';
    }
}

function branchStart(type, params) {
    var branchName = getBranchName(params);
    if (branchName) {
        commit(params);
        params.action = 'start a new ' + type + ' : ' + branchName;
        messageBefore(params);
        var add = '';
        if (type == 'release' || type == 'hotfix')
            add = ';git commit -a -m "Bumped version number to ' + branchName + '"';		
        var action = shell.exec('cd ' + params.path + ';git fetch;git checkout -b ' + type + '/' + branchName + ' ' + getOriginBranch(type) + add);
        messageAfter(action, params);
        fs.writeFileSync('.branch', type + '/' + branchName);
    }
}

function branchFinish(type, params) {
    var branchName = getBranchName(params);
    if (branchName) {
        commit(params);
        params.action = 'put ' + type + ' ' + branchName + ' to ' + getOriginBranch(type);
        messageBefore(params);
        var action = shell.exec('cd ' + params.path + ';export GIT_MERGE_AUTOEDIT=no;git checkout ' + getMergeBranch(type) + ';git merge --no-ff ' + type + '/' + branchName + ';git push origin ' + getMergeBranch(type));
        messageAfter(action, params);
        if (action.code === 0 && (type == 'release' || type == 'hotfix')) {
            params.action = 'send tag and merge develop';
            var message = argv.m || 'new tag : ' + branchName;
            var action = shell.exec('cd ' + params.path + ';git fetch;export GIT_MERGE_AUTOEDIT=no;git tag -a ' + branchName + ' -m "' + message + '";git push origin tag ' + branchName + ';git checkout develop;git merge --no-ff release/' + branchName + ';git merge --no-ff ' + type + '/' + branchName + ';git push origin develop;');
            messageAfter(action, params);
        }
        fs.writeFileSync('.branch', 'develop');
    }
}

function branchPush(type, params) {
    var branchName = getBranchName(params);
    if (branchName) {
        commit(params);
        params.action = 'push ' + type + ' ' + branchName;
        messageBefore(params);
        var action = shell.exec('cd ' + params.path + ';git fetch;git checkout ' + type + '/' + branchName + ';git pull origin ' + type + '/' + branchName + ';git push origin ' + type + '/' + branchName);
        messageAfter(action, params);
        fs.writeFileSync('.branch', type + '/' + branchName);
    }
}

//export GIT_MERGE_AUTOEDIT=no
//git fetch
//git checkout feature/test
//git pull origin feature/test

function branchPull(type, params) {
    var branchName = getBranchName(params);
    if (branchName) {
        commit(params);
        params.action = 'pull ' + type + ' ' + branchName;
        messageBefore(params);
        var action = shell.exec('cd ' + params.path + ';export GIT_MERGE_AUTOEDIT=no;git fetch;git checkout ' + type + '/' + branchName + ';git pull origin ' + type + '/' + branchName);
        messageAfter(action, params);
        fs.writeFileSync('.branch', type + '/' + branchName);
    }
}

//*git push origin <tag_name>*/

var flow = {
    start: function(type) {
        reposTools.process(function(params) {
            branchStart(type, params);
        })
    },
    finish: function(type) {
        reposTools.process(function(params) {
            branchFinish(type, params);
        })
    },
    publish: function(type) {
        reposTools.process(function(params) {
            branchPush(type, params);
        })
    },
    pull: function(type) {
        reposTools.process(function(params) {
            branchPull(type, params);
        })
    }
}

function workflow() {

    var question1 = {
        type: 'list',
        name: 'action',
        message: 'What do you want to to ?',
        choices: ['start', 'finish', 'publish', 'pull'],
        filter: function(val) {
            return val.toLowerCase();
        }
    }

    var question2 = {
        type: 'list',
        name: 'type',
        message: 'Wich kind of branch ?',
        choices: ['feature', 'release', 'hotfix'],
        filter: function(val) {
            return val.toLowerCase();
        }
    };

    var question3 = {
        type: 'input',
        name: 'branchName',
        message: 'Name of your branch ?',
        validate: function(value) {
            var pass = value.match(/^([a-zA-Z0-9-\.]+)$/);
            if (pass) {
                return true;
            }

            return 'Please enter valide branch name';
        }
    };

    var question1b = {
        type: 'confirm',
        name: 'continue',
        message: 'Make action on current branch ' + currentBranch + ' ?'
    }

    inquirer.prompt([question1]).then(function(answers) {
        var action = answers.action;
        if (action == 'start') {
            inquirer.prompt([question2, question3]).then(function(answers) {
                currentBranch = answers.branchName
                flow[action](answers.type);
            });
        }
        else {
            if (currentBranch != 'develop' && currentBranch != 'master') {
                inquirer.prompt([question1b]).then(function(answers) {
                    if (answers.continue) {
                        var b = currentBranch.split('/');
                        currentBranch = b[1];
                        console.log(action, b[0], currentBranch);
                        flow[action](b[0]);
                    }
                    else {
                        inquirer.prompt([question2, question3]).then(function(answers) {
                            currentBranch = answers.branchName
                            flow[action](answers.type);
                        });
                    }
                });
            }
            else {
                inquirer.prompt([question2, question3]).then(function(answers) {
                    currentBranch = answers.branchName
                    flow[action](answers.type);
                });
            }
        }

    });
}

var git = {
    push: function() {
        this.confirm('push');
    },
    pull: function() {
        this.confirm('pull');
    },
    confirm: function(action) {
        var questions = [{
            type: 'confirm',
            name: 'continue',
            message: 'You\'re current branch is ' + currentBranch + ', do you want to push on this branch ?'
        }];

        inquirer.prompt(questions).then(function(answers) {
            if (answers.continue)
                git['do_'+action]()
        });
    },
    do_push: function() {
        reposTools.process(function(params) {
            push(params);
        });
    },
    do_pull: function(params) {
        reposTools.process(function(params) {
            pull(params);
        });
    },
    commit: function() {
        reposTools.process(function(params) {
            commit(params);
        })
    },
    initFlow: function() {
        reposTools.process(function(params) {
            initFlow(params);
        })
    },
    init: function() {
        reposTools.process(function(params) {
            init(params);
        })
    }
}

exports.commands = {
    s: git,
	'init-flow': git.initFlow,
    flow: workflow
};
