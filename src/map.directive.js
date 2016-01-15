const mapTpl = require('ngtemplate!html!./map.html');
class Map {
  constructor() {
    this.scope = true;
    this.bindToController = {
      outletsRemains: '@slMapFilter',
      selectedSize: '@slMapRemainsSize'
    };
    this.controller = MapController;
    this.controllerAs = 'slMap';
    this.templateUrl = mapTpl;
  }
}

class MapController {

  /*
   Логика:
   - при выборе региона отображается ТТ региона
   - при отдалении карты - показываются в первую очередь ТТ выбранного региона
   - при поиске в первую очередь показываются ТТ выбранного региона
   - во вторую очередь в перечисленных случаях отображаются ТТ других регионов отсортированные по типу
   - От первой очереди вторая отделена подчеркнутым заголовком "В других регионах"
   Техника:
   - запрос точек по региону при ините
   - отрисовка точек по всей россии
   - добавление точек по региону в список справа
   - при поиске по названию/адресу - поиск среди всех точек по РФ
   - при выборе точки показывать список ТТ региона (если поле поиска пустое) или оставлять найденные ТТ (если заполнено поле поиска)
   - при зуме (и отсутствии выбранной точки) показывать точки которые находятся на карте
   - если включены остатки, показывать остатки по региону, когда увеличиваем зум и попадаем на точки другого региона - добавляем к ним остатки запросом в батч

   TODO:
   -- вернуть увеличение списка при отдалении
   -- крестик вынести за попап
   -- переключение на карту мобильный вид
   -- отцентровать активную иконку
   */

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
  }

  init() {
    this.$q.all({
      regions: this.Regions.fetch(),
      outlets: this.Outlets.fetch(),
      map: this.NgMap.getMap()
    }).then((responses) => {
      this.regions = this.Regions.all;
      this.outlets = responses.outlets;
      this.map = responses.map;
      this.map._controller = this;
      this.map.width = this.$window.outerWidth;
      this.map.height = this.$window.outerHeight;
      this.model.location = this.Regions.current;

      //this.fetchRemains();
      this.initRemains();
      this.render();
    });
  }

  initRemains() {
    this.outletsRemains = this.outletsRemains && angular.fromJson(this.outletsRemains);
    this.model.outlets = this.outletsRemains ?
      this.Outlets.byRegion(this.model.location.id).filter(this.filterRemains.bind(this)) :
      this.Outlets.byRegion(this.model.location.id);

    if (!this.outletsRemains) return;

    this.remains = this.reduceBySize(this.outletsRemains);
  }

  reduceBySize (remainsArr) {
    const remains = remainsArr.reduce((remains, remain) => {
      let outlet = this.model.outlets.filter((_outlet) => _outlet.id === remain.outlet_id)[0];
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

    return remains;
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

  fetchRemains(outlet, regionId) {
    this.Remains.fetch(null, regionId).then((response) => {
      this.outletsRemains.concat(response.data);
      outlet.remains = response.data.filter((_remain) =>
        _remain.outlet_id === outlet.id && Number(this.selectedSize) === _remain.size)[0];
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
      let outlets = this.outlets;

      if (this.outletsRemains) {
        outlets = this.remains && (this.remains[this.selectedSize] || this.remains[0]);
      }

      if (this.isMobile) {
        this.filtered = outlets;
      }

      if (this.selected || this.isMobile) {
        return;
      }

      let bounds = this.map.getBounds();

      this.filtered = outlets.filter((outlet) =>
        bounds.contains(this.gm('LatLng', outlet.geo[0], outlet.geo[1])));

      this.otherRegion = this.outletsRemains &&
        this.outlets.filter((outlet) => {
          if (!bounds.contains(this.gm('LatLng', outlet.geo[0], outlet.geo[1])))
            return;

          if (outlet.region_id.indexOf(this.model.location.id) !== -1)
            return;

          outlet.region_id.forEach(this.fetchRemains.bind(this, outlet));
          return true;
        });
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
      this.selected.icon = '';
      this.selected.selected = false;
      this.selected = null;

      if (this.isMobile) this.isMapActive = false;
    }
    this.$scope.$evalAsync(this.render.bind(this));
  }

  filterRemains(outlet) {
    return this.outletsRemains.filter((_remain) => _remain.outlet_id === outlet.id).length;
  }

  openInfo(outlet) {
    this.selected = outlet;
    this.selected.icon = '/bower_components/sl-map/src/images/new/marker-active.png';
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
