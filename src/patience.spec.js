describe('PatienceJS', function(){

    var retry;

    beforeEach(function(){
      retry = require('./patience.js')();
    });

    it('should be present', function(){
      expect(retry).not.toBeNull();
    });

    var requestParams = {
        method: 'GET',
        url: 'http://localhost:8080'
    };

    describe('All Requests', function(){

      it('should return a promise', function(){
        var retryPromise = retry
                            .request(requestParams)
                            .retry()
                            .run()
                            .then;

        expect(retryPromise).not.toBeNull();
      });
    });

    describe('Group Feature', function(){

      it('should set group options', function(){
        var group = 'testing2321';

        var groupCall = retry
                          .request(requestParams)
                          .retry()
                          .group(group);

        expect(groupCall._options.group).toEqual(group);
      });

      it('should return object reference (this)', function(){
        var retryCallResult = retry.request(requestParams).group();
        expect(retryCallResult).toEqual(jasmine.any(Object));
      });

    });

    describe('Request Feature', function(){

      it('should set request options', function(){
        var requestParams = { method: '32r', url: '/fdsgs/' };

        var requestCall = retry
                            .request(requestParams)
                            .retry();

        expect(requestCall._options.request).toEqual(requestParams);
      });

      it('should return object reference (this)', function(){
        var retryCallResult = retry.request(requestParams);
        expect(retryCallResult).toEqual(jasmine.any(Object));
      });

    });

    describe('Retry Functionality', function(){

      var requestParams, customRetryParams;

      beforeEach(function(){

        requestParams = {
          method: "GET",
          url: "/fake/url"
        };

        customRetryParams   = {
          max: 15,
          interval: 500,
        };

      });

      it('should set default retry parameters', function () {

        var defaultRetryCall = retry
                                .request(requestParams)
                                .retry()
                                .reAttempt();

        var defaults = {
          max: 2,
          interval: 100,
          intervalMultiplicator: 1,
          maxRetry: 2,
        };

        expect(defaultRetryCall._options.retry).toEqual(defaults);
      });

      it('should override default retry params with custom call', function(){
        var customRetryCall = retry
                                .request(requestParams)
                                .retry(customRetryParams)
                                .reAttempt();

        var expectedRetryOptions = customRetryParams;
        expectedRetryOptions.intervalMultiplicator = 1;
        expectedRetryOptions.maxRetry = 2;

        expect(customRetryCall._options.retry).toEqual(expectedRetryOptions);

      });

      it('should return object reference (this)', function(){
        var retryCallResult = retry.request(requestParams).retry();
        expect(retryCallResult).toEqual(jasmine.any(Object));
        expect(retryCallResult.reAttempt({})).toEqual(retryCallResult);
      });
    });

    describe('Re-attempt Functionality', function () {

        it('should set default re-attempt options', function () {

          var retryCall = retry
                          .request()
                          .retry()
                          .reAttempt();

          var expected = {
              max: 3,
              interval: 1000,
              intervalMultiplicator: 1,
          };

          expect(retryCall._options.reAttempt).toEqual(expected);
        });

        it('should override default options for re-attempt', function () {

          var reattemptParams = {
            max: 100,
            interval: 845348
          };

          var customRetryCall = retry
                                .request({ url: '', method: ''})
                                .retry()
                                .reAttempt(reattemptParams);

          var expected = {
              max: reattemptParams.max,
              intervalMultiplicator: 1,
              interval: reattemptParams.interval
          };

          expect(customRetryCall._options.reAttempt).toEqual(expected);
        });

    });

    describe('Strategy Functionality', function () {

      var strategyCall;
      beforeEach(function () {

        retry.addStrategy('test-strategy', { request: { max: 100 } });
        strategyCall = retry.group('32532l');
      });

      it('should allow setting of a strategy', function () {

        strategyCall.runStrategy('test-strategy');

        expect(strategyCall._options.request.max).toEqual(100);

      });

      it('should print error message when unknown strategy is called', function () {

        spyOn(console, 'error').and.callThrough();

        strategyCall.runStrategy('test');

        expect(console.error.calls.any()).toEqual(true);

      });

      it('should call run if successful', function () {

        spyOn(strategyCall, 'run').and.callThrough();

        strategyCall.runStrategy('test-strategy');

        expect(strategyCall.run.calls.any()).toEqual(true);

      });

    });
});
