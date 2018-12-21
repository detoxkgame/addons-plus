odoo.define('skit_hotel_management.pos_screen', function (require) {
"use strict";

var chrome = require('point_of_sale.chrome');
var gui = require('point_of_sale.gui');
var screens = require('point_of_sale.screens');
var PopupWidget = require('point_of_sale.popups');
var FirstScreenWidget = screens.ScreenWidget.extend({
    template: 'POSFirstPageWidget',
    events: _.extend({}, PopupWidget.prototype.events, {	        
        'click .hotel': 'show_hotel',	
        'click .checkin': 'show_checkin',
        'click .show_productscreen': 'show_productscreen',
        'click .night_audit': 'show_night_audit',
       
    }),
    show_night_audit:function(){
       	// this.gui.show_screen('products');
        	$('.session').trigger("click");
    	//$('.night_audit').trigger("click");
       },   
    show_productscreen:function(){
   	// this.gui.show_screen('products');
    	$('.rooomstatus').trigger("click");
   },
    show_hotel:function(){
    	 this.gui.show_screen('vendor_dashboard');
    },
    /*show_checkin:function(){
    	// this.gui.show_screen('kpireport');
    	$('.rooomstatus').trigger("click");
    },*/
    
    show_checkin:function(){
    	// this.gui.show_screen('kpireport');
    	$('.kpi-report-button').trigger("click");
    },
    init: function(parent, options) {
        this._super(parent, options);
        this.editing = false;
      
    },	
    
    hide: function(){
        this._super();
        if (this.editing) {
            this.toggle_editing();
        }
        
        //this.chrome.widget.order_selector.show();
    },
    show: function(){
        this._super();
        this.chrome.widget.order_selector.hide();
       
    },
    renderElement: function(){
        var self = this;
        this._super();    

    

    },

});

gui.define_screen({
    'name': 'firstpage',
    'widget': FirstScreenWidget,
    
    
});
chrome.OrderSelectorWidget.include({
	   
    hide: function(){
        this.$el.addClass('oe_invisible');
    },
    show: function(){
        this.$el.removeClass('oe_invisible');
    },
    
});
// Add the FloorScreen to the GUI, and set it as the default screen
chrome.Chrome.include({
    build_widgets: function(){
        this._super();
        this.gui.set_startup_screen('firstpage');
        this.gui.set_default_screen('firstpage');
       
    },
    
});
});