odoo.define('pos_models', function(require){
    var exports = {};

    var session = require('web.session');
    var Backbone = window.Backbone;
    var core = require('web.core');
    var screens = require('point_of_sale.screens');
    var models = require('point_of_sale.models');
    var chrome = require('point_of_sale.chrome');
    var rpc = require('web.rpc');
    var PosBaseWidget = require('point_of_sale.BaseWidget');
    var gui = require('point_of_sale.gui');
    var framework = require('web.framework');
    var posDB = require('point_of_sale.DB');


    var _t = core._t;
    
    screens.OrderWidget.include({
		template:'OrderWidget',
		render_orderline: function(orderline) {
			var self = this;
	        var el_node = this._super(orderline);
	        var reverse_icon = el_node.querySelector('.reverse_view_btn');
	        if(reverse_icon){
	        	reverse_icon.addEventListener('click', (function() {
	        		this.set_kitchen_reverse(orderline);
	            }.bind(this)));
	        }
	        var forward_icon = el_node.querySelector('.forward_view_btn');
	        if(forward_icon){
	        	forward_icon.addEventListener('click', (function() {
	        		this.set_kitchen_forward(orderline);
	            }.bind(this)));
	        }
	        return el_node;
	    },
	    
		set_kitchen_reverse: function(orderline){
			if(this.pos.get_order() == null || this.pos.get_order == undefined){
	    		var updateorders = this.pos.get('orders').models;
	    		this.pos.set_order(updateorders[0]);
	    		this.set('selectedOrder',updateorders[0]);
	    	}
	    	this.pos.get_order().select_orderline(orderline);
	        var order = this.pos.get_order();
	        if (order.get_selected_orderline()) {
	        	var kitchen_state = order.get_selected_orderline().get_kitchen_state();
	        	if(kitchen_state == 'delivered'){
	        		order.get_selected_orderline().set_kitchen_state('ready');
	        	}
	        	if(kitchen_state == 'ready'){
	        		order.get_selected_orderline().set_kitchen_state('cooking');
	        	}
	        	if(kitchen_state == 'cooking'){
	        		order.get_selected_orderline().set_kitchen_state('start');
	        	}
	        	
	        }
	    },
	    
	    set_kitchen_forward: function(orderline){
	    	if(this.pos.get_order() == null || this.pos.get_order == undefined){
	    		var updateorders = this.pos.get('orders').models;
	    		this.pos.set_order(updateorders[0]);
	    		this.set('selectedOrder',updateorders[0]);
	    	}
	    	this.pos.get_order().select_orderline(orderline);
	    	var order = this.pos.get_order();
	        if (order.get_selected_orderline()) {
	        	var kitchen_state = order.get_selected_orderline().get_kitchen_state();
	        	if(kitchen_state == 'start'){
	        		order.get_selected_orderline().set_kitchen_state('cooking');
	        	}
	        	if(kitchen_state == 'cooking'){
	        		order.get_selected_orderline().set_kitchen_state('ready');
	        	}
	        	if(kitchen_state == 'ready'){
	        		order.get_selected_orderline().set_kitchen_state('delivered');
	        		var orderlines = order.get_selected_orderline().order.get_orderlines();
	        		var delivery_order = true;
			        for(var i = 0, len = orderlines.length; i < len; i++){
			        	var pos_categ_id = orderlines[i].get_product().pos_categ_id[0];
			            var pos_categ_ids = this.pos.config.pos_categ_ids
			            if ($.inArray(pos_categ_id, pos_categ_ids) > -1) {
			            	if(orderlines[i].get_kitchen_state() != 'delivered'){
			            		delivery_order = false;
				            }
			            }
			         }
			        if(delivery_order){
			        	$('.orderlines'+order.get_selected_orderline().order.uid).css({'display': 'none'})
			        }
	        	}
	        	
	        }
	    },
	    
	});
    
    /** Order Line */
    var OrderlineSuper = models.Orderline;
    models.Orderline = models.Orderline.extend({
        initialize: function(){
            var self = this;
            OrderlineSuper.prototype.initialize.apply(this, arguments);
            this.kitchen_state = 'start';
            
        },
        clone: function() {
	        var orderline = OrderlineSuper.prototype.clone.apply(this,arguments);
	        //orderline.kitchen_state = this.kitchen_state;
	        orderline.kitchen_state = this.kitchen_state;
	        return orderline;
	    },
        export_as_JSON: function() {
	        var json = OrderlineSuper.prototype.export_as_JSON.apply(this,arguments);
	        //json.kitchen_state = this.get_kitchen_state();
	        json.kitchen_state = this.get_kitchen_state()
	        return json;
	    },
	    init_from_JSON: function(json) {
	    	OrderlineSuper.prototype.init_from_JSON.apply(this,arguments);
	        //this.kitchen_state = json.kitchen_state;
	        this.set_kitchen_state(json.kitchen_state);
	    },
		/* ---- Pending Invoice  --- */
	    set_kitchen_state: function(state) {
	        this.kitchen_state = state;
	        this.trigger('change',this);
	    },
	    get_kitchen_state: function(){
	        return this.kitchen_state;
	    },
	   
    });
});