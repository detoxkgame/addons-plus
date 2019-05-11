odoo.define('skit_hotel_management.room_reservation', function (require) {
"use strict";
var PosBaseWidget = require('point_of_sale.BaseWidget');
var chrome = require('point_of_sale.chrome');
var gui = require('point_of_sale.gui');
var models = require('point_of_sale.models');
var screens = require('point_of_sale.screens');
var core = require('web.core');
var rpc = require('web.rpc');
var PopupWidget = require('point_of_sale.popups');
var is_room_confirmed = false;
var is_service_confirmed = false;
var is_purchase_confirmed = false;
var night_audit_subid=0;
var QWeb = core.qweb;
var _t = core._t;

var _super = models.Order.prototype;
models.Order = models.Order.extend({
	initialize: function(attributes,options){
		_super.initialize.apply(this,arguments);
		 this.is_sessionclose = false;
		 this.save_to_db();
	},
	/* Session close */
	set_is_sessionclose: function(is_orderlists) {
        this.is_sessionclose = is_orderlists;
        this.trigger('change');
    },
    get_is_sessionclose: function(){
        return this.is_sessionclose;
    },
  });
var ServiceOrderPopupWidget = PopupWidget.extend({
    template: 'ServiceOrderPopupWidget',
    click_confirm: function(){
    	var self = this;
    	this.gui.close_popup();
    	var order = this.pos.get_order();
 		var datas = order.export_as_JSON();
 		this._rpc({
 			model: 'pos.order',
    		method:'create_pos_service_order',
    		args: [datas],
 		}).then(function(result){
 			self.gui.show_screen('room_reservation');
    	});
    },
   
    click_cancel: function(){
    	this.gui.close_popup();
    	this.gui.show_screen('room_reservation');
    }
});

gui.define_popup({name:'popup_service_order', widget: ServiceOrderPopupWidget});

var HMWaringPopupWidget = PopupWidget.extend({
    template: 'HMWaringPopupWidget',
    
    click_cancel: function(){
    	this.gui.close_popup();
    }
});

gui.define_popup({name:'popup_hm_warning', widget: HMWaringPopupWidget});

var HMComplaintPopupWidget = PopupWidget.extend({
    template: 'HMComplaintPopupWidget',
    events: _.extend({}, PopupWidget.prototype.events, {
    	'click .button.hm-cancel':  'click_cancel',
        'click .button.hm-ok': 'click_ok',
	}),
    
    click_cancel: function(){
    	this.gui.close_popup();
    },
    
    click_ok: function(){
    	var self = this;
    	var reason = $('#complaint').val();
    	var folio_id = $('#room_folio_id').text();
    	var sub_id = $('#room_sub_id').text();
    	var room_datas = $('#room_datas').text();
    	if(sub_id > 0){
	    	this._rpc({
				model: 'hm.complaint',
				method: 'create_complaint',
				args: [folio_id, reason],
			}).then(function(result){
		    	var contents = $('.hm-reservation-content');
		    	self._rpc({
			   		 model: 'hm.form.template',
			   		 method: 'get_center_panel_form',
			   		 args: [0, sub_id, folio_id],
			   	 }).then(function(result){
			   		 var form_name = result[0]['form_name']
			   		 var center_panel_temp = result[0]['center_panel_temp']
			   		 var center_panel_sub_id = result[0]['center_panel_sub_id']
			   		 var form_view = result[0]['form_view']
			   		 var floor_id = result[0]['floor_id']
			   		 var res_table_sub_id = result[0]['center_panel_temp'][0][0]['res_table_sub_id'];
			   		 var center_panel_html = QWeb.render('CenterPanelContent',{widget: self, 
			   				form_name: form_name, form_view: form_view,
			   				center_panel_temp: center_panel_temp,
								center_panel_sub_id: center_panel_sub_id,
								floor_id: floor_id,
								});
			   		 contents.find('.hm-center-form-design').html(center_panel_html);
			   			
			   		 if(form_view == "restaurant_table"){
			   			 sub_template_id = res_table_sub_id;
			   			 if(sub_template_id > 0){
			   				 contents.find('#restaurant_table').text('checkout');
			   			 }else{
			   				 contents.find('#restaurant_table').text('true');
			   			 }
			   			 self.render_rooms(floor_id,contents, res_table_sub_id); 
			   		 }
			   	 });
				self.gui.close_popup();
			});
    	}
    	else{
    		self.gui.close_popup();
			self._rpc({
	     			model: 'pos.order',
	     			method:'update_order',
	     			args: [0, room_datas, folio_id, reason],
	     		}).then(function(result){
	     			self.pos.gui.show_popup('alert',{
                     'title': _t('Success'),
                     'body': _t('Thanks for Booking. Your Reservation is confirmed.'),
                });
	     		});
		}
	}
});

gui.define_popup({name:'popup_hm_complaint', widget: HMComplaintPopupWidget});

var RoomReservationScreenWidget = screens.ScreenWidget.extend({
    template: 'RoomReservationScreenWidget',
    init: function(parent, options){
        this._super(parent, options);
       
    },
    hide: function(){
        this._super();
       
        this.chrome.widget.order_selector.show();
    },
    show: function(){
    	var self = this;
    	var dashboard_id = 0;
        this._super();
        this.chrome.widget.order_selector.hide();
        
        var contents = this.$('.hm-reservation-content');
        
       // this.render_list();
       /* contents.off('click','.back'); 
        contents.on('click','.back',function(){
        	self.gui.show_screen('firstpage');
        });*/
       /* this.$('.back').click(function(){
        	self.gui.show_screen('firstpage');
        });*/
        /*this.$('.product').click(function(){
        	self.gui.show_screen('products');
        });*/
        this._rpc({
			model: 'hm.form.template',
			method: 'get_room_reservation',
			args: [0, 0],
		}).then(function(result){
			//var result_datas = result[0]['result_datas']
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
			//var vendor_id = result[0]['vendor_id']
			var sub_line_group = result[0]['sub_line_group']
			var sub_line_group_key = result[0]['sub_line_group_key']
			var sub_line_group_array = result[0]['sub_line_group_array']
			var sub_line_group_key_array = result[0]['sub_line_group_key_array']
			var top_panel_temp = result[0]['top_panel_temp']
			var center_panel_temp = result[0]['center_panel_temp']
			var left_panel_temp = result[0]['left_panel_temp']
			var right_panel_temp = result[0]['right_panel_temp']
			var center_panel_sub_id = result[0]['center_panel_sub_id']
			var model_method_datas = result[0]['model_method_datas']
			var sub_template_id = 0;
			
			var vendor_table = null;
			//var floor_id = 1;
			//console.log("Check:"+JSON.stringify(model_method_datas))
			var contents = self.$('.hm-reservation-content');
			contents.innerHTML = "";
	        var reservation_html = QWeb.render('ReservationContent',{widget: self, 
	        						line_group: line_group, line_group_key: line_group_key,
	        						sub_line_group: sub_line_group, sub_line_group_key:sub_line_group_key,
	        						sub_line_group_array: sub_line_group_array, sub_line_group_key_array: sub_line_group_key_array,
	        						form_view: form_view, form_name: form_name, text_color: text_color,
	        						form_temp_id: form_temp_id, model_name: model_name,
	        						current_order: current_order, current_order_lines: current_order_lines,
	        						sub_form_template: sub_form_template,
	        						top_panel_temp: top_panel_temp, center_panel_temp: center_panel_temp,
	        						left_panel_temp: left_panel_temp, right_panel_temp: right_panel_temp,
	        						center_panel_sub_id: center_panel_sub_id,
	        						model_method_datas: model_method_datas
	        						});
	      
	        var reservationform = document.createElement('div');
	        reservationform.innerHTML = reservation_html;
	        reservationform = reservationform.childNodes[1];
	        contents.empty();
	        contents.append(reservationform);
	        
	        /** Back Icon Action */
	        contents.off('click','.hm-back-float');
	        contents.on('click','.hm-back-float',function(){
	        	self.gui.show_screen('firstpage');
	        });
	        
	        /** Set the Default Form (Reservation Form) */
	        var center_sub_id = contents.find('#center_sub_form').attr('subid');
	        contents.find('#top_panel'+center_sub_id).addClass("hm-top-inner-selected");
	        
	        /** Load the form in Center Panel */
	        contents.off('click','.top_panel_form_btn');
	        contents.on('click','.top_panel_form_btn',function(){
	        	contents.find('.hm-top-inner-selected').removeClass("hm-top-inner-selected");
	        	var subid = $(this).attr('subid');
	        	$(this).addClass("hm-top-inner-selected");
	        	self._rpc({
	    			model: 'hm.form.template',
	    			method: 'get_center_panel_form',
	    			args: [0, subid, 0],
	    		}).then(function(result){
	    			var form_name = result[0]['form_name']
	    			var center_panel_temp = result[0]['center_panel_temp']
	    			var center_panel_sub_id = result[0]['center_panel_sub_id']
	    			var form_view = result[0]['form_view']
	    			var floor_id = result[0]['floor_id']
	    			//alert(JSON.stringify(center_panel_temp))
	    			
	    			var center_panel_html = QWeb.render('CenterPanelContent',{widget: self, 
	    				form_name: form_name, form_view: form_view,
	    				center_panel_temp: center_panel_temp,
						center_panel_sub_id: center_panel_sub_id,
						floor_id: floor_id,
						});
	    			//var centerform = document.createElement('div');
	    			//centerform.innerHTML = center_panel_html;
	    			//centerform = reservationform.childNodes[1];
	    			contents.find('.hm-center-form-design').html(center_panel_html);
	    			vendor_table = self.$('#vendor_order_list').DataTable({
        		        bSort: false,
        		        bFilter: false,
        		        bPaginate: true, 
        		        pageLength: 10,
        			});
	    			if(form_view == "restaurant_table"){
	    				var res_table_sub_id = result[0]['center_panel_temp'][0][0]['res_table_sub_id'];
	    				sub_template_id = res_table_sub_id;
	    				if(sub_template_id > 0){
	    					contents.find('#restaurant_table').text('checkout');
	    				}else{
	    					contents.find('#restaurant_table').text('true');
	    				}
	    				self.render_rooms(floor_id,contents, res_table_sub_id, form_name); 
	    			}
	    			// Room Status Report
	    			if(form_view == "room_status_report"){
	    				self.status_report(contents);  
	    				//To display reservation form while onclick in the status
	    				contents.off('click','.rows_item');
	    				contents.on('click', '.rows_item', function(){
	    					var order_id = $(this).attr('data-id');
	    					var prod_id = $(this).attr('data-prod_id');
	    					var categ_name = $(this).attr('data-name');
	    					var date = $(this).attr('format-date');
    		    			var linegroup = center_panel_temp[0]
    		    			//alert('temp_id'+JSON.stringify(linegroup[0]['line_group'][1][0]['sub_template_id']))
    		    			var sub_id = linegroup[0]['line_group'][1][0]['sub_template_id']
    			        	$(this).addClass("hm-top-inner-selected");
    		    			
	    					if(order_id == undefined){//without order_id
	    						self._rpc({
		    		    			model: 'hm.form.template',
		    		    			method: 'get_center_panel_form',
		    		    			args: [0, sub_id, 0],
		    		    		}).then(function(result){
		    		    			var form_name = result[0]['form_name']
		    		    			var center_panel_temp = result[0]['center_panel_temp']
		    		    			var center_panel_sub_id = result[0]['center_panel_sub_id']
		    		    			var form_view = result[0]['form_view']
		    		    			center_panel_temp[0][0]['current_order'][0]['checkin_date'] = date + ' ' + '12:00 AM';
		    		    			center_panel_temp[0][0]['current_order_lines'][0]['product_id'] = prod_id;
		    		    			center_panel_temp[0][0]['current_order_lines'][0]['room_type_id'] = categ_name;
		    		    			
		    		    			var center_panel_html = QWeb.render('CenterPanelContent',{widget: self, 
		    		    				form_name: form_name, form_view: form_view,
		    		    				center_panel_temp: center_panel_temp,
		    							center_panel_sub_id: center_panel_sub_id
		    							});
		    		    			contents.find('.hm-center-form-design').html(center_panel_html);
		    		    		});
	    					}
	    					else{//With order_id
		    					self._rpc({
		    		    			model: 'hm.form.template',
		    		    			method: 'get_center_panel_form',
		    		    			args: [0, sub_id, order_id],
		    		    		}).then(function(result){
		    		    			var form_name = result[0]['form_name']
		    		    			var center_panel_temp = result[0]['center_panel_temp']
		    		    			var center_panel_sub_id = result[0]['center_panel_sub_id']
		    		    			var form_view = result[0]['form_view']
		    		    			
		    		    			var center_panel_html = QWeb.render('CenterPanelContent',{widget: self, 
		    		    				form_name: form_name, form_view: form_view,
		    		    				center_panel_temp: center_panel_temp,
		    							center_panel_sub_id: center_panel_sub_id
		    							});
		    		    			contents.find('.hm-center-form-design').html(center_panel_html);
		    		    		});
	    					}
	    				})
	    			}
	    		});
	        });
	        
	        /** Load the form in Center Panel using menu click */
	        contents.off('click','.menu_form_btn');
	        contents.on('click','.menu_form_btn',function(){
	        	contents.find('.hm-top-inner-selected').removeClass("hm-top-inner-selected");
	        	contents.find('.hm_menu_inner_selected').removeClass("hm_menu_inner_selected");
	        	var menu_name = $(this).attr('menu_name');
	        	$(this).addClass("hm_menu_inner_selected");
	        		var subid = $(this).attr('subid');
	        		if (night_audit_subid == 0 || (night_audit_subid == subid))
	        		{
			        	$(this).addClass("hm_menu_inner_selected");
			        	self._rpc({
			    			model: 'hm.form.template',
			    			method: 'get_center_panel_form',
			    			args: [0, subid, 0],
			    		}).then(function(result){
			    			var form_name = result[0]['form_name']
			    			var center_panel_temp = result[0]['center_panel_temp']
			    			var center_panel_sub_id = result[0]['center_panel_sub_id']
			    			var form_view = result[0]['form_view']
			    			var floor_id = result[0]['floor_id']
			    			//floor_id = $(this).find('.floor-selector .button .active').attr('data-id');
			    			var center_panel_html = QWeb.render('CenterPanelContent',{widget: self, 
			    				form_name: form_name, form_view: form_view,
			    				center_panel_temp: center_panel_temp,
								center_panel_sub_id: center_panel_sub_id,
								floor_id: floor_id,
								});
			    			//var centerform = document.createElement('div');
			    			//centerform.innerHTML = center_panel_html;
			    			//centerform = reservationform.childNodes[1];
			    			contents.find('.hm-center-form-design').html(center_panel_html);
			    			if(form_view == "restaurant_table"){
			    				self.render_rooms(floor_id,contents, 0, form_name); 
			    			}
			    			if(form_view == "night_audit"){
			    				self.render_night_audit(subid,contents);
			    			}
			    		});
	        		}
	        });

	        /** Tab click */
	        contents.off('click','.floor-selector .button');
	        contents.on('click','.floor-selector .button',function(){
	        	contents.find('.active').removeClass("active");
	        		var floor_id = $(this).attr('data-id');
	        		self.render_rooms(floor_id, contents, sub_template_id, ''); //
	        		$(this).addClass('active');	        		
	        });

	        /** Search Button Action - Find the Reserve Order */
	        contents.off('click','.hm-search-btn');
	        contents.on('click','.hm-search-btn',function(){
	        	var sub_id = $(this).attr('subid');
	        	var model_id = $(this).attr('model');
	        	var reserve_post = {};
	        	$('table.hm-search-form-table tr').each(function() {	
		        	$(this).find('input').each(function(index, element) {    
		        		reserve_post[element.name]=element.value;
	     			});
		        	$(this).find('select').each(function(index, element) {     						
		        		reserve_post[element.name]=element.value;
	     			});
	        	});
	        	//alert(JSON.stringify(reserve_post))
	        	self._rpc({
	    			model: 'hm.form.template',
	    			method: 'get_order_datas',
	    			args: [0, sub_id, model_id, reserve_post],
	    		}).then(function(result){
	    			var form_name = result[0]['form_name']
	    			var center_panel_temp = result[0]['center_panel_temp']
	    			var center_panel_sub_id = result[0]['center_panel_sub_id']
	    			var form_view = result[0]['form_view']
	    			
	    			var center_panel_html = QWeb.render('CenterPanelContent',{widget: self, 
	    				form_name: form_name, form_view: form_view,
	    				center_panel_temp: center_panel_temp,
						center_panel_sub_id: center_panel_sub_id
						});
	    			contents.find('.hm-center-form-design').html(center_panel_html);
	    		});
	        	
	        });
	        /*$(document).ready(function(){
	            $('[data-toggle="popover"]').popover();   
	        });*/
	       // contents.find('[data-toggle="popover"]').popover();  
	        
	        
	        
	        /** Remove Required */
            contents.off('focus','input');
            contents.on('focus','input',function(){
            	$(this).removeClass("warning");
            	
            });
            contents.off('focus','select');
            contents.on('focus','select',function(){
            	$(this).removeClass("warning");
            	
            });

	        /** Calendar - Set the date time */
	        contents.off('focus','#checkin_date');
	        contents.on('focus','#checkin_date',function(){
	        	$(this).datetimepicker({
 	   				todayHighlight: true,
 	   				format : 'D mm-dd-yyyy HH:ii P',     	   		    	
 	   		   	}).on('changeDate', function(e){ 
 	   		   		var in_date =contents.find('#checkin_date').val();
 	   		   		var out_date =contents.find('#checkout_date').val();
 	   		   		var checkin_date = in_date.replace('-', '/').replace('-', '/');
 	   		   		var checkout_date = out_date.replace('-', '/').replace('-', '/');
 	   		   		
	 	   		   	var date1 = new Date(checkin_date);
	     	   		var date2 = new Date(checkout_date);
	     	   		if((in_date.length > 0) && (out_date.length > 0)){
			     	   	if(date2 < date1){
			     	   		alert('Checkout date must be greater than check in date');
			     	   		return false;
			     	   	}
			     	   	var timeDiff = Math.abs(date2.getTime() - date1.getTime());
		     	    	var numberOfNights = Math.ceil(timeDiff / (1000 * 3600 * 24));
		     	    	if((numberOfNights != undefined) && (numberOfNights != 'NaN'))
		     	    	{
		     	    		contents.find('#no_night').val(numberOfNights);
		     	    	} 
	     	   		}
 	   		   	});
	        });
	        
	        contents.off('focus','#checkout_date');
	        contents.on('focus','#checkout_date',function(){
	        	$(this).datetimepicker({
 	   				todayHighlight: true,
 	   				format : 'D mm-dd-yyyy HH:ii P',     	   		    	
 	   		   	}).on('changeDate', function(e){ 
 	   		   		var in_date =contents.find('#checkin_date').val();
 	   		   		var out_date =contents.find('#checkout_date').val();
 	   		   		var checkin_date = in_date.replace('-', '/').replace('-', '/');
 	   		   		var checkout_date = out_date.replace('-', '/').replace('-', '/');
 	   		   		
	 	   		   	var date1 = new Date(checkin_date);
	     	   		var date2 = new Date(checkout_date);
	     	   		if(in_date.length <= 0){
		     	   		alert('Please enter checkin date');
		     	   		return false;
	     	   		}
		     	   	if(date2 < date1){
		     	   		alert('Checkout date must be greater than check in date');
		     	   		return false;
		     	   	}
		     	   	var timeDiff = Math.abs(date2.getTime() - date1.getTime());
	     	    	var numberOfNights = Math.ceil(timeDiff / (1000 * 3600 * 24));
	     	    	if((numberOfNights != undefined) && (numberOfNights != 'NaN'))
	     	    	{
	     	    		contents.find('#no_night').val(numberOfNights);
	     	    	} 
 	   		   	});
	        });
	        /** On change room action */
	        contents.off('change','#product_id');
	        contents.on('change','#product_id',function(){
	        	var product_id = contents.find("#product_id option:selected").val();
	        	self._rpc({
	    			model: 'hm.form.template',
	    			method: 'get_product_roomtype',
	    			args: [0, product_id],
	    		}).then(function(result){
	    			var room_type = result[0].id;
	    			//set respective categ_id in room type
	    			contents.find("#room_type_id").val(room_type);
	    			contents.find("#room_type_id").removeClass('hm-placeholder');
	    		});
            });
	        /** On change room_type action */
	        contents.off('change','#room_type_id');
            contents.on('change','#room_type_id',function(){
            	var categ_id = contents.find("#room_type_id option:selected").val();
            	self._rpc({
	    			model: 'hm.form.template',
	    			method: 'get_categ_products',
	    			args: [0, categ_id],
	    		}).then(function(result){
	    			var len = result.length;
	    			var selectbox = contents.find("#product_id");
	    		    selectbox.empty();
	    		    var list = '<option id="" disabled="disabled"  selected="selected" class="hm-form-input hm-placeholder">Room No</option>';
	    		    for (var i = 0; i < len; i++)
		      		{
	    		        list += "<option class='hm-form-input' style='color: black;' id='"+result[i].id+"' value='" +result[i].id+ "'>" +result[i].name+ "</option>";
	    		    }
	    		    //replace selection option in room based on room type
	    		    selectbox.html(list); 
	    		    contents.find("#product_id").addClass('hm-placeholder');
	    		});
            });
            	
	        /** Check In Button Action */
	        var order_post = {};
	        var order_line = [];
	        contents.off('click','#checkin, #reserve, #date_extend, #shift_room');
            contents.on('click','#checkin, #reserve, #date_extend, #shift_room',function(e){
            	var isProceed =true;
            	var id = $(this).attr('id');
            	var order_id = contents.find('#order_id').text();
            	var order_status="checkin";
            	if(id == 'reserve'){
            		order_status="reserved";
            	}
            	/** Start Check the Mandatory field */
            	$('input[ismandatory="true"]').each(function(index, element) {
					if (!$(this).val().length > 0) {										
						if(!(typeof attr !== typeof undefined)){
							$(this).addClass('warning');
							//$(this).removeClass('hide');
							isProceed = false;
						}else{
							$(this).removeClass('warning');
						}										
					}
					else{
						$(this).removeClass('warning');
					}
            	});
				$('select[ismandatory="true"]').each(function(index, element) {
					if ($(this).val() == null) {										
						if(!(typeof attr !== typeof undefined)){
							$(this).addClass('warning');
							isProceed = false;
						}else{
							$(this).removeClass('warning');
						}										
					}
					else{
						$(this).removeClass('warning');
					}
				});
            	/** End Check the Mandatory field */
				
            	if (!isProceed)
     			{
     				alert('Please fill mandatory fields.');
     				return false;
     			}else{
	            	var product_array=[];
	            	var order = self.pos.get_order();
	            	var no_night = 1;
	            	$('table.hm-form-table tr.hm-order-details').each(function() {	
	 					$(this).find('input').each(function(index, element) {  
	 						if($(this).attr('ftype')=='date'){
     							var value = element.value;
     							var datestring = value.split(" ");     						
     							var sd = datestring[2]+' '+datestring[3];  
     							var momentObj = moment(sd, ["h:mm A"]);
     							var date = datestring[1]+' '+momentObj.format("HH:mm");  
     							var dateval = date.replace('-', '/').replace('-', '/');
     							var dateTime = new Date(dateval);
     							dateTime = moment(dateTime).format("YYYY-MM-DD HH:mm:ss");     
     							order_post[element.name]=dateTime;
     						}else{
     							order_post[element.name]=element.value;
     							if(element.name == 'no_night'){
     								no_night = element.value;
     							}
     						}
	 						
	 					});
	 					
	 					$(this).find('select').each(function(index, element) {     						
	 						order_post[element.name]=element.value;
	         			});
	            	});
	            	$('table.hm-form-table tr.hm-orderline-details').each(function() {	
	            		var order_line_array ={};
	            		order_line_array['qty'] = no_night;
	 					$(this).find('input').each(function(index, element) {  
	 						order_line_array[element.name]=element.value;
	 						if(element.name == 'adult'){
	 							order_post[element.name]=element.value;
	 						}
	 					});
	 					
	 					$(this).find('select').each(function(index, element) {     						
	 						order_line_array[element.name]=parseInt(element.value);
	 						if(element.name =='product_id'){
	 							product_array.push(parseInt(element.value));
	 						}
	         			});
	 					
	 					order_line.push(order_line_array);
	            	});
	            	
	            	order_post['order_line'] = order_line;
	            	order_post['reservation_status'] = order_status;
	            	if(order_id != ''){
	            		if((id == 'date_extend') || (id == 'shift_room')){
	            			var title = 'Date Extend'
	            			if(id == 'shift_room')
	            				title = 'Shift Room'
	            			self.pos.gui.show_popup('popup_hm_complaint',{
		    	        		'title': title,
		    	        		'msg': '',
		    	        		'folio_id': order_id,
		    	        		'sub_id': 0,
		    	        		'order_post': JSON.stringify(order_post),
		    	        		
	            			});
	            		}else{
	            			self._rpc({
			 	     			model: 'pos.order',
			 	     			method:'update_order',
			 	     			args: [0, order_post, order_id, ''],
			 	     		}).then(function(result){
			 	     			self.pos.gui.show_popup('alert',{
				                     'title': _t('Success'),
				                     'body': _t('Thanks for Booking. Your Reservation is confirmed.'),
				                });
			 	     		});
	            		}
	            		
	            	}else{
	            		_.every(product_array, function(line){	
								var product =  self.pos.db.get_product_by_id(line);
								if(product!=undefined){
									order.add_product(product, {price: product.price});
								}
		 		    	}); 
	            	
		            	var cashregister=self.pos.cashregisters[0];				
				        for (var i = 0; i < self.pos.cashregisters.length; i++) { 		        	  
				        	var is_paylater = self.pos.cashregisters[i].journal['is_pay_later'];
				        	if(is_paylater){
				        		cashregister=self.pos.cashregisters[i];
				        	}
				        }
				        
				        var newPaymentline = new models.Paymentline({},{order: order, cashregister:cashregister, pos: self.pos});
				        newPaymentline.set_amount(order.get_due());
				        self._rpc({
		 	     			model: 'res.partner',
		 	     			method:'create_partner',
		 	     			args: [0, order_post],
		 	     		}).then(function(result){
		 	     			if(result){     	     		
			 		            order.paymentlines.add(newPaymentline);
			 		            order.set_reservation_details(order_post);    
			 		            if(result['is_exisit']){
			 		            	var client = self.pos.db.get_partner_by_id(result['id']);
				     				order.set_client(client);
				     				self.pos.push_order(order,{to_invoice:true}).then(function(){
				     					self.pos.get_order().finalize();         						 
			     						//self.pos.gui.show_screen('room_reservation');
			     						self.pos.gui.show_popup('alert',{
						                     'title': _t('Success'),
						                     'body': _t('Thanks for Booking. Your Reservation is booked'),
						                });
				     				});
			 		            }else{
				 		            self.pos.load_new_partner_id(result['id']).then(function(){
				 		            	var client = self.pos.db.get_partner_by_id(result['id']);
					     				order.set_client(client);
					     				self.pos.push_order(order,{to_invoice:true}).then(function(){
					     					self.pos.get_order().finalize();         						 
				     						//self.pos.gui.show_screen('room_reservation');
				     						self.pos.gui.show_popup('alert',{
							                     'title': _t('Success'),
							                     'body': _t('Thanks for Booking. Your Reservation is booked'),
							                });
					     				});
				 		            });
			 		            }
		 	     			}
		 	     		});
	            	}
            	}
            });
            
            /* Room supply booking */
  	       contents.off('click','.room_service');
  	        contents.on('click','.room_service',function(){
  	        	var room_id = $(this).attr('room_id');
  	        	var floor_id = $(this).attr('floor_id');
  	        	/** Render supply popup **/
  	        	if(room_id && room_id != 'false'){
  	        		$(this).addClass('select_room');
  	        		self.render_supply_items(room_id,floor_id,contents); //display items inside the popover
	  	        	$('.popper').popover({	  	        		
	  	        		container: "body",
	  	  	          	html: true,
	  	  	          	content: function() {
	  	  	          		 return $($(this).data('contentwrapper')).html();
	  	  	          		// return $(this).next('.popper-content').html();
	  	  	          	}
	  	        	}).click(function (e) {
	  	                $('.popper').not(this).popover('destroy');
	  	                contents.find('.select_room').removeClass('select_room');	
	  	            });
  	        	}
  	        	/** Popover Button Action*/
  	        	/** Confirm service*/
  	        	$('.popover .service_confirm').on('click', function (e) {
  	  	        	var items=[]
  	  	        	var supply_detail=[]
  	  	        	var closest_div = $(e.currentTarget).closest('.confirm_rs');
  	  	        	var supplier_id = closest_div.find('.select_supplier option:selected').val();
  	  	 	    		closest_div.find('input').each(function(index, element) { 
  	  	 	    			var items_array ={};
  	  	 	    			if(this.checked){
  	  	 	 	    			var item_id = $(this).attr('item_id');
  	  	 						items_array[element.name]=element.value;
  	  	 						items_array['item_id'] = parseInt(item_id);
  	  	 						items.push({
  	  	 							'room_id':room_id,
  	  	 							'items':items_array
  	  	 						})
  	  	 	    			}
  	  					});
  	  	 	    		supply_detail.push({
  	  						'room_no':room_id,
  	  						'room_supply_details':items,
  	  						'supplier_id':supplier_id,
  	  					})
  	  					if(supply_detail[0]['room_supply_details'].length > 0){
  	  	 					 self._rpc({
  	  	 	 	     			model: 'room.manage',
  	  	 	 	     			method:'create_supply_details',
  	  	 	 	     			args: [supply_detail],
  	  	 	 	     		}).then(function(result){
  	  	 	 	     			if(result){
  	  	 	 	     				self.pos.gui.show_popup('alert',{
  	  				                     'title': _t('Success'),
  	  				                     'body': _t('Requested things will be delivered soon.'),
  	  				                });
  	  	 	 	     				$('.popper').popover('destroy');
  	  	 	 	     				contents.find('.select_room').addClass('inprogress_room');		
  	  	 	 	     			}
  	  	 	 	     		});
  	  					}
  	  					else{
  	  						self.pos.gui.show_popup('alert',{
			                     'title': _t('Warning'),
			                     'body': _t('Please select room supply items.'),
			                });
  	  					}
  	  	    	 });
  	  	      	/** Close service*/
  	  	      	$('.popover .service_close').on('click', function (e) {
  	  		        	var supply_detail=[]
  	  		        	var closest_div = $(e.currentTarget).closest('.confirm_rs');
  	  		        	var room_manage_id = closest_div.attr('manage_id');
  	  		        	var supplier_id = closest_div.find('.select_supplier option:selected').val();
  	  		 	    		supply_detail.push({
  	  							'room_no': room_id,
  	  							'manage_id': room_manage_id,
  	  							'supplier_id': supplier_id,
  	  						})	
  	  					if(supply_detail && room_manage_id !='false'){
  	  	 					 self._rpc({
  	  	 	 	     			model: 'room.manage',
  	  	 	 	     			method:'update_items_refilled',
  	  	 	 	     			args: [supply_detail],
  	  	 	 	     		}).then(function(result){
  	  	 	 	     			if(result){
  	  	 	 	     				self.pos.gui.show_popup('alert',{
  	  				                     'title': _t('Success'),
  	  				                     'body': _t('Items Refilled.'),
  	  				                });
  	  	 	 	     				$('.popper').popover('destroy');
  	  	 	 	     				contents.find('.select_room').removeClass('inprogress_room');
  	  	 	 	     				contents.find('.select_room').removeClass('select_room');
  	  	 	 	     			}
  	  	 	 	     		});
  	  					}
  	  	      	});
  	        	
  	        });
  	        
  	        /** Hide popover */
  	        $('body').on('click', function (e) {
  	        	$('.popper').each(function () {
  	    	        if (!$(this).is(e.target) && $(this).has(e.target).length === 0 && $('.popover').has(e.target).length === 0) {
  	    	            $(this).popover('destroy');
  	    	        }  	    	      
  	    	     });
  	    	 });

  	        /**Start Night Audit Session Button click actions*/
  	        /* Session Put Money click */
  	    	contents.off('click','.pos_button_section .PutMoneyIn');
	        contents.on('click','.pos_button_section .PutMoneyIn',function(event){
	          	self.pos.gui.show_popup('popupMoney',{
	          		'title': 'Put Money In',
	          		'body': 'Fill in this form if you put money in the cash register: ',
	          		confirm: function(){                	
	          			var values ={};
	                   	values.reason = this.$('.reason').val();
	                   	values.amount = this.$('.amount').val();
	                   	values.session_id = self.pos.pos_session.id;    
	                   	
	                   	self._rpc({
	                   		model: 'cash.box.in',
	       	                method: 'run_from_ui',
	       	                args: [0,values],
	       	            }).then(function (result) {
	       	            	if(result)
	       	            		self.pos.gui.show_popup('error',{
	       	            			'title': 'Put Money In',
	       	            			'body': JSON.stringify(result),				                    
	       	            		});
	       	            	else{
	       	            		night_audit_subid = $('#night_audit_table').attr('na_sub_id');
	       	            		$('.menu_form_btn').trigger('click');
	       	            		night_audit_subid = 0;
	      	            		//self.gui.show_screen('sessionscreen',null,'refresh');	
	       	            	}
	       	            });                	
	                   },
	                   cancel: function(){
	                   	$('.session').trigger('click');
	                   },
        		});	
     	    });

	        /* Session TakeMoneyOut click*/
	        contents.off('click','.pos_button_section .TakeMoneyOut');
	        contents.on('click','.pos_button_section .TakeMoneyOut',function(event){
	        	self.pos.gui.show_popup('popupMoney',{
            		'title': 'Take Money Out',
            		'body': 'Describe why you take money from the cash register: ',
            		confirm: function(){    
            			var values ={};
                    	values.reason = this.$('.reason').val();
                    	values.amount = this.$('.amount').val();
                    	values.session_id = self.pos.pos_session.id;
                    	self._rpc({
                    		model: 'cash.box.out',
        	                method: 'run_from_ui',
        	                args: [0,values],
        	            }).then(function(result){ 
        	            	if(result)
        	            		self.pos.gui.show_popup('error',{
        	            			'title': 'Take Money Out',
        	            			'body': JSON.stringify(result),	                   
        	            		});
        	            	else{
        	            		night_audit_subid = $('#night_audit_table').attr('na_sub_id');
	       	            		$('.menu_form_btn').trigger('click');
	       	            		night_audit_subid = 0;
        	            		//self.gui.show_screen('sessionscreen',null,'refresh');	
        	            	}       	            		
        	            });               	
                    },
                    cancel: function(){
                    	$('.session').trigger('click');
                    },
         		});	
	        });

	        /* Session SetClosingBalance click */
	        contents.off('click','.pos_button_section .SetClosingBalance');
	        contents.on('click','.pos_button_section .SetClosingBalance',function(e){
	        	var tr = $(e.currentTarget);
    	    	var balance = tr.attr('value');
    	    	var check = "";
    	    	self._rpc({
                    model: 'pos.session',
                    method: 'get_cashbox',
                    args: [0, self.pos.pos_session.id,balance,check],
                }).then(function(result){ 						
                	self.pos.gui.show_popup('popupBalance',{
                		'title': 'Cash Control',
                		'pos_cashbox_line': result,
                		confirm: function(){       			                   
                			var values = [];
                			var tbl = document.getElementById("cashbox-grid");				
                			var row = tbl.getElementsByTagName("tbody")[0].getElementsByTagName("tr");	    			      		   
                			if (tbl != null) {	
                				for (var i = 0; i < row.length-1; i++) 
                				{		    			           	            	
                					var id=null, number=null,coin_value=null;
                					var cell_count = row[i].cells.length;
                					for (var j = 0; j < cell_count ? 3 : 0; j++)
                					{	    			           	                		    			           	                	
                						if(j==0)
                							id = row[i].cells[j].innerHTML;	    			                           	
                						var children = row[i].cells[j].childNodes;
                						for (var k = 0; k < children.length; k++)
                						{	    			           	                		
                							if(children[k].value)
                							{	    			           	                			
                								if(j==1)
                									coin_value = children[k].value;
                								if(j==2)
                									number = children[k].value;	
                							}
                						}	    			           	                
                					}
                					if(cell_count > 0)
                						values.push({'id':parseInt(id),number,coin_value});	
                				}	
                			} 
                			self._rpc({
                				model: 'account.bank.statement.cashbox',
                				method: 'validate_from_ui',
                				args: [0,self.pos.pos_session.id,balance,values],
                			}).then(function(result){ 
                				if(result){
                					self.pos.gui.show_popup('alert',{
                						'title': _t( 'Cash Control !!!!'),
                						'body': JSON.stringify(result),	
                						'cancel' : function() {	
                							night_audit_subid = $('#night_audit_table').attr('na_sub_id');
            	       	            		$('.menu_form_btn').trigger('click');
            	       	            		night_audit_subid = 0;
                							//self.gui.show_screen('sessionscreen',null,'refresh');	
                						}
                					}); 
                				}
                				else
                					$('.session').trigger('click');
                			});
                		},
                		cancel: function(){
                			$('.session').trigger('click');
                		},
                	}); 							
                });
	        });
	        /*Session EndOfSession click*/
	        contents.off('click','.pos_button_section .EndOfSession');
	        contents.on('click','.pos_button_section .EndOfSession',function(event){
	        	var id = self.pos.pos_session.id;   
	           	 self._rpc({
	           		 model: 'pos.session',
	           		 method: 'action_pos_session_closing_control',
	           		 args: [id],
	           	 }).then(function(result){  
	           		 	night_audit_subid = $('#night_audit_table').attr('na_sub_id');
	            		$('.menu_form_btn').trigger('click');
	            		night_audit_subid = 0;
	           		 	//self.gui.show_screen('sessionscreen',null,'refresh');	
	           	 },function(err,event){
	           		 event.preventDefault();
	           		 var err_msg = 'Please verify the details given or Check the Internet Connection./n';
	           		 if(err.data.message)
	           			 err_msg = err.data.message;
	           		 self.gui.show_popup('alert',{
	           			 'title': _t('Odoo Warning'),
	           			 'body': _t(err_msg),
	           		 });
	           	 }); 
	        });

	        /* Session print statement click */
	        contents.off('click','.pos_button_section .vcpentries');
	        contents.on('click','.pos_button_section .vcpentries',function(event){
	        	var id = self.pos.pos_session.id;
	        	var order = self.pos.get_order();
	        	if(order.get_is_sessionclose()){
	           	 //if(is_room_confirmed && is_service_confirmed && is_purchase_confirmed){
	           		 self._rpc({
	           		 model: 'pos.session',
	           		 method: 'action_pos_session_validate',
	           		 args: [id],
	           		 }).then(function(result){  
	           			 self.gui.close_popup();
	           			 self.gui.close();
	           		 },function(err,event){
	           			 event.preventDefault();
	           			 var err_msg = 'Please verify the details given or Check the Internet Connection./n';
	           			 if(err.data.message)
	           				 err_msg = err.data.message;
	           			 self.gui.show_popup('alert',{
	           				 'title': _t('Odoo Warning'),
	           				 'body': _t(err_msg),
	           			 });
	           		 }); 
	           	 }
	           	 else{
	           		 self.get_room_details(self)
	           	 }              
	        });
  	        /* Session print statement click */
	        contents.off('click','.pos_button_section .printstatement');
	        contents.on('click','.pos_button_section .printstatement',function(event){
	        	var id = self.pos.pos_session.id;
	        	self.chrome.do_action('skit_pos_hm_night_audit.pos_session_report',
	        								{additional_context:{active_ids:[id],}
	        								});	               
	        });
	        
	        /** End Night Audit Session Button click actions*/
            /*contents.off('click','.hm-right-reserve-btn');
            contents.on('click','.hm-right-reserve-btn',function(e){
            	self.pos.gui.show_popup('popuproomservicewidget', {
	                'title': _t('Select Child'),
	               
	            });
            });*/
  	        
  	        contents.off('click','.hm-room-service');
	        contents.on('click','.hm-room-service',function(e){
	        	var room_id = $(this).attr('room_id');
	        	var room_table_id = $(this).attr('table_id');
	        	var folio_id = $(this).attr('folio_id');
	        	if(parseInt(folio_id) > 0){
	        		self._rpc({
		        		model: 'pos.order',
			 	 	    method:'get_room_order',
			 	 	    args: [0, room_id],
			 	 	}).then(function(result){
			 	 		//self.pos.set_service_order(true);
			 	 		self.pos.set_service_table(result['partner_id'], result['source_order_id'], result['room_name'], room_table_id, true);
			 	 	});
	        	}else{
	        		self.pos.gui.show_popup('popup_hm_warning',{
	            		'title': 'Warning',
	            		'msg': 'Selected room is not reserved.',
	            	});
	        	}
	        	//self.pos.set_service_table(partner_id);
	        });
	        /** Room Service Action */
	  	    var order_id = 0;
	        var partner_id = 0;
	        var service_room = '';
	        var source_id = 0;
	        contents.off('click','.hm-right-reserve-btn');
	        contents.on('click','.hm-right-reserve-btn',function(e){
		         var oid = $(this).attr('orderid');
		         var pid = $(this).attr('partnerid');
		         var room = $(this).attr('roomname');
		         var sid = $(this).attr('sourceid');
		         if(oid){
		        	order_id = oid;
		         }
		         if(pid){
		          	partner_id = pid;
		         }
		         if(room){
		        	 service_room = room;
		         }
		         if(sid){
		        	 source_id = sid;
		         }
	         });
	         contents.find('[rel=hm-popover]').popover({
	        	 html:true,
		         placement:'right',
		         content:function(){
		        	 return $($(this).data('contentwrapper')).html();
		         }
		     }).click(function (e) {
		            $('[rel=hm-popover]').not(this).popover('hide');
		     });
	          
	         contents.off('click','.hm-service-div');
	         contents.on('click','.hm-service-div',function(e){
	        	 var id = $(this).attr('id')
		         if(id == 'service-delivered'){
		        	self._rpc({
						model: 'pos.order',
						method: 'update_service_order',
						args: [order_id, 'delivery'],
					}).then(function(result){
						$("[orderid="+order_id+"]").addClass("hm-delivery-service");
						$('[rel=hm-popover]').popover('hide');
					});
		        	 
		         }
		         if(id == 'service-add'){
		        	 self.pos.set_service_order_details(self, partner_id, order_id, service_room, source_id);
		        	 $('[rel=hm-popover]').popover('hide');
		         }
		         if(id == 'service-close'){
		          	 self._rpc({
						model: 'pos.order',
						method: 'update_service_order',
						args: [order_id, 'close'],
					}).then(function(result){
						$('[rel=hm-popover]').popover('hide');
						$("[orderid="+order_id+"]").remove();
					});
		         }
	         });
	         
	         /** Check Out Date Extend */
	         contents.off('click','.hm-date-extend');
	         contents.on('click','.hm-date-extend',function(e){
	        	 var sub_id = $(this).attr('sub_id');
	        	 var folio_id = $(this).attr('folio_id');
	        	 self._rpc({
	        		 model: 'hm.form.template',
		    		 method: 'get_center_panel_form',
		    		 args: [0, sub_id, folio_id],
		    	 }).then(function(result){
		    		 var form_name = result[0]['form_name']
		    		 var center_panel_temp = result[0]['center_panel_temp']
		    		 var center_panel_sub_id = result[0]['center_panel_sub_id']
		    		 var form_view = result[0]['form_view']
		    		 var floor_id = result[0]['floor_id']
		    		 var res_table_sub_id = result[0]['center_panel_temp'][0][0]['res_table_sub_id'];
		    		 var center_panel_html = QWeb.render('CenterPanelContent',{widget: self, 
		    				form_name: form_name, form_view: form_view,
		    				center_panel_temp: center_panel_temp,
							center_panel_sub_id: center_panel_sub_id,
							floor_id: floor_id,
							});
		    		 contents.find('.hm-center-form-design').html(center_panel_html);
		    			
		    		 if(form_view == "restaurant_table"){
		    			 sub_template_id = res_table_sub_id;
		    			 if(sub_template_id > 0){
		    				 contents.find('#restaurant_table').text('checkout');
		    			 }else{
		    				 contents.find('#restaurant_table').text('true');
		    			 }
		    			 self.render_rooms(floor_id,contents, res_table_sub_id, form_name); 
		    		 }
		    	 });
	         });         
	         
	         /** Room Check Out Action */
	         contents.off('click','.hm-room-checkout');
	         contents.on('click','.hm-room-checkout',function(e){
	        	 var sub_id = $(this).attr('sub_id');
	        	 var folio_id = $(this).attr('folio_id');
	        	 self._rpc({
	        		 model: 'pos.order',
		    		 method: 'checkout_complaint',
		    		 args: [folio_id],
		    	 }).then(function(result){
		    		 if(result){
		    			 self._rpc({
			        		 model: 'hm.form.template',
				    		 method: 'get_center_panel_form',
				    		 args: [0, sub_id, folio_id],
				    	 }).then(function(result){
				    		 var form_name = result[0]['form_name']
				    		 var center_panel_temp = result[0]['center_panel_temp']
				    		 var center_panel_sub_id = result[0]['center_panel_sub_id']
				    		 var form_view = result[0]['form_view']
				    		 var floor_id = result[0]['floor_id']
				    		 var res_table_sub_id = result[0]['center_panel_temp'][0][0]['res_table_sub_id'];
				    		 var center_panel_html = QWeb.render('CenterPanelContent',{widget: self, 
				    				form_name: form_name, form_view: form_view,
				    				center_panel_temp: center_panel_temp,
									center_panel_sub_id: center_panel_sub_id,
									floor_id: floor_id,
									});
				    		 contents.find('.hm-center-form-design').html(center_panel_html);
				    			
				    		 if(form_view == "restaurant_table"){
				    			 sub_template_id = res_table_sub_id;
				    			 if(sub_template_id > 0){
				    				 contents.find('#restaurant_table').text('checkout');
				    			 }else{
				    				 contents.find('#restaurant_table').text('true');
				    			 }
				    			 self.render_rooms(floor_id,contents, res_table_sub_id, form_name); 
				    		 }
				    	 });
		    		 }else{
		    			 self.pos.gui.show_popup('popup_hm_complaint',{
		    	        		'title': 'Check Out Reason',
		    	        		'msg': 'Reason for prior check out.',
		    	        		'folio_id': folio_id,
		    	        		'sub_id': sub_id,
		    	        		'order_post': '',
		    	         });
		    		 }
		    	 });
	        	
	         });
	         
	         contents.off('click','.hm-form-back-icon');
	         contents.on('click','.hm-form-back-icon',function(e){
	        	 var sub_id = $(this).attr('sub_id');
	        	 self._rpc({
	        		 model: 'hm.form.template',
		    		 method: 'get_center_panel_form',
		    		 args: [0, sub_id, 0],
		    	 }).then(function(result){
		    		 var form_name = result[0]['form_name']
		    		 var center_panel_temp = result[0]['center_panel_temp']
		    		 var center_panel_sub_id = result[0]['center_panel_sub_id']
		    		 var form_view = result[0]['form_view']
		    		 var floor_id = result[0]['floor_id']
		    		 var res_table_sub_id = result[0]['center_panel_temp'][0][0]['res_table_sub_id'];
		    		 var center_panel_html = QWeb.render('CenterPanelContent',{widget: self, 
		    				form_name: form_name, form_view: form_view,
		    				center_panel_temp: center_panel_temp,
							center_panel_sub_id: center_panel_sub_id,
							floor_id: floor_id,
							});
		    		 contents.find('.hm-center-form-design').html(center_panel_html);
		    			
		    		 if(form_view == "restaurant_table"){
		    			 sub_template_id = res_table_sub_id;
		    			 if(sub_template_id > 0){
		    				 contents.find('#restaurant_table').text('checkout');
		    			 }else{
		    				 contents.find('#restaurant_table').text('true');
		    			 }
		    			 self.render_rooms(floor_id,contents, res_table_sub_id, form_name); 
		    		 }
		    	 });
	         });
	         
	         /** Check Out Button Action */
	         contents.off('click','#checkout');
	         contents.on('click','#checkout',function(e){
	        	 var sub_id = $(this).attr('sub_id');
	        	 var order_id = $('#order_id').text();
	        	 contents.find('.hm-top-inner-selected').removeClass("hm-top-inner-selected");
	        	 $("[subid="+sub_id+"]").addClass("hm-top-inner-selected");
	        	 self._rpc({
	        		 model: 'hm.form.template',
		    		 method: 'get_center_panel_form',
		    		 args: [0, sub_id, order_id],
		    	 }).then(function(result){
		    		 var form_name = result[0]['form_name']
		    		 var center_panel_temp = result[0]['center_panel_temp']
		    		 var center_panel_sub_id = result[0]['center_panel_sub_id']
		    		 var form_view = result[0]['form_view']
		    		 var floor_id = result[0]['floor_id']
		    		 var res_table_sub_id = result[0]['center_panel_temp'][0][0]['res_table_sub_id'];
		    		 var center_panel_html = QWeb.render('CenterPanelContent',{widget: self, 
		    				form_name: form_name, form_view: form_view,
		    				center_panel_temp: center_panel_temp,
							center_panel_sub_id: center_panel_sub_id,
							floor_id: floor_id,
							});
		    		 contents.find('.hm-center-form-design').html(center_panel_html);
		    		 
		    		 vendor_table = self.$('#vendor_order_list').DataTable({
	        		        bSort: false,
	        		        bFilter: false,
	        		        bPaginate: true, 
	        		        pageLength: 10,
	        		});
		    			
		    		 if(form_view == "restaurant_table"){
		    			 sub_template_id = res_table_sub_id;
		    			 if(sub_template_id > 0){
		    				 contents.find('#restaurant_table').text('checkout');
		    			 }else{
		    				 contents.find('#restaurant_table').text('true');
		    			 }
		    			 self.render_rooms(floor_id,contents, res_table_sub_id, form_name); 
		    		 }
		    	 });
	          
	         });
	         
	         contents.off('click','.data-select-all');
	         contents.on('click','.data-select-all',function(e){
	        	// Check/uncheck all checkboxes in the table
 	        	if(this.checked){
 	        		contents.find('.multi-pay').css({'display':'block'});
 	        	}else{
 	        		contents.find('.multi-pay').css({'display':'none'});
 	        	}
 	            var rows = vendor_table.rows({ 'search': 'applied' }).nodes();
 	            $('input[type="checkbox"]', rows).prop('checked', this.checked);
	         });
	        
	         contents.on('change','#vendor_order_list tbody input[type="checkbox"]',function(){
	        	// If checkbox is not checked
  	           if(!this.checked){
  	              var el = $('.data-select-all').get(0);
  	              // If "Select all" control is checked and has 'indeterminate' property
  	              if(el && el.checked && ('indeterminate' in el)){
  	            	  contents.find('.multi-pay').css({'display':'none'});
  	                 // Set visual state of "Select all" control 
  	                 // as 'indeterminate'
  	                 el.indeterminate = true;
  	              }
  	           }
  	           var $checkboxes = vendor_table.$('input[type="checkbox"]');
  	           var countCheckedCheckboxes = $checkboxes.filter(':checked').length;
  	           if(countCheckedCheckboxes > 0){
  	        	   contents.find('.multi-pay').css({'display':'block'});
  	           }else{
  	        	   contents.find('.multi-pay').css({'display':'none'});
  	           }
	         });
	         
	        contents.off('click','.multi-pay'); 
 	        contents.on('click','.multi-pay',function(){
 	        	var invoice_ids = [];
             	var amount = 0;
             	var partner_id = 0;
             	var order_ids = [];
             	
 	        	$('#vendor_order_list tbody tr').each(function(){
 	        		if($(this).find('input[type="checkbox"]').prop("checked")){
 	        			var invoice_id = $(this).find("span.folio-payment").attr('invid');
                     	amount = amount + parseFloat($(this).find("span.folio-payment").attr('amt'));
                     	partner_id = $(this).find("span.folio-payment").attr('custid');
                     	var order_id = $(this).find("span.folio-payment").attr('orderid');
                     	invoice_ids.push(invoice_id);
                     	order_ids.push(order_id);
    	        	}
 	        	});
 	        	if(amount > 0){
 	        		var order = self.pos.get_order();
     				order.set_client(self.pos.db.get_partner_by_id(partner_id));
     				self.pos.proxy.open_cashbox();
     	        	order.set_is_pending(true);
     	        	//order.set_pending_invoice(invoice_id);
     	 	    	order.set_pending_amt(amount);
     	 	    	//order.set_pending_porder(order_id);
     	 	    	order.set_pending_order_type('POS');
     	 	    	order.set_is_hm_pending(true);
     	 	    	order.set_hm_invoices(invoice_ids);
     	 	    	order.set_hm_orders(order_ids);
     	 	    	//order.set_to_invoice(false);
     				self.gui.show_screen('payment');
 	        	}
 	        });
	         
		});

    },
    
    render_rooms:function(floor_id, contents, sub_temp_id, form_name){
    	//Room supply floor render function
    	var self = this;
    	var room_service = $('#restaurant_table').text();
    	if(floor_id){
	    	self._rpc({
				model: 'hm.form.template',
				method: 'get_restaurant_table',
				args: [0, floor_id],
			}).then(function(result){
				var tables = result;
				var hm_class = 'hm-date-extend';
				if(form_name == 'Check Out'){
					hm_class = 'hm-room-checkout';
				}
				if(room_service == 'true'){
    				var restaurant_rooms_html = QWeb.render('RestaurantRoomsService',{widget: self, 
	    				tables: tables, 
						floor_id: floor_id,
					});
    			}
				else if(room_service == 'checkout'){
    				var restaurant_rooms_html = QWeb.render('CheckOutRoomsWidget',{widget: self, 
	    				tables: tables, 
						floor_id: floor_id,
						sub_temp_id: sub_temp_id,
						hm_class: hm_class,
					});
    			}
				else{
    				var restaurant_rooms_html = QWeb.render('RestaurantRooms',{widget: self, 
    					tables: tables, 
    					floor_id: floor_id,
    				});
    			}
				
				contents.find('.rooms_container .res_tables').html(restaurant_rooms_html);
			});
    	}
    },
 // Room Status Report
    status_report: function(contents){
    	var self = this;
    	var rooms_status_html = QWeb.render('RoomstatusReportScreen',{widget: self});
    	contents.find('.rooms_status_report').html(rooms_status_html);
    	//To display details initially at the begining
    	self._rpc({
    	            model: 'product.template',
    	            method: 'get_roomstatus',
    	            args: [0, from_date, to_date],
    	        })
    	        .then(function(val) {
    	        	var table = $("#rs_table").DataTable()
    	        	table.destroy();
    	        	self.render_order(val);  
    	        });
    	 $('#sandbox-container .input-daterange').datepicker({
    	   		todayHighlight: true
    	   	});
    	    //Display records based on strt and end date
    	    var from_date;
    		var to_date;
    		contents.on('change','.rdate_from',function(){
    			from_date = $(this).val();
    			self._rpc({
    	            model: 'product.template',
    	            method: 'get_roomstatus',
    	            args: [0, from_date, to_date],
    	        })
    	        .then(function(val) {
    	        	var table = $("#rs_table").DataTable()
    	        	table.destroy();
    	        	self.render_order(val);  
    	        });
    		});
    		contents.on('change','.rdate_to',function(){
    			to_date = $(this).val();
    			self._rpc({
    	            model: 'product.template',
    	            method: 'get_roomstatus',
    	            args: [0, from_date, to_date],
    	        })
    	        .then(function(val) {
    	        	var table = $("#rs_table").DataTable()
    	        	table.destroy();
    	        	self.render_order(val);  
    	        });
    		});
    },
    render_order: function(result){
    	//alert('result'+JSON.stringify(result))
    	var self = this;
   	 	var histories = result;
	   	var contents = this.$el[0].querySelector('.dl_otable');
	   	if(contents!=null)
		{	
	   		var order_html = QWeb.render('RoomStatusReportDetailsScreenWidget1',{widget: self,lines:result});
			contents.innerHTML=order_html;
		}
	   	var table = self.$el.find('table#rs_table').DataTable({
	        sScrollX: true,
	        sScrollXInner: "100%",
	        bScrollCollapse: true,
	        bSort: false,
	        bPaginate: true, 
	        pageLength: 10,
		});
   },
    render_supply_items:function(room_id,floor_id,contents){
    	//display items inside the popover
    	var self = this;
    	if(room_id){
	    	self._rpc({
				model: 'hm.form.template',
				method: 'get_roomsupply_items',
				args: [0, room_id,floor_id],
			}).then(function(result){
				var tables = result;
				var supply_items_html = QWeb.render('RoomSupplyPopover',{widget: self, 
					tables: tables, 
					room_id: room_id,
					});
				contents.find('.rooms_container .res_tables .items_popover').html(supply_items_html);
			});
    	}
    },
    render_night_audit:function(subid,contents){
    	//Night audit render function
    	var self = this;
    	var partner_list = []
    	var partners_all = this.pos.db.get_partners_sorted(1000);
    	for(var i=0; i<partners_all.length; i++){
    		partner_list.push({ 
    			'value' : partners_all[i].id,'key':partners_all[i].name,
    		});
    	}
    	self._rpc({
    		model: 'pos.session',
            method: 'get_pos_session',
            args: [0, self.pos.pos_session.id],
    	}).then(function(result){ 
    		var session  = result;
    		var night_audit_html = QWeb.render('SessionDataWidget',{widget: self, session:session, 
																	sub_id: subid,
																	partner_list:partner_list,
																	partners_all:partners_all}
																	);
			contents.find('.nightaudit_container .rs_night_audit_session').html(night_audit_html); //set night audit form in service window
			contents.find('.pos_button_section .SetClosingBalance').addClass('na_session_width');//set widht for closing balance button
    	});
    },
    get_room_details: function(self){
		self._rpc({
            model: 'pos.session',
            method: 'get_room_details',
            args: [0, self.pos.pos_session.id],
        }).then(function(result){ 
        	self.pos.gui.show_popup('room_popup',{
        		'title': 'Room Details',
        		'room_details': result,
        		'is_room_confirmed': is_room_confirmed
        	}); 							
        });      
    },	
    template_line_icon_url: function(id){
        return '/web/image?model=hm.form.template.line&id='+id+'&field=image';
    },
    /*get_python_method: function(){
    	//return 'test';
    	var value = {'test': [1,2]};
    	var procced = false;
    	this._rpc({
  			model: 'pos.order',
  			method:'get_reservation',
  			args: [0],
  		}).done(function(result){
  			//alert(JSON.stringify(result))
  			value = result;
  			return result;
  		});
    	//if(procced)
    	return value;
    }*/
   /* sub_template_line_icon_url: function(id){
    	return '/web/image?model=hm.sub.form.template.line&id='+id+'&field=image';
    },*/
    /*render_list: function(line_group, line_group_key, form_view, form_name, text_color, 
    		form_temp_id, model_name, top_panel_temp, left_panel_temp, right_panel_temp){
    	
    	var contents = this.$('.hm-reservation-content');
    	
        contents.innerHTML = "";
        var reservation_html = QWeb.render('VendorListContent',{widget: this, 
        						line_group: line_group, line_group_key: line_group_key,
        						form_view: form_view, form_name: form_name, text_color: text_color,
        						form_temp_id: form_temp_id, model_name: model_name,
        						top_panel_temp: top_panel_temp, left_panel_temp: left_panel_temp, right_panel_temp: right_panel_temp
        						});
      
        var vendorlist = document.createElement('div');
        vendorlist.innerHTML = reservation_html;
        vendorlist = vendorlist.childNodes[1];
       // contents.append(vendorlist);

    },*/
   
});
gui.define_screen({name:'room_reservation', widget: RoomReservationScreenWidget});

chrome.OrderSelectorWidget.include({
	room_service_button_click_handler: function(){
		/*var order = this.pos.get_order();
		var datas = order.export_as_JSON();
		this._rpc({
   			model: 'pos.order',
   			method:'create_pos_service_order',
   			args: [datas],
   		}).then(function(result){
   		});*/
		this.pos.gui.show_popup('popup_service_order', {
            'title': _t('Confirmation'),
        });

    },
    hide: function(){
        this.$el.addClass('oe_invisible');
    },
    show: function(){
        this.$el.removeClass('oe_invisible');
    },
    renderElement: function(){
        var self = this;
        this._super();
        if (this.pos.config.iface_room_service) {
            if (this.pos.get_order()) {
            	//alert('dsfs')
            	this.$('.orders').prepend(QWeb.render('BackToRoomService',{room_name:this.pos.room_name}));
                this.$('.room-service-button').click(function(){
                		
                        self.room_service_button_click_handler();
                });
                this.$el.removeClass('oe_invisible');
            } else {
                this.$el.addClass('oe_invisible');
            }
        }
       
    },
    // Room Status Report
    roomstatus_report_handler: function(event, $el, from_date, to_date) {
    	var self = this;
    	var order = self.pos.get_order();
    	self._rpc({
        model: 'product.template',
        method: 'get_roomstatus',
        args: [0, from_date, to_date],
    })
    .then(function(val) {
    	self.pos.gui.show_screen('roomstatusreport',{dldata: val},'refresh');   
    });
    },
});


var _super_posmodel = models.PosModel.prototype;
models.PosModel = models.PosModel.extend({
    initialize: function(session, attributes) {
        this.table = null;
        this.table_name = '';
        this.room_name = '';
        return _super_posmodel.initialize.call(this,session,attributes);
    },
    
    set_service_order_details: function(order_self, partner_id, order_id, service_room, source_id){
    	this.room_name = service_room;
    	var order  = this.get_order();
    	var client = this.db.get_partner_by_id(partner_id);
    	order.set_client(client);
    	order.set_exit_order_id(parseInt(order_id));
    	order.set_source_folio_id(source_id);
    	var lines = order.get_orderlines();	
    	order.remove_orderline(lines);
    	var self = this;
    	order_self._rpc({
    		model: 'pos.order',
	 	 	    method:'get_service_order',
	 	 	    args: [0, order_id],
	 	}).then(function(result){
	 		for(var i=0; i<result.length; i++){
	 			var product = self.db.get_product_by_id(result[i].product_id);
		    	order.add_product(product, 
		    			{quantity: result[i].qty, room_line_id: result[i].line_id}
		    	);
	 		}
	 		self.gui.show_screen('products');
	 	});
    	self.gui.show_screen('products');
    },
    set_service_table: function(partner_id, source_order_id, room_name, room_table_id, is_service) {
    	this.room_name = room_name;
    	var orders = this.get_order_list();
    	var client = this.db.get_partner_by_id(partner_id);
    	var order = this.get_order();
    	var lines = order.get_orderlines();	
    	order.remove_orderline(lines);
		order.set_client(client);
		order.set_service_order(is_service);
		order.set_source_folio_id(source_order_id);
		order.set_room_table_id(room_table_id);
		console.log('Orders'+JSON.stringify(orders))
		var pos_order = this.db.get_order(107)
		console.log('pos_order:'+JSON.stringify(pos_order))
        if (orders.length) {
        	//alert('order')
           // this.set_order(orders[0]); // and go to the first one ...
        	this.set_service_room(orders[0]);
        } else {
            this.add_new_order();  // or create a new order with the current table
        }
    },
    set_service_room: function(table){
    	if(!table){
    		this.gui.show_screen('firstpage');
    	}else{
    		//this.$('.orders').prepend(QWeb.render('BackToRoomService',{table_name:'table', floor_name: 'floor'}));
    		this.gui.show_screen('products');
    	}
    }
});

});