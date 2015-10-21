$(function() {

  var USER_ID = '100039461888031923639';
  var IMAGE_SIZE = 1600;

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
    startTime = startTime || 0;
    endTime = endTime || Math.MAX_VALUE;
    return photos.filter(function(photo) {
      var timestamp = parseInt(photo.gphoto$timestamp.$t);
      return timestamp >= startTime && timestamp <= endTime;
    });
  }

  function addPhotos(photos) {
    photos.forEach(function(photo) {
      //console.log(photo.title.$t, photo.content.src);
    });
  }

  var startTime = (new Date()).getTime();
  getAlbum(USER_ID).then(function(albums) {
    albums.map(function(album) {
      getPhotosInAlbum(album, IMAGE_SIZE)
        .then(function(photos) {
          var currTimestamp = (new Date()).getTime();
          var weekAgoTimestamp = currTimestamp - 7 * 24 * 60 * 60 * 1000;
          return filterPhotosInTimeRange(photos, weekAgoTimestamp, currTimestamp);
        })
        .then(addPhotos);
    });
  });
});
