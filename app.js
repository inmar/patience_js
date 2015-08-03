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

  var demoCtrl = function ($scope, API, notifications) {
    var vm = this;

    PubSub.subscribe('failedRetries', function () {

      $scope.$apply(function () {

        notifications.showError({
          message: 'Network is down.',
        });

      });

    });

    PubSub.subscribe('reAttemptSuccessful', function () {

      $scope.$apply(function () {

        notifications.showSuccess({
          message: 'Network is back up.',
        });

      });

    });

    vm.makeRequest = function (times, interval) {
      console.clear();
      API.makeFailingRequest(times, interval, true);
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

    this.makeFailingRequest = function (times, interval) {

      var retryParams = {
        max: times,
        interval: interval,
      };

      return $httpRetry(badRequestConfig, retryParams).then(function (res) {
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