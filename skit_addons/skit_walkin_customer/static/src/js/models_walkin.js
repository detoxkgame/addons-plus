odoo.define('skit_walkin_customer.models_walkin', function(require) {
	"use strict";
	var models = require('point_of_sale.models');

	models.load_models([ {
		model : 'res.partner',
		fields : [ 'id', 'name', 'is_walkin' ],
		domain : [ [ 'customer', '=', true ] ],
		loaded : function(self, partners) {
			self.walkin_partner = false
			for (var i = 0, len = partners.length; i < len; i++) {
				if (partners[i].is_walkin == true) {
					self.walkin_partner = partners[i];
					self.db.set_walkin_customer(partners[i]);
				}

			} 
		},
	},
	
]);
	
});