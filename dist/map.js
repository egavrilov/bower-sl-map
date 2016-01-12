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

	        console.log(_this2.Outlets);
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
	      if (!this.map) return;
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
	      console.log(outlet);

	      this.model.outlets.forEach(function (_outlet) {
	        var equal = _outlet.id === outlet.id;
	        if (equal) {
	          _outlet.remains = outlet.remains;
	        }
	        _outlet.selected = _outlet.id === outlet.id;
	      });

	      this.openInfo(null, outlet);
	      this.$window.google.maps.event.trigger(this.map, 'resize');
	      this.center = [outlet.geo[0], outlet.geo[1] + .0075];
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
	        //this.map.hideInfoWindow('info');
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
	      console.log(arguments);
	      var ctrl = event ? this.map._controller : this;
	      ctrl.scroll();

	      ctrl.selected = outlet;
	      ctrl.selected.icon = '/src/images/new/marker-active.png';

	      //if (!this.map.singleInfoWindow) return;
	      //
	      if (this.map.lastInfoWindow && this.map.lastInfoWindow !== outlet) {
	        //  this.map.hideInfoWindow('info');
	        this.map.lastInfoWindow.icon = '';
	      }

	      this.map.lastInfoWindow = outlet;
	    }
	  }, {
	    key: 'scroll',
	    value: function scroll() {
	      var list = document.querySelector('.adress-popup-list'); //eslint-disable-line angular/document-service
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

	      return this._showcase || this.remains ? 'list' : 'map';
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
	var html = "<div class=\"adress-popup\" map-lazy-load=\"http://maps.google.com/maps/api/js\" ng-init=\"slMap.init()\">\n    <a href=\"\" class=\"adress-popup-close\"><img src=\"/src/images/all/cross-grey.png\" alt=\"\"></a>\n    <a href=\"\" class=\"search-icon\"><img src=\"/src/images/all/loupe-icon.png\" alt=\"\"></a>\n    <div class=\"adress-popup-left active\">\n        <h3 class=\"adress-popup-title\">Где забрать?</h3>\n        <div class=\"adress-popup-tabs\">\n            <a href=\"\" class=\"adress-tab adress-tab-list active\">Список</a>\n            <a href=\"\" class=\"adress-tab adress-tab-map\">НА КАРТЕ</a>\n        </div>\n        <div class=\"adress-popup-search\">\n            <input class=\"input adress-popup-input\" type=\"text\" ng-model=\"slMap.outletsFilter\" ng-change=\"slMap.bound()\">\n        </div>\n        <div class=\"adress-popup-list address-popup-list_remains\">\n            <div ng-repeat=\"outlet in slMap.pluckSize() | filter: slMap.outletsFilter | orderBy: ['remains.available', 'kind.sort']\"\n                 ng-class=\"{'outlet-selected': outlet.selected}\"\n                 ng-click=\"slMap.select(outlet)\"\n                 class=\"adress-popup-item adress-popup-item1\">\n                <div class=\"adress-popup-name\"><span ng-bind=\"::outlet.mall\">SUNLIGHT МЕГА Теплый Стан</span> <span ng-bind=\"::outlet.kind.name\">гипермаркет</span></div>\n                <div class=\"adress-popup-street\">\n                    <span ng-bind=\"::outlet.address\">Москва, улица Арбат, 12 с 1</span>\n                    <div class=\"adress-popup-time\" ng-bind=\"::outlet.opening_hours\">ПН-ВС 10:00-22:00</div>\n                </div>\n                <div class=\"adress-popup-metro\" ng-repeat=\"metro in ::outlet.metros\">\n                    <span ng-bind=\"metro.name\">Электрозаводская</span>\n                </div>\n                <div class=\"adress-popup-info\" ng-if=\"::outlet.remains\">\n                    <span class=\"adress-popup-status adress-popup-status-green\" ng-if=\"::outlet.remains.available\">В наличии</span>\n                    <span class=\"adress-popup-status\" ng-if=\"::outlet.remains.pickup\">Под заказ</span>\n                    <span ng-if=\"::outlet.remains.available !== false\">Можно забрать <span ng-bind=\"::outlet.remains.pickup || 'сегодня'\"></span></span>\n                </div>\n                <span class=\"adress-item-arrow\"><img src=\"/src/images/all/adress-arrow-left.png\" alt=\"\"></span>\n            </div>\n            <!--<div class=\"adress-popup-item adress-popup-item2 active\" data-mark=\"adress-mark2\" data-box=\"adress-box2\">\n                <div class=\"adress-popup-name\"><span>ТЦ РИО</span> СЕКция</div>\n                <div class=\"adress-popup-street\">\n                    Москва, Мажоритарный пр. 8\n                    <div class=\"adress-popup-time\">10:00-22:00</div>\n                </div>\n                <div class=\"adress-popup-metro\">Электрозаводская</div>\n                <div class=\"adress-popup-info\">\n                    <span class=\"adress-popup-status adress-popup-status-green\">В наличии</span>\n                    Можно забрать прямо сейчас\n                </div>\n                <span class=\"adress-item-arrow\"><img src=\"/src/images/all/adress-arrow-left.png\" alt=\"\"></span>\n            </div>\n            <div class=\"adress-popup-item adress-popup-item3\" data-mark=\"adress-mark3\" data-box=\"adress-box3\">\n                <div class=\"adress-popup-name\"><span>SUNLIGHT БОРОДИЩЕВО</span> МИНИмаркет</div>\n                <div class=\"adress-popup-street\">\n                    Загопниковская, д. 507 корпус 501, ТЦ ИЮНЬ\n                    <div class=\"adress-popup-time\">ПН-ВС 10:00-22:00, СБ-ВС 11:00-12:00</div>\n                </div>\n                <div class=\"adress-popup-metro\">Электрозаводская</div>\n                <div class=\"adress-popup-info\">\n                    <span class=\"adress-popup-status\">Под заказ</span>\n                    Можно забрать завтра\n                </div>\n                <span class=\"adress-item-arrow\"><img src=\"/src/images/all/adress-arrow-left.png\" alt=\"\"></span>\n            </div>-->\n        </div>\n    </div>\n    <div class=\"adress-popup-right\">\n        <ng-map class=\"adress-popup-map\" pan-control=\"true\" pan-control-options=\"{position:'TOP_RIGHT'}\" map-type-control=\"false\" height=\"100%\"\n                zoom-control=\"true\" zoom-control-options=\"{style:'LARGE', position:'LEFT_TOP'}\" scale-control=\"true\"\n                single-info-window=\"true\" street-view-control=\"false\" center=\"{{slMap.center}}\">\n            <!--<img src=\"/src/images/all/popup-map.jpg\" alt=\"\" class=\"adress-popup-map-img\">-->\n            <a href=\"\" class=\"adress-mark adress-mark1\" data-item=\"adress-popup-item1\" data-box=\"adress-box1\"></a>\n            <a href=\"\" class=\"adress-mark adress-mark2 active\" data-item=\"adress-popup-item2\" data-box=\"adress-box2\"></a>\n            <a href=\"\" class=\"adress-mark adress-mark3\" data-item=\"adress-popup-item3\" data-box=\"adress-box3\"></a>\n            <marker ng-repeat=\"outlet in slMap.outlets | filter: slMap.outletsFilter\"\n                    id=\"outlet_{{::outlet.id}}\"\n                    position=\"{{::outlet.geo}}\"\n                    on-click=\"slMap.openInfo(outlet)\"\n                    icon=\"{{outlet.icon || '/src/images/new/marker.png'}}\">\n            </marker>\n        </ng-map>\n    </div>\n    <div class=\"adress-popup-box-holder\" ng-if=\"slMap.selected\">\n        <div class=\"adress-popup-box active\">\n            <a href=\"\" class=\"adress-box-back\"><img src=\"/src/images/all/adress-arrow-right.png\" alt=\"\"></a>\n            <a href=\"\" class=\"adress-box-close\"><img src=\"/src/images/all/cross-grey.png\" alt=\"\"></a>\n            <div class=\"adress-popup-name\"><span ng-bind=\"slMap.selected.mall\">SUNLIGHT МЕГА Теплый Стан</span> <span ng-bind=\"slMap.selected.kind.name\">гипермаркет</span></div>\n            <div class=\"adress-popup-box-img\">\n                <img src=\"/src/images/all/adress-img1.jpg\" alt=\"\">\n            </div>\n            <div class=\"adress-popup-box-text\">\n                <div class=\"adress-popup-street\">\n                    Москва, улица Арбат, 12 с 1\n                    <div class=\"adress-popup-time\">ПН-ВС 10:00-22:00</div>\n                </div>\n                <div class=\"adress-popup-metro\">Электрозаводская</div>\n                <div class=\"adress-popup-info\">\n                    <span class=\"adress-popup-status\">Под заказ</span>\n                    Можно забрать 24 сентября\n                </div>\n                <a href=\"\" class=\"button\">ЗАРЕЗЕРВИРОВАТЬ</a>\n            </div>\n        </div>\n        <!--<div class=\"adress-popup-box adress-box2 active\">\n            <a href=\"\" class=\"adress-box-back\"><img src=\"/src/images/all/adress-arrow-right.png\" alt=\"\"></a>\n            <a href=\"\" class=\"adress-box-close\"><img src=\"/src/images/all/cross-grey.png\" alt=\"\"></a>\n            <div class=\"adress-popup-name\"><span>ТЦ РИО</span> СЕКция</div>\n            <div class=\"adress-popup-box-img\">\n                <img src=\"/src/images/all/adress-img1.jpg\" alt=\"\">\n            </div>\n            <div class=\"adress-popup-box-text\">\n                <div class=\"adress-popup-street\">\n                    Москва, Мажоритарный пр. 8\n                    <div class=\"adress-popup-time\">10:00-22:00</div>\n                </div>\n                <div class=\"adress-popup-metro\">Электрозаводская</div>\n                <div class=\"adress-popup-info\">\n                    <span class=\"adress-popup-status adress-popup-status-green\">В наличии</span>\n                    Можно забрать прямо сейчас\n                </div>\n                <a href=\"\" class=\"button\">ЗАРЕЗЕРВИРОВАТЬ</a>\n            </div>\n        </div>\n        <div class=\"adress-popup-box adress-box3\">\n            <a href=\"\" class=\"adress-box-back\"><img src=\"/src/images/all/adress-arrow-right.png\" alt=\"\"></a>\n            <a href=\"\" class=\"adress-box-close\"><img src=\"/src/images/all/cross-grey.png\" alt=\"\"></a>\n            <div class=\"adress-popup-name\"><span>SUNLIGHT БОРОДИЩЕВО</span> МИНИмаркет</div>\n            <div class=\"adress-popup-box-img\">\n                <img src=\"/src/images/all/adress-img1.jpg\" alt=\"\">\n            </div>\n            <div class=\"adress-popup-box-text\">\n                <div class=\"adress-popup-street\">\n                    Загопниковская, д. 507 корпус 501, ТЦ ИЮНЬ\n                    <div class=\"adress-popup-time\">ПН-ВС 10:00-22:00, СБ-ВС 11:00-12:00</div>\n                </div>\n                <div class=\"adress-popup-metro\">Электрозаводская</div>\n                <div class=\"adress-popup-info\">\n                    <span class=\"adress-popup-status\">Под заказ</span>\n                    Можно забрать завтра\n                </div>\n                <a href=\"\" class=\"button\">ЗАРЕЗЕРВИРОВАТЬ</a>\n            </div>\n        </div>-->\n    </div>\n</div>\n";
	window.angular.module('ng').run(['$templateCache', function(c) { c.put(path, html) }]);
	module.exports = path;

/***/ }
/******/ ]);