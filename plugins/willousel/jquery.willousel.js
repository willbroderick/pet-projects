/*
* debouncedresize: special jQuery event that happens once after a window resize
*
* latest version and complete README available on Github:
* https://github.com/louisremi/jquery-smartresize/blob/master/jquery.debouncedresize.js
*
* Copyright 2011 @louis_remi
* Licensed under the MIT license.
*/
(function($) {
    var $event = $.event,
    $special,
    resizeTimeout;
    
    $special = $event.special.debouncedresize = {
        setup: function() {
            $( this ).on( "resize", $special.handler );
        },
        teardown: function() {
            $( this ).off( "resize", $special.handler );
        },
        handler: function( event, execAsap ) {
            // Save the context
            var context = this,
                args = arguments,
                dispatch = function() {
                    // set correct event type
                    event.type = "debouncedresize";
                    $event.dispatch.apply( context, args );
                };
    
            if ( resizeTimeout ) {
                clearTimeout( resizeTimeout );
            }
    
            execAsap ?
                dispatch() :
                resizeTimeout = setTimeout( dispatch, $special.threshold );
        },
        threshold: 400
    };
})(jQuery);

/*
 *  jQuery Willousel 1.0.0
 *
 *  Licensed under the MIT license
 *
 *  Copyright (c) 2013 Will Broderick
 */

(function($) {
    //Feature detection methods, from Stackoverflow
    function browserHas3DTransforms() {
        var el = document.createElement('p'),
            has3d,
            transforms = {
                'webkitTransform':'-webkit-transform',
                'OTransform':'-o-transform',
                'msTransform':'-ms-transform',
                'MozTransform':'-moz-transform',
                'transform':'transform'
            };
    
        // Add it to the body to get the computed style.
        document.body.insertBefore(el, null);
    
        for (var t in transforms) {
            if (el.style[t] !== undefined) {
                el.style[t] = "translate3d(1px,1px,1px)";
                has3d = window.getComputedStyle(el).getPropertyValue(transforms[t]);
            }
        }
    
        document.body.removeChild(el);
    
        return (has3d !== undefined && has3d.length > 0 && has3d !== "none");
    }
    
    function supportsTransitions() {
        var b = document.body || document.documentElement;
        var s = b.style;
        var p = 'transition';
        if(typeof s[p] == 'string') {return true; }
    
        // Tests for vendor specific prop
        v = ['Moz', 'Webkit', /*'Khtml',*/ 'O', 'ms'],
        p = p.charAt(0).toUpperCase() + p.substr(1);
        for(var i=0; i<v.length; i++) {
          if(typeof s[v[i] + p] == 'string') { return true; }
        }
        return false;
    }
    
    $.fn.willousel = function(paramOpts){
        var options = { currentItem: 0, transitionSpeed: 150, useAdvancedCSSTransforms: true };
        $.extend(options, paramOpts);
        
        return $(this).each(function(){
            var $localThis = $(this);
            
            //Don't do anything if we don't have any children
            if($localThis.children('.items').children().length == 0) return;
            
            //Add nav buttons
            $localThis.on('click', '.control-prev', function(){
                $localThis.trigger('previtem');
                return false;
            }).on('click', '.control-next', function(){
                $localThis.trigger('nextitem');
                return false;
            });
            var $controls = $localThis.find('.controls');
            if($controls.length == 0) {
                $controls = $('<div class="controls"></div>').appendTo($localThis);
            }
            $controls.append('<a class="control-prev" href="#">Previous</a>').append('<a class="control-next" href="#">Next</a>');
            
            //Create viewport & add styles
            var $localItemsCont = $localThis.children('.items').css({
                margin: 0,
                position: 'relative'
            }).wrap('<div class="willousel-viewport"></div>');
            var $willouselViewport = $localThis.find('.willousel-viewport').css({
                overflow: 'hidden',
                position: 'relative',
                width: '100%'
            });
            
            var $localItems = $localItemsCont.children().css({
                float: 'left',
                listStyle: 'none'
            }).addClass('original-item');
            var $originalItems = $localItems;
            
            //I don't expect this to change
            var originalItemsHTML = $localItemsCont.html();
            var additionalItemsHTML = $(originalItemsHTML).addClass('fluff-item').wrapAll('<div/>').parent().html();
            
            //Next/previous
            $localThis.bind('nextitem previtem', function(e){
                var inc = e.type == 'nextitem' ? 1 : -1;
                $localThis.data('currentitem', $localThis.data('currentitem') + inc).trigger('refreshposition');
            });
            
            //Set start position
            $localThis.data('currentitem', options.currentItem);
            $localThis.data('previousitem', options.currentItem);
            $($localItems[options.currentItem]).addClass('active-item');
            
            //Re-evaluate everything on resize
            $(window).on('debouncedresize', function() {
                $localThis.trigger('refreshitemdimensions').trigger('refreshposition');
            });
            
            var widthOfOrigItems = 0;
            var widthOfAllItems = 0;
            var widthOfContainer = 0;
            $localThis.bind('refreshitemdimensions', function(){
                //Calc width of original set of items (it might have changed with a media query)
                widthOfOrigItems = 0;
                $originalItems.each(function(){
                    widthOfOrigItems += $(this).width();
                });
                //Get width of container
                widthOfContainer = $willouselViewport.width();
                
                //Always scrolling through the originals, adding X either side to mask things
                //From the width of Willousel, do we need to add more items either side?
                var extraRowsRequiredEachSide = Math.ceil(0.5 * widthOfContainer / widthOfOrigItems) + 1; //Always add 1, for the flip
                var currentExtraRowsEachSide = 0.5 * ($localItems.length / $originalItems.length - 1);
                var rowDelta = extraRowsRequiredEachSide - currentExtraRowsEachSide;
                if(rowDelta > 0) {
                    //Add more rows
                    for(var i=0; i<rowDelta; i++) {
                        $localItemsCont.prepend(additionalItemsHTML);
                        $localItemsCont.append(additionalItemsHTML);
                    }
                    //Reassign this var now items have changed
                    $localItems = $localItemsCont.children();
                } else if(rowDelta < 0) {
                    //Subtract unneeded rows
                    var numItemsToRemove = Math.abs(rowDelta) * $originalItems.length;
                    $localItems.filter(':lt(' + numItemsToRemove + ')').remove();
                    var gt = $localItems.length - numItemsToRemove - 1;
                    $localItems.filter(':gt(' + gt + ')').remove();
                }
                
                //Calculate width of all current items in viewport
                widthOfAllItems = 10; //Start with an offset, just for rounding errors etc. It doesn't matter if this is too large
                $localItems.each(function(){
                    widthOfAllItems += $(this).outerWidth();
                });
                
                //And set the dimensions of the viewport to match (taking into account the offset)
                $localItemsCont.css('width', widthOfAllItems);
            });
            
            //Check whether to use margin or CSS3
            var useCSSTransforms = options.useAdvancedCSSTransforms && browserHas3DTransforms() && supportsTransitions();
            var currentOffset = 0;
            
            function processOffset(offset, animSpeed) {
                offset = Math.ceil(offset); //Round to minimise browser blurring
                if(useCSSTransforms) {
                    //CSS3 transform plus transition
                    var transitionCSS = animSpeed + 'ms';
                    var transformCSS = 'translate3d(-' + offset + 'px, 0, 0)';
                    $localItemsCont.css({
                        '-webkit-transition': transitionCSS,
                        '-o-transition': transitionCSS,
                        '-ms-transition': transitionCSS,
                        '-moz-transition': transitionCSS,
                        'transition': transitionCSS,
                        '-webkit-transform': transformCSS,
                        '-o-transform': transformCSS,
                        '-ms-transform': transformCSS,
                        '-moz-transform': transformCSS,
                        'transform': transformCSS
                    });
                } else {
                    //Margin
                    $localItemsCont.stop().animate({ marginLeft: -offset }, animSpeed);
                }
            }
            
            //Evaluates everything and scrolls, if needed
            $localThis.bind('refreshposition', function(e){
                //Sort out to/from indices
                var newIndex = $localThis.data('currentitem');
                
                //If the index has changes, use transition
                if(newIndex == $localThis.data('previousitem')) {
                    var animSpeed = 0;
                } else {
                    var animSpeed = options.transitionSpeed;
                }
                $localThis.data('previousitem', newIndex);
                
                
                //Have we reached the end of the circle?
                var newIndexPreSanity = newIndex;
                //Who knows what people will do with this index, and mod doesn't make things positive
                while(newIndex < 0) newIndex += $originalItems.length;
                while(newIndex >= $originalItems.length) newIndex -= $originalItems.length;
                $localThis.data('currentitem', newIndex);
                
                //Set active class
                $originalItems.removeClass('active-item');
                var $currEl = $($originalItems[newIndex]).addClass('active-item');
                
                //Find offset for active item
                var oldOffset = currentOffset;
                currentOffset = $currEl.position().left + $currEl.width() / 2 - $willouselViewport.width() / 2;
                
                //Do the moves
                
                if(newIndex != newIndexPreSanity) {
                    //Flip forward/backward a huge chunk
                    processOffset(oldOffset + (newIndex > newIndexPreSanity ? widthOfOrigItems : -widthOfOrigItems), 0);
                    setTimeout(function(){
                        processOffset(currentOffset, animSpeed);
                    }, 10);
                } else {
                    processOffset(currentOffset, animSpeed);
                }
            });
            
            //Go when images are loaded
            $localThis.imagesLoaded(function(){
                $localThis.addClass('willousel-loaded').trigger('refreshitemdimensions').trigger('refreshposition');
            });
        });
    };
})(jQuery);

