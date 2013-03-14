/*
 *    jQuery Willery 1.0.0
 *
 *  Published under both the MIT license and Apache license version 2.0
 *
 *	Copyright (c) 2013 Will Broderick
 */

(function($) {
    //Compatibility for <IE9
    (function($) {
      function img(url) {
        var i = new Image;
        i.src = url;
        return i;
      }
     
      if ('naturalWidth' in (new Image)) {
        $.fn.naturalWidth  = function() { return this[0].naturalWidth; };
        $.fn.naturalHeight = function() { return this[0].naturalHeight; };
        return;
      }
      $.fn.naturalWidth  = function() { return img(this.src).width; };
      $.fn.naturalHeight = function() { return img(this.src).height; };
    })(jQuery);

    //This is normally called on a button that should launch it.
    //$('<a/>').willery({...}).trigger('click'); should also work.
    $.fn.willery = function(paramOpts){
        var options = { initialItem: 0, items: [], background: '#333' };
        $.extend(options, paramOpts);
        
        return $(this).bind('click', function(e){
            e.preventDefault();
            
            //If we already have a gallery, delete it - this should never happen!
            $('#willery-modal').remove();
            
            //Create main gallery element
            var $gallery = $('<div id="willery-modal"></div>').css({
                background: options.background
            });
            
            //Create thumbnails
            var $thumbs = $('<ul id="willery-modal-thumbs"></ul>');
            $.each(options.images, function(index, value){
                var $item = $('<a href="#"></a>');
                //Create and add image tag
                var imgOpts;
                if(typeof(value) == 'string') {
                    imgOpts = { 'src': value };
                    $item.data('main-img', value);
                } else {
                    var thumbSrc;
                    if(typeof(value.imageThumb) == 'undefined') {
                        thumbSrc = value.imageMain;
                    } else {
                        thumbSrc = value.imageThumb;
                    }
                    imgOpts = {
                        'src': thumbSrc, 'alt': value.title, 'title': value.title
                    };
                    $item.data('main-img', value.imageMain);
                }
                $item.append($('<img/>').attr(imgOpts));
                //Add visual fluff
                $item.append('<span class="fluff"><span>+</span></span>');
                $('<li></li>').append($item).appendTo($thumbs);
            });
            
            $gallery.append($thumbs);
            
            //Create actual full-screen image elements
            var $imageContainer = $('<div id="willery-modal-image-container"></div>').append($('<img />').hide()).appendTo($gallery);
            
            //When you click on a thumbnail
            $gallery.on('click', '#willery-modal-thumbs a', function(e){
                e.preventDefault();
                var newImgSrc = $(this).data('main-img');
                $imageContainer.children().first().fadeOut(200, function(){
                    $(this).attr('src', newImgSrc);
                    //When image is loaded, set new height & resize
                    $(this).imagesLoaded(function(){
                        $(this).data('natWidth', $(this).naturalWidth());
                        $(this).data('natHeight', $(this).naturalHeight());
                        $gallery.trigger('resize');
                        $(this).fadeIn(200);
                    });
                });
            });
            
            //Load first image
            $thumbs.find('a:first').trigger('click');
            
            //Exit events
            $gallery.bind('exit-willery', function(){
                $gallery.fadeOut(500, function(){
                    $(this).remove();
                });
            });
            $('body').bind('keyup', function(e){
                if(e.which == 27) {
                    $gallery.trigger('exit-willery');
                }
            });
            
            //Exit button
            $('<a href="#" class="exit">X</a>').bind('click', function(){
                $gallery.trigger('exit-willery');
                return false;
            }).appendTo($gallery);
            
            //Event for calculating stuff based on size of area available
            function recalcStuffFromViewportSize(){
                //Rejigger the image based on its size
                var $img = $imageContainer.children().first();
                if(typeof($img.data('natWidth')) != 'undefined') {
                    var viewWidth = $imageContainer.width(); //Container has margin on it
                    var viewHeight = $gallery.height(); //Container always able to fill 100% of parent height
                    var imgWidth = $img.data('natWidth');
                    var imgHeight = $img.data('natHeight');
                    var widthScal = imgWidth / viewWidth;
                    var heightScal = imgHeight / viewHeight;
                    //First, scale image
                    var newImgWidth;
                    var newImgHeight;
                    if(imgWidth < viewWidth && imgHeight < viewHeight) {
                        newImgWidth = imgWidth;
                        newImgHeight = imgHeight;
                    } else {
                        if(widthScal < heightScal) {
                            newImgWidth = imgWidth / heightScal;
                            newImgHeight = imgHeight / heightScal;
                        } else {
                            newImgWidth = imgWidth / widthScal;
                            newImgHeight = imgHeight / widthScal;
                        }
                    }
                    //Set image size and position
                    $img.css({
                        width: newImgWidth,
                        height: newImgHeight,
                        marginTop: (viewHeight-newImgHeight) / 2,
                        marginLeft: (viewWidth-newImgWidth) / 2,
                    });
                }
            };
            $gallery.bind('resize', recalcStuffFromViewportSize).trigger('resize');
            $(window).resize(recalcStuffFromViewportSize);
            
            //Show the thing!
            $('body').append($gallery)
            $gallery.fadeIn(200);
        });
    };
})(jQuery);