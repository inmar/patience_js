/**
 * Name: Retry Module
 * Desc: $http wrapper which includes retry functionality.
 *
 */
(function () {

  function httpRetry($http, $q, $interval) {

    /**
     * POJO of retry globals and functions.
     * @type {Object}
     */
    var retry = {
      defaults : {
      max: 3, // number of times to retry request
      interval: 50, // ms
      failTimeout: 5000, //ms
      reAttemptOnFailure: true,
      attempts: 0,
      },
      parseConfig: function (providedConfig) {
        if (!providedConfig || Object.keys(providedConfig).length === 0) {
          return this.defaults;
        } else {
          return this.overrideRetryDefaults(providedConfig);
        }
      },
      overrideRetryDefaults: function (providedConfig) {
        var resultConfig = {};
        var retry        = this;

        Object.keys(this.defaults).map(function (key) {
          resultConfig[key] = providedConfig[key] || retry.defaults[key];
        });

        return resultConfig;
      },
      checkIfPubSubJSIsPresent: function () {
        if (PubSub === 'undefined') {
          console.group('PubSubJS dependency was not found.');
          console.error('Please npm install auto-retry dependencies.');
          console.error('Add dependent scripts to HTML.');
          console.groupEnd();
          return false;
        }

        return true;
      }
    };

    /**
     * POJO of queue operations and globals.
     * @type {Object}
     */
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

    /**
     * POJO of request-based logic and globals.
     * @type {Object}
     */
    var request = {
      isBlocked: false,
      intiate: function (providedRequestConfig, providedRetryConfig) {
        var httpConfig  = this.parseConfig(providedRequestConfig);
        var retryConfig = retry.parseConfig(providedRetryConfig);

        if (this.isBlocked) {
          queue.add(httpConfig);
          httpConfig.response.reject({ msg: 'Max retried exhausted.' });
        } else {
          this.attempt(httpConfig, retryConfig);
        }

        return httpConfig.response.promise;
      },
      attempt: function (httpConfig, retry) {

        var self = this;

        $http(httpConfig).then(function (res) {

          httpConfig.response.resolve(res);

        }).catch(function () {

          // increment http attempt counter for this request
          retry.attempts++;

          if (retry.attempts >= retry.max) {

            PubSub.publish('failedRetries', 'Max retried have been exhausted.');

            // reject the promise to the service consumer
            httpConfig.response.reject('Max retried exhausted.');

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
        config.response = $q.defer();
        return config;
      },
      setUpReAttemptInterval: function (httpConfig, interval) {

        // setInterval to retry request
        var intervalPromise = $interval(function () {

          $http(httpConfig).then(function (res) {

            PubSub.publish('reAttemptSuccessful', { msg: 'Re-attempt was successful.'});

            // ISSUE: how to let the application
            // know that this occurred?
            httpConfig.response.resolve(res); // will not work since promise has already been rejec

            // no longer retry
            $interval.cancel(intervalPromise);

            // release queued requests
            queue.flush();
          });

        }, interval);
      }
    };

    return function (providedHttpConfig, providedRetryConfig) {

      retry.checkIfPubSubJSIsPresent();

      // Make the AJAX request
      return request.intiate(providedHttpConfig, providedRetryConfig);
    };

  }

  angular.module('autoRetry', []);

  angular
    .module('autoRetry')
    .factory('$httpRetry', ['$http', '$q', '$interval', httpRetry]);

}());