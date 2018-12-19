odoo.define('skit_pos_hotel_management.pos_model',function(require){
    "use strict";
    
	var models = require('point_of_sale.models');
	var screens = require('point_of_sale.screens');
	var gui = require('point_of_sale.gui');
	var core = require('web.core');
	var PopupWidget = require('point_of_sale.popups');
	var _t  = core._t;
	var QWeb = core.qweb;
	
	models.load_models([
					/*{
					    model:  'res.partner.category',
					    fields: ['name'],
					    loaded: function(self,partner_category){
					    	 self.partner_category = partner_category;
					    },
					 },*/
	       	         {
	            		    model:  'hm.vendor.dashboard',
	            	        fields: ['vendor_category_id', 'sequence','vendor_category_ids', 'color', 'name'],
	            	        order:  _.map(['sequence','name'], function (name) { return {name: name}; }),
	            	        loaded: function(self,vendor_dashboard){
	            	        	 self.vendor_dashboard = vendor_dashboard;
	            	        },
	       	          },
	       	          
	       	          {
	            		    model:  'hm.vendor.dashboard.line',
	            	        fields: ['dashboard_menu', 'vendor_dashboard_id'],
	            	        loaded: function(self,vendor_dashboard_line){
	            	        	 self.vendor_dashboard_line = vendor_dashboard_line;
	            	        	 self.db.add_dashboard_line(vendor_dashboard_line);
	            	        },
	       	          },
	       	          {
	            		    model:  'hm.form.template',
	            	        fields: ['name', 'form_model_id','vendor_dashboard_id', 'vendor_dashboard_line_id'],          	       
	            	        loaded: function(self,form_template){
	            	        	 self.form_template = form_template;
	            	        },
	       	          },
	       	          
	       	          {
	            		    model:  'hm.form.template.line',
	            	        fields: ['form_label', 'form_field_id','form_field_type','sameline','isMandatory',
	            	                 'sequence','form_template_id','form_placeholder','font_size','font_style','font_family','name','form_template_selection_fields'],
	            	        order:  _.map(['sequence','name'], function (name) { return {name: name}; }),
	            	        loaded: function(self,form_template_line){
	            	        	 self.form_template_line = form_template_line;
	            	        	// self.db.add_dashboard_line(vendor_dashboard_line);
	            	        },
	       	          },
	       	          {
	            		    model:  'hm.form.selection.item',
	            	        fields: ['name', 'value',],          	       
	            	        loaded: function(self,selection_items){
	            	        	 self.selection_items = selection_items;
	            	        },
	       	          },
		       	      {
		       	           model:  'res.partner',
		       	           fields: ['name','street','city','state_id','country_id','vat',
		       	                    'phone','zip','mobile','email','barcode','write_date',
		       	                    'property_account_position_id','property_product_pricelist','category_id'],
		       	           domain: [['supplier','=',true]],
		       	           loaded: function(self,vendors){
		       	               self.vendors = vendors;
		       	               self.db.add_vendor(vendors);
		       	           },
		       	       },
	       	          
	           ]);
	
});