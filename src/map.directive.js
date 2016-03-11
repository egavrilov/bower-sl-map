/**
 * Show map and filter outlets by:
 *  - Action ID
 *  - By hand by UUID (comma separated)
 *  - Remains request results (/v1/reserves/product_remains/?product_article={Article}&region_id={UUID})
 *  - Selected product size (if remains)
 *  - Pawnshop type (comma separated)
 *
 * Special classes:
 *  .mapster - To remove 'Where to buy?' text
 *
 * Example
 * <div class="mapster"
 *    sl-map
 *    sl-map-action-id="403e9837-caad-11e3-a1d8-001018f04542"
 *    sl-map-action-outlets="c9271315-60ed-11e0-aec3-002219556026,7cb53d39-71c1-11e1-a9be-002219650662"
 *    sl-map-filter="[{available: true, count: 5, outlet_id: "b18ce8d6-02af-11e5-a78b-001018f04542", size: 0}]"
 *    sl-map-selected-size="15"
 *    sl-map-pawnshop-type="2, 3">
 */

const mapTpl = require('ngtemplate!html!./map.html');
class Map {
  constructor() {
    this.scope = true;
    this.bindToController = {
      actionId: '@slMapActionId',
      actionOutlets: '@slMapActionOutlets',
      outletsRemains: '@slMapFilter',
      selectedSize: '@slMapRemainsSize',
      pawnshopType: '@slMapPawnshopType'
    };
    this.controller = MapController;
    this.controllerAs = 'slMap';
    this.templateUrl = mapTpl;
  }
}

class MapController {

  /**
   @ngInject
   */
  constructor(NgMap, Remains, Regions, Outlets, $http, $scope, $timeout, $rootScope, $window, $q) {
    this.NgMap = NgMap;
    this.Remains = Remains;
    this.Regions = Regions;
    this.Outlets = Outlets;
    this.$scope = $scope;
    this.$timeout = $timeout;
    this.$window = $window;
    this.$q = $q;
    this.$http = $http;
    this.model = {};
    this.isMobile = /android|ip(hone|ad|od)/i.test($window.navigator.userAgent);
    this.selectedSize = this.selectedSize || 0;
    this.init();

    $rootScope.$on('mapShow', (event, outlet) => {
      $timeout(() => {
        this.select(outlet || {id: null});
        this.render();
      });
    });

    $rootScope.$on('region:change', (event, regionId) => {
      this.setRegion(regionId, true);
      this.model.location = Regions.current;
      this.init();
    });

    $scope.$on('$destroy', () => {
      if ( this.selected ) {
        this.select(this.selected);
        this.selected = null;
      }
    });
  }

  init() {
    this.$q.all({
      regions: this.Regions.fetch(),
      outlets: this.Outlets.fetch(),
      map: this.NgMap.getMap()
    }).then((responses) => {
      this.setModel(responses);
      this.model.loaded = true;
    });
  }

  setModel(responses) {
    this.regions = this.Regions.all;
    this.outlets = this.Outlets.all.filter(outlet => outlet.geo);
    this.map = responses.map;
    this.map._controller = this;
    this.map.width = this.$window.outerWidth;
    this.map.height = this.$window.outerHeight;
    this.model.location = this.Regions.current;
    this.defaultIcon = {
      url: `/bower_components/sl-map/src/images/new/map${this.outletsRemains ? '-gray' : '-red'}@2x.png`,
      size: [24, 32],
      scaledSize: [24, 32],
      origin: [0, 0]
    };

    this.initRemains();
    this.initFilters();
    this.render();
  }

