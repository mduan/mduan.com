$(function() {
  function getParameterByName(name) {
    name = name.replace(/[\[]/, '\\\[').replace(/[\]]/, '\\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    var results = regex.exec(location.search);
    return results == null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
  }

  var USER_ID = '100039461888031923639';
  var IMAGE_SIZE = 400;

  function requestJsonP(url, data) {
    return $.ajax({
      url: url,
      method: 'GET',
      data: $.extend({
        'alt': 'json-in-script'
      }, data),
      dataType: 'jsonp',
      jsonp: 'callback'
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

  function filterPhotosInTimeRange(photos, startTime, endTime) {
    return photos.filter(function(photo) {
      var timestamp = parseInt(photo.gphoto$timestamp.$t);
      return timestamp >= startTime && timestamp <= endTime;
    });
  }

  function PhotoMap() {

    function getPhotosWithPosition(photos) {
      return photos.filter(function(photo) {
        return !!photo.georss$where;
      }).map(function(photo) {
        var pos = photo.georss$where.gml$Point.gml$pos.$t.split(' ');
        var mediaGroup = photo.media$group;
        var mediaContent = mediaGroup.media$content;
        return {
          lat: pos[0],
          lng: pos[1],
          url: mediaContent[0].url,
          caption: mediaGroup.media$description.$t,
          thumbnail: mediaGroup.media$thumbnail[0].url,
          video: mediaContent[1] ? mediaContent[1].url : null
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

  var startTime = parseInt(getParameterByName('startTime')) || 0;
  var endTime = parseInt(getParameterByName('endTime')) || Number.MAX_VALUE;
  getAlbum(USER_ID).then(function(albums) {
    var filteredPhotosPromises = albums.map(function(album) {
      return getPhotosInAlbum(album, IMAGE_SIZE)
        .then(function(photos) {
          //var currTimestamp = (new Date()).getTime();
          //var weekAgoTimestamp = currTimestamp - 180 * 24 * 60 * 60 * 1000;
          //return filterPhotosInTimeRange(photos, weekAgoTimestamp, currTimestamp);
          return filterPhotosInTimeRange(photos, startTime, endTime);
        })
    });
    $.when.apply($, filteredPhotosPromises).then(function() {
      var photos = Array.prototype.concat.apply([], arguments);
      (new PhotoMap()).addPhotos(photos);
    });
  });
});
