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
	    	this.pos.get_order().select_orderline(orderline);
	        var order = this.pos.get_order();
	        if (order.get_selected_orderline()) {
	        	var kitchen_state = order.get_selected_orderline().get_kitchen_state();
	        	if(kitchen_state == 'delivered'){
	        		order.get_selected_orderline().set_kitchen_state('cooking');
	        	}
	        	if(kitchen_state == 'cooking'){
	        		order.get_selected_orderline().set_kitchen_state('start');
	        	}
	        	
	        }
	    },
	    
	    set_kitchen_forward: function(orderline){
	    	this.pos.get_order().select_orderline(orderline);
	    	var order = this.pos.get_order();
	        if (order.get_selected_orderline()) {
	        	var kitchen_state = order.get_selected_orderline().get_kitchen_state();
	        	if(kitchen_state == 'start'){
	        		order.get_selected_orderline().set_kitchen_state('cooking');
	        	}
	        	if(kitchen_state == 'cooking'){
	        		order.get_selected_orderline().set_kitchen_state('delivered');
	        	}
	        	
	        }
	    },
	    
	    /*reverse_icon_click_handler: function(orderline) {
	    	this.pos.get_order().select_orderline(orderline);
	        var order = this.pos.get_order();
	        if (order.get_selected_orderline()) {
	        	order.get_selected_orderline().set_kitchen_state('cooking');
	        }
	        this.pos.get_order().trigger('new_updates_to_send');
		},*/
		
		/*forward_icon_click_handler: function(event, $el) {
			    alert('reverse')
		},*/
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
	    /*reverse_click_handler: function(event, $el) {
	       // this.pos.add_new_order();
	    	alert('reverse')
	    },
	    forward_click_handler: function(event, $el) {
		       // this.pos.add_new_order();
		    	alert('reverse')
		},

	    renderElement: function(){
	        var self = this;
	        this._super();

	        this.$('.reverse_view_btn').click(function(event){
	            self.reverse_click_handler(event,$(this));
	        });
	        this.$('.forward_view_btn').click(function(event){
	            self.forward_click_handler(event,$(this));
	        });
	    },*/
    });
});