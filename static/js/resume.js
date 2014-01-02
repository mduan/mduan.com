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

var EXPERIENCE_TO_SKILLS_MAPPING = {
  'workMicrosoft': ['windows', 'visualstudio', 'c', 'cpp', 'csharp'],
  'workMozilla': ['mac', 'html', 'css', 'javascript', 'vim', 'zsh', 'git'],
  'workWish': ['ubuntu', 'html', 'css', 'javascript', 'requirejs', 'backbone',
      'jquery', 'mongoengine', 'mongodb', 'sass', 'redis', 'vim', 'zsh', 'git'],
  'workFacebookLocation': ['mac', 'php', 'html', 'css', 'javascript', 'mysql',
      'hadoop', 'svn'],
  'workUwaterloo': ['ubuntu', 'python', 'html', 'css', 'javascript', 'vim',
      'zsh', 'git'],
  'workFacebookRealtime': ['mac', 'php', 'erlang', 'svn'],
  'workXtremeLabs': ['windows', 'java', 'rails', 'eclipse', 'svn'],
  'projectGithub': ['mac', 'html', 'css', 'javascript', 'reactjs', 'backbone',
      'jquery', 'vim', 'zsh', 'git', 'bootstrap'],
  'projectUWFlow': ['mac', 'html', 'css', 'javascript', 'requirejs', 'backbone',
      'python', 'flask', 'redis', 'mongodb', 'mongoengine', 'phantomjs', 'vim',
      'zsh', 'git'],
  'projectNumbersAPI': ['ubuntu', 'html', 'css', 'javascript', 'nodejs',
      'requirejs', 'vim', 'zsh', 'git'],
  'projectJobMine': ['ubuntu', 'html', 'css', 'javascript', 'rails', 'zsh'],
  'projectForum': ['windows', 'visualstudio', 'html', 'css', 'javascript',
      'csharp', 'asp']
};

var SKILL_TO_EXPERIENCES_MAPPING = {};
$.each(EXPERIENCE_TO_SKILLS_MAPPING, function(experience, skills) {
  $.each(skills, function(idx, skill) {
    if (!(skill in SKILL_TO_EXPERIENCES_MAPPING)) {
      SKILL_TO_EXPERIENCES_MAPPING[skill] = [];
    }
    SKILL_TO_EXPERIENCES_MAPPING[skill].push(experience);
  });
});

$.each(EXPERIENCE_TO_SKILLS_MAPPING, function(experience, skills) {
  $('#' + experience)
    .mouseenter(function() {
      var collapse = !!JSON.parse(localStorage.getItem('collapseSidebar'));
      if (collapse) {
        return;
      }
      $.each(skills, function(idx, skill) {
        $('.skill.' + skill).addClass('highlight');
      });
    })
    .mouseleave(function() {
      var collapse = !!JSON.parse(localStorage.getItem('collapseSidebar'));
      if (collapse) {
        return;
      }
      $.each(skills, function(idx, skill) {
        $('.skill.' + skill).removeClass('highlight');
      });
    });
});

$.each(SKILL_TO_EXPERIENCES_MAPPING, function(skill, experiences) {
  $('.skill.' + skill)
    .mouseenter(function() {
      var collapse = !!JSON.parse(localStorage.getItem('collapseSidebar'));
      if (collapse) {
        return;
      }
      $.each(experiences, function(idx, experience) {
        $('#' + experience).addClass('highlight');
      });
    })
    .mouseleave(function() {
      var collapse = !!JSON.parse(localStorage.getItem('collapseSidebar'));
      if (collapse) {
        return;
      }
      $.each(experiences, function(idx, experience) {
        $('#' + experience).removeClass('highlight');
      });
    });
});

(function() {
  // TODO(mack): Fix timezone bug (time from lastModified is UTC time).
  var dateStr = moment(
    document.lastModified, 'MM/DD/YYYY hh:mm:ss').format('MMMM Do, YYYY');
  $('.updatedDate').text(dateStr);
})();

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
