$(function() {

/**
 * Helper functions
 *
 * TODO(mack): Consider moving them into separate file.
 */

function getParameterByName(name) {
  name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
  var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
      results = regex.exec(location.search);
  return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

(function() {
  // Set up interface for localStorage if it does not exist.
  var localStorage = window.localStorage = window.localStorage || {};
  var funcNames = ['getItem', 'setItem', 'removeItem'];
  for (var i = 0; i < funcNames.length; ++i) {
    localStorage[funcNames[i]] = localStorage[funcNames[i]] || function() {};
  }
})();

/**
 * Main logic
 */

if (getParameterByName('resolve_url')) {
  var SERVER_ROOT = 'http://mduan.com';
  $('a').each(function() {
    var $el = $(this);
    var href = $el.attr('href');
    if (href && href[0] === '/') {
      $el.attr('href', SERVER_ROOT + href);
    }
  });
}

$('a').each(function() {
  var $el = $(this);
  if ($el.hasClass('icon')) {
    $el.append($('<sup><i class="fa fa-external-link"></i></sup>'));
  }
  if (!$el.hasClass('internal')) {
    $el.attr('target', '_blank');
  }
});

//$(window).scroll(function() {
//  var offset = $('.contact').offset().top + $('.contact').outerHeight(true);
//  if (offset - $(this).scrollTop() > 0) {
//    $('.hresume > .lhs').css({ position: 'relative' });
//  } else {
//    $('.hresume > .lhs').css({ position: 'fixed', top: 0 });
//  }
//});

$('.experience')
  .mouseenter(function() {
    var collapse = !!JSON.parse(localStorage.getItem('collapseSidebar'));
    if (collapse) {
      return;
    }
    $(this).find('.skills .skill').each(function() {
      var skill = $(this).attr('data-skill');
      $('.skillsSection .skill[data-skill="' + skill + '"]').addClass('highlight');
    });
  })
  .mouseleave(function() {
    $(this).find('.skills .skill').each(function() {
      var skill = $(this).attr('data-skill');
      $('.skillsSection .skill[data-skill="' + skill + '"]').removeClass('highlight');
    });
  });

$('.skillsSection .skill')
  .mouseenter(function() {
    var collapse = !!JSON.parse(localStorage.getItem('collapseSidebar'));
    if (collapse) {
      return;
    }
    var skill = $(this).attr('data-skill');
    $('.experience').each(function() {
      var $el = $(this);
      if ($el.find('[data-skill="' + skill + '"]').length) {
        $el.addClass('highlight');
      }
    });
  })
  .mouseleave(function() {
    var skill = $(this).attr('data-skill');
    $('.experience').each(function() {
      var $el = $(this);
      if ($el.find('[data-skill="' + skill + '"]').length) {
        $el.removeClass('highlight');
      }
    });
  });

//(function() {
//  // TODO(mack): Fix timezone bug (time from lastModified is UTC time).
//  var dateStr = moment(
//    document.lastModified, 'MM/DD/YYYY hh:mm:ss').format('MMMM Do, YYYY');
//  $('.updatedDate').text(dateStr);
//})();

function updateSidebar() {
  var collapse = !!JSON.parse(localStorage.getItem('collapseSidebar'));
  if (collapse) {
    $('.hresume').addClass('collapsed');
  } else {
    $('.hresume').removeClass('collapsed');
  }
}

updateSidebar();

$('.hresume > .lhs .toggle').click(function() {
  var collapse = !JSON.parse(localStorage.getItem('collapseSidebar'));
  localStorage.setItem('collapseSidebar', collapse);
  updateSidebar();
});

});
