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
        src: ['js/lib/*.js','compiled/*.js','js/*.js'],
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
