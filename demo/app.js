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

    vm.makeRequest = function (times, interval) {
      console.clear();
      API.makeFailingRequest(times, interval).then(function (res){
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

    this.makeFailingRequest = function () {

      return $httpRetry
                  .request(badRequestConfig)
                  .group('User')
                  .retry({ max: 2, interval: 500 })
                  .reAttempt({ max: 2, interval: 2000 })
                  .run()
                  .then(function (res) {
                    return res;
                  })
                  .catch(function (err) {
                    UIMessage.clearAllAndShow(err);
                  })
                  .progress(function (msg) {
                    UIMessage.show(msg);
                  });

    };

    this.makeFailingStrategyRequest = function () {

      $httpRetry.addStrategy('news', { retry: { max: 1 } });

      return $httpRetry
                  .request(badRequestConfig)
                  .runStrategy('news') // run preset strategy.
                  .then(function (res) {
                    return res;
                  })
                  .catch(function (err) {
                    UIMessage.clearAllAndShow(err);
                  })
                  .progress(function (msg) {
                    UIMessage.show(msg);
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