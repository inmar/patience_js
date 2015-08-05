(function () {
  'use strict';

  angular.module('autoRetry', []);

  angular
    .module('autoRetry')
    .factory('$httpRetry', function () {
      return AjaxRetry;
    });

}());