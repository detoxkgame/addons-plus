odoo.define("sun_pos_receipt_arabic.models", function (require) {
"use strict";

var models = require('point_of_sale.models');

models.load_fields('res.company', ['street','street2','city','state_id','vat', 'name_arabic', 'street_arabic', 'street2_arabic', 'city_arabic', 'state_arabic']);
models.load_fields('product.product',['name','name_arabic']);

var _super_order = models.Order.prototype;
models.Order = models.Order.extend({
    export_for_printing: function() {
        var json = _super_order.export_for_printing.apply(this,arguments);
        json.categories = [];
        return json;
    },
    get_total_qty: function() {
        return this.orderlines.reduce((function(sum, orderLine) {
            return sum + orderLine.get_quantity();
        }), 0);
    },

    get_order_categories: function() {
        return this.orderlines.reduce(function(categories, orderLine){
            if(categories.indexOf(orderLine.get_product().pos_categ_id[0]) === -1) {
                if (orderLine.get_product().pos_categ_id){
                    categories.push(orderLine.get_product().pos_categ_id[0]);
                }
                else{
                    if(categories.indexOf(-1) === -1) {
                        categories.push(-1);
                    }
                }
            }
            return categories;
        }, []);
    },

    get_order_uom: function() {
        return this.orderlines.reduce(function(uom_ids, orderLine){
            if(uom_ids.indexOf(orderLine.get_unit().id) === -1) {
                uom_ids.push(orderLine.get_unit().id);
            }
            return uom_ids;
        }, []);
    },

    get_uom_total: function(uom_id){
        return this.orderlines.reduce((function(sum, orderLine) {
            if(orderLine.get_unit().id == uom_id){
                return sum + orderLine.get_quantity();
            }
            return sum;
        }), 0);
    },
    get_category_by_id: function(categ_id){
        return this.pos.db.category_by_id[categ_id].name;
    },

    get_uom_by_id: function(uom_id){
        return this.pos.units_by_id[uom_id].name;
    },
});

})