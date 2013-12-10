$(function() {

$('a').each(function() {
  var $el = $(this);
  if ($el.hasClass('external')) {
    $el.attr('target', '_blank');
    $el.append($('<sup><i class="fa fa-external-link"></i></sup>'));
  }
});

$('.fancybox').fancybox({
  helpers: {
    title : {
      type : 'float'
    }
  },
  beforeShow: function() {
    var alt = this.element.find('.thumbnail').attr('alt');
    this.inner.find('img').attr('alt', alt);
    this.title = alt;
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
      $.each(skills, function(idx, skill) {
        $('.skill.' + skill).addClass('highlight');
      });
    })
    .mouseleave(function() {
      $.each(skills, function(idx, skill) {
        $('.skill.' + skill).removeClass('highlight');
      });
    });
});

$.each(SKILL_TO_EXPERIENCES_MAPPING, function(skill, experiences) {
  $('.skill.' + skill)
    .mouseenter(function() {
      $.each(experiences, function(idx, experience) {
        $('#' + experience).addClass('highlight');
      });
    })
    .mouseleave(function() {
      $.each(experiences, function(idx, experience) {
        $('#' + experience).removeClass('highlight');
      });
    });
});

});
