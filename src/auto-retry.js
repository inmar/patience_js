(function () {

  'use strict';

  /**
   * Stores and manages singleton (static)
   * data for blocked API endpoint groups
   *
   * @type {Object}
   */
  var blockedGroups = {
    list: [],
    add: function (groupName) {
      if (!this.contains(groupName)) {
        this.list.push(groupName);
      }
    },
    remove: function (groupName) {
      var groupIndex = this.list.indexOf(groupName);

      if (groupIndex > -1) {
        this.list.splice(groupIndex, 1);
      }
    },
    contains: function (groupName) {
      return (this.list.indexOf(groupName) > -1);
    }
  };

  /**
   * Library default options &
   * option-related helper functions
   *
   * @type {Object}
   */
  var options = {
    defaults: {
      retry: {
        max: 2,
        interval: 100,
        intervalMultiplicator: 1,
      },
      reAttempt: {
        max: 3,
        interval: 1000,
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

  /**
   * Default library message texts
   *
   * @type {Object}
   */
  var messages = {
    retryFailed: 'Request failed.',
    reAttemptsFailed: 'Re-attempts of request failed.',
    requestsBlocked: 'Requests are currently blocked by Retry library.',
  };

  /**
   * AJAX Retry library initializing function
   */
  var AjaxRetry = function () {

    return {
      _options: {},
      _configure: function () {

        // if retry options are not present
        if (this._options.retry === undefined) {
          // call options setter to populate defaults
          this.retry();
        }

        // if group was not set,
        if (this._options.group === undefined) {
          // assume request url as group
          this.group(this._options.request.url); 
        }

        // Qretry options key translation
        this._options.retry.maxRetry = this._options.retry.max;

        // Qretry param interpretation.
        // Re-attempts are a total sum in this library
        this._options.reAttempt.maxRetry = this._options.reAttempt.max - 1;
      },
      _doRequest: function () {
        return axios(this._options.request);
      },
      _doRetry: function (response) {
        var self = this;

        // Retry
        Qretry(function () {

          return self._doRequest();

        }, self._options.retry).then(function (res) {

          // original request or retry succeeded.
          // resolve http response
          response.resolve(res);

        }).catch(function () {

          PubSub.publish('retriesFailed', messages.retryFailed);
          response.notify(messages.retryFailed);

          if (self._options.reAttempt) {

            // block future async calls
            blockedGroups.add(self._options.group);

            // start re-attempt
            self._doReAttempt(response);

          } else {
            response.reject(retryFailed);
          }

        });
      },
      _doReAttempt: function (response) {

        var self = this;

        // Re-attempt
        Qretry(function () {

          return axios(self._options.request);

        }, self._options.reAttempt).then(function (res) {

          // successful re-attempt
          blockedGroups.remove(self._options.group);
          response.resolve(res);

        }).catch(function (err) {

          // all re-attempts failed.
          blockedGroups.remove(self._options.group);
          PubSub.publish('reAttemptsFailed', messages.reAttemptsFailed);
          response.reject(messages.reAttemptsFailed);

        });
      },
      retry: function (params) {
        this._options.retry = options.parse(params, options.defaults.retry);
        return this;
      },
      request: function (params) {
        this._options.request = params;
        return this;
      },
      reAttempt: function (params) {
        this._options.reAttempt = options.parse(params, options.defaults.reAttempt);
        return this;
      },
      group: function (name) {
        this._options.group = name;
        return this;
      },
      run: function () {

        this._configure();

        var response = Q.defer();

        if (blockedGroups.contains(this._options.group)) {

          response.reject(messages.requestsBlocked);

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