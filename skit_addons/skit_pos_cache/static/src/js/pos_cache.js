odoo.define('skit_pos_cache.pos_cache', function(require) {
	"use strict";
	var screens = require('point_of_sale.screens');
	var chrome = require('point_of_sale.chrome');
	var PosBaseWidget = require('point_of_sale.BaseWidget');
	var forms = require('web.FormView');
	var core = require('web.core');
	var ProductListWidget = screens.ProductListWidget;
	var ClientListScreenWidget = screens.ClientListScreenWidget;
	var Loading = require('web.Loading');
	var models = require('point_of_sale.models');
	var rpc = require('web.rpc');
	var ProductCategoriesWidget = screens.ProductCategoriesWidget;	
	
	var _t = core._t;
	var _lt = core._lt;
	var QWeb = core.qweb;
	
	var exports = {};
	
	var PosDB = require('point_of_sale.DB'); // To extend db.js file 
	
	PosDB.include({
		name: 'openerp_pos_db', //the prefix of the localstorage data
	    limit: 100,  // the maximum number of results returned by a search
	    init: function(options){
	    	this._super(options);
	    },
	    
	    get_product_by_category: function(category_id){
	        var self = this;
	        this._super(category_id);
	        var product_ids  = this.product_by_category_id[category_id];
	        var list = [];
	        if (product_ids) {
	            for (var i = 0, len = Math.min(product_ids.length, this.limit); i < len; i++) {
	            	if(this.product_by_id[product_ids[i]] && this.product_by_id[product_ids[i]] != undefined)
	            		list.push(this.product_by_id[product_ids[i]]);
	            }
	        }
	        return list;
	    },
	    get_partners_sorted: function(max_count){
	    	this._super(max_count);
	        max_count = max_count ? Math.min(this.partner_sorted.length, max_count) : this.partner_sorted.length;
	        var partners = [];
	        for (var i = 0; i < max_count; i++) {
	        	if(this.partner_by_id[this.partner_sorted[i]] && this.partner_by_id[this.partner_sorted[i]] != undefined){
	        		partners.push(this.partner_by_id[this.partner_sorted[i]]);
	        	}
	            
	        }
	        return partners;
	    },
	});

});