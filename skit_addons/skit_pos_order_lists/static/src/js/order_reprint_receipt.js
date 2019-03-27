odoo.define('skit_pos_order_lists.order_reprint_receipt', function (require) {
"use strict";

var core = require('web.core');
var QWeb = core.qweb;
var chrome = require('point_of_sale.chrome');
var _t = core._t;
var gui = require('point_of_sale.gui');
var models = require('point_of_sale.models');
var screens = require('point_of_sale.screens');
var session = require('web.session');
var PopupWidget = require('point_of_sale.popups');

	var _super = models.Order.prototype;
	models.Order = models.Order.extend({
		initialize: function(attributes,options){
			_super.initialize.apply(this,arguments);
			 this.is_reprint_order = 0;
			 this.print_orders =[];
			 this.save_to_db();
		},
		/* ---- Reprint Order array  --- */
	    set_print_orders: function(order_arr) {
	        this.print_orders = order_arr;
	        this.trigger('change');
	    },
	    get_print_orders: function(){
	        return this.print_orders;
	    },
		/* ---- Reprint Order id  --- */
	    set_is_reprint_order: function(is_reprint_order) {
	        this.is_reprint_order = is_reprint_order;
	        this.trigger('change');
	    },
	    get_is_reprint_order: function(){
	        return this.is_reprint_order;
	    },
	});	

	/*--------------------------------------*\
	 |         THE REPRINT RECEIPT SCREEN           |
	\*======================================*/

	// The receipt screen displays the order's
	// receipt and allows it to be printed in a web browser.
	// The receipt screen is not shown if the point of sale
	// is set up to print with the proxy. Altough it could
	// be useful to do so...
	var OrderReprintReceiptScreenWidget = screens.ScreenWidget.extend({
	    template: 'OrderReprintReceiptScreenWidget',
	    init: function(parent, options){
	        this._super(parent, options);
	    },
	    auto_back: true,
	    show: function(){
	    	var self = this;
	        this._super();
	        this.renderElement();
	        this.$('.back').click(function(){
	        	self.chrome.widget.order_selector.view_ol_paylater_click_handler(this.event,$(this));
	        }); 
	        /** Print receipt button*/
	        this.$('.button.reprintrec').click(function(){	        	
	        	var order_id = self.pos.get_order().get_is_reprint_order();//get order_id for reprint
		    	var to_print_orders = self.pos.get_order().print_orders;//get reprint order details
	        	self.print_receipt_xml(to_print_orders,order_id);
	        });
	    }, 
	    renderElement: function(){
	    	this._super();
	    	var self = this;
	    	if(self.pos.get_order()!=null)
	    	{
	    		var order_id = self.pos.get_order().get_is_reprint_order();//get order_id to reprint
	    		if(order_id){
	    			//get reprint order details
	    			self.order_receipt_reprint(order_id);
	    		}
	    	}
	    },
	    print_receipt_xml: function(to_print_orders,order_id){
	    	var self = this;
	    	var lines = [];
            var payments = [];
            var orders = [];
            var discount = 0;
	    	if(to_print_orders)
	    	{
	    		var result = to_print_orders;
	    		lines = result[0];
                orders = result[3];
                payments = result[2];
                discount = result[1];
               	var receipt = QWeb.render('PosTicketReceipt',{
		 	        		widget:self,
		 	                orders: orders,
		 	                change: result[4],
		 	                orderlines: lines,
		 	                discount_total: discount,
		 	                paymentlines: payments,
		         });
               	self.print(receipt);
               	self.pos.get_order()._printed = true;	
               	self.pos.get_order().set_is_reprint_order(order_id); //set order_id for reprint order
            }
	    },
	    print: function(receipt){
	    	var self = this;
	    	 if (!self.pos.config.iface_print_via_proxy) 
	    	 {           		 
            	window.print();
	    	 }
             else
             {
            	 self.pos.proxy.print_receipt(receipt);// proxy (xml) printing
             }	    	 	             
	    },
	    order_receipt_reprint: function(order_id){
	    	var self = this;
	    	if(order_id){
	    		 var lines = [];
	             var payments = [];
	             var orders = [];
	             var discount = 0;
	             self._rpc({
		                model: 'pos.order',
		                method: 'get_order_orderlines',
		                args: [order_id],
		            }).then(function(result) {	
		                 lines = result[0];
		                 orders = result[3];
		                 payments = result[2];
		                 discount = result[1];
		                 var print_orders = self.pos.get_order().set_print_orders(result);
		                 self.$('.pos-receipt-container').html(QWeb.render('PosTicketReceipt',{
			                     widget:self,
			                     orders: orders,
			                     change: result[4],
			                     orderlines: lines,
			                     discount_total: discount,
			                     paymentlines: payments,
			             }));
		                 self.pos.get_order().set_is_reprint_order(order_id); //set order_id for reprint order
		            });	  
	    	}
	    },
	});
	gui.define_screen({name:'order_reprint_receipt', widget: OrderReprintReceiptScreenWidget});
});
