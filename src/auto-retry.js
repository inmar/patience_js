/**
 * Name: Retry Module
 * Desc: $http wrapper which includes retry functionality.
 *
 */
(function () {

  function httpRetry($http, $q, $interval) {

    var denyAllRequests = false;

    var goodRequestConfig = {
      method: 'GET',
      url: 'http://localhost:8080'
    };

    var defaultRetryConfig = {
      max: 3, // number of times to retry request
      interval: 50, // ms
      failTimeout: 5000, //ms
      reAttemptOnFailure: true,
      attempts: 0,
    };

    var getRequestParams = {
      method: 'GET',
    };

    function denyAllFutureRequests() {
      denyAllRequests = true;
    }

    function parseConfig(config) {
      var parsedConfig = {};

      // check for usage of get request short-hand
      if (typeof config === 'string') {
        parsedConfig     = angular.copy(getRequestParams);
        parsedConfig.url = config;
      } else {
        parsedConfig = config;
      }

      return parsedConfig;
    }

    function setUpReAttemptInterval(httpConfig, interval) {

      // setInterval to retry request
      var intervalPromise = $interval(function () {

        $http(httpConfig).then(function (res) {

          // ISSUE: how to let the application
          // know that this occurred?
          httpConfig.promise.resolve(res); // will not work since promise has already been rejected

          // no longer retry
          $interval.cancel(intervalPromise);
        });

      }, interval);

    }

    function makeRequest(httpConfig, retry) {

      $http(httpConfig).then(function (res) {

        httpConfig.promise.resolve(res);

      }).catch(function () {

        // increment http attempt counter for this request
        retry.attempts++;

        if (retry.attempts >= retry.max) {

          // reject the promise to the service consumer
          httpConfig.promise.reject('Max retried exhausted.');

          if (retry.reAttemptOnFailure) {

            setUpReAttemptInterval(httpConfig, retry.failTimeout);
            denyAllFutureRequests();

          }

        } else {
          makeRequest(httpConfig, retry);
        }

      });
    }

    return function (providedRequestConfig) {

      var response = $q.defer();

      // build $http compatible config
      var requestConfig     = parseConfig(providedRequestConfig);
      requestConfig.promise = response;

      // retry configurations
      var retryConfig = defaultRetryConfig;

      if (denyAllRequests) {

        console.log('sorry, all requests are currently blocked.');
        requestConfig.promise.reject('Max retried exhausted.');

      } else {

        // make $http request
        makeRequest(requestConfig, retryConfig);
      }

      return response.promise;
    };

  }

  angular.module('autoRetry', []);

  angular
    .module('autoRetry')
    .factory('$httpRetry', ['$http', '$q', '$interval', httpRetry]);

}());