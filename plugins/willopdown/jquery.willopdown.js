$(function(){
    //From a select dropdown get selected OR FIRST item text
    $.fn.selectedOrFirstText = function(){
        var $opts = $(this).find('option');
        if($opts.filter(':selected').length > 0) {
            return $opts.filter(':selected').text();
        } else {
            return $($opts[0]).text();
        }
    };
    
    //Restyle all select dropdowns
    $.selectReplace = function(){
        $('select:not(.replaced, .noreplace)').each(function(){
            //Add formatting containers
            var firstText = $(this).selectedOrFirstText();
            if(typeof($(this).data('default')) != 'undefined') {
                firstText = $(this).data('default');
            }
            $(this).addClass('replaced').wrap('<div class="selectreplace">').parent().addClass('id-'+$(this).attr('id'))
                .append('<span class="selectpicker">'+firstText+'<span class="arr">&#711;</span></span>');
        });
        if(!$('body').hasClass('selectreplaced')) {
            $(document).on('mousedown', '.selectreplace .selectpicker', function(){
                $(this).siblings('select').click();
            });
            $(document).on('change keyup', '.selectreplace select', function(){
                $(this).siblings('.selectpicker').html($(this).selectedOrFirstText() + '<span class="arr">&#711;</span>');
            });
        }
    };

    //Do it, do it now!
    $.selectReplace();
});