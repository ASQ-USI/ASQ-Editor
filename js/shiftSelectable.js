// attach 'shiftSelectable' to jquery
(function($, _) {
  var augmentedSelectedCallback, methods;
  augmentedSelectedCallback = function(selected, $element, event, ui) {
    if ($element.length) {
      $element.addClass('ui-selected');
      // honor original "ui.selectable" callback with new selected element passed
      ui = _.extend({}, ui, {selected: $element.get(0)});
      _.isFunction(selected) && selected(event, ui);
    }
  };
  methods = {
    init: function(options) {
      var settings = _.extend({}, options),
          selected = settings.selected,
          unselected = settings.unselected,
          $lastSelected;
      settings.selected = function(event, ui) {
        var $selected = $(ui.selected),
            isShiftSelect = false;
        // enable shift+click if the user has clicked on something already 
        // OR has not deselected the last item clicked.
        if (event.shiftKey && $lastSelected) {
          // currently only supports elements that are siblings of each 
          // other, so lists made of tables are out right now.
          $selected.siblings('.ui-selectee').andSelf().each(function(){
            var $element = $(this);
            // To support click, then shift+click both up a list and down a list; turn
            // selection on when encountering either actions and off on the other one.
            if ($element.is($selected) || $element.is($lastSelected)) {
              isShiftSelect = !isShiftSelect;
              augmentedSelectedCallback(selected, $element, event, ui);
            } else if (isShiftSelect) {
              augmentedSelectedCallback(selected, $element, event, ui);
            }
          });
        // otherwise just treat click like a normal click, which can include 
        // shift+click with no previous click.
        } else {
          $lastSelected = $selected;
          // honor original "ui.selectable" callback
          _.isFunction(selected) && selected(event, ui);
        }        
      };
      settings.unselected = function(event, ui) {
        // if you are unselecting the last item selected, then disable 
        // shift+click selection
        if (!event.shiftKey && $(ui.unselected).is($lastSelected)) {
          $lastSelected = undefined;
        }
        // honor original "ui.selectable" callback
        _.isFunction(unselected) && unselected(event, ui);
      };
      return this.selectable(settings);
    }
  };
  $.fn.shiftSelectable = function(options) {
    var opts = options || {};
    // wrapped selectable methods passed on, like 'destroy'!
    if (_.isString(opts)) {
      return this.selectable.apply(this, arguments);
    } else if (_.isObject(opts)) {
      return methods.init.apply(this, arguments);
    // unlikely end if called with a number != 0 or regex...
    } else {
      $.error('The passed value [' + opts + '] is not supported by jQuery.shiftSelectable');
    }
  };
})(jQuery, _);