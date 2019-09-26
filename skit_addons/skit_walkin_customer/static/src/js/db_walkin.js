odoo.define('skit_walkin_customer.db_walkin', function(require) {
	"use strict";
	var PosDB = require('point_of_sale.DB');
	PosDB.include({
		init : function(options) {
			this._super(options);
			this.walkin_customer = 0;
		},

		set_walkin_customer: function(walkin_customer) {
			this.walkin_customer = walkin_customer;
		},

		get_walkin_customer: function() {
			return this.walkin_customer;
		},

	});
});