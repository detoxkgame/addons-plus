odoo.define('skit_pos_hotel_management.pos_db', function (require) {
    "use strict";

    var PosDB = require('point_of_sale.DB'); // To extend db.js file 
    var core = require('web.core');
    PosDB.include({
		name: 'openerp_pos_db', //the prefix of the localstorage data
	    limit: 100,  // the maximum number of results returned by a search
	    init: function(options){
	    	this._super(options);
	    	this.dashboardline_by_dashboard = {};
	    	this.vendor_by_category = {};
	    },

	    get_dashboardline_by_dashboard: function(dashboard){
	        return this.dashboardline_by_dashboard[dashboard];
	    },
	    
	    add_dashboard_line: function(dashboards){
	    	for(var i = 0, len = dashboards.length; i < len; i++){
	    		if(!this.dashboardline_by_dashboard[dashboards[i].vendor_dashboard_id[0]]){
	    			this.dashboardline_by_dashboard[dashboards[i].vendor_dashboard_id[0]] = [];
	            }
	    		this.dashboardline_by_dashboard[dashboards[i].vendor_dashboard_id[0]].push(dashboards[i]);
	    	}
	    },
	    
	    get_vendor_by_category: function(category_id){
	    	//console.log('category_id'+ category_id);
	    	//console.log(JSON.stringify(this.vendor_by_category[category_id]));
	        return this.vendor_by_category[category_id];
	    },
	    add_vendor_category: function(category, vendor){
	    	for(var j = 0, len = category.length; j < len; j++){
    			if(!this.vendor_by_category[category[j]]){
	    			this.vendor_by_category[category[j]] = [];
	            }
	    		this.vendor_by_category[category[j]].push(vendor);
	    	}
	    },
	    add_vendor: function(vendors){
	    	for(var i = 0, len = vendors.length; i < len; i++){
	    		var category = vendors[i].category_id;
	    		this.add_vendor_category(category, vendors[i])
	    	}
	    },

	});
	return PosDB;	
});