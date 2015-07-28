/**
 * Name: Retry Module
 * Desc: $http wrapper which includes retry
 *         and circuit-breaker functionality.
 */
(function () {
  angular.module('autoRetry', []);

  function retryService($q, $timeout) {
    var breakCircuit   = false;
    var circuitTimeout = 10000; // ms
    var requestQueue   = [];
    var circuitBreakTime;

    /**
     * Flushes the requests in requestQueue,
     * one at a time
     */
    function flushRequestQueue() {
      console.log('flushing queue', requestQueue);
      requestQueue = [];
      console.log('Done flushing queue', requestQueue);
    }


    /**
     * Queues a single request
     */
    function queueRequest(request) {

      // reset the counter for this request
      request.attempts = 0;

      // push to queue
      requestQueue.push(request);

      if (request.debugEnabled) {
        console.info('Request was queued until network timeout is up.');
        console.warn('Current queue:', requestQueue);
      }

      request.response.notify({ err: 'queued' });
    }

    /**
     * Called the first time that retrying fails
     *
     * Sets flag to queue all future requests until
     * [circuitTimeout] ms have passed.
     */
    function queueFutureRequests(request) {
      breakCircuit     = true;
      circuitBreakTime = Date.now();

      if (request.debugEnabled) {
        console.error('Queuing future requests for', circuitTimeout, 'ms');
      }

      // queue the current request which failed
      queueRequest(request);

      $timeout(function () {
        breakCircuit = false;

        attemptQueuedRequests();
        console.info('Circuit timeout of', circuitTimeout, 'ms has been fulfilled.');
      }, circuitTimeout);
    }

    /**
     * Attempt making the request/promise
     */
    function attemptRequest(request) {

      request.promise().then(function (res) {
        request.response.resolve(res);
      }).catch(function handleFailedRequest() {

        if (request.debugEnabled) {
          console.info('request #', request.attempts + 1, 'failed.');
        }

        // increment failed attempts counter
        // for request
        request.attempts++;

        // if max retries for requests is not exceeded
        if (request.attempts < request.maxRetry) {

          if (request.debugEnabled) {
            console.info('retrying in', request.retryTimeout, 'ms');
          }

          // retry request after [request.retryTimeout] ms have passed
          $timeout(function () { attemptRequest(request); }, request.retryTimeout);

        } else {
          if (request.debugEnabled) {
            console.info('Limit of', request.maxRetry, 'requests reached.');
            console.info('Breaking retry cycle.');
          }

          queueFutureRequests(request);
          request.response.reject({ msg: 'Network is down. Please check your internet connection' });
        }

        return request.response.promise;
      });
    }

    /**
     * Attempt a single request
     * On Success: attempt all queued requests
     * On Failure: break circuit again
     */
    function attemptQueuedRequests() {
      var firstQueuedRequest = requestQueue.shift();
      attemptRequest(firstQueuedRequest);
    }

    return function (requestPromise, retryCount, timeOut, debug) {
      // gather parameters and set defaults
      var request  = {
        promise: requestPromise,
        maxRetry: retryCount || 3,
        retryTimeout: timeOut || 50,
        debugEnabled: debug,
        attempts: 0,
        response: $q.defer() // promise which will be returned by this service
      };

      // if a breakCircuit is in effect
      if (breakCircuit) {

        // queue the request for
        // when the circuit breaker
        // timeout has been reached
        queueRequest(request);

      } else {

        attemptRequest(request);

        if (request.debugEnabled) {
          console.info('breakCircuit =', breakCircuit);
          console.info('making $http request. Retry Info:', request.maxRetry, 'times @', request.retryTimeout, 'ms intervals');
        }

      }

      return request.response.promise;
    };

  }

  angular
    .module('autoRetry')
    .factory('Retry', ['$q', '$timeout', retryService]);

}());