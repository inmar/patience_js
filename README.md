<h1 align="center">
  <img align="center" width="200" src="./inmar-logo-transparent.png" alt="Inmar Inc. Logo"><br/><br/>
  Patience JS
</h1>

<h6 align="center">
  A promise-based request library with retry strategies.
</h6>

<h5 align="center">
  <a href="http://inmar.github.io/patience-js/">Demo</a> &nbsp;|&nbsp; 
  <a href="#installation">Installation</a> &nbsp;|&nbsp; 
  <a href="#usage">Usage</a> &nbsp;|&nbsp;
  <a href="#api">API</a>  
</h5>

## Installation

Download via [npm](https://www.npmjs.com/package/patience-js).

```sh
$ npm install patience-js --save
```

Add **Patience** to your project:

```html
<!-- PatienceJS-->
<script src="node_modules/patience-js/dist/patience.min.js"></script>
```

## Usage

For a vanilla JavaScript project:
```javascript
var retryCall = Patience();
```

For an Angular.js module:
```javascript

// First, inject PatienceJS module into your app
angular.module('myApp', ['PatienceJS']);

// Then, use the $httpRetry service anywhere you would like to use PatienceJS
angular.module('myApp').service('API', ['$httpRetry', function () {

  this.getUser = function (userId) {

      // Build and run a retry request
      return $httpRetry
              
              // ajax request params
              .request({ 
                url: 'api.com/users/' + userId, 
                method: 'GET' })
              
              // logical grouping
              .group('User')

              // retry
              .retry({ 
                max: 1, 
                interval: 500 })
              
              // re-attempts occur after retries have failed
              .reAttempt({ 
                max: 1, 
                interval: 2000 })
              
              .run() // returns a Promise
              
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

**Please note** that if you are using Angular JS, replace `Patience()` with `$httpRetry` in the examples below.

PatienceJS provides the following chainable methods:

| Method | Description |
|---|---|
|[.request()](#requestrequestparams) | Standard request parameters for AJAX request |
|[.group()](#groupgroupname) | Assign a group to which the current request belongs |
|[.retry()](#retryretryparams) | Overrides the default retry configuration |
|[.reAttempt()](#reattemptreattemptparams) | Enables and configures re-attempts |
|[.run()](#run) | Runs the currently chained Patience request |
|[.addStrategy()](#addstrategystrategyname-strategyoptions) | Configures a "strategy" which can be re-used between requests |
|[.runStrategy()](#runstrategystrategyname) | Run a pre-configured strategy |

<br/>
##### .request(requestParams)
 * **required**
 * Standard request parameters passed to [axios AJAX helper library](https://github.com/mzabriskie/axios#example)

 Example: 

```js
Patience()
    .request({
      method: 'GET', 
      url: 'api.com/endpoint/3' })
    .run();
```

<br/>
##### .group(groupName)
 * A group to which the current request belongs.
 * If a request fails and is being retried or re-attempted, all requests for that group will be blocked until the retry/re-attempt cycle is complete
 * Parameters:
    * **groupName** (string): name of the group to which this retry AJAX call belongs

 Example: 

```js

Patience()
  .request({ 
      method: 'GET', 
      url: '/users/3' })
  .group('Users')
  .run();

```

<br/>
##### .retry(retryParams)

 * Sets the retry strategy based on parameters
 * If not used or null parameters are provided, default values are used
   * Default Value: `` { max: 2, interval: 100 } ``
 * Parameters:
     * **max** (int): the maximum number of times to retry the request before failing
     * **interval** (int): the interval of time, in milliseconds, to wait between each retry

 Examples:

```js

// Using default retry options
Patience()
  .request({ 
      method: 'GET', 
      url: 'api.com/endpoint/3' })
  .retry();

// Using custom retry options
 Patience()
    .request({ 
        method: 'GET', 
        url: 'api.com/endpoint/3' })
    .retry({ 
        max: 10, 
        interval: 1000 })
    .run();
```

<br/>
##### .reAttempt(reAttemptParams)
 * Sets the re-attempt parameters
 * If this method is not used, re-attempts will not occur
 * If null parameters are provided, default values are used
   * Default values: `` { max: 3, interval: 1000, intervalMultiplicator: 1 } ``
 * Parameters 
     * **max** (int): the maximum number of times to re-attempt the request before failing
     * **interval** (int): the interval of time, in milliseconds, to wait between each re-attempt
     * **intervalMultiplicator** (int): Number to multiply the interval by upon each subsequent failure. Used for exponential or linear back-off strategies.

 Examples:

```js
 // Using default re-attempt options
 Patience()
  .request({ 
      method: 'GET', 
      url: 'api.com/endpoint/3' })
  .retry()
  .reAttempt()
  .run();

// Using custom re-attempt options
 Patience()
  .request({ 
      method: 'GET', 
      url: 'api.com/endpoint/3' })
  .retry()
  .reAttempt({
      max: 5,
      interval: 3000 })
  .run();
```

<br/>
##### .run()
 * **Required** in order to execute the request.
 * Runs the currently configured request
 * Parameters: *None*
 * **Note**: This method is not chainable.

 Example
```js
Patience()
  .request({ 
      method: 'GET', 
      url: 'api.com/endpoint/3' })
  .retry()
  .reAttempt()
  .run(); // executes the configured Patience request and returns a promise
```

<br/>
##### .addStrategy(strategyName, strategyOptions)
 * Configures a strategy which can be re-used between requests
 * You may add any combination of *retry*, *re-attempt*, *group*, and *request* parameters to a strategy
 * Parameters:
     * **strategyName** (string): Name of the strategy
     * **strategyOptions** (Object): Patience options for the strategy

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

<br/>
##### .runStrategy(strategyName)
 * Run a pre-configured strategy
 * Strategies can be added with the `` addStrategy `` method
 * Parameters:
    * **strategyName** (string): Name of the strategy to run
 
 Example

```js
// this request will use configurations from "profile-api-calls" strategy
Patience()
  .request({ 
      method: 'GET', 
      url: 'api.com/endpoint/3' })
  .runStrategy('profile-api-calls'); 

```

