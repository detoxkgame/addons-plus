odoo.define('skit_pos_responsive.skit_responsive',function(require){
    "use strict";
	var models = require('point_of_sale.models');
	var screens = require('point_of_sale.screens');
	var NumpadWidget = screens.NumpadWidget;
	var gui = require('point_of_sale.gui');
	var core = require('web.core');
	var _t  = core._t;
	var QWeb = core.qweb;
	var ClientListScreenWidget = screens.ClientListScreenWidget;
	var ActionpadWidget = screens.ActionpadWidget;
	var ProductScreenWidget = screens.ProductScreenWidget;

	var _super_posmodel = models.PosModel.prototype;
	
	ActionpadWidget.include({	
	    template: 'ActionpadWidget',
	    renderElement: function() {
	        var self = this;
	        this._super();
	        this.$('.show_numpad').click(function(){
	        	$(".pos .leftpane .numpad").slideToggle("slow");
	        	$(".pos .control-buttons").slideToggle("slow");
	        });
	      }
	});
	
});