$(function(){
  //Gallery of instagram images
  //Add to page: <div class="willousel willstagram" data-user_id="471995990" data-client_id="a71d3f8902ef4fd38a526f7bc4a6ee00"></div>
  //only need to provide access_token if necessary
  $('.willstagram').each(function(){
    var user_id = $(this).data('user_id');
    var client_id = $(this).data('client_id');
    var access_token = $(this).data('access_token');
    var count = $(this).data('count');
    var $willstagram = $(this);
    $.ajax({
      type: "GET",
      dataType: "jsonp",
      cache: false,
      url: 'https://api.instagram.com/v1/users/' + user_id + '/media/recent?client_id=' + client_id
        + (typeof access_token == 'undefined'? '' : ('&access_token='+access_token))
        + (typeof count == 'undefined'? '' : ('&count='+count)),
      success: function(res) {
        if(typeof res.data != 'undefined') {
          var $itemContainer = $('<ul class="items">').appendTo($willstagram);
          var limit = Math.min(20, res.data.length);
          for(var i = 0; i < limit; i++) {
            var photo_url = res.data[i].images.low_resolution.url;
            var link = res.data[i].link;
            var caption = res.data[i].caption != null ? res.data[i].caption.text : '';
            $itemContainer.append($('<li />').append('<div class="item"><a target="_blank" href="'+link+'"><img src="'+photo_url+'" /></a><div class="desc">'+caption+'</div></div>'));
          }
          if($willstagram.hasClass('willousel')){
            $willstagram.willousel();
          }
        }
      }
    });
  });

  //Willousels
  $('.willousel:not(.willstagram)').willousel();
});