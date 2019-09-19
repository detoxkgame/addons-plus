odoo.define('skit_pos_pricelist.pos_pricelist', function (require) {
    "use strict";
    var core = require('web.core');
    var models = require('point_of_sale.models');
    var chrome = require('point_of_sale.chrome');
    var screens = require('point_of_sale.screens');
    var ProductCategoriesWidget = screens.ProductCategoriesWidget;	
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
    
	
	/** Extend the SynchNotificationWidget for update cache data */
	chrome.SynchNotificationWidget.include({
		start: function(){
		    	var self = this;
		        this._super();
		        this.$('.product-sync-button').click(function(event){
		        	self.fetch_product_cache_data(event,$(this));
		        });
		        this.$('.partner-sync-button').click(function(event){
		        	self.fetch_partner_cache_data(event,$(this));
		        });
		        this.$('.prod_pricelist-sync-button').click(function(event){
		        	self.fetch_pricelist_cache_data(event,$(this));
		        });
		    },
		    fetch_product_cache_data: function(event, $el) {
		    	var self = this;
		    	self._rpc({
	                model: 'pos.cache.data',
	                method: 'get_product_cache_data',
	                args: [self.pos.pos_session.user_id[0], self.pos.pos_session.config_id[0]],
	            }).then(function (result) {
	            	var products = result['products'];
		    		if(products.length > 0){
		    			ProductListWidget.refresh_product_data(this, products);
		    		}
	            });		    	
		    },
		    fetch_partner_cache_data: function(event, $el) {
		    	var self = this;
		    	self._rpc({
	                model: 'pos.cache.data',
	                method: 'get_partner_cache_data',
	                args: [self.pos.pos_session.user_id[0]],
	            }).then(function (result) {
	            	var partners = result['partners'];
		    		if(partners.length > 0){
		    			ClientListScreenWidget.refresh_partner_data(partners);
		    		}
	            });			    	
		    },
		    fetch_pricelist_cache_data: function(event, $el) {
		    	var self = this;
		    	self._rpc({
	                model: 'pos.cache.data',
	                method: 'get_pricelist_cache_data',
	                args: [self.pos.pos_session.user_id[0], self.pos.pos_session.config_id[0]],
	            }).then(function (result) {
	            	var products = result['products'];
	            	var pricelists = result['pricelists'];
		    		if(products.length > 0){
		    			ProductListWidget.refresh_pricelist_data(this, products, pricelists);
		    		}
	            });	
		    },
	});
	
	/** Extend the ProductCategoriesWidget for update count for cache data */
	screens.ProductCategoriesWidget.include({

	    template: 'ProductCategoriesWidget',
	    init: function(parent, options){
	        var self = this;
	        this._super(parent,options);
	        ProductCategoriesWidget = this;   
	    },
	    cache_data_count: function(){
	    	 var self = this;
	    	 var prod_cache_count = '';
	    	 var partner_cache_count = '';
	    	 var price_cache_count = '';
	    	/** update count for product cache data */
	    	 self._rpc({
	                model: 'pos.cache.data',
	                method: 'product_cache_data_count',
	                args: [self.pos.pos_session.user_id[0]],
	         }).then(function (result) {
	        	   if(result != '0'){
	        		   prod_cache_count = result;
		   			   $('.pos_prod_cache_js_connected').removeClass('oe_green');
		   			   $('.pos_prod_cache_js_connected').addClass('oe_red');
		   			   $('.product_cache_img').attr('src','/skit_pos_cache/static/src/img/product_cache_red.png');
		   		   }else{
		   			   prod_cache_count = '';
		   			   $('.pos_prod_cache_js_connected').removeClass('oe_red');
		   			   $('.pos_prod_cache_js_connected').addClass('oe_green');
		   			   $('.product_cache_img').attr('src','/skit_pos_cache/static/src/img/product_cache_green.png');
		   			   
		   		   }
		   		   $('.pos_prod_cache_js_msg').removeClass('oe_hidden').html(prod_cache_count);
	         });		    	
	    	
	    	 /** update count for partner cache data */
	    	 self._rpc({
	                model: 'pos.cache.data',
	                method: 'partner_cache_data_count',
	                args: [self.pos.pos_session.user_id[0]],
	         }).then(function (result) {
	        	   if(result != '0'){
	        		   partner_cache_count = result;
		   			   $('.pos_partner_cache_js_connected').removeClass('oe_green');
		   			   $('.pos_partner_cache_js_connected').addClass('oe_red');
		   			   $('.partner_cache_img').attr('src','/skit_pos_res_partner/static/src/img/partner_cache_red.png');
		   		   }else{
		   			   partner_cache_count = '';
		   			   $('.pos_partner_cache_js_connected').removeClass('oe_red');
		   			   $('.pos_partner_cache_js_connected').addClass('oe_green');
		   			   $('.partner_cache_img').attr('src','/skit_pos_res_partner/static/src/img/partner_cache_green.png');
		   		   }
		   		   $('.pos_partner_cache_js_msg').removeClass('oe_hidden').html(partner_cache_count);
	         });		    	
	    
	    	 /** update count for product pricelist cache data */
	    	 self._rpc({
	                model: 'pos.cache.data',
	                method: 'pricelist_cache_data_count',
	                args: [self.pos.pos_session.user_id[0]],
	         }).then(function (result) {
	        	  if(result != '0'){
	        		  price_cache_count = result;
		   			   $('.pos_prod_pricelist_cache_js_connected').removeClass('oe_green');
		   			   $('.pos_prod_pricelist_cache_js_connected').addClass('oe_red');
		   			   $('.pricelist_cache_img').attr('src','/skit_pos_pricelist/static/src/img/price_cache_red.png');
		   		   }else{
		   			   price_cache_count = '';
		   			   $('.pos_prod_pricelist_cache_js_connected').removeClass('oe_red');
		   			   $('.pos_prod_pricelist_cache_js_connected').addClass('oe_green');
		   			   $('.pricelist_cache_img').attr('src','/skit_pos_pricelist/static/src/img/price_cache_green.png');
		   		   }
		   		   $('.pos_prod_pricelist_cache_js_msg').removeClass('oe_hidden').html(price_cache_count);
	         });	
	    },
	    renderElement: function(){
	    	  var self = this;
		      this._super();
		      self.cache_data_count();
		     setInterval(function(){ 
		    	 self.cache_data_count();
		    	 
			},600000)
	    },
	});
});
