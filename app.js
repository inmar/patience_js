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

  vm.makeRequest = function () {
    console.warn('Starting Request...');

    Retry(API.makeFailingRequest).then(function () {
      console.warn('done making requests');
    }).catch(function (e) {
      console.warn('HTTP call errored out after retries.', e);
    });

  };
}

function retryService($q, $timeout) {

  return function (request, retryCount, timeOut) {
    var requestLimit = retryCount || 3;
    var requestTimeout = timeOut || 50;
    var requestCount = 0;
    var response = $q.defer();

    console.group('making failing $http requests', requestLimit, 'times @', requestTimeout, 'ms intervals');

    // make a failing request [retryCount] times
    (function makeRequest() {

      request().catch(function () {

        console.log('request #', requestCount + 1, 'failed.');

        requestCount++;

        if (requestCount < requestLimit) {
          console.log('retrying in', requestTimeout, 'ms');

          // retry request at [interval]
          $timeout(makeRequest, requestTimeout);
        } else {
          console.log('Limit of', requestLimit, 'requests reached.');
          console.log('Breaking cycle and re.');
          response.reject({ failed: true });
          console.groupEnd();
        }

      });
    }());


    return response.promise;
  };
}

function apiService($http) {
  var badRequestConfig  = {
    method: 'GET',
    url: 'http://localhost:8080/bad-url'
  };

  var goodRequestConfig = {
    method: 'GET',
    url: 'http://www.mocky.io/v2/55b68eab76961d7c107c5b7e'
  };

  this.makeFailingRequest = function () {
    return $http(badRequestConfig).then(function (res) {
      console.log('bad request succeeded, shomehow.');
      return res.data;
    });
  };

  this.makeSuccessfulRequest = function () {
    return $http(goodRequestConfig).then(function (res) {
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
  .service('API', ['$http', apiService])
  .factory('Retry', ['$q', '$timeout', retryService])
  .controller('AutoRetryController', autoRetryController);