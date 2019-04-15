odoo.define('skit_website_menu.contact', function (require) {
"use strict"; 
var ajax = require('web.ajax');
$(document).ready(function () {
	
	/* Reset the confirmGif image in confirmation popup */
	 var resetAnimation = function resetAnimation() {
		  var confirmGif = document.getElementById("confirm_gif_id");
		  confirmGif.src = confirmGif.src;
	};
	 var launchButton = document.getElementById("sks-contact-launch");
	 launchButton.addEventListener("click", resetAnimation);
	
	/* Software Implementation page launch action */
	  $(".sks-contact-launch").click(function(){	
		  var post = {};
		  var error = false;
		  var sks_contact_name = $('.sks_contact_name').val();
		  var sks_contact_company = $('.sks_contact_company').val();
		  var sks_contact_project = $('.sks_contact_project').val();
		  var sks_contact_email = $('.sks_contact_email').val();
		  var sks_contact_phone = $('.sks_contact_phone').val();
		  post['sks_contact_name'] = sks_contact_name;
		  post['sks_contact_company'] =sks_contact_company;
		  post['sks_contact_project'] =sks_contact_project;
		  post['sks_contact_email'] =sks_contact_email;
		  post['sks_contact_phone'] =sks_contact_phone;
		  $('.sks_contact_form input').each(function(){
			  var value = $(this).val();
			  var check_mandatory=$(this).attr("ismandatorty");
			  if(check_mandatory=='true' && value.length<=0){
				  $(this).addClass('warning');
				  error = true;
			  }
			
		  });
		  
		  $(".phone-input").on('change keyup paste input', function (ev) {	
				if($(this).hasClass("warning"))
				{
					$(this).removeClass("warning");			
				}
		   });
		  if(!error){
			  ajax.jsonRpc('/websites/contact_us', 'call', post).then(function (result) {  	
				  if(result){
					  $('#confirm').fadeIn( 600 ).delay( 2500 ).fadeOut( 700 );
					  $('.sks_float_form').trigger("reset");
				  }
		          
		        }); 
		  }
		  return false; 
	});

});

});


