odoo.define('skit_website_menu.menu', function(require) {
	'use strict';
	var dom = require('web.dom');
	var sAnimation = require('website.content.snippets.animation');
	var FixedMenu = require('website.content.menu');
					sAnimation.registry.affixMenu = sAnimation.Class.extend({
						_onWindowUpdate : function() {
							this._super();
							var wOffset = $(window).scrollTop();
							var hOffset = this.$target.scrollTop();
							this.$headerClone.toggleClass('affixeds',
									wOffset > (hOffset + 300));

							// Reset opened menus
							this.$dropdowns.removeClass('show');
							this.$navbarCollapses.removeClass('show').attr(
									'aria-expanded', false);
						},
					});

	var fileTypes = ['pdf', 'docx', 'rtf', 'jpg', 'jpeg', 'png', 'txt'];  //acceptable file types
	function readURL(input) {
	    if (input.files && input.files[0]) {
	        var extension = input.files[0].name.split('.').pop().toLowerCase(),  //file extension from input file
	            isSuccess = fileTypes.indexOf(extension) > -1;  //is extension in acceptable types

	        if (isSuccess) { //yes
	            var reader = new FileReader();
	            reader.onload = function (e) {
	                if (extension == 'pdf'){
	                	$(input).closest('.fileUpload').find(".icon").attr('src','https://image.flaticon.com/icons/svg/179/179483.svg');
	                }
	                else if (extension == 'docx'){
	                	$(input).closest('.fileUpload').find(".icon").attr('src','https://image.flaticon.com/icons/svg/281/281760.svg');
	                }
	                else if (extension == 'rtf'){
	                	$(input).closest('.fileUpload').find(".icon").attr('src','https://image.flaticon.com/icons/svg/136/136539.svg');
	                }
	                else if (extension == 'png'){ $(input).closest('.fileUpload').find(".icon").attr('src','https://image.flaticon.com/icons/svg/136/136523.svg'); 
	                }
	                else if (extension == 'jpg' || extension == 'jpeg'){
	                	$(input).closest('.fileUpload').find(".icon").attr('src','https://image.flaticon.com/icons/svg/136/136524.svg');
	                }
	              else if (extension == 'txt'){
	                	$(input).closest('.fileUpload').find(".icon").attr('src','https://image.flaticon.com/icons/svg/136/136538.svg');
	                }
	                else {
	                	//console.log('here=>'+$(input).closest('.uploadDoc').length);
	                	$(input).closest('.uploadDoc').find(".docErr").slideUp('slow');
	                }
	            }

	            reader.readAsDataURL(input.files[0]);
	        }
	        else {
	        		//console.log('here=>'+$(input).closest('.uploadDoc').find(".docErr").length);
	            $(input).closest('.uploadDoc').find(".docErr").fadeIn();
	            setTimeout(function() {
					   	$('.docErr').fadeOut('slow');
						}, 9000);
	        }
	    }
	}
	$(document).ready(function(){
	   
	   $(document).on('change','.up', function(){
	   	var id = $(this).attr('id'); /* gets the filepath and filename from the input */
		   var profilePicValue = $(this).val();
		   var fileNameStart = profilePicValue.lastIndexOf('\\'); /* finds the end of the filepath */
		   profilePicValue = profilePicValue.substr(fileNameStart + 1).substring(0,20); /* isolates the filename */
		   //var profilePicLabelText = $(".upl"); /* finds the label text */
		   if (profilePicValue != '') {
		   	//console.log($(this).closest('.fileUpload').find('.upl').length);
		      $(this).closest('.fileUpload').find('.upl').html(profilePicValue); /* changes the label text */
		   }
	   });
	});

});