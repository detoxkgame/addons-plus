odoo.define('skit_website_menu.careers', function (require) {
"use strict";
var vids = $("video"); 
var ajax = require('web.ajax');
/* Career Page Resume Submit Action */
$(document).ready(function(){
	  $(".sks-career-submit").click(function(){
		  var post = {};
		  var error = false;
		  var name = $('.sks-career-form-name').val();
		  var degree = $('.sks-career-form-qualification').val();
		  var phone = $('.sks-career-form-phone').val();
		  var email = $('.sks-career-form-email').val();
		  var information = $('.sks-career-form-about').val();
		  post['name'] = name;
		  post['degree'] =degree;
		  post['phone'] =phone;
		  post['email'] =email;
		  post['about'] =information;
		  /*alert("this.write_model"+JSON.stringify(post));*/
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
			 
			  ajax.jsonRpc('/website/career/information', 'call', post).then(function (result) {
				  alert('demo2');
				 
				  if(result){
					  $('#confirm').fadeIn( 600 ).delay( 2500 ).fadeOut( 700 );
					  $('.sks-career-form-design').trigger("reset");
				  }
		          
		        }); 
		  }
		  return false; 
	});
});
});