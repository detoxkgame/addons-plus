odoo.define('skit_snippets.float_icon', function (require) {
"use strict";
var vids = $("video"); 
var ajax = require('web.ajax');
$(document).ready(function () {
	$('#skit_video').each(function(){
	       this.controls = false; 
	});
	
	/* Reset the confirmGif image in confirmation popup */
	 var resetAnimation = function resetAnimation() {
		  var confirmGif = document.getElementById("confirm_gif_id");
		  confirmGif.src = confirmGif.src;
	};
	 var launchButton = document.getElementById("launch");
	 var launchhireButton = document.getElementById("hire_launch");
	 var launchdevelopButton = document.getElementById("develop_launch");
	 launchButton.addEventListener("click", resetAnimation);
	 launchhireButton.addEventListener("click", resetAnimation);
	 launchdevelopButton.addEventListener("click", resetAnimation);
	 
	$(document).on("scroll", function(){
		var $height = $(window).scrollTop();
		var hide_video = $(".section4").offset();
		var hide_arrow = $(".section2").offset();
		var hide_nav = $(".sks_scroll_nav").offset();
		 /* To Hide video */	
		if(hide_video){
			if($height <(hide_video.top)-750) {
				$("#skit_video").css({"opacity":"1"});
			} 
			else {
				$("#skit_video").css({"opacity":"0"});
			}
		}
		/* To Hide arrow*/	
		if(hide_arrow){
			if($height <(hide_arrow.top)-750) {
				$(".scroll_icon").css({"opacity":"1"});
			} 
			else {
				$(".scroll_icon").css({"opacity":"0"});
			}
		}
		/* To Hide Menu nav*/	
		if(hide_nav){
			if($height <(hide_nav.top)) {
				$(".navbar").css({"opacity":"1"});
			} 
			else {
				$(".navbar").css({"opacity":"0"});
			}
		}
	});
	
	/* Software Implementation page launch action */
	  $(".launch").click(function(){		 
		  var post = {};
		  var error = false;
		  var name = $('.name').val();
		  var company = $('.company').val();
		  var project = $('.project').val();
		  var email = $('.email').val();
		  var phone = $('.phone').val();
		  post['name'] = name;
		  post['company'] =company;
		  post['project'] =project;
		  post['email'] =email;
		  post['phone'] =phone;
		  $('.soft_imp input').each(function(){
			  var value = $(this).val();
			  var check_mandatory=$(this).attr("ismandatorty");
			  if(check_mandatory=='true' && value.length<=0){
				  $(this).addClass('warning');
				  error = true;
			  }
			
		  });
		  
		  $(".sks_float_input").on('change keyup paste input', function (ev) {	
				if($(this).hasClass("warning"))
				{
					$(this).removeClass("warning");			
				}
		   });
		  if(!error){
			  ajax.jsonRpc('/website/software/implementation', 'call', post).then(function (result) {  	
				 
				  if(result){
					  $('#confirm').fadeIn( 600 ).delay( 2500 ).fadeOut( 700 );
					  $('.sks_float_form').trigger("reset");
				  }
		          
		        }); 
		  }
		  return false; 
	});
	  
	/* Hire Resource page launch action */  
	$(".hire_launch").click(function(){		 
		  var post = {};
		  var error = false;
		  var name = $('.hire_name').val();
		  var company = $('.hire_company').val();
		  var project = $('.hire_project').val();
		  var email = $('.hire_email').val();
		  var phone = $('.hire_phone').val();
		  post['name'] = name;
		  post['company'] =company;
		  post['project'] =project;
		  post['email'] =email;
		  post['phone'] =phone;
		  $('.hire_form input').each(function(){
			  var value = $(this).val();
			  var check_mandatory=$(this).attr("ismandatorty");
			  if(check_mandatory=='true' && value.length<=0){
				  $(this).addClass('warning');
				  error = true;
			  }
			
		  });
		  
		  $(".sks_float_input").on('change keyup paste input', function (ev) {	
				if($(this).hasClass("warning"))
				{
					$(this).removeClass("warning");			
				}
		   });
		  if(!error){
			  ajax.jsonRpc('/website/hire/resource', 'call', post).then(function (result) {  	
				  if(result){
					  $('#confirm').fadeIn( 600 ).delay( 2500 ).fadeOut( 700 );
					  $('.sks_float_form').trigger("reset");
				  }
		          
		        }); 
		  }
		  return false;  
	});
	
	/* Software Development Needs page launch action */  
	$(".develop_launch").click(function(){		 
		  var post = {};
		  var error = false;
		  var name = $('.develop_name').val();
		  var company = $('.develop_company').val();
		  var project = $('.develop_project').val();
		  var email = $('.develop_email').val();
		  var phone = $('.develop_phone').val();
		  post['name'] = name;
		  post['company'] =company;
		  post['project'] =project;
		  post['email'] =email;
		  post['phone'] =phone;
		  $('.development_form input').each(function(){
			  var value = $(this).val();
			  var check_mandatory=$(this).attr("ismandatorty");
			  if(check_mandatory=='true' && value.length<=0){
				  $(this).addClass('warning');
				  error = true;
			  }
			
		  });
		  
		  $(".sks_float_input").on('change keyup paste input', function (ev) {	
				if($(this).hasClass("warning"))
				{
					$(this).removeClass("warning");			
				}
		   });
		  if(!error){
			  ajax.jsonRpc('/website/software/development', 'call', post).then(function (result) {  	
				  if(result){
					  $('#confirm').fadeIn( 600 ).delay( 2500 ).fadeOut( 700 );
					  $('.sks_float_form').trigger("reset");
				  }
		          
		        }); 
		  }
		  return false;  
	});
});

$(window).load(function () {

  $(".contact-forms__hello-icon").click(function(){
    	document.getElementById("myNav").style.height = "100%";
    	$('.contact-forms__close-icon').show(0);
        $('.contact-forms__hello-icon').hide(0);
    });
  
  $(".contact-forms__close-icon").click(function(){
	  	document.getElementById("myNav").style.height = "0%";
	  	document.getElementById("contactForm").style.display = "none";
	  	$('.contact-forms__hello-icon').show(0);
	    $('.contact-forms__close-icon').hide(0);
  }); 
  
  // Software Implementation form animations
	$('#contact').click(function() {
	    $('#contactForm').slideToggle();
	    $('.sks_float_form').trigger("reset");
	    $('.hire_form').css({"display":"none"});
	    $('.development_form').css({"display":"none"});
	    $('.soft_imp').css({"display":"block"})
	    $('#contactForm input').each(function(){
	    	$(this).removeClass('warning');
		});
	});
	// Hire resource form animations
	$('.hire_resource').click(function() {
	   $('#contactForm').slideToggle();
	   $('.soft_imp').css({"display":"none"});
	   $('.development_form').css({"display":"none"});
	   $('.hire_form').css({"display":"block"});
	   $('#contactForm input').each(function(){
		 $(this).removeClass('warning');
	  });
	});
	// Software Development Needs form animations
	$('.software_develop').click(function() {
	   $('#contactForm').slideToggle();
	   $('.soft_imp').css({"display":"none"});
	   $('.hire_form').css({"display":"none"});
	   $('.development_form').css({"display":"block"});
	   $('#contactForm input').each(function(){
		 $(this).removeClass('warning');
	  });
	});
  
  $("#sks_fa-chevron_left").click(function(){
	  	document.getElementById("contactForm").style.height = "100%";
		document.getElementById("contactForm").style.display = "none";
	  	$('#contact').show(0);
	    $('#sks_fa-chevron_left').show(0);
	    $('.sks_float_form').trigger("reset");
	   
});  
   
  /* Make the focus on a particular Section after click the Main Menu Start */
  	$(".nav-item").click(function() {
  		var nav = $(this).find('span').text();
  		$('html,body').animate({
  			scrollTop : $(".sks_section" + nav).offset().top-150
  		}, 'slow');
  		return false;
  	});
  /* Make the focus on a particular Section after click the Main Menu End */

});
});


