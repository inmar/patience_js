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
      maxReAttempts: 2
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

      }).catch(function (err) {

        // increment http attempt counter for this request
        httpConfig.attempts++;

        if (httpConfig.attempts >= retryConfig.max) {

          var rejectionMessage = 'Max retries exhausted.';

          // retries have failed, begin re-attempts
          if (retryConfig.reAttemptOnFailure) {

            req.setUpReAttemptInterval(httpConfig, retryConfig);

            // set a flag to block future requests
            req.isBlocked = true;

            httpConfig.response.notify();
          } else {
            httpConfig.response.reject(err);
          }

        } else {
          httpConfig.response.notify(httpConfig.attempts);
          req.attempt(httpConfig, retryConfig);
        }

      });
    },
    parseConfig: function (httpConfig) {
      httpConfig.response = Q.defer();
      httpConfig.attempts = 0;
      httpConfig._reAttempts = 0;
      return httpConfig;
    },
    reAttempt: function () {

      axios(httpConfig).then(function (res) {
        PubSub.publish('reAttemptSuccessful', {msg: 'Re-attempt was successful.'});

        // ISSUE: how to let the application know that this occurred?
        httpConfig.response.resolve(res);

      }).catch(function () {
        httpConfig._reAttempts++;
        self.reAttempt(httpConfig, interval, maxReAttempts)
        return;
      });

    },
    setUpReAttemptInterval: function reAttempt (httpConfig, retryConfig) {


      if (httpConfig._reAttempts >= retryConfig.maxReAttempts) {
        httpConfig.response.reject({ msg: 'Max re-attempts reached.'});
        return;
      };

      setTimeout(function () {

        axios(httpConfig).then(function (res) {
          PubSub.publish('reAttemptSuccessful', {msg: 'Re-attempt was successful.'});
          httpConfig.response.resolve(res);
        }).catch(function () {
          httpConfig._reAttempts++;
          reAttempt(httpConfig, retryConfig);
        });

      }, retryConfig.failTimeout);

    },
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