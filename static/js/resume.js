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

$(window).scroll(function() {
  var offset = $('.contact').offset().top + $('.contact').outerHeight(true);
  if (offset - $(this).scrollTop() > 0) {
    $('.hresume > .lhs').css({ position: 'relative' });
  } else {
    $('.hresume > .lhs').css({ position: 'fixed', top: 0 });
  }
});

$('.work, .project')
  .mouseenter(function() {
    var $el = $(this);
    $('.skillsSection').attr('data-hoverId', $el.attr('id'));
  })
  .mouseleave(function() {
    $('.skillsSection').removeAttr('data-hoverId');
  });
});
