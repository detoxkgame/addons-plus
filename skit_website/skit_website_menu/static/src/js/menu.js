odoo.define('skit_website_menu.menu', function(require) {
	'use strict';
	
	var dom = require('web.dom');
	var sAnimation = require('website.content.snippets.animation');
	
	var FixedMenu = require('website.content.menu');

	FixedMenu.sAnimation.registry.affixMenu.include({
		_onWindowUpdate : function() {
			alert('hai');
			var wOffset = $(window).scrollTop();
			var hOffset = this.$target.scrollTop();
			this.$headerClone
					.toggleClass('affixeds', wOffset > (hOffset + 300));

			// Reset opened menus
			this.$dropdowns.removeClass('show');
			this.$navbarCollapses.removeClass('show').attr('aria-expanded',
					false);
		},
	});
});