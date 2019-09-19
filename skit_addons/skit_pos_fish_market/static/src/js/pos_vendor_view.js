odoo.define('skit_pos_restaurant.kitchen_view', function (require) {
"use strict";
var PosBaseWidget = require('point_of_sale.BaseWidget');
var chrome = require('point_of_sale.chrome');
var gui = require('point_of_sale.gui');
var models = require('point_of_sale.models');
var screens = require('point_of_sale.screens');
var PopupWidget = require('point_of_sale.popups');
var core = require('web.core');
var rpc = require('web.rpc');

var QWeb = core.qweb;
var _t = core._t;


var PaymenPopuptWidget = PopupWidget.extend({
	 template: 'PaymenPopuptWidget', 
		    events: _.extend({}, PopupWidget.prototype.events, {
		        'click .button.ok': 'click_ok',
			}),
		    click_ok: function(){
		    	var self = this;
	    		self.gui.close_popup();
		    },

});
gui.define_popup({name:'paymentpopupwidget', widget: PaymenPopuptWidget});


/** Payment -  POP-UP widget **/
var OrderPaymentWidget = PopupWidget.extend({
	 template: 'OrderPaymentWidget', 
		    events: _.extend({}, PopupWidget.prototype.events, {
		    	'click .button.payment-cancel':  'click_cancel',
		        'click .button.payment-ok': 'click_ok',
			}),
			click_cancel: function(){
				var self = this;
				self.gui.close_popup();
		    },

		    click_ok: function(){
		    	var self = this;
		    	var payment_amount = $("#payment_amount").val();
		    	var journal_id = $("#journal_id").val();
		    	var invoice_id = $("#invoice_id").text();
		    	var order_id = $("#order_id").text();
	    		self.gui.close_popup();
	    		this._rpc({
					model: 'sale.order',
					method: 'create_payment',
					args: [0, journal_id, invoice_id, order_id],
				}).then(function(result){ 
					self.pos.gui.show_popup('paymentpopupwidget', {
		                'title': _t('Success'),	
		            });
				});
		    },

});
gui.define_popup({name:'popuppaymentwidget', widget: OrderPaymentWidget});

/** Sales order screen widget **/
var SOOrderScreenWidget = screens.ScreenWidget.extend({
    template: 'SOOrderScreenWidget',

    init: function(parent, options) {
        this._super(parent, options);
        this.editing = false;
        this.sorder_cache = new screens.DomCache();
    },	
    
    auto_back: true,
    
    hide: function(){
        this._super();
        if (this.editing) {
            this.toggle_editing();
        }
        
    },
   
    show: function(){
        var self = this;
        this._super();
        this.chrome.widget.order_selector.hide();
        this.renderElement();
        
        var orders = this.pos.db.get_sorder_sorted(1000);
        this.render_sorder(orders);
       
    },
    update_order_state: function(order_id, order_state){
    	var self = this;
    	if(order_state == "Payment"){
    		this._rpc({
				model: 'sale.order',
				method: 'get_invoice_details',
				args: [0, order_id],
			}).then(function(result){ 
				self.pos.gui.show_popup('popuppaymentwidget', {
	                'title': _t('Payment'),
	                'journals':result,	
	            });
			});
    	}else{
	    	this._rpc({
				model: 'sale.order',
				method: 'change_order_state',
				args: [0, order_id, order_state],
			}).then(function(result){ 
				console.log("Order confirmed");
			});
    	}
    },
    
    update_order_cache: function(order_ids) {
        var self = this;
        var order = {};
        _.each(order_ids, function(oid){
            order = self.pos.db.get_sorder_by_id(oid);
            if (!order) {
                return;
            }
            var sorderline_html = '';
            var sorderline = self.sorder_cache.get_node(order.id);
            if(sorderline){
            	var orderlines = self.pos.db.get_orderline_by_order(order.id);
                sorderline_html = QWeb.render('ShopCartOrders',{widget: self, sorder:order, sorderlines:orderlines});
                sorderline = document.createElement('div');
                sorderline.innerHTML = sorderline_html;
                sorderline = sorderline.childNodes[1];
                self.sorder_cache.cache_node(order.id,sorderline);
                var state_icon = sorderline.querySelector('.order_btn');
                if(state_icon){
                	state_icon.addEventListener('click', (function() {
                		var order_id = state_icon.getAttribute('order_id');
                    	var order_state = ($("#"+order_id).text()).trim();
                    	self.update_order_state(order_id, order_state);
                    }.bind(this)));
                }
            }
        });
    },
    update_sorder_screen: function(order_ids){
       
        this.render_sorder(this.pos.db.get_sorder_sorted(1000));
    },
    
    render_sorder: function(orders){
    	var contents = this.$el[0].querySelector('.checkout_orders');
        contents.innerHTML = "";
        for(var i = 0, len = Math.min(orders.length,1000); i < len; i++){
            var order    = orders[i];
            var sorderline = this.sorder_cache.get_node(order.id);
           
            if(!sorderline){
            	var orderlines = [];
            	if(this.pos.db.get_orderline_by_order(orders[i].id) != undefined){
            		orderlines = this.pos.db.get_orderline_by_order(orders[i].id);
            	}
                var sorderline_html = QWeb.render('ShopCartOrders',{widget: this, sorder:orders[i], sorderlines:orderlines});
                var sorderline = document.createElement('div');
                sorderline.innerHTML = sorderline_html;
                sorderline = sorderline.childNodes[1];
                this.sorder_cache.cache_node(order.id,sorderline);
                var state_icon = sorderline.querySelector('.order_btn');
                if(state_icon){
                	state_icon.addEventListener('click', (function(e) {
                		
                    	var order_id = e.target.dataset.item;
                    	var order_state = ($("#"+order_id).text()).trim();
                    	this.update_order_state(order_id, order_state);
                    	
                    }.bind(this)));
                }
              
            }
            
            contents.appendChild(sorderline);
        }
    },

});
gui.define_screen({name:'supplier_view', widget: SOOrderScreenWidget});


});