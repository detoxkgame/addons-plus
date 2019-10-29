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
