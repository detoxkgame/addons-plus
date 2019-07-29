odoo.define('skit_pos_pricelist.pos_pricelist', function (require) {
    "use strict";
    var core = require('web.core');
    var models = require('point_of_sale.models');
    var rpc = require('web.rpc');
    var _t = core._t;

    var posmodel_super = models.PosModel.prototype;
     
    /** Extend the POS Model for set cahe for pricelist */
    models.PosModel = models.PosModel.extend({

        load_server_data: function () {
            var self = this;
            var curr_index = 0;
            var pricelist_index = _.findIndex(this.models, function (model) {
                return model.model === "product.pricelist";
            });

            // Give both the fields and domain to pos_cache in the
            // backend. This way we don't have to hardcode these
            // values in the backend and they automatically stay in
            // sync with whatever is defined (and maybe extended by
            // other modules) in js.
            var pricelist_model = this.models[pricelist_index];
            var pricelist_fields = pricelist_model.fields;
            var pricelist_domain = pricelist_model.domain;

            // We don't want to load product.product the normal
            // uncached way, so get rid of it.
            if (pricelist_index !== -1) {
                this.models.splice(pricelist_index, 1);
            }
            var pricelist_item_index = _.findIndex(this.models, function (model) {
                return model.model === "product.pricelist.item";
            });
            curr_index = pricelist_item_index
            if (pricelist_item_index !== -1) {
                this.models.splice(pricelist_item_index, 1);
            }

            
            return posmodel_super.load_server_data.apply(this, arguments).then(function () {
            	var records = rpc.query({
                    model: 'pos.config',
                    method: 'get_pricelists_from_cache',
                    args: [self.pos_session.config_id[0], pricelist_fields, pricelist_domain],
                });    
            	var pListItem = rpc.query({
                    model: 'product.pricelist.item',
                    method: 'search_read',
                    args: [[['pricelist_id','=',self.config.pricelist_id[0]]]],
               });
                self.chrome.loading_message(_t('Loading') + ' product.pricelist', 1);
                return records.then(function (pricelists) {
                	 _.map(pricelists, function (pricelist) { pricelist.items = []; });
                     self.default_pricelist = _.findWhere(pricelists, {id: self.config.pricelist_id[0]});
                     self.pricelists = pricelists;
                     return pListItem.then(function (pricelist_items) {
                    	 var pricelist_by_id = {};
        	             _.each(self.pricelists, function (pricelist) {
        	                 pricelist_by_id[pricelist.id] = pricelist;
        	             });

        	             _.each(pricelist_items, function (item) {
        	                 var pricelist = pricelist_by_id[item.pricelist_id[0]];
        	                 pricelist.items.push(item);
        	                 item.base_pricelist = pricelist_by_id[item.base_pricelist_id[0]];
        	             });
                     });
                });
            });
        },

    });
});
