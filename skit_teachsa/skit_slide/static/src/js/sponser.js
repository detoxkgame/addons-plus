odoo.define('skit_slide.sponser', function (require) {

	$(document).ready(function(){
		var slideWidth = $('.website-slide ul li').width();
		var testimonialWidth = $('.testimonial-slide ul li').width();
		 setInterval(function () {
	            moveRight();
	        }, 3000);
		 
		 setInterval(function () {
	           moveTestimonialRight();
	        }, 6000);
		 
		  function moveRight() {
		    	console.log("slide");
		        $('.website-slide ul').animate({
		            left: -slideWidth
		        }, 200, function () {
		            $('.website-slide ul li:first-child').appendTo('.website-slide ul');
		            $('.website-slide ul').css('left', '');
		        });
		    };
		    function moveTestimonialRight() {
		    	console.log("testimonial");
		        $('.testimonial-slide ul').animate({
		            left: -slideWidth
		        }, 200, function () {
		            $('.testimonial-slide ul li:first-child').appendTo('.testimonial-slide ul');
		            $('.testimonial-slide ul').css('left', '');
		        });
		    };	
	});
  
});
		