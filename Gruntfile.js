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
          'js/lib/jquery-ui-1.10.3.custom.js',
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
        dest: 'dist/<%= pkg.name %>.js'
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
          'dist/<%= pkg.name %>.min.js': ['<%= concat.dist.dest %>']
        }
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
        files: ['js/*.js','dusts/**/*.dust'],
        tasks: ['dust'],
        options: {
          interrupt: true
        },
      }
    }
  });

  // Default task(s).
  grunt.registerTask('default', ['watch']);
  grunt.registerTask('build', ['dust', 'concat', 'uglify']);

  //npm tasks
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-dust');
};
