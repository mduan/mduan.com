L.Photo = L.FeatureGroup.extend({
  options: {
    icon: {
      iconSize: [40, 40]
    }
  },

  initialize: function(photos, options) {
    L.setOptions(this, options);
    L.FeatureGroup.prototype.initialize.call(this, photos);
  },

  addLayers: function(photos) {
    if (photos) {
      photos.forEach(function(photo) {
        this.addLayer(photo);
      }, this);
    }
    return this;
  },

  addLayer: function(photo) {
    L.FeatureGroup.prototype.addLayer.call(this, this.createMarker(photo));
  },

  createMarker: function(photo) {
    var self = this;
    var latLng = {
      lat: photo.latitude,
      lng: photo.longitude
    };
    var marker = L.marker(latLng, {
      icon: L.divIcon(L.extend({
        html: '<div class="markerThumbnail" style="background-image: url(' + photo.thumbnailUrl + ');"></div>',
        className: 'leafletMarkerPhoto'
      }, photo, this.options.icon)),
      title: photo.caption
    }).bindPopup('', {
      className: 'leaflet-popup-photo',
      maxWidth: 750
    });
    marker.photo = photo;
    return marker;
  }
});

L.photo = function(photos, options) {
  return new L.Photo(photos, options);
};

if (L.MarkerClusterGroup) {

  L.Photo.Cluster = L.MarkerClusterGroup.extend({
    options: {
      featureGroup: L.photo,
      maxClusterRadius: 50,
      showCoverageOnHover: false,
      iconCreateFunction: function(cluster) {
        return new L.DivIcon(L.extend({
          className: 'leafletMarkerPhoto',
          html: '<div class="markerThumbnail" style="background-image: url(' + cluster.getAllChildMarkers()[0].photo.thumbnailUrl + ');"></div><div class="markerCount">' + cluster.getChildCount() + '</div>'
        }, this.icon));
      },
      icon: {
        iconSize: [40, 40]
      }
    },

    initialize: function(options) {
      options = L.Util.setOptions(this, options);
      L.MarkerClusterGroup.prototype.initialize.call(this);
      this._photos = options.featureGroup(null, options);
    },

    add: function(photos) {
      this.addLayer(this._photos.addLayers(photos));
      return this;
    },

    clear: function() {
      this._photos.clearLayers();
      this.clearLayers();
      return this;
    }

  });

  L.photo.cluster = function(options) {
    return new L.Photo.Cluster(options);
  };
}
