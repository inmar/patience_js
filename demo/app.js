'use strict';

/**
 * Demo App for Auto-retry library using AngularJS.
 */

(function () {

  /**
   * Angular Factory which controls UI pop-up messages / toasts
   *
   * @param {DI Object} notify
   */
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
  }

  /**
   * Angular Controller for demo
   *
   * @param  {[DI API Service]} API
   */
  function demoCtrl($httpRetry, UIMessage) {
    var vm = this;

    var requestConfig  = {
      method: 'GET',
      url: 'http://localhost:8080/bad-url'
    };

    // Add a custom strategy
    vm.addStrategy = function () {
        $httpRetry.addStrategy('test-strategy', {
          retry: {
            max: 2,
            interval: 1000
          },
          reAttempt: {
            max: 5,
            interval: 500,
            intervalMultiplicator: 1.2
          },
          group: 'TestCall'
        });
    };

    vm.addStrategy();

    vm.demoRequests = {
      basic: function () {
        $httpRetry
          .request(requestConfig)
          .retry()
          .run()
          .then(function (res) {
            // do something with the API response in res.data
          })
          .catch(function (err) {
            // handle error
            UIMessage.clearAllAndShow(err.message);
          });
        },
      customRetry: function () {
        $httpRetry
          .request(requestConfig)
          .retry({
            max: 3,
            interval: 1000,
          })
          .run()
          .then(function (res) {
            return res.data;
          })
          .catch(function (err) {
            UIMessage.clearAllAndShow(err.message);
          });
      },
      retryAndReAttempt: function () {
        $httpRetry
          .request(requestConfig)
          .retry()
          .reAttempt()
          .run()
          .then(function (res) {
            return res.data;
          })
          .catch(function (err) {
            UIMessage.clearAllAndShow(err.message);
          })
          .progress(function (msg) {
            UIMessage.show(msg.message);
          });
      },
      customRetryAndReAttempt: function () {
        $httpRetry
          .request(requestConfig)
          .retry({
            max: 3,
            interval: 1000,
          })
          .reAttempt({
            max: 3,
            interval: 750,
          })
          .run()
          .then(function (res) {
            return res.data;
          })
          .catch(function (err) {
            UIMessage.clearAllAndShow(err.message);
          })
          .progress(function (msg) {
            UIMessage.show(msg.message);
          });
      },
      customStrategy: function () {
        $httpRetry
          .request(requestConfig)
          .runStrategy('test-strategy')
          .then(function (res) {
            return res.data;
          })
          .catch(function (err) {
            UIMessage.clearAllAndShow(err.message);
          })
          .progress(function (msg) {
            UIMessage.show(msg.message);
          });
      }
    };

    vm.clearConsole = function () {
      console.clear();
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
    .factory('UIMessage', ['notify', UIMessage])
    .controller('demoCtrl', demoCtrl)
    .filter('parseFunctionBody', function () {
      return function (value) {
          return (!value) ? '' : value.match(/function[^{]+\{([\s\S]*)\}$/)[1];
      };
    })
    .filter('removeTabs', function () {
      return function (value) {
          return (!value) ? '' : value.replace(/        /g, '');
      };
    })
    .filter('removeTabs', function () {
      return function (value) {
          return (!value) ? '' : value.replace(/        /g, '');
      };
    });

}());
