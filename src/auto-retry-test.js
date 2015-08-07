(function () {

  'use strict';

  var blockedUrls = [];
  var requestsBlocked = false;
  var options = {
    defaults: {
      retry: {
        max: 2,
        interval: 100,
        intervalMultiplicator: 1,
      },
      reAttempt: {
        max: 3,
        interval: 5000,
        intervalMultiplicator: 1,
      }
    },
    override: function (options, defaultOptions) {
      var resultConfig = {};

      Object.keys(defaultOptions).map(function (key) {
        resultConfig[key] = options[key] || defaultOptions[key];
      });

      return resultConfig;
    },
    parse: function (options, defaultOptions) {
      if (!options || Object.keys(options).length === 0) {
        return defaultOptions;
      } else {
        return this.override(options, defaultOptions);
      }
    }
  };
  var messages = {
    retryFailed: {
      msg: 'Request failed.'
    },
    reAttemptsFailed: {
      msg: 'Re-attempt of request failed.'
    }
  };

  var AjaxRetry = function (providedRequestConfig, providedRetryConfig) {

    return {
      _doRetry: function (response) {
        this._retryParams.maxRetry = this._retryParams.max;
        var self = this;

        // Retry
        Qretry(function () {

          return axios(self._requestParams);

        }, self._retryParams).then(function (res) {

          response.resolve(res);

        }).catch(function () {

          // block future calls
          requestsBlocked = true;

          PubSub.publish('retriesFailed', messages.retryFailed);
          response.notify(messages.retryFailed);

          self._doReAttempt(response);

        });

      },
      _doReAttempt: function (response) {

        this._reAttemptParams.maxRetry = this._reAttemptParams.max;
        var self = this;

        // Re-attempt
        Qretry(function () {

          return axios(self._requestParams);

        }, self._reAttemptParams).then(function (res) {

          requestsBlocked = false;
          response.resolve(res);

        }).catch(function (err) {

          requestsBlocked = false;
          PubSub.publish('reAttemptsFailed', messages.reAttemptsFailed);
          response.reject(messages.reAttemptsFailed);

        });

      },
      retry: function (params) {
        this._retryParams = options.parse(params, options.defaults.retry);
        return this;
      },
      request: function (params) {
        this._requestParams = params;
        return this;
      },
      reAttempt: function (params) {
        this._reAttemptParams = options.parse(params, options.defaults.reAttempt);
        return this;
      },
      run: function () {

        var response = Q.defer();

        if (requestsBlocked) {

          response.reject('nah, not now');

        } else {
          this._doRetry(response);
        }

        return response.promise;
      }
    };
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