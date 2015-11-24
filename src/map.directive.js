class Map {
  constructor() {
    this.scope = true;
    this.bindToController = true;
    this.controller = MapController;
    this.controllerAs = 'slMap';
    this.templateUrl = './src/map.html';
  }
}

class MapController {
  /**
   @ngInject
   */
  constructor(NgMap, Regions, Outlets, $window, $q) {
    this.NgMap = NgMap;
    this.Regions = Regions;
    this.Outlets = Outlets;
    this.$window = $window;
    this.$q = $q;
    this.model = {};
    this.init();
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
      this.model.location = this.Regions.current;
      this.model.outlets = this.outletsByRegion(this.model.location.id);
      this.render();
    });
  }

  outletsByRegion(id){
    return this.outlets.filter((_outlet) => _outlet.region_id && _outlet.region_id.indexOf(id) !== -1);
  }

  setRegion() {
    if (!this.model.location) return;
    this.model.outlets = this.outletsByRegion(this.model.location.id);
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
    if (this.map.zoom > 15 ) this.map.setZoom(15);
  }


  gm(googleMapsMethod) {
    let args = [null].concat(Array.prototype.slice.call(arguments, 1));
    return new (Function.prototype.bind.apply(this.$window.google.maps[googleMapsMethod], args));
  }
}

export default Map;