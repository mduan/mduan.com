$(function() {
  // http://stackoverflow.com/a/901144
  function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
  }

  window.onerror = function() {
    // This error message will only show for errors that occur before and during template
    // rendering since after the resume is rendered the #errorMessage element will have
    // been replaced by the rendered resume.
    console.log($('#errorMessage'));
    $('#errorMessage').html(
      '<span>Error rendering resume. Please try changing browsers or view a PDF version at ' +
      '<a href="http://mduan.com/static/files/resume.pdf">http://mduan.com/static/files/resume.pdf</a></span>'
    );
  };

  /**
   * Template rendering
   */
  var templateMethods = {
    experienceDescriptionTemplate: compileTemplate($('#experienceDescriptionTemplate')),
    skillsTemplate: compileTemplate($('#skillsTemplate')),
    jobsTemplate: compileTemplate($('#jobsTemplate')),
    projectsTemplate: compileTemplate($('#projectsTemplate')),
    educationsTemplate: compileTemplate($('#educationsTemplate')),
    awardsTemplate: compileTemplate($('#awardsTemplate'))
  };

  function compileTemplate($template) {
    var compiled = _.template($template.html(), { variable: 'data' });
    return function(data) {
      // TODO(mduan): Should I be copying the data first?
      return compiled(_.extend(data, templateMethods));
    };
  }

  var resumeTemplate = compileTemplate($('#resumeTemplate'));
  $('#resume').html(resumeTemplate({
    resumeData: resumeData
  }));

  /**
   * Create styling for links
   */
  $('a').each(function() {
    var $el = $(this);
    if ($el.hasClass('iconLink')) {
      $el.append($('<sup><i class="fa fa-external-link"></i></sup>'));
    }
    if (!$el.hasClass('internalLink')) {
      $el.attr('target', '_blank');
    }
    if ($el.hasClass('printableLink')) {
      var href = $el.attr('href');
      if (href.indexOf('http://') !== 0 && href.indexOf('https://') !== 0) {
        href = window.location.origin + href;
      }
      var $linkUrl = $('<span>').addClass('linkUrl')
        .text(' (' + href + ')')
        .hide();
      $el.append($linkUrl);
    }
  });

  (function() {
    var $el = $('#showFullResumeCheckbox');

    /**
    * Set up checkbox to show full resume
    */
    $el.click(function() {
      var $el = $(this);
      if ($el.prop('checked')) {
        $('.subsection.hidden, #skills.section .skill.hidden')
          .removeClass('hidden')
          .addClass('unhidden');
      } else {
        $('.subsection.unhidden, #skills.section .skill.unhidden')
          .removeClass('unhidden')
          .addClass('hidden');
      }
    });


    if (getParameterByName('full')) {
      if (!$el.prop('checked')) {
        $el.click();
      }
    }
  })();

  /**
   * Highlighting of skills
   */
  (function() {
    var $affixSkillsCheckbox = $('#affixSkillsCheckbox');
    var $experiences = $('#jobs.section .job, #projects.section .project');
    var $skills = $('#skills.section .skill');
    $experiences.mouseenter(function() {
      if (!$affixSkillsCheckbox.prop('checked')) { return }
      $(this).find('#skills .skill').each(function() {
        var skill = $(this).attr('data-skill');
        $skills.filter('[data-skill="' + skill + '"]').addClass('highlight');
      });
    }).mouseleave(function() {
      $(this).find('#skills .skill').each(function() {
        var skill = $(this).attr('data-skill');
        $skills.filter('[data-skill="' + skill + '"]').removeClass('highlight');
      });
    });

    $skills.mouseenter(function() {
      if (!$affixSkillsCheckbox.prop('checked')) { return }
      var skill = $(this).attr('data-skill');
      $experiences.each(function() {
        var $el = $(this);
        if ($el.find('[data-skill="' + skill + '"]').length) {
          $el.addClass('highlight');
        }
      });
    }).mouseleave(function() {
      var skill = $(this).attr('data-skill');
      $experiences.each(function() {
        var $el = $(this);
        if ($el.find('[data-skill="' + skill + '"]').length) {
          $el.removeClass('highlight');
        }
      });
    });
  })();

  /**
   * Affix for the skills section
   */
  // TODO(mduan): For some reason, this offset is incorrect on page ready,
  // hence why it's done in a setTimeout.
  setTimeout(function() {
    var $content = $('.content');
    var $skillsSection = $('#skills.section');
    var $nextSection = $skillsSection.next();
    var $placeholder = $('<div class="skillsPlaceholder">').insertAfter($skillsSection);
    var skillsSectionoffset = $skillsSection.offset().top;
    var $affixSkillsCheckbox = $('#affixSkillsCheckbox');
    var $window = $(window);

    // Padding needed from left/right side of element to left/right side of screen respectively
    var paddingLeft = parseInt($skillsSection.css('padding-left'));
    var paddingRight = parseInt($skillsSection.css('padding-right'));

    function onViewportChange() {
      // TODO(mduan): Would be more efficient to unbind the scroll listener when
      // checkbox is unchecked.
      if ($window.scrollTop() > skillsSectionoffset && $affixSkillsCheckbox.prop('checked')) {
        $placeholder.css('height', $skillsSection.outerHeight(true));
        $skillsSection.css({
          position: 'fixed',
          top: 0,
          width: $nextSection.width(),
          left: 0,
          right: 0,
          paddingLeft: paddingLeft + parseInt($content.css('margin-left')),
          paddingRight: paddingRight + parseInt($content.css('margin-right'))
        }).addClass('affixed');
      } else {
        $skillsSection.css({
          position: '',
          top: '',
          width: '',
          left: '',
          right: '',
          paddingLeft: '',
          paddingRight: ''
        }).removeClass('affixed');
        $placeholder.css('height', '');
      }
    }
    onViewportChange();

    var $hashEl = $(window.location.hash);
    if ($hashEl.length && $skillsSection.hasClass('affixed')) {
      var offsetTop = $hashEl.offset().top - $skillsSection.outerHeight();
      // TODO(mduan): Have to do in a timeout for this to work. Figure out why.
      setTimeout(function() {
        $window.scrollTop(offsetTop);
      }, 100);
    }

    $window.on('scroll resize', onViewportChange);

    $affixSkillsCheckbox.click(function() {
      if ($affixSkillsCheckbox.prop('checked')) {
        $('.content').removeClass('unhighlightable');
        $window.on('scroll resize', onViewportChange);
        onViewportChange();
      } else {
        $('.content').addClass('unhighlightable');
        $window.off('scroll resize');
        var scrollTop = $window.scrollTop();
        onViewportChange();
        // TODO(mduan): Have to do in a timeout for this to work. Figure out why.
        setTimeout(function() {
          $window.scrollTop(scrollTop);
        });
      }
    });
  }, 100);


  /**
   * Last updated time on the footer
   */
  (function() {
    // TODO(mack): Fix timezone bug (time from lastModified is UTC time).
    var dateStr = moment(document.lastModified, 'MM/DD/YYYY hh:mm:ss').format('MMMM Do, YYYY');
    $('.updatedDate').text(dateStr);
  })();
});
