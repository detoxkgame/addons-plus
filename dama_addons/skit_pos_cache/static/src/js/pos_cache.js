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
	
	
/** Extend Product List Widget for update products using cache */
	screens.ProductListWidget.include({
	    template: 'ProductListWidget',
	    init: function(parent, options) {
	        var self = this;
	        this._super(parent,options);
	        ProductListWidget = this;
	    },
	    refresh_product_data:function(event, products){
	    	var self = this;
	    	var prod_len = 0;
	    	var update_prod_ids = [];
	    	var prod_list = _.map(products, function (product) {
	    		if(product.categ_id && product.categ_id != undefined){
	    			product.categ = _.findWhere(self.pos.product_categories, {'id': product.categ_id[0]});
	    		}
                return new models.Product({}, product);
            });
	    	//self.pos.db.add_products(prod_list);
	    	for(var i = 0, len = prod_list.length; i < len; i++){
	    		if(prod_list[i].is_create){
	    			var list_container = document.querySelector('.product-list');
	    	    	var product_node = this.render_product(prod_list[i]);
	    	    	self.pos.db.product_by_id[prod_list[i].id] = prod_list[i];
	                product_node.addEventListener('click',this.click_product_handler);
	                list_container.appendChild(product_node);
	                update_prod_ids.push(prod_list[i].id);
	                self.pos.db.add_products([prod_list[i]]);
	                
	    		}else if(prod_list[i].is_delete){
	    			if(document.querySelector("[data-product-id='"+prod_list[i].product_id+"']") != null){
	    				var product_node = $("[data-product-id='"+prod_list[i].product_id+"']");
			    		product_node.replaceWith('');	
			    		delete self.pos.db.product_by_id[prod_list[i].product_id]
			    		update_prod_ids.push(prod_list[i].id);
		                	
	    			}else{
	    				var product_node = document.createElement('div');
		                product_node.innerHTML = '';
		                product_node = product_node.childNodes[1];
		                delete self.pos.db.product_by_id[prod_list[i].product_id]
		                update_prod_ids.push(prod_list[i].id);
	    			}
	    		}
	    		else{
	    			var current_pricelist = this._get_active_pricelist();
	    			var cache_key = this.calculate_cache_key(prod_list[i], current_pricelist);
		    		var product_html = QWeb.render('Product',{ 
		                widget: this, 
		                product: prod_list[i], 
		                pricelist: current_pricelist,
		                image_url: this.get_product_image_url(prod_list[i]),
		            });
		    		
		    		if(document.querySelector("[data-product-id='"+prod_list[i].id+"']") != null){
				    	if(prod_list[i].available_in_pos){
				    		var product_node = $("[data-product-id='"+prod_list[i].id+"']");
				    		product_node.replaceWith($.trim(product_html));		    		
				    		self.pos.db.product_by_id[prod_list[i].id] = prod_list[i];
					    	document.querySelector("[data-product-id='"+prod_list[i].id+"']").addEventListener('click',self.click_product_handler);
					    	var product_node1 = document.querySelector("[data-product-id='"+prod_list[i].id+"']");
					    	this.product_cache.cache_node(cache_key,product_node1);
					    	update_prod_ids.push(prod_list[i].id);
		    			}else{
		    				var product_node = $("[data-product-id='"+prod_list[i].id+"']");
				    		product_node.replaceWith('');	
				    		delete self.pos.db.product_by_id[prod_list[i].id]
				    		update_prod_ids.push(prod_list[i].id);
		    			}
		    		}else{
		    			if(prod_list[i].available_in_pos){
			    			self.pos.db.product_by_id[prod_list[i].id] = prod_list[i];
			    			var product_node = document.createElement('div');
			                product_node.innerHTML = product_html;
			                product_node = product_node.childNodes[1];
			                this.product_cache.cache_node(cache_key,product_node);
			    			update_prod_ids.push(prod_list[i].id);
		    			}else{
		    				var product_node = document.createElement('div');
			                product_node.innerHTML = '';
			                product_node = product_node.childNodes[1];
			                delete self.pos.db.product_by_id[prod_list[i].id]
			                update_prod_ids.push(prod_list[i].id);
		    			}
		    		}
	    		}
	    		prod_len = prod_len + 1;
            }
	    	if(prod_len == products.length){
	    		self._rpc({
	                model: 'pos.cache',
	                method: 'update_product',
	                args: [update_prod_ids, self.pos.pos_session.user_id[0], self.pos.pos_session.config_id[0]],
	            }).then(function (result) {
	            	self._rpc({
		                model: 'pos.cache.data',
		                method: 'clear_product_datas',
		                args: [self.pos.pos_session.user_id[0]],
		            }).then(function (result) {
		            	ProductCategoriesWidget.cache_data_count();
		            	return true;
		            });  
	            });
	    		  	
	    		
	    	}
	    },
	    
	    refresh_pricelist_data:function(event, products, pricelists){
	    	var self = this;
	    	var prod_len = 0;
	    	var update_prod_ids = [];
	    	var update_pricelist_ids = [];
	    	for(var j = 0, len = pricelists.length; j < len; j++){
	    		update_pricelist_ids.push(pricelists[j].id);
	    	}
	    	var prod_list = _.map(products, function (product) {
	    		if(product.categ_id && product.categ_id != undefined){
	    			product.categ = _.findWhere(self.pos.product_categories, {'id': product.categ_id[0]});
	    		}
                return new models.Product({}, product);
            });
			var pListItem = rpc.query({
                model: 'product.pricelist.item',
                method: 'search_read',
                args: [[['pricelist_id','=',1]]],
           });
    		return pListItem.then(function (pricelist_items) {
    			var current_pricelist = self._get_active_pricelist();
    			current_pricelist['items'] = pricelist_items;
		    	for(var i = 0, len = prod_list.length; i < len; i++){
	    			var cache_key = self.calculate_cache_key(prod_list[i], current_pricelist);
		    		var product_html = QWeb.render('Product',{ 
		                widget: self, 
		                product: prod_list[i], 
		                pricelist: current_pricelist,
		                image_url: self.get_product_image_url(prod_list[i]),
		            });
		    		if(document.querySelector("[data-product-id='"+prod_list[i].id+"']") != null){
			    		var product_node = $("[data-product-id='"+prod_list[i].id+"']");
			    		product_node.replaceWith($.trim(product_html));		    		
			    		self.pos.db.product_by_id[prod_list[i].id] = prod_list[i];
				    	document.querySelector("[data-product-id='"+prod_list[i].id+"']").addEventListener('click',self.click_product_handler);
				    	var product_node1 = document.querySelector("[data-product-id='"+prod_list[i].id+"']");
				    	self.product_cache.cache_node(cache_key,product_node1);
				    	update_prod_ids.push(prod_list[i].id);
		    		}
			    	prod_len = prod_len + 1;
		    	}
		    	if(prod_len == products.length){
		    		self._rpc({
		                model: 'pos.cache',
		                method: 'update_product_pricelist',
		                args: [update_prod_ids, self.pos.pos_session.user_id[0], self.pos.pos_session.config_id[0], update_pricelist_ids],
		            }).then(function (result) {
		            	self._rpc({
			                model: 'pos.cache.data',
			                method: 'clear_pricelist_datas',
			                args: [self.pos.pos_session.user_id[0]],
			            }).then(function (result) {
			            	ProductCategoriesWidget.cache_data_count();
			            	return true;
			            });	
		            });
		    		   
		    		
		    	}
    		});
	    },
	    renderElement: function() {
	        var el_str  = QWeb.render(this.template, {widget: this});
	        var el_node = document.createElement('div');
	            el_node.innerHTML = el_str;
	            el_node = el_node.childNodes[1];

	        if(this.el && this.el.parentNode){
	            this.el.parentNode.replaceChild(el_node,this.el);
	        }
	        this.el = el_node;

	        var list_container = el_node.querySelector('.product-list');
	        for(var i = 0, len = this.product_list.length; i < len; i++){
	        	if(this.product_list[i] != null){
	        		var product_node = this.render_product(this.product_list[i]);
	                product_node.addEventListener('click',this.click_product_handler);
	                list_container.appendChild(product_node);
	        	}
	            
	        }
	    },
	});
	
