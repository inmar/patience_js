<br/>
<h1 align="center">AJAX Retry</h1>

<h6 align="center">
  A promise-based AJAX library with retry strategies.
</h6>

<h5 align="center">
  <a href="#">Demo</a> &nbsp;|&nbsp; 
  <a href="#setup">Installation</a> &nbsp;|&nbsp; 
  <a href="#usage">Usage</a> &nbsp;|&nbsp;
  <a href="#setup">API</a>  
</h5>

## Installation

Download via [npm]() or [bower]().

```sh
$ npm install auto-retry --save
```

Add retry library and dependencies to HTML.

```html
<!-- AJAX Retry library-->
<script src="node_modules/auto-retry/dist/auto-retry.min.js"></script>
```

## Usage

For vanilla JS project:
```javascript
var retryCall = AjaxRetry();
```

For Angular.js library
```javascript
// inject auto-retry module into your app
angular.module('myApp', ['autoRetry']);
```

Basic usage of retry library in an angular service.

```js
// inject the $httpRetry service anywhere you would like to use auto-retry
angular.module('myApp').service('API', ['$httpRetry', function () {

  this.getUser = function (userId) {

      // Use retry functions to build and run a retry request
      return $httpRetry
              
              // ajax request params
              .request({ url: 'api.com/users/' + userId, method: 'GET' })
              
              // logical grouping
              .group('User')

              // retry
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

## API

**Please note** that if you are using Angular JS, replace `AjaxRetry` with `$httpRetry` in the examples below.

The AJAX Retry library provides the following chainable methods:


##### .request(requestParams)
 * **required**
 * Standard request parameters passed to [axios ajax helper library](https://github.com/mzabriskie/axios)

 Example: 

```js
AjaxRetry()
    .request({
      method: 'GET', 
      url: 'api.com/endpoint/3' });
```

##### .group(groupName)
 * A group to which the current request belongs.
 * If a request fails and is being retried or re-attempted, all requests for that group will be blocked until the retry/re-attempt cycle is complete
 * Options:
   * **groupName** (string): name of the group to which this retry AJAX call belongs

 Example: 

```js

AjaxRetry()
  .request({ 
      method: 'GET', 
      url: '/users/3' })
  .group('Users');

```

##### .retry(retryParams)

 * Sets the retry parameters for current chained request
 * If not used or null parameters are provided, defaults are used
   * Default options: `` { max: 2, interval: 100 } ``
     * **max** (int): the maximum number of times to retry the AJAX request before failing
     * **interval** (int): the interval of time, in milliseconds, to wait between each retry

 Examples:

```js

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

##### .reAttempt(reAttemptParams)
 * Sets the re-attempt parameters for current chained request
 * If not used, re-attempts will not occur
 * If null parameters are provided, defaults are used
   * Default options: `` { max: 3, interval: 1000, intervalMultiplicator: 1 } ``
   * **max** (int): the maximum number of times to re-attempt the AJAX request before failing
   * **interval** (int): the interval of time, in milliseconds, to wait between each re-attempt
   * **intervalMultiplicator** (int): Number to multiply the interval by upon each subsequent failure. Used for exponential or linear back-off strategies.

 Examples:

```js
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

##### .run()
 * **Required**
 * Runs the currently configured request
 * Options: none

 Example
```js
AjaxRetry()
  .request({ 
      method: 'GET', 
      url: 'api.com/endpoint/3' })
  .retry()
  .reAttempt()
  .run(); // executes the promise
```

##### .runStrategy(strategyName)
 * Run a pre-configured strategy
 * Strategies can be added with the `` addStrategy `` method
 Example

```js
AjaxRetry()
  .request({ 
      method: 'GET', 
      url: 'api.com/endpoint/3' })
  .runStrategy('UserCalls');
```

##### .addStrategy(strategyName, strategyOptions)
 * Adds strategy to the library for re-use later
 * You may add any combination of retry, reAttempt, group, and request parameters to a strategy
 * Required Options:
   * **strategyName**: (string) Name of the strategy
   * **strategyOptions** (Object):

```js
{
  group: 'profile-api-calls',
  retry: {
    max: 10,
    interval: 3000,
  },
  reAttempt: {
    max: 10,
    interval: 5000,
  }
}
```
