/**
 * Name: Retry Module
 * Desc: $http wrapper which includes retry functionality.
 *
 */
(function () {

  function httpRetry($http, $q, $interval) {

    if (PubSub === 'undefined') {
      console.group('PubSubJS dependency was not found.');
      console.error('Please npm install auto-retry dependencies.');
      console.error('Add dependent scripts to HTML.');
      console.groupEnd();
    }

    var defaults = {
      max: 3, // number of times to retry request
      interval: 50, // ms
      failTimeout: 5000, //ms
      reAttemptOnFailure: true,
      attempts: 0,
    };

    var queue = {
      requests: [],
      add: function (httpConfig) {
        this.requests.push(httpConfig);
      },
      flush: function () {
        // ISSUE: attempting to fullfil
        // backlog http requests will flood server,
        // and cause performance issues.
        // Trying to control their flow will cause complexity.
        this.requests = [];
      }
    };

    var request = {
      isBlocked: false,
      attempt: function (httpConfig, retry) {

        var self = this;

        $http(httpConfig).then(function (res) {

          httpConfig.promise.resolve(res);

        }).catch(function () {

          // increment http attempt counter for this request
          retry.attempts++;

          if (retry.attempts >= retry.max) {

            PubSub.publish('failedRetries', 'Max retried have been exhausted.');

            // reject the promise to the service consumer
            httpConfig.promise.reject('Max retried exhausted.');

            if (retry.reAttemptOnFailure) {

              self.setUpReAttemptInterval(httpConfig, retry.failTimeout);

              // set a flag to block future requests
              self.isBlocked = true;

            }
          } else {
            self.attempt(httpConfig, retry);
          }

        });
      },
      parseConfig: function (config) {
        var parsedConfig = {};

        // check for usage of get request short-hand
        if (typeof config === 'string') {
          parsedConfig = {
            url: config,
            method: 'GET',
          };
        } else {
          parsedConfig = config;
        }

        return parsedConfig;
      },
      setUpReAttemptInterval: function (httpConfig, interval) {

        // setInterval to retry request
        var intervalPromise = $interval(function () {

          $http(httpConfig).then(function (res) {

            PubSub.publish('reAttemptSuccessful', { msg: 'Re-attempt was successful.'});

            // ISSUE: how to let the application
            // know that this occurred?
            httpConfig.promise.resolve(res); // will not work since promise has already been rejec

            // no longer retry
            $interval.cancel(intervalPromise);

            // release queued requests
            queue.flush();
          });

        }, interval);
      }
    };

    return function (providedRequestConfig, retryConfig) {

      var response = $q.defer();

      // build $http compatible config
      var httpConfig     = request.parseConfig(providedRequestConfig);

      // attach a promise, which represents
      // a response to request
      httpConfig.promise = response;

      // retry configurations
      var retryConfig    = defaults;

      if (request.isBlocked) {

        queue.add(httpConfig);

        httpConfig.promise.reject({ msg: 'Max retried exhausted.' });

      } else {

        // make $http request
        request.attempt(httpConfig, retryConfig);
      }

      return response.promise;
    };

  }

  angular.module('autoRetry', []);

  angular
    .module('autoRetry')
    .factory('$httpRetry', ['$http', '$q', '$interval', httpRetry]);

}());