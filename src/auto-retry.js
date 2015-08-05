(function () {

  'use strict';

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
    initiate: function (providedRequestConfig, providedRetryConfig, $httpLibrary, $promiseLibrary) {

      var httpConfig  = request.parseConfig(providedRequestConfig);

      if (request.isBlocked) {
        httpConfig.response.reject({ msg: 'Cannot process request at this time. Please wait or refresh browser and try again.' });
      } else {
        request.attempt(httpConfig, providedRetryConfig);
      }

      return httpConfig.response.promise;
    }
  };

  /**
   * POJO of request-based logic and globals.
   * @type {Object}
   */
  var request = {
    isBlocked: false,
    attempt: function (httpConfig, providedRetryConfig) {

      var req = this;
      var retryConfig = retry.parseConfig(providedRetryConfig);

      axios(httpConfig).then(function (res) {

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
      httpConfig.response = Q.defer();
      httpConfig.attempts = 0;
      return httpConfig;
    },
    setUpReAttemptInterval: function (httpConfig, interval) {

      // setInterval to retry request
      var intervalPromise = setInterval(function () {

        axios(httpConfig).then(function (res) {

          PubSub.publish('reAttemptSuccessful', {msg: 'Re-attempt was successful.'});

          // ISSUE: how to let the application
          // know that this occurred?
          httpConfig.response.resolve(res); // will not work since promise has already been rejec

          // no longer retry
          clearInterval(intervalPromise);
        }).catch(function () {
          // prevents uncaught promise failure warning
          return;
        });

      }, interval);
    }
  };

  var AjaxRetry = function (providedRequestConfig, providedRetryConfig) {

    return retry.initiate(providedRequestConfig, providedRetryConfig);

  };

  (function(name, obj) {

      var commonJS = typeof module != 'undefined' && module.exports;

      if (commonJS) {
          module.exports = obj;
      }
      else {
          window[name] = obj;
      }
  })('AjaxRetry', AjaxRetry);

})();