import slMap from './map.directive';

angular.module('sl.map', ['ngMap', 'sl.outlets', 'sl.regions'])
.directive('slMap', () => new slMap());
