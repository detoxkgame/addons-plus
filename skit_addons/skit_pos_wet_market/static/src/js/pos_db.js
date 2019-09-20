odoo.define('skit_pos_cache.pos_cache', function(require) {
	"use strict";
	var screens = require('point_of_sale.screens');
	var chrome = require('point_of_sale.chrome');
	var PosBaseWidget = require('point_of_sale.BaseWidget');
	var forms = require('web.FormView');
	var core = require('web.core');
	var Loading = require('web.Loading');
	var models = require('point_of_sale.models');
	var rpc = require('web.rpc');
	
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
	    	this.sorder_by_id = {};
	    	this.sorder_write_date = null;
	    	this.sorder_sorted = [];
	    	this.orderline_by_order = {};
	    	this.sorderline_by_id = {};
	    },
	    
	    add_sorders: function(orders){
	        var updated_count = 0;
	        var new_write_date = '';
	        var order;
	        for(var i = 0, len = orders.length; i < len; i++){
	            order = orders[i];

	            var local_order_date = (this.sorder_write_date || '').replace(/^(\d{4}-\d{2}-\d{2}) ((\d{2}:?){3})$/, '$1T$2Z');
	            var dist_order_date = (order.write_date || '').replace(/^(\d{4}-\d{2}-\d{2}) ((\d{2}:?){3})$/, '$1T$2Z');
	            if (    this.sorder_write_date &&
	                    this.sorder_by_id[order.id] &&
	                    new Date(local_order_date).getTime() + 1000 >=
	                    new Date(dist_order_date).getTime() ) {
	                // FIXME: The write_date is stored with milisec precision in the database
	                // but the dates we get back are only precise to the second. This means when
	                // you read partners modified strictly after time X, you get back partners that were
	                // modified X - 1 sec ago. 
	                continue;
	            } else if ( new_write_date < order.write_date ) { 
	                new_write_date  = order.write_date;
	            }
	            if (!this.sorder_by_id[order.id]) {
	                this.sorder_sorted.push(order.id);
	            }
	            this.sorder_by_id[order.id] = order;

	            updated_count += 1;
	        }

	        this.sorder_write_date = new_write_date || this.sorder_write_date;

	        return updated_count;
	    },
	    get_sorder_write_date: function(){
	        return this.partner_write_date || "1970-01-01 00:00:00";
	    },
	    
	    
	    get_sorder_by_id: function(id){
	        return this.sorder_by_id[id];
	    },
	    
	    get_sorder_sorted: function(max_count){
	        max_count = max_count ? Math.min(this.sorder_sorted.length, max_count) : this.sorder_sorted.length;
	        var orders = [];
	        for (var i = 0; i < max_count; i++) {
	            orders.push(this.sorder_by_id[this.sorder_sorted[i]]);
	        }
	        return orders;
	    },
	    
	    get_orderline_by_order: function(order_id){
	        return this.orderline_by_order[order_id];
	    },
	    add_orderline_by_order: function(order_id, orderline){
	    	if(!this.orderline_by_order[order_id]){
    			this.orderline_by_order[order_id] = [];
            }
	    	var olines = this.orderline_by_order[order_id];
	    	var is_exist = false;
	    	for(var i = 0, len = olines.length; i < len; i++){
	    		
	    		if(olines[i]['id'] == orderline.id){
	    			is_exist = true;
	    		}
	    	}
	    	if(!is_exist){
	    		this.orderline_by_order[order_id].push(orderline);
	    	}
    		
	    },
	    add_orderline: function(orderlines){
	    	for(var i = 0, len = orderlines.length; i < len; i++){
	    		var order_id = orderlines[i].order_id[0];
	    		this.add_orderline_by_order(order_id, orderlines[i])
	    	}
	    },
	    
	});
	return PosDB;
});