const mapTpl = require('ngtemplate!html!./map.html');
class Map {
  constructor() {
    this.scope = true;
    this.bindToController = true;
    this.controller = MapController;
    this.controllerAs = 'slMap';
    this.templateUrl = mapTpl;
  }
}

class MapController {
  /**
   @ngInject
   */
  constructor(NgMap, Regions, Outlets, $timeout, $rootScope, $window, $q) {
    this.NgMap = NgMap;
    this.Regions = Regions;
    this.Outlets = Outlets;
    this.$timeout = $timeout;
    this.$window = $window;
    this.$q = $q;
    this.model = {};
    this.isMobile = /android|ip(hone|ad|od)/i.test($window.navigator.userAgent);
    this.init();

    $rootScope.$on('mapShow', (event, outlet) => {
      $timeout(() => {
        this.select(outlet || {id: null});
        this.render();
      });
    });
  }

  init() {
    this.$q.all({
      regions: this.Regions.fetch(),
      outlets: this.Outlets.fetch(),
      map: this.NgMap.getMap()
    }).then((responses) => {
      this.regions = responses.regions;
      this.outlets = responses.outlets;
      this.map = responses.map;
      this.map._controller = this;
      this.model.location = this.Regions.current;
      this.model.outlets = this.Outlets.byRegion(this.model.location.id);
      this.render();
    });
  }

  setRegion() {
    if (!this.model.location) return;
    this.model.outlets = this.Outlets.byRegion(this.model.location.id);
    this.Regions.setRegion(this.model.location.id);
    this.render();
  }

  render() {
    this.bounds = this.gm('LatLngBounds');
    this.model.outlets.forEach((outlet) => {
      if (outlet.geo && outlet.geo.length) {
        const marker = this.gm('LatLng', outlet.geo[0], outlet.geo[1]);
        this.bounds.extend(marker);
      }
    });
    this.$window.google.maps.event.trigger(this.map, 'resize');
    this.map.fitBounds(this.bounds);
    this.map.panToBounds(this.bounds);
    if (this.map.zoom > 15) this.map.setZoom(15);
  }

  select(outlet) {
    this.model.outlets.forEach((_outlet) => {
      _outlet.selected = (_outlet.id === outlet.id);
    });

    if(!outlet.id) return;
    if (this.map.zoom < 15) this.map.setZoom(15);
    this.map.setCenter(this.gm('LatLng', outlet.geo[0], outlet.geo[1]));
    this.openInfo(null, outlet);
  }

  openInfo(event, outlet){
    const id = outlet.id;
    const ctrl = event ? this.map._controller : this;

    ctrl.selected = outlet;
    ctrl.selected.icon = 'http://cdn1.love.sl/love.sl/common/actions/charm/assets/marker_active.png';

    this.map.showInfoWindow('info', `outlet_${id}`);
    if (event !== null) {
      ctrl.select.call(ctrl, outlet);
      ctrl.$timeout(() => ctrl.scroll.call(ctrl));
    }

    if (!this.map.singleInfoWindow) return;

    if (this.map.lastInfoWindow && this.map.lastInfoWindow !== outlet) {
      this.map.hideInfoWindow('info');
      this.map.lastInfoWindow.icon = '';
    }

    this.map.lastInfoWindow = outlet;
  }

  scroll(){
    let list = document.querySelector('.outlets--wrapper'); //eslint-disable-line angular/document-service
    let selected = list.querySelector('.outlet-selected');
    angular.element(list).animate({
      scrollTop: selected.offsetTop - selected.offsetHeight
    });
    angular.element(document).scrollTop(window.pageYOffset + list.parentNode.getBoundingClientRect().top);  //eslint-disable-line angular/document-service,angular/window-service
  }

  gm(googleMapsMethod) {
    let args = [null].concat(Array.prototype.slice.call(arguments, 1));
    return new (Function.prototype.bind.apply(this.$window.google.maps[googleMapsMethod], args));
  }

  showcase(refresh){
    if (refresh) {
      this._showcase = refresh;
      this.$timeout(() => {
        this.render();
      });
    }

    return this._showcase || 'list';
  }
}

export default Map;
