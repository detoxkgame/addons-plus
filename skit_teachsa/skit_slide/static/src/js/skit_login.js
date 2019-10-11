odoo.define('skit_slide.skit_login', function (require) {
	"use strict";
	var ajax = require('web.ajax');
	
	//Start code - onchange function for parent and student radio button
	$(document).ready(function () {
	$('.male_radio').on('change',function(e) {
		var is_male = $('.male_radio').is(':checked');
		if(is_male){
    		$('.female_radio').prop("checked", false);
    	}
    });
	$('.female_radio').on('change',function(e) {
		var is_female = $('.female_radio').is(':checked');
		if(is_female){
    		$('.male_radio').prop("checked", false);
    	}
    });
	});
	//End code - onchange function for parent and student radio button
	
	
	//Start code - tabs
	$('#tab-wrapper li:first').addClass('active');
	$('#tab-body > div').hide();
	$('#tab-body > div:first').show();
	$('#tab-wrapper a').click(function() {
	    $('#tab-wrapper li').removeClass('active');
	    $(this).parent().addClass('active');
	    var activeTab = $(this).attr('href');
	    $('#tab-body > div:visible').hide();
	    $(activeTab).show();
	    return false;
	});
	//End code - tabs
	
	
	//
	var button='<button class="close" type="button" title="Remove this page">×</button>';
	var tabID = 1;
	function resetTab(){
		var tabs=$("#tab-list_stud li:not(:first)");
		var len=1
		$(tabs).each(function(k,v){
			len++;
			$(this).find('a').html('Student ' + len + button);
		})
		//tabID--;
	}

	$(document).ready(function() {
	    $('#btn-add-tab').click(function() {
	        tabID++;
	        $('#tab-list_stud').append($('<li><a href="#stab' + tabID + '" role="tab" data-toggle="tab">Student ' + tabID + '<button class="close" type="button" title="Remove this page">×</button></a></li>'));
	        //$('#tab-list_stud').append($('<li><a href="#stab' + tabID + '" role="tab" data-toggle="tab">Tab<button class="close" type="button" title="Remove this page">×</button></a></li>'));
	        //$('#tab-content_stud').append($('<div class="tab-pane fade" id="stab' + tabID + '">Tab ' + tabID + ' content</div>'));
	        $('#tab-content_stud').append($('<div class="tab-pane fade" id="stab' + tabID + '"></div>'));
	        var newForm= $("#education_fields").clone();
	        newForm.attr('id', 'education_fields stab' + tabID);
	        newForm.removeClass('skit_student_details_hidden');
	        //$('#education_fields').append(newForm);
	        $('#stab'+tabID).append(newForm);
	        var show_sfrm = $( "#tab-content_stud div.active #education_fields" );
	        if (show_sfrm) {
	        	$(".add_sdetail").addClass("active show in");
	        }
	        
	    });
	    $('#tab-list_stud').on('click', '.close', function() {
	        var tabID = $(this).parents('a').attr('href');
	        //alert("tabID"+tabID);
	        $(this).parents('li').remove();
	        $(tabID).remove();

	        //display first tab
	        var tabFirst = $('#tab-list_stud a:first');
	        resetTab();
	        tabFirst.tab('show');
	    });

	    var list = document.getElementById("tab-list_stud");
	});
	
	//
	
});