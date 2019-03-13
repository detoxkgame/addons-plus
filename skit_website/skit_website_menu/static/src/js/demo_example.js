odoo.define('skit_website_menu.demo_example', function (require) {
	$(document).ready(function(){
		$('.hamburgler').click(function(e){
			e.preventDefault();
			$(this).toggleClass('no-hamburgler');
			if($(this).hasClass("no-hamburgler")){
				document.getElementById("sks_topmenu_myNav").style.height = "100%";
				document.getElementById("sks_topmenu_myNav").style.width = "100%";
				$(".contact-forms__open-contact").css({"display":"none"});
				$(".scroll_icon").css({"display":"none"});
				$(".bun").css({"background":"#fff"});
				$(".meat").css({"background":"#fff"});
			}
			else {
				document.getElementById("sks_topmenu_myNav").style.height = "0%";
				document.getElementById("sks_topmenu_myNav").style.width = "0%";
				$(".contact-forms__open-contact").css({"display":"block"});
				$(".scroll_icon").css({"display":"block"});
				$(".bun").css({"background":"#000"});
				$(".meat").css({"background":"#000"});
			}
		});
		
	});
});