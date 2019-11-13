odoo.define('skit_pos_restaurant.kitchen_view', function (require) {
"use strict";
var PosBaseWidget = require('point_of_sale.BaseWidget');
var chrome = require('point_of_sale.chrome');
var gui = require('point_of_sale.gui');
var models = require('point_of_sale.models');
var screens = require('point_of_sale.screens');
var core = require('web.core');
var rpc = require('web.rpc');
var ActionpadWidget = screens.ActionpadWidget;
var NumpadWidget = screens.NumpadWidget;
var base_models = require('pos_restaurant_base.models');
var floors = require('pos_restaurant.floors');

var QWeb = core.qweb;
var _t = core._t;

/** Extend TableWidget */
floors.TableWidget.include({
	renderElement: function(){
		console.log('Floor Table Render')
		this.waiter_status = this.pos.get_waiter_status(this.table).length;
		this._super();
	}
});

/** Extend the pos model for kitchen view */
var _super_posmodel = models.PosModel.prototype;
models.PosModel = models.PosModel.extend({
	  
    set_start_order: function(){
    	if (!this.config.iface_floorplan) {
	        var orders = this.get('orders').models;
	
	        if (orders.length && !this.get('selectedOrder')) {
	            this.set('selectedOrder',orders[0]);
	        } else {
	            this.add_new_order();
	        }
    	}else{
    		if (this.config.is_kitchen) {
    			var orders = this.get('orders').models;
    			
    	        if (orders.length && !this.get('selectedOrder')) {
    	            this.set('selectedOrder',orders[0]);
    	        } else {
    	            this.add_new_order();
    	        }
    		}
    	}
    },

	
	get_order_list: function() {
        var orders = this.get('orders').models;
        if (!this.config.iface_floorplan) {
            return orders;
        } else if (!this.table && !this.config.is_kitchen) {
            return [];
        } else {
        	if(this.config.is_kitchen){
        		return orders;
        	}else{
	            var t_orders = [];
	            for (var i = 0; i < orders.length; i++) {
	                if ( orders[i].table === this.table) {
	                    t_orders.push(orders[i]);
	                }
	            }
	            return t_orders;
        	}
        }
    },
    
    get_waiter_status: function(table) {
    	var orders = this.get_table_orders(table);
        var t_orders = [];
        for (var i = 0; i < orders.length; i++) {
            if (orders[i].table === table) {
            	var orderlines = orders[i].get_orderlines();
            	for(var j = 0, len = orderlines.length; j < len; j++){
	            	if(orderlines[j].get_kitchen_state() == 'ready'){
	            		t_orders.push(orders[i]);
	            	}
            	}
            }
        }
        return t_orders;
    },
	
});


/** Extend the pos restaurant base model for kitchen view */
var PosModelSuper = base_models.PosModel;
base_models.PosModel = base_models.PosModel.extend({
	 ms_update_existing_order: function(order, data) {
         
		 PosModelSuper.prototype.ms_update_existing_order.apply(this, arguments);
		 if(this.config.is_kitchen){
	         var orders = this.get_order_list();
	         for (var i = 0; i < orders.length; i++) {
	        	 var order = orders[i];
			     if (order && i > 0) {
			    	 var orderlines = order.get_orderlines();
			         if(orderlines.length > 0){
			        	 this.set_order(order);
			         }
			    	 
			     }
		     }
	         if(orders.length > 0){
	        	 this.set_order(orders[0]);
	         }
		 }
     },
});

/** Extend the order widget for kitchen view (click handler, render element) */
screens.OrderWidget.include({
	init: function(parent, options) {
	     var self = this;
	     this._super(parent,options);
	     
	     this.line_click_handler = function(event){
	    	
	         self.click_line(this.orderline, event);
	    };
	},
	
	 renderElement: function(scrollbottom){
	    	if(this.pos.config.is_kitchen){
	    		var order  = this.pos.get_order();
	            if (!order) {
	                return;
	            }
	            var orderlines = order.get_orderlines();

	            var el_str  = QWeb.render('OrderWidget',{widget:this, order:order, orderlines:orderlines});

	            var el_node = document.createElement('div');
	                el_node.innerHTML = _.str.trim(el_str);
	                el_node = el_node.childNodes[0];


	            
	            var orders = this.pos.get_order_list();
	            for (var j = 0; j < orders.length; j++) {
	            	var list_container = el_node.querySelector('.orderlines'+orders[j].uid);
	            	var order = orders[j]

		            var orderlines = order.get_orderlines();
		            if(orderlines.length <= 0){
		            	if(el_node.querySelector('.orderlines'+orders[j].uid) != null){
		            		el_node.querySelector('.orderlines'+orders[j].uid).remove();
		            	}
		            }
		            var is_categ_order = false;
		            for(var i = 0, len = orderlines.length; i < len; i++){
		            	var pos_categ_id = orderlines[i].get_product().pos_categ_id[0];
		            	var pos_categ_ids = this.pos.config.pos_categ_ids

		            	if ($.inArray(pos_categ_id, pos_categ_ids) > -1) {
		            		if(orderlines[i].get_kitchen_state() != 'delivered'){
		            			is_categ_order = true;
			            		var orderline = this.render_orderline(orderlines[i]);
					            if(list_container != null){
					            	list_container.appendChild(orderline);
					            }
			            		
			            	}
		                }
		              
		            }
		            if(!is_categ_order){
		            	if(el_node.querySelector('.orderlines'+orders[j].uid) != null){
		            		el_node.querySelector('.orderlines'+orders[j].uid).remove();
		            	}
		            }
		            
	            }

	            if(this.el && this.el.parentNode){
	                this.el.parentNode.replaceChild(el_node,this.el);
	            }
	            this.el = el_node;
	            this.update_summary();
	            if(scrollbottom){
	                this.el.querySelector('.order-scroller').scrollTop = 100 * orderlines.length;
	            }
	    	}else{
	        var order  = this.pos.get_order();
	        if (!order) {
	            return;
	        }
	        var orderlines = order.get_orderlines();

	        var el_str  = QWeb.render('OrderWidget',{widget:this, order:order, orderlines:orderlines});

	        var el_node = document.createElement('div');
	            el_node.innerHTML = _.str.trim(el_str);
	            el_node = el_node.childNodes[0];


	        var list_container = el_node.querySelector('.orderlines');
	        for(var i = 0, len = orderlines.length; i < len; i++){
	            var orderline = this.render_orderline(orderlines[i]);
	            list_container.appendChild(orderline);
	        }

	        if(this.el && this.el.parentNode){
	            this.el.parentNode.replaceChild(el_node,this.el);
	        }
	        this.el = el_node;
	        this.update_summary();
	        if(scrollbottom){
	            this.el.querySelector('.order-scroller').scrollTop = 100 * orderlines.length;
	        }
	    	}
	    },
});

});