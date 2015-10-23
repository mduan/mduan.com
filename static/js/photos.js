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

  function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function arrayToSet(array) {
    var set = {};
    array.forEach(function(elem) {
      set[elem] = true;
    });
    return set;
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

    PicasaFetcher.prototype.getAlbumsList = function() {
      var albumsUrl = 'https://picasaweb.google.com/data/feed/api/user/'
        + this.options.userId + '?thumbsize=' + this.options.albumThumbnailSize;
      var self = this;
      return this.requestJsonP(albumsUrl).then(function(response) {
        var albumsToIgnoreSet = arrayToSet(self.options.albumsToIgnore);
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
        var mediaGroup = album.media$group;
        self.options.idb.albums.update({
          id: album.gphoto$id.$t,
          title: album.title.$t,
          numPhotos: album.gphoto$numphotos.$t,
          imageUrl: mediaGroup.media$content[0].url,
          thumbnailUrl: mediaGroup.media$thumbnail[0].url,
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
      this.options.cssLoader.updateMessage('Fetching from Picasa');
      return this.getAlbumsList().then(function(albums) {
        self.addAlbumsToIdb(albums);

        self.options.cssLoader.updateMessage('Fetching albums');
        var numAlbumsFetched = 0;
        return Promise.all(albums.map(function(album) {
          return self.getPhotosInAlbum(album).then(function(photos) {
            ++numAlbumsFetched;
            self.options.cssLoader.updateMessage(
              'Fetched ' + numAlbumsFetched + ' of ' + albums.length + ' albums'
            );
            self.addPhotosToIdb(photos)
          });
        }));
      });
    }

    function PicasaFetcher(options) {
      required(options.userId);
      required(options.idb);
      required(options.cssLoader);

      this.options = $.extend({}, {
        imageSize: 1600,
        albumThumbnailSize: 278,
        albumsToIgnore: []
      }, options);
    }

    PicasaFetcher.openIdb = function() {
      return db.open({
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
      });
    };

    return PicasaFetcher;
  })();


  var PhotoMap = (function() {
    // TODO(mduan): Move data querying logic into PicasaFetcher or another class
    //
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
      if (this.options.startTime > this.options.endTime) {
        return Promise.resolve();
      }

      this.options.cssLoader.updateMessage('Querying photos');
      var query = this.options.idb.photos
        .query('timestamp')
        .bound(this.options.startTime, this.options.endTime);
      if (this.options.albumIds) {
        var albumIdsSet = arrayToSet(this.options.albumIds);
        query.filter(function(photo) {
          return photo.albumId in albumIdsSet;
        });
      }
      return query.execute().then(function(photos) {
        this.photos = this.filterPhotosWithLocation(photos);
      }.bind(this));
    };

    PhotoMap.prototype.queryTimeRangeItemForAlbum = function(album, isDesc) {
      var query = this.options.idb.photos
        .query('timestamp')
        .filter('albumId', album.id);

      if (isDesc) {
        query = query.desc();
      }

      return query.limit(1).execute().then(function(photos) {
        if (photos.length) {
          return photos[0].timestamp;
        }
      });
    };

    PhotoMap.prototype.queryTimeRangeForAlbums = function(albums) {
      var self = this;
      var timeRangePromises = albums.map(function(album) {
        return Promise.all([
          self.queryTimeRangeItemForAlbum(album, /*isDesc=*/ false),
          self.queryTimeRangeItemForAlbum(album, /*isDesc=*/ true)
        ]).then(function(timeRange) {
          return $.extend({}, album, {
            minTimestamp: timeRange[0],
            maxTimestamp: timeRange[1]
          });
        });
      });
      return Promise.all(timeRangePromises);
    };

    PhotoMap.prototype.initMap = function() {
      L.mapbox.accessToken = this.options.mapboxAccessToken;

      this.map = L.mapbox.map('map', 'mapbox.streets', {
        maxZoom: 18
      });

      this.photoLayer = L.photo.cluster().on('click', function (e) {
        var photo = e.layer.photo;
        var template = '<img src="{url}"/></a><p>{caption}</p>';
        if (photo.video && ($('video').canPlayType('video/mp4; codecs=avc1.42E01E,mp4a.40.2'))) {
          template = '<video autoplay controls poster="{url}"><source src="{video}" type="video/mp4"/></video>';
        };
        e.layer.bindPopup(L.Util.template(template, photo), {
          className: 'leaflet-popup-photo',
          minWidth: 400
        }).openPopup();
      });

      this.photoLayer.addTo(this.map);
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
        label: 'Show photos from',
        value: new Date(this.options.startTime),
        saveChange: function(timestamp) {
          self.options.startTime = !isNaN(timestamp) ? timestamp : 0;
        }
      }, {
        container: 'endDate',
        labelWidth: 28,
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
          width: config.labelWidth + 130,
          format: '%m/%d/%Y',
          timepicker: false
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
      this.$$reloadButton = webix.ui({
        view: 'button',
        container: 'reloadButton',
        type: 'iconButton',
        label: 'Refetch Photos',
        icon: 'refresh',
        width: 150
      });

      var self = this;
      this.$$reloadButton.attachEvent('onItemClick', function() {
        self.photos = [];
        self.$$reloadButton.blur();
        self.resetIdb().then(self.render.bind(self));
      });
    };

    PhotoMap.prototype.fetchAndSavePhotosIfNecessary = function() {
      var self = this;
      return self.options.idb.photos.count().then(function(count) {
        self.beforeLoad();
        if (count) {
          return Promise.resolve();
        } else {
          return self.options.photosFetcher.fetchAndSave();
        }
      });
    };

    PhotoMap.prototype.renderAlbums = function() {
      if (this.$$albumsList) {
        this.$$albumsList.show();
        return;
      }

      var self = this;
      this.options.idb.albums.query().all().execute()
        .then(self.queryTimeRangeForAlbums.bind(self))
        .then(function(albums) {
          albums.sort(function(albumA, albumB) {
            var aMinTimestamp = albumA.minTimestamp || 0;
            var aMaxTimestamp = !isNaN(albumA.maxTimestamp) ? albumA.maxTimestamp : Number.MAX_SAFE_INTEGER;
            var bMinTimestamp = albumB.minTimestamp || 0;
            var bMaxTimestamp = !isNaN(albumB.maxTimestamp) ? albumB.maxTimestamp : Number.MAX_SAFE_INTEGER;
            if (aMaxTimestamp === bMaxTimestamp) {
              return bMinTimestamp - aMinTimestamp;
            } else {
              return bMaxTimestamp - aMaxTimestamp;
            }
          });

          var dateFormatter = webix.Date.dateToStr("%M %j, %Y");
          albums.forEach(function(album) {
            if (isNaN(album.minTimestamp) || isNaN(album.maxTimestamp)) {
              return;
            }
            album.minDate = dateFormatter(new Date(album.minTimestamp));
            album.maxDate = dateFormatter(new Date(album.maxTimestamp));
          });

          self.$$albumsList = webix.ui({
            view: 'dataview',
            select: 'multiselect',
            multiselect: 'touch',
            drag: false,
            data: albums,
            datatype: 'json',
            container: 'albumsList',
            borderless: true,
            type: {
              width: 286,
              height: 217,
              template: function(album) {
                return self.albumTemplate(album);
              }
            },
            scroll: true,
            width: 860,
            height: 350
          });

          self.$$albumsList.attachEvent('onSelectChange', function() {
            var albumIds = self.$$albumsList.getSelectedId();
            if (!albumIds) {
              albumIds = null;
            } else if (!Array.isArray(albumIds)) {
              albumIds = [albumIds];
            }
            self.options.albumIds = albumIds;
            self.render();
          });
        });
    };

    PhotoMap.prototype.renderChooseAlbumsButton = function() {
      var chooseAlbumsButton = webix.ui({
        view: 'toggle',
        container: 'chooseAlbumsButton',
        type: 'iconButton',
        offIcon: 'photo',
        onIcon: 'photo',
        offLabel: 'Choose albums',
        onLabel: 'Hide albums',
        icon: 'photo',
        width: 150,
      });

      var self = this;
      chooseAlbumsButton.attachEvent('onItemClick', function() {
        if (chooseAlbumsButton.getValue() === 0) {
          if (self.$$albumsList) {
            self.$$albumsList.hide();
          }
        } else {
          self.renderAlbums();
        }
      });

      chooseAlbumsButton.callEvent('onItemClick');
    };

    PhotoMap.prototype.fetchAndSavePhotosIfNecessary = function() {
      var self = this;
      return self.options.idb.photos.count().then(function(count) {
        self.beforeLoad();
        if (count) {
          return Promise.resolve();
        } else {
          if (self.$$reloadButton) {
            self.$$reloadButton.disable();
          }
          return self.options.photosFetcher.fetchAndSave();
        }
      });
    };

    PhotoMap.prototype.renderControls = function() {
      this.hasRenderedControls = true;
      this.renderDatepickers();
      this.renderReloadButton();
      this.renderChooseAlbumsButton();
    };

    PhotoMap.prototype.render = function() {
      var self = this;
      if (!this.hasRenderedControls) {
        this.renderControls();
      }
      return this.fetchAndSavePhotosIfNecessary()
        .then(self.queryPhotos.bind(self))
        .then(self.renderPhotos.bind(self))
        .then(self.afterLoad.bind(self));
    };

    PhotoMap.prototype.beforeLoad = function() {
      this.photoLayer.clear();
      this.photos = [];

      this.options.cssLoader.startLoading();

      // TODO(mduan): Find cleaner way to do this
      $(this.map._container).addClass('disabled');
    };

    PhotoMap.prototype.afterLoad = function() {
      if (this.$$reloadButton) {
        this.$$reloadButton.enable();
      }
      // TODO(mduan): Find cleaner way to do this
      $(this.map._container).removeClass('disabled');
      this.options.cssLoader.stopLoading();
    };

    function compileTemplate($template) {
      //return _.template($elem.html(), { variable: 'data' });
      debugger;
      return _.template($template.html());
    }

    function PhotoMap(options) {
      required(options.idb);
      required(options.photosFetcher);
      required(options.mapboxAccessToken);
      required(options.cssLoader);

      this.options = $.extend({}, options);

      var currDate = new Date();
      if (this.options.startTime || this.options.endTime) {
        this.options.startTime = this.options.startTime || 0;
        this.options.endTime = !isNaN(this.options.endTime) ?  this.options.endTime : currDate.getTime();
      } else {
        var weekAgoDate = new Date(currDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        this.options.startTime = weekAgoDate.getTime();
        this.options.endTime = currDate.getTime();
      }

      this.albumTemplate = compileTemplate($('#albumTemplate'));
      this.initMap();
      this.render();
    }

    return PhotoMap;
  })();

  var CssLoader = (function() {

    CssLoader.prototype.loaders = [
      // { className: 'la-ball-fussion', numDivs: 4 },
      // { className: 'la-ball-newton-cradle', numDivs: 4 },
      { className: 'la-line-scale', numDivs: 5 },
      { className: 'la-timer', numDivs: 1 }
    ];

    CssLoader.prototype.startLoading = function() {
      if (this.startTime) {
        // Already in the middle of loading...
        return;
      }

      this.startTime = Date.now();

      if (this.options.sequential) {
        this.index = (this.index + 1) % this.loaders.length;
      } else {
        this.index = getRandomInt(0, this.loaders.length - 1);
      }
      var loader = this.loaders[this.index];

      var $loaderBox = $('<div/>').addClass('loaderBox');
      var $loader = $('<div/>')
        .addClass(loader.className)
        .addClass('loader')
        .addClass('la-1x');
      for (var i = 0; i < loader.numDivs; ++i) {
        $loader.append($('<div/>'));
      }
      this.$message = $('<div/>').addClass('message');
      $loaderBox
        .append(this.$message)
        .append($loader);
      this.options.$loaderContainer.append($loaderBox);
      this.options.$overlay.show();
    };

    CssLoader.prototype.updateMessage = function(message) {
      if (this.$message) {
        this.$message.text(message);
      }
    };

    CssLoader.prototype.reset = function() {
      this.$message = null;
      this.startTime = null;
      this.options.$loaderContainer.empty();
      this.options.$overlay.hide();
    };

    CssLoader.prototype.stopLoading = function() {
      var elapsedTime = Math.max(Date.now() - this.startTime, 0);
      if (elapsedTime < this.options.minDuration) {
        setTimeout(this.reset.bind(this), this.options.minDuration - elapsedTime);
      } else {
        this.reset();
      }
    };

    function CssLoader(options) {
      required(options.$loaderContainer);
      required(options.$overlay);

      this.options = $.extend({}, options, {
        minDuration: 400
      });
      this.index = 0;
    }

    return CssLoader;
  })();

  PicasaFetcher.openIdb().then(function(idb) {
    var cssLoader = new CssLoader({
      $loaderContainer: $('#loaderContainer'),
      $overlay: $('#overlay')
    });
    var photosFetcher = new PicasaFetcher({
      idb: idb,
      userId: '100039461888031923639',
      cssLoader: cssLoader,
      imageSize: 400,
      albumsToIgnore: [
        '5623841669936491985' // Profile Photos
      ]
    });
    (new PhotoMap({
      idb: idb,
      photosFetcher: photosFetcher,
      cssLoader: cssLoader,
      mapboxAccessToken: 'pk.eyJ1IjoibWR1YW4iLCJhIjoiY2lnMTdhaTl6MG9rN3VybTNzZjFwYTM3OCJ9._GTMIAxNtoh5p63xBiPykQ',
      startTime: parseInt(getParameterByName('startTime')),
      endTime: parseInt(getParameterByName('endTime')),
      // TODO(mduan): Convert to array
      albumIds: getParameterByName('albumIds')
    }));
  });
});
