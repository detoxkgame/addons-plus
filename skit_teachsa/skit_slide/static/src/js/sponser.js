odoo.define('skit_slide.sponser', function (require) {

	$(document).ready(function(){
		var slideWidth = $('.website-slide ul li').width();
		 setInterval(function () {
	            moveRight();
	        }, 3000);
		 
		  function moveRight() {
		    	console.log("slide");
		        $('.website-slide ul').animate({
		            left: -slideWidth
		        }, 200, function () {
		            $('.website-slide ul li:first-child').appendTo('.website-slide ul');
		            $('.website-slide ul').css('left', '');
		        });
		    };
		
	});

  
});
		