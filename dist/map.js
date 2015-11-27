/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _map = __webpack_require__(1);

	var _map2 = _interopRequireDefault(_map);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	angular.module('sl.map', ['ngMap', 'sl.outlets', 'sl.regions']).directive('slMap', function () {
	  return new _map2.default();
	});

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	var mapTpl = __webpack_require__(2);

	var Map = function Map() {
	  _classCallCheck(this, Map);

	  this.scope = true;
	  this.bindToController = true;
	  this.controller = MapController;
	  this.controllerAs = 'slMap';
	  this.templateUrl = mapTpl;
	};

	var MapController = (function () {
	  /**
	   @ngInject
	   */

	  function MapController(NgMap, Regions, Outlets, $timeout, $rootScope, $window, $q) {
	    _classCallCheck(this, MapController);

	    this.NgMap = NgMap;
	    this.Regions = Regions;
	    this.Outlets = Outlets;
	    this.$timeout = $timeout;
	    this.$window = $window;
	    this.$q = $q;
	    this.model = {};
	    this.init();
	  }

	  _createClass(MapController, [{
	    key: 'init',
	    value: function init() {
	      var _this = this;

	      this.$q.all({
	        regions: this.Regions.fetch(),
	        outlets: this.Outlets.fetch(),
	        map: this.NgMap.getMap()
	      }).then(function (responses) {
	        _this.regions = responses.regions;
	        _this.outlets = responses.outlets;
	        _this.map = responses.map;
	        _this.map._controller = _this;
	        _this.model.location = _this.Regions.current;
	        _this.model.outlets = _this.Outlets.byRegion(_this.model.location.id);
	        //this.render();
	      });

	      $rootScope.$on('mapShow', function (event, outlet) {
	        _this.render();
	        outlet && _this.select(outlet);
	      });
	    }
	  }, {
	    key: 'setRegion',
	    value: function setRegion() {
	      if (!this.model.location) return;
	      this.model.outlets = this.Outlets.byRegion(this.model.location.id);
	      this.Regions.setRegion(this.model.location.id);
	      this.render();
	    }
	  }, {
	    key: 'render',
	    value: function render() {
	      var _this2 = this;

	      this.bounds = this.gm('LatLngBounds');
	      this.model.outlets.forEach(function (outlet) {
	        if (outlet.geo && outlet.geo.length) {
	          var marker = _this2.gm('LatLng', outlet.geo[0], outlet.geo[1]);
	          _this2.bounds.extend(marker);
	        }
	      });
	      this.$window.google.maps.event.trigger(this.map, 'resize');
	      this.map.fitBounds(this.bounds);
	      this.map.panToBounds(this.bounds);
	      if (this.map.zoom > 15) this.map.setZoom(15);
	    }
	  }, {
	    key: 'select',
	    value: function select(outlet) {
	      this.model.outlets.forEach(function (_outlet) {
	        _outlet.selected = _outlet.id === outlet.id;
	      });

	      if (this.map.zoom < 15) this.map.setZoom(15);
	      this.map.setCenter(this.gm('LatLng', outlet.geo[0], outlet.geo[1]));
	      this.openInfo(null, outlet);
	    }
	  }, {
	    key: 'openInfo',
	    value: function openInfo(event, outlet) {
	      var id = outlet.id;
	      var ctrl = event ? this.map._controller : this;

	      ctrl.selected = outlet;
	      ctrl.selected.icon = 'http://cdn1.love.sl/love.sl/common/actions/charm/assets/marker_active.png';

	      this.map.showInfoWindow('info', 'outlet_' + id);
	      if (event !== null) {
	        ctrl.select.call(ctrl, outlet);
	        ctrl.$timeout(function () {
	          return ctrl.scroll.call(ctrl);
	        });
	      }

	      if (!this.map.singleInfoWindow) return;

	      if (this.map.lastInfoWindow && this.map.lastInfoWindow !== outlet) {
	        this.map.hideInfoWindow('info');
	        this.map.lastInfoWindow.icon = '';
	      }

	      this.map.lastInfoWindow = outlet;
	    }
	  }, {
	    key: 'scroll',
	    value: function scroll() {
	      var list = document.querySelector('.outlets--wrapper'); //eslint-disable-line angular/document-service
	      var selected = list.querySelector('.outlet-selected');
	      angular.element(list).animate({
	        scrollTop: selected.offsetTop - selected.offsetHeight
	      });
	      angular.element(document).scrollTop(window.pageYOffset + list.parentNode.getBoundingClientRect().top); //eslint-disable-line angular/document-service,angular/window-service
	    }
	  }, {
	    key: 'gm',
	    value: function gm(googleMapsMethod) {
	      var args = [null].concat(Array.prototype.slice.call(arguments, 1));
	      return new (Function.prototype.bind.apply(this.$window.google.maps[googleMapsMethod], args))();
	    }
	  }]);

	  return MapController;
	})();

	exports.default = Map;

