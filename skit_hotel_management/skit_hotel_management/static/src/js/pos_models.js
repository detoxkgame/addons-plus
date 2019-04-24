odoo.define('skit_hotel_management.pos_models', function (require) {
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
var rpc = require('web.rpc');
var PosDB = require('point_of_sale.DB');

var _super_posmodel = models.PosModel.prototype;
models.PosModel = models.PosModel.extend({

	initialize : function(session, attributes) {
		var account_model = _.find(this.models, function(model) {
			return model.model === 'account.journal';
		});
		account_model.fields.push('is_pay_later');

		return _super_posmodel.initialize.call(this, session, attributes);
	},
	
	load_new_partner_id: function(id){
        var self = this;
        var def  = new $.Deferred();
        var fields = _.find(this.models,function(model){ return model.model === 'res.partner'; }).fields;
        var domain = [['customer','=',true],['id','=',id]];
        rpc.query({
                model: 'res.partner',
                method: 'search_read',
                args: [domain, fields],
            }, {
                timeout: 3000,
                shadow: true,
            })
            .then(function(partners){
                if (self.db.add_partners(partners)) {   // check if the partners we got were real updates
                    def.resolve();
                } else {
                    def.reject();
                }
            }, function(type,err){ def.reject(); });
        return def;
    },

});

var _super_order = models.Order.prototype;
models.Order = models.Order.extend({
    initialize: function() {
        _super_order.initialize.apply(this,arguments);
        this.reservation_details    = {};
        this.to_invoice     = true;
        this.save_to_db();
    },
    export_as_JSON: function() {
        var json = _super_order.export_as_JSON.apply(this,arguments);
        json.reservation_details = this.reservation_details;
        return json;
    },
    init_from_JSON: function(json) {
        _super_order.init_from_JSON.apply(this,arguments);
        this.reservation_details = json.reservation_details;
    },
    /* ---- reservation_details  --- */
    set_reservation_details: function(reservation_details) {
        this.reservation_details = reservation_details;
        this.trigger('change');
    },
    get_reservation_details: function(){
        return this.reservation_details;
    },
    
});

});