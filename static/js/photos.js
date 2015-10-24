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

    PicasaFetcher.prototype.fetchAlbumsList = function() {
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

    PicasaFetcher.prototype.fetchPhotosInAlbum = function(album) {
      return this.requestJsonP(
        album.feedUrl,
        { 'imgmax': this.options.imageSize }
      ).then(function(response) {
        return response.feed.entry;
      });
    };

    PicasaFetcher.prototype.extractAlbums = function(albums) {
      return albums.map(function(album) {
        var mediaGroup = album.media$group;
        return {
          id: album.gphoto$id.$t,
          title: album.title.$t,
          numPhotos: album.gphoto$numphotos.$t,
          imageUrl: mediaGroup.media$content[0].url,
          thumbnailUrl: mediaGroup.media$thumbnail[0].url,
          timestamp: parseInt(album.gphoto$timestamp.$t),
          feedUrl: album.link[0].href,
          webUrl: album.link[1].href,
          entryUrl: album.link[2].href
        };
      });
    };

    PicasaFetcher.prototype.saveAlbumsToIdb = function(albums) {
      return this.options.idb.albums.add(albums);
    };

    PicasaFetcher.prototype.extractPhotos = function(photos) {
      return photos.map(function(photo) {
        var pos = photo.georss$where ? photo.georss$where.gml$Point.gml$pos.$t.split(' ') : [];
        var mediaGroup = photo.media$group;
        var mediaContent = mediaGroup.media$content;
        return {
          id: photo.gphoto$id.$t,
          albumId: photo.gphoto$albumid.$t,
          timestamp: parseInt(photo.gphoto$timestamp.$t),
          latitude: pos[0],
          longitude: pos[1],
          caption: mediaGroup.media$description.$t,
          imageUrl: mediaContent[0].url,
          thumbnailUrl: mediaGroup.media$thumbnail[0].url,
          videoUrl: mediaContent[1] ? mediaContent[1].url : null,
          webUrl: photo.link[2].href
        };
      });
    };

    PicasaFetcher.prototype.savePhotosToIdb = function(photos) {
      return this.options.idb.photos.add(photos);
    };

    //PhotoMap.prototype.queryTimeRangeItemForAlbum = function(album, isDesc) {
    //  var query = this.options.idb.photos
    //    .query('timestamp')
    //    .filter('albumId', album.id);

    //  if (isDesc) {
    //    query = query.desc();
    //  }

    //  return query.limit(1).execute().then(function(photos) {
    //    if (photos.length) {
    //      return photos[0].timestamp;
    //    }
    //  });
    //};

    //PhotoMap.prototype.queryTimeRangeForAlbums = function(albums) {
    //  var self = this;
    //  var timeRangePromises = albums.map(function(album) {
    //    return Promise.all([
    //      self.queryTimeRangeItemForAlbum(album, /*isDesc=*/ false),
    //      self.queryTimeRangeItemForAlbum(album, /*isDesc=*/ true)
    //    ]).then(function(timeRange) {
    //      return $.extend({}, album, {
    //        minTimestamp: timeRange[0],
    //        maxTimestamp: timeRange[1]
    //      });
    //    });
    //  });
    //  return Promise.all(timeRangePromises);
    //};

    PicasaFetcher.prototype.fetchAndSave = function() {
      var self = this;
      this.options.cssLoader.updateMessage('Fetching from Picasa');
      return this.fetchAlbumsList().then(function(albums) {
        albums = self.extractAlbums(albums);
        self.options.cssLoader.updateMessage('Fetching albums');

        var numAlbumsSaved = 0;
        var promises = albums.map(function(album) {
          return self.fetchPhotosInAlbum(album).then(function(photos) {
            photos = self.extractPhotos(photos);
            if (photos.length) {
              var minPhoto = _.min(photos, function(photo) { return photo.timestamp; });
              var maxPhoto = _.max(photos, function(photo) { return photo.timestamp; });
              $.extend(album, {
                minTimestamp: _.isNumber(minPhoto) && !isFinite(minPhoto) ? null : minPhoto.timestamp,
                maxTimestamp: _.isNumber(maxPhoto) && !isFinite(maxPhoto) ? null : maxPhoto.timestamp
              });
            }

            return self.savePhotosToIdb(photos).then(function(photos) {
              ++numAlbumsSaved;
              self.options.cssLoader.updateMessage(
                'Saved ' + numAlbumsSaved + ' of ' + albums.length + ' albums'
              );
            });
          });
        });
        return Promise.all(promises).then(self.saveAlbumsToIdb.bind(self, albums));
      });
    };

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

  var LeafletLockControl = L.Control.extend({
    options: {
      position: 'topleft'
    },

    lock: function() {
      this._$link
        .addClass('fa-lock')
        .removeClass('fa-unlock-alt');
    },

    unlock: function() {
      this._$link
        .addClass('fa-unlock-alt')
        .removeClass('fa-lock');
    },

    toggleLock: function() {
      if (this._$link.hasClass('fa-unlock-alt')) {
        this.lock();
      } else {
        this.unlock();
      }
      return this._$link.hasClass('fa-lock');
    },

    onAdd: function(map) {
      // leaflet-control-locate leaflet-bar leaflet-control active
      // create the control container with a particular class name
      var $container = $('<div>')
        .addClass('leaflet-control-lock')
        .addClass('leaflet-bar')
        .addClass('leaflet-control');
      $container.html('<a class="leaflet-bar-part leaflet-bar-part-single" href="#" title="Limit seach to visible region"><span class="fa fa-unlock-alt"></span></a>');
      this._$link = $container.find('.fa-unlock-alt');

      if (this.options.isLocked) {
        this.lock();
      }

      var self = this;
      var $lockButton = $container.find('.leaflet-bar-part');
      $lockButton.click(function(e) {
        e.stopPropagation();
        e.preventDefault();
        var locked = self.toggleLock();
        self.options.onStateChange && self.options.onStateChange(locked);
      });

      if (this._map) {
        this._map.on('dragend', function() {
          if (self._$link.hasClass('fa-unlock-alt')) {
            $lockButton.click();
          }
        });
      }
      return $container[0];
    }
  });


  var PhotoMap = (function() {
    // TODO(mduan): Move data querying logic into PicasaFetcher or another class
    PhotoMap.prototype.filterPhotosWithLocation = function(photos) {
      return photos.filter(function(photo) {
        return !isNaN(photo.latitude) && !isNaN(photo.longitude);
      });
    };

    PhotoMap.prototype.queryPhotos = function() {
      if (this.options.startTime > this.options.endTime) {
        return Promise.resolve();
      }

      this.options.cssLoader.updateMessage('Querying photos');

      if (this.options.isDateRangeLocked) {
        var query = this.options.idb.photos
          .query('timestamp')
          .bound(this.options.startTime, this.options.endTime);
      } else {
        var query = this.options.idb.photos
          .query()
          .all();
      }

      if (this.options.albumIds) {
        var albumIdsSet = arrayToSet(this.options.albumIds);
        query = query.filter(function(photo) {
          return photo.albumId in albumIdsSet;
        });
      }

      var self = this;
      return query.execute().then(function(photos) {
        self.photos = self.filterPhotosWithLocation(photos);
        return self.photos;
      });
    };

    PhotoMap.prototype.initMap = function() {
      L.mapbox.accessToken = this.options.mapboxAccessToken;

      this.map = L.mapbox.map('map', 'mapbox.streets', {
        maxZoom: 18,
        zoomControl: false
      });

      var self = this;
      this.photoLayer = L.photo.cluster().on('click', function (e) {
        var photo = e.layer.photo;
        var photoMoment = moment(photo.timestamp);
        var data = $.extend({
          isVideoSupported: $('<video>')[0].canPlayType('video/mp4; codecs=avc1.42E01E,mp4a.40.2'),
          // TODO(mduan): Consider timezone
          dateStr: photoMoment.format('MMMM Do YYYY'),
          timeStr: photoMoment.format('h:mma')
        }, e.layer.photo);
        var templateHtml = self.photoPopupTemplate(data);
        e.layer.setPopupContent(templateHtml).openPopup();

        var popup = e.layer._popup;
        var $content = $(popup._contentNode);

        // TODO(mduan): Look for way to do this without binding to map
        $(self.map._container).on('click', '.mediaDate', function() {
          var $el = $(this);
          var timestamp = parseInt($el.attr('data-timestamp'));
          self.options.startTime = moment(timestamp).startOf('day').unix() * 1000;
          self.options.endTime = moment(timestamp).endOf('day').unix() * 1000;
          self.lockDateRange();
          self.render();
        });

        var $videoMedia = $content.find('video.popupMedia');
        var $image = $();
        if ($videoMedia.length) {
          var posterUrl = $videoMedia.attr('poster');
          if (posterUrl) {
            $image = $('<img>').attr('src', posterUrl);
          }
        } else {
          $image = $content.find('img.popupMedia');
        }
        $image.bind('load', function() {
          popup.update();
        });
      }).addTo(this.map);

      (new L.Control.Zoom({
        position: this.options.controlPosition
      })).addTo(this.map);

      L.control.locate({
        position: this.options.controlPosition,
        locateOptions: {
          enableHighAccuracy: true,
          maxZoom: 16
        }
      }).addTo(this.map);

      var self = this;
      this.mapLockControl = new LeafletLockControl({
        position: this.options.controlPosition,
        isLocked: this.options.isMapLocked,
        onStateChange: function(locked) {
          self.options.isMapLocked = locked;
          self.fitPhotoBounds();
        }
      });
      this.mapLockControl.addTo(this.map);

      this.map.fitWorld();
    };

    PhotoMap.prototype.fitPhotoBounds = function() {
      if (!this.options.isMapLocked) {
        if (this.photos.length) {
          this.map.fitBounds(this.photoLayer.getBounds());
        } else {
          this.map.fitWorld();
        }
      }
    };

    PhotoMap.prototype.renderPhotos = function() {
      this.photoLayer.add(this.photos);
      this.fitPhotoBounds();
    };

    PhotoMap.prototype.lockDateRange = function() {
      this.options.isDateRangeLocked = true;
      if (this.$lockDateRangeButton.find('.fa-unlock-alt').length) {
        this.$lockDateRangeButton.click();
      }
    }

    PhotoMap.prototype.renderDateRangePicker = function() {
      if (this.$dateRangePicker) {
        var dateRangePicker = this.$dateRangePicker.data('daterangepicker');
        dateRangePicker.setStartDate(new Date(this.options.startTime));
        dateRangePicker.setEndDate(new Date(this.options.endTime));
        return;
      }

      var self = this;
      var endOfDayMoment = moment().endOf('day');
      this.$dateRangePicker = $('#dateRangePicker').daterangepicker({
        autoUpdateInput: true,
        startDate: new Date(this.options.startTime),
        endDate: new Date(this.options.endTime),
        autoApply: true,
        opens: 'left',
        ranges: {
           //'Today': [moment().startOf('day'), endOfDayMoment],
           //'Yesterday': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
           'Last 24 hours': [moment().subtract(24, 'hours'), endOfDayMoment],
           'Last 7 days': [moment().subtract(6, 'days'), endOfDayMoment],
           'Last 30 days': [moment().subtract(29, 'days'), endOfDayMoment],
           'This month': [moment().startOf('month'), moment().endOf('month')],
           'Last month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')],
           'This year': [moment().startOf('year'), moment().endOf('year')],
           'All time': [moment(0), endOfDayMoment]
        }
      });

      $('#dateRange .fa-calendar').click(function(e) {
        // TODO(mduan): Handle when dateRangePicker is already showing
        self.$dateRangePicker.focus();
      });

      this.$lockDateRangeButton = $('#lockDateRangeButton');

      var self = this;
      this.$dateRangePicker.on('apply.daterangepicker', function(e, picker) {
        self.options.startTime = picker.startDate.unix() * 1000;
        self.options.endTime = picker.endDate.unix() * 1000;
        // TODO(mduan): Clean this up
        self.lockDateRange();
        self.render();
      });

      var self = this;
      this.$lockDateRangeButton.click(function() {
        var $el = $(this);
        $el.blur();
        if ($el.find('.fa-unlock-alt').length) {
          $el.addClass('btn-primary')
            .removeClass('btn-default')
            .find('.fa-unlock-alt')
              .addClass('fa-lock')
              .removeClass('fa-unlock-alt')
              .addClass('active');
          self.options.isDateRangeLocked = true;
        } else {
          $el.addClass('btn-default')
            .removeClass('btn-primary')
            .find('.fa-lock')
              .addClass('fa-unlock-alt')
              .removeClass('fa-lock')
              .removeClass('active');
          self.options.isDateRangeLocked = false;
          self.render();
        }
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
        label: 'Refetch data',
        icon: 'refresh',
        width: 127,
        height: 40
      });

      var self = this;
      this.$$reloadButton.attachEvent('onItemClick', function() {
        self.photos = [];
        self.resetIdb().then(self.render.bind(self));
      });
    };

    PhotoMap.prototype.renderAlbums = function() {
      if (this.$$albumsList) {
        this.$$albumsList.show();
        return;
      }

      var self = this;
      this.options.idb.albums.query().all().execute()
        .then(function(albums) {
          albums.sort(function(albumA, albumB) {
            var aMinTimestamp = albumA.minTimestamp || 0;
            var aMaxTimestamp = !isNaN(albumA.maxTimestamp) ? albumA.maxTimestamp : Infinity;
            var bMinTimestamp = albumB.minTimestamp || 0;
            var bMaxTimestamp = !isNaN(albumB.maxTimestamp) ? albumB.maxTimestamp : Infinity;
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
            height: 350,
          });

          if (Array.isArray(self.options.albumIds)) {
            // Select the elements before we bind the onSelectChange listener
            self.$$albumsList.select(self.options.albumIds);
          }
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
      this.$$chooseAlbumsButton = webix.ui({
        view: 'toggle',
        container: 'chooseAlbumsButton',
        type: 'iconButton',
        offIcon: 'photo',
        onIcon: 'photo',
        offLabel: 'Choose albums',
        onLabel: 'Hide albums',
        icon: 'photo',
        width: 143,
        height: 40
      });

      var self = this;
      this.$$chooseAlbumsButton.attachEvent('onItemClick', function() {
        if (self.$$chooseAlbumsButton.getValue() === 0) {
          if (self.$$albumsList) {
            self.$$albumsList.hide();
          }
        } else {
          self.renderAlbums();
        }
      });
    };

    PhotoMap.prototype.renderControls = function() {
      this.hasRenderedControls = true;
      this.renderDateRangePicker();
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
        .then(function() {
          if (self.photos.length) {
            if (!self.options.isDateRangeLocked) {
              self.options.startTime = _.min(self.photos, function(photo) { return photo.timestamp }).timestamp;
              self.options.endTime = _.max(self.photos, function(photo) { return photo.timestamp }).timestamp;
            }
            self.renderDateRangePicker();
          }
        })
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
      if (this.$$chooseAlbumsButton) {
        this.$$chooseAlbumsButton.enable();
      }
      // TODO(mduan): Find cleaner way to do this
      $(this.map._container).removeClass('disabled');
      this.options.cssLoader.stopLoading();
    };

    PhotoMap.prototype.fetchAndSavePhotosIfNecessary = function() {
      var self = this;
      return self.options.idb.photos.count().then(function(count) {
        self.beforeLoad();
        if (count) {
          return Promise.resolve();
        } else {
          // TODO(mduan): Move this into its own function
          if (self.$$reloadButton) {
            self.$$reloadButton.blur();
            self.$$reloadButton.disable();
          }
          if (self.$$chooseAlbumsButton) {
            if (self.$$chooseAlbumsButton.getValue() == 1) {
              self.$$chooseAlbumsButton.setValue(0);
              if (self.$$albumsList) {
                self.$$albumsList.destructor();
                self.$$albumsList = null;
              }
            }
            self.$$chooseAlbumsButton.disable();
          }
          return self.options.photosFetcher.fetchAndSave();
        }
      });
    };

    function compileTemplate($template) {
      return _.template($template.html(), { variable: 'data' });
    }

    function PhotoMap(options) {
      required(options.idb);
      required(options.photosFetcher);
      required(options.mapboxAccessToken);
      required(options.cssLoader);

      this.options = $.extend({
        controlPosition: 'topright',
      }, options);

      this.options.startTime = this.options.startTime || 0;
      this.options.endTime = !isNaN(this.options.endTime) ?  this.options.endTime : moment().endOf('day').unix() * 1000;

      this.albumTemplate = compileTemplate($('#albumTemplate'));
      this.photoPopupTemplate = compileTemplate($('#photoPopupTemplate'));
      this.initMap();
      this.render();
    }

    return PhotoMap;
  })();

  // TODO(mduan): Convert to leaflet layer
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

      var $loaderBox = $('<div>').addClass('loaderBox');
      var $loader = $('<div>')
        .addClass(loader.className)
        .addClass('loader')
        .addClass('la-1x');
      for (var i = 0; i < loader.numDivs; ++i) {
        $loader.append($('<div>'));
      }
      this.$message = $('<div>').addClass('message');
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
      albumIds: getParameterByName('albumIds'),
      isMapLocked: !!getParameterByName('isMapLocked'),
      isDateRangeLocked: !!getParameterByName('isDateRangeLocked')
    }));
  });
});
