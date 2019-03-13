odoo.define('skit_snippets.jquery.scroll', function (require) {
"use strict";

/***Start code for while click on image focus to appropriate description part ***/

$(window).ready(function() {
	  
    var wHeight = $(window).height();

    $('.sks-slide')
      .height(wHeight)
      .scrollie({
        scrollOffset : -50,
        scrollingInView : function(elem) {
                   
          var bgColor = elem.data('background');
          $('body').css('background-color', bgColor);
          
        }
      });

  });

/***End code for while click on image focus to appropriate description part ***/

});