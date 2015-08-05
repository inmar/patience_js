
describe('--', function(){

    var ajaxRetry;

    beforeEach(function(){
        ajaxRetry = AjaxRetry;
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
            expect(ajaxRetry(requestParams).then).not.toBeNull();
        });
    });

    describe('Retry Functionality', function(){

        var requestParams, axiosStub;

        beforeEach(function(){
            // stub the axios ajax library
            // stub it as a promise
            axiosStub = sinon.stub(window, 'axios').returnsPromise();

            requestParams = {};
        });

        afterEach(function () {
            window.axios.restore()
        });

        it('should call axios library for AJAX', function(){
            axiosStub.resolves({});
            ajaxRetry(requestParams);

            expect(axiosStub.callCount).toEqual(1);
        });

        it('should retry according to default preset', function(){
            axiosStub.rejects({});
            ajaxRetry(requestParams);

            expect(axiosStub.callCount).toEqual(3);
        });

        it('should retry according to provided config', function(){

            var retryConfig = { max: 5 };

            axiosStub.rejects({});
            ajaxRetry(requestParams, retryConfig);

            expect(axiosStub.callCount).toEqual(5);
        });

    });

    describe('Retry Configure', function(){

        var requestParams;

        beforeEach(function(){
            // stub the axios ajax library
            // stub it as a promise
            axiosStub = sinon.stub(window, 'axios').returnsPromise();

            requestParams = {};
        });

        it('should retry according to provided config', function(){

            var retryConfig = { max: 5 };

            axiosStub.rejects({});
            ajaxRetry(requestParams, retryConfig);

            expect(axiosStub.callCount).toEqual(5);
        });

    });

});