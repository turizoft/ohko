module.exports = (grunt) ->
  sourcefiles = [
    'js/config/helpers.js'
    'js/config/helpers.js'
    'js/config/backbone_overrides.js'
    'js/models/model.js'
    'js/models/collection.js'
    'js/models/pageable_collection.js'
    'js/application/session.js'
    'js/application/application.js'
    'js/application/router.js'
    'js/application/profile.js'
    'js/application/navigation.js'
    'js/view_models/view_model.js'
    'js/view_models/navigation_view_model.js'
    'js/view_models/page_view_model.js'
  ]

  grunt.initConfig
    pkg: grunt.file.readJSON 'package.json'
    clean:
      js: ['js']
    coffee:
      coffee_to_js:
        options:
          bare: true
          sourceMap: false
        expand: true
        flatten: false
        cwd: 'src'
        src: ['**/*.coffee']
        dest: 'js'
        ext: ".js"
    concat:
      dist:
        src: sourcefiles
        dest: 'dist/ohko.js'
    uglify:
      build:
        src: 'dist/ohko.js'
        dest: 'dist/ohko.min.js'



  #Load Tasks
  grunt.loadNpmTasks 'grunt-contrib-clean'
  grunt.loadNpmTasks 'grunt-contrib-coffee'
  grunt.loadNpmTasks 'grunt-contrib-concat'
  grunt.loadNpmTasks 'grunt-contrib-uglify'

  grunt.registerTask 'default', ['clean', 'coffee', 'concat', 'uglify']