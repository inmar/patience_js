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

  var demoCtrl = function (API, notifications) {
    var vm = this;

    vm.makeRequest = function (times, interval) {
      console.clear();

      API.makeFailingRequest(times, interval, true).then(function (res) {

        console.log(res);

      }).catch(function (e) {

        notifications.showError({
          message: 'Your request could not be completed. We will auto-retry in x seconds',
          error: e,
        });

      });

    };
  };

  function apiService($http, $httpRetry) {
    var badRequestConfig  = {
      method: 'GET',
      url: 'http://localhost:8080/bad-url'
    };

    var goodRequestConfig = {
      method: 'GET',
      url: 'http://localhost:8080'
    };

    this.makeFailingRequest = function (times, interval, debug) {

      return $httpRetry(badRequestConfig).then(function (res) {
        return res.data;
      }).catch(function (err) {
        return err;
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
  angular.module('retryDemo', [
    'autoRetry',
    'ngNotificationsBar'
  ]);

  angular
    .module('retryDemo')
    .service('API', ['$http', '$httpRetry', apiService])
    .controller('demoCtrl', demoCtrl);

}());