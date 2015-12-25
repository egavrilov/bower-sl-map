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
	  this.bindToController = {
	    outletsRemains: '@slMapFilter',
	    selectedSize: '@slMapRemainsSize'
	  };
	  this.controller = MapController;
	  this.controllerAs = 'slMap';
	  this.templateUrl = mapTpl;
	};

	var MapController = (function () {
	  /**
	   @ngInject
	   */

	  function MapController(NgMap, Regions, Outlets, $scope, $timeout, $rootScope, $window, $q) {
	    var _this = this;

	    _classCallCheck(this, MapController);

	    this.NgMap = NgMap;
	    this.Regions = Regions;
	    this.Outlets = Outlets;
	    this.$scope = $scope;
	    this.$timeout = $timeout;
	    this.$window = $window;
	    this.$q = $q;
	    this.model = {};
	    this.isMobile = /android|ip(hone|ad|od)/i.test($window.navigator.userAgent);
	    this.selectedSize = this.selectedSize || 0;
	    this.center = [55.755773, 37.614608];
	    this.init();

	    $rootScope.$on('mapShow', function (event, outlet) {
	      $timeout(function () {
	        _this.select(outlet || { id: null });
	        _this.render();
	      });
	    });

	    $rootScope.$on('region:change', function (event, regionId) {
	      _this.setRegion(regionId, true);
	      _this.model.location = Regions.current;
	      _this.init();
	    });

	    angular.element('body').on('click', '.gm-style-iw ~ div', function () {
	      _this.back();
	    });
	  }

	  _createClass(MapController, [{
	    key: 'init',
	    value: function init() {
	      var _this2 = this;

	      this.$q.all({
	        regions: this.Regions.fetch(),
	        outlets: this.Outlets.fetch(),
	        map: this.NgMap.getMap()
	      }).then(function (responses) {
	        _this2.regions = _this2.Regions.all;
	        _this2.outlets = responses.outlets;
	        _this2.map = responses.map;
	        _this2.map.width = _this2.$window.outerWidth;
	        _this2.map.height = _this2.$window.outerHeight;
	        _this2.map._controller = _this2;
	        _this2.model.location = _this2.Regions.current;
	        _this2.initRemains();
	        _this2.render();
	      });
	    }
	  }, {
	    key: 'initRemains',
	    value: function initRemains() {
	      var _this3 = this;

	      this.outletsRemains = this.outletsRemains && angular.fromJson(this.outletsRemains);
	      this.model.outlets = this.outletsRemains ? this.Outlets.byRegion(this.model.location.id).filter(this.filterRemains.bind(this)) : this.Outlets.byRegion(this.model.location.id);

	      if (!this.outletsRemains) return;

	      this.remains = this.outletsRemains.reduce(function (remains, remain) {
	        var outlet = _this3.model.outlets.filter(function (_outlet) {
	          return _outlet.id === remain.outlet_id;
	        })[0];
	        if (!outlet || !remain.hasOwnProperty('available') && !remain.pickup) {
	          return remains;
	        }
	        if (!remains[remain.size]) {
	          remains[remain.size] = [];
	        }
	        outlet.remains = remain;
	        remains[remain.size].push(outlet);

	        return remains;
	      }, {});
	    }
	  }, {
	    key: 'pluckSize',
	    value: function pluckSize(size) {
	      return this.outletsRemains ? this.remains && (this.remains[size] || this.remains[this.selectedSize] || this.remains[0]) : this.model.outlets;
	    }
	  }, {
	    key: 'setRegion',
	    value: function setRegion(regionId, externalSet) {
	      regionId = regionId || this.model.location.id;
	      this.back();
	      this.model.outlets = this.outletsRemains ? this.Outlets.byRegion(regionId).filter(this.filterRemains.bind(this)) : this.Outlets.byRegion(regionId);
	      if (!externalSet) this.Regions.setRegion(regionId);
	      this.render();
	    }
	  }, {
	    key: 'render',
	    value: function render() {
	      var _this4 = this;

	      if (!this.model.outlets) return;
	      this.bounds = this.gm('LatLngBounds');
	      this.model.outlets.forEach(function (outlet) {
	        if (outlet.geo && outlet.geo.length) {
	          var marker = _this4.gm('LatLng', outlet.geo[0], outlet.geo[1]);
	          _this4.bounds.extend(marker);
	        }
	      });
	      this.$window.google.maps.event.trigger(this.map, 'resize');

	      if (this.selected) return;
	      this.map.fitBounds(this.bounds);
	      this.map.panToBounds(this.bounds);
	      if (this.map.zoom > 15) this.map.setZoom(15);
	    }
	  }, {
	    key: 'select',
	    value: function select(outlet) {
	      if (!outlet) return;
	      if (outlet.selected) return this.back();

	      this.model.outlets.forEach(function (_outlet) {
	        var equal = _outlet.id === outlet.id;
	        if (equal) {
	          _outlet.remains = outlet.remains;
	        }
	        _outlet.selected = _outlet.id === outlet.id;
	      });

	      this.openInfo(null, outlet);
	      this.$window.google.maps.event.trigger(this.map, 'resize');
	      this.center = outlet.geo;
	      if (this.selected || this.map.zoom < 15) this.map.setZoom(15);
	    }
	  }, {
	    key: 'back',
	    value: function back() {
	      var _this5 = this;

	      if (this.selected) {
	        this.selected.icon = '';
	        this.selected.selected = false;
	        this.selected = null;
	      }
	      this.$scope.$evalAsync(function () {
	        _this5.map.hideInfoWindow('info');
	        _this5.render();
	      });
	    }
	  }, {
	    key: 'filterRemains',
	    value: function filterRemains(outlet) {
	      return this.outletsRemains.filter(function (_remain) {
	        return _remain.outlet_id === outlet.id;
	      }).length;
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
	  }, {
	    key: 'showcase',
	    value: function showcase(refresh) {
	      var _this6 = this;

	      if (refresh) {
	        this._showcase = refresh;
	        this.$timeout(function () {
	          _this6.render();
	          _this6.select();
	        });
	      }

	      return this._showcase || 'map';
	    }
	  }], [{
	    key: 'getPrimary',
	    value: function getPrimary(images) {
	      return images && images.filter(function (image) {
	        return image.is_primary;
	      })[0];
	    }
	  }]);

	  return MapController;
	})();

	exports.default = Map;

/***/ },
/* 2 */
/***/ function(module, exports) {

	var path = '/home/eagavrilov/WebstormProjects/bower-sl-map/src/map.html';
	var html = "<div class=\"sl-outlets\" map-lazy-load=\"http://maps.google.com/maps/api/js\">\n    <div ng-class=\"{'outlets--showcase_map': slMap.showcase() !== 'list'}\" class=\"region--wrapper\">\n        <div class=\"region\">\n            <div class=\"region--current\">\n                <span ng-bind=\"slMap.model.location.name\" class=\"region--current-value\"></span>\n            </div>\n            <select ng-options=\"region as region.name for region in slMap.regions track by region.id\"\n                    ng-model=\"slMap.model.location\" ng-change=\"slMap.setRegion(region.id)\"\n                    class=\"region--form\"></select>\n        </div>\n        <div class=\"outlets--view\" ng-if=\"slMap.isMobile\">\n            <button ng-click=\"slMap.showcase('list')\"\n                    ng-class=\"{'outlets--view-active': slMap.showcase() === 'list'}\">Список\n            </button>\n            <button ng-click=\"slMap.showcase('map')\"\n                    ng-class=\"{'outlets--view-active': slMap.showcase() === 'map'}\">Карта\n            </button>\n        </div>\n        <div class=\"outlets--search\">\n            <input type=\"text\" ng-model=\"slMap.outletsFilter\" ng-change=\"slMap.bound()\"\n                   ng-class=\"{'outlets--search-filter': slMap.isMobile}\"/>\n\n            <div class=\"outlets--search-icon\"></div>\n        </div>\n        <div class=\"outlets--wrapper\" ng-hide=\"slMap.isMobile && slMap.showcase() === 'map'\">\n            <div ng-repeat=\"outlet in slMap.pluckSize() | filter: slMap.outletsFilter | orderBy: ['remains.available', 'kind.sort']\"\n                 ng-class=\"{'outlet-selected': outlet.selected}\"\n                 ng-click=\"slMap.select(outlet)\" class=\"outlet\">\n                <div ng-bind=\"::outlet.mall\" class=\"outlet-title\"></div>\n                <div ng-bind=\"::outlet.kind.name\" class=\"outlet-kind\"></div>\n                <div class=\"outlet-info\" ng-class=\"{'outlet-info_remains': outlet.remains}\">\n                    <div ng-bind=\"::outlet.address\" ng-show=\"outlet.selected || !outlet.metros.length\"\n                         class=\"address\"></div>\n                    <span class=\"metro\" ng-if=\"outlet.metros.length\" ng-repeat=\"metro in outlet.metros\">\n                        <span ng-style=\"{backgroundColor: '#'+ metro.color}\" class=\"metro--icon\"></span>\n                        {{::metro.name}}\n                    </span>\n\n                    <div class=\"hours\"><span ng-show=\"outlet.selected\"\n                                             ng-bind=\"::current.opening_hours\"></span></div>\n                    <div class=\"remains\" ng-if=\"outlet.remains\" ng-click=\"reserve.openReserveDialog(outlet.remains); $event.stopPropagation();\">\n                        <div ng-if=\"outlet.remains.available\" class=\"remains-available remains-status\">В наличии</div>\n                        <div ng-if=\"outlet.remains.available\" class=\"remains-available remains-button reserve--button\">Забрать\n                            сегодня\n                        </div>\n                        <div ng-if=\"outlet.remains.pickup\" class=\"remains-pickup remains-status\">Под заказ</div>\n                        <div ng-if=\"outlet.remains.pickup\" class=\"remains-pickup remains-button\">Забрать <span\n                                ng-bind=\"::outlet.remains.pickup\"></span></div>\n                    </div>\n                    <div class=\"remains\" style=\"\" ng-if=\"outlet.remains.available === false\">В наличии</div>\n                </div>\n            </div>\n        </div>\n    </div>\n    <div ng-class=\"{'outlets--showcase_map': slMap.showcase() !== 'map'}\"\n         ng-hide=\"slMap.isMobile && slMap.showcase() === 'list'\" class=\"sl-map--wrapper\">\n        <a name=\"map\"></a>\n        <ng-map pan-control=\"true\" pan-control-options=\"{position:'TOP_RIGHT'}\" map-type-control=\"false\"\n                zoom-control=\"true\" zoom-control-options=\"{style:'LARGE', position:'LEFT_TOP'}\" scale-control=\"true\"\n                single-info-window=\"true\" street-view-control=\"false\" class=\"sl-map\" center=\"{{slMap.center}}\">\n            <marker ng-repeat=\"outlet in slMap.pluckSize() | filter: slMap.outletsFilter\" id=\"outlet_{{::outlet.id}}\"\n                    position=\"{{::outlet.geo}}\" on-click=\"slMap.openInfo(outlet)\"\n                    icon=\"{{outlet.icon || 'http://cdn1.love.sl/love.sl/common/actions/charm/assets/marker.png'}}\">\n            </marker>\n            <info-window id=\"info\" visible=\"{{slMap.selected}}\"\n                         closeclick=\"slMap.back()\">\n                <div class=\"outlet--marker-info\" ng-non-bindable=\"\">\n                    <div class=\"outlet--marker-info-title\">\n                        <span class=\"outlet--marker-info-mall\" ng-bind=\"slMap.selected.mall\"></span>\n                        <span ng-bind=\"slMap.selected.kind.name\"></span>\n                    </div>\n                    <div class=\"outlet--marker-info-image\" ng-show=\"slMap.constructor.getPrimary(slMap.selected.images)\">\n                        <img ng-src=\"{{slMap.constructor.getPrimary(slMap.selected.images).file}}\" alt=\"\">\n                    </div>\n                    <div class=\"metros\"><span ng-show=\"slMap.selected.metros[0]\" class=\"metro\"><span\n                            ng-style=\"{backgroundColor: '#'+ slMap.selected.metros[0].color}\"\n                            class=\"metro--icon\"></span>{{slMap.selected.metros[0].name}}</span><span\n                            ng-show=\"slMap.selected.metros[1]\" class=\"metro\"><span\n                            ng-style=\"{backgroundColor: '#'+ slMap.selected.metros[1].color}\"\n                            class=\"metro--icon\"></span>{{slMap.selected.metros[1].name}}</span><span\n                            ng-show=\"slMap.selected.metros[2]\" class=\"metro\"><span\n                            ng-style=\"{backgroundColor: '#'+ slMap.selected.metros[2].color}\"\n                            class=\"metro--icon\"></span>{{slMap.selected.metros[2].name}}</span>\n                    </div>\n                    <div class=\"address\" ng-bind=\"slMap.selected.address\"></div>\n                    <div class=\"hours\">Часы работы <span ng-bind=\"::slMap.selected.opening_hours\"></span></div>\n                    <div class=\"outlet--marker--buttons\">\n                        <div ng-if=\"slMap.selected.remains\" class=\"remains outlet--marker-info-button\" ng-click=\"reserve.openReserveDialog(slMap.selected.remains)\">\n                            <div ng-if=\"slMap.selected.remains.available\" class=\"reserve--button\">Зарезервировать</div>\n                            <div ng-if=\"slMap.selected.remains.pickup\" class=\"remains-pickup\">Доступно <span ng-bind=\"::slMap.selected.remains.pickup\"></span></div>\n                        </div>\n                    </div>\n                </div>\n            </info-window>\n        </ng-map>\n    </div>\n</div>\n";
	window.angular.module('ng').run(['$templateCache', function(c) { c.put(path, html) }]);
	module.exports = path;

/***/ }
/******/ ]);