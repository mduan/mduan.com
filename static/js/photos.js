$(function() {
  function getParameterByName(name) {
    name = name.replace(/[\[]/, '\\\[').replace(/[\]]/, '\\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    var results = regex.exec(location.search);
    return results == null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
  }

  function requestJsonP(url, data) {
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
  }

  function getAlbum(userId) {
    var IGNORE_ALBUM_IDS = {
      // Profile Photos
      '5623841669936491985': true
    };
    var albumsUrl = 'https://picasaweb.google.com/data/feed/api/user/' + userId;
    return requestJsonP(albumsUrl).then(function(response) {
      return response.feed.entry.filter(function(entry) {
        return !(entry.gphoto$id.$t in IGNORE_ALBUM_IDS);
      });
    });
  }

  function getPhotosInAlbum(album, imageSize) {
    var albumUrl = album.link[0].href;
    return requestJsonP(albumUrl, { 'imgmax': imageSize }).then(function(response) {
      return response.feed.entry;
    });
  }

  function addAlbumsToIdb(idb, albums) {
    albums.forEach(function(album) {
      idb.albums.update({
        id: album.gphoto$id.$t,
        timestamp: parseInt(album.gphoto$timestamp.$t),
        feedUrl: album.link[0].href,
        webUrl: album.link[1].href,
        entryUrl: album.link[2].href
      });
    });
  }

  function addPhotosToIdb(idb, photos) {
    photos.forEach(function(photo) {
      var pos = photo.georss$where ? photo.georss$where.gml$Point.gml$pos.$t.split(' ') : [];
      var mediaGroup = photo.media$group;
      var mediaContent = mediaGroup.media$content;
      idb.photos.update({
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

  function fetchAndSavePicasaData(idb) {
    var USER_ID = '100039461888031923639';
    var IMAGE_SIZE = 400;
    return getAlbum(USER_ID).then(function(albums) {
      addAlbumsToIdb(idb, albums);
      return Promise.all(albums.map(function(album) {
        return getPhotosInAlbum(album, IMAGE_SIZE)
          .then(addPhotosToIdb.bind(null, idb));
      }));
    });
  }

  function PhotoMap(idb, options) {
    this.setStartTime = function(timestamp) {
      this.startTime = !isNaN(timestamp) ? timestamp : 0;
    };

    this.setEndTime = function(timestamp) {
      this.endTime = !isNaN(timestamp) ? timestamp : Number.MAX_SAFE_INTEGER;
    };

    options = options || {};
    this.idb = idb;
    this.albumId = options.albumId;

    var currDate = new Date();
    var weekAgoDate = new Date(currDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    this.setStartTime(!isNaN(options.startTime) ? options.startTime : weekAgoDate.getTime());
    this.setEndTime(!isNaN(options.endTime) ? options.endTime : currDate.getTime());

    this.filterPhotosWithLocation = function(photos) {
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

    this.queryPhotos = function() {
      var query = this.idb.photos
        .query('timestamp')
        .bound(this.startTime, this.endTime);
      if (this.albumId) {
        query.filter('albumId', this.albumId);
      }
      return query.execute().then(function(photos) {
        this.photos = this.filterPhotosWithLocation(photos);
      }.bind(this));
    };

    this.initMap = function() {
      if (this.map) {
        return;
      }

      L.mapbox.accessToken = 'pk.eyJ1IjoibWR1YW4iLCJhIjoiY2lnMTdhaTl6MG9rN3VybTNzZjFwYTM3OCJ9._GTMIAxNtoh5p63xBiPykQ';

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
    };

    this.renderPhotos = function() {
      if (!this.map) {
        this.initMap();
      }

      this.photoLayer.clear();
      if (this.photos.length) {
        this.photoLayer.add(this.photos);
        this.map.fitBounds(this.photoLayer.getBounds());
      } else {
        this.map.fitWorld();
      }
    };

    this.renderControls = function() {
      this.hasRenderedControls = true;

      var dateFormat = '%m/%d/%Y %h:%i %A';
      var configs = [{
        container: 'startDate',
        labelWidth: 128,
        inputWidth: 200,
        label: 'Show photos from',
        value: new Date(this.startTime),
        saveChange: this.setStartTime.bind(this)
      }, {
        container: 'endDate',
        labelWidth: 28,
        inputWidth: 200,
        label: 'to',
        value: new Date(this.endTime),
        saveChange: this.setEndTime.bind(this)
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
          format: dateFormat,
          timepicker: true
        });

        datepicker.attachEvent('onChange', function(newDate, _) {
          config.saveChange(newDate ? newDate.getTime() : null);
          self.render();
        });
      });
    };

    this.render = function() {
      this.queryPhotos().then(function() {
        this.renderPhotos();

        if (!this.hasRenderedControls) {
          this.renderControls();
        }
      }.bind(this));
    };
  }

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
    idb.photos.count().then(function(count) {
      return count ? Promise.resolve() : fetchAndSavePicasaData(idb);
    }).then(function() {
      (new PhotoMap(idb, {
        startTime: parseInt(getParameterByName('startTime')),
        endTime: parseInt(getParameterByName('endTime')),
        albumId: getParameterByName('albumId')
      })).render();
    });
  });
});
