
//preserve whitespace (when exporting the source)
dust.optimizers.format = function(ctx, node) { return node };
var baseUrl = "http://asq.inf.usi.ch/editor/";
var myNicEditor = new nicEditor({iconsPath : baseUrl + 'js/lib/nicEditorIcons.gif'});

// makes the element with the given id editable
function makeEditable(id){ 
  myNicEditor.addInstance(id);
}


function save(){

  //clean up impress styles
  var $clone = $('#impress').clone();
  $clone
    .removeAttr('style')
    .find('.step')
      .unwrap()
      .removeClass('past present future active')
      .removeAttr('contenteditable')
      .removeAttr('style');

  var content = $clone.eq(0).html();

  //get source html from iframe
  var $saved = $('#asq-edit-original-source').contents().find('html').clone();
  $saved.wrap('<html />')
  $saved = $saved.parents('html')
  $saved.find('#impress').html(content);
  console.log($saved.html()); 
  // reenable scripts
  var activeHtml =  $saved.html().replace(/<script type=\"text\/xml\" /g, '<script ');
  var blob = new Blob([activeHtml], {type: "text/html;charset=utf-8"});


  $('<div><textarea id="_source" style="width:100%;height:100%">'+activeHtml+'</textarea></div>').dialog({ 
    closeOnEscape: false,
    width: 600,
    height: 400,
    modal: true,
    title: "Presentation source:",
    buttons: [{
      text: "Save",
      click: function () {
          saveAs(blob, "presentation.html");
        }
      }
    ],
    open: function(  ) {
      $("#_source").select();
    } });

  //if (window.prompt ("Copy presentation source: Ctrl+C, Enter - Click on Cancel to Save", activeHtml) == null) {
  //BUG: this will cut off the source text!!
  //};

}

var builder = (function () {

  'use strict';

  var state = {
    editing: false,
    $node: false,
    data: {
      x: 0,
      y: 0,
      z: 0, 
      rotate: 0,
      rotateX: 0, 
      rotateY: 0, 
      scale: 0
    }
  },
    selection = [],
    config = {
      rotation: 0,
      rotateStep: 1,
      scaleStep: 0.02,
      visualScaling: 10,
      redrawFunction: false,
      setTransformationCallback: false
    },
    defaults = {
      x: 0,
      y: 0,
      z: 0, 
      rotate: 0,
      rotateX: 0, 
      rotateY: 0, 
      scale: 1
    },
    mouse = {
      prevX: false,
      prevY: false,
      activeFunction: false
    },
    handlers = {},
    redrawTimeout,
    //nodes
    $menu, $controls, $overview, $sliders
    , layoutManager, thumbManager;

  selection.hasstate = function (s) {
   // console.log('Checking ' + s.$node.attr('id'));
    for (var i = 0; i < this.length; i++) {
      //console.log(this[i].$node.attr('id'))
      if (this[i].$node.attr('id') === s.$node.attr('id'))
        return true;
    }
    return false;
  };
  selection.pushstate = function (s) {
    //make a deep enough copy
    this.push({
      $node: s.$node,
      data: {
        x: s.data.x,
        y: s.data.y,
        z: s.data.z,
        rotate: s.data.rotate,
        rotateX: s.data.rotateX,
        rotateY: s.data.rotateY,
        scale: s.data.scale
      }
    });
    s.$node[0].classList.add('selected');
  };
  selection.move = function (x, y) {
    for (var i = 0; i < this.length; i++) {
      this[i].data.x = (this[i].data.x) ? (this[i].data.x) + x : x;
      this[i].data.y = (this[i].data.y) ? (this[i].data.y) + y : y;
    }
  };
  selection.scale = function (x) {
    for (var i = 0; i < this.length; i++) {
      this[i].data.scale -= -x * config.scaleStep * config.visualScaling / 10;
    }
  };
  selection.setScale = function (s) {
    for (var i = 0; i < this.length; i++) {
      this[i].data.scale = s;
    }
  };
  selection.rotate = function (x) {
    for (var i = 0; i < this.length; i++) {
      this[i].data.rotate -= -x * config.rotateStep % 360;
    }
  };
  selection.setRotate = function (r) {
    for (var i = 0; i < this.length; i++) {
      this[i].data.rotate = r;
    }
  };
  selection.setX = function (x) {
    for (var i = 0; i < this.length; i++) {
      this[i].data.x = x;
    }
  };
  selection.setY = function (y) {
    for (var i = 0; i < this.length; i++) {
      this[i].data.y = y;
    }
  };
  selection.setZ = function (z) {
    for (var i = 0; i < this.length; i++) {
      this[i].data.z = z;
    }
  };
  selection.rotate3D = function (x, y) {
    for (var i = 0; i < this.length; i++) {
      this[i].data.rotateX = (this[i].data.rotateX) ? (this[i].data.rotateX) + (-y * config.rotateStep % 360) : (-y * config.rotateStep % 360);
      this[i].data.rotateY = (this[i].data.rotateY) ? (this[i].data.rotateY) + (x * config.rotateStep % 360) : (x * config.rotateStep % 360);
    }
  };
  selection.clear = function () {
    for (var i = 0; i < this.length; i++) {
      this[i].$node[0].classList.remove('selected');
    }
    this.length = 0;
  };

  handlers.move = function (x, y) {
    var v = fixVector(x, y);
    if (selection.length > 1) {
      selection.move(v.x, v.y);
    }
    state.data.x = (state.data.x) ? (state.data.x) + v.x : v.x;
    state.data.y = (state.data.y) ? (state.data.y) + v.y : v.y;
  };
  handlers.scale = function (x) {
    if (selection.length > 1) {
      selection.scale(x);
    }
    state.data.scale -= -x * config.scaleStep * config.visualScaling / 10;
  };
  handlers.rotate = function (x) {
    if (selection.length > 1) {
      selection.rotate(x);
    }
    state.data.rotate -= -x * config.rotateStep % 360;
  };
  
  handlers.rotate3D = function (x, y) {
    var v = fixVector(x, y);
    if (selection.length > 1) {
      selection.rotate3D(v.x, v.y);
    }
    state.data.rotateX = (state.data.rotateX) ? (state.data.rotateX) + (-v.y * config.rotateStep % 360) : (-v.y * config.rotateStep % 360);
    state.data.rotateY = (state.data.rotateY) ? (state.data.rotateY) + (v.x * config.rotateStep % 360) : (v.x * config.rotateStep % 360);
  };

  var ArrayMove = function (arr, old_index, new_index) {
    if (new_index >= arr.length) {
        var k = new_index - arr.length;
        while ((k--) + 1) {
            arr.push(undefined);
        }
    }
    arr.splice(new_index, 0, arr.splice(old_index, 1)[0]);
    return arr; // for testing purposes
  };

  var layoutRendered = function(err,out){
    $('body').append(out);

    layoutManager = new LayoutManager(
    { 
      selection : selection,
      redrawFunction : config.redrawFunction
    }, jQuery);

    thumbManager = new ThumbManager(
    { 
      sels : {
        thumbsBarId: "#thumbs-bar",
        thumbsHolderId    : "#thumb-holder",
        thumbContainerClass  : "thumb",
        slideThumbClass : "thumb-step",
        dragBarId: "#thumbs-bar #dragbar",
      }
    }, jQuery);
  }

  //bootstrap builder with impress functions
  function bootstrap(){
    if('undefined' == typeof window.impress) return;

    var iAPI = window.impress();
    builder.init({
      "goto": iAPI['goto'], //it makes me feel better this way
      creationFunction: iAPI.newStep, //future API method that adds a new step
      redrawFunction: iAPI.initStep, //future API method that (re)draws the step
      deleteStep: iAPI.deleteStep,
      showMenu: iAPI.showMenu,
      setTransformationCallback: iAPI.setTransformationCallback, //future API method that lets me know when transformations change
      makeEditable: makeEditable
    });
  }

  function init(conf) {

    config = $.extend(config, conf);

    //setup niceditor. We add the current steps
    //for new slides we call the makeEditable function
    bkLib.onDomLoaded(function() {
      myNicEditor.setPanel('myNicPanel');

      //make each step editable
      $('.step:not(#overview)').each(function(){
        myNicEditor.addInstance(this.id);
      });
    });


    //save original document
    $.ajax(document.URL).done(function(data){
      //prevent scripts from executing when injected into dom
      data = data.replace(/<script(?=(\s|>))/ig, '<script type="text/xml" ');

      //create iframe to hold the oringal html
      $('body').append( '<iframe style="height:0;width:0;" id="asq-edit-original-source"></iframe>');
      
      $('body').append( '<div id="dialog-save" title="Save" style="display: none;"></div>');
      

      var $sourceIFrame =  $('#asq-edit-original-source')
      , iframeDoc = $sourceIFrame[0].contentDocument || $sourceIFrame[0].contentWindow.document;

      iframeDoc.write(data);
    })

    if (config.setTransformationCallback) {
      config.setTransformationCallback(function (x) {
        // guess what, it indicates slide change too :)
        $controls.hide();

        //setting pu movement scale
        config.visualScaling = x.scale;
        //console.log(x.scale);
        //TODO: implement rotation handling for move
        config.rotation = ~~ (x.rotate.z);
        //console.log('rotate',x.rotate.z);
        //I don't see why I should need translation right now, but who knows...
      })
    }

    var $body = $('body');
    $body.addClass('edit');
    $overview = $('#overview');

    $controls = $('<div class="builder-controls"></div>').hide();

    //FIXME: deleteContents is duplicated code with the handler form the thumbManager
    //$('<div class="bt-delete"></div>').attr('title', 'Delete').click(deleteContents).appendTo($controls);
    $('<div class="bt-move border"></div>').attr('title', 'Move').data('func', 'move').appendTo($controls);
    $('<div class="bt-rotate border"></div>').attr('title', 'Rotate').data('func', 'rotate').appendTo($controls);
    $('<div class="bt-scale border"></div>').attr('title', 'Scale').data('func', 'scale').appendTo($controls);
    $('<div class="bt-rotateX"></div>').attr('title', 'RotateX').data('func', 'rotate3D').appendTo($controls);

    //render the layout HTML
    // when rendered the thumb and layout managers are instantiated
    dust.render('layout', {}, layoutRendered);

    $(document).on("blur focus focusout", '.step', function(event){
      thumbManager.updateThumb($(this).attr('id'))
    })

    $(document).on('thumbmanager:thumb-clicked', function(event){
      var slideRefId = event.originalEvent.detail.slideRefId

      //goto and make editable the current slide
      config['goto'](slideRefId);

      //select thumb
      thumbManager.selectThumb(slideRefId);
    });

    $(document).on('thumbmanager:thumb-selection', function(event){
      var slideRefIds = event.originalEvent.detail.slideRefIds
      selection.clear();
      _.each(slideRefIds, function(el, index){
        state.$node = $("#"+el);
        selection.pushstate(state)
      })

      //goto and make editable the current slide
     // config['goto'](slideRefIds[]);

      //select thumb
     // thumbManager.selectThumb(slideRefId);
    });

    $(document).on('thumbmanager:thumb-sorted', function(event){

      var detail    = event.originalEvent.detail
      , thumbId     = detail.thumbId
      , slideRefId  = detail.slideRefId
      , newIndex    = detail.newIndex;


      var oldIndex = $("#"+slideRefId).index();

      //ignore overview slide
      if(newIndex>0){
        $("#"+slideRefId).insertAfter($(".step").eq(newIndex-1))
      }else{
        $("#"+slideRefId).insertBefore($(".step").eq(0))
      }

      //CAUTION: this changes the internal steps of impress.js
      //we do this so that the users can view the correct order of steps
      ArrayMove(impress().steps(), oldIndex, newIndex)
    });

    $(document).on('thumbmanager:thumb-edit-id', function(event){
      var detail    = event.originalEvent.detail
      , slideRefId  = detail.slideRefId
      , newId = detail.newId;

      if (newId == slideRefId) return; 

      //check if new id is a valid id
      if(! newId.match(/^[a-zA-Z][\w:.-]*$/)){
        alert('Invalid id characters. \n D and NAME tokens must begin with a letter ([A-Za-z]) and may be followed by any number of letters, digits ([0-9]), hyphens ("-"), underscores ("_"), colons (":"), and periods (".").');
        thumbManager.setThumbTitle(slideRefId, slideRefId);
        return;
      }

      //check if id already exists
      if($('#'+newId).length > 0){
          alert('Id exists. Please choose another one');
          thumbManager.setThumbTitle(slideRefId, slideRefId);
        return;
      }

      //delete step from impress
      config.deleteStep(slideRefId);

      //update slide id
      var $step = $('#' + slideRefId).attr('id', newId);

      //add to impress with new id
      config.creationFunction($step[0]);

      //move to correct position in impress
      //CAUTION: this changes the internal steps of impress.js
      //we do this so that the users can view the correct order of steps
      ArrayMove(impress().steps(), impress().steps().length -1 , $step.index())

      //update thumbnail id
      thumbManager.setThumbId(slideRefId, newId);
    });

    $(document).on('thumbmanager:thumb-delete', function(event){

      var detail    = event.originalEvent.detail
      , thumbId     = detail.thumbId
      , slideRefId  = detail.slideRefId

      //var r = confirm("Are you sure you want to delete this slide?");
      var r = true;

      if (r == true) {      
        config.deleteStep(slideRefId);
        $('#' + slideRefId).remove();
        config['goto']("overview");

        //delete thumbnail
        thumbManager.deleteThumb(slideRefId);
      }

    });

    $('.button.save').on('click', function () { save(); });
    $('.button.overview').on('click', function (e) { 
      /*
      if (e.altKey) {
        var transform = getTrans3D();
        console.log(transform);
        $("#overview").data.x = transform.translate3d[0];
        $("#overview").data.y = transform.translate3d[1];
        $("#overview").data.z = transform.translate3d[2];
      } */
      config['goto']('overview'); 
    }); 
    $('.button.add').on('click', function() {
      var x = addSlide();
      thumbManager.insertThumb(x.attr('id'));
    });


    // $("#my").attr("value",$(".active").attr("data-y") || 0);
    // $("#mz").attr("value",$(".active").attr("data-z") || 0);

    var showTimer;

    $controls.appendTo('body').on('mousedown', 'div', function (e) {
      e.preventDefault();
      mouse.activeFunction = handlers[$(this).data('func')];
      loadData();
      mouse.prevX = e.pageX;
      mouse.prevY = e.pageY;
      $(document).on('mousemove.handler1', handleMouseMove);
      return false;
    }).on('mouseenter', function () {
      clearTimeout(showTimer);
    });
    $(document).on('mouseup', function () {
      mouse.activeFunction = false;
      $(document).off('mousemove.handler1');
    });


    $body.on('mouseenter', '.step:not(#overview)', function (e) {
      var shift = (e.shiftKey == 1);
     // if ($(this).attr('id') !== 'overview') 
      var $t = $(this);
     // console.log($t.attr('id'))
      showTimer = setTimeout(function () {
        if (!mouse.activeFunction) {
          //show controls
          state.$node = $t;
          loadData();
          showControls(state.$node);
          // MULTIPLE SELECTION OF STEPS
          if (shift) {
            if (!selection.hasstate(state)) {
              selection.pushstate(state);
            }
          } else {
            selection.clear();
          }
        }
      }, 100);
      $t.data('showTimer', showTimer);
    }).on('mouseleave', '.step:not(#overview)', function () {
      //not showing when not staying
      clearTimeout($(this).data('showTimer'));
    });


    // keep hover effect when leaving from a step
    // the user can see which element is selected
    $body.on('mouseenter', '.step:not(#overview)', function(e) {
      $('#impress').find('.hover').removeClass('hover');
      $(this).addClass('hover')
    }).on('mouseleave', '.step:not(#overview)', function(){
      $(this).addClass('hover')
    });

    // fixed the style of thumb and remove the style of step when pressing on body
    $body.on('mousedown', '#impress div.step', function(event) {
      event.stopPropagation();

      var styles = {
        "-webkit-touch-callout" : "",
        "-webkit-user-select" : "",
        "-khtml-user-select" : "",
        "-moz-user-select" : "",
        "-ms-user-select" : "",
        "user-select" : ""
      };

      $body.css(styles);
    });
    $body.on('mousedown', function(e) {
      // remove hover from steps and thumbs
      $('#impress > div').find('.hover').each(function(){
        $(this).removeClass('hover');
        thumbManager.updateThumb($(this).attr('id'));
      });
      $('.builder-controls').removeAttr('style');  
    });


    $(window).on('beforeunload', function () {
      return 'All changes will be lost';
    });

    config['goto']('start');

  }

  // PLUGIN
  jQuery.fn.slidingInput = function (opts) {

      var defaults = {
          step: 1, // Increment value
          min: 0, // Minimum value
          max: 100, // Maximum value
          tolerance: 2 // Mouse movement allowed within a simple click
      };

      return this.each(function () {
          var $el = $(this),
              options = $.extend({}, defaults, opts, this),
              distance = 0,
              initialValue = 0;

          function mouseDown() {
              if(!state.$node && selection.length<1){
                return;
              }
              distance = 0;

              // check for integer numbers
              if ($el.val() % 1 === 0) {
                initialValue = parseInt($el.val(), 10);
              }
              else {
                initialValue = parseFloat($el.val());
              }

              updateSync($el);

              // namespaces events
              $(document)
                .on('mousemove.inputs', mouseMove)
                .on('mouseup.inputs', mouseUp);

              return false;
          }

          function mouseMove(e) {
              if(!state.$node && selection.length<1){
                return;
              }
              var currentValue;
              if ($el.val() % 1 === 0) {
                currentValue = parseInt($el.val(), 10);
              }
              else {
                currentValue = parseFloat($el.val());
              }

             // var currentValue = parseInt($el.val(), 10),
              var event = e.originalEvent,
                movementX = event.movementX || event.webkitMovementX || event.mozMovementX || 0,
                movementY = event.movementY || event.webkitMovementY || event.mozMovementY || 0;      

              distance += (movementX - movementY) * options.step;

              $el.val(Math.min(options.max, Math.max(initialValue + distance, options.min)));

              updateSync($el);
          }

          function mouseUp() {
          
              $(document).off('mousemove.inputs mouseup.inputs');

              if (Math.abs(distance) < options.tolerance) {
                $el.focus();
              }
          }
         
          function keyEnter(e) {
            if(e.keyCode == 13){
              updateSync($(e.target))
            }
          }

          // accept only negative/positive/decimal numbers
          // not characters
          $el.change(function(){
              var val = this.value, sign = '';
              if(val.lastIndexOf('-', 0) === 0){
                  sign = '-';
                  val = val.substring(1);
              }
              var parts = val.split('.').slice(0,2);
              if(parts[0] && parseInt(parts[0], 10).toString() !== parts[0]){
                  parts[0] = parseInt(parts[0], 10);
                  if(!parts[0])
                      parts[0] = 0;
              }
              var result = parts[0];
              if(parts.length > 1){
                  result += '.';
                  if(parts[1].length > 3 || 
                    parseInt(parts[1], 10).toString() !== parts[1]){
                        parts[1] = parseInt(parts[1].substring(0,3), 10);
                        if(!parts[1])
                            parts[1] = 0;
                  }
                  result += parts[1];
              }
              this.value = sign+result;
          });

          $el.on("keyup", keyEnter);
          $el.on('focus', function(){
            $(this).off('mousedown.inputs');
          })
          $el.on('blur', function(e){
            if(!state.$node && selection.length<1){
              return;
            }
            updateSync($(e.target));
            $(this).on('mousedown.inputs', mouseDown);
          })
          $el.on('mousedown.inputs', mouseDown);
      });
  };


  function updateSync($el) {
    // var parsedVal = $el.val();
    // //if(!parsedVal.match(/^\d+$/)){
    // if(!parsedVal.match(/^[+-]?[\d,]+(\.\d{3})?$/)){
    //   alert("Only numbers allowed")
    //   //$el.focus();
    //   return;
    // }

    if($el.attr('id') == 'mx') {

      state.data.x = $el.val();
      selection.setX(state.data.x);
      redraw();
    }
    if ($el.attr('id') == 'my') {

      state.data.y = $el.val();
      selection.setY(state.data.y);
      redraw();
    }

    if ($el.attr('id') == 'mz') {

      state.data.z = $el.val();
      selection.setZ(state.data.z); 
      redraw();
    }

    if ($el.attr('id') == 'ms') {

      state.data.scale = $el.val();
      selection.setScale(state.data.scale);
      redraw();
    }

    if ($el.attr('id') == 'mr') {

      state.data.rotate = $el.val();
      selection.setRotate(state.data.rotate);
      redraw();
    }

    if ($el.attr('id') == 'mrx') {

      state.data.rotateX = $el.val();
      //selection.setRotate(state.data.rotate); //TO DO
      redraw();
    }

    if ($el.attr('id') == 'mry') {

      state.data.rotateY = $el.val();
      //selection.setRotate(state.data.rotate); //TO DO
      redraw();
    }

  }


  var sequence = (function () {
    var s = 1;
    return function () {
      return s++;
    }
  })()

  var offset = (function () {
    var offset = 0;
    return function () {
      return offset+=1100;
    }
  })()

  function addSlide() {
    //console.log('add')
    //query slide id
    var id, $step;
    var seq = sequence();
    id = 'new-slide' + seq;
    var dom = $("#"+id);
    while (dom.length > 0) {
      seq = sequence();
      id = 'new-slide' + seq;
      dom = $("#"+id);
    }
    $step = $('<div class="step"></div>').html('<h1>This is a new step ' + seq + '</h1> <p>How about some contents?</p>');
    $step[0].id = id;
    $step[0].dataset.x = offset();
    $step[0].dataset.scale = 1;
    //console.log($('.step:last'))
    // works when the overview div is the first child of impress main div
    $step.insertAfter($('.step:last')); //not too performant, but future proof
    config.creationFunction($step[0]);
    // jump to the new slide to make some room to look around
    //config.showMenu();
    config.makeEditable(id);
    config['goto']($step[0]);

    //console.log($step[0])
    return $($step[0]);
  }

  function showControls($where) {
    var top, left, pos = $where.offset();
    //not going out the edges (at least one way)
    top = (pos.top > 0) ? pos.top + (100 / config.visualScaling) : 0;
    left = (pos.left > 0) ? pos.left  + (100 / config.visualScaling) : 0;

    $controls.show().offset({
      top: top,
      left: left
    });

    // difference between attr() and .val()
    $("#mx").val(state.data.x || 0);      
    $("#my").val(state.data.y || 0);
    $("#mz").val(state.data.z || 0);
    $("#mr").val(state.data.rotate || 0);
    $("#ms").val(state.data.scale || 0);
    $("#mrx").val(state.data.rotateX || 0);
    $("#mry").val(state.data.rotateY || 0);

  }

  // function SaveContent() {
  //   asqEditor.save()
  // }

  function deleteContents() {
    var el = state.$node[0];
    if(el.getAttribute("id") !== "overview") {
      var r = confirm("Are you sure you want to delete this slide?");
      //console.log($(this))
      if (r == true) {
        config.deleteStep(el.getAttribute("id"));
        thumbManager.deleteThumb(el.getAttribute("id"));
        //console.log(  config)
        el.remove();
        // make showmenu not to display the deleted slides
        //config.showMenu();
        config['goto']("overview");
      }
    }
  }


  // go to presentation mode 
  // remove the query from the url
  function gotoPresentation () {
    var re = /([^?]+).*/;
    var result = re.exec(document.location.href);
    document.location.href = result[1];
  }


  function loadData() {
    //state.data=state.$node[0].dataset;
    //add defaults
    state.data.x = parseFloat(state.$node[0].dataset.x) || defaults.x;
    state.data.y = parseFloat(state.$node[0].dataset.y) || defaults.y;
    state.data.z = parseFloat(state.$node[0].dataset.z) || defaults.z;    
    state.data.scale = parseFloat(state.$node[0].dataset.scale) || defaults.scale;
    state.data.rotate = parseFloat(state.$node[0].dataset.rotate) || defaults.rotate;
    state.data.rotateX = parseFloat(state.$node[0].dataset.rotateX) || defaults.rotateX; 
    state.data.rotateY = parseFloat(state.$node[0].dataset.rotateY) || defaults.rotateY; 
  }


  function redraw() {
    clearTimeout(redrawTimeout);
    redrawTimeout = setTimeout(function () {
      //state.$node[0].dataset=state.data;

      if (selection.length > 1) {
        for (var i = 0; i < selection.length; i++) {
          selection[i].$node[0].dataset.x = selection[i].data.x;
          selection[i].$node[0].dataset.y = selection[i].data.y;
          selection[i].$node[0].dataset.z = selection[i].data.z;
          selection[i].$node[0].dataset.rotate = selection[i].data.rotate;
          selection[i].$node[0].dataset.rotateX = selection[i].data.rotateX;
          selection[i].$node[0].dataset.rotateY = selection[i].data.rotateY;
          selection[i].$node[0].dataset.scale = selection[i].data.scale;

          config.redrawFunction(selection[i].$node[0]);
        }
      }

      state.$node[0].dataset.scale = state.data.scale;
      state.$node[0].dataset.rotate = state.data.rotate;
      state.$node[0].dataset.rotateX = state.data.rotateX; 
      state.$node[0].dataset.rotateY = state.data.rotateY; 
      state.$node[0].dataset.x = state.data.x;
      state.$node[0].dataset.y = state.data.y; 
      state.$node[0].dataset.z = state.data.z; 

      /**/
      //console.log(state.data,state.$node[0].dataset,state.$node[0].dataset===state.data);

      config.redrawFunction(state.$node[0]);
      showControls(state.$node);
      //console.log(['redrawn',state.$node[0].dataset]);
    }, 20);
  }

  function fixVector(x, y) {
    var result = {
      x: 0,
      y: 0
    },
      angle = (config.rotation / 180) * Math.PI,
      cs = Math.cos(angle),
      sn = Math.sin(angle);

    result.x = (x * cs - y * sn) * config.visualScaling;
    result.y = (x * sn + y * cs) * config.visualScaling;
    return result;
  }

  function handleMouseMove(e) {
    e.preventDefault();
    e.stopPropagation();

    var x = e.pageX - mouse.prevX,
      y = e.pageY - mouse.prevY;

    mouse.prevX = e.pageX;
    mouse.prevY = e.pageY;
    if (mouse.activeFunction) {
      mouse.activeFunction(x, y);
      redraw();
    }

    return false;
  }

  // return editor API
  return {
    init: init,
    bootstrap: bootstrap
  };


})();


// PLUGINS

$(function () {

  // Initialise plugin
  $('.slidable').slidingInput();

  // Accepts options object that override defaults, but step/min/max on input override options
  /*
      $('.slidable').slidingInput({
          step: 1,
          min: 0,
          max: 100,
          tolerance: 2
      });
  */

  // copied from impress.js Copyright 2011-2012 Bartek Szopka (@bartaz)
  var pfx = (function() {
    var style = document.createElement('dummy').style,
            prefixes = 'Webkit Moz O ms Khtml'.split(' '),
            memory = {};
    return function(prop) {
        if (typeof memory[ prop ] === "undefined") {
            var ucProp = prop.charAt(0).toUpperCase() + prop.substr(1),
                    props = (prop + ' ' + prefixes.join(ucProp + ' ') + ucProp).split(' ');
            memory[ prop ] = null;
            for (var i in props) {
                if (style[ props[i] ] !== undefined) {
                    memory[ prop ] = props[i];
                    break;
                }
            }
        }
        return memory[ prop ];
    };
  }());

  function getTrans3D() {

    var prefix = (pfx('transform'));
    var trans = $("#impress div:first-child")[0].style['' + prefix + ''].match(/.+?\(.+?\)/g);
    var dico = {};
    for (var el in trans) {
        var ele = trans[el];
        var key = ele.match(/.+?\(/g).join("").match(/[a-zA-Z0-9]/g).join("");
        var value = ele.match(/\(.+\)/g)[0].split(",");
        if (value.length <= 1) {
            value = parseFloat(value[0].match(/-[0-9]+|[0-9]+/g)[0]);
            dico[key] = value;
        } else {
            dico[key] = {};
            for (val in value) {
                var vale = parseFloat(value[val].match(/-[0-9]+|[0-9]+/g)[0]);
                dico[key][val] = vale;
            }
        }
    }
    return dico;

  }

  // copied from impress.js Copyright 2011-2012 Bartek Szopka (@bartaz)
  // `translate` builds a translate transform string for given data.
  function translate(t) {
    return " translate3d(" + t.translate3d[0] + "px," + t.translate3d[1] + "px," + t.translate3d[2] + "px) ";
  };

  // copied from impress.js Copyright 2011-2012 Bartek Szopka (@bartaz)
  // `rotate` builds a rotate transform string for given data.
  // By default the rotations are in X Y Z order that can be reverted by passing `true`
  // as second parameter.
  function rotate(r, revert) {
    var rX = " rotateX(" + r.rotateX + "deg) ",
      rY = " rotateY(" + r.rotateY + "deg) ",
      rZ = " rotateZ(" + r.rotateZ + "deg) ";

    return revert ? rZ + rY + rX : rX + rY + rZ;
  };

  // copied from impress.js Copyright 2011-2012 Bartek Szopka (@bartaz)
  // `css` function applies the styles given in `props` object to the element
  // given as `el`. It runs all property names through `pfx` function to make
  // sure proper prefixed version of the property is used.
  function css  (el, props) {
    var key, pkey;
    for (key in props) {
      if (props.hasOwnProperty(key)) {
        pkey = pfx(key);
        if (pkey !== null) {
          el.style[pkey] = props[key];
        }
      }
    }
    return el;
  };


  $(document).mousewheel(function(event, delta, deltaX, deltaY) {

    var transform = getTrans3D();
    transform.translate3d[2] = transform.translate3d[2] + deltaY * 10;

    //set transfor and then
    //set transition to 0 for fast response. We don' need impress animations when zooming
    css($('#impress div:first-child')[0], {
      transform: rotate(transform, true) + translate(transform),
      transition: "all 0 ease 0" 
    })
  }); 

  // credits to https://github.com/clairezed/ImpressEdit 
  // compute the right angle for the position and rotation
  function angle (obj, e) {
      var alpha = obj.rotateX * 2 * Math.PI / 360;
      var beta = obj.rotateY * 2 * Math.PI / 360;
      var gamma = obj.rotateZ * 2 * Math.PI / 360;


      var dReal = {
          x: e.pageX - $("#impress").data('event').pos.x,
          y: e.pageY - $("#impress").data('event').pos.y
      };

      var scale = -1;

      var dVirtuel = {
          x: 0,
          y: 0,
          z: 0
      };

      //to rotate in Z
      dVirtuel.x += dReal.x * Math.cos(gamma) + dReal.y * Math.sin(gamma);
      dVirtuel.y += dReal.y * Math.cos(gamma) - dReal.x * Math.sin(gamma);
      dVirtuel.z += 0;

      //to rotate in X
      dVirtuel.x += dReal.x;
      dVirtuel.y += dReal.y * Math.cos(alpha);
      dVirtuel.z += -dReal.y * Math.sin(alpha);

      //to rotate in Y
      dVirtuel.x += dReal.x * Math.cos(beta);
      dVirtuel.y += dReal.y * Math.cos(beta) - dReal.y * Math.sin(beta);
      dVirtuel.z += dReal.x * Math.sin(beta);

      var dVirtuel = {
          x: 0,
          y: 0,
          z: 0
      };

      dVirtuel.x += dReal.x * (Math.cos(gamma) + Math.cos(beta)) + dReal.y * Math.sin(gamma);
      dVirtuel.y += dReal.y * (Math.cos(gamma) + Math.cos(alpha) + Math.cos(beta) - Math.sin(beta)) - dReal.x * Math.sin(gamma);
      dVirtuel.z += dReal.x * Math.sin(beta) - dReal.y * Math.sin(alpha);
      //
      dVirtuel.x *= scale;
      dVirtuel.y *= scale;
      dVirtuel.z *= scale;

      var object = {
        dVirtuelX : dVirtuel.x,
        dVirtuelY : dVirtuel.y,
        dVirtuelZ : dVirtuel.z

      }
      return object;
  }


  // copied from https://github.com/clairezed/ImpressEdit
  $(document).mousedown(function(event) {

    var $body = $('body');

    $("#impress").data('event', {
        pos: {
            x: event.pageX,
            y: event.pageY
        }
    });

    // hold the left click to move the viewport
    if (event.which === 1) {
      $(this).on('mousemove.moveView', function(event) {

        // disable selection when moving the viewport
        var styles = {
          "-webkit-touch-callout" : "none",
          "-webkit-user-select" : "none",
          "-khtml-user-select" : "none",
          "-moz-user-select" : "none",
          "-ms-user-select" : "none",
          "user-select" : "none"
        };
        
        var transform = getTrans3D();
        var obj = angle(transform, event);

        transform.translate3d[0] = parseInt(transform.translate3d[0] - obj.dVirtuelX);
        transform.translate3d[1] = parseInt(transform.translate3d[1] - obj.dVirtuelY);
        transform.translate3d[2] = parseInt(transform.translate3d[2] - obj.dVirtuelZ);

        // update the old mouse position 
        $("#impress").data('event').pos.x = event.pageX;
        $("#impress").data('event').pos.y = event.pageY;
        
        css($('#impress div:first-child')[0], {
          transform: rotate(transform, true) + translate(transform),
          transition: "all 0 ease 0" 
        })

        $body.css(styles);

      });

    }

    // hold the middle mouse click to rotate the viewport
    if (event.which === 2) {

      $(this).on('mousemove.rotateView', function(event) {

        var transform = getTrans3D();
        var obj = angle(transform, event);

        transform.rotateX = parseInt(transform.rotateX - obj.dVirtuelX);
        transform.rotateY = parseInt(transform.rotateY - obj.dVirtuelY);
        transform.rotateZ = parseInt(transform.rotateZ - obj.dVirtuelZ);

        // update the old mouse position 
        $("#impress").data('event').pos.x = event.pageX;
        $("#impress").data('event').pos.y = event.pageY;
        
        css($('#impress div:first-child')[0], {
          transform: rotate(transform, true) + translate(transform),
          transition: "all 0 ease 0" 
        })

      });
    }

    // unbind handlers
    $(this).on("mouseup", function() {
      $body.css('cursor', 'default');
      $(this).off(".moveView");
      $(this).off(".rotateView");
    });


    // prevent the handlers of viewport on steps
    $(this).on('mousedown mousewheel', '#impress div.step', function(event) {
      //console.log('user-select : ""')
      event.stopPropagation(); 
    
    });
  }); 
});