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

    describe('Initial Call', function(){

        it('should return a promise', function(){
            var ajaxRetryPromise = ajaxRetry
                                        .request(requestParams)
                                        .retry()
                                        .run()
                                        .then;

            expect(ajaxRetryPromise).not.toBeNull();
        });
    });

    describe('Retry Functionality', function(){

        var requestParams, customRetryParams, firstRetry;

        beforeEach(function(){
            requestParams = {};
            customRetryParams   = {
                max: 15,
                interval: -5,
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
                console.log('sadgsaga');
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
                maxRetry: 1,
            };

            expect(args[1]).toEqual(defaults);
        });

        it('should override default retry params with custom call', function(){

            var args = window.Qretry.calls.argsFor(1);
            var expectedArgs = {
                max: customRetryParams.max,
                interval: customRetryParams.interval,
                intervalMultiplicator: 1,
                maxRetry: customRetryParams.max - 1
            };

            expect(args[1]).toEqual(expectedArgs);
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
                interval: '845348'
            };

            var customRetryCall = ajaxRetry
                                .request()
                                .retry()
                                .reAttempt(reattemptParams);

            customRetryCall._doReAttempt();

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

});