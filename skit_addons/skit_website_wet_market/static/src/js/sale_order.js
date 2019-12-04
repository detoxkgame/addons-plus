odoo.define('skit_website_wet_market.SaleOrder.instance', function (require) {
"use strict";

var core = require('web.core');
var _t = core._t;
var sAnimations = require('website.content.snippets.animation');
var ProductConfiguratorMixin = require('sale.ProductConfiguratorMixin');
require('web.dom_ready');
require('website_sale.website_sale');
var ajax = require('web.ajax');
var OptionalProductsModal = require('sale.OptionalProductsModal');
var OptionalShopProductsModal = require('skit_website_wet_market.OptionalProductsModalTest');

setInterval(function(){ 
	var url = window.location.href;
	var order = url.match(/my\/orders\/([0-9]+)/);
	if(order != null){
		var order_id = order[1];
		var url = "/sorder/" + parseInt(order_id);
        ajax.jsonRpc(url, 'call', {}).then(function (data) {
        	if(data['state'] == "sale"){
        		$('#sale_confirm').removeClass("border-gray");
        		$('#sale_confirm').addClass("border-green");
        		$('#sale_confirm').find("span").removeClass("border-gray-span");
        		$('#sale_confirm').find("span").addClass("border-green-span");
        		$('#sale_confirm_img').attr('src','/skit_website_wet_market/static/src/img/confirmed_green.png');
        		$('#msale_confirm_img').attr('src','/skit_website_wet_market/static/src/img/confirmed_green.png');
        		$('.icon_confirm').addClass("active_back");
        		$('.conf_vertical_ln').addClass("active_ln");
        		window.location.href="/my/invoices/"+data['invoice']
        	}
        	else if(data['state'] == "preparing"){
        		$('#sale_preparing').removeClass("border-gray");
        		$('#sale_preparing').addClass("border-green");
        		$('#sale_preparing').find("span").removeClass("border-gray-span");
        		$('#sale_preparing').find("span").addClass("border-green-span");
        		$('#sale_preparing_img').attr('src','/skit_website_wet_market/static/src/img/preparing_green.png');
        		$('#msale_prepare_img').attr('src','/skit_website_wet_market/static/src/img/preparing_green.png');
        		$('.icon_preparing').addClass("active_back");
        		$('.prepare_vertical_ln').addClass("active_ln");
        	}
        	else if(data['state'] == "ready"){
        		$('#sale_ready').removeClass("border-gray");
        		$('#sale_ready').addClass("border-green");
        		$('#sale_ready').find("span").removeClass("border-gray-span");
        		$('#sale_ready').find("span").addClass("border-green-span");
        		$('#sale_ready_img').attr('src','/skit_website_wet_market/static/src/img/ready_green.png');
        		$('#msale_ready_img').attr('src','/skit_website_wet_market/static/src/img/ready_green.png');
        		$('.icon_ready').addClass("active_back");
        		$('.ready_vertical_ln').addClass("active_ln");
        	}
        	else if(data['state'] == "delivered" || data['state'] == "payment"){
        		$('#sale_delivered').removeClass("border-gray");
        		$('#sale_delivered').addClass("border-green");
        		$('#sale_delivered').find("span").removeClass("border-gray-span");
        		$('#sale_delivered').find("span").addClass("border-green-span");
        		$('#sale_delivered_img').attr('src','/skit_website_wet_market/static/src/img/delivered_green.png');
        		$('#msale_deliver_img').attr('src','/skit_website_wet_market/static/src/img/delivered_green.png');
        		$('.icon_delivered').addClass("active_back");
        	}
        	else if(data['state'] == "cancel"){
        		alertify.alert('Warning','Your order cancelled.')
				  .setting({
				    'label':'Goto Shop',
				    'onok': function(){ window.location="/shop";}
				  }).show();
        	}
        });
	}
	
	var invoice_url = window.location.href;
	var invoice = invoice_url.match(/my\/invoices\/([0-9]+)/);
	if(invoice != null){
		var invoice_id = invoice[1];
		var url = "/sorder/invoice/" + parseInt(invoice_id);
        ajax.jsonRpc(url, 'call', {}).then(function (data) {
        	if(data['state'] == "sale"){
        		$('#sale_confirm').removeClass("border-gray");
        		$('#sale_confirm').addClass("border-green");
        		$('#sale_confirm').find("span").removeClass("border-gray-span");
        		$('#sale_confirm').find("span").addClass("border-green-span");
        		$('#sale_confirm_img').attr('src','/skit_website_wet_market/static/src/img/confirmed_green.png');
        		$('#msale_confirm_img').attr('src','/skit_website_wet_market/static/src/img/confirmed_green.png');
        		$('.icon_confirm').addClass("active_back");
        		$('.conf_vertical_ln').addClass("active_ln");
        		//window.location.href="/my/invoices/"+data['invoice']
        	}
        	else if(data['state'] == "preparing"){
        		$('#sale_preparing').removeClass("border-gray");
        		$('#sale_preparing').addClass("border-green");
        		$('#sale_preparing').find("span").removeClass("border-gray-span");
        		$('#sale_preparing').find("span").addClass("border-green-span");
        		$('#sale_preparing_img').attr('src','/skit_website_wet_market/static/src/img/preparing_green.png');
        		$('#msale_prepare_img').attr('src','/skit_website_wet_market/static/src/img/preparing_green.png');
        		$('.icon_preparing').addClass("active_back");
        		$('.prepare_vertical_ln').addClass("active_ln");
        	}
        	else if(data['state'] == "ready"){
        		$('#sale_ready').removeClass("border-gray");
        		$('#sale_ready').addClass("border-green");
        		$('#sale_ready').find("span").removeClass("border-gray-span");
        		$('#sale_ready').find("span").addClass("border-green-span");
        		$('#sale_ready_img').attr('src','/skit_website_wet_market/static/src/img/ready_green.png');
        		$('#msale_ready_img').attr('src','/skit_website_wet_market/static/src/img/ready_green.png');
        		$('.icon_ready').addClass("active_back");
        		$('.ready_vertical_ln').addClass("active_ln");
        	}
        	else if(data['state'] == "delivered" || data['state'] == "payment"){
        		$('#sale_delivered').removeClass("border-gray");
        		$('#sale_delivered').addClass("border-green");
        		$('#sale_delivered').find("span").removeClass("border-gray-span");
        		$('#sale_delivered').find("span").addClass("border-green-span");
        		$('#sale_delivered_img').attr('src','/skit_website_wet_market/static/src/img/delivered_green.png');
        		$('#msale_deliver_img').attr('src','/skit_website_wet_market/static/src/img/delivered_green.png');
        		$('.icon_delivered').addClass("active_back");
        	}
        });
	}
	
	}, 3000);

	$(document).ready(function(){

		$(".grid_attribute_value").chosen({
			  width:'100%',
			  enable_search_threshold : 10
		});
		
		$('.grid_attribute').on('change', function(ev){
				var self = $(this);
		    	var attribute_id = $(this).val();
		    	var prod_id = $(this).closest('tr').attr('id');
		    	var attr_post = {};
		    	attr_post['prod_id'] = prod_id;
		    	attr_post['attribute_id'] = attribute_id;
		    	ajax.jsonRpc('/grid_product/attribute/values', 'call', attr_post).then(function (result) {
		    		self.closest('tr').find("#grid_attribute_value_chosen").remove();
		    		self.closest('tr').find("#grid_attribute_value").replaceWith(result);
		    		self.closest('tr').find("#grid_attribute_value").chosen({
		  			  width:'100%',
		  			  enable_search_threshold : 10
		  		    });
		    	});
		});
		
		$("#all_products").change(function(){  //"select all" change
			var table= $(this).closest('table');
			$('td input:checkbox',table).prop('checked', $(this).prop("checked")); //change all ".checkbox" checked status
		});
		$('.product_row').change(function(){ 
			//uncheck "select all", if one of the listed checkbox item is unchecked
		    if(false == $(this).prop("checked")){ //if this item is unchecked
		        $("#all_products").prop('checked', false); //change "select all" checked status to false
		    }
			//check "select all" if all checkbox items are checked
			if ($('.product_row:checked').length == $('.product_row').length ){
				$("#all_products").prop('checked', true);
			}
		});
		
		var pagingRows = 7;

		var paginationOptions = {
		    innerWindow: 1,
		    left: 0,
		    right: 0
		};
		var options = {
		  valueNames: [ 'sortName', 'sortPrice', 'sortDate' ],
		  page: pagingRows,
		  plugins: [ ListPagination(paginationOptions) ],
		};

		var tableList = new List('tableID', options);

		$('.jTablePageNext').on('click', function(){
		    var list = $('.pagination').find('li');
		    $.each(list, function(position, element){
		        if($(element).is('.active')){
		            $(list[position+1]).trigger('click');
		        }
		    })
		});
		$('.jTablePagePrev').on('click', function(){
		    var list = $('.pagination').find('li');
		    $.each(list, function(position, element){
		        if($(element).is('.active')){
		            $(list[position-1]).trigger('click');
		        }
		    })
		});
		
		$('.save_changed_btn').click(function(){
			var count = $('.table-list tbody input[type="checkbox"]:checked').length;
			if(count > 0){
				$('#loading').show();
				var prod_array = {};
				$('.table-list tbody input[type="checkbox"]:checked').each(function(){
					var prod_id = $(this).closest('tr').attr('id');
					var price = $(this).closest('tr').find('#product_price').val();
		  			var attribute = $(this).closest('tr').find( "#grid_attribute option:selected" ).val();
		  			var attribute_value = []
		  			$(this).closest('tr').find( "#grid_attribute_value option:selected" ).each(function(){
		  				attribute_value.push(parseInt($(this).val()))
		  			})
		  			var prod_post = {};
		  			prod_post['price'] = price;
		  			prod_post['prod_id'] = prod_id;
		  			prod_post['attribute'] = attribute
		  			prod_post['attribute_value'] = attribute_value
		  			prod_array[prod_id] = prod_post;
				});
				
				ajax.jsonRpc('/grid_product/details/save', 'call', prod_array).then(function (modal) {
	  				$('#loading').hide();
	  				var table= $('.table-list');
	  				$('td input:checkbox',table).prop('checked', false);
	  				$("#all_products").prop('checked', false);
	  				alertify.alert("Success", "Your changes updated successfully.");
	  			});
			}else{
				alertify.alert("Warning", "Please select at least one row.");
			}
		});
		
		$('.stock_btn').click(function(){
			var count = $('.table-list tbody input[type="checkbox"]:checked').length;
			if(count > 0){
				$('#loading').show();
				var stock_array = {};
				$('.table-list tbody input[type="checkbox"]:checked').each(function(){
					var prod_id = $(this).closest('tr').attr('id');
					var onhand_qty = $(this).closest('tr').find('#onhand_qty').val();
		  			
		  			var stock_prod = {};
			    	stock_prod['prod_id'] = prod_id;
			    	stock_prod['qty'] = onhand_qty;
			    	stock_array[prod_id] = stock_prod;
				});
				
			    ajax.jsonRpc('/grid/create/stock/inventory', 'call', stock_array).then(function (result) {
			    	$('#loading').hide();
			    	var table= $('.table-list');
	  				$('td input:checkbox',table).prop('checked', false);
	  				$("#all_products").prop('checked', false);
			    	alertify.alert(result['title'],result['msg']);
			    });
			    
			}else{
				alertify.alert("Warning", "Please select at least one row.");
			}
		});
		
		$('.prod_categ_menu').click(function(){
			$(".nav_pcateg").slideToggle('slow');
		});
		
		$('#resend_otp').click(function(){
			$('#loading').show();
			var login = $('#login').val();
			var post = {}
			post['login'] = login;
			ajax.jsonRpc('/resend/otp', 'call', post).then(function (modal) { 
				$('#loading').hide();
        		alertify.alert("Success", "OTP has been resend to your email address.");
        	});
		});
		$('#sign_resend_otp').click(function(){
			$('#loading').show();
			var login = $('#login').val();
			var email = $('#email_address').val();
			var post = {}
			post['login'] = login;
			post['email'] = email;
			ajax.jsonRpc('/signup/resend/otp', 'call', post).then(function (modal) { 
				$('#loading').hide();
        		alertify.alert("Success", "OTP has been resend to your email address.");
        	});
		});
		$('.cancel_order').click(function(){
			var order_id = $(this).attr('id');
			alertify.confirm('Confirm', "Are you sure want to cancel this order?",
					function(){
				var post = {}
				post['order_id'] = order_id;
				$('#loading').show();
				ajax.jsonRpc('/saleorder/delete', 'call', post).then(function (modal) { 
					$('#loading').hide();
					alertify.alert('Warning','Your order cancelled.')
					  .setting({
					    'label':'Goto Shop',
					    'onok': function(){ window.location="/shop";}
					  }).show();
	        	});
			},
			function(){
				
			});
		});
	});
	$(function(){
		var nav_activeText = $('.nav_pcateg').find('.nav-link.active').text();
		$('.pcate_menu').text(nav_activeText);
	});
	function comparer(index) {
	    return function(a, b) {
	        var valA = getCellValue(a, index), valB = getCellValue(b, index)
	        return $.isNumeric(valA) && $.isNumeric(valB) ? valA - valB : valA.toString().localeCompare(valB)
	    }
	}
	function getCellValue(row, index){ return $(row).children('td').eq(index).text() }
	
	$(document).ready(function(ev){
		var post = {};
		ajax.jsonRpc('/check/website/user', 'call', post).then(function (result) {
				if(result){
				}
				else{
					$(".shop-prod,#shop_add_to_cart").show();
				}
	    	});
	});


sAnimations.registry.WebsiteShopCart = sAnimations.Class.extend(ProductConfiguratorMixin, {
    selector: '.oe_website_sale',
    read_events: {
        'click #shop_add_to_cart': '_onShopAddCart',
        'click #shop_process_checkout': '_onShopConfirm',
        'click #product_settings': '_onProductSetting',
        'click #product_publish': '_onProductPublish',
        'click #product_unpublish': '_onProductUnpublish',
    },

    /**
     * @constructor
     */
    init: function () {
        this._super.apply(this, arguments);

       
    },
    
    _onProductPublish: function(ev){
    	var prod_id = $(ev.currentTarget).closest('.pro_name_price').find('.publish_prod_id').text()
    	alertify.confirm('Confirm Message','Are you sure unpublish this product.',
			function(){
	    		var post = {}
	        	post['prod_id'] = prod_id;
	        	ajax.jsonRpc('/publish/product', 'call', post).then(function (modal) { 
	        		window.location.reload();
	        	});
	    	},
	    	function(){
	        }
	    	);
    },
    
    _onProductUnpublish: function(ev){
    	var prod_id = $(ev.currentTarget).closest('.pro_name_price').find('.publish_prod_id').text()
    	alertify.confirm('Confirm Message','Are you sure publish this product.',
    			function(){
		    		var post = {}
		        	post['prod_id'] = prod_id;
		        	ajax.jsonRpc('/publish/product', 'call', post).then(function (modal) { 
		        		window.location.reload();
		        	});
    	    	},
    	    	function(){
    	        }
    	    	);
    },
    
    _onProductSetting: function(ev){
    	var price = $(ev.currentTarget).closest('.prod_setting').find('#prod_setting_price').text(); 
    	var prod_id = $(ev.currentTarget).closest('.prod_setting').find('#prod_setting_pid').text(); 
    	var $form = $(ev.currentTarget).closest('.prod_setting');
    	var post = {}
    	post['prod_id'] = prod_id;
    	ajax.jsonRpc('/change/product/details', 'call', post).then(function (modal) { 
			var $modal = $(modal);	
  		    $modal.appendTo($form).modal();	
  		    $modal.find("#attribute_value").chosen({
  			  width:'100%',
  			  enable_search_threshold : 10
  		    });
  		    
  		    $modal.on('change', '#attribute', function(ev){
  		    	var attribute_id = $(this).val();
  		    	var attr_post = {};
  		    	attr_post['prod_id'] = prod_id;
  		    	attr_post['attribute_id'] = attribute_id;
  		    	ajax.jsonRpc('/product/attribute/values', 'call', attr_post).then(function (result) {
  		    		$modal.find("#attribute_value_chosen").remove();
  		    		$modal.find("#attribute_value").replaceWith(result);
  		    		$modal.find("#attribute_value").chosen({
  		  			  width:'100%',
  		  			  enable_search_threshold : 10
  		  		    });
  		    	});
  		    });
  		    
  		    $modal.on('click', '#stock_inventory', function(ev){
  		    	var onhand_qty = $(ev.currentTarget).closest('table').find('#onhand_qty').val();
  		    	if(onhand_qty == "" || onhand_qty == undefined){
  		    		onhand_qty = 0;
  		    	}
  		    	var stock_prod = {};
  		    	stock_prod['prod_id'] = prod_id;
  		    	stock_prod['qty'] = onhand_qty;
  		    	ajax.jsonRpc('/create/stock/inventory', 'call', stock_prod).then(function (result) {
  		    		alertify.alert(result['title'],result['msg']);
  		    	});
  		    });
  		    
	  		$modal.on('click', '#prod_setting_btn', function (ev) {
	  			var price = $(ev.currentTarget).closest('table').find('#price').val();
	  			//var expire_date = $(ev.currentTarget).closest('table').find('#expire_date').val();
	  			var attribute = $(ev.currentTarget).closest('table').find( "#attribute option:selected" ).val();
	  			var attribute_value = []
	  			$(ev.currentTarget).closest('table').find( "#attribute_value option:selected" ).each(function(){
	  				attribute_value.push(parseInt($(this).val()))
	  			})
	  			var prod_post = {};
	  			prod_post['price'] = price;
	  			//prod_post['expire_date'] = expire_date;
	  			prod_post['prod_id'] = prod_id;
	  			prod_post['attribute'] = attribute
	  			prod_post['attribute_value'] = attribute_value
	  			ajax.jsonRpc('/product/details/save', 'call', prod_post).then(function (modal) {
	  				$modal.modal('hide');
	  				window.location.reload();
	  			});
	  		});
		});
    },
    
    _onShopConfirm: function (ev){
    	this._rpc({
            route: "/shop/cart/confirm",
            params: { },
        }).then(function (data) {
        	if(data == "address"){
        		window.location = '/web/login?customer=true';
        	}else{
        		window.location = '/my/orders/'+parseInt(data);
        	}
        	//window.location = '/my/orders/'+parseInt(data);
        	
        });
    },
    
    _onShopAddCart: function (ev) {
    	var self = this;
    	var $form = $(ev.currentTarget).closest('form');
    	var cart_qty = $(ev.currentTarget).closest('#shop_cart_details').find('.quantity').val();
    	var price = $(ev.currentTarget).closest('#shop_cart_details').find('.shop_prod_price').text();
    	var prod_id = $(ev.currentTarget).closest('#shop_cart_details').find('.shop_prod_id').text();
    	this._rpc({
            route: "/cart/exit/company",
            params: {
            },
        }).then(function (data) {
      	 if(data){
      		self._rpc({
                route: "/shop/product/cart/update",
                params: {
                    product_id: parseInt(prod_id, 10),
                    price: price,
                    qty: cart_qty
                    
                },
            }).then(function (data) {
           	 if(data != undefined && data.indexOf('quantity') != -1){
           		 var qty = data.replace('quantity', '');
           		 $('#float_new_web_cart_quantity').text(qty);
            	 	 $('.my_cart_quantity').text(qty);
            	 	 //alertify.alert('Success', 'Product added to cart.')
           	 }else{
           		 self.rootShopProduct = {
           				 product_id: prod_id,
           				 quantity: cart_qty,
           				 product_custom_attribute_values: self.getCustomVariantValues($form.find('.js_product')),
           	             variant_values: self.getSelectedVariantValues($form.find('.js_product')),
           	             no_variant_attribute_values: self.getNoVariantAttributeValues($form.find('.js_product'))
           	     };

           		 self.optionalShopProductsModal = new OptionalShopProductsModal($form, {
           			 rootShopProduct: self.rootShopProduct,
           			 isWebsite: true,
                        okButtonText: _t('Close'),
                        cancelButtonText: _t(''),
                        title: _t('Add to cart')
                    }).open();
           	 }
           	
            });
      	 }else{
      		alertify.confirm('Confirm Message','You have order for another shop.Are you confirm to clear this order.',
			function(){
      			self._rpc({
                    route: "/shop/product/cart/update",
                    params: {
                        product_id: parseInt(prod_id, 10),
                        price: price,
                        qty: cart_qty,
                        sorder: true
                        
                    },
                }).then(function (data) {
               	 if(data != undefined && data.indexOf('quantity') != -1){
               		 var qty = data.replace('quantity', '');
               		 $('#float_new_web_cart_quantity').text(qty);
                	 	 $('.my_cart_quantity').text(qty);
                	 	 //alertify.alert('Success', 'Product added to cart.')
               	 }else{
               		 self.rootShopProduct = {
               				 product_id: prod_id,
               				 quantity: cart_qty,
               				 product_custom_attribute_values: self.getCustomVariantValues($form.find('.js_product')),
               	             variant_values: self.getSelectedVariantValues($form.find('.js_product')),
               	             no_variant_attribute_values: self.getNoVariantAttributeValues($form.find('.js_product'))
               	     };

               		 self.optionalShopProductsModal = new OptionalShopProductsModal($form, {
               			 rootShopProduct: self.rootShopProduct,
               			 isWebsite: true,
                            okButtonText: _t('Close'),
                            cancelButtonText: _t(''),
                            title: _t('Add to cart')
                        }).open();
               	 }
               	
                });
			},
			function(){
			}
			).set('labels', {ok:'OK', cancel:'Cancel'});
      		 
      	 }
        });
    	
    	
         
    },

});

return sAnimations.registry.WebsiteShopCart;
});