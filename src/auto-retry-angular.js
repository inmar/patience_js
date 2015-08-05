(function () {
  'use strict';

  function httpRetry($http, $q, $interval) {
    return AutoRetry;
  }

  angular.module('autoRetry', []);

  angular
    .module('autoRetry')
    .factory('$httpRetry', ['$http', '$q', '$interval', httpRetry]);

}());