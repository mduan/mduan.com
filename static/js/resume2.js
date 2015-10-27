$(function() {

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
});
