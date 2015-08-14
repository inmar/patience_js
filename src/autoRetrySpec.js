describe('--', function(){

    var ajaxRetry;

    beforeEach(function(){
        ajaxRetry = AjaxRetry();
    });

    it('should be present', function(){
        expect(ajaxRetry).not.toBeNull();
    });

    var requestParams = {
        method: 'GET',
        url: 'http://localhost:8080'
    };

    describe('All Requests', function(){

        it('should return a promise', function(){
            var ajaxRetryPromise = ajaxRetry
                                        .request(requestParams)
                                        .retry()
                                        .run()
                                        .then;

            expect(ajaxRetryPromise).not.toBeNull();
        });
    });

    describe('Group Feature', function(){

        it('should set group options', function(){
            var group = 'testing2321';

            var groupCall = ajaxRetry
                              .request(requestParams)
                              .retry()
                              .group(group);

            expect(groupCall._options.group).toEqual(group);
        });

        it('should return object reference (this)', function(){
            var retryCallResult = ajaxRetry.request(requestParams).group();
            expect(retryCallResult).toEqual(jasmine.any(Object));
        });

    });

    describe('Request Feature', function(){

        it('should set request options', function(){
            var requestParams = { method: '32r', url: '/fdsgs/' };

            var requestCall = ajaxRetry
                                .request(requestParams)
                                .retry();

            expect(requestCall._options.request).toEqual(requestParams);
        });

        it('should return object reference (this)', function(){
            var retryCallResult = ajaxRetry.request(requestParams);
            expect(retryCallResult).toEqual(jasmine.any(Object));
        });

    });

    describe('Retry Functionality', function(){

        var requestParams, customRetryParams, firstRetry;

        beforeEach(function(){
            requestParams = {};
            customRetryParams   = {
                max: 15,
                interval: 500,
            };

            spyOn(window, 'Qretry').and.callThrough();

            // first call
            ajaxRetry
                .request(requestParams)
                .retry()
                .reAttempt()
                .run();

            // second call
            firstRetry = ajaxRetry
                .request(requestParams)
                .retry(customRetryParams)
                .reAttempt();

            spyOn(firstRetry, '_doRequest').and.callFake(function () {
            });

            firstRetry.run();

        });

        it('should call Qretry to setup retry strategy', function(){
            expect(window.Qretry.calls.any()).toEqual(true);
        });

        it('should call Qretry with default retry params', function(){
            var args = window.Qretry.calls.argsFor(0);
            var defaults = {
                max: 2,
                interval: 100,
                intervalMultiplicator: 1,
                maxRetry: 2,
            };

            expect(args[1]).toEqual(defaults);
        });

        it('should override default retry params with custom call', function(){

            var args = window.Qretry.calls.argsFor(1);
            var expectedArgs = {
                max: customRetryParams.max,
                interval: customRetryParams.interval,
                intervalMultiplicator: 1,
                maxRetry: customRetryParams.max
            };

            expect(args[1]).toEqual(expectedArgs);
        });

        it('should return object reference (this)', function(){
            var retryCallResult = ajaxRetry.request(requestParams).retry();
            expect(retryCallResult).toEqual(jasmine.any(Object));
        });
    });

    describe('Re-attempt Functionality', function () {

        var customRetryCall, reattemptParams;

        beforeEach(function () {
            spyOn(window, 'Qretry').and.callThrough();
        });

        it('should call Qretry with re-attempt default options', function () {

            var retryCall = ajaxRetry
                            .request()
                            .retry()
                            .reAttempt();

            retryCall._doReAttempt();

            var args = Qretry.calls.argsFor(0);
            var expected = {
                max: 3,
                interval: 1000,
                intervalMultiplicator: 1,
                maxRetry: 2,
            };

            expect(args[1]).toEqual(expected);
        });

        it('should override default options for re-attempt', function () {

            var reattemptParams = {
                max: 100,
                interval: 845348
            };

            var customRetryCall = ajaxRetry
                                .request({ url: '', method: ''})
                                .retry()
                                .reAttempt(reattemptParams);

            customRetryCall._configure();
            customRetryCall._doReAttempt({});

            var args = Qretry.calls.argsFor(0);
            var expected = {
                max: reattemptParams.max,
                maxRetry: reattemptParams.max - 1,
                intervalMultiplicator: 1,
                interval: reattemptParams.interval
            };

            expect(args[1]).toEqual(expected);
        });

    });

    describe('Strategy Functionality', function () {

      var strategyCall;
      beforeEach(function () {

        ajaxRetry.addStrategy('test-strategy', { request: { max: 100 } });
        strategyCall = ajaxRetry.group('32532l');
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
