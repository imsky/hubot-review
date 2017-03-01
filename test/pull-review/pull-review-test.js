var fs = require('fs');
var path = require('path');

var chai = require('chai');
chai.use(require('chai-as-promised'));
chai.should();

var config = fs.readFileSync(path.join(__dirname, 'config.yml'), 'utf8');

var pullReview = require('../../src/pull-review');
var PullReviewConfig = pullReview.PullReviewConfig;
var PullReviewAssignment = pullReview.PullReviewAssignment;

describe('pull-review', function () {
  describe('config', function () {
    it('parses YAML correctly', function () {
      var c = PullReviewConfig(config);
      c.should.have.ownProperty('reviewers');
      c.reviewers.should.have.ownProperty('mockuser2');
    });

    it('fails with bad input', function () {
      (function () {
        PullReviewConfig(' ');
      }).should.throw(Error, 'Invalid config');

      (function () {
        PullReviewConfig(123);
      }).should.throw();

      PullReviewConfig(JSON.stringify({"version": 1}))
    });

    it('fails with bad settings', function () {
      (function () {
        PullReviewConfig({
          'version': 1,
          'min_reviewers': -1
        });
      }).should.throw(Error, 'Invalid number of minimum reviewers');

      (function () {
        PullReviewConfig({
          'version': 1,
          'max_reviewers': -1
        });
      }).should.throw(Error, 'Invalid number of maximum reviewers');

      (function () {
        PullReviewConfig({
          'version': 1,
          'min_reviewers': 1,
          'max_reviewers': 0
        });
      }).should.throw(Error, 'Minimum reviewers exceeds maximum reviewers');

      (function () {
        PullReviewConfig({
          'version': 1,
          'max_files': -1
        });
      }).should.throw(Error, 'Invalid number of maximum files');
    });
  });

  describe('assignment', function () {
    it('fails without required parameters', function () {
      (function () {
        PullReviewAssignment({});
      }).should.throw();

      (function () {
        PullReviewAssignment({'getBlameForFile': function () {}});
      }).should.throw();
    });

    it('fails with too many assignees', function () {
      (function () {
        PullReviewAssignment({
          'authorLogin': 'mockuser',
          'getBlameForFile': function () {},
          'assignees': [1,2,3,4,5,6,7,8,9]
        });
      }).should.throw(Error, 'Pull request has max reviewers assigned');
    });

    it('fails with bad file data', function () {
      (function () {
        PullReviewAssignment({
          'authorLogin': 'mockuser',
          'getBlameForFile': function () {},
          'files': [1,2,3]
        });
      }).should.throw(Error, 'Missing file data');
    });

    it('fails with bad blame data', function () {
      return PullReviewAssignment({
        'authorLogin': 'mockuser',
        'files': [
          {
            'filename': 'test',
            'status': 'modified',
            'changes': 1
          }
        ],
        'getBlameForFile': function () {
          return [
            {
              'login': 'mockuser'
            }
          ]
        }
      }).should.eventually.be.rejectedWith(Error, 'Missing blame range data');
    });

    it('filters out unreachable authors', function () {
      return PullReviewAssignment({
        'config': {
          'version': 1,
          'reviewers': {}
        },
        'authorLogin': 'foo',
        'files': [
          {
            'filename': 'test',
            'status': 'modified',
            'changes': 1
          }
        ],
        'getBlameForFile': function () {
          return [
            {
              'login': 'mockuser',
              'count': 5,
              'age': 1
            }
          ]
        }
      })
        .then(function (reviewers) {
          reviewers.map(function (r) { return r.login }).should.not.include('mockuser');
        });
    });
  });
});