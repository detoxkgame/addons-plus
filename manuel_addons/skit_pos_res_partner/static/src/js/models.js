odoo.define('models', function (require) {
	"use strict";
	var models = require('point_of_sale.models');
	var core = require('web.core');
	var _t  = core._t;

	var _super_posmodel = models.PosModel.prototype;
	
	// Add new Column
	models.PosModel = models.PosModel.extend({
	    initialize: function (session, attributes) {
	    	
	    	/* Partner Model */
	        var partner_model = _.find(this.models, function(model){
	            return model.model === 'res.partner';
	        });
	        partner_model.fields.push('sex','age');
	        
	        // Inheritance
	        return _super_posmodel.initialize.call(this, session, attributes);
	    },
	    
	});
});