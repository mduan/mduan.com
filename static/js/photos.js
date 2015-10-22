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
    var startTime = parseInt(getParameterByName('startTime')) || 0;
    var endTime = parseInt(getParameterByName('endTime')) || Number.MAX_VALUE;
    return getAlbum(USER_ID).then(function(albums) {
      addAlbumsToIdb(idb, albums);
      return Promise.all(albums.map(function(album) {
        return getPhotosInAlbum(album, IMAGE_SIZE)
          .then(addPhotosToIdb.bind(null, idb));
      }));
    });
  }

  function PhotoMap() {
    function getPhotosWithPosition(photos) {
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
    }

    this.addPhotos = function(photos) {
      var photosWithPosition = getPhotosWithPosition(photos);
      if (!photosWithPosition.length) {
        return;
      }

      L.mapbox.accessToken = 'pk.eyJ1IjoibWR1YW4iLCJhIjoiY2lnMTdhaTl6MG9rN3VybTNzZjFwYTM3OCJ9._GTMIAxNtoh5p63xBiPykQ';
      var photoMap = L.mapbox.map('photo-map', 'mapbox.streets', {
        maxZoom: 18
      });

      var photoLayer = L.photo.cluster().on('click', function (evt) {
        var photo = evt.layer.photo,
          template = '<img src="{url}"/></a><p>{caption}</p>';
        if (photo.video && ($('video').canPlayType('video/mp4; codecs=avc1.42E01E,mp4a.40.2'))) {
          template = '<video autoplay controls poster="{url}"><source src="{video}" type="video/mp4"/></video>';
        };
        evt.layer.bindPopup(L.Util.template(template, photo), {
          className: 'leaflet-popup-photo',
          minWidth: 400
        }).openPopup();
      });

      photoLayer.add(photosWithPosition).addTo(photoMap);
      photoMap.fitBounds(photoLayer.getBounds());
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
      var startTime = parseInt(getParameterByName('startTime')) || 0;
      var endTime = parseInt(getParameterByName('endTime')) || Number.MAX_SAFE_INTEGER;
      return idb.photos
        .query('timestamp')
        .bound(startTime, endTime)
        .execute();
    }).then(function(photos) {
      (new PhotoMap()).addPhotos(photos);
    });
  });
});
