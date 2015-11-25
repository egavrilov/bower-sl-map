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

	var _map = __webpack_require__(3);

	var _map2 = _interopRequireDefault(_map);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	angular.module('sl.map', ['ngMap', 'sl.outlets', 'sl.regions']).directive('slMap', function () {
	  return new _map2.default();
	});

/***/ },
/* 1 */,
/* 2 */,
/* 3 */
/***/ function(module, exports) {

	'use strict';

	var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	var Map = function Map() {
	  _classCallCheck(this, Map);

	  this.scope = true;
	  this.bindToController = true;
	  this.controller = MapController;
	  this.controllerAs = 'slMap';
	  this.templateUrl = './src/map.html';
	};

	var MapController = (function () {
	  /**
	   @ngInject
	   */

	  function MapController(NgMap, Regions, Outlets, $timeout, $window, $q) {
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
	        _this.model.outlets = _this.outletsByRegion(_this.model.location.id);
	        _this.render();
	      });
	    }
	  }, {
	    key: 'outletsByRegion',
	    value: function outletsByRegion(id) {
	      return this.outlets.filter(function (_outlet) {
	        return _outlet.region_id && _outlet.region_id.indexOf(id) !== -1;
	      });
	    }
	  }, {
	    key: 'setRegion',
	    value: function setRegion() {
	      if (!this.model.location) return;
	      this.model.outlets = this.outletsByRegion(this.model.location.id);
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

/***/ }
/******/ ]);