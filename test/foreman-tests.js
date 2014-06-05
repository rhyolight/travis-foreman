var assert = require('chai').assert,
    expect = require('chai').expect,
    should = require('chai').should(),
    proxyquire = require('proxyquire'),
    mockRepos = require('./mock-data/repo-list'),
    mockNupicBuilds = require('./mock-data/nupic-build-list'),
    mockNupicCoreBuilds = require('./mock-data/nupic-core-build-list');

describe('foreman', function() {

    describe('when constructed', function() {
        var authenticated = false;
        var mockTravisInstance = {
            authenticate: function(params, callback) {
                assert.ok(params.username, 'Missing travis-ci username during authentication.');
                assert.ok(params.password, 'Missing travis-ci password during authentication.');
                authenticated = true;
                callback();
            }
        };

        var TravisForeman = proxyquire('../foreman', {
            'travis-ci': function () {
                return mockTravisInstance;
            }
        });

        describe('without organization', function() {
            it('throws proper error', function() {
                expect(function() {
                    new TravisForeman({
                        username: 'my-username',
                        password: 'my-password'
                    });
                }).to.throw('Missing organization configuration.');
            });
        });

        describe('without username', function() {
            it('throws proper error', function() {
                expect(function() {
                    new TravisForeman({
                        organization: 'my-organization',
                        password: 'my-password'
                    });
                }).to.throw('Missing username configuration.');
            });
        });

        describe('without password', function() {
            it('throws proper error', function() {
                expect(function() {
                    new TravisForeman({
                        organization: 'my-organization',
                        username: 'my-username'
                    });
                }).to.throw('Missing password configuration.');
            });
        });


        describe('with required configuration', function() {

            var foreman = new TravisForeman({
                organization: 'my-organization',
                username: 'my-username',
                password: 'my-password'
            });

            it('exposes organization', function() {
                assert.equal(foreman.organization, 'my-organization', 'Bad org foreman property.');
            });

            it('exposes username', function() {
                assert.equal(foreman.username, 'my-username', 'Bad username foreman property.');
            });

            describe('during authentication', function() {
                it('calls the given callback after authentication', function(done) {
                    foreman.authenticate(function(err) {
                        expect(err).to.not.exist;
                        assert.isTrue(authenticated, 'Monitor did not authenticate with travis-ci.');
                        done();
                    });
                });

            });

        });

        describe('when created with bad organization', function() {
            var mockTravisInstance = {
                authenticate: function(params, cb) {
                    if (cb) {
                        cb();
                    }
                },
                repos: function(params, callback) {
                    callback(new Error('travis-ci error'));
                }
            };

            var TravisForeman = proxyquire('../foreman', {
                'travis-ci': function () {
                    return mockTravisInstance;
                }
            });

            var foreman = new TravisForeman({
                organization: 'my-organization',
                username: 'my-username',
                password: 'my-password'
            });

            it('returns proper error when listing repos', function(done) {
                foreman.listRepos(function(err, repos) {
                    assert.ok(err, 'should have received error on repo list with bad org');
                    assert.notOk(repos, 'should not have received data');
                    done();
                });
            });

        });
    });

    describe('with one repository', function() {

        var authenticated = false;
        var mockTravisInstance = {
            authenticate: function(params, callback) {
                expect(params).to.have.property('username').and.equal('my-username');
                expect(params).to.have.property('password').and.equal('my-password');
                authenticated = true;
                callback();
            },
            repos: function(params, callback) {
                expect(params).to.have.property('owner_name').and.equal('my-organization');
                callback(null, mockRepos);
            }
        };

        // Mock builds function.
        mockTravisInstance.repos.builds = function(params, callback) {
            expect(params).to.have.property('owner_name').and.equal('my-organization');
            expect(params).to.have.property('name').and.equal('my-repo');
            callback(null, mockNupicBuilds);
        };

        var TravisForeman = proxyquire('../foreman', {
            'travis-ci': function () {
                return mockTravisInstance;
            }
        });

        var foreman = new TravisForeman({
            organization: 'my-organization',
            username: 'my-username',
            password: 'my-password'
        });


        it('lists repo information for an organization', function(done) {
            foreman.listRepos(function(err, repos) {
                expect(err).to.not.exist;
                expect(repos).to.be.instanceOf(Array);
                expect(repos).to.have.length(9);
                expect(repos[0]).to.be.an('object');
                expect(repos[0]).to.have.property('id').and.equal(1839953);
                done();
            });
        });

        it('lists build information for an repo', function(done) {
            foreman.listBuilds('my-repo', function(err, builds) {
                expect(err).to.not.exist;
                expect(builds).to.be.instanceOf(Array);
                expect(builds).to.have.length(25);
                expect(builds[0]).to.be.an('object');
                expect(builds[0]).to.have.property('id').and.equal(26806886);
                done();
            });
        });

        it('lists running builds for on repo', function(done) {
            foreman.listRunningBuilds('my-repo', function(err, builds) {
                expect(err).to.not.exist;
                expect(builds).to.be.instanceOf(Array);
                expect(builds).to.have.length(2);
                expect(builds[0]).to.be.an('object');
                expect(builds[0]).to.have.property('id').and.equal(26806886);
                done();
            });
        });

    });

    describe('with two repositories', function() {

        var mockTravisInstance = {
            authenticate: function(params, callback) {
                callback();
            },
            repos: function(params, callback) {
                expect(params).to.have.property('owner_name').and.equal('my-organization');
                callback(null, mockRepos);
            }
        };

        // Mock builds function.
        mockTravisInstance.repos.builds = function(params, callback) {
            expect(params).to.have.property('owner_name').and.equal('my-organization');
            expect(params).to.have.property('name').and.equal('my-repo');
            callback(null, mockNupicBuilds);
        };

        var TravisForeman = proxyquire('../foreman', {
            'travis-ci': function () {
                return mockTravisInstance;
            }
        });

        var foreman = new TravisForeman({
            organization: 'my-organization',
            username: 'my-username',
            password: 'my-password'
        });

        mockTravisInstance.repos.builds = function(params, callback) {
            if (params.name == 'nupic') {
                return callback(null, mockNupicBuilds);
            } else if (params.name == 'nupic.core') {
                callback(null, mockNupicCoreBuilds);
            } else {
                // dummy all others
                callback(null, {builds: [], commits: []});
            }
        };

        var TravisForeman = proxyquire('../foreman', {
            'travis-ci': function () {
                return mockTravisInstance;
            }
        });

        var monitor = new TravisForeman({
            organization: 'my-organization',
            username: 'my-username',
            password: 'my-password'
        });

        it('lists running builds for all repos', function(done) {
            monitor.listRunningBuilds(function(err, builds) {
                expect(err).to.not.exist;
                expect(builds).to.be.instanceOf(Object);
                expect(builds).to.include.keys('nupic');
                expect(builds['nupic']).to.be.instanceOf(Array);
                expect(builds['nupic']).to.have.length(2);
                expect(builds['nupic'][0]).to.have.property('id').and.equal(26806886);
                expect(builds).to.include.keys('nupic.core');
                expect(builds['nupic.core']).to.be.instanceOf(Array);
                expect(builds['nupic.core']).to.have.length(0);
                done();
            });
        });

        it('lists build information for many repos', function(done) {
            monitor.listBuilds(function(err, builds) {
                expect(err).to.not.exist;
                expect(builds).to.be.instanceOf(Object);
                expect(builds).to.have.property('nupic');
                expect(builds).to.have.property('nupic.core');

                var nupicBuilds = builds['nupic'],
                    coreBuilds = builds['nupic.core'];

                assert.isArray(nupicBuilds, 'wrong response type returned for build list');
                assert.lengthOf(nupicBuilds, 25, 'wrong response list length');
                assert.ok(nupicBuilds[0].id, 'Missing id of build');
                assert.equal(nupicBuilds[0].id, 26806886, 'bad build id');

                assert.isArray(coreBuilds, 'wrong response type returned for build list');
                assert.lengthOf(coreBuilds, 25, 'wrong response list length');
                assert.ok(coreBuilds[0].id, 'Missing id of build');
                assert.equal(coreBuilds[0].id, 26783065, 'bad build id');

                done();
            });
        });

    });

});