/***/ },
/* 2 */
/***/ function(module, exports) {

	var path = '/home/eagavrilov/WebstormProjects/bower-sl-map/src/map.html';
	var html = "<div class=\"sl-outlets\" map-lazy-load=\"http://maps.google.com/maps/api/js\">\n    <div class=\"region--wrapper\">\n        <div class=\"region\">\n            <div class=\"region--current\">\n                <span>Ваш город:&nbsp;</span>\n                <span ng-bind=\"slMap.model.location.name\" class=\"region--current-value\"></span>\n            </div>\n            <select ng-options=\"region as region.name for region in slMap.regions track by region.id\"\n                    ng-model=\"slMap.model.location\" ng-change=\"slMap.setRegion()\" class=\"region--form\"></select>\n        </div>\n        <div class=\"outlets--view\">\n            <button ng-click=\"outlets.showcase('list')\"\n                    ng-class=\"{'outlets--view-active': outlets.showcase() === 'list'}\">Список\n            </button>\n            <button ng-click=\"outlets.showcase('map')\"\n                    ng-class=\"{'outlets--view-active': outlets.showcase() === 'map'}\">Карта\n            </button>\n        </div>\n        <div class=\"outlets--search\">\n            <input type=\"text\" ng-model=\"slMap.outletsFilter\" ng-change=\"slMap.bound()\"\n                   ng-class=\"{'outlets--search-filter': slMap.isMobile}\"/>\n\n            <div class=\"outlets--search-icon\"></div>\n        </div>\n        <div class=\"outlets--wrapper\">\n            <div ng-repeat=\"outlet in slMap.model.outlets | filter: slMap.outletsFilter\"\n                 ng-class=\"{'outlet-selected': outlet.selected}\"\n                 ng-click=\"slMap.select(outlet)\" class=\"outlet\">\n                <div ng-bind=\"::outlet.mall\" class=\"outlet-title\"></div>\n                <div class=\"outlet-info\">\n                    <div ng-bind=\"::outlet.address\" ng-show=\"outlet.selected\" class=\"address\"></div>\n                    <span class=\"metro\"><span ng-style=\"{backgroundColor: '#'+ outlet.metros[0].color}\"\n                                              class=\"metro--icon\"></span>{{::outlet.metros[0].name}}</span>\n\n                    <div class=\"hours\"><span ng-show=\"outlet.selected\"\n                                             ng-bind=\"::current.opening_hours\"></span></div>\n                </div>\n            </div>\n        </div>\n    </div>\n    <div ng-class=\"{'outlets--showcase_map': outlets.showcase() !== 'map'}\" class=\"sl-map--wrapper\">\n        <a name=\"map\"></a>\n        <ng-map height=\"600\" pan-control=\"true\" pan-control-options=\"{position:'TOP_RIGHT'}\" map-type-control=\"false\"\n                zoom-control=\"true\" zoom-control-options=\"{style:'LARGE', position:'LEFT_TOP'}\" scale-control=\"true\"\n                single-info-window=\"true\" street-view-control=\"false\" class=\"sl-map\">\n            <marker ng-repeat=\"outlet in slMap.model.outlets | filter: slMap.outletsFilter\" id=\"outlet_{{::outlet.id}}\"\n                    position=\"{{::outlet.geo}}\" on-click=\"slMap.openInfo(outlet)\"\n                    icon=\"{{outlet.icon || 'http://cdn1.love.sl/love.sl/common/actions/charm/assets/marker.png'}}\">\n            </marker>\n            <info-window id=\"info\" visible=\"{{slMap.selected}}\"\n                         closeclick=\"slMap.back()\">\n                <div class=\"outlet--marker-info\" ng-non-bindable=\"\">\n                    <h4 ng-bind=\"slMap.selected.mall\"></h4>\n                    <div class=\"address\">{{slMap.selected.address}}</div>\n                    <div class=\"metros\"><span ng-show=\"slMap.selected.metros[0]\" class=\"metro\"><span\n                            ng-style=\"{backgroundColor: '#'+ slMap.selected.metros[0].color}\" class=\"metro--icon\"></span>{{slMap.selected.metros[0].name}}</span><span\n                            ng-show=\"slMap.selected.metros[1]\" class=\"metro\"><span\n                            ng-style=\"{backgroundColor: '#'+ slMap.selected.metros[1].color}\" class=\"metro--icon\"></span>{{slMap.selected.metros[1].name}}</span><span\n                            ng-show=\"slMap.selected.metros[2]\" class=\"metro\"><span\n                            ng-style=\"{backgroundColor: '#'+ slMap.selected.metros[2].color}\" class=\"metro--icon\"></span>{{slMap.selected.metros[2].name}}</span>\n                    </div>\n                    <div class=\"hours\"><span ng-bind=\"::slMap.selected.opening_hours\"></span></div>\n                </div>\n            </info-window>\n        </ng-map>\n    </div>\n</div>\n";
	window.angular.module('ng').run(['$templateCache', function(c) { c.put(path, html) }]);
	module.exports = path;

/***/ }
/******/ ]);