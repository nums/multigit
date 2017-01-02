# multigit
A multigit manager with git flow features availables

#### 1. add lib to your package.json

```npm --save require multigit```

#### 2. create .repositories file to setup your git repositories to manage

```json
{
    "mynamespace": {
        "myreponame": {
            "path": "/var/www/projet1",
            "url": "https://github.com"
        },
        "myreponameprivate": {
            "path": "/var/www/projet2",
            "url": "http://mygitlab.com"
        }
    }
}
```

#### 3. Use multigit methods to your node js script like this exemple
We use gulp tasks to use lib, but **multigit is NOT a gulp plugin** (for now)

Javascript
----------
```javascript
var gulp = require('gulp');
var multigit =  require('multigit')();

gulp.task('flow', function() {
    multigit.workflow();
});

gulp.task('push', function() {
    multigit.git.confirm('push');
});

gulp.task('pull', function() {
    multigit.git.confirm('pull');
});

gulp.task('commit', function() {
    multigit.git.commit();
});

gulp.task('init', function() {
    multigit.git.init();
});

gulp.task('init-flow', function() {
    multigit.git.initFlow();
});
```

### 4. Use multi git

```gulp init -u USERNAME -p PASSWORD```

```gulp commit```

```gulp push```

```gulp pull```

```gulp init-flow```

```gulp flow``` (and answer questions)
