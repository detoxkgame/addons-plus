odoo.define('skit_slide.grade', function(require) {
	'use strict';
	
	var ajax = require('web.ajax');

	$(document).ready(function(){
			
		/** Start Grade onChange */
		$('#grade').on('change', function(){
			var grade = $(this).val();
			if(parseInt(grade) > 0){
				$('.grade_header_div').addClass("grade_display_none");
				$('#grade_subjects').removeClass("grade_display_none");
				var post = {};
				post['categ_id'] = parseInt(grade);
				ajax.jsonRpc('/grades-subjects/content', 'call', post).then(function (modal) { 
					$('#grade_subjects').html(modal);
					//vertical_tab();
					breadcurmb_action();
					subject_action();
				});
			}else{
				$('#grade_subjects').addClass("grade_display_none");
				$('#grade_topics').addClass("grade_display_none");
				$('#grade_topics_details').addClass("grade_display_none");
			}
		});
		/** End Grade onChange */
		$('#student_role').on('click', function(){
			$('#student_div').removeClass("grade_display_none");
			$('#parent_div').addClass("grade_display_none");
		});
		$('#parent_role').on('click', function(){
			$('#parent_div').removeClass("grade_display_none");
			$('#student_div').addClass("grade_display_none");
		});
		
	});
	
	/** Start breadcurmb click action */
	function breadcurmb_action(){
		$('#root_grade, #root_topic, #root_topic_detail').on('click', function(){
			$('.grade_header_div').removeClass("grade_display_none");
			$('#grade_subjects').addClass("grade_display_none");
			$('#grade_topics').addClass("grade_display_none");
			$('#grade_topics_details').addClass("grade_display_none");
			$(this).blur();
		    return false;
		});
		$('#root_subject, #root_subject_detail').on('click', function(){
			$('#grade_topics_details').addClass("grade_display_none");
			$('#grade_topics').addClass("grade_display_none");
			$('#grade_subjects').removeClass("grade_display_none");
			$(this).blur();
		    return false;
		});
		$('#document_topic').on('click', function(){
			$('#grade_topics_details').addClass("grade_display_none");
			$('#grade_subjects').addClass("grade_display_none");
			$('#grade_topics').removeClass("grade_display_none");
			$(this).blur();
		    return false;
		});
		
	}
	/** End breadcurmb click action */
	
	/** Start subject action */
	function subject_action(){
		$('.subject-list').on('click', function(){
			var id = $(this).attr('id');
			var post = {};
			post['channel_id'] = parseInt(id);
			ajax.jsonRpc('/grades-subjects/topics', 'call', post).then(function (modal) { 
				$('#grade_subjects').addClass("grade_display_none");
				$('#grade_topics').html(modal);
				$('#grade_topics').removeClass("grade_display_none");
				breadcurmb_action();
				horizontal_tab();
				document_action();
			});
		});
	}
	
	/** End subject action */
	
	/** Start Topics horizontal tab action */
	function horizontal_tab(){
		$('.grade-tab-nav span').on('click', function() {
			  $([$(this).parent()[0], $($(this).data('href'))[0]]).addClass('active').siblings('.active').removeClass('active');
		});
	}
	/** End Topics horizontal tab action */
	
	/** Start document Action */
	function document_action(){
		$('.document_view').on('click', function(){
			var id = $(this).attr('id');
			var post = {};
			post['slide_id'] = parseInt(id);
			ajax.jsonRpc('/grades-subjects/topic/detail', 'call', post).then(function (modal) { 
				$('#grade_subjects').addClass("grade_display_none");
				$('#grade_topics').addClass("grade_display_none");
				$('#grade_topics_details').html(modal);
				$('#grade_topics_details').removeClass("grade_display_none");
				breadcurmb_action();
				horizontal_tab();
				document_action();
				show_questions();
			});
			$(this).blur();
		    return false;
		});
	}
	
	/** End document Action*/
	
	/** Start show next question */
	function show_questions(){
		
		$('#next_quiz').off().on('click', function(){
			var total_question = parseInt($('#total_question').text());
			var question_no = parseInt($('#question_no').text());
			var slide_id = $('#slide_question_id').text();
			var current_question_no = (question_no) + 1;
			if(current_question_no >= total_question){
				$('#next_quiz').addClass("grade_display_none");
				$('#previous_quiz').removeClass("grade_display_none");
				$('#submit_quiz').removeClass("grade_display_none");
			}
			$('#question_no').text(current_question_no);
			var post = {};
			post['question_no'] = current_question_no;
			post['slide_id'] = slide_id;
			post['type'] = 'next';
			ajax.jsonRpc('/grades-subjects/topic/quiz', 'call', post).then(function (modal) { 
				$('#question_tag').html(modal);
				breadcurmb_action();
				horizontal_tab();
				document_action();
				show_questions();
			});
			
		});
		$('#previous_quiz').off().on('click', function(e){
			var total_question = parseInt($('#total_question').text());
			var question_no = parseInt($('#question_no').text());
			var slide_id = $('#slide_question_id').text();
			var current_question_no = (question_no) - 1;
			if(question_no <= total_question){
				$('#submit_quiz').addClass("grade_display_none");
			}
			if(current_question_no <= 1){
				$('#next_quiz').removeClass("grade_display_none");
				$('#previous_quiz').addClass("grade_display_none");
				$('#submit_quiz').addClass("grade_display_none");
			}
			$('#question_no').text(current_question_no);
			var post = {};
			post['question_no'] = current_question_no;
			post['slide_id'] = slide_id;
			post['type'] = 'previous';
			ajax.jsonRpc('/grades-subjects/topic/quiz', 'call', post).then(function (modal) { 
				$('#question_tag').html(modal);
				breadcurmb_action();
				horizontal_tab();
				document_action();
				show_questions();
			});
			
		});
	}
	
	/** End show next question */
	
});