  initFilters() {
    if (this.actionId && !this.actionOutlets) {
      this.$http.get(`http://api.love.sl/v1/actions/actions/${this.actionId}/`).then((response) => {
        const outlets = response.data.outlets;
        this.outlets = this.outlets.filter((_outlet) => outlets.indexOf(_outlet.id) !== -1);
        this.model.outlets = this.model.outlets.filter((_outlet) => outlets.indexOf(_outlet.id) !== -1);
      });
    }

    if (this.actionOutlets) {
      this.outlets = this.outlets.filter((outlet) => new RegExp(outlet.id).test(this.actionOutlets));
      this.model.outlets = this.model.outlets.filter((outlet) => new RegExp(outlet.id).test(this.actionOutlets));
    }

    if (this.pawnshopType) {
      const types = this.pawnshopType
        .split(',')
        .map((type) => Number(type.trim()));
      let outlets = [],
        modelOutlets = [];
      types.forEach((type) => {
        outlets = outlets.concat(this.outlets.filter((outlet) => outlet.pawnshop === type));
        modelOutlets = modelOutlets.concat(this.model.outlets.filter((outlet) => outlet.pawnshop === type));
      });

      this.outlets = outlets;
      this.model.outlets = modelOutlets;
    }
  }

  initRemains() {
    this.outletsRemains = this.outletsRemains && angular.fromJson(this.outletsRemains);
    this.model.outlets = this.outletsRemains ?
      this.Outlets.byRegion(this.model.location.id).filter(this.filterRemains.bind(this)) :
      this.Outlets.byRegion(this.model.location.id);

    if (!this.outletsRemains) return;

    this.remains = this.reduceBySize(this.outletsRemains);
  }

  reduceBySize(remainsArr) {
    return remainsArr.reduce((remains, remain) => {
      let outlet = this.model.outlets.filter((_outlet) => _outlet.id === remain.outlet_id)[0];
      if (!outlet || !remain.hasOwnProperty('available') && !remain.pickup) {
        return remains;
      }
      if (!remains[remain.size]) {
        remains[remain.size] = [];
      }
      outlet.remains = remain;
      outlet.icon = this.getIcon(outlet);
      remains[remain.size].push(outlet);

      return remains;
    }, {});
  }

  pluckSize(size) {
    if (!this.map) return;

    if (this.outletsFilter) {
      return this.outlets;
    }

    if (this.outletsRemains) {
      return this.remains && (this.remains[size] || this.remains[this.selectedSize] || this.remains[0]);
    }

    return this.model.outlets;
  }

  fetchRemains(outlet, regionId, index) {
    return this.Remains.fetch(null, regionId).then((response) => {
      this.outletsRemains.concat(response.data);
      outlet.remains = response.data.filter((_remain) =>
        _remain.outlet_id === outlet.id && Number(this.selectedSize) === _remain.size)[0];
      outlet.icon = this.getIcon(outlet);

      if (!outlet.remains) {
        this.otherRegion.splice(index, 1);
      }
    });
  }

  getIcon(outlet){
    if (!this.outletsRemains) {
      return this.defaultIcon;
    }

    return angular.extend({}, this.defaultIcon, {
      url: `/bower_components/sl-map/src/images/new/map${
          outlet.remains && outlet.remains.hasOwnProperty('available') ? '-red' : '-gray'
        }@2x.png`
    });
  }

  setRegion(regionId, externalSet) {
    regionId = regionId || this.model.location.id;
    this.back();
    this.model.outlets = this.outletsRemains ?
      this.Outlets.byRegion(regionId).filter(this.filterRemains.bind(this)) :
      this.Outlets.byRegion(regionId);
    if (!externalSet) this.Regions.setRegion(regionId);
    this.render();
  }

  resize() {
    if (this._resizeTimeout)
      this.$timeout.cancel(this._resizeTimeout);

    this._resizeTimeout = this.$timeout(() => {
      let outlets = this.model.outlets;

      if (this.outletsRemains) {
        outlets = this.remains && (this.remains[this.selectedSize] || this.remains[0]);
      }

      if (this.selected && this.map.zoom >= 14) {
        return;
      }

      let bounds = this.map.getBounds();

      this.filtered = outlets.filter((outlet) =>
        bounds.contains(this.gm('LatLng', outlet.geo[0], outlet.geo[1])));

      if (this.outletsFilter) {
        this.otherRegion = this.outlets.filter((outlet) => {
          if (outlet.region_id[0] === this.model.location.id) {
            return false;
          }

          this.fetchRemains(outlet, outlet.region_id[0]);
          return true;
        });

        return;
      }

      this.otherRegion = this.outlets.filter((outlet) => {
        if (outlet.region_id[0] === this.model.location.id)
          return;

        if (!bounds.contains(this.gm('LatLng', outlet.geo[0], outlet.geo[1])))
          return;

        if (this.outletsRemains) {
          this.fetchRemains(outlet, outlet.region_id[0]);
        }
        return true;
      });

      this.emptyList = !this.otherRegion.length && !this.filtered.length;
    }, 450);
  }

