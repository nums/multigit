# multigit
A multigit manager with git flow features availables and some shortcuts to work more easily and quickly with git
But Git flow (http://danielkummer.github.io/git-flow-cheatsheet/) is not required
Just ```nodeJs``` and ```git > 1.7.x``` are required
**This library is still in its early stages of development**

# Why ?
To simplify the use of git: I always do the same 4 actions: ```git commit -m "update"; Git pull origin master; Git push original origin```
With this lib, I juste have to call ```shortcut.push()``` method to do all theses actions.
Why multi ? Because I'm working on projects with different programatic languages and so multiple repositories

#### 1. Add lib to your package.json

```$ (sudo) npm install multigit -g```

#### 2. Create .repositories file to setup your git repositories to manage

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

#### 3. Use multigit

##### Shortcut (this is why we use 's.')

To init all repositories

```$ multigit s.init -u USERNAME -p PASSWORD```

To do on all repositories : ```git add .; git commit -m "comment"```

```$ multigit s.commit -m "comment"```

To do on all repositories : ```git add .; git commit -m "comment";git pull origin [branchName];git push origin [branchName]```

```$ multigit s.push -m "comment"```

To do on all repositories : ```git pull origin [branchName]```

```$ multigit s.pull```

To do on all repositories : ```git branch develop;git checkout develop;git push origin develop```

```$ multigit s.init-flow```

##### Flow methods (inspired from git flow)

To manage your branches with an interactive command line user interfaces

```$ multigit flow``` (and answer questions)

#### TODO

- Handle git response better
- Unit test
- Handle errors better

