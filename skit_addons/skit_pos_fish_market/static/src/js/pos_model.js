odoo.define('skit_pos_fish_market.pos_model', function(require) {
	"use strict";		
var screens = require('point_of_sale.screens');
var OrderWidget = screens.OrderWidget;
var gui = require('point_of_sale.gui');
var PopupWidget = require('point_of_sale.popups');
var models = require('point_of_sale.models');
var utils = require('web.utils');
var round_pr = utils.round_precision;
var core = require('web.core');
var _t = core._t;

 /**Load the sale order and order lines model **/
 models.load_models([
	   {
	        model:  'sale.order',
	        fields: [],	
	        domain: [['state','not in', ['cancel', 'payment']]],
	        loaded: function(self,orders){
	            self.orders = orders;
	            self.db.add_sorders(orders);
	        },
	   },
	   
	   {
	        model:  'sale.order.line',
	        fields: ['product_id', 'product_uom_qty', 'price_subtotal', 'order_id'],
	        order:  _.map(['order_id','name'], function (name) { return {name: name}; }),
	        domain: [['order_id.state','not in',['cancel', 'payment']]],
	        loaded: function(self,orderlines){
	            self.orderlines = orderlines;
	            self.db.add_orderline(orderlines);
	        },
	   },	
 ]);
 
});