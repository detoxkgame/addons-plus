odoo.define('pos_sorder_sync.pos', function (require) {

    var core = require('web.core');
    var screens = require('point_of_sale.screens');
    var models = require('point_of_sale.models');
    var gui = require('point_of_sale.gui');
    var rpc = require('web.rpc');
    var SOOrderScreenWidget = screens.SOOrderScreenWidget;

    var QWeb = core.qweb;
    var _t = core._t;

    var PosModelSuper = models.PosModel;
    models.PosModel = models.PosModel.extend({
        initialize: function(){
            PosModelSuper.prototype.initialize.apply(this, arguments);
            var self = this;
            this.ready.then(function () {
            	
                self.bus.add_channel_callback("pos_sale_sync", self.on_sorder_updates, self);
            });
        },
        on_sorder_updates: function(data){
            var self = this;
            
            if (data.message === 'update_sorder_fields' && data.order_ids && data.order_ids.length) {
            	
            	if (data.action && data.action === 'unlink') {
                    this.remove_unlinked_sorders(data.order_ids);
                    this.update_templates_with_sorder(data.order_ids);
                } else {
                    this.load_new_sorders_force_update(data.order_ids).then(function(){
                        self.update_templates_with_sorder(data.order_ids);
                    });
                }
            }
        },

        update_templates_with_sorder: function(order_ids) {
        	
            if (!order_ids) {
                return;
            }
            var supplier_view_screen = this.gui.screen_instances.supplier_view;
            // updates order cache
            supplier_view_screen.update_order_cache(order_ids);
            // updates, renders order details, renders order
            if (this.gui.get_current_screen() === 'supplier_view'){
            	supplier_view_screen.update_sorder_screen(order_ids);
            }
            
        },

        load_new_sorders_force_update: function(ids) {
            // quite similar to load_new_order but loads only required orders and do it forcibly (see the comment below)
            var def = new $.Deferred();
            if (!ids) {
                return def.reject();
            }
            var self = this;
            var model_name = 'sale.order';
            var fields = _.find(this.models,function(model){
                return model.model === model_name;
            }).fields;
            
            var linefields = _.find(this.models,function(model){
                return model.model === 'sale.order.line';
            }).fields;
            
            ids = Array.isArray(ids)
            ? ids
            : [ids];
            rpc.query({
                model: model_name,
                method: 'read',
                args: [ids, fields],
            }, {
                shadow: true,
            }).then(function(orders) {
                // check if the partners we got were real updates
                // we add this trick with get_partner_write_date to be able to process several updates within the second
                // it is restricted by built-in behavior in add_partners function
            	var domain = [['order_id', 'in', ids]];
            	
            	rpc.query({
                    model: 'sale.order.line',
                    method: 'search_read',
                    args: [domain, linefields],
                })
                .then(function (orderlines) {
                	
                	self.db.add_orderline(orderlines);
                	
                	self.db.sorder_write_date = 0;
                    // returns default value "1970-01-01 00:00:00"
                    self.db.get_sorder_write_date();
                    if (self.db.add_sorders(orders)) {
                        def.resolve();
                    } else {
                        def.reject();
                    }
                });
                
            }, function(err,event){
                if (err) {
                    console.log(err.stack);
                }
                event.preventDefault();
                def.reject();
            });
            return def;
        },

        remove_unlinked_sorders: function(ids) {
            var self = this;
            var order = false;
            var sorder_sorted = this.db.sorder_sorted;
            _.each(ids, function(id) {
                order = self.db.get_sorder_by_id(id);
                
                sorder_sorted.splice(_.indexOf(sorder_sorted, id), 1);
                delete self.db.sorder_by_id[id];
            });
        },
    });

});
