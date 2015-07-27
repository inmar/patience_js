'use strict';

/**
 * Proof of Concept:
 *   Auto-retry of AJAX requests in AngularJS. 
 *   Details: https://inmarb2b.visualstudio.com/DefaultCollection/Portal/_backlogs#level=Backlog+items&showParents=false&_a=backlog
 * 
 */

/**
 * Library
 */

function autoRetryController(API, Retry) {
  var vm = this;
  vm.log = [
    'Loaded controller. Awaiting button press, my liege.',
  ];

  vm.makeRequest = function () {
    vm.log.push('Starting Request...');

    Retry.makeRequest(API.makeFailingRequest).then(function () {
      console.log('done making requests');
    });

  };
}

function retryService($timeout) {

  this.makeRequest = function (request, retryCount, timeOut) {
    var requestLimit    = retryCount || 2;
    var retryTimeOut  = timeOut || 50;
    var requestCount  = 0;

    console.log('making failing $http requests', requestLimit, 'times @', retryTimeOut, 'ms intervals');

    // make a failing request [retryCount] times
    request().catch(function () {
      console.log('failed request #', requestCount);

      if (requestCount < requestLimit) {
        request();
        requestCount++;
      } else {
        console.log('request #', requestCount, 'failed. Limit of', requestLimit, 'reached.');
      }

    });

    // resolve with successful call 
  };
}

function apiService($http) {
  var badURL  = 'http://localhost:8080/bad-url';
  var goodURL = 'http://www.mocky.io/v2/55b68eab76961d7c107c5b7e';

  this.makeFailingRequest = function () {
    return $http.get(badURL).then(function (res) {
      console.log('bad request succeeded, shomehow.');
      return res.data;
    });
  };

  this.makeSuccessfulRequest = function () {
    return $http.get(goodURL).then(function (res) {
      return res.data;
    });
  };
}

/**
 * Angular App
 */
angular.module('autoRetry', []);

angular
  .module('autoRetry')
  .service('API', ['$q', '$http', apiService])
  .service('Retry', ['$timeout', retryService])
  .controller('AutoRetryController', autoRetryController);