  render() {
    if (!this.model.outlets) return;
    this.bounds = this.gm('LatLngBounds');
    this.model.outlets.forEach((outlet) => {
      if (outlet.geo && outlet.geo.length) {
        const marker = this.gm('LatLng', outlet.geo[0], outlet.geo[1]);
        this.bounds.extend(marker);
      }
    });
    this.$window.google.maps.event.trigger(this.map, 'resize');

    if (this.selected) return;
    this.map.fitBounds(this.bounds);
    this.map.panToBounds(this.bounds);
    if (this.map.zoom > 14) this.map.setZoom(14);
  }

  select(outlet) {
    if (!outlet) return;
    if (outlet.selected) return this.back();
    let center = this.gm('LatLng', outlet.geo[0], outlet.geo[1] + .0075);

    if (this.isMobile) {
      center = this.gm('LatLng', outlet.geo[0] + .0035, outlet.geo[1]);
      this.isMapActive = true;
    }

    if (this.map.zoom <= 14) {
      this._previousState = {
        center: this.map.getCenter(),
        zoom: this.map.zoom
      };
    }

    this.outlets.forEach((_outlet) => {
      const equal = _outlet.id === outlet.id;
      if (equal) {
        _outlet.remains = outlet.remains;
      }
      _outlet.selected = (_outlet.id === outlet.id);
    });

    this.openInfo(outlet);
    this.$window.google.maps.event.trigger(this.map, 'resize');
    this.map.setCenter(center);
    if (this.selected || this.map.zoom < 15) this.map.setZoom(15);
  }

  back() {
    if (this.selected) {
      this.selected.icon = this.getIcon(this.selected);
      this.selected.selected = false;
      this.selected = null;
      this.map.setCenter(this._previousState.center);
      this.map.setZoom(this._previousState.zoom);

      if (this.isMobile) this.isMapActive = false;
    }
  }

  filterRemains(outlet) {
    return this.outletsRemains.filter((_remain) => _remain.outlet_id === outlet.id).length;
  }

  openInfo(outlet) {
    this.selected = outlet;
    this.selected.icon = angular.extend({}, this.defaultIcon, {
      url: '/bower_components/sl-map/src/images/new/map-white@2x.png'
    });
    this.$timeout(() => this.scroll());

    if (this.map.lastInfoWindow && this.map.lastInfoWindow !== outlet) {
      this.map.lastInfoWindow.icon = '';
    }

    this.map.lastInfoWindow = outlet;
  }

  scroll() {
    let list = document.querySelector('.adress-popup-list'); //eslint-disable-line angular/document-service
    let selected = list.querySelector('.active');

    if (!selected) {
      return;
    }

    angular.element(list).animate({
      scrollTop: selected.offsetTop - selected.offsetHeight
    });
    angular.element(document).scrollTop(window.pageYOffset + list.parentNode.getBoundingClientRect().top);  //eslint-disable-line angular/document-service,angular/window-service
  }

  gm(googleMapsMethod) {
    let args = [null].concat(Array.prototype.slice.call(arguments, 1));
    return new (Function.prototype.bind.apply(this.$window.google.maps[googleMapsMethod], args));
  }

  showcase(refresh) {
    if (refresh) {
      this._showcase = refresh;
      this.$timeout(() => {
        this.render();
        this.select();
      });
    }

    return this._showcase || this.remains ? 'list' : 'map';
  }

  proxify(event, method, outlet) {
    const ctrl = this._controller || (this.map && this.map._controller);
    if (!ctrl) return;
    ctrl[method].call(ctrl, outlet);
  }

  static getPrimary(images) {
    return images && images.filter((image) => image.is_primary)[0];
  }
}

export default Map;
