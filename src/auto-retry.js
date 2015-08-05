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
     * POJO of request-based logic and globals.
     * @type {Object}
     */
    var request = {
      isBlocked: false,
      intiate: function (providedRequestConfig, providedRetryConfig) {
        var httpConfig  = this.parseConfig(providedRequestConfig);

        if (this.isBlocked) {
          httpConfig.response.reject({ msg: 'Cannot process request at this time. Please wait or refresh browser and try again.' });
        } else {
          this.attempt(httpConfig, providedRetryConfig);
        }

        return httpConfig.response.promise;
      },
      attempt: function (httpConfig, providedRetryConfig) {

        var req = this;
        var retryConfig = retry.parseConfig(providedRetryConfig);

        $http(httpConfig).then(function (res) {

          httpConfig.response.resolve(res);

        }).catch(function () {

          // increment http attempt counter for this request
          httpConfig.attempts++;

          if (httpConfig.attempts >= retryConfig.max) {

            PubSub.publish('failedRetries', 'Max retried have been exhausted.');

            // reject the promise to the service consumer
            httpConfig.response.reject('Max retried exhausted.');

            if (retryConfig.reAttemptOnFailure) {

              req.setUpReAttemptInterval(httpConfig, retryConfig.failTimeout);

              // set a flag to block future requests
              req.isBlocked = true;

            }
          } else {
            req.attempt(httpConfig, retryConfig);
          }

        });
      },
      parseConfig: function (httpConfig) {
        httpConfig.response = $q.defer();
        httpConfig.attempts = 0;
        return httpConfig;
      },
      setUpReAttemptInterval: function (httpConfig, interval) {

        // setInterval to retry request
        var intervalPromise = $interval(function () {

          $http(httpConfig).then(function (res) {

            PubSub.publish('reAttemptSuccessful', {msg: 'Re-attempt was successful.'});

            // ISSUE: how to let the application
            // know that this occurred?
            httpConfig.response.resolve(res); // will not work since promise has already been rejec

            // no longer retry
            $interval.cancel(intervalPromise);
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