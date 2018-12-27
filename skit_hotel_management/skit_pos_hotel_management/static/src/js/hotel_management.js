odoo.define('skit_hotel_management.hotel_management', function (require) {
"use strict";
var PosBaseWidget = require('point_of_sale.BaseWidget');
var chrome = require('point_of_sale.chrome');
var gui = require('point_of_sale.gui');
var models = require('point_of_sale.models');
var screens = require('point_of_sale.screens');
var core = require('web.core');
var rpc = require('web.rpc');
var vendor_dashboard = require('skit_hotel_management.vendor_dashboard');

var QWeb = core.qweb;
var _t = core._t;

var HotelManagementWidget = PosBaseWidget.extend({
    template:'HotelManagementWidget',
    init: function(parent, options) {
        var self = this;
        this._super(parent,options);
    },
});

var HotelManagementScreenWidget = screens.ScreenWidget.extend({
    template: 'HotelManagementScreenWidget',
    init: function(parent, options){
        this._super(parent, options);
       
    },
    hide: function(){
        this._super();
       
        this.chrome.widget.order_selector.show();
    },
    show: function(){
        this._super();
        var self = this;
        this.chrome.widget.order_selector.hide();
        
       /* this.$('.vendor-dash-button').click(function(){
            alert('test');
            self.gui.show_screen('vendor_dashboard');
        });*/
        
    },
   
  
});
gui.define_screen({name:'hotel', widget: HotelManagementScreenWidget});

//Add the HotelManagement to the GUI, and set it as the default screen
/*chrome.Chrome.include({
    build_widgets: function(){
     //   this._super();
     //   this.gui.set_startup_screen('vendor_dashboard');
       // this.gui.set_default_screen('vendor_dashboard');
       // this.gui.set_default_screen('hotel');
        if (this.pos.config.iface_hotel) {
        	alert('test123')
            this.gui.set_startup_screen('hotel');
        }
    },
	
});*/

//Hide the OrderSelectorWidget
chrome.OrderSelectorWidget.include({
   
    hide: function(){
        this.$el.addClass('oe_invisible');
    },
    show: function(){
        this.$el.removeClass('oe_invisible');
    },
    
});

return {
	HotelManagementScreenWidget: HotelManagementScreenWidget,
	HotelManagementWidget: HotelManagementWidget,
};
});
