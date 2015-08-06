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

  function UIMessage(notify) {
    return {
      show: function (message) {
        return notify({
          message: message,
          position: 'right',
        });
      },
      clearAllAndShow: function (message) {
        notify.closeAll();
        this.show(message);
      }
    };
  };

  function demoCtrl($scope, API, UIMessage) {
    var vm = this;

    PubSub.subscribe('reAttemptSuccessful', function () {
      UIMessage.show('Network is back up.');
    });

    vm.makeRequest = function (times, interval) {
      console.clear();
      API.makeFailingRequest(times, interval, true).then(function (res){
        console.log('API response:', res);
      });
    };

  };

  function apiService($http, $httpRetry, UIMessage) {
    var badRequestConfig  = {
      method: 'GET',
      url: 'http://localhost:8080/bad-url'
    };

    var goodRequestConfig = {
      method: 'GET',
      url: 'http://localhost:8080'
    };

    this.makeFailingRequest = function (times, interval) {

      var retryParams, request;

      if (times !== undefined && interval !== undefined) {
        retryParams = {
          max: times,
          interval: interval,
        };

        request = $httpRetry(badRequestConfig, retryParams);
      } else {
        request = $httpRetry(badRequestConfig);
      }

      return request.then(function (res) {
        return res.data;
      }).catch(function (err) {
        UIMessage.clearAllAndShow('Your request has failed. Please try again.');
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
    'cgNotify'
  ]);

  angular
    .module('retryDemo')
    .service('API', ['$http', '$httpRetry', 'UIMessage', apiService])
    .factory('UIMessage', ['notify', UIMessage])
    .controller('demoCtrl', demoCtrl);

}());