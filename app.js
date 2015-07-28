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
(function () {

  var demoCtrl = function (API, Retry) {
    var vm = this;

    vm.makeRequest = function (times, interval) {
      console.clear();
      console.log('Controller: Starting Request...');

      Retry(API.makeFailingRequest, times, interval, true).then(function (res) {
        console.log('Controller: done making requests', res);
      }).catch(function (e) {
        console.log('Controller: Request promise was rejected.', e);
      });

    };
  };

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
  angular.module('retryDemo', ['autoRetry']);

  angular
    .module('retryDemo')
    .service('API', ['$http', apiService])
    .controller('demoCtrl', demoCtrl);

})();