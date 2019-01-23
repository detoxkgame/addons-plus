odoo.define('skit_hotel_management.vendor_dashboard', function (require) {
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


/*var VendorCategoryWidget = PosBaseWidget.extend({
    template:'VendorCategoryWidget',
    init: function(parent, options) {
        var self = this;
        this._super(parent,options);
        this.model = options.model;
    },
});*/

var VendorDashboardScreenWidget = screens.ScreenWidget.extend({
    template: 'VendorDashboardScreenWidget',
    init: function(parent, options){
        this._super(parent, options);
       
    },
    hide: function(){
        this._super();
       
        this.chrome.widget.order_selector.show();
    },
    show: function(){
        this._super();
        this.chrome.widget.order_selector.hide();
        var dashboards = this.pos.vendor_dashboard;
        var dashboard_lines = this.pos.vendor_dashboard_line;
        //var parent_devotee = this.pos.db.get_dashboardline_by_dashboard(1);
        var self = this;
        var el_node = this;
        //console.log('DASH'+ JSON.stringify(dashboards));
        //console.log('DASHLine'+ JSON.stringify(dashboard_lines));
        //console.log('dfs'+ JSON.stringify(parent_devotee));
        //console.log('Len'+dashboards.length)
        this.render_list(dashboards);
        /*$('.info').first().show().animate({
            width: '40%'
          });
        $('.item').first().css({'display': 'none'});*/
        var width = 100 - (dashboards.length * 4);
        this.$('.item').click(function(){
        	$(this).css({'display': 'none'});
        	//$(".test").css({'display':'none'});
        	//$(this).prev().siblings(".info").hide();
        	//$(this).siblings(".test").hide();
        	/*$('div').filter('.test').each(function(i) {
        		$(this).removeClass('test');
        		//$(this).css({'display': 'none'});
        	});*/
        	$('div').filter('.info1, .info2').each(function(i) {
        		//$(this).removeClass('test');
        		$(this).css({'display': 'none'});
        	});
        	//$(this).next().addClass('test')
        	$(this)
            .next().show().animate({
              width: width+'%'
            })
            .siblings(".info").animate({
              width: 0
            });
        	$(this).next().find(".info1").css({'display': 'block'});
        	$(this).next().find(".info2").css({'display': 'block'});
        	el_node = $(this).next().find(".info2");
        	//$(this).closest('.test').css({'display': 'none'});
        	/*$(this)
            .prev(".info").css({'display': 'none'});*/
        	$(this).siblings(".item").css({'display': 'block'});
        	
        	/** Trigger the first dashboard element */
        	if ($(this).next().find(".info2").find('.vendor-contents').children().length <= 0 ) {
        	     $(this).next().find(".info1").find( ".dashboard-element:first" ).trigger( "click" );
        	}
        	
        });
       
        /** Back Icon */
        this.$('.back-icon').click(function(e){
        	self.gui.show_screen('firstpage');
        });
        
        /** Action for Dashboard Element */
        this.$('.dashboard-element').click(function(e){
        	var line_id = $(this).attr('id');
        	var vendor_categ_id = $(this).attr('categid');
        	var dashboard_id = $(this).attr('dashid');
        	var menu_name = $(this).attr('menu');
        	var color_code = $(this).attr('color');
        	var sub_id = 0;
        	var order_id = 0;
        	var form_fields_records;
        	var line_form_fields;
        	//alert('Element');
        	$('div').filter('.highlight').each(function(i) {
        		$(this).removeClass('highlight');
        		$(this).css({'background-color': 'transparent'});
        		$(this).find('img').css({'filter': ''})
        	});
        	$(this).closest('div').css({'background-color': 'whitesmoke'});
        	$(this).closest('div').addClass('highlight');
        	$(this).closest('div img').css({'filter': 'opacity(0.5) drop-shadow(0 0 0 '+color_code+')'})
        	
        	self._rpc({
    			model: 'hm.form.template',
    			method: 'get_vendor_list',
    			args: [0,vendor_categ_id, dashboard_id, line_id, false, sub_id, order_id],
    		}).then(function(result){ 
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
    			//var sub_line_group_array = result[0]['sub_line_group_array']
    			//var sub_line_group_key_array = result[0]['sub_line_group_key_array']
    			var temp_order_lines = result[0]['temp_order_lines']
    			var line_form_temp_id = result[0]['line_form_temp_id']
    			var line_model_name = result[0]['line_model_name']
    			var is_other = result[0]['is_other']
    			var all_location = result[0]['all_location']
    			var stock_move_datas = result[0]['stock_move_datas']
    			var vendor_list = result[0]['vendor_list']
    			
    			var contents = el_node.find('.vendor-contents');
                contents.innerHTML = "";
                var vendor_html = QWeb.render('VendorListContent',{widget: self, result_datas: result_datas, form_view: form_view,
                						form_name: form_name, text_color:text_color, sub_form_template: sub_form_template, 
                						current_order: current_order, current_order_lines: current_order_lines,
                						form_temp_id: form_temp_id, model_name: model_name, vendor_id: vendor_id,
                						line_form_temp_id: line_form_temp_id, line_model_name: line_model_name,
                						line_group: line_group, line_group_key: line_group_key,
                						sub_line_group: sub_line_group, sub_line_group_key: sub_line_group_key,
                						//sub_line_group_array: sub_line_group_array, sub_line_group_key_array: sub_line_group_key_array,
                						temp_order_lines: temp_order_lines, is_other: is_other,
                						all_location: all_location, stock_move_datas: stock_move_datas, vendor_list: vendor_list});
                var vendorlist = document.createElement('div');
                vendorlist.innerHTML = vendor_html;
                vendorlist = vendorlist.childNodes[1];
                contents.empty();
                contents.append(vendorlist);
               // alert(JSON.stringify(contents.html()))
               // alert("vendorlist"+JSON.stringify(vendorlist.html()))
               
                
                var table = el_node.find('#vendor_order_list').DataTable({
    		        //sScrollX: true,
    		       // sScrollXInner: "100%",
    		        //bScrollCollapse: true,
    		        bSort: false,
    		        //'rowsGroup': [0],
    		        bFilter: false,
    		        bPaginate: true, 
    		        pageLength: 10,
    			});
                
                /** Edit Option for DataTable */     
                contents.off('click','.edit-datatable'); 
                contents.on('click','.edit-datatable',function(){
                	//alert('test');
                	var sub_temp_id = $(this).attr('id');
                	var current_order_id = $(this).attr('orderid');
                	//alert('Edit'+current_order_id)
                	self._rpc({
            			model: 'hm.form.template',
            			method: 'get_vendor_list',
            			args: [0,vendor_categ_id, dashboard_id, line_id, true, sub_temp_id, current_order_id],
            		}).then(function(result){ 
            			var result_datas = result[0]['result_datas']
            			var line_group = result[0]['line_group']
            			var line_group_key = result[0]['line_group_key']
            			var form_view = result[0]['form_view']
            			var form_name = result[0]['form_name']
            			var text_color = result[0]['text_color']
            			var sub_form_template = result[0]['sub_form_template']
            			var products = result[0]['products']
            			var template_lines = result[0]['template_lines']
            			var current_order = result[0]['current_order']
            			var current_order_lines = result[0]['current_order_lines']
            			var form_temp_id = result[0]['form_temp_id']
            			var model_name = result[0]['model_name']
            			var vendor_id = result[0]['vendor_id']
            			var sub_line_group = result[0]['sub_line_group']
            			var sub_line_group_key = result[0]['sub_line_group_key']
            			//var sub_line_group_array = result[0]['sub_line_group_array']
            			//var sub_line_group_key_array = result[0]['sub_line_group_key_array']
            			var temp_order_lines = result[0]['temp_order_lines']
            			var line_form_temp_id = result[0]['line_form_temp_id']
            			var line_model_name = result[0]['line_model_name']
            			var is_other = result[0]['is_other']

            			
            			form_fields_records = template_lines;
            			line_form_fields = temp_order_lines;
            			
            			var fcontents = el_node.find('.vendor-contents');
        	        	fcontents.innerHTML = "";
        	        	var vendor_html = QWeb.render('VendorListContent',{widget: self, result_datas: result_datas, form_view: form_view,
    						form_name: form_name, text_color:text_color, sub_form_template: sub_form_template, products: products, vendor_id: vendor_id,
    						template_lines: template_lines, current_order: current_order, current_order_lines: current_order_lines,
    						form_temp_id: form_temp_id, model_name: model_name,
    						line_form_temp_id: line_form_temp_id, line_model_name: line_model_name,
    						line_group: line_group, line_group_key: line_group_key,
    						sub_line_group: sub_line_group, sub_line_group_key: sub_line_group_key,
    						//sub_line_group_array: sub_line_group_array, sub_line_group_key_array: sub_line_group_key_array,
    						temp_order_lines: temp_order_lines, is_other: is_other});
                        var vendorlist = document.createElement('div');
                        vendorlist.innerHTML = vendor_html;
                        vendorlist = vendorlist.childNodes[1];
                        fcontents.empty();
                        fcontents.append(vendorlist);
                        fcontents.find(".washing-work").chosen({
        					width : "69%",
        					enable_search_threshold : 10
        				}).change(function(e) {
        					 var value = $(this).val();
        					 $(this).find("#extra_work").val(value);
        					 	
        				});
                        
                        /** Disabled the Order details for [order, done, cancel, return] state */
                        if((current_order[0]['state'] == 'order') || (current_order[0]['state'] == 'done') || 
                        		(current_order[0]['state'] == 'cancel') || (current_order[0]['state'] == 'return')){
                        	$('table.order-form-detail').each(function() {
                        		$(this).find("input").attr('disabled',true);
                        		$(this).find("select").attr('disabled',true);
                        	});
                        	$('table.orderline-form-detail tr').each(function() {
                        		$(this).find("input").attr('disabled',true);
                        		$(this).find("select").attr('disabled',true);
                        		$(this).find("select.chosen").attr('disabled',true).trigger("chosen:updated");
                        		$(this).find("span.add-line").css({'display':'none'});
                        		$(this).find("span.delete-line").css({'display':'none'});
                        	});
                        }
            		});
                });
                
                /** Action for Back Button */
                contents.off('click','.back-btn'); 
                contents.on('click','.back-btn',function(){
                	self._rpc({
            			model: 'hm.form.template',
            			method: 'get_vendor_list',
            			args: [0,vendor_categ_id, dashboard_id, line_id, false, sub_id, order_id],
            		}).then(function(result){ 
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
            			//var sub_line_group_array = result[0]['sub_line_group_array']
            			//var sub_line_group_key_array = result[0]['sub_line_group_key_array']
            			var temp_order_lines = result[0]['temp_order_lines']
            			var line_form_temp_id = result[0]['line_form_temp_id']
            			var line_model_name = result[0]['line_model_name']
            			var is_other = result[0]['is_other']
            			//alert('dashboard_id'+dashboard_id);
            			var contents = el_node.find('.vendor-contents');
                        contents.innerHTML = "";
                        var vendor_html = QWeb.render('VendorListContent',{widget: self, result_datas: result_datas, form_view: form_view,
                        						form_name: form_name, text_color:text_color, sub_form_template: sub_form_template, vendor_id: vendor_id,
                        						current_order: current_order, current_order_lines: current_order_lines,
                        						form_temp_id: form_temp_id, model_name: model_name,
                        						line_form_temp_id: line_form_temp_id, line_model_name: line_model_name,
                        						line_group: line_group, line_group_key: line_group_key,
                        						sub_line_group: sub_line_group, sub_line_group_key: sub_line_group_key,
                        						//sub_line_group_array: sub_line_group_array, sub_line_group_key_array: sub_line_group_key_array,
                        						temp_order_lines: temp_order_lines, is_other: is_other});
                        var vendorlist = document.createElement('div');
                        vendorlist.innerHTML = vendor_html;
                        vendorlist = vendorlist.childNodes[1];
                        contents.empty();
                        contents.append(vendorlist);
                        
                        var table = el_node.find('#vendor_order_list').DataTable({
            		        bSort: false,
            		        bFilter: false,
            		        bPaginate: true, 
            		        pageLength: 10,
            			});
            		});
                });
                /** Action for Vendors */
                contents.off('click','.vendor-form-icon, .invoice-action');
                contents.on('click','.vendor-form-icon, .invoice-action',function(){ 
                	var sub_temp_id = $(this).attr('id');
                	var vendor_id = $(this).attr('vendor');
                	var invoice_ids = contents.find('#invoice_ids').text()
                	//alert('invoice_ids'+invoice_ids);
                	self._rpc({
            			model: 'hm.form.template',
            			method: 'get_vendor_list',
            			args: [0,vendor_categ_id, dashboard_id, line_id, true, sub_temp_id, order_id, vendor_id, invoice_ids],
            		}).then(function(result){ 
            			var result_datas = result[0]['result_datas']
            			var line_group = result[0]['line_group']
            			var line_group_key = result[0]['line_group_key']
            			var form_view = result[0]['form_view']
            			var form_name = result[0]['form_name']
            			var text_color = result[0]['text_color']
            			var sub_form_template = result[0]['sub_form_template']
            			var products = result[0]['products']
            			var template_lines = result[0]['template_lines']
            			var current_order = result[0]['current_order']
            			var current_order_lines = result[0]['current_order_lines']
            			var form_temp_id = result[0]['form_temp_id']
            			var model_name = result[0]['model_name']
            			var vendor_id = result[0]['vendor_id']
            			var sub_line_group = result[0]['sub_line_group']
            			var sub_line_group_key = result[0]['sub_line_group_key']
            			//var sub_line_group_array = result[0]['sub_line_group_array']
            			//var sub_line_group_key_array = result[0]['sub_line_group_key_array']
            			var temp_order_lines = result[0]['temp_order_lines']
            			var line_form_temp_id = result[0]['line_form_temp_id']
            			var line_model_name = result[0]['line_model_name']
            			var is_other = result[0]['is_other']
            			
            			form_fields_records = template_lines;
            			line_form_fields = temp_order_lines;
            			
            			var fcontents = el_node.find('.vendor-contents');
        	        	fcontents.innerHTML = "";
        	        	var vendor_html = QWeb.render('VendorListContent',{widget: self, result_datas: result_datas, form_view: form_view,
    						form_name: form_name, text_color:text_color, sub_form_template: sub_form_template, products: products, vendor_id: vendor_id,
    						template_lines: template_lines, current_order: current_order, current_order_lines: current_order_lines,
    						form_temp_id: form_temp_id, model_name: model_name,
    						line_form_temp_id: line_form_temp_id, line_model_name: line_model_name,
    						line_group: line_group, line_group_key: line_group_key, 
    						sub_line_group: sub_line_group, sub_line_group_key: sub_line_group_key,
    						//sub_line_group_array: sub_line_group_array, sub_line_group_key_array: sub_line_group_key_array,
    						temp_order_lines: temp_order_lines, is_other: is_other});
                        var vendorlist = document.createElement('div');
                        vendorlist.innerHTML = vendor_html;
                        vendorlist = vendorlist.childNodes[1];
                        fcontents.empty();
                        fcontents.append(vendorlist);
                        fcontents.find('.chosen-select').chosen({}).change( function(obj, result) {
                            
                        });
                        fcontents.find(".washing-work").chosen({
        					width : "69%",
        					enable_search_threshold : 10
        				}).change(function(e) {
        					// $('#extra_work_chosen').css({'border': '0px solid red'});
        					 var value = $(this).val();
        					 $(this).find(".washing-work").val(value);
        					 	
        				});
                        /*fcontents.find("#worktest").chosen({
            				width : "69%",
            				enable_search_threshold : 10
            			}).change(function(e) {
            				// $('#extra_work_chosen').css({'border': '0px solid red'});
            				 var value = $(this).val();
            				 $(this).find("#extra_work").val(value);
            				 	
            			});*/
            		});
    	        	
    	    	});
                
                /*contents.find("#extra_work").chosen({
					width : "69%",
					enable_search_threshold : 10
				}).change(function(e) {
					// $('#extra_work_chosen').css({'border': '0px solid red'});
					 var value = $(this).val();
					 $("#extra_work").val(value);
					 	
				});*/
                
                /** Form */
                /*contents.on('click','.span-tag',function(){
                	$(this).css({'display': 'none'});
                	$(this).closest('td').find('.input-tag').css({'display': 'inline-block'});
                });*/
                contents.off('focus','.datepicker-input-time');
                contents.on('focus','.datepicker-input-time',function(){
                	$(this).datetimepicker({
            	   		//todayBtn: "linked"
                		format: 'yyyy-mm-dd HH:mm:ss',
            	   		todayHighlight: true
            	   	});
                });
                
                /** Remove Required */
                contents.off('focus','input');
                contents.on('focus','input',function(){
                	$(this).css({'border': '1px solid white'});
                	
                });
                contents.off('focus','select');
                contents.on('focus','select',function(){
                	$(this).css({'border': '1px solid white'});
                	
                });
                
                /** On Change Function */
                contents.on('change','.selection-type',function(){
                	var id = $(this).find('option:selected').attr("id");
                	contents.find('#car-image').attr("src",'/web/image?model=hm.car.type&id='+id+'&field=image');
                });
                
                /** Set to Draft Action */
                contents.off('click','#order_draft');
                contents.on('click','#order_draft',function(){
                	var order_id = contents.find('#order_id').text();
                	var model_name = contents.find('#model_name').text();
                	var form_temp_id = contents.find('#form_temp_id').text();
                	
                	self._rpc({
            			model: 'hm.form.template',
            			method: 'set_draft_order',
            			args: [0, order_id, model_name, form_temp_id],
            		}).then(function(result){
            			/*contents.find('#order-draft').css({'display': 'none'});
            			contents.find('#order-confirm').addClass('btn-active');
            			contents.find('#order-draft').removeClass('btn-active');
            			contents.find('#cancel').css({'display': 'none'});
            			contents.find('#open').addClass('active');
                    	contents.find('#cancel').removeClass('active');*/
            			self.update_records(self, el_node, vendor_categ_id, dashboard_id, line_id, true, result['edit_form_id'], result['order_id'], vendor_id)
                    	
            		});
                });
                
                /** Cancel Action */
                contents.off('click','#order_cancel');
                contents.on('click','#order_cancel',function(){
                	var order_id = contents.find('#order_id').text();
                	var model_name = contents.find('#model_name').text();
                	var form_temp_id = contents.find('#form_temp_id').text();
                	
                	self._rpc({
            			model: 'hm.form.template',
            			method: 'cancel_order',
            			args: [0, order_id, model_name, form_temp_id],
            		}).then(function(result){
            			//console.log('result'+result)
            			/*contents.find('#order-draft').addClass('btn-active');
            			contents.find('#order-cancel').removeClass('btn-active');
            			contents.find('#order-draft').css({'display': 'block'});
            			contents.find('#cancel').css({'display': 'block'});
            			contents.find('#cancel').addClass('active');
                    	contents.find('#done').removeClass('active');*/
            			self.update_records(self, el_node, vendor_categ_id, dashboard_id, line_id, true, result['edit_form_id'], result['order_id'], vendor_id)
                    	
            		});
                });
               
                /** Confirm Action */
                contents.off('click','#order_confirm, #action_confirm');
                contents.on('click','#order_confirm, #action_confirm',function(){
                	var order_datas = {}
                	var line_order_datas = []
                	var line_data = {}
                	var error = false;
                	var order_id = contents.find('#order_id').text();
                	var form_temp_id = contents.find('#form_temp_id').text();
                	var model_name = contents.find('#model_name').text();
                	var vendor_id = contents.find('#vendor_id').text();
                	var line_form_temp_id = contents.find('#line_form_temp_id').text();
                	var line_model_name = contents.find('#line_model_name').text();
                	
                	/** Order Details */
                	
                	$('table.order-form-detail').each(function() {
	                	for(var i=0; i<form_fields_records.length; i++){
	                		var field = form_fields_records[i].form_fields;
	                		var mandatory =form_fields_records[i].isMandatory;
	                		if(form_fields_records[i].form_field_type == 'label'){
	                			var value = $(this).find('span#'+form_fields_records[i].form_fields).text();
	                			order_datas[field] = value.trim();
	                		}
	                		if(form_fields_records[i].form_field_type == 'input_char'){
	                			var value = $(this).find('input#'+form_fields_records[i].form_fields).val();
	                			order_datas[field] = value;
	                			if(form_fields_records[i].form_fields == 'guest_name'){
	                				var value1 =  $(this).find('#product_id option:selected').attr("id");
	                				order_datas['product_id'] = value1;
	                				
	                			}
	                			if(!value && mandatory){
	                				error = true;
	                				$(this).find('input#'+form_fields_records[i].form_fields).css({'border': '1px solid red'});
	                			}
	                			//console.log('value'+value);
	                		}
	                		if(form_fields_records[i].form_field_type == 'date'){
	                			var value = $(this).find('input#'+form_fields_records[i].form_fields).val();
	                			order_datas[field] = value;
	                			if(!value && mandatory){
	                				error = true;
	                				$(this).find('input#'+form_fields_records[i].form_fields).css({'border': '1px solid red'});
	                			}
	                			//console.log('value'+value);
	                		}
	                		if(form_fields_records[i].form_field_type == 'many2one'){
	                			var value1 =  $(this).find('#'+form_fields_records[i].form_fields+' option:selected').val();
	                			var value =  $(this).find('#'+form_fields_records[i].form_fields+' option:selected').attr("id");
	                			order_datas[field] = value;
	                			if(!value && mandatory){
	                				error = true;
	                				$(this).find('select#'+form_fields_records[i].form_fields).css({'border': '1px solid red'});
	                			}
	                			//console.log('value'+value);
	                			//console.log('value1:'+value1);
	                		}
	                	}
                	});
                	
                	/** OrderLine Details */
                	var tr_count = 0;
                	$('table.orderline-form-detail tr').each(function() {
                		line_data = {}
                		if(tr_count > 0) {
	                		for(var i=0; i<line_form_fields.length; i++){
		                		console.log('field'+ line_form_fields[i].form_fields)
		                		var field = line_form_fields[i].form_fields;
		                		var mandatory =line_form_fields[i].isMandatory;
		                		
		                		if(line_form_fields[i].form_field_type == 'label'){
		                			var value = $(this).find('input#'+line_form_fields[i].form_fields).val();
		                			line_data[field] = value;
		                			if(!value && mandatory){
		                				error = true;
		                				$(this).find('input#'+line_form_fields[i].form_fields).css({'border': '1px solid red'});
		                			}
		                		}
		                		
		                		if(line_form_fields[i].form_field_type == 'input_char'){
		                			var value = $(this).find('input#'+line_form_fields[i].form_fields).val();
		                			line_data[field] = value;
		                			if(!value && mandatory){
		                				error = true;
		                				$(this).find('input#'+line_form_fields[i].form_fields).css({'border': '1px solid red'});
		                			}
		                		}
		                		if(line_form_fields[i].form_field_type == 'input_int'){
		                			var value = $(this).find('input#'+line_form_fields[i].form_fields).val();
		                			line_data[field] = value;
		                			if(!value && mandatory){
		                				error = true;
		                				$(this).find('input#'+line_form_fields[i].form_fields).css({'border': '1px solid red'});
		                			}
		                		}
		                		if(line_form_fields[i].form_field_type == 'many2one'){
		                			var value1 =  $(this).find('#'+line_form_fields[i].form_fields+' option:selected').val();
		                			var value =  $(this).find('#'+line_form_fields[i].form_fields+' option:selected').attr("id");
		                			line_data[field] = value;
		                			if(!value && mandatory){
		                				error = true;
		                				$(this).find('select#'+line_form_fields[i].form_fields).css({'border': '1px solid red'});
		                			}
		                		}
		                		if(line_form_fields[i].form_field_type == 'many2many'){
		                			var extra_work = []
		                			var j=0;
		                			$(this).find('#'+line_form_fields[i].form_fields+' option:selected').each(function(){
		                				var value = parseInt($(this).val(), 10);
		                				extra_work[j] = value;
		                				j = j +1;
		                			});	
		                			if(extra_work.length > 0){
		                				extra_work = [[6, false, extra_work]] ;
		            				}
		                			line_data[field] = extra_work;
		                		}
	                		}
	                		line_order_datas.push(line_data)
                		}
                		tr_count = tr_count + 1;
                	});
                	//console.log('Order Datas'+ JSON.stringify(line_order_datas));
                	//console.log('error'+ error);
                	if(!error){
                		console.log('inner')
	                	self._rpc({
	            			model: 'hm.form.template',
	            			method: 'create_order',
	            			args: [0,order_datas, order_id, form_temp_id, model_name, vendor_id, line_order_datas, line_form_temp_id, line_model_name],
	            		}).then(function(result){
	            			console.log('result'+result)
	            			/*contents.find('#order_id').text(result);
	            			contents.find('#order-confirm').removeClass('btn-active');
	            			contents.find('#order-cancel').addClass('btn-active');
	            			contents.find('#order-draft').css({'display': 'none'});
	            			
	            			contents.find('#open').removeClass('active');
	                    	contents.find('#done').addClass('active');
	                    	contents.find('#cancel').css({'display': 'none'});*/
	            			//console.log('span:'+contents.find('#order_id').text())
	            			self.update_records(self, el_node, vendor_categ_id, dashboard_id, line_id, true, result['edit_form_id'], result['order_id'], vendor_id)
	            		});
                	}
                });
                
                /** Create Invoice */
                contents.off('click','#order_invoice');
                contents.on('click','#order_invoice',function(){
                	var order_id = contents.find('#order_id').text();
                	var form_temp_id = contents.find('#form_temp_id').text();
                	var model_name = contents.find('#model_name').text();
                	
                	self._rpc({
            			model: 'hm.form.template',
            			method: 'create_invoice',
            			args: [0, order_id, form_temp_id, model_name],
            		}).then(function(result){
            			self.update_records(self, el_node, vendor_categ_id, dashboard_id, line_id, true, result['edit_form_id'], result['order_id'], vendor_id)
                    	
            		});
                });
                
                /** Action for Validate the Invoice */
                contents.off('click','#invoice_validate');
                contents.on('click','#invoice_validate',function(){
                	var order_id = contents.find('#order_id').text();
                	var form_temp_id = contents.find('#form_temp_id').text();
                	var model_name = contents.find('#model_name').text();
                	
                	self._rpc({
            			model: 'hm.form.template',
            			method: 'validate_invoice',
            			args: [0, order_id, form_temp_id, model_name],
            		}).then(function(result){
            			self.update_records(self, el_node, vendor_categ_id, dashboard_id, line_id, true, result['edit_form_id'], result['order_id'], vendor_id)
                    	
            		});
                });
                
                /** Action for Return Dress */
                contents.off('click','#order_return');
                contents.on('click','#order_return',function(){
                	var order_id = contents.find('#order_id').text();
                	var form_temp_id = contents.find('#form_temp_id').text();
                	var model_name = contents.find('#model_name').text();
                	
                	self._rpc({
            			model: 'hm.form.template',
            			method: 'return_dress',
            			args: [0, order_id, form_temp_id, model_name],
            		}).then(function(result){
            			self.update_records(self, el_node, vendor_categ_id, dashboard_id, line_id, true, result['edit_form_id'], result['order_id'], vendor_id)
                    	
            		});
                });
                
                /** Stock Validate */
                contents.off('click','#button_validate');
                contents.on('click','#button_validate',function(){
                	var order_id = contents.find('#order_id').text();
                	var form_temp_id = contents.find('#form_temp_id').text();
                	var model_name = contents.find('#model_name').text();
                	
                	self._rpc({
            			model: 'hm.form.template',
            			method: 'stock_validate',
            			args: [0, order_id, form_temp_id, model_name],
            		}).then(function(result){
            			self.update_records(self, el_node, vendor_categ_id, dashboard_id, line_id, true, result['edit_form_id'], result['order_id'], vendor_id)
                    	
            		});
                });
                
                /** Add Line Action */
                contents.off('click','.add-line');
                contents.on('click','.add-line',function(e){
                	var line_order_datas = {};
                	var error = false;
                	$(this).closest('tr').each(function() {
                		for(var i=0; i<line_form_fields.length; i++){
	                		//console.log('field'+ line_form_fields[i].form_fields)
	                		var field = line_form_fields[i].form_fields;
	                		var mandatory =line_form_fields[i].isMandatory;
	                		
	                		if(line_form_fields[i].form_field_type == 'input_char'){
	                			var value = $(this).find('input#'+line_form_fields[i].form_fields).val();
	                			line_order_datas[field] = value;
	                			if(!value && mandatory){
	                				error = true;
	                				$(this).find('input#'+line_form_fields[i].form_fields).css({'border': '1px solid red'});
	                			}
	                		}
	                		if(line_form_fields[i].form_field_type == 'input_int'){
	                			//console.log('int')
	                			var value = $(this).find('input#'+line_form_fields[i].form_fields).val();
	                			line_order_datas[field] = value;
	                			if(!value && mandatory){
	                				error = true;
	                				$(this).find('input#'+line_form_fields[i].form_fields).css({'border': '1px solid red'});
	                			}
	                		}
	                		if(line_form_fields[i].form_field_type == 'many2one'){
	                			var value1 =  $(this).find('#'+line_form_fields[i].form_fields+' option:selected').val();
	                			var value =  $(this).find('#'+line_form_fields[i].form_fields+' option:selected').attr("id");
	                			line_order_datas[field] = value;
	                			if(!value && mandatory){
	                				error = true;
	                				$(this).find('select#'+line_form_fields[i].form_fields).css({'border': '1px solid red'});
	                			}
	                		}
	                		if(line_form_fields[i].form_field_type == 'many2many'){
	                			var extra_work = []
	                			var j=0;
	                			$(this).find('#'+line_form_fields[i].form_fields+' option:selected').each(function(){
	                				var value = parseInt($(this).val(), 10);
	                				extra_work[j] = value;
	                				j = j +1;
	                			});	
	                			line_order_datas[field] = extra_work;
	                			//console.log('extra_work'+extra_work)
	                		}
                		}
                	});
                	if(!error){
	                	var new_row = $(".orderline-form-detail").find('tr').eq(1).clone(true);
	                	new_row.find('span.delete-line').css({'display':'block'});
	                	new_row.find("input[type='text']").each(function() {
	                		$(this).val('')
	    	    		});
	    	    		new_row.find("input[type='number']").each(function() {
	    	    			$(this).val('')
	    	    		});
	    	    		/*new_row.find('.chosen-choices li.search-choice').each(function() {
	    	    			$(this).remove();
	    	    		});*/
	    	    		//console.log('HTML'+new_row.find('#extra_work').html())
	    	    		//console.log('TD::'+new_row.find('.washing-work').closest('td').html().find('#extra_work'))
	    	    		new_row.find('.washing-work').closest('td').replaceWith('<td><select class="detail chosen washing-work" data-order="true" multiple="true" name="washing-work" id="extra_work" style="display: none;">'+
	    	    				new_row.find('#extra_work').html()+
	    	    				'</select></td>');
	    	    		
	    	    		//console.log('new_row'+JSON.stringify(new_row));
	    	    		//new_row.find('.washing-work').attr('id', 'worktest');
	    	    		//new_row.find('.washing-work').removeClass('washing-work');
	    	    		//new_row.find('.extra_work_chosen').attr('id','extra_work_chosen1');
	    	    		/*new_row.find(".washing-work").chosen({
        					width : "69%",
        					enable_search_threshold : 10
        				}).change(function(e) {
        					// $('#extra_work_chosen').css({'border': '0px solid red'});
        					 var value = $(this).val();
        					 $(this).find(".washing-work").val(value);
        					 	
        				});*/
	    	    		
	                	$('.orderline-form-detail tbody').append(new_row);
	                	contents.find(".washing-work").chosen({
        					width : "69%",
        					enable_search_threshold : 10
        				}).change(function(e) {
        					// $('#extra_work_chosen').css({'border': '0px solid red'});
        					 var value = $(this).val();
        					 $(this).find(".washing-work").val(value);
        					 	
        				});
                	}
                });
                
                /** Delete Action */
                contents.off('click','.delete-line');
                contents.on('click','.delete-line',function(e){
                	$(this).closest('tr').remove();
                });
                
                /** Set the amount for Laundry */
                contents.on('change','#washing_type',function(e){
                	var extra_amt = 0;
                	var work_amt = $(this).closest('td').find("option:selected").attr('amt');
                	if(work_amt == undefined || work_amt == ''){
                		work_amt = 0;
                	}
                	var qty = $(this).closest('tr').find('input#qty').val();
                	if(qty == '' || qty == undefined){
                		qty = 0;
                	}
                	$(this).closest('tr').find('#extra_work option:selected').each(function(){
                		extra_amt = extra_amt + parseFloat($(this).attr('amt'));
                	});
                	var tamt = parseFloat(extra_amt) + parseFloat(work_amt);
                	var total_amount = parseInt(qty) * tamt;
                	$(this).closest('tr').find('#amount').val(total_amount);
                });
               
                contents.on('change','#extra_work',function(e){
                	var extra_amt = 0;
                	var work_amt = $(this).closest('tr').find("#washing_type option:selected").attr('amt');
                	if(work_amt == undefined || work_amt == ''){
                		work_amt = 0;
                	}
                	var qty = $(this).closest('tr').find('input#qty').val();
                	if(qty == '' || qty == undefined){
                		qty = 0;
                	}
                	$(this).closest('td').find('#extra_work option:selected').each(function(){
                		extra_amt = extra_amt + parseFloat($(this).attr('amt'));
                	});
                	var tamt = parseFloat(extra_amt) + parseFloat(work_amt);
                	var total_amount = parseInt(qty) * tamt;
                	$(this).closest('tr').find('#amount').val(total_amount);
                });
                
                contents.on('blur change keydown keyup paste input','#qty',function(e){
                	var extra_amt = 0;
                	var work_amt = $(this).closest('tr').find("#washing_type option:selected").attr('amt');
                	if(work_amt == undefined || work_amt == ''){
                		work_amt = 0;
                	}
                	var qty = $(this).closest('td').find('input#qty').val();
                	if(qty == '' || qty == undefined){
                		qty = 0;
                	}
                	$(this).closest('tr').find('#extra_work option:selected').each(function(){
                		extra_amt = extra_amt + parseFloat($(this).attr('amt'));
                	});
                	var tamt = parseFloat(extra_amt) + parseFloat(work_amt);
                	var total_amount = parseInt(qty) * tamt;
                	$(this).closest('tr').find('#amount').val(total_amount);
                });
                
                /** Collect OrderLine details for selected Laundry Order and set the datas to stock move */
                contents.on('change','#laundry_order_id',function(e){
                	var order_id = $(this).closest('td').find("option:selected").attr('id');
                	//var model_name = contents.find('#model_name').text();
                	self._rpc({
            			model: 'hm.form.template',
            			method: 'get_orderline_detail',
            			args: [0, order_id],
            		}).then(function(result){
            			//console.log('Lines:'+JSON.stringify(result));
            			var new_row = $(".orderline-form-detail").find('tr').eq(1).clone(true);
            			if(result.length >0){
            				$('.orderline-form-detail tbody').replaceWith('<tbody></tbody>');
            			}else{
            				new_row.find("input[type='text']").each(function() {
    	                		$(this).val('')
    	    	    		});
    	    	    		new_row.find("input[type='number']").each(function() {
    	    	    			$(this).val('')
    	    	    		});
    	    	    		$('.orderline-form-detail tbody').replaceWith('<tbody>'+new_row.html()+'</tbody>');
            			}
                    	for(var i=0; i<result.length; i++){
                    		new_row.find('#product_id').attr('class', 'drop-down-select');
                    		new_row.find('#product_id').val(result[i]['product_name']);
                    		new_row.find('#product_uom_qty').val(result[i]['qty']);
                    		new_row.find('#quantity_done').val(result[i]['qty']);
                    		$('.orderline-form-detail tbody').append(new_row);
                    	}
            		});
                });
                
                /** Get Laundry Stock Report for selected vendor */
                contents.on('change','#laundry-vendor',function(e){
                	var vendor_id = $(this).find("option:selected").attr('id');
                	self.update_records(self, el_node, vendor_categ_id, dashboard_id, line_id, false, 0, 0, vendor_id)
                });
    		});
        	       	
        });
        
    },
    dashboard_icon_url: function(id){
        return '/web/image?model=hm.vendor.dashboard&id='+id+'&field=image';
    },
    
    dashboard_line_icon_url: function(id){
        return '/web/image?model=hm.vendor.dashboard.line&id='+id+'&field=image';
    },
    
    get_dashboard_line: function(id){
    	return this.pos.db.get_dashboardline_by_dashboard(id);
    },
    
    get_vendors: function(category_id){
    	return this.pos.db.get_vendor_by_category(category_id);
    },
    
    vendor_image_url: function(id){
    	return '/web/image?model=res.partner&id='+id+'&field=image';
    },
    
    sub_template_line_icon_url: function(id){
    	return '/web/image?model=hm.sub.form.template.line&id='+id+'&field=image';
    },
    car_icon_url: function(id){
    	return '/web/image?model=hm.car.type&id='+id+'&field=image';
    },

    render_list: function(dashboards){
        var contents = this.$el[0].querySelector('.vendor-category');
        contents.innerHTML = "";
        var dashboard_html = QWeb.render('VendorDashboard',{widget: this, dashboards:dashboards});
        var dashboardline = document.createElement('div');
        dashboardline.innerHTML = dashboard_html;
        dashboardline = dashboardline.childNodes[1];
        contents.appendChild(dashboardline);
    },
    update_records: function(self, el_node, vendor_categ_id, dashboard_id, line_id, if_form, sub_temp_id, order_id, vendor_id){
    	self._rpc({
			model: 'hm.form.template',
			method: 'get_vendor_list',
			args: [0,vendor_categ_id, dashboard_id, line_id, if_form, sub_temp_id, order_id, vendor_id],
		}).then(function(result){ 
			var result_datas = result[0]['result_datas']
			var line_group = result[0]['line_group']
			var line_group_key = result[0]['line_group_key']
			var form_view = result[0]['form_view']
			var form_name = result[0]['form_name']
			var text_color = result[0]['text_color']
			var sub_form_template = result[0]['sub_form_template']
			var products = result[0]['products']
			var template_lines = result[0]['template_lines']
			var current_order = result[0]['current_order']
			var current_order_lines = result[0]['current_order_lines']
			var form_temp_id = result[0]['form_temp_id']
			var model_name = result[0]['model_name']
			var vendor_id = result[0]['vendor_id']
			var sub_line_group = result[0]['sub_line_group']
			var sub_line_group_key = result[0]['sub_line_group_key']
			//var sub_line_group_array = result[0]['sub_line_group_array']
			//var sub_line_group_key_array = result[0]['sub_line_group_key_array']
			var temp_order_lines = result[0]['temp_order_lines']
			var line_form_temp_id = result[0]['line_form_temp_id']
			var line_model_name = result[0]['line_model_name']
			var is_other = result[0]['is_other']
			var all_location = result[0]['all_location']
			var stock_move_datas = result[0]['stock_move_datas']
			var vendor_list = result[0]['vendor_list']
			
			
			var fcontents = el_node.find('.vendor-contents');
        	fcontents.innerHTML = "";
        	var vendor_html = QWeb.render('VendorListContent',{widget: self, result_datas: result_datas, form_view: form_view,
				form_name: form_name, text_color:text_color, sub_form_template: sub_form_template, products: products, vendor_id: vendor_id,
				template_lines: template_lines, current_order: current_order, current_order_lines: current_order_lines,
				form_temp_id: form_temp_id, model_name: model_name,
				line_form_temp_id: line_form_temp_id, line_model_name: line_model_name,
				line_group: line_group, line_group_key: line_group_key, 
				sub_line_group: sub_line_group, sub_line_group_key: sub_line_group_key,
				//sub_line_group_array: sub_line_group_array, sub_line_group_key_array: sub_line_group_key_array,
				temp_order_lines: temp_order_lines, is_other: is_other,
				all_location: all_location, stock_move_datas: stock_move_datas, vendor_list: vendor_list});
            var vendorlist = document.createElement('div');
            vendorlist.innerHTML = vendor_html;
            vendorlist = vendorlist.childNodes[1];
            fcontents.empty();
            fcontents.append(vendorlist);
            fcontents.find(".washing-work").chosen({
				width : "69%",
				enable_search_threshold : 10
			}).change(function(e) {
				 var value = $(this).val();
				 $(this).find("#extra_work").val(value);
				 	
			});
            
            var table = el_node.find('#vendor_order_list').DataTable({
		        bSort: false,
		        bFilter: false,
		        bPaginate: true, 
		        pageLength: 10,
			});
            
            /** Disabled the Order details for [order, done, cancel, return] state */
            if(current_order.length > 0){
	            if((current_order[0]['state'] == 'order') || (current_order[0]['state'] == 'done') || 
	            		(current_order[0]['state'] == 'cancel') || (current_order[0]['state'] == 'return')){
	            	$('table.order-form-detail').each(function() {
	            		$(this).find("input").attr('disabled',true);
	            		$(this).find("select").attr('disabled',true);
	            	});
	            	$('table.orderline-form-detail tr').each(function() {
	            		$(this).find("input").attr('disabled',true);
	            		$(this).find("select").attr('disabled',true);
	            		$(this).find("select.chosen").attr('disabled',true).trigger("chosen:updated");
	            		$(this).find("span.add-line").css({'display':'none'});
	            		$(this).find("span.delete-line").css({'display':'none'});
	            	});
	            }
            }
           
		});
    }
   
  
});
gui.define_screen({name:'vendor_dashboard', widget: VendorDashboardScreenWidget});

});