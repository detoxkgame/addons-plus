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
        this.is_service_order = false;
        this.is_room_service = false;
        this.source_folio_id = 0;
        this.room_table_id = 0;
        this.exit_order_id = 0;
        this.vendor_order_details = {};
        this.save_to_db();
    },
    export_as_JSON: function() {
        var json = _super_order.export_as_JSON.apply(this,arguments);
        json.reservation_details = this.reservation_details;
        json.is_service_order = this.is_service_order;
        json.is_room_service = this.is_room_service;
        json.source_folio_id = this.source_folio_id;
        json.room_table_id = this.room_table_id;
        json.exit_order_id = this.exit_order_id;
        json.vendor_order_details = this.vendor_order_details;
        return json;
    },
    init_from_JSON: function(json) {
        _super_order.init_from_JSON.apply(this,arguments);
        this.reservation_details = json.reservation_details;
        this.is_service_order = json.is_service_order;
        this.is_room_service = json.is_room_service;
        this.source_folio_id = json.source_folio_id;
        this.room_table_id = json.room_table_id;
        this.exit_order_id = json.exit_order_id;
        this.vendor_order_details = json.vendor_order_details;
    },
    add_product: function(product, options){
    	console.log('producvxbvjhj')
        if(this._printed){
            this.destroy();
            return this.pos.get_order().add_product(product, options);
        }
        this.assert_editable();
        options = options || {};
        var attr = JSON.parse(JSON.stringify(product));
        attr.pos = this.pos;
        attr.order = this;
        var line = new models.Orderline({}, {pos: this.pos, order: this, product: product});

        if(options.quantity !== undefined){
            line.set_quantity(options.quantity);
        }

        if(options.price !== undefined){
            line.set_unit_price(options.price);
        }

        //To substract from the unit price the included taxes mapped by the fiscal position
        this.fix_tax_included_price(line);

        if(options.discount !== undefined){
            line.set_discount(options.discount);
        }
        
        /** set room line id */
        if(options.room_line_id !== undefined){
            line.set_room_line_id(options.room_line_id);
        }
        
        if(options.extras !== undefined){
            for (var prop in options.extras) {
                line[prop] = options.extras[prop];
            }
        }

        var to_merge_orderline;
        for (var i = 0; i < this.orderlines.length; i++) {
            if(this.orderlines.at(i).can_be_merged_with(line) && options.merge !== false){
                to_merge_orderline = this.orderlines.at(i);
            }
        }
        if (to_merge_orderline){
            to_merge_orderline.merge(line);
        } else {
            this.orderlines.add(line);
        }
        this.select_orderline(this.get_last_orderline());

        if(line.has_product_lot){
            this.display_lot_popup();
        }
    },
    /* ---- reservation_details  --- */
    set_reservation_details: function(reservation_details) {
        this.reservation_details = reservation_details;
        this.trigger('change');
    },
    get_reservation_details: function(){
        return this.reservation_details;
    },
    
    /* Room Service Details */
    set_service_order: function(is_service_order) {
        this.is_service_order = is_service_order;
    },
    get_service_order: function(){
        return this.is_service_order;
    },
    /* Room Service Details */
    set_room_service: function(is_room_service) {
        this.is_room_service = is_room_service;
    },
    get_room_service: function(){
        return this.is_room_service;
    },
    
    set_source_folio_id: function(source_folio_id) {
        this.source_folio_id = source_folio_id;
    },
    get_source_folio_id: function(){
        return this.source_folio_id;
    },
    
    set_room_table_id: function(room_table_id) {
        this.room_table_id = room_table_id;
    },
    get_room_table_id: function(){
        return this.room_table_id;
    },
    
    set_exit_order_id: function(exit_order_id) {
        this.exit_order_id = exit_order_id;
    },
    get_exit_order_id: function(){
        return this.exit_order_id;
    },
    /* ---- vendor_details  --- */
    set_vendor_order_details: function(vendor_order_details) {
        this.vendor_order_details = vendor_order_details;
        this.trigger('change');
    },
    get_vendor_order_details: function(){
        return this.vendor_order_details;
    },
});

var _super_orderline = models.Orderline.prototype;
models.Orderline = models.Orderline.extend({
    initialize: function(attr, options) {
        _super_orderline.initialize.call(this,attr,options);
        this.room_line_id = 0;
    },
    set_room_line_id: function(room_line_id){
        this.room_line_id = room_line_id;
        this.trigger('change',this);
    },
    get_room_line_id: function(room_line_id){
        return this.room_line_id;
    },
    
    clone: function(){
        var orderline = _super_orderline.clone.call(this);
        orderline.room_line_id = this.room_line_id;
        return orderline;
    },
    export_as_JSON: function(){
        var json = _super_orderline.export_as_JSON.call(this);
        json.room_line_id = this.room_line_id;
        return json;
    },
    init_from_JSON: function(json){
        _super_orderline.init_from_JSON.apply(this,arguments);
        this.room_line_id = json.room_line_id;
    },
});

});