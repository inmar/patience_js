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

  vm.makeRequest = function (times, intervals) {
    console.log('Controller: Starting Request...');

    Retry(API.makeFailingRequest, times, intervals).then(function (res) {
      console.log('Controller: done making requests', res);
    }).catch(function (e) {
      console.log('Controller: Request promise was rejected.', e);
    });

  };
}

function retryService($q, $timeout) {

  return function (request, retryCount, timeOut, debug) {
    var requestLimit   = retryCount || 3;
    var requestTimeout = timeOut || 50;
    var requestCount   = 0;
    var response       = $q.defer();

    if (debug) {
      console.warn('making $http request. Retry Info:', requestLimit, 'times @', requestTimeout, 'ms intervals');
    }

    // make a failing request [retryCount] times
    (function makeRequest() {

      request().then(function (res) {
        response.resolve(res);
      }).catch(function () {
        if (debug) {
          console.warn('request #', requestCount + 1, 'failed.');
        }

        requestCount++;

        if (requestCount < requestLimit) {
          console.warn('retrying in', requestTimeout, 'ms');

          // retry request after [requestTimeout] ms have passed
          $timeout(makeRequest, requestTimeout);
        } else {
          if (debug) {
            console.warn('Limit of', requestLimit, 'requests reached.');
            console.warn('Breaking retry cycle.');
          }

          response.reject({ failed: true });
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
    url: 'http://localhost:8080/'
  };

  this.makeFailingRequest = function () {
    return $http(badRequestConfig).then(function (res) {
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