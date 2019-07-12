odoo.define('skit_file_upload.careers', function (require) {
"use strict";
var vids = $("video"); 
var ajax = require('web.ajax');
/* Career Page Resume Submit Action */
$(document).ready(function(){
	 var resetAnimation = function resetAnimation() {
		  var confirmGif = document.getElementById("confirm_gif_id");
		  confirmGif.src = confirmGif.src;
	};
	 var launchButton = document.getElementById("launch");
	 launchButton.addEventListener("click", resetAnimation);
	 
		$(".sks-career-submit").click(function(){
		  var error = false;
		  var name = $('.sks-career-form-name').val();
		  var degree = $('.sks-career-form-qualification').val();
		  var phone = $('.sks-career-form-phone').val();
		  var email = $('.sks-career-form-email').val();
		  var information = $('.sks-career-form-about').val();
		  var file = $("#file_upload")[0].files[0];
		  
		  if(file==undefined){
			  alert('Please Upload the document.');
			  return false;
		  }
		  var formData = new FormData();
	      var reader = new FileReader();
	      	formData.append('file_name', file.name);
	        formData.append('file_type', file.type);
	        formData.append('name', name);
	        formData.append('degree', degree);
	        formData.append('phone', phone);
	        formData.append('email', email);
	        formData.append('about', information);		 
		 
		  $('.sks-career-form-design input').each(function(){
			  var value = $(this).val();
			  var check_mandatory=$(this).attr("ismandatorty");
			  if(check_mandatory=='true' && value.length<=0){
				  $(this).addClass('warning');
				  error = true;
			  }
			
		  });
		  
		  $(".sks-career-form").on('change keyup paste input', function (ev) {	
				if($(this).hasClass("warning"))
				{
					$(this).removeClass("warning");			
				}
		   });
		  
		  if(!error){
				 reader.onload = function(){
				        var dataURL = reader.result;
				        formData.append('doxFile', dataURL);				       
				           $.ajax(
				          {
				              url : '/websites/career/information',
				              type: "POST",
				              data : formData,
				              dataType:'json',
				              cache: false,
				              processData: false,
				              contentType: false,

				          success: function(data, textStatus, jqXHR){
				              $('#confirm').fadeIn( 600 ).delay( 2500 ).fadeOut( 700 );
							  $('.sks-career-form-design').trigger("reset");
							  $('.sks-career-form-design #file_upload').val();
							  $('.sks-career-form-design #upload').text("Upload");
							  
				          },
				          error: function (jqXHR, textStatus, errorThrown) { 
				        	  
				        	  alert('Could not connect to server.')
				          }
				          })
				      }
				 
				      reader.readAsDataURL(file);			
		  }
		  else{
			  return false;
		  } 
		  
	});
	  
	 
});
});