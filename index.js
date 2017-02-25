// Description
//   Assigns and notifies reviewers for GitHub pull requests
//
// Configuration:
//   GITHUB_TOKEN
//   GITHUB_ICON_URL - optional fallback icon URL
//
// Commands:
//
// Notes:
//
// Author:
//   Ivan Malopinsky

//todo: AUTHORS/OWNERS integration
//todo: review stategy: blame/random
//todo: PR size tags
//todo: consider scraper fallback for blame

var Request = require('./src/request');
var Review = require('./src/review');
var Response = require('./src/response');

module.exports = function (robot) {
  robot.hear(/github\.com\//, function (res) {
    var adapter = robot.adapterName;
    var message = res.message;
    var text = message.text;

    var request = Request({
      'text': text
    });

    var review = Review({
      'request': request
    });

    var response = Response({
      'adapter': adapter,
      'request': request,
      'review': review
    });

    response.then(function (response) {
      if (!response) {
        return;
      }

      res.send(response);
    })
      .catch(function (err) {
        robot.logger.error(err);
      });
  });
};