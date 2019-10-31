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
        	if(data == "sale"){
        		$('#sale_confirm').removeClass("border-gray");
        		$('#sale_confirm').addClass("border-green");
        		$('#sale_confirm').find("span").removeClass("border-gray-span");
        		$('#sale_confirm').find("span").addClass("border-green-span");
        		$('#sale_confirm_img').attr('src','/skit_website_wet_market/static/src/img/confirmed_green.png');
        		$('#msale_confirm_img').attr('src','/skit_website_wet_market/static/src/img/confirmed_green.png');
        		$('.icon_confirm').addClass("active_back");
        		$('.conf_vertical_ln').addClass("active_ln");
        	}
        	else if(data == "preparing"){
        		$('#sale_preparing').removeClass("border-gray");
        		$('#sale_preparing').addClass("border-green");
        		$('#sale_preparing').find("span").removeClass("border-gray-span");
        		$('#sale_preparing').find("span").addClass("border-green-span");
        		$('#sale_preparing_img').attr('src','/skit_website_wet_market/static/src/img/preparing_green.png');
        		$('#msale_prepare_img').attr('src','/skit_website_wet_market/static/src/img/preparing_green.png');
        		$('.icon_preparing').addClass("active_back");
        		$('.prepare_vertical_ln').addClass("active_ln");
        	}
        	else if(data == "ready"){
        		$('#sale_ready').removeClass("border-gray");
        		$('#sale_ready').addClass("border-green");
        		$('#sale_ready').find("span").removeClass("border-gray-span");
        		$('#sale_ready').find("span").addClass("border-green-span");
        		$('#sale_ready_img').attr('src','/skit_website_wet_market/static/src/img/ready_green.png');
        		$('#msale_ready_img').attr('src','/skit_website_wet_market/static/src/img/ready_green.png');
        		$('.icon_ready').addClass("active_back");
        		$('.ready_vertical_ln').addClass("active_ln");
        	}
        	else if(data == "delivered"){
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
		$('.prod_categ_menu').click(function(){
			$(".nav_pcateg").slideToggle('slow');
		});
		
		$('#resend_otp').click(function(){
			var login = $('#login').val();
			var post = {}
			post['login'] = login;
			ajax.jsonRpc('/resend/otp', 'call', post).then(function (modal) { 
        		alertify.alert("Success", "OTP has been resend to your email address.");
        	});
		});
		$('#sign_resend_otp').click(function(){
			var login = $('#login').val();
			var email = $('#email_address').val();
			var post = {}
			post['login'] = login;
			post['email'] = email;
			ajax.jsonRpc('/signup/resend/otp', 'call', post).then(function (modal) { 
        		alertify.alert("Success", "OTP has been resend to your email address.");
        	});
		});
	});
	$(function(){
		var nav_activeText = $('.nav_pcateg').find('.nav-link.active').text();
		$('.pcate_menu').text(nav_activeText);
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
	  			var expire_date = $(ev.currentTarget).closest('table').find('#expire_date').val();
	  			var attribute = $(ev.currentTarget).closest('table').find( "#attribute option:selected" ).val();
	  			var attribute_value = []
	  			$(ev.currentTarget).closest('table').find( "#attribute_value option:selected" ).each(function(){
	  				attribute_value.push(parseInt($(this).val()))
	  			})
	  			var prod_post = {};
	  			prod_post['price'] = price;
	  			prod_post['expire_date'] = expire_date;
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
        	 }else{
        		 self.rootShopProduct = {
        				 product_id: prod_id,
        				 quantity: cart_qty
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

});

return sAnimations.registry.WebsiteShopCart;
});