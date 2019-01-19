odoo.define('skit_hotel_management.checkout', function (require) {
"use strict";
var PosBaseWidget = require('point_of_sale.BaseWidget');
var chrome = require('point_of_sale.chrome');
var gui = require('point_of_sale.gui');
var models = require('point_of_sale.models');
var screens = require('point_of_sale.screens');
var core = require('web.core');
var rpc = require('web.rpc');

var QWeb = core.qweb;
var _t = core._t;

var VendorPaymentScreenWidget = screens.ScreenWidget.extend({
    template: 'VendorPaymentScreenWidget',
    init: function(parent, options){
        this._super(parent, options);
       
    },
    hide: function(){
        this._super();
       
        this.chrome.widget.order_selector.show();
    },
    show: function(){
    	var self = this;
        this._super();
        this.chrome.widget.order_selector.hide();
        
        this.render_list();
        
        this.$('.back').click(function(){
        	self.gui.show_screen('firstpage');
        });
        this.$('.product').click(function(){
        	self.gui.show_screen('products');
        });
        
        this._rpc({
			model: 'hm.form.template',
			method: 'get_accommodation',
			args: [0],
		}).then(function(result){
			//console.log('result'+JSON.stringify(result))
			var result_datas = result[0]['result_datas']
    			var line_group = result[0]['line_group']
    			var line_group_key = result[0]['line_group_key']
    			var form_view = result[0]['form_view']
    			var form_name = result[0]['form_name']
    			var text_color = result[0]['text_color']
    			var sub_form_template = result[0]['sub_form_template']
    			var current_order = result[0]['current_order']
    			var current_order_lines = result[0]['current_order_lines']
    			var form_temp_id = result[0]['form_temp_id']
    			var model_name = result[0]['model_name']
    			var vendor_id = result[0]['vendor_id']
    			var sub_line_group = result[0]['sub_line_group']
    			var sub_line_group_key = result[0]['sub_line_group_key']
    			var temp_order_lines = result[0]['temp_order_lines']
    			var line_form_temp_id = result[0]['line_form_temp_id']
    			var line_model_name = result[0]['line_model_name']
    			var is_other = result[0]['is_other']
    			var all_location = result[0]['all_location']
    			var stock_move_datas = result[0]['stock_move_datas']
    			var vendor_list = result[0]['vendor_list']
			self.render_list(result_datas,form_view,sub_form_template,form_temp_id,line_group,line_group_key,sub_line_group,sub_line_group_key)
    		
    		var table = self.$('#vendor_order_list').DataTable({
		        bSort: false,
		        bFilter: false,
		        bPaginate: true, 
		        pageLength: 10,
			});
			
			/** Edit Option for DataTable */   
           /* self.$('.edit-datatable').click(function(e){
            	alert('Edit')
            });*/
		});

    },
    sub_template_line_icon_url: function(id){
    	return '/web/image?model=hm.sub.form.template.line&id='+id+'&field=image';
    },
    render_list: function(result_datas,form_view,sub_form_template,form_temp_id,
    		line_group,line_group_key,sub_line_group,sub_line_group_key){
    	var contents = this.$el[0].querySelector('.vendor-payment');
        contents.innerHTML = "";
        var vendor_html = QWeb.render('PaymentListContent',{widget: this, result_datas: result_datas, form_view: form_view,
        						sub_form_template: sub_form_template, 
        						form_temp_id: form_temp_id,
        						line_group: line_group, line_group_key: line_group_key,
        						sub_line_group: sub_line_group, sub_line_group_key: sub_line_group_key});
        var vendorlist = document.createElement('div');
        vendorlist.innerHTML = vendor_html;
        vendorlist = vendorlist.childNodes[1];
        contents.appendChild(vendorlist);
    },
    /*render_list: function(result_datas,form_view,form_name,text_color,sub_form_template,current_order,current_order_lines,form_temp_id,model_name,
    		vendor_id,line_form_temp_id,line_model_name,line_group,line_group_key,sub_line_group,sub_line_group_key,temp_order_lines,is_other,all_location,stock_move_datas,vendor_list){
    	var contents = this.$el[0].querySelector('.vendor-payment');
        contents.innerHTML = "";
        var vendor_html = QWeb.render('PaymentListContent',{widget: this, result_datas: result_datas, form_view: form_view,
        						form_name: form_name, text_color:text_color, sub_form_template: sub_form_template, 
        						current_order: current_order, current_order_lines: current_order_lines,
        						form_temp_id: form_temp_id, model_name: model_name, vendor_id: vendor_id,
        						line_form_temp_id: line_form_temp_id, line_model_name: line_model_name,
        						line_group: line_group, line_group_key: line_group_key,
        						sub_line_group: sub_line_group, sub_line_group_key: sub_line_group_key,
        						temp_order_lines: temp_order_lines, is_other: is_other,
        						all_location: all_location, stock_move_datas: stock_move_datas, vendor_list: vendor_list});
        var vendorlist = document.createElement('div');
        vendorlist.innerHTML = vendor_html;
        vendorlist = vendorlist.childNodes[1];
        contents.appendChild(vendorlist);
    },*/
    /*render_list: function(){
    	var self = this;
    	this._rpc({
			model: 'hm.form.template',
			method: 'get_accommodation',
			args: [0],
		}).then(function(result){
			//console.log('result'+JSON.stringify(result))
			var result_datas = result[0]['result_datas']
    			var line_group = result[0]['line_group']
    			var line_group_key = result[0]['line_group_key']
    			var form_view = result[0]['form_view']
    			var form_name = result[0]['form_name']
    			var text_color = result[0]['text_color']
    			var sub_form_template = result[0]['sub_form_template']
    			var current_order = result[0]['current_order']
    			var current_order_lines = result[0]['current_order_lines']
    			var form_temp_id = result[0]['form_temp_id']
    			var model_name = result[0]['model_name']
    			var vendor_id = result[0]['vendor_id']
    			var sub_line_group = result[0]['sub_line_group']
    			var sub_line_group_key = result[0]['sub_line_group_key']
    			var temp_order_lines = result[0]['temp_order_lines']
    			var line_form_temp_id = result[0]['line_form_temp_id']
    			var line_model_name = result[0]['line_model_name']
    			var is_other = result[0]['is_other']
    			var all_location = result[0]['all_location']
    			var stock_move_datas = result[0]['stock_move_datas']
    			var vendor_list = result[0]['vendor_list']
    			
                var contents = self.$el[0].querySelector('.vendor-payment');
                contents.innerHTML = "";
                var vendor_html = QWeb.render('VendorListContent',{widget: self, result_datas: result_datas, form_view: form_view,
                						form_name: form_name, text_color:text_color, sub_form_template: sub_form_template, 
                						current_order: current_order, current_order_lines: current_order_lines,
                						form_temp_id: form_temp_id, model_name: model_name, vendor_id: vendor_id,
                						line_form_temp_id: line_form_temp_id, line_model_name: model_name,
                						line_group: line_group, line_group_key: line_group_key,
                						sub_line_group: sub_line_group, sub_line_group_key: sub_line_group_key,
                						//sub_line_group_array: sub_line_group_array, sub_line_group_key_array: sub_line_group_key_array,
                						temp_order_lines: temp_order_lines, is_other: is_other,
                						all_location: all_location, stock_move_datas: stock_move_datas, vendor_list: vendor_list});
                var vendorlist = document.createElement('div');
                vendorlist.innerHTML = vendor_html;
                vendorlist = vendorlist.childNodes[1];
                contents.appendChild(vendorlist);
                
                var table = $('#vendor_order_list').DataTable({
    		        bSort: false,
    		        bFilter: false,
    		        bPaginate: true, 
    		        pageLength: 10,
    			});
                
                *//** Edit Option for DataTable *//*     
                $('.edit-datatable').click(function(e){
                	alert('Edit')
                });
		});
    },*/
});
gui.define_screen({name:'vendor_payment', widget: VendorPaymentScreenWidget});

});