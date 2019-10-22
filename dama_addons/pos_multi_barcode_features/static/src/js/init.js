odoo.define('pos_multi_barcode_features.init', function (require) {
"use strict";
    var models = require('point_of_sale.models');

    models.load_fields('product.product', ['barcode_ids']);

    models.load_models({
        model:  'product.multi.barcode',
        fields: ['product_id', 'name'],
        domain: [['available_in_pos','=',true]],
        loaded: function(self, multi_barcodes){
            self.db.set_multi_barcode_by_id(multi_barcodes);
        }

    },{
        before: 'product.product'
    });
});