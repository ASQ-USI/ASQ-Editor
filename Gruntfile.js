/**
  @fileoverview main Grunt task file
**/
'use strict';

require('dustjs-linkedin')
  .optimizers.format = function(ctx, node) {
  return node;
};

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    //concatenate
    concat: {
      options: {
        // define a string to put between each file in the concatenated output
        separator: ';'
      },
      dist: {
        // the files to concatenate
        src: [
          'js/lib/jquery-2.1.0.js',
          'js/lib/lodash-2.4.1.js',
          'js/lib/jquery-ui-1.10.4.custom.js',
          'js/lib/jquery.multisortable.js',
          'js/lib/FileSaver.min.js',
          'js/lib/mousewheel.js',
          'js/lib/dust-full-1.2.5.js',
          'compiled/*.js',
          'js/layoutManager.js',  
          'js/thumbManager.js',  
          'js/lib/nicEdit.js',
          'js/builder.js',
          ],
        // the location of the resulting JS file
        dest: 'dist/<%= pkg.name.toLowerCase() %>.js'
      }
    },

    //uglify
    uglify: {
      options: {
        // the banner is inserted at the top of the output
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n'
      },
      dist: {
        files: {
          'dist/<%= pkg.name.toLowerCase() %>.min.js': ['<%= concat.dist.dest %>'],
          'dist/bookmarklet.min.js': ['bookmarklet.js']
        }
      }
    },

    //minify css
    cssmin : {
        css:{
          src: 'css/builder.css',
          dest: 'dist/<%= pkg.name.toLowerCase() %>.min.css'
        }
      },

    //dust compilation
    dust: {
      defaults: {
        files: [
          {
            expand: true,
            cwd: "dusts/",
            src: ["**/*.dust"],
            dest: "compiled/",
            ext: ".js"
          }
        ],
        options: {
          wrapper: false,
          relative: true
        }
      },
    },

    //watch
    watch: {
      options: {
        livereload: true
      },
      minimal: {
        files: ['js/*.js','dusts/**/*.dust', 'css/**/*.css'],
        tasks: ['dust', 'concat'],
        options: {
          interrupt: true
        },
      }
    }
  });

  // Default task(s).
  grunt.registerTask('default', ['build']);
  grunt.registerTask('build', ['dust', 'concat', 'uglify', 'cssmin']);
  grunt.registerTask('dev', ['watch']);

  //npm tasks
  
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-dust');
};
