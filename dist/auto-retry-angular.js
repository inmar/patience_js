(function () {
  'use strict';

  angular.module('autoRetry', []);

  angular
    .module('autoRetry')
    .service('$httpRetry', function () {
      return AjaxRetry();
    });

}());