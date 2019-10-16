odoo.define('skit_slide.progress_chart_dashboard', function(require) {
	'use strict';
	var ajax = require('web.ajax');

	$(document).ready(function(){
		progress_dashboard_action();
		$('.progress_dashboard').on('click', function(){
			progress_dashboard_action();
			$('.progress_dashboard').addClass("button_active");
		});
	
	});
	
	function progress_dashboard_action(){
		$('#post_title').text('Progress');
		$('#post_title_img').attr('src','/skit_slide/static/src/img/progress.png');
		ajax.jsonRpc('/grades-subjects/progress_chart_dashboard', 'call').then(function (modal) { 
			$('#user_role_div').html(modal);
			ajax.jsonRpc('/grades-subjects/progress_report_info', 'call').then(function (progress_report_info) { 
			
				$('#marks_chart').html("<div id='container' data-oe-model='ir.ui.view' data-oe-id='1022' data-oe-field='arch' data-oe-xpath='/t[1]/div[1]'></div>");
				$('#exam_chart').html("<div id='container_line_chart' data-oe-model='ir.ui.view' data-oe-id='1022' data-oe-field='arch' data-oe-xpath='/t[1]/div[1]'></div>");
					
				Highcharts.chart('container_line_chart', {
					chart: {
						type: 'line',
						width: 490,
						height: 350,
					   
					},
						
					title: {
						text: 'Duration Spent Report'   
					},
					
					credits: {
						enabled: false
					},
						    
					xAxis: {
						categories: progress_report_info['subjects']
					},
	
					yAxis: {
						title: {
							text: 'Duration',
						},
					},
						    
					series: [{
						name: 'Time Spent',
						data: progress_report_info['complete_duration_time']
					}, 
				               
					{
						name: 'Time Estimated',
						data: progress_report_info['complete_completion_time']
					},] 
					
				});
						
						
				Highcharts.chart('container', {
					chart: {
						type: 'column',
						width: 490,
						height: 350
					},
						
					title: {
						text: 'Progress Report'   
					},
					
					credits: {
						enabled: false
					},
						    
					xAxis: {
						categories: progress_report_info['subjects'],
						  
					},
						            
					yAxis: {
						title: {
							text: 'Marks',
						},
					},
					
					plotOptions: {
						column: {
							pointPadding: 0.2,
							maxPointWidth: 20
						}
					},
						
					series: [{
						name: 'Total Marks Earned',
						data: progress_report_info['total_points']
					}, ]
					
				});
			});
		});
	
	}
	
});