odoo.define('skit_walkin_customer.screens_walkin', function(require) {
	"use strict";
	var screens = require('point_of_sale.screens');
	var OrderWidget = screens.OrderWidget;
	var ClientListScreenWidget = screens.ClientListScreenWidget;
	var ReceiptScreenWidget = screens.ReceiptScreenWidget;
	

	var WalkinButton = screens.ActionButtonWidget.extend({
		template : 'WalkinButton',
		button_click : function(event) {
			var self = this;
			var order = self.pos.get_order();
			var partner = this.pos.db.get_walkin_customer();
			order.set_client(partner)		
		},
	});
	screens.define_action_button({
		'name' : 'WalkinCustomer',
		'widget' : WalkinButton,
	});
 });