/** Extend Client List Widget for update partner using cache */
	screens.ClientListScreenWidget.include({
	    template: 'ClientListScreenWidget',
	    init: function(parent, options){
	        this._super(parent, options);
	        ClientListScreenWidget = this;
	    },
	    refresh_partner_data:function(partners){
	    	var self = this;
	    	var res_len = 0;
	    	var update_res_ids = [];
	    	for(var i = 0, len = partners.length; i < len; i++){
	    		if(partners[i].is_create){
	    			self.pos.db.partner_by_id[partners[i].id] = partners[i];
	    			update_res_ids.push(partners[i].id);
	    			self.pos.db.add_partners([partners[i]]);
	    			self.saved_client_details(partners[i].id);
	    		}else if(partners[i].is_delete){
	    			var clientline = $(".client-list-contents").find('tr[data-id = '+partners[i].id+']');
	                clientline.replaceWith(clientline_html);
	                delete self.pos.db.add_partners([partners[i]])
	                delete self.pos.db.partner_by_id[partners[i].id]
	                update_res_ids.push(partners[i].id);
	    		}else{
		    		var clientline_html = QWeb.render('ClientLine',{widget: this, partner:partners[i]});
	                var clientline = $(".client-list-contents").find('tr[data-id = '+partners[i].id+']');
	                clientline.replaceWith(clientline_html);
	                self.pos.db.partner_by_id[partners[i].id] = partners[i];
	                self.pos.db.add_partners([partners[i]]);
	                var clientline1 = document.querySelector("tr[data-id='"+partners[i].id+"']");
	                this.partner_cache.cache_node(partners[i].id,clientline1);
	                var curr_client = self.pos.get_order().get_client();
                    if (curr_client) {
                        self.pos.get_order().set_client(self.pos.db.get_partner_by_id(curr_client.id));
                    }
	                update_res_ids.push(partners[i].id);
	    		}
	    		res_len = res_len + 1;
	    	}
	    	if(res_len == partners.length){
	    		self._rpc({
	                model: 'pos.res.partner',
	                method: 'update_partner',
	                args: [update_res_ids, self.pos.pos_session.user_id[0]],
	            }).then(function (result) {
	            	self._rpc({
		                model: 'pos.cache.data',
		                method: 'clear_partner_datas',
		                args: [self.pos.pos_session.user_id[0]],
		            }).then(function (result) {
		            	ProductCategoriesWidget.cache_data_count();
		            	return true;
		            });
	            });
	    		
	    		
	    	}
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