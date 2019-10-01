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
        		$('#msale_confirm_img').attr('src','/skit_website_fish_market/static/src/img/confirmed_green.png');
        		$('.icon_confirm').addClass("active_back");
        		$('.conf_vertical_ln').addClass("active_ln");
        	}
        	else if(data == "preparing"){
        		$('#sale_preparing').removeClass("border-gray");
        		$('#sale_preparing').addClass("border-green");
        		$('#sale_preparing').find("span").removeClass("border-gray-span");
        		$('#sale_preparing').find("span").addClass("border-green-span");
        		$('#sale_preparing_img').attr('src','/skit_website_wet_market/static/src/img/preparing_green.png');
        		$('#msale_prepare_img').attr('src','/skit_website_fish_market/static/src/img/preparing_green.png');
        		$('.icon_preparing').addClass("active_back");
        		$('.prepare_vertical_ln').addClass("active_ln");
        	}
        	else if(data == "ready"){
        		$('#sale_ready').removeClass("border-gray");
        		$('#sale_ready').addClass("border-green");
        		$('#sale_ready').find("span").removeClass("border-gray-span");
        		$('#sale_ready').find("span").addClass("border-green-span");
        		$('#sale_ready_img').attr('src','/skit_website_wet_market/static/src/img/ready_green.png');
        		$('#msale_ready_img').attr('src','/skit_website_fish_market/static/src/img/ready_green.png');
        		$('.icon_ready').addClass("active_back");
        		$('.ready_vertical_ln').addClass("active_ln");
        	}
        	else if(data == "delivered"){
        		$('#sale_delivered').removeClass("border-gray");
        		$('#sale_delivered').addClass("border-green");
        		$('#sale_delivered').find("span").removeClass("border-gray-span");
        		$('#sale_delivered').find("span").addClass("border-green-span");
        		$('#sale_delivered_img').attr('src','/skit_website_wet_market/static/src/img/delivered_green.png');
        		$('#msale_deliver_img').attr('src','/skit_website_fish_market/static/src/img/delivered_green.png');
        		$('.icon_delivered').addClass("active_back");
        	}
        });
	}
	
	}, 3000);

	$(document).ready(function(){
		$('.pcate_menu').click(function(){
			$(".nav_pcateg").slideToggle('slow');
		});
	});


sAnimations.registry.WebsiteShopCart = sAnimations.Class.extend(ProductConfiguratorMixin, {
    selector: '.oe_website_sale',
    read_events: {
        'click #shop_add_to_cart': '_onShopAddCart',
        'click #shop_process_checkout': '_onShopConfirm',
    },

    /**
     * @constructor
     */
    init: function () {
        this._super.apply(this, arguments);

       
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