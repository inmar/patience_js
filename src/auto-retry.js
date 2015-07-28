/**
 * Name: Retry Module
 * Desc: $http wrapper which includes retry 
 *         and circuit-breaker functionality.
 */
(function () {
  angular.module('autoRetry', []);

  function retryService($q, $timeout) {

    return function (request, retryCount, timeOut, debug) {
      var requestLimit   = retryCount || 3;
      var requestTimeout = timeOut || 50;
      var requestCount   = 0;
      var response       = $q.defer();

      if (debug) {
        console.warn('making $http request. Retry Info:', requestLimit, 'times @', requestTimeout, 'ms intervals');
      }

      // make a failing request [retryCount] times
      (function makeRequest() {

        request().then(function (res) {
          response.resolve(res);
        }).catch(function () {
          if (debug) {
            console.warn('request #', requestCount + 1, 'failed.');
          }

          requestCount++;

          if (requestCount < requestLimit) {

            if (debug) {
              console.warn('retrying in', requestTimeout, 'ms');
            }

            // retry request after [requestTimeout] ms have passed
            $timeout(makeRequest, requestTimeout);
          } else {
            if (debug) {
              console.warn('Limit of', requestLimit, 'requests reached.');
              console.warn('Breaking retry cycle.');
            }

            response.reject({ failed: true });
          }

        });
      }());

      return response.promise;
    };
  }

  angular
    .module('autoRetry')
    .factory('Retry', ['$q', '$timeout', retryService]);

})();