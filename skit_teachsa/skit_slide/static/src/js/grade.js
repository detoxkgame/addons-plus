odoo.define('skit_slide.grade', function(require) {
	'use strict';
	
	var ajax = require('web.ajax');

	$(document).ready(function(){
		grade_action();
		subject_action();
		/* User Role Actions */
		/** Student role*/
		$('#student_role').on('click', function(){
			$('#student_div').removeClass("grade_display_none");
			$('#student_role').addClass("button_active");
			$('#parent_div').addClass("grade_display_none");
			$('#parent_role').removeClass("button_active");
			$('.progress_dashboard').addClass("button_active");
		});
		/** Parent role*/
		$('#parent_role').on('click', function(){
			$('#parent_div').removeClass("grade_display_none");
			$('#parent_role').addClass("button_active");
			$('#student_div').addClass("grade_display_none");
			$('#student_role').removeClass("button_active");
			$('.progress_dashboard').addClass("button_active");
		});
		/*End user role action*/

		/** Sub menu actions*/
		//Study details
		$('#demo_study, #pdemo_study').on('click', function(){
			$('.progress_dashboard').removeClass("button_active");
			var post = {};
			$('.ul_menu li').each(function(){
				$(this).removeClass('ul_menu_active')
			});
			$(this).addClass('ul_menu_active')
			ajax.jsonRpc('/grades-subjects/details', 'call', post).then(function (modal) { 
				$('#user_role_div').html(modal);
				grade_action();
				breadcurmb_action();
				subject_action();
				$('#post_title').text('Grades');
				$('#post_title_img').attr('src','/skit_slide/static/src/img/grade.png');
			});
		});
		// Parent details
		$('#parent_view').on('click', function(){
			$('.progress_dashboard').removeClass("button_active");
			var user_partner_id = $('.user_partner_id').text();
			var post = {};
			$('.ul_menu li').each(function(){
				$(this).removeClass('ul_menu_active')
			});
			$(this).addClass('ul_menu_active')
			post['user_partner_id'] = user_partner_id;
			ajax.jsonRpc('/user-role/student_parent/detail', 'call', post).then(function (modal) { 
					$('#user_role_div').html(modal);
					add_parent_action(user_partner_id);
					$('#post_title').text('Parents');
					$('#post_title_img').attr('src','/skit_slide/static/src/img/parent.png');
			});
		});
		
		/** Student Study View */
		$('#study_view').off().on('click', function(){
			var post = {};
			post['is_study'] = true;
			$('.ul_menu li').each(function(){
				$(this).removeClass('ul_menu_active')
			});
			$(this).addClass('ul_menu_active')
			ajax.jsonRpc('/grades-subjects/content', 'call', post).then(function (modal) { 
				$('#user_role_div').html(modal);
				var sub_title = $('#sub_title').text();
				$('#post_title').text(sub_title);
				$('#post_title_img').attr('src','/skit_slide/static/src/img/subject.png');
				breadcurmb_action();
				subject_action();
			});
		});
		
		
		//(Student)Child details
		$('#student_child_view').on('click', function(){
			$('.progress_dashboard').removeClass("button_active");
			$('.ul_menu li').each(function(){
				$(this).removeClass('ul_menu_active')
			});
			$(this).addClass('ul_menu_active')
			var user_partner_id = $('.user_partner_id').text();
			var post = {};
			post['user_partner_id'] = user_partner_id;
			ajax.jsonRpc('/user-role/parent_child/detail', 'call', post).then(function (modal) { 
				$('#user_role_div').html(modal);
				$('#post_title').text('Student');
				$('#post_title_img').attr('src','/skit_slide/static/src/img/student.png');
			});
		});
		
	});
	
	/** Grade onChange action*/
	function grade_action(){
		/** Start Grade onChange */
		$('#grade').off().on('change', function(){
			var grade = $(this).val();
			if(parseInt(grade) > 0){
				$('.grade_header_div').addClass("grade_display_none");
				$('#grade_subjects').removeClass("grade_display_none");
				var post = {};
				post['categ_id'] = parseInt(grade);
				ajax.jsonRpc('/grades-subjects/content', 'call', post).then(function (modal) { 
					$('#grade_subjects').html(modal);
					var sub_title = $('#sub_title').text();
					$('#post_title').text(sub_title);
					$('#post_title_img').attr('src','/skit_slide/static/src/img/subject.png');
					breadcurmb_action();
					subject_action();
				});
			}else{
				$('#grade_subjects').addClass("grade_display_none");
				$('#grade_topics').addClass("grade_display_none");
				$('#grade_topics_details').addClass("grade_display_none");
			}
		});
	}
	/** End Grade onChange */
	
	/** Start breadcurmb click action */
	function breadcurmb_action(){
		$('#root_grade, #root_topic, #root_topic_detail').off().on('click', function(){
			$('.grade_header_div').removeClass("grade_display_none");
			$('#grade').val("0");
			$('#grade_subjects').addClass("grade_display_none");
			$('#grade_topics').addClass("grade_display_none");
			$('#grade_topics_details').addClass("grade_display_none");
			$('#post_title').text('Grades');
			$('#post_title_img').attr('src','/skit_slide/static/src/img/grade.png');
			$(this).blur();
		    return false;
		});
		$('#root_subject, #root_subject_detail').off().on('click', function(){
			$('#grade_topics_details').addClass("grade_display_none");
			$('#grade_topics').addClass("grade_display_none");
			$('#grade_subjects').removeClass("grade_display_none");
			var sub_title = $('#sub_title').text();
			$('#post_title').text(sub_title);
			$('#post_title_img').attr('src','/skit_slide/static/src/img/subject.png');
			$(this).blur();
		    return false;
		});
		$('#document_topic').off().on('click', function(){
			$('#grade_topics_details').addClass("grade_display_none");
			$('#grade_subjects').addClass("grade_display_none");
			$('#grade_topics').removeClass("grade_display_none");
			$('#post_title').text('Topics');
			$('#post_title_img').attr('src','/skit_slide/static/src/img/topic.png');
			$(this).blur();
		    return false;
		});
		
	}
	/** End breadcurmb click action */
	
	/** Start subject action */
	function subject_action(){
		$('.subject-list').off().on('click', function(){
			var id = $(this).attr('id');
			var post = {};
			post['channel_id'] = parseInt(id);
			ajax.jsonRpc('/grades-subjects/topics', 'call', post).then(function (modal) { 
				$('#grade_subjects').addClass("grade_display_none");
				$('#grade_topics').html(modal);
				$('#grade_topics').removeClass("grade_display_none");
				$('#post_title').text('Topics');
				$('#post_title_img').attr('src','/skit_slide/static/src/img/topic.png');
				breadcurmb_action();
				horizontal_tab();
				document_action();
			});
		});
	}
	
	/** End subject action */
	
	/** Start Topics horizontal tab action */
	function horizontal_tab(){
		$('.grade-tab-nav span').off().on('click', function() {
			  $([$(this).parent()[0], $($(this).data('href'))[0]]).addClass('active').siblings('.active').removeClass('active');
		});
	}
	/** End Topics horizontal tab action */
	
	/** Start document Action */
	function document_action(){
		$('.document_view').off().on('click', function(){
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
			var question_id = $('#question_id').text();
			var total_question = parseInt($('#total_question').text());
			var question_no = parseInt($('#question_no').text());
			var slide_id = $('#slide_question_id').text();
			var current_question_no = (question_no) + 1;
			if(question_no >= 1){
				$('#next_quiz').css({'margin-left': '1%'});
				$('#previous_quiz').removeClass("grade_display_none");
			}
			if(current_question_no >= total_question){
				$('#next_quiz').addClass("grade_display_none");
				$('#previous_quiz').removeClass("grade_display_none");
				$('#submit_quiz').removeClass("grade_display_none");
			}
			
			var selected_option = []
			$('input:checked').each(function(){
				selected_option.push(parseInt($(this).val()));
			});
			$('#question_no').text(current_question_no);
			var post = {};
			post['question_no'] = current_question_no;
			post['slide_id'] = slide_id;
			post['type'] = 'next';
			post['question_id'] = question_id;
			post['selected_option'] = selected_option;
			ajax.jsonRpc('/grades-subjects/topic/quiz', 'call', post).then(function (modal) { 
				$('#question_tag').html(modal);
				breadcurmb_action();
				horizontal_tab();
				document_action();
				show_questions();
			});
			
		});
		$('#previous_quiz').off().on('click', function(e){
			var question_id = $('#question_id').text();
			var total_question = parseInt($('#total_question').text());
			var question_no = parseInt($('#question_no').text());
			var slide_id = $('#slide_question_id').text();
			var current_question_no = (question_no) - 1;
			if(question_no <= total_question){
				$('#submit_quiz').addClass("grade_display_none");
				$('#next_quiz').removeClass("grade_display_none");
			}
			if(current_question_no <= 1){
				$('#next_quiz').css({'margin-left': '45%'})
				$('#next_quiz').removeClass("grade_display_none");
				$('#previous_quiz').addClass("grade_display_none");
				$('#submit_quiz').addClass("grade_display_none");
			}
			var selected_option = []
			$('input:checked').each(function(){
				selected_option.push(parseInt($(this).val()));
			});
			$('#question_no').text(current_question_no);
			var post = {};
			post['question_no'] = current_question_no;
			post['slide_id'] = slide_id;
			post['type'] = 'previous';
			post['question_id'] = question_id;
			post['selected_option'] = selected_option;
			ajax.jsonRpc('/grades-subjects/topic/quiz', 'call', post).then(function (modal) { 
				$('#question_tag').html(modal);
				breadcurmb_action();
				horizontal_tab();
				document_action();
				show_questions();
			});
			
		});
		
		$('#submit_quiz').off().on('click', function(){
			var slide_id = $('#slide_question_id').text();
			var question_id = $('#question_id').text();
			var selected_option = []
			$('input:checked').each(function(){
				selected_option.push(parseInt($(this).val()));
			});
			var post = {};
			post['slide_id'] = slide_id;
			post['question_id'] = question_id;
			post['selected_option'] = selected_option;
			ajax.jsonRpc('/grades-subjects/quiz/result', 'call', post).then(function (modal) { 
				$('#question_tag').html(modal);
				$('#submit_quiz').addClass("grade_display_none");
				$('#previous_quiz').addClass("grade_display_none");
				var total_question = parseInt($('#total_question').text());
				var correct_answer = parseInt($('#correct_answer').text());
				var not_attempt = parseInt($('#not_attempt').text());
				var wrong = ((total_question) - ((correct_answer) + (not_attempt)))
				pie_chart(correct_answer, wrong, not_attempt);
				breadcurmb_action();
				horizontal_tab();
				document_action();
				show_questions();
				
				
			});
		});
	}
	
	/** End show next question */
	
	/** Start Pie Chart for quiz result */
	function pie_chart(correct_answer, wrong, not_attempt){
		$('#progress_chart').html("<div id='container_progress_chart' data-oe-model='ir.ui.view' data-oe-id='1022' data-oe-field='arch' data-oe-xpath='/t[1]/div[1]'></div>");
		Highcharts.setOptions({
		     colors: ['#edbf47', '#e16c6c', '#74cee4']
		    });
		Highcharts.chart('container_progress_chart', {
			  chart: {
			    plotBackgroundColor: null,
			    plotBorderWidth: null,
			    plotShadow: false,
			    type: 'pie'
			  },
			  title: {
			    text: 'Score'
			  },
			  tooltip: {
			    pointFormat: '{series.name}: <b>{point.y}</b>'
			  },
			  plotOptions: {
			    pie: {
			      allowPointSelect: true,
			      cursor: 'pointer',
			      dataLabels: {
			        enabled: false,
			        format: '<b>{point.name}</b>: {point.percentage:.1f}'
			      },
			      showInLegend: true
			    }
			  },
			  exporting: {
				    enabled: false
			  },
			  series: [{
			    name: 'Questions',
			    colorByPoint: true,
			    data: [{
				      name: 'Correct Answers',
				      y: correct_answer,
				     
				    }, {
				      name: 'Wrong Answers',
				      y: wrong
				    }, 
				    {
					  name: 'Not Attempted',
					  y: not_attempt
					}, 
			    ]
			  }]
			});
	}
	/** End Pie Chart for quiz result */
	
	/** Start add parent action */
	function add_parent_action(user_partner_id){
		/* add parent */
		var user_partner_id = user_partner_id;
		$('#add-parent-card').on('click', function(){
			var post = {};
			var $form = $('.parent_details_view');
			post['user_partner_id'] = user_partner_id;
			if(user_partner_id){
				ajax.jsonRpc('/create_parent/details', 'call', post).then(function (modal) { 
					var $modal = $(modal);			
	      		    $modal.appendTo($form).modal();	
				});
			}
		});
	}
	
	/** End add parent action */
});