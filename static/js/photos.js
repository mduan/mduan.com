$(function() {

  function required(val, message) {
    if (val == null) { // null or undefined
      throw message || 'Required val is missing';
    } else {
      return val;
    }
  }

  function getParameterByName(name) {
    name = name.replace(/[\[]/, '\\\[').replace(/[\]]/, '\\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    var results = regex.exec(location.search);
    return results == null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
  }

  var PicasaFetcher = (function() {

    PicasaFetcher.prototype.requestJsonP = function(url, data) {
      return new Promise(function(resolve, reject) {
        return $.ajax({
          url: url,
          method: 'GET',
          data: $.extend({
            'alt': 'json-in-script'
          }, data),
          dataType: 'jsonp',
          jsonp: 'callback'
        }).then(resolve, reject);
      });
    };

    PicasaFetcher.prototype.getAlbum = function() {
      var albumsUrl = 'https://picasaweb.google.com/data/feed/api/user/' + this.options.userId;
      var self = this;
      return this.requestJsonP(albumsUrl).then(function(response) {
        var albumsToIgnoreSet = {};
        self.options.albumsToIgnore.forEach(function(albumId) {
          albumsToIgnoreSet[albumId] = true;
        });
        return response.feed.entry.filter(function(entry) {
          return !(entry.gphoto$id.$t in albumsToIgnoreSet);
        });
      });
    };

    PicasaFetcher.prototype.getPhotosInAlbum = function(album) {
      var albumUrl = album.link[0].href;
      return this.requestJsonP(
        albumUrl,
        { 'imgmax': this.options.imageSize }
      ).then(function(response) {
        return response.feed.entry;
      });
    };

    PicasaFetcher.prototype.addAlbumsToIdb = function(albums) {
      var self = this;
      albums.forEach(function(album) {
        self.options.idb.albums.update({
          id: album.gphoto$id.$t,
          timestamp: parseInt(album.gphoto$timestamp.$t),
          feedUrl: album.link[0].href,
          webUrl: album.link[1].href,
          entryUrl: album.link[2].href
        });
      });
    }

    PicasaFetcher.prototype.addPhotosToIdb = function(photos) {
      var self = this;
      photos.forEach(function(photo) {
        var pos = photo.georss$where ? photo.georss$where.gml$Point.gml$pos.$t.split(' ') : [];
        var mediaGroup = photo.media$group;
        var mediaContent = mediaGroup.media$content;
        self.options.idb.photos.update({
          id: photo.gphoto$id.$t,
          albumId: photo.gphoto$albumid.$t,
          timestamp: parseInt(photo.gphoto$timestamp.$t),
          latitude: pos[0],
          longitude: pos[1],
          imageUrl: mediaContent[0].url,
          caption: mediaGroup.media$description.$t,
          thumbnailUrl: mediaGroup.media$thumbnail[0].url,
          videoUrl: mediaContent[1] ? mediaContent[1].url : null
        });
      });
    }

    PicasaFetcher.prototype.fetchAndSave = function() {
      var self = this;
      return this.getAlbum().then(function(albums) {
        self.addAlbumsToIdb(albums);
        return Promise.all(albums.map(function(album) {
          return self.getPhotosInAlbum(album).then(self.addPhotosToIdb.bind(self));
        }));
      });
    }

    function PicasaFetcher(options) {
      required(options.userId);
      required(options.idb);

      this.options = $.extend({}, {
        imageSize: 1600,
        albumsToIgnore: []
      }, options);
    }

    return PicasaFetcher;
  })();


  var PhotoMap = (function() {
    PhotoMap.prototype.filterPhotosWithLocation = function(photos) {
      return photos.filter(function(photo) {
        return !isNaN(photo.latitude) && !isNaN(photo.longitude);
      }).map(function(photo) {
        return {
          lat: photo.latitude,
          lng: photo.longitude,
          url: photo.imageUrl,
          caption: photo.caption,
          thumbnail: photo.thumbnailUrl,
          video: photo.videoUrl
        };
      });
    };

    PhotoMap.prototype.queryPhotos = function() {
      var query = this.options.idb.photos
        .query('timestamp')
        .bound(this.options.startTime, this.options.endTime);
      if (this.options.albumId) {
        query.filter('albumId', this.options.albumId);
      }
      return query.execute().then(function(photos) {
        this.photos = this.filterPhotosWithLocation(photos);
      }.bind(this));
    };

    PhotoMap.prototype.initMap = function() {
      L.mapbox.accessToken = this.options.mapboxAccessToken;

      this.map = L.mapbox.map('map', 'mapbox.streets', {
        maxZoom: 18
      });

      this.photoLayer = L.photo.cluster().on('click', function (e) {
        var photo = e.layer.photo,
          template = '<img src="{url}"/></a><p>{caption}</p>';
        if (photo.video && ($('video').canPlayType('video/mp4; codecs=avc1.42E01E,mp4a.40.2'))) {
          template = '<video autoplay controls poster="{url}"><source src="{video}" type="video/mp4"/></video>';
        };
        e.layer.bindPopup(L.Util.template(template, photo), {
          className: 'leaflet-popup-photo',
          minWidth: 400
        }).openPopup();
      });

      this.photoLayer.addTo(this.map);
      this.resetMap();
    };

    PhotoMap.prototype.resetMap = function() {
      this.photoLayer.clear();
      this.map.fitWorld();
    };

    PhotoMap.prototype.renderPhotos = function() {
      if (this.photos.length) {
        this.photoLayer.add(this.photos);
        this.map.fitBounds(this.photoLayer.getBounds());
      }
    };

    PhotoMap.prototype.renderDatepickers = function() {
      var self = this;
      var configs = [{
        container: 'startDate',
        labelWidth: 128,
        inputWidth: 200,
        label: 'Show photos from',
        value: new Date(this.options.startTime),
        saveChange: function(timestamp) {
          self.options.startTime = !isNaN(timestamp) ? timestamp : 0;
        }
      }, {
        container: 'endDate',
        labelWidth: 28,
        inputWidth: 200,
        label: 'to',
        value: new Date(this.options.endTime),
        saveChange: function(timestamp) {
          self.options.endTime = !isNaN(timestamp) ? timestamp : Number.MAX_SAFE_INTEGER;
        }
      }];

      var self = this;
      configs.forEach(function(config) {
        var datepicker = webix.ui({
          view: 'datepicker',
          container: config.container,
          label: config.label,
          value: config.value,
          labelWidth: config.labelWidth,
          width: config.labelWidth + config.inputWidth,
          format: '%m/%d/%Y %h:%i %A',
          timepicker: true
        });

        datepicker.attachEvent('onChange', function(newDate, _) {
          config.saveChange(newDate ? newDate.getTime() : null);
          self.render();
        });
      });
    };

    PhotoMap.prototype.resetIdb = function() {
      return Promise.all([
        this.options.idb.photos.clear(),
        this.options.idb.albums.clear()
      ]);
    };

    PhotoMap.prototype.renderReloadButton = function() {
      var reloadButton = webix.ui({
        view: 'button',
        container: 'reloadButton',
        type: 'iconButton',
        label: 'Reload',
        icon: 'refresh',
        width: 90
      });

      var self = this;
      reloadButton.attachEvent('onItemClick', function() {
        reloadButton.disable();
        self.photos = [];
        self.resetIdb()
          .then(self.resetMap.bind(self))
          .then(self.fetchAndSavePhotosIfNecessary.bind(self))
          .then(self.render.bind(self))
          .then(function() {
            reloadButton.enable();
          });
      });
    };

    PhotoMap.prototype.fetchAndSavePhotosIfNecessary = function() {
      this.isFetchingPhotos = true;
      var self = this;
      return self.options.idb.photos.count().then(function(count) {
        if (count) {
          self.isFetchingPhotos = false;
          return Promise.resolve();
        } else {
          return self.options.photosFetcher.fetchAndSave().then(function() {
            self.isFetchingPhotos = false;
          });
        }
      });
    };

    PhotoMap.prototype.renderControls = function() {
      this.hasRenderedControls = true;
      this.renderDatepickers();
      this.renderReloadButton();
    };

    PhotoMap.prototype.render = function() {
      var self = this;
      if (!this.hasRenderedControls) {
        this.renderControls();
      }
      return this.fetchAndSavePhotosIfNecessary()
        .then(self.queryPhotos.bind(self))
        .then(self.renderPhotos.bind(self));
    };

    function PhotoMap(options) {
      required(options.idb);
      required(options.photosFetcher);
      required(options.mapboxAccessToken);

      this.options = $.extend({}, options);

      var currDate = new Date();
      var weekAgoDate = new Date(currDate.getTime() - 7 * 24 * 60 * 60 * 1000);
      this.options.startTime = !isNaN(this.options.startTime) ?
        this.options.startTime : weekAgoDate.getTime();
      this.options.endTime = !isNaN(this.options.endTime) ?
        this.options.endTime : currDate.getTime();

      this.initMap();
      this.render();
    }

    return PhotoMap;
  })();

  db.open({
    server: 'photoMap',
    version: 2,
    schema: {
      albums: {
        key: { keyPath: 'id' }
      },
      photos: {
        key: { keyPath: 'id' },
        indexes: {
          // TODO(mduan): create index on geo
          albumId: {},
          timestamp: {}
        }
      }
    }
  }).then(function(idb) {
    var photosFetcher = new PicasaFetcher({
      idb: idb,
      userId: '100039461888031923639',
      imageSize: 400,
      albumsToIgnore: [
        '5623841669936491985' // Profile Photos
      ]
    });
    (new PhotoMap({
      idb: idb,
      photosFetcher: photosFetcher,
      mapboxAccessToken: 'pk.eyJ1IjoibWR1YW4iLCJhIjoiY2lnMTdhaTl6MG9rN3VybTNzZjFwYTM3OCJ9._GTMIAxNtoh5p63xBiPykQ',
      startTime: parseInt(getParameterByName('startTime')),
      endTime: parseInt(getParameterByName('endTime')),
      albumId: getParameterByName('albumId')
    }));
  });
});
