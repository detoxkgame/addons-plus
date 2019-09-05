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
	var chrome = require('point_of_sale.chrome');

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
	
	chrome.OrderSelectorWidget.include({
	    template: 'OrderSelectorWidget',
	    init: function(parent, options) {
	        this._super(parent, options);
	    }, 
	    renderElement: function(){
	    	var self = this;
	        this._super();
	        this.$('.order-button.select-order').click(function(event){
	            $(".pos .pos-rightheader .orders").css({'display':'inline-flex'});
	        });
	        this.$('.neworder-button').click(function(event){
	            $(".pos .pos-rightheader .orders").css({'display':'inline-flex'});
	        });
	        this.$('.deleteorder-button').click(function(event){
	            $(".pos .pos-rightheader .orders").css({'display':'inline-flex'});
	        });
	        /** showorders Button click **/
	        this.$('.show_ordersbtn').click(function(event){
	        	$(".pos .pos-rightheader .orders").slideToggle("slow");
	        	$(".pos .pos-rightheader .orders").css({'display':'inline-flex'});
	        });
	    },
	});
	
});
