odoo.define('skit_pos_return.pos_return', function(require) {
	"use strict";
	
	var chrome = require('point_of_sale.chrome');  
	var gui = require('point_of_sale.gui');
	var models = require('point_of_sale.models');
	var screens = require('point_of_sale.screens');
	var OrderWidget = screens.OrderWidget;
	var PopupWidget = require('point_of_sale.popups');
	var ProductListWidget = screens.ProductListWidget;
	var core = require('web.core')
	var QWeb = core.qweb;
	var ActionpadWidget = screens.ActionpadWidget;
	var _t = core._t;
	PopupWidget.include({
		show: function(options){
	        options = options || {};
	        this._super(options);

	        this.renderElement();
	        //this.$('input,textarea').focus();
	        this.$("input:text:visible:first").focus();
	    },
	});
	
	var _super_order = models.Order.prototype;
	models.Order = models.Order.extend({
	    initialize: function() {
	        _super_order.initialize.apply(this,arguments);
	        this.to_invoice =  true;
	    },
	    
	    add_product: function(product, options){
		   	var self = this;
	   		_super_order.add_product.apply(this,arguments);
	   		if(options){
		   		var line = this.get_last_orderline();
		   		if(options.refund_line_id !== undefined){
		        	 line.set_refund_line_id(options.refund_line_id);
		        	 line.set_reason_for_return(options.reason_for_return);
		        }
	   	        this.orderlines.add(line);
	   	        }
	   	},
	    export_for_printing: function(){
	        var json = _super_order.export_for_printing.apply(this,arguments);
	        json.is_refund = this.get_is_refund();
	        return json;
	    },
	    export_as_JSON: function() {
	        var json = _super_order.export_as_JSON.apply(this,arguments);
	        json.is_refund = this.is_refund;
	        return json;
	    },
	    init_from_JSON: function(json) {
	        _super_order.init_from_JSON.apply(this,arguments);
	        this.is_refund = json.is_refund;
	    },
	     /*---- Renewal  --- */
	    set_is_refund: function(is_refund) {
	        this.is_refund = is_refund;
	        this.trigger('change');
	    },
	    get_is_refund: function(){
	        return this.is_refund;
	    },
	});
	
	var _super_orderline = models.Orderline;
	models.Orderline = models.Orderline.extend({
		set_refund_line_id: function(refund_line_id){
	        this.refund_line_id = refund_line_id;
	        this.trigger('change',this);
	    },
	    get_refund_line_id: function(){
	        return this.refund_line_id;
	    },
	    set_reason_for_return: function(reason_for_return){
	        this.reason_for_return = reason_for_return;
	        this.trigger('change',this);
	    },
	    get_reason_for_return: function(){
	        return this.reason_for_return;
	    },
	    clone: function(){
	        var orderline = _super_orderline.clone.call(this);
	        orderline.refund_line_id = this.refund_line_id;
	        orderline.reason_for_return = this.reason_for_return;
	        return orderline;
	    },
	    export_for_printing: function(){
	        var json = _super_orderline.prototype.export_for_printing.apply(this,arguments);
	        json.refund_line_id = this.get_refund_line_id();
	        json.reason_for_return = this.get_reason_for_return();
	        return json;
	    },
	    export_as_JSON: function(){
	        var json = _super_orderline.prototype.export_as_JSON.apply(this,arguments);
	        json.refund_line_id = this.get_refund_line_id(); 
	        json.reason_for_return = this.get_reason_for_return(); 
	        json.tax_ids= [[6, false, _.map(this.get_applicable_taxes(), function(tax){ return tax.id; })]];	       
	        return json;
	    },	    
	    init_from_JSON: function(json){
	        _super_orderline.prototype.init_from_JSON.apply(this,arguments);
	        this.set_refund_line_id(json.refund_line_id);
	        this.set_reason_for_return(json.reason_for_return);
	    },
	    set_refund_line_price: function(rprice){
	        this.rprice = rprice;
	        this.trigger('change',this);
	    },
	    get_refund_line_price: function(){
	        return this.rprice;
	    },
	});
	
	var ScanBarcodeWidget = PopupWidget.extend({
	    template: 'ScanBarcodeWidget',
	    events: _.extend({}, PopupWidget.prototype.events, {
	        'click #scan_confirm': 'confrim_barcode_scan',
	        'change .barcode_no': 'confrim_barcode_scan',
	    }),
	    confrim_barcode_scan: function(e){
	    	var self = this;
	    	var qty = 0;
	    	this.$('.barcode_no').each(function(index, el){
	            var cid = $(el).attr('cid'),
	            barcode_no = 'Order ' + $(el).val();
	            self._rpc({model: 'pos.order', method: 'get_order_details', args: [0, barcode_no], }).then(function(result)
			    	 	{
	            			if(result.state == 'open' || result.state == 'cancel'){
			            	  	if(result.state == 'open'){
				    				self.pos.gui.show_popup('alert',{
					                    'title': 'Warning',
					                    'body': 'Payment not processed, product can’t be return. Please cancel invoice.',                  
					                });
			            		}
			            		if(result.state == 'cancel'){
				    				self.pos.gui.show_popup('alert',{
					                    'title': 'Warning',
					                    'body': 'Invoice status was cancelled, product can’t be return.',                  
					             	});
					             }
			    			}
			            	else{
			            		var lines_array = result.lines;
			            		var qty_value=0;
			            		for(var i=0; i < lines_array.length; i++){
			            			if (lines_array.length > 0){
			            				qty = lines_array[i].quantity;
			            				if (qty>0){ 
			            					qty_value = qty; }
			            			}
			        			}
				    	 		if(lines_array.length > 0  && qty_value > 0){
				    	 			self.pos.get_order().set_client(self.pos.db.get_partner_by_id(lines_array[0].partner));
				    	 			self.pos.gui.show_popup('returnpopup',{
					                    'title': 'Return Products',
					                    'widget': this,
					                    'product_details': lines_array,
					                });
				    	 		}
				    	 		else{
				    	 			self.pos.gui.show_popup('alert',{
					                    'title': 'Warning',
					                    'body': 'There is no return product for this barcode. Given barcode is wrong.',                  
					                });
				    	 		}
			            	}
			    	 	});
	            self.pos.gui.close_popup();
	        });
	    },
	});
	gui.define_popup({name:'scanbarcodepopup', widget: ScanBarcodeWidget});
	
	var ReturnPopupWidget = PopupWidget.extend({
	    template: 'ReturnPopupWidget',
	    events: _.extend({}, PopupWidget.prototype.events, {
	        'click #return_confirm': 'confirm_return',
	        'click #complete_return': 'complete_return',
	    }),
	    complete_return: function(e){
	    	var self = this;
	    	var order = this.pos.get_order();
	    	var name_product1 = [];
	    	var return_error = false;
	    	
		    	$('.get_return_products').each(function() {
			    	var id =  $(this).attr('id');
			    	var quantity = parseInt($('#qty-'+id).val());
			    	var reason = $('#reason_for_return-'+id).val();
			    	var dateorder = ($('#date_order-'+id).val()).slice(0,10).replace(/-/g,'-');
		    		var date_1 = new Date(dateorder);
		    		var date = new Date().toJSON().slice(0,10).replace(/-/g,'-');
		    		var date_2 = new Date(date);
		    		var timeDiff = Math.abs(date_2.getTime() - date_1.getTime());
				    var numberOfDays = Math.ceil(timeDiff / (1000 * 3600 * 24)); 
				    var return_days = $('#return_days-'+id).val();
				    var categ_return_days = $('#categ_return_days-'+id).val();
			    	var return_qty = quantity;
			    	var price = $('#price-'+id).val();
			    	var lot = $('#lot-'+id).val();
			    	var product_id = $('#id-'+id).val();
			    	var discount = $('#discount-'+id).val();
			    	var returnable = $('#returnable-'+id).val();
			    	var product_name = $(this).find('input.product').val();
			    	var product = self.pos.db.get_product_by_id(product_id);
			    	var is_refund = $('#is_refund-'+id).val();
			    	
			    	//To display name of the product
			    	if(((return_days == 'false') && (categ_return_days <= numberOfDays)) || (return_days <= numberOfDays) && product_name){
			   			name_product1.push(product_name);
			    	}
			    	//Return days condition
			    	if(((return_days == 'false') && (categ_return_days <= numberOfDays)) || (return_days <= numberOfDays)){
			    		self.pos.gui.show_popup('alert',{
			    			'title': 'Date Exceeded',
			    			'body': 'The product "' + name_product1 + '" is not returnable. Return date is exceeded.',    
			    		});
			    	}
			    	else if((return_qty != 0) && (return_qty <= quantity) && (is_refund != 'false')){
			    			order.add_product(product, {
			    	    		 merge: false, quantity: (-return_qty), 
			    	    		 //pack_lot_ids: ([0, 0, lot]),
			    	    		 is_refund: true, 
			    	    		 price: price,
			    	    		 lot: lot,
			    	    		 refund_line_id: id, // set_refund_line_id
			    	    		 discount: discount,
			    	    		 returnable: returnable,
			    	    		 reason_for_return: reason,
			    	    	 });
			    	}
		    		else if((return_qty != 0) && (return_qty <= quantity) && (is_refund == 'false')){
		    			order.add_product(product, {
		    	    		 merge: false, quantity: (-return_qty), 
		    	    		 //pack_lot_ids: ([0, 0, lot]),
		    	    		 is_refund: true, 
		    	    		 price: price,
		    	    		 lot: lot,
		    	    		 refund_line_id: id, // set_refund_line_id
		    	    		 discount: discount,
		    	    		 returnable: returnable,
		    	    		 reason_for_return: reason,
		    	    	 });
		    		}
			    	order.set_is_refund(true);
		    	});
	    },
	    confirm_return: function(e){
	    	var self = this;
	    	var order = this.pos.get_order();
	    	var name_product1 = [];
	    	var order_lines_arr=[];
	    	var error = false;
	    	var return_error = false;
	    	
	    	$('.get_return_products').each(function() {
	    		var line_return = false;
	    		var id =  $(this).attr('id');
	    		var product_id = $('#id-'+id).val();
	    		var reason = $('#reason_for_return-'+id).val();
	    		var price = $('#price-'+id).val();
	    		var returnable = $('#returnable-'+id).val();
	    		var product_name = $(this).find('input.product').val();
	    		var dateorder = ($('#date_order-'+id).val()).slice(0,10).replace(/-/g,'-');
	    		var date_1 = new Date(dateorder);
	    		var date = new Date().toJSON().slice(0,10).replace(/-/g,'-');
	    		var date_2 = new Date(date);
	    		var timeDiff = Math.abs(date_2.getTime() - date_1.getTime());
			    var numberOfDays = Math.ceil(timeDiff / (1000 * 3600 * 24)); 
			    var return_days = $('#return_days-'+id).val();
			    var categ_return_days = $('#categ_return_days-'+id).val();
	    		var return_qty = parseInt($('#returnqty-'+id).val());
	    		var quantity = parseInt($('#qty-'+id).val());
	    		var partner = $('#partner-'+id).val();
	    		var discount = $('#discount-'+id).val();
	    		var lot = $('#lot-'+id).val();
	    		var product = self.pos.db.get_product_by_id(product_id);
	    		var is_refund = $('#is_refund-'+id).val();
	    		
	    		//To display name of the product
	    		if(((return_days == 'false') && (categ_return_days <= numberOfDays)) || (return_days <= numberOfDays) && product_name){
	    			name_product1.push(product_name);
		    	}
	    		//Return days condition(only product)
	    		if(return_days <= numberOfDays){
	    			return_error = true;
	    			line_return = true;
	    		}
	    		//Return days condition(no product and has category)
	    		if((return_days == 'false') && (categ_return_days <= numberOfDays)){
	    			return_error = true;
	    			line_return = true;
	    		}
	    		//qty exceed condition
	    		if(return_qty > quantity){
	    			$(".error").css({"display":"block", "height":"9px", "margin-bottom":"3px"});
					error = true;
	    		}
	    		else{
		    		order_lines_arr.push({ 
		    			 product: product,
		    			 merge: false,
		    			 return_qty: return_qty,
		   	    		 quantity: (-return_qty), 
		   	    		 //pack_lot_ids: ([0, 0, lot]),
		   	    		 is_refund: true, 
		   	    		 price: price,
		   	    		 lot: lot,
		   	    		 refund_line_id: id, // set_refund_line_id
		   	    		 discount: discount,
		   	    		 returnable: returnable,
		   	    		 reason_for_return: reason,
		   	    		 error: error,
		   	    		 line_return: line_return,
		    		});
	    		}
	    	});
	    	if(!error){
	    		var len = order_lines_arr.length;
	    		for (var i = 0; i < len; i++)
	    			
	      		{
		      			var line_val = order_lines_arr[i];
		      			if(line_val["return_qty"]>0 && line_val["line_return"] == false){
				    		order.add_product(line_val["product"], {
				    			merge: false,
				    			quantity: line_val["quantity"], 
					    		 //pack_lot_ids: ([0, 0, lot]),
					    		is_refund: true, 
					    		price: line_val["price"],
					    		lot: line_val["lot"],
					    		refund_line_id: line_val["refund_line_id"], // set_refund_line_id
					    		discount: line_val["discount"],
					    		returnable: line_val["returnable"],
					    		reason_for_return: line_val["reason_for_return"],
				    		});
		      			}
	      		}
	    	}
	    	order.set_is_refund(true);
	    	if(!error){
	    		self.gui.close_popup();
	    		if(return_error){
		    		self.pos.gui.show_popup('alert',{
		    			'title': 'Date Exceeded',
		    			'body': 'The product "' + name_product1 + '" is not returnable. Return date is exceeded.',   
		    		});
	    			return false;
		    	}
	    	}
	    	
	    },	    
	});
	gui.define_popup({name:'returnpopup', widget: ReturnPopupWidget});

	chrome.OrderSelectorWidget.include({	
		template : 'OrderSelectorWidget',
		    renderElement: function() {
			        var self = this;
			        this._super();	
			        var order = this.pos.get_order();
		        	var client_check = order.get_client();
		        	var orderline = order.get_orderlines();
				        this.$('.return').click(function(){
				        		self.pos.gui.show_popup('scanbarcodepopup',{
				                    'title': 'Scan Barcode',
				                    'body': 'Please scan the barcode.',	                   
				                });
				        		
				        });
		    },	
	});
	
	screens.PaymentScreenWidget.include({
		finalize_validation: function() {
	        var self = this;
	        var order = this.pos.get_order();

	        if (order.is_paid_with_cash() && this.pos.config.iface_cashdrawer) { 

	                this.pos.proxy.open_cashbox();
	        }

	        order.initialize_validation_date();
	        if (order.is_to_invoice()) {
	            var invoiced = this.pos.push_and_invoice_order(order);
	            this.invoicing = true;

	            invoiced.fail(function(error){
	                self.invoicing = false;
	                if (error.message === 'Missing Customer') {
	                    self.gui.show_popup('confirm',{
	                        'title': _t('Please select the Customer'),
	                        'body': _t('You need to select the customer before you can invoice an order.'),
	                        confirm: function(){
	                            self.gui.show_screen('clientlist');
	                        },
	                    });
	                } else if (error.code < 0) {
	                	// XmlHttpRequest Errors
	                    self.gui.show_popup('error',{
	                        'title': _t('The order could not be sent'),
	                        'body': _t('Check your internet connection and try again.'),
	                    });
	                } else if (error.code === 200) {
	                	// OpenERP Server Errors
	                    self.gui.show_popup('error-traceback',{
	                        'title': error.data.message || _t("Server Error"),
	                        'body': error.data.debug || _t('The server encountered an error while receiving your order.'),
	                    });
	                } else {
	                	// ???
	                    self.gui.show_popup('error',{
	                        'title': _t("Unknown Error"),
	                        'body':  _t("The order could not be sent to the server due to an unknown error"),
	                    });
	                }
	            });

	            invoiced.done(function(){
	                self.invoicing = false;
	                self.gui.show_screen('receipt');
	                var orderno = order.get_name().replace('Order ', '')
	                $('#barcode').barcode(orderno, "code128");
	            });
	        } else {
	            this.pos.push_order(order);
	            this.gui.show_screen('receipt');
	            var orderno = order.get_name().replace('Order ', '')
	            $('#barcode').barcode(orderno, "code128");
	        }

	    },
	});
});