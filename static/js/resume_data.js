var resumeData = (function() {

  function getSkill(categoryId, skillId, options) {
    // TODO(mduan): Optimize by converting to maps
    var category = _.find(skills, function(category) {
      return category.id === categoryId;
    });
    var skill = _.find(category.items, function(skill) {
      return skill.id === skillId;
    });
    return $.extend({}, skill, options);
  }

  function formatTimeRange(startOptions, endOptions) {
    var formatStr = 'MMM YYYY';
    var startMoment = moment(startOptions);

    if (endOptions) {
      var endMoment = moment(endOptions);
      if (startMoment.isSame(endMoment, 'month')) {
        return startMoment.format(formatStr);
      } else {
        return startMoment.format(formatStr) + ' \u2015 ' + endMoment.format(formatStr);
      }
    } else {
      return startMoment.format(formatStr) + ' \u2015 Present';
    }
  }

  var skills = [{
    id: 'languages',
    name: 'Languages',
    items: [
      { id: 'c', name: 'C', url: 'http://en.wikipedia.org/wiki/C_(programming_language)' },
      { id: 'cpp', name: 'C++', url: 'http://en.wikipedia.org/wiki/C++' },
      { id: 'csharp', name: 'C#', url: 'http://en.wikipedia.org/wiki/C_Sharp_(programming_language)' },
      { id: 'java', name: 'Java', url: 'http://en.wikipedia.org/wiki/Java_(programming_language)' },
      { id: 'php', name: 'PHP', url: 'http://php.net' },
      { id: 'python', name: 'Python', url: 'http://python.org' },
      { id: 'erlang', name: 'Erlang', url: 'http://www.erlang.org' },
      { id: 'rails', name: 'Ruby on Rails', url: 'Ruby on Rails' },
      { id: 'html', name: 'HTML', url: 'http://en.wikipedia.org/wiki/HTML' },
      { id: 'css', name: 'CSS', url: 'http://en.wikipedia.org/wiki/Cascading_Style_Sheets' },
      { id: 'javascript', name: 'JavaScript', url: 'http://en.wikipedia.org/wiki/JavaScript' }
    ]
  }, {
    id: 'frameworks',
    name: 'Frameworks',
    items: [
      { id: 'flask', name: 'Flask', url: 'http://flask.pocoo.org' },
      { id: 'nodejs', name: 'Node.js', url: 'http://nodejs.org' },
      { id: 'sass', name: 'Sass', url: 'http://sass-lang.com' },
      { id: 'bootstrap', name: 'Bootstrap', url: 'http://getbootstrap.com' },
      { id: 'jquery', name: 'jQuery', url: 'http://jquery.com' },
      { id: 'backbone', name: 'Backbone.js', url: 'http://backbonejs.org' },
      { id: 'reactjs', name: 'React.js', url: 'http://facebook.github.io/react' },
      { id: 'requirejs', name: 'Require.js', url: 'http://requirejs.org' },
      { id: 'phantomjs', name: 'PhantomJS', url: 'http://phantomjs.org/download.html' },
      { id: 'mongodb', name: 'MongoDB', url: 'http://mongodb.org' },
      { id: 'mongoengine', name: 'mongoengine', url: 'http://mongoengine.org' },
      { id: 'redis', name: 'Redis', url: 'http://redis.io' },
      { id: 'mysql', name: 'MySQL', url: 'http://mysql.com' },
      { id: 'hive', name: 'Hive', url: 'http://hive.apache.org' },
      { id: 'asp', name: 'ASP.NET', url: 'http://asp.net' }
    ],
  }, {
    id: 'tools',
    name: 'Tools',
    items: [
      { id: 'windows', name: 'Windows', url: 'http://windows.microsoft.com' },
      { id: 'mac', name: 'Mac OS X', url: 'http://apple.com/osx' },
      { id: 'ubuntu', name: 'Ubuntu', url: 'http://ubuntu.com' },
      { id: 'aws', name: 'AWS', url: 'http://aws.amazon.com' },
      { id: 'git', name: 'Git', url: 'http://git-scm.com' },
      { id: 'svn', name: 'SVN', url: 'http://subversion.apache.org' },
      { id: 'vim', name: 'Vim', url: 'http://vim.org' },
      { id: 'visualstudio', name: 'Visual Studio', url: 'http://visualstudio.com' },
      { id: 'eclipse', name: 'Eclipse', url: 'http://eclipse.org' },
      { id: 'zsh', name: 'Zsh', url: 'http://zsh.org' }
    ]
  }];

  return {
    jobs: [{
      orgName: 'Microsoft',
      orgUrl: 'http://www.microsoft.com',
      orgImageUrl: '/static/img/logo_microsoft.png',
      jobTitle: 'Software Engineer Intern &ndash; Windows Performance',
      timeRange: formatTimeRange({ year: 2013, month: 8 }, { year: 2013, month: 11 }),
      descriptions: [
        'Analyzed video memory allocations in Windows to enhance performance',
        'Built new tools to visualize video memory usage from both application/OS-centric perspectives'
      ],
      skills: [
        getSkill('tools', 'windows', { hidden: true }),
        getSkill('tools', 'visualstudio', { hidden: true }),
        getSkill('languages', 'c'),
        getSkill('languages', 'cpp'),
        getSkill('languages', 'csharp')
      ]
    }, {
      orgName: 'Mozilla',
      orgUrl: 'http://www.mozilla.org',
      orgImageUrl: '/static/img/logo_mozilla.png',
      jobTitle: 'Software Engineeer Intern &ndash; Mozilla Labs',
      timeRange: formatTimeRange({ year: 2013, month: 0}, { year: 2013, month: 3 }),
      descriptions: [
        '<a href="https://air.mozilla.org/intern-pdfjs/">Worked in Mozilla Labs team on PDF.js, PDF viewer in Firefox written in JavaScript</a>',
        'Proposed and implemented performance enhancements, improving loading time by an order of magnitude',
        'Added support for PDF annotations'
      ],
      skills: [
        getSkill('tools', 'mac', { hidden: true }),
        getSkill('tools', 'vim', { hidden: true }),
        getSkill('tools', 'zsh', { hidden: true }),
        getSkill('tools', 'git', { hidden: true }),
        getSkill('languages', 'html'),
        getSkill('languages', 'css'),
        getSkill('languages', 'javascript')
      ]
    }, {
      orgName: 'Wish',
      orgUrl: 'https://www.wish.com',
      orgImageUrl: '/static/img/logo_wish.png',
      jobTitle: 'Web Developer Intern',
      timeRange: formatTimeRange({ year: 2012, month: 4 }, { year: 2012, month: 7 }),
      descriptions: [
        'Implemented user-facing features of Wish',
        'Set up and managed build system',
        'Got exposure to and worked on entire web-stack, gaining experience with many technologies used at startups'
      ],
      skills: [
        getSkill('tools', 'ubuntu', { hidden: true }),
        getSkill('tools', 'vim', { hidden: true }),
        getSkill('tools', 'zsh', { hidden: true }),
        getSkill('tools', 'git', { hidden: true }),
        getSkill('languages', 'html', { hidden: true }),
        getSkill('languages', 'css', { hidden: true }),
        getSkill('languages', 'javascript', { hidden: true }),
        getSkill('frameworks', 'sass'),
        getSkill('frameworks', 'requirejs'),
        getSkill('frameworks', 'backbone'),
        getSkill('frameworks', 'jquery'),
        getSkill('languages', 'python'),
        getSkill('frameworks', 'mongodb'),
        getSkill('frameworks', 'mongoengine'),
        getSkill('frameworks', 'redis')
      ]
    }, {
      orgName: 'Facebook',
      orgUrl: 'https://www.facebook.com',
      orgImageUrl: '/static/img/logo_facebook.png',
      jobTitle: 'Software Engineer Intern &ndash; Location Tagging',
      timeRange: formatTimeRange({ year: 2011, month: 8 }, { year: 2011, month: 11 }),
      descriptions: [
        'Proposed and implemented changes to gather location data from photos leading to a 5X increase in location data, and <a href="https://news.ycombinator.com/item?id=3377018">causing controversy on Reddit and Hacker News</a>',
        'Built infrastructure to process and analyze gathered location data',
        'Built features to expose new location data to users'
      ],
      skills: [
        getSkill('tools', 'mac', { hidden: true }),
        getSkill('tools', 'vim', { hidden: true }),
        getSkill('tools', 'zsh', { hidden: true }),
        getSkill('tools', 'git', { hidden: true }),
        getSkill('languages', 'html'),
        getSkill('languages', 'css'),
        getSkill('languages', 'javascript'),
        getSkill('languages', 'php'),
        getSkill('frameworks', 'mysql'),
        getSkill('frameworks', 'hive')
      ]
    }, {
      orgName: 'University of Waterloo',
      orgUrl: 'http://uwaterloo.ca',
      orgImageUrl: '/static/img/logo_uwaterloo.png',
      jobTitle: '<a href="https://uwaterloo.ca/engineering/ura">Research Assistant</a>',
      timeRange: formatTimeRange({ year: 2011, month: 4 }, { year: 2011, month: 7 }),
      descriptions: [
        'Built search engine interface on top of Google and Bing to be used in research experiments'
      ],
      skills: [
        getSkill('tools', 'ubuntu', { hidden: true }),
        getSkill('tools', 'vim', { hidden: true }),
        getSkill('tools', 'zsh', { hidden: true }),
        getSkill('tools', 'git', { hidden: true }),
        getSkill('languages', 'html'),
        getSkill('languages', 'css'),
        getSkill('languages', 'javascript'),
        getSkill('languages', 'python')
      ]
    }, {
      orgName: 'Facebook',
      orgUrl: 'http://facebook.com',
      orgImageUrl: '/static/img/logo_facebook.png',
      jobTitle: 'Software Engineer Intern &ndash; Realtime Infrastructure',
      timeRange: formatTimeRange({ year: 2011, month: 0 }, { year: 2011, month: 3 }),
      descriptions: [
        'Built system to support load balancing on Facebook\'s chat servers, significantly reducing number of needed servers',
        'Ran simulations to stress-test load balancing system',
      ],
      skills: [
        getSkill('tools', 'mac', { hidden: true }),
        getSkill('tools', 'vim', { hidden: true }),
        getSkill('tools', 'svn', { hidden: true }),
        getSkill('languages', 'php'),
        getSkill('languages', 'erlang')
      ]
    }, {
      orgName: 'Xtreme Labs',
      orgUrl: 'http://xtremelabs.com',
      orgImageUrl: '/static/img/logo_xtremelabs.png',
      jobTitle: 'Mobile Developer Intern',
      timeRange: formatTimeRange({ year: 2010, month: 4 }, { year: 2010, month: 7 }),
      descriptions: [
        'Developed and maintained several BlackBerry applications for various clients',
        'Maintained websites for various clients'
      ],
      skills: [
        getSkill('tools', 'windows', { hidden: true }),
        getSkill('tools', 'eclipse', { hidden: true }),
        getSkill('tools', 'svn', { hidden: true }),
        getSkill('languages', 'java'),
        getSkill('languages', 'rails')
      ]
    }],
    projects: [{
      name: 'Github Side-by-Side Diffs',
      url: 'https://chrome.google.com/webstore/detail/github-side-by-side-diffs/ahamcncifjblaomhphpfpopppadboiin',
      timeRange: formatTimeRange({ year: 2013, month: 10 }, { year: 2013, month: 10 }),
      imageUrl: 'static/img/thumbnail_github.jpg',
      descriptions: [
        'Built a Chrome extension that allows improves GitHub\'s diff viewer',
        'Supports viewing diffs side-by-side',
        'Supports showing more context around changes'
      ],
      skills: [
        getSkill('tools', 'mac', { hidden: true }),
        getSkill('tools', 'vim', { hidden: true }),
        getSkill('tools', 'zsh', { hidden: true }),
        getSkill('tools', 'git', { hidden: true }),
        getSkill('languages', 'html'),
        getSkill('languages', 'css'),
        getSkill('languages', 'javascript'),
        getSkill('frameworks', 'reactjs'),
        getSkill('frameworks', 'backbone'),
        getSkill('frameworks', 'jquery')
      ]
    }, {
      name: 'UW Flow',
      url: 'http://uwflow.com/demo',
      timeRange: formatTimeRange({ year: 2012, month: 7 }, { year: 2014, month: 3 }),
      imageUrl: '/static/img/thumbnail_uwflow.jpg',
      descriptions: [
        'Co-founded a website that lets university students review and plan courses',
        'Currently has 9,000 users, 80,000 ratings, and 400,000 course searches'
      ],
      skills: [
        getSkill('tools', 'mac', { hidden: true }),
        getSkill('tools', 'vim', { hidden: true }),
        getSkill('tools', 'zsh', { hidden: true }),
        getSkill('tools', 'git', { hidden: true }),
        getSkill('tools', 'aws', { hidden: true }),
        getSkill('languages', 'html', { hidden: true }),
        getSkill('languages', 'css', { hidden: true }),
        getSkill('languages', 'javascript', { hidden: true }),
        getSkill('frameworks', 'sass'),
        getSkill('frameworks', 'bootstrap'),
        getSkill('frameworks', 'requirejs'),
        getSkill('frameworks', 'backbone'),
        getSkill('frameworks', 'phantomjs'),
        getSkill('frameworks', 'python'),
        getSkill('frameworks', 'flask'),
        getSkill('frameworks', 'mongodb'),
        getSkill('frameworks', 'mongoengine'),
        getSkill('frameworks', 'redis')
      ]
    }, {
      name: 'Numbers API',
      url: 'http://numbersapi.com',
      timeRange: formatTimeRange({ year: 2012, month: 3 }, { year: 2012, month: 3 }),
      imageUrl: '/static/img/thumbnail_numbersapi.jpg',
      descriptions: [
        'Built an API for getting interesting number facts that gets 20,000 requests per day',
        '<a href="https://news.ycombinator.com/item?id=3667469">Made the front page of Hacker News</a>'
      ],
      skills: [
        getSkill('tools', 'ubuntu', { hidden: true }),
        getSkill('tools', 'vim', { hidden: true }),
        getSkill('tools', 'zsh', { hidden: true }),
        getSkill('tools', 'git', { hidden: true }),
        getSkill('tools', 'aws', { hidden: true }),
        getSkill('languages', 'html', { hidden: true }),
        getSkill('languages', 'css', { hidden: true }),
        getSkill('languages', 'javascript', { hidden: true }),
        getSkill('frameworks', 'bootstrap'),
        getSkill('frameworks', 'requirejs'),
        getSkill('frameworks', 'nodejs')
      ]
    }, {
      name: 'JobMine Improved',
      timeRange: formatTimeRange({ year: 2010, month: 6 }, { year: 2010, month: 6 }),
      descriptions: [
        'Built a service to provide a more user-friendly interface of searching for jobs on University of Waterloo\'s job board'
      ],
      skills: [
        getSkill('tools', 'ubuntu', { hidden: true }),
        getSkill('tools', 'zsh', { hidden: true }),
        getSkill('tools', 'git', { hidden: true }),
        getSkill('languages', 'html'),
        getSkill('languages', 'css'),
        getSkill('languages', 'javascript'),
        getSkill('frameworks', 'rails')
      ]
    }, {
      name: 'Discussion Forum',
      timeRange: formatTimeRange({ year: 2009, month: 8 }, { year: 2009, month: 11 }),
      descriptions: [
        'Built discussion forum for University of Waterloo\'s IEEE branch'
      ],
      skills: [
        getSkill('tools', 'windows', { hidden: true }),
        getSkill('tools', 'visualstudio', { hidden: true }),
        getSkill('languages', 'html'),
        getSkill('languages', 'css'),
        getSkill('languages', 'javascript'),
        getSkill('languages', 'csharp'),
        getSkill('frameworks', 'asp')
      ]
    }],
    educations: [{
      name: 'Bachelor of Software Engineering',
      location: 'University of Waterloo',
      timeRange: formatTimeRange({ year: 2009, month: 8 }, { year: 2014, month: 3 }),
      descriptions: [
        'Cumulative average of 92.0%'
      ]
    }],
    awards: [{
      name: 'Dean\'s Honours List',
      location: 'University of Waterloo',
      timeRange: formatTimeRange({ year: 2009, month: 8 }, { year: 2014, month: 3 })
    }, {
      name: 'President\'s Scholarship of Distinction',
      location: 'University of Waterloo',
      timeRange: formatTimeRange({ year: 2009, month: 8 }, { year: 2009, month: 3 })
    }, {
      name: '<a href="http://www.ocdsb.ca/stu/Pages/TopScholar.aspx" target="_blank">Second highest average in school district</a>',
      location: 'Ottawa-Carleton District School Board',
      timeRange: formatTimeRange({ year: 2009, month: 8 }, { year: 2009, month: 6 })
    }],
    skills: skills
  };
})();
