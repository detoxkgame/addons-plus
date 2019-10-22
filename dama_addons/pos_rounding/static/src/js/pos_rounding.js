odoo.define('pos_rounding.rounding', function (require) {
"use strict";

var core = require('web.core');
var models = require('point_of_sale.models');
var screens = require('point_of_sale.screens');
var rpc = require('web.rpc');
var utils = require('web.utils');
var session = require('web.session');
var round_pr = utils.round_precision;
var QWeb = core.qweb;
var _t = core._t;

var _super_order = models.Order.prototype;
models.Order = models.Order.extend({
    get_total_with_tax: function() {
        var total_with_tax = this.get_total_without_tax() + this.get_total_tax();
        if(this.pos.config.enable_rounding && total_with_tax > 100.0){
            return Math.round((total_with_tax));
        }
        else if (this.pos.config.enable_rounding && total_with_tax <= 100.0){
            return Math.round((total_with_tax)*2)/2;
        }
        else{
            return total_with_tax;
        }
    },

    get_rounding_product_price:function(){
        var price = this.get_total_with_tax() - (this.get_total_without_tax() + this.get_total_tax());
        return round_pr(price, this.pos.currency.rounding);
    },

    export_as_JSON: function(){
        var json = _super_order.export_as_JSON.apply(this,arguments);
        json.rounding = this.get_rounding_product_price();
        return json;
    },

    init_from_JSON: function(json){
        _super_order.init_from_JSON.apply(this,arguments);
        this.rounding = json.rounding;
    },

});

models.PosModel = models.PosModel.extend({
    _save_to_server: function (orders, options) {
        if (!orders || !orders.length) {
            var result = $.Deferred();
            result.resolve([]);
            return result;
        }

        options = options || {};

        var self = this;
        var timeout = typeof options.timeout === 'number' ? options.timeout : 7500 * orders.length;

        // Keep the order ids that are about to be sent to the
        // backend. In between create_from_ui and the success callback
        // new orders may have been added to it.
        var order_ids_to_sync = _.pluck(orders, 'id');

        // we try to send the order. shadow prevents a spinner if it takes too long. (unless we are sending an invoice,
        // then we want to notify the user that we are waiting on something )
        var args = [_.map(orders, function (order) {
                if(self.config.enable_rounding){
                    order['data']['lines'].push([0, 0, {
                    'product_id': self.config.rounding_product[0],
                    'price_unit':order['data'].rounding,
                    'qty':1,
                    'discount':0,
                    'pack_lot_ids':false,
                    'tax_ids':false,
                    'price_subtotal': order['data'].rounding,
                    'price_subtotal_incl': order['data'].rounding,
                    }]);
                }
                order.to_invoice = options.to_invoice || false;
                return order;
            })];
        return rpc.query({
                model: 'pos.order',
                method: 'create_from_ui',
                args: args,
                kwargs: {context: session.user_context},
            }, {
                timeout: timeout,
                shadow: !options.to_invoice
            })
            .then(function (server_ids) {
                _.each(order_ids_to_sync, function (order_id) {
                    self.db.remove_order(order_id);
                });
                self.set('failed',false);
                return server_ids;
            }).fail(function (type, error){
                if(error.code === 200 ){    // Business Logic Error, not a connection problem
                    //if warning do not need to display traceback!!
                    if (error.data.exception_type == 'warning') {
                        delete error.data.debug;
                    }

                    // Hide error if already shown before ...
                    if ((!self.get('failed') || options.show_error) && !options.to_invoice) {
                        self.gui.show_popup('error-traceback',{
                            'title': error.data.message,
                            'body':  error.data.debug
                        });
                    }
                    self.set('failed',error);
                }
                console.error('Failed to send orders:', orders);
            });
    },

});

screens.OrderWidget.include({
    update_summary: function(){
        var order = this.pos.get_order();
        if (!order.get_orderlines().length) {
            return;
        }

        var total     = order ? order.get_total_with_tax() : 0;
        var rounding = order ? order.get_rounding_product_price() : 0;
        if (this.pos.config.enable_rounding){
            var taxes = order ? total - rounding - order.get_total_without_tax() : 0;
        }
        else{
            var taxes = order ? total - order.get_total_without_tax() : 0;
        }
        this.el.querySelector('.summary .total > .value').textContent = this.format_currency(total);
        if (this.pos.config.enable_rounding){
            this.el.querySelector('.round_value').textContent = this.format_currency(rounding);
        }
        this.el.querySelector('.summary .total .subentry .value').textContent = this.format_currency(taxes);
    },
});

});
