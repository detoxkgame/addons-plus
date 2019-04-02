odoo.define('skit_snippets.work_scroll', function(require) {
	
var ajax = require('web.ajax');
$(document).ready(function() {
	/** Scroll change image and content */
	$(document).on("scroll", function(){
		var $height = $(window).scrollTop();
		var add_sticky = $(".work_section").offset();
		var add_bottom = $('.sitemap_section').offset();
		/**  To sticky section3 */	
		if(add_sticky){
			if($height > (add_sticky.top)) {
				$(".work__sticky-wrapper").addClass("-is-sticky");
			} 
			else {
				$(".work__sticky-wrapper").removeClass("-is-sticky");
			}
		}
		/**  To sticky section3 end*/	
		
		/**  To remove sticky class */	
		if(add_bottom){
			if($height >= (add_bottom.top)-500) {
			//if($(window).scrollTop() + $(window).height() > $(document).height()-100){
				$(".work__sticky-wrapper").removeClass("-is-sticky").addClass("-is-bottom");
			} 
			else {
				$(".work__sticky-wrapper").removeClass("-is-bottom");
			}
		}
		/** Change related work and progress */
		if($(window).scrollTop() + $(window).height() > $(document).height()-500){
			/*Display LGA content*/
			$('#lga-apps-img').addClass('-visible');
			$('#lga-apps').removeClass('work__project--hidden').addClass('work__project--visible');
			$('#viacrm-apps-img').removeClass('-visible');
			$('#viacrm-apps').removeClass('work__project--visible').addClass('work__project--hidden');
			$('#tccl-apps-img').removeClass('-visible');
			$('#tccl-apps').removeClass('work__project--visible').addClass('work__project--hidden');
			$('#fleetmaster-apps-img').removeClass('-visible');
			$('#fleet_master-apps').removeClass('work__project--visible').addClass('work__project--hidden');
		}
		else if($(window).scrollTop() + $(window).height() > $(document).height()-1200){
			/*Display Fleet Master content*/
			$('#fleetmaster-apps-img').addClass('-visible');
			$('#fleet_master-apps').removeClass('work__project--hidden').addClass('work__project--visible');
			$('#lga-apps-img').removeClass('-visible');
			$('#lga-apps').removeClass('work__project--visible').addClass('work__project--hidden');
			$('#viacrm-apps-img').removeClass('-visible');
			$('#viacrm-apps').removeClass('work__project--visible').addClass('work__project--hidden');
			$('#tccl-apps-img').removeClass('-visible');
			$('#tccl-apps').removeClass('work__project--visible').addClass('work__project--hidden');
		}
		else if($(window).scrollTop() + $(window).height() > $(document).height()-1750){
			/*Display ViaCrm content*/	
			$('#viacrm-apps-img').addClass('-visible');
			$('#viacrm-apps').removeClass('work__project--hidden').addClass('work__project--visible');
			$('#lga-apps-img').removeClass('-visible');
			$('#lga-apps').removeClass('work__project--visible').addClass('work__project--hidden');
			$('#fleetmaster-apps-img').removeClass('-visible');
			$('#fleet_master-apps').removeClass('work__project--visible').addClass('work__project--hidden');
			$('#tccl-apps-img').removeClass('-visible');
			$('#tccl-apps').removeClass('work__project--visible').addClass('work__project--hidden');
		}
		else
		{			
			/*Display TCCL content*/
			if($('#tccl-apps').hasClass('work__project--hidden')){
				$('#tccl-apps-img').addClass('-visible');
				$('#tccl-apps').removeClass('work__project--hidden').addClass('work__project--visible');
				$('#viacrm-apps-img').removeClass('-visible');
				$('#viacrm-apps').removeClass('work__project--visible').addClass('work__project--hidden');
				//$('#lga-apps').removeClass('work__project--visible').addClass('work__project--hidden');
				//$('#tccl-apps').removeClass('work__project--visible').addClass('work__project--hidden');
			}
		}
		/*Call progress change function*/
		ChangeProgress();
		/*Call image animate function*/
		ImageAnimate();
		
	});
	function ChangeProgress() {
		/**  Progress changes */	
		if($('#tccl-apps').hasClass('work__project--visible')){
			$('.process_active_dot').css({'transform':'matrix(1, 0, 0, 1, 0, 30)'});
			$('.process_dot_dash').css({'transform':'matrix(1, 0, 0, 0.5, 0, 30)'});
		}
		if($('#viacrm-apps').hasClass('work__project--visible')){
			$('.process_active_dot').css({'transform':'matrix(1, 0, 0, 1, 0, 86)'});
			$('.process_dot_dash').css({'transform':'matrix(1, 0, 0, 0.5, 0, 86)'});
		}
		if($('#fleet_master-apps').hasClass('work__project--visible')){
			$('.process_active_dot').css({'transform':'matrix(1, 0, 0, 1, 0, 143)'});
			$('.process_dot_dash').css({'transform':'matrix(1, 0, 0, 0.5, 0, 143)'});
		}
		if($('#lga-apps').hasClass('work__project--visible')){
			$('.process_active_dot').css({'transform':'matrix(1, 0, 0, 1, 0, 200)'});
			$('.process_dot_dash').css({'transform':'matrix(1, 0, 0, 0.5, 0, 200)'});
		}
		/** End Progress changes */	
    }
	function ImageAnimate() {
		/** Image Animate*/
		// Tccl
		if($('#tccl-apps-img').hasClass('-visible')){
			$('#tccl-apps-img').css({'transform': 'skewX(0deg)','transition-duration': '2s'});
		}
		else{
			$('#tccl-apps-img').css({'transform': 'skewX(-4deg)','transition-duration': '1s'});
		}
		//Via Crm
		if($('#viacrm-apps-img').hasClass('-visible')){
			$('#viacrm-apps-img').css({'transform': 'skewX(0deg)','transition-duration': '2s'});
		}
		else{
			$('#viacrm-apps-img').css({'transform': 'skewX(-4deg)','transition-duration': '1s'});
		}
		//Fleet Master
		if($('#fleetmaster-apps-img').hasClass('-visible')){
			$('#fleetmaster-apps-img').css({'transform': 'skewX(0deg)','transition-duration': '2s'});
		}
		else{
			$('#fleetmaster-apps-img').css({'transform': 'skewX(-4deg)','transition-duration': '1s'});
		}
		//LGA
		if($('#lga-apps-img').hasClass('-visible')){
			$('#lga-apps-img').css({'transform': 'skewX(0deg)','transition-duration': '2s'});
		}
		else{
			$('#lga-apps-img').css({'transform': 'skewX(-4deg)','transition-duration': '1s'});
		}
		/** End */
    }
	/** Focus image while click progress*/
	$("#tccl_focus").click(function() {
		/*On focus tccl image*/
		document.getElementById("tccl-apps-img").focus();
		$('html, body').stop().animate({
	        scrollTop: $('#tccl-apps-img').offset().top-200
	    }, 'fast');
	});
	$("#viacrm_focus").click(function() {
		/*On focus via_crm image*/
		document.getElementById("viacrm-apps-img").focus();
		$('html, body').stop().animate({
            scrollTop: $('#viacrm-apps-img').offset().top-200
        }, 'fast');
	});
	$("#fleetmaster_focus").click(function() {
		/*On focus Fleet master image*/		
		document.getElementById("fleetmaster-apps-img").focus();
		$('html, body').stop().animate({
            scrollTop: $('#fleetmaster-apps-img').offset().top-110
        }, 'fast');
	});
	$("#lga_focus").click(function() {
		/*On focus LGA image*/		
		document.getElementById("lga-apps-img").focus();
		$('html, body').stop().animate({
            scrollTop: $('#lga-apps-img').offset().top-130
        }, 'fast');
	});
	
	//Navigate url
	// this should be the Ajax Method.
	// and load the url content
	/*var setCurrentPage = function(url) {
		console.log('test 1'+url);
	    $("#tccl-apps a[href='" + url + "']").fadeTo(500, 0.3);
	};

	$('#tccl-apps a').click(function(e){
	    e.preventDefault();
	    var targetUrl = $(this).attr('href'),
	        targetTitle = $(this).attr('title');
	    console.log('targetUrl 1'+targetUrl+' targetTitle '+targetTitle);
	    $("#tccl-apps a[href='" + window.location.pathname + "']").fadeTo(500, 1.0);
	    
	    window.history.pushState({url: "" + targetUrl + ""}, targetTitle, targetUrl);
	    setCurrentPage(targetUrl);
	});

	window.onpopstate = function(e) {
		//alert('test link popstate');
	    $("#tccl-apps a").fadeTo('fast', 1.0);
	    console.log('e.state.url '+e.state.url);
	    setCurrentPage(e.state ? e.state.url : null);
	};*/

	/*$('.tccl_study').click(function(){
		ChangeUrl('TCCL', '/case-study/tccl-services');
	});
	$('.viacrm_study').click(function(){
		ChangeUrl('ViaCRM', '/case-study/viacrm-services');
	});
	$('.lga_study').click(function(){
		ChangeUrl('LGA', '/case-study/lga-services');
	});
	function ChangeUrl(page, url) {
		console.log('page '+page);
		console.log('url '+url);
        if (typeof (history.pushState) != "undefined") {
            var obj = { Page: page, Url: url };
            history.pushState(obj, obj.Page, obj.Url);
        } else {
            alert("Browser does not support HTML5.");
        }
    }*/
	/*$('.tccl_study').click(function(){
		
		//ChangeUrl('TCCL', '/case-study/tccl-services');
		var url = '/case-study/tccl-services',
	    holder = document.getElementById('iframe-holder'),
	    frame = holder.getElementsByTagName('iframe')[0];
		
		frame.style.display = "block";
		frame.src = url;
	});*/
	
});
});
