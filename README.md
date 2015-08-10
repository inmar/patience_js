# Auto AJAX Retry
-------

A promise-based AJAX helper library with highly customizable retry strategies.

## Install
-------

```
npm install auto-retry --save
```
Add retry library and dependencies to HTML.

```html
      <!-- Retry module and dependencies -->
      <script src="../node_modules/q/q.js"></script>
      <script src="../node_modules/qretry/build/qretry.min.js"></script>
      <script src="../node_modules/axios/dist/axios.min.js"></script>
      <script src="../node_modules/pubsub-js/src/pubsub.js"></script>
      <script src="../src/auto-retry.js"></script>
      <script src="../src/auto-retry-angular.js"></script> <!-- Optional: Angular wrapper for auto-retry -->
```

## Setup
-------

For vanilla JS project:
```javascript
    var retryCall = AjaxRetry();
```

For Angular.js library
```javascript
    // inject auto-retry module into your app
    angular.module('myApp', ['autoRetry']);
```

## Usage
-------

Basic usage of retry library in an angular service.
```
 
    // inject the httpRetry service anywhere you would like to use auto-retry
    angular.module('myApp').service('API', ['$httpRetry', function () {
        
        this.getUser = function (userId) {
            
            /**
            * Use retry functions to build and run a retry request
            **/
            return $httpRetry
                          .request({ url: 'api.com/users/' + userId, method: 'GET' })
                          .group('User')
                          .retry({ max: 1, interval: 500 })
                          .reAttempt({ max: 1, interval: 2000 })
                          .run() // returns a promise
                          .then(function (res) {
                            return res;
                          })
                          .catch(function (err) {
                            //
                          })
                          .progress(function (msg) {
                            // 
                          });
        };
    }]);
```

## Advanced
-------

Build named retry strategies for requests once and reuse across an application or multiple applications.

## API
-------

For Angular usage, simply replace the `` AjaxRetry().x `` with `` $httpRetry.x `` for each API example.

### AjaxRetry().request(requestParams)
* **required**
* Standard request parameters passed to [axios ajax helper library](https://github.com/mzabriskie/axios)

Example: 
  ```
    AjaxRetry()
        .request({
            method: 'GET', 
            url: 'api.com/endpoint/3' });
  ```
 
 ### AjaxRetry().group(requestParams)
* A group to which the current request belongs.
* If a request fails and is being retried or re-attempted, all requests for that group will be blocked until the retry/re-attempt cycle is complete

Example: 
  ```
    AjaxRetry()
        .request({ 
            method: 'GET', 
            url: '/users/3' })
        .group('Users');
  ```
 
 ### AjaxRetry().retry(retryParams)
 * Sets the retry parameters for current chained request
 * If not used or null parameters are provided, defaults are used
   * Default options: `` { max: 2, interval: 100 } ``
     * **max**: the maximum number of times to retry the AJAX request before failing
     * **interval**: the interval of time, in milliseconds, to wait between each retry
   
Examples:
  ```
     // Using default retry options
     AjaxRetry()
        .request({ 
            method: 'GET', 
            url: 'api.com/endpoint/3' })
        .retry();
    
    // Using custom retry options
     AjaxRetry()
        .request({ 
            method: 'GET', 
            url: 'api.com/endpoint/3' })
        .retry({ 
            max: 10, 
            interval: 1000 });
 ```
 
 ### AjaxRetry().reAttempt(reAttemptParams)
 * Sets the re-attempt parameters for current chained request
 * If not used, re-attempts will not occur
 * If null parameters are provided, defaults are used
   * Default options: `` { max: 3, interval: 1000, intervalMultiplicator: 1 } ``
   * **max**: the maximum number of times to re-attempt the AJAX request before failing
   * **interval**: the interval of time, in milliseconds, to wait between each re-attempt
   * **intervalMultiplicator**: Number to multiply the interval by upon each subsequent failure. Used for exponential or linear back-off strategies.
 
Examples:
  ```
     // Using default re-attempt options
     AjaxRetry()
        .request({ 
            method: 'GET', 
            url: 'api.com/endpoint/3' })
        .retry()
        .reAttempt();
    
    // Using custom re-attempt options
     AjaxRetry()
        .request({ 
            method: 'GET', 
            url: 'api.com/endpoint/3' })
        .retry()
        .reAttempt({
            max: 5,
            interval: 3000 });
 ```
