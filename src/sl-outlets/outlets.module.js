angular.module('sl.outlets', [])
.factory('Outlets', /*@ngInject*/ function ($http) {
  let factory = {};

  factory.fetch = function () {
    return $http.get('json/outlet.json').then(function (response) {
      return response.data.data;
    });
  };

  return factory;
});