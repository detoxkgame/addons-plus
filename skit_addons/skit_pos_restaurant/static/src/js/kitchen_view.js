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

var QWeb = core.qweb;
var _t = core._t;

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
		     this.set_order(orders[0]);
		 }
     },
});

/** Extend the order widget for kitchen view (click handler, render element) */
screens.OrderWidget.include({
	init: function(parent, options) {
	     var self = this;
	     this._super(parent,options);
	     
	     this.line_click_handler = function(event){
	    	 /*if(self.pos.config.is_kitchen){
		    	 var orders = self.pos.get_order_list();
		         for (var i = 0; i < orders.length; i++) {
			        var order = orders[i];
			        if (order && i > 0) {
			        	self.pos.set_order(order);
			        }
		         }
		         console.log('click handler');
		    	 self.pos.set_order(orders[0]);
	    	 }*/
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
		            	el_node.querySelector('.orderlines'+orders[j].uid).remove();
		            }
		            var is_categ_order = false;
		            for(var i = 0, len = orderlines.length; i < len; i++){
		            	var pos_categ_id = orderlines[i].get_product().pos_categ_id[0];
		            	var pos_categ_ids = this.pos.config.pos_categ_ids

		            	if ($.inArray(pos_categ_id, pos_categ_ids) > -1) {
		            		if(orderlines[i].get_kitchen_state() != 'delivered'){
		            			is_categ_order = true;
			            		var orderline = this.render_orderline(orderlines[i]);
					            list_container.appendChild(orderline);
			            	}
		                }

		               /* var orderline = this.render_orderline(orderlines[i]);
		                list_container.appendChild(orderline);*/
		            }
		            if(!is_categ_order){
		            	el_node.querySelector('.orderlines'+orders[j].uid).remove();
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
/*var KitchenScreenWidget = screens.ScreenWidget.extend({
    template:'KitchenScreenWidget',

    start: function(){ 

        var self = this;

        this.actionpad = new ActionpadWidget(this,{});
        this.actionpad.replace(this.$('.placeholder-ActionpadWidget'));

        this.numpad = new NumpadWidget(this,{});
        this.numpad.replace(this.$('.placeholder-NumpadWidget'));

        this.order_widget = new screens.OrderWidget(this,{
            numpad_state: this.numpad.state,
        });
        this.order_widget.replace(this.$('.placeholder-OrderWidget'));

        this.product_list_widget = new screens.ProductListWidget(this,{
            click_product_action: function(product){ self.click_product(product); },
            product_list: this.pos.db.get_product_by_category(0)
        });
        this.product_list_widget.replace(this.$('.placeholder-ProductListWidget'));

        this.product_categories_widget = new screens.ProductCategoriesWidget(this,{
            product_list_widget: this.product_list_widget,
        });
        this.product_categories_widget.replace(this.$('.placeholder-ProductCategoriesWidget'));

        this.action_buttons = {};
        var classes = screens.action_button_classes;
        for (var i = 0; i < classes.length; i++) {
            var classe = classes[i];
            if ( !classe.condition || classe.condition.call(this) ) {
                var widget = new classe.widget(this,{});
                widget.appendTo(this.$('.control-buttons'));
                this.action_buttons[classe.name] = widget;
            }
        }
        if (_.size(this.action_buttons)) {
            this.$('.control-buttons').removeClass('oe_hidden');
        }
    },

    click_product: function(product) {
       if(product.to_weight && this.pos.config.iface_electronic_scale){
           this.gui.show_screen('scale',{product: product});
       }else{
           this.pos.get_order().add_product(product);
       }
    },

    show: function(reset){
        this._super();
        if (reset) {
            this.product_categories_widget.reset_category();
            this.numpad.state.reset();
        }
        if (this.pos.config.iface_vkeyboard && this.chrome.widget.keyboard) {
            this.chrome.widget.keyboard.connect($(this.el.querySelector('.searchbox input')));
        }
    },

    close: function(){
        this._super();
        if(this.pos.config.iface_vkeyboard && this.chrome.widget.keyboard){
            this.chrome.widget.keyboard.hide();
        }
    },

});
gui.define_screen({name:'kitchen_view', widget: KitchenScreenWidget});*/

});