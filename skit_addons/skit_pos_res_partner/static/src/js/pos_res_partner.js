odoo.define('skit_pos_res_partner.pos_res_partner', function (require) {
    "use strict";
    var core = require('web.core');
    var models = require('point_of_sale.models');
    var screens = require('point_of_sale.screens');
    var ClientListScreenWidget = screens.ClientListScreenWidget;
    var rpc = require('web.rpc');
    var _t = core._t;

    /** Extend the ClientListScreenWidget for update the partner while cache*/
    var posmodel_super = models.PosModel.prototype;
	ClientListScreenWidget.include({
	    template: 'ClientListScreenWidget',
	    
	    // what happens when we've just pushed modifications for a partner of id partner_id
	    saved_client_details: function(partner_id){
	        var self = this;
	        this.update_edit_partner(partner_id).then(function(){
	            var partner = self.pos.db.get_partner_by_id(partner_id);
	            if (partner) {
	                self.new_client = partner;
	                self.toggle_save_button();
	                self.display_client_details('show',partner);
	            } else {
	                // should never happen, because create_from_ui must return the id of the partner it
	                // has created, and reload_partner() must have loaded the newly created partner. 
	                self.display_client_details('hide');
	            }
	        });
	    },
	    update_edit_partner: function(partner_id){
	    	var self = this;
            var def  = new $.Deferred();
            var fields = ['name','street','city','state_id','country_id','vat','phone','zip','mobile','email','barcode','write_date','property_account_position_id','property_product_pricelist'];
            var domain = [['id','=',partner_id]];
            rpc.query({
                 model: 'res.partner',
                 method: 'search_read',
                 args: [domain, fields],
            }, {
                 timeout: 3000,
                 shadow: true,
            })
            .then(function(partners){
            	 if(self.pos.db.add_partners(partners)) {   // check if the partners we got were real updates
                 	 self.pos.db.partner_by_id[partner_id] = partners[0];
                     def.resolve();
                     /** reload partners */
                     var partner = self.pos.db.get_partner_by_id(partner_id);
         	        self.render_list(self.pos.db.get_partners_sorted(1000));           
                     // update the currently assigned client if it has been changed in db.
                     var curr_client = self.pos.get_order().get_client();
                     if (curr_client) {
                         self.pos.get_order().set_client(self.pos.db.get_partner_by_id(curr_client.id));
                     }
                 } else {
                     def.reject();
                 }
             }, function(type,err){ def.reject(); });           
            
            return def;
	    },
	    
	});
    
	/** Extend the POS Model for set cahe for Partners */
    models.PosModel = models.PosModel.extend({
        load_server_data: function () {
            var self = this;
            var partner_index = _.findIndex(this.models, function (model) {
                return model.model === "res.partner";
            });

            // Give both the fields and domain to pos_cache in the
            // backend. This way we don't have to hardcode these
            // values in the backend and they automatically stay in
            // sync with whatever is defined (and maybe extended by
            // other modules) in js.
            var partner_model = this.models[partner_index];
            var partner_fields = partner_model.fields;
            var partner_domain = partner_model.domain;

            // We don't want to load res.partner the normal
            // uncached way, so get rid of it.
            if (partner_index !== -1) {
                this.models.splice(partner_index, 1);
            }

            return posmodel_super.load_server_data.apply(this, arguments).then(function () {
            	var records = rpc.query({
                    model: 'pos.config',
                    method: 'get_partners_from_cache',
                    args: [self.pos_session.config_id[0], partner_fields, partner_domain],
                }); 
                self.chrome.loading_message(_t('Loading') + ' res.partner', 1);
                return records.then(function (partners) {
                	self.partners = partners;
                    self.db.add_partners(partners);
                });
            });
        },
        
        load_new_partners: function(){
            var self = this;
            var def  = new $.Deferred();
            var partner_index = _.findIndex(this.models, function (model) {
                return model.model === "res.partner";
            });
            if(partner_index !== -1){
            	  var fields = _.find(this.models,function(model){ return model.model === 'res.partner'; }).fields;
                  var domain = [['customer','=',true],['write_date','>',this.db.get_partner_write_date()]];
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
            }
            return def;
        },

    });
});
