odoo.define('skit_pos_restaurant.pos_screen', function (require) {
"use strict";

var chrome = require('point_of_sale.chrome');
var gui = require('point_of_sale.gui');
var screens = require('point_of_sale.screens');
var PopupWidget = require('point_of_sale.popups');
var core = require('web.core');

var QWeb = core.qweb;
var _t = core._t;

chrome.OrderSelectorWidget.include({
	   
    hide: function(){
        this.$el.addClass('oe_invisible');
    },
    show: function(){
        this.$el.removeClass('oe_invisible');
    },
    
    /*renderElement: function(){
        var self = this;
        this._super();
        if (this.pos.config.iface_floorplan && !this.pos.config.is_kitchen) {
            if (this.pos.get_order()) {
                if (this.pos.table && this.pos.table.floor) {
                	if(this.$('.floor-button').length <= 0){
                		console.log('Floor'+this.$('.floor-button').length)
                		this.$('.orders').prepend(QWeb.render('BackToFloorButton',{table: this.pos.table, floor:this.pos.table.floor}));
                        this.$('.floor-button').click(function(){
                            self.floor_button_click_handler();
                        });
                	}

                }
                this.$el.removeClass('oe_invisible');
            } else {
                this.$el.addClass('oe_invisible');
            }
        }
    },*/
    
});
// Add the FloorScreen to the GUI, and set it as the default screen
chrome.Chrome.include({
    build_widgets: function(){
        this._super();
        if (this.pos.config.iface_floorplan && !this.pos.config.is_kitchen) {
            this.gui.set_startup_screen('floors');
        }
        else {
        	this.gui.set_startup_screen('products');
        }
    },
    
});
});