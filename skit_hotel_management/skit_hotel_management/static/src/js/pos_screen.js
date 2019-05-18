odoo.define('skit_hotel_management.pos_screen', function (require) {
"use strict";

var chrome = require('point_of_sale.chrome');
var gui = require('point_of_sale.gui');
var screens = require('point_of_sale.screens');
var PopupWidget = require('point_of_sale.popups');
var FirstScreenWidget = screens.ScreenWidget.extend({
    template: 'POSFirstPageWidget',
    events: _.extend({}, PopupWidget.prototype.events, {	        
       /* 'click .hotel': 'show_hotel',	
        'click .checkin': 'show_checkin',
        'click .checkout': 'show_checkout',
        'click .roomstatus': 'show_roomstatus',
        'click .night_audit': 'show_night_audit',
        'click .reservation': 'show_reservationscreen',*/
    	'click .hm-restaurent': 'show_restaurent',
    	'click .hm-reservation': 'show_reservation',
    	'click .hm-vendor-selection': 'show_vendor_selection',
    	'click .hm-night-audit': 'show_night_audit',
    	'click .hm-checkin': 'show_checkin',
    	'click .hm-reports': 'show_reports',
    	'click .hm-room-status': 'show_room_status',
       
    }),
    show_restaurent:function(){
    	var self = this;
    },
    
    show_reservation:function(){
    	var self = this;
    	self.get_sub_id("room_reservation");
    },
    
    show_vendor_selection:function(){
    	var self = this;
    	this.gui.show_screen('vendor_dashboard');
    },
    
    show_night_audit:function(){
    	var self = this;
    	self.get_sub_id("night_audit");
    },
    
    show_checkin:function(){
    	var self = this;
    	self.get_sub_id("search_view");
    },
    
    show_reports:function(){
    	var self = this;
    },
    
    show_room_status:function(){
    	var self = this;
    	self.get_sub_id("room_status_report");
    },
    
    get_sub_id: function(form_view){
    	var self = this;
    	var subidno = null;
    	self._rpc({
			model: 'hm.form.template',
			method: 'get_sub_ids',
			args: [0, form_view],
		}).then(function(result){
			subidno = result;
			self.gui.show_screen('room_reservation', {subidno:subidno});
		});
    },
   /* show_reservationscreen:function(){
    	var self = this;
    	self.pos.gui.show_screen('reservation2');
    },
    
    show_night_audit:function(){
        $('.night_audit_session').trigger("click");
       },   
    show_roomstatus:function(){
    	//$('.rooomstatus').trigger("click");
    	 this.gui.show_screen('room_reservation');
   },
    show_hotel:function(){
    	 this.gui.show_screen('vendor_dashboard');
    },
    
    show_checkin:function(){
    	$('.kpi-report-button').trigger("click");
    },
    show_checkout:function(){
    	this.gui.show_screen('vendor_payment');
    },*/
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
    get_widget_style: function() {
        var style = "";
        var imageurl =  window.location.origin + '/web/image?model=pos.config&field=image&id='+1;
            style += "background-image: url(" + imageurl + "); ";
            style += "background-image:no-repeat; ";
            style += "background-size: cover; ";
            style += " background-position: center; ";
            style += " height: 100%; ";
           
        return style;
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
        if(this.pos.config.is_room || this.pos.config.module_pos_restaurant){
        	this.gui.set_startup_screen('products');
            this.gui.set_default_screen('products');
        }
        else{
        	this.gui.set_startup_screen('firstpage');
            this.gui.set_default_screen('firstpage');
        }
    },
    
});
});