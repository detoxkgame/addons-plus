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

var QWeb = core.qweb;
var _t = core._t;


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
	        contents.append(reservationform);
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
	    			args: [0, subid],
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
	    			//var centerform = document.createElement('div');
	    			//centerform.innerHTML = center_panel_html;
	    			//centerform = reservationform.childNodes[1];
	    			contents.find('.hm-center-form-design').html(center_panel_html);
	    		});
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
	        
	        /** Check In Button Action */
	        var order_post = {};
	        var order_line = [];
	        contents.off('click','#checkin, #reserve');
            contents.on('click','#checkin, #reserve',function(e){
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
     						}
	 						
	 					});
	 					
	 					$(this).find('select').each(function(index, element) {     						
	 						order_post[element.name]=element.value;
	         			});
	            	});
	            	$('table.hm-form-table tr.hm-orderline-details').each(function() {	
	            		var order_line_array ={};
	 					$(this).find('input').each(function(index, element) {  
	 						order_line_array[element.name]=element.value;
	 					});
	 					
	 					$(this).find('select').each(function(index, element) {     						
	 						order_line_array[element.name]=element.value;
	 						if(element.name =='product_id'){
	 							product_array.push(element.value);
	 						}
	         			});
	 					
	 					order_line.push(order_line_array);
	            	});
	            	
	            	order_post['order_line'] = order_line;
	            	order_post['reservation_status'] = order_status;
	            	if(order_id != ''){
	            		self._rpc({
		 	     			model: 'pos.order',
		 	     			method:'update_order',
		 	     			args: [0, order_post, order_id],
		 	     		}).then(function(result){
		 	     			self.pos.gui.show_popup('alert',{
			                     'title': _t('Success'),
			                     'body': _t('Thanks for Booking. Your Reservation is confirmed.'),
			                });
		 	     		});
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
            
            /*contents.off('click','.hm-right-reserve-btn');
            contents.on('click','.hm-right-reserve-btn',function(e){
            	self.pos.gui.show_popup('popuproomservicewidget', {
	                'title': _t('Select Child'),
	               
	            });
            });*/
            contents.find('[rel=hm-popover]').popover({
	            html:true,
	            placement:'right',
	            content:function(){
	                return $($(this).data('contentwrapper')).html();
	            }
	        }).click(function (e) {
	            $('[rel=hm-popover]').not(this).popover('hide');
	        });
            
            contents.off('click','.service-delivered');
            contents.on('click','.service-delivered',function(e){
            	alert('test')
            	self.pos.set_service_table();
            	/*var orders = self.pos.get_order_list();
	            if (orders.length) {
	            	alert('IF')
	                self.pos.set_order(orders[0]); // and go to the first one ...
	            }*/
            	//self.pos.add_new_order();
            	//_super_posmodel.add_new_order()
            	//self.pos.gui.show_screen('products')
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
    floor_button_click_handler: function(){
        this.pos.set_table(null);
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
        alert('Room')
    },
});

var _super_posmodel = models.PosModel.prototype;
models.PosModel = models.PosModel.extend({
    initialize: function(session, attributes) {
        this.table = null;
        return _super_posmodel.initialize.call(this,session,attributes);
    },
    set_service_table: function(table) {
    	alert('SErvice')
    	console.log('SErvice:'+JSON.stringify(this.tables_by_id[113]))
    	var table_floor = this.tables_by_id[113]
    	
    	this.floor = this.floors_by_id[7];
    	table_floor['floor'] = this.floor;
    	this.table = table_floor;
    	//this.table.floor = this.floors_by_id[8]
    	 
    	this.set_table(this.table);
    	//this.set_order(null)
    	/*console.log('SErvice:'+JSON.stringify(this.tables_by_id[113]))
    	 this.table = this.tables_by_id[113];
    	 this.floor = this.floors_by_id[8];
    	var orders = this.get_order_list();
	            if (orders.length) {
	            	alert('IF')
	                this.set_order(orders[0]); // and go to the first one ...
	            }*/
	            //this.gui.show_screen('products')
    },
});
/** Room Service Popup Widget */
/*var RoomServicePopupWidget = PopupWidget.extend({
	 template: 'RoomServicePopupWidget', 
});
gui.define_popup({name:'popuproomservicewidget', widget: RoomServicePopupWidget});*/

});