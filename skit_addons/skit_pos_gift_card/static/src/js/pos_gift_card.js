odoo.define('skit_pos_gift_card.pos_gift_card', function (require) {
	"use strict";
	var models = require('point_of_sale.models');
	var screens = require('point_of_sale.screens');
	var core = require('web.core');
	var PopupWidget = require('point_of_sale.popups');
	var utils = require('web.utils');
	var gui = require('point_of_sale.gui');
	var session = require('web.session');
	var _t = core._t;
	var QWeb = core.qweb;
	var ajax = require('web.ajax');
	var ReceiptScreenWidget = screens.ReceiptScreenWidget;
	
	var _super_orderline = models.Orderline;
	models.Orderline = models.Orderline.extend({ 
		init: function(parent,options){
			this.gift_card=false;
			this.gift_card_ids = false;
			this.gift_voucher = false;
			this.gift_voucher_ids = false;
			this.gift_coupon_amount = false;
			this.gift_card_ids_values = false;
	    },
	    set_gift_card: function(gift_card){
	        this.gift_card = gift_card;
	        this.trigger('change',this);
	    },
	    is_gift_card: function(){	
	        return this.gift_card;
	    },	 
	    set_gift_card_ids: function(gift_card_ids){
	        this.gift_card_ids = gift_card_ids;
	        this.trigger('change',this);
	    },
	    get_gift_card_ids_values: function(){
	    	return this.gift_card_ids_values;
	    },
	    set_gift_card_ids_values: function(gift_card_ids){
	        this.gift_card_ids_values = gift_card_ids;
	        this.trigger('change',this);
	    },
	    is_gift_card_ids: function(){	   
	        return this.gift_card_ids;
	    },
	    
	    /**Gift Voucher**/
	    set_gift_voucher: function(gift_voucher){
	        this.gift_voucher = gift_voucher;
	        this.trigger('change',this);
	    },
	    is_gift_voucher: function(){
	        return this.gift_voucher;
	    },	 
	    set_gift_voucher_ids: function(gift_voucher_ids){
	        this.gift_voucher_ids = gift_voucher_ids;
	        this.trigger('change',this);
	    },
	    get_gift_voucher_ids_values: function(){
	    	return this.gift_voucher_ids_values;
	    },
	    set_gift_voucher_ids_values: function(gift_voucher_ids){
	        this.gift_voucher_ids_values = gift_voucher_ids;
	        this.trigger('change',this);
	    },
	    is_gift_voucher_ids: function(){	   
	        return this.gift_voucher_ids;
	    },	
	    set_gift_coupon_amount: function(amount){
	    	this.gift_coupon_amount = amount;
	    	this.trigger('change',this);
	    },
	    get_gift_coupon_amount: function(){
	    	return this.gift_coupon_amount;
	    },
	    clone: function(){
	        var orderline = _super_orderline.clone.call(this); 
	        orderline.gift_card = this.is_gift_card();
	        orderline.gift_voucher = this.is_gift_voucher();
	        var json = self.export_as_JSON(); 
	        return orderline;
	    },
	
	    export_as_JSON: function(){
	    	var gift_card_ids = [];
	    	var gift_voucher_ids = [];
	        var json = _super_orderline.prototype.export_as_JSON.apply(this,arguments);
	        json.gift_card = this.is_gift_card();
	        json.gift_card_ids = this.is_gift_card_ids();
	        json.gift_voucher = this.is_gift_voucher();
	        json.gift_voucher_ids = this.is_gift_voucher_ids();
	        return json;
	    },
	
	    init_from_JSON: function(json){
	    	var gift_card_ids = [];
	        _super_orderline.prototype.init_from_JSON.apply(this,arguments);
	        this.set_gift_card(json.gift_card);
	        this.set_gift_card_ids(json.gift_card_ids);
	        this.set_gift_card_ids_values(json.gift_card_ids_values);
	        this.set_gift_voucher(json.gift_voucher);
	        this.set_gift_voucher_ids(json.gift_voucher_ids);
	        this.set_gift_voucher_ids_values(json.gift_voucher_ids_values);
	    },
	});
	
	/*Product added to cart*/
	var _super_order = models.Order.prototype;
	models.Order = models.Order.extend({
		
		set_pricelist: function (pricelist) {
	        var self = this;
	    	//_super_order.set_pricelist.apply(this,arguments);
	        this.pricelist = pricelist;
	        
	        var lines_to_recompute = _.filter(this.get_orderlines(), function (line) {
	            return ! line.price_manually_set;
	        });
	        _.each(lines_to_recompute, function (line) {
	        	if(line.is_gift_voucher() == true && line.is_gift_card() != true){
		            line.set_unit_price(line.product.get_price(self.pricelist, line.get_quantity()));
		            self.fix_tax_included_price(line);
	        	}
	        });
	        this.trigger('change');
    },
	
	add_product: function(product, options){
		   	var self = this;
	   		_super_order.add_product.apply(this,arguments);
	   		if(options){
		   		var line = this.get_last_orderline();
		   	     if(options.gift_card_ids !== undefined ){
		   	       	 line.set_gift_card_ids(options.gift_card_ids);
		   	       }
		   	     if(options.gift_voucher_ids !== undefined ){
		   	       	 line.set_gift_voucher_ids(options.gift_voucher_ids);
		   	       }
	   	        this.orderlines.add(line);
	   	        }
	   	},
	   	/*while click on Edit icon value get set*/
		display_gift_popup: function() {
		    var order_line = this.get_selected_orderline();
		    var is_edit = false;
		    var is_error=false;
		    var other_error = false;
		    if(order_line!=undefined){
		    	
		    		if(order_line.gift_card_ids !=undefined && order_line.gift_card_ids.length > 0)
		    				{is_edit = true;}
		    			is_error = order_line.gift_card_ids[0][2].error;
		    }
		    if (order_line){
		        if(order_line.gift_card_ids !=undefined)
		        { 
		        	this.pos.gui.show_popup('gift', {
		        'title': _t('Gift Card'),
		        'gift_card_ids': order_line.gift_card_ids,
		        'gift_to':order_line.gift_card_ids[0][2].gift_to,
		        'gift_from':order_line.gift_card_ids[0][2].gift_from,
		        'quantity': order_line.quantity,
		        'gift_message': order_line.gift_card_ids[0][2].gift_message,
		        'price': order_line.gift_card_ids[0][2].price,
		        'other_amount':order_line.gift_card_ids[0][2].other_amount,
		        'total_amount': order_line.quantity * order_line.gift_card_ids[0][2].price,
		        'is_edit': is_edit,
		        'in_gf_amt': order_line.gift_card_ids[0][2].price,
		        'order': this,
		        'is_error':is_error,
		        'other_error':other_error
		        
		    });}
		    else{
		    	this.pos.gui.show_popup('gift', {
		            'title': _t('Gift Card'),
		            'order': this,});
		        }
		    }
		   
		    },
	}); 
	
	/*Gift Card Button in POS*/
	var GiftCardButton = screens.ActionButtonWidget.extend({
		template : 'GiftCardButton',
		button_click : function() {
			var self = this;
			if(this.pos.config.gift_product_id !=undefined)
			{
				var is_gift_product_available = this.pos.config.gift_product_id[0];
				if (is_gift_product_available!=undefined && is_gift_product_available)
					{ 
						var order = self.pos.get_order();
						if(order.get_client()){
							var gift_products=[];
										var product_id = this.pos.config.gift_product_id[0];
										var gift_product = self.pos.db.get_product_by_id(product_id);
										 gift_products.push([0,0,{'gift_card_number':'',
											'date':'',
											'customer':'',
											'gift_to':'',
											'gift_from':'',
											'gift_message':'',
											'gift_qty':1,
											'price':500,
											'other_amount':'',
											'total_amount':'',
											'session_id':'',
											'barcode':'',
												}]);
										if(gift_product!=undefined)
										{
											order.add_product(gift_product, {
											price: 500, 
											quantity: 1,
											gift_card: true,
											gift_card_ids: gift_products,
											merge: false,
										});
										self.gui.show_popup('gift', {
											'title' : 'Gift Card',
											'quantity':1,
							                'in_gf_amt': 500,
							               'total_amount':500,
										});}
										else{
											this.pos.gui.show_popup('alert',{
								                'title': 'Error',
								                'body': 'Please ensure that "Gift Card" is "Available in Point of sale"'
								                	+'\n and check whether Gift Product is selected or not in POS terminal',		                	
								                
											});
									}
								}
							else{
								self.gui.show_popup('confirm',{
							        'title': _t('Please select the Customer'),
							        'body': _t('You need to select the customer before you proceed.'),
							            confirm: function(){
							           	 this.pos.gui.show_screen('clientlist');
							            },
							    });
								}
							}
						}	
					else{
						this.pos.gui.show_popup('alert',{
			                'title': 'Error',
			                'body': 'Please ensure that "Gift Card" is "Available in Point of sale"'
			                	+'\n and check whether Gift Product is selected or not ',		                	
			                
						});
				}
		
		},
	});
	screens.define_action_button({'name' : 'giftcard', 'widget' : GiftCardButton,});
	
	/*Manage Gift Coupon*/
	var RedeemGiftCardButton = screens.ActionButtonWidget.extend({
		template : 'RedeemGiftCardButton',
		button_click : function() {
			var self = this;
			var order = self.pos.get_order();
			//if(order.get_client()){
				self.gui.show_popup('managecard', {
					'title' : 'Redeem Gift Coupon',
				});
			//}
			/*else{
				self.gui.show_popup('confirm',{
			        'title': _t('Please select the Customer'),
			        'body': _t('You need to select the customer before you proceed.'),
			            confirm: function(){
			           	 this.pos.gui.show_screen('clientlist');
			            },
			    });
				}*/
		
		},
	});
	screens.define_action_button({'name' : 'managecard', 'widget' : RedeemGiftCardButton,});
	
	var ManageCard = PopupWidget.extend({
		template : 'ManageCard',
		events: _.extend({}, PopupWidget.prototype.events, {
			'click .redeem': 'confirm',
			'keyup #coupon_value': 'display_amount'
		}),
		display_amount: function(){
			var self = this;
	    	this.$('#coupon_value').each(function(index, el){
	            var cid = $(el).attr('cid'),
	            code = $(el).val();
	            self._rpc({
	                model: 'skit.pos.gift.card',
	                method: 'get_amount',
	                args: [0, code],
	            }).then(function(result){
						var avail_amount = "Available amount:" + result
						$('#amt').text(avail_amount);
				});
	        });
		},
		confirm: function(ev){
			var self = this;
			var order =this.pos.get_order();
			var oLine = order.get_selected_orderline();
			if(oLine){
				this.$('#coupon_amount').each(function(index, el){
		    		var cid = $(el).attr('cid');
		    		var coupon_amount = $(el).val();
		    		order.get_selected_orderline().set_gift_coupon_amount(coupon_amount);
		    	});
				var coupon_amt = order.get_selected_orderline().get_gift_coupon_amount();
				this.$('#coupon_value').each(function(index, el){
		            var cid = $(el).attr('cid'),
		            code = $(el).val();
		            self._rpc({
		                model: 'skit.pos.gift.card',
		                method: 'get_product',
		                args: [0, code, coupon_amt],
		            }).then(function(result){
								if(result['product']){
									if(result['voucher_exist'] == false){
										var voucher = self.pos.db.get_product_by_id(result['product']);
										var gift_coupons=[];
										gift_coupons.push([0,0,{
											'voucher_code': code,
											'amount': coupon_amt,
											'voucher_value': -(coupon_amt),
											'transaction_type': 'debit',
											'gift_card': result['gift_card']
												}]);
										order.add_product(voucher, {
											price: -(coupon_amt), 
											quantity: 1,
											gift_voucher: true,
											gift_voucher_ids: gift_coupons,
											merge: false,
										});
										oLine.set_gift_voucher(true);
									}
									else{
										self.gui.show_popup('alert', {
											'title' : 'Redeem Gift Coupon',
											'body': 'Error..!!! Voucher does not exist.',
										});
									}
								}
								else{
									self.gui.show_popup('alert', {
										'title': 'Warning !!!!',
										'body': 'Please ensure that "Gift Voucher" is "Available in Point of sale"'
						                	+'\n Is not please create new product as "Gift Voucher" and make it as available in POS.',	
									});
								}
								
								
					});
		        });
			}
			else{
				self.gui.show_popup('error', {
					'title': 'Error !!!!',
	                'body': 'Sorry there is no product in orderline',
				});
			}
			
		},
		
	});
	gui.define_popup({name : 'managecard', widget : ManageCard});
	
	 /*Edit icon in orderwidget*/
	screens.OrderWidget.include({
		template:'OrderWidget',
		render_orderline: function(orderline) {
			var self = this;
	        var el_node = this._super(orderline);
	        var el_edit_icon = el_node.querySelector('.line-edit-icon');
	        if(el_edit_icon){
	        	el_edit_icon.addEventListener('click', (function() {
	                this.show_gift_popup(orderline);
	            }.bind(this)));
	        }
	        return el_node;
	    },
	    show_gift_popup: function(orderline){
	        this.pos.get_order().select_orderline(orderline);
	        var order = this.pos.get_order();
	        order.display_gift_popup();
	    },
	});
	/* Amount button action*/
	var GiftCard = PopupWidget.extend({
		template : 'GiftCard',
		events: _.extend({}, PopupWidget.prototype.events, {
			'click .btn-first': 'set_btn_first',
			'click .btn-sec': 'set_btn_sec',
			'click .btn-third':'set_btn_third',
			'change .other_amount':'set_other_amount',
			'click .gift_confrim': 'button_confirm',
			'change .gift_qty': 'set_gift_qty',
			'click .gift_qty': 'onedit_gift_qty' 
			
		}),
		set_btn_first: function(){
			var gift_qty = $('.gift_qty').val();
			var in_gf_amt = $('.btn-first').val();
			var gift_amount = 0;
			if(gift_qty){
				gift_amount = gift_qty *in_gf_amt;
			}
			else{
				gift_amount = in_gf_amt
			}
			document.getElementById("gift_amount").innerHTML = gift_amount;
			document.getElementById("in_gf_amt").value = in_gf_amt;
			$(".other_amount").val("");
		},
		set_btn_sec: function(){
			var gift_qty = $('.gift_qty').val();
			var in_gf_amt = $('.btn-sec').val();
			var amt = 0;
			if(gift_qty){
				amt = gift_qty *in_gf_amt;
			}
			else{
				amt = in_gf_amt
			}
			document.getElementById("gift_amount").innerHTML = amt;
			document.getElementById("in_gf_amt").value = in_gf_amt;	
			$(".other_amount").val("");
			
		},
		set_btn_third: function(){
			var gift_qty = $('.gift_qty').val();
			var in_gf_amt = $('.btn-third').val();
			var amt = 0;
			if(gift_qty){
				amt = gift_qty *in_gf_amt;
			}
			else{
				amt = in_gf_amt
			}
			document.getElementById("gift_amount").innerHTML = amt;
			document.getElementById("in_gf_amt").value = in_gf_amt;	
			$(".other_amount").val("");
		},
		set_other_amount: function(){
			var gift_qty = $('.gift_qty').val();
			var in_gf_amt = $('.other_amount').val();
			var amt = 0;
			if(gift_qty){
				amt = gift_qty *in_gf_amt;
			}
			else{
				amt = in_gf_amt
			}
			document.getElementById("gift_amount").innerHTML = amt;
			document.getElementById("in_gf_amt").value = in_gf_amt;
		},
		set_gift_qty: function(){
			
			var gift_qty = $('.gift_qty').val();
			var in_gf_amt = $('.in_gf_amt').val();
			var amt = 0;
			if(gift_qty){
				amt = gift_qty * in_gf_amt;
			}
			else{
				amt = 0
			}
		
			document.getElementById("gift_amount").innerHTML = amt;		
			document.getElementById("in_gf_amt").value = in_gf_amt;
		},
		onedit_gift_qty: function(){
	    	$(".gift_qty").attr('required',false);
	    	$(".gift_qty").css({"outline":"none", "box-shadow": "0px 0px 0px 3px #6EC89B"});  
	    	$(".gift_qty-error").css({"display":"none"}); 
	    },
		button_confirm: function(ev){
			var self = this;
			var is_error = false;
			var other_error = false;
			var gift_card_ids;
			var order =this.pos.get_order();
			var oLine = order.get_selected_orderline();
			var gift_qty = $('.gift_qty').val();
			var gift_amount = $('#gift_amount').val();
			var in_gf_amt = $('.in_gf_amt').val();
			var gift_products =[];
				var text = "";
				var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
				for (var i = 0; i < 13; i++)
					text += possible.charAt(Math.floor(Math.random() * possible.length));
							var product_id = this.pos.config.gift_product_id[0];
							var gift_product = self.pos.db.get_product_by_id(product_id);
							var order = self.pos.get_order();
							var oLine = order.get_selected_orderline();
							var gift_products = [];
							var gift_coupons = [];
							var gift_card_number = text; 
							var date = new Date().toJSON().slice(0,10).replace(/-/g,'-');
							var customer = order.get_client().id;
							var gift_to = $(".gift-to").val();
							var gift_from = $(".gift-from").val();
							var gift_message = $(".gift-msg").val();
							var gift_qty = $(".gift_qty").val();
							var price = $(".in_gf_amt").val();
							var other_amount = $(".other_amount").val();
							var total_amount = $("#gift_amount").text();
							var session_id = self.pos.pos_session.id
							var barcode = text;
							if(gift_qty=="" && other_amount==""){
								is_error=true;
								other_error = false;
							}
							if(other_amount == 0 && other_amount!=""){
								other_error=true;
								is_error=false;
								gift_products.push([0,0,{
									'gift_card_number':gift_card_number,
									'date':date,
									'customer':customer,
									'gift_to':gift_to,
									'gift_from':gift_from,
									'gift_message':gift_message,
									'gift_qty':gift_qty,
									'price':price,
									'other_amount':other_amount,
									'total_amount':total_amount,
									'session_id':session_id,
									'barcode':barcode,
									'is_error':is_error,
									'other_error':other_error
										}]);
								gift_coupons.push([0,0,{
									'voucher_code': barcode,
									'amount': total_amount,
									'voucher_value': total_amount,
									'transaction_type': 'credit'
										}]);
								oLine.set_gift_card_ids_values(oLine.gift_products);
								oLine.set_gift_voucher_ids_values(oLine.gift_coupons);
								var is_edit = $(".is-edit").val();
								oLine.set_gift_card_ids(gift_products);
								oLine.set_gift_voucher_ids(gift_coupons);
								oLine.set_gift_card(true);
								oLine.set_gift_voucher(true);
								oLine.set_quantity(gift_qty);
								oLine.set_unit_price(in_gf_amt); 
							}
							if(gift_qty > 0 && (total_amount > 0)){
									gift_products.push([0,0,{'gift_card_number':gift_card_number,
										'date':date,
										'customer':customer,
										'gift_to':gift_to,
										'gift_from':gift_from,
										'gift_message':gift_message,
										'gift_qty':gift_qty,
										'price':price,
										'other_amount':other_amount,
										'total_amount':total_amount,
										'session_id':session_id,
										'barcode':barcode,
										'is_error':is_error,
										'other_error':other_error
											}]);
									gift_coupons.push([0,0,{
										'voucher_code': barcode,
										'amount': total_amount,
										'voucher_value': total_amount,
										'transaction_type': 'credit'
											}]);
									oLine.set_gift_card_ids_values(oLine.gift_products);
									oLine.set_gift_voucher_ids_values(oLine.gift_coupons);
									var is_edit = $(".is-edit").val();
										oLine.set_gift_card_ids(gift_products);
										oLine.set_gift_voucher_ids(gift_coupons);
										oLine.set_gift_card(true);
										oLine.set_gift_voucher(true);
										oLine.set_quantity(gift_qty);
										oLine.set_unit_price(in_gf_amt); 
							  }
							if(is_error == true){
								order.display_gift_popup();
								is_error = true; 
						    		$(this).find(".other_amount").attr('required',true);
						    		$(".other_amount").css({"outline":"none", "box-shadow": "0px 0px 0px 1px #ff0000"}); 
						    		$(".other_amount-error").css({"display":"block"});
						    		$(".error").css({"display":"block"});
							}
							if(other_error == true){
								order.display_gift_popup();
								other_error = true;
								$(".other_amount").css({"outline":"none", "box-shadow": "0px 0px 0px 1px #ff0000"});
								$(".zero_error").css({"display":"block"});
							}
			},
			click_cancel: function(){
				var self = this;
				var order =this.pos.get_order();
				var oLine = order.get_selected_orderline();
				var gift_ids = oLine.is_gift_card();
				var total_amount = $("#gift_amount").text();
				if((!gift_ids) || (total_amount == 0)){
					order.remove_orderline(oLine);
				}
				self.gui.close_popup();
			},
	});
	models.load_models([ {
		model : 'skit.pos.gift.card',
		condition : function(self) {
			return !!self.config;
		},
		loaded : function(self, gifts) {
			self.gift = gifts[0];
		},
	}, ]);
	gui.define_popup({name : 'gift', widget : GiftCard});
	
	
	/*Gift Card Button in POS Receipt Screen */
	var ReceiptScreenWidget = screens.ReceiptScreenWidget.extend({
	    template: 'ReceiptScreenWidget',
	    renderElement: function() {
	        var self = this;
	        this._super();
	        this.$('.button.gift_card_template').click(function(){
	            if (!self._locked) {
	                self.giftcard();
	            }
	        });
	    },
	   /* Gift Card Button action*/
	    giftcard: function(){
			var self = this;
			var order  = this.pos.get_order()
			self._rpc({
                model: 'skit.pos.gift.card',
                method: 'invoice_print',
                args: [0, order.name],
            }).then(function(result){
						var gift_card_id = result['gift']
						if(gift_card_id){
							self.chrome.do_action('skit_pos_gift_card.greeting',
									{additional_context:{active_ids:[gift_card_id]}
									});
						}
						else{
							self.gui.show_popup('alert',{
								'title': _t('Warning'),
								'body': _t('No records found.'),
							});
						}
						
			});
		},
	});
	gui.define_screen({name:'receipt', widget: ReceiptScreenWidget});
});
