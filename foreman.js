var _ = require('underscore'),
    async = require('async'),
    Travis = require('travis-ci');

function splitArguments(args) {
    var token = undefined,
        config = {},
        callback = function() {};
    _.each(args, function(arg) {
        if (typeof(arg) == 'string') {
            token = arg;
        } else if (typeof(arg) == 'function') {
            callback = arg;
        } else {
            config = arg;
        }
    });
    return [token, config, callback];
}

function Foreman(config, authCallback) {
    var cfg = _.extend({}, config),
        callback = authCallback;
    if (! callback) {
        callback = function() {};
    }
    // Verify required configuration elements.
    _.each(['organization', 'username', 'password'], function(configName) {
        if (! cfg[configName]) {
            throw new Error('Missing ' + configName + ' configuration.');
        }
    });
    this.organization = cfg.organization;
    this.username = cfg.username;
    this.password = cfg.password;
    this.travis = new Travis({ version: '2.0.0' });
    this.travis.authenticate({
        username: this.username,
        password: this.password
    }, callback);
}

Foreman.prototype.authenticate = function(callback) {
    this.travis.authenticate({
        username: this.username,
        password: this.password
    }, callback);
};

Foreman.prototype.listRepos = function(callback) {
    this.travis.repos({
        owner_name: this.organization
    }, function(err, response) {
        if (err) {
            callback(err);
        } else {
            callback(err, response.repos);
        }
    });
};

Foreman.prototype.listBuilds = function() {
    var me = this,
        args = splitArguments(arguments),
        repoName = args[0],
        filter = args[1],
        callback = args[2];
    // If there is no repoName, user wants all the builds for all the repos.
    if (! repoName) {
        // First we need to get all the repos.
        this.listRepos(function(err, repos) {
            var repoBuildFunctions = {};
            if (err) {
                return callback(err);
            }
            // We'll execute the listBuilds function for each repo name in parallel.
            _.each(_.map(repos, function(repo) {
                return repo.slug.split('/').pop();
            }), function(repoName) {
                repoBuildFunctions[repoName] = function(localCallback) {
                    me.listBuilds(repoName, filter, localCallback);
                };
            });
            async.parallel(repoBuildFunctions, callback);
        });
    }
    // Otherwise we just return the builds for the specified repo.
    else {
        this.travis.repos.builds({
            owner_name: this.organization,
            name: repoName
        }, function(err, response) {
            var builds,
                filteredOutput = [];
            if (err) {
                return callback(err);
            }

            // Include commit object attached to build.
            builds = _.map(response.builds, function(build) {
                build.commit = _.find(response.commits, function(commit) {
                    return build.commit_id == commit.id;
                });
                return build;
            });


            // Filter builds if necessary
            if (_.size(filter) > 0) {
                filteredOutput = _.compact(_.collect(builds, function(build) {
                    var includedBuild = build;
                    _.each(filter, function(filterValue, filterBy) {
                        var matchesOne = false;
                        if (typeof(filterValue) == 'object') {
                            _.each(filterValue, function(value) {
                                if (build[filterBy] == value) {
                                    matchesOne = true
                                }
                            });
                            if (! matchesOne) {
                                includedBuild = false;
                            }
                        } else {
                            if (build[filterBy] != filterValue) {
                                includedBuild = false;
                            }
                        }
                    });
                    return includedBuild;
                }));
                callback(null, filteredOutput);
            }
            // If no filter, just return all builds.
            else {
                callback(null, response.builds);
            }
        });

    }
};

Foreman.prototype.listRunningBuilds = function() {
    var args = splitArguments(arguments),
        repoName = args[0],
        callback = args[2];
    this.listBuilds(repoName, {state: ['started', 'created']}, callback);
};

module.exports = Foreman;
