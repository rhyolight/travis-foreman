# Foreman

A small Travis-CI client for listing running builds across a Github organization or user account.

## Install

    npm install foreman

## Usage

    var TravisForeman = require('travis-foreman');

    var foreman = new TravisForeman({
        organization: 'mozilla'
    });

    foreman.listRunningBuilds(function(err, builds) {
        console.log(builds);
    });

This prints all the currently runnint Travis-CI builds for Mozilla:

    { commonplace: [],
      'treeherder-service':
       [ { id: 26889295,
           repository_id: 478131,
           commit_id: 7765225,
           number: '918',
           pull_request: false,
           pull_request_title: null,
           pull_request_number: null,
           config: [Object],
           state: 'started',
           started_at: '2014-06-05T20:40:14Z',
           finished_at: null,
           duration: null,
           job_ids: [Object] } ],
      'popcorn.webmaker.org':
       [ { id: 26889341,
           repository_id: 907858,
           commit_id: 7765244,
           number: '2475',
           pull_request: false,
           pull_request_title: null,
           pull_request_number: null,
           config: [Object],
           state: 'started',
           started_at: '2014-06-05T20:41:17Z',
           finished_at: null,
           duration: null,
           job_ids: [Object] } ],
      'app-validator': [],
      rust: [],
      eideticker: [],
      'source-map': [],
      kuma: [],
      spartacus: [],
      crontabber: [],
      'mdn-tests': [],
      fxpay: [],
      'Socorro-Tests': [],
      ichnaea: [],
      kitsune: [],
      persona: [],
      'fxa-content-server': [],
      'Addon-Tests': [],
      mozdownload: [],
      localForage: [],
      rr: [],
      'login.webmaker.org': [],
      'webmaker.org': undefined }

## Authentication

You can also authenticate if you include credentials.

    var TravisForeman = require('travis-foreman');

    var foreman = new TravisForeman({
        organization: 'mozilla',
        username: '<GITHUB-USERNAME>',
        password: '<GITHUB-PASSWORD>'
    });

    foreman.authenticate(function() {
        foreman.listRunningBuilds(function(err, builds) {
            console.log(builds);
        });
    });