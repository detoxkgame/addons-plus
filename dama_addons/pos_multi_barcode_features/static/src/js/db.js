odoo.define('pos_multi_barcode_features.DB', function (require) {
"use strict";
    var PosDB = require('point_of_sale.DB');

    PosDB.include({
        init: function(options){
            this._super(options);
            this.multi_barcode_by_id = {}
        },

        set_multi_barcode_by_id: function (multi_barcodes){
            for (var i=0; i < multi_barcodes.length; i++) {
                var multi_barcode = multi_barcodes[i];
                this.multi_barcode_by_id[multi_barcode.id] = multi_barcode;
            }
        },
        get_multi_barcode_by_id: function(multi_barcode_id){
            return this.multi_barcode_by_id[multi_barcode_id];
        },
        get_multi_barcodes: function(){
            return this.multi_barcode_by_id;
        },
        add_products: function(products){
            var self = this;
            this._super(products);
            var multi_barcodes = this.get_multi_barcodes();
            _.each(multi_barcodes, function(multi_barcode, multi_barcode_id){
                var product_id = multi_barcode.product_id[0];
                var product = self.product_by_id[product_id];
                if (product) {
                    self.product_by_barcode[multi_barcode.name] = product;
                }

            })
        },
        _product_search_string: function(product){
            var str = this._super(product);
            var self = this;
            var multi_barcode_ids = product.barcode_ids;
            if (multi_barcode_ids){
                // remove `\n`
                str = str.slice(0, str.length - 1);

                _.each(multi_barcode_ids, function(multi_barcode_id, idx){
                    var multi_barcode = self.get_multi_barcode_by_id(multi_barcode_id);
                    if (multi_barcode) {
                        var name = multi_barcode.name
                        var barcode = name ? name.replace(/:/g,'') : '';
                        str += '|' + barcode;
                    }
                })

                // add '\n' again to str
                str += '\n';
            }
            return str;
        },
    });
});