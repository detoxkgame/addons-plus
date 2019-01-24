odoo.define('skit_pos_hotel_reservation.reservation', function (require) {
"use strict";
var core = require('web.core');
var QWeb = core.qweb;
var chrome = require('point_of_sale.chrome');
var _t = core._t;
var gui = require('point_of_sale.gui');
var models = require('point_of_sale.models');
var screens = require('point_of_sale.screens');
var session = require('web.session');
var PopupWidget = require('point_of_sale.popups');
var rpc = require('web.rpc');
var PosDB = require('point_of_sale.DB');

var _super_posmodel = models.PosModel.prototype;
models.PosModel = models.PosModel.extend({

	initialize : function(session, attributes) {
		var account_model = _.find(this.models, function(model) {
			return model.model === 'account.journal';
		});
		account_model.fields.push('is_pay_later');

		return _super_posmodel.initialize.call(this, session, attributes);
	},
	
	load_new_partner_id: function(id){
        var self = this;
        var def  = new $.Deferred();
        var fields = _.find(this.models,function(model){ return model.model === 'res.partner'; }).fields;
        var domain = [['customer','=',true],['id','=',id]];
        rpc.query({
                model: 'res.partner',
                method: 'search_read',
                args: [domain, fields],
            }, {
                timeout: 3000,
                shadow: true,
            })
            .then(function(partners){
                if (self.db.add_partners(partners)) {   // check if the partners we got were real updates
                    def.resolve();
                } else {
                    def.reject();
                }
            }, function(type,err){ def.reject(); });
        return def;
    },

});

//var exports =require('point_of_sale.DB');
/*var ReservationWidget = screens.ScreenWidget.extend({
	template: 'ReservationWidget',
	events: _.extend({}, PopupWidget.prototype.events, {
        'change .showdatetimepicker': 'change_date',
        'change .showdatetimepicker': 'change_date',

    }),
    
    init: function(parent, options){
        this._super(parent, options);
    },
    
  //  auto_back: true,
    show: function(){
        var self = this;
        this._super();      
        this.renderElement();
        this.old_client = this.pos.get_order().get_client();
        var order = self.pos.get_order();
    	var partner = order.get_client();
    	
    	$('.showdatetimepicker').datetimepicker({
	   		//todayBtn: "linked"
	   		todayHighlight: true,
	   		ampm: true,
	   		format: 'D dd-M-yy hh:mm:ss',
	   		//format : 'D M yy hh:mm A',
	   		
	   	});
    	
    	this.$('.back').click(function(){
        	 self.gui.show_screen('firstpage');
        });     	
    },
});
gui.define_screen({name:'reservation', widget: ReservationWidget});*/


/* Set flag for Renewal */
var _super_order = models.Order.prototype;
models.Order = models.Order.extend({
    initialize: function() {
        _super_order.initialize.apply(this,arguments);
        this.reservation_details    = {};
        this.to_invoice     = true;
        this.save_to_db();
    },
    export_as_JSON: function() {
        var json = _super_order.export_as_JSON.apply(this,arguments);
        json.reservation_details = this.reservation_details;
        return json;
    },
    init_from_JSON: function(json) {
        _super_order.init_from_JSON.apply(this,arguments);
        this.reservation_details = json.reservation_details;
    },
    /* ---- Renewal  --- */
    set_reservation_details: function(reservation_details) {
        this.reservation_details = reservation_details;
        this.trigger('change');
    },
    get_reservation_details: function(){
        return this.reservation_details;
    },
    
});

var ReservationWidget2 = screens.ScreenWidget.extend({
	template: 'ReservationWidget2',
	events: _.extend({}, PopupWidget.prototype.events, {
        'change .showdatetimepicker': 'change_date',
        'change .showdatetimepicker': 'change_date',

    }),
    init: function(parent, options){
        this._super(parent, options);
    },
    change_date:function(){
    	
    },
   // change_date({})
  //  auto_back: true,
    show: function(){
        var self = this;
        this.chrome.widget.order_selector.hide();
        this._super();      
        this.renderElement();
        
        this.old_client = this.pos.get_order().get_client();
        var order = self.pos.get_order();
    	var partner = order.get_client();
    	
        // alert('contents:'+contents)
    	// contents.on('click','.back-btn',function(){
         	self._rpc({
     			model: 'hm.form.template',
     			method: 'get_reservationform',
     			args: [0],
     		}).then(function(result){ 
     			var line_group = result[0]['line_group']
     			var line_group_key = result[0]['line_group_key']
     			var form_view = result[0]['form_view']
     			var form_template = result[0]['form_template']
     			var sub_form_template = result[0]['sub_form_template']
     			var sub_line_group = result[0]['sub_line_group']
     			var sub_line_group_key = result[0]['sub_line_group_key']
     			var len_line_group = result[0]['len_line_group'];
     			var lensub_line_group = result[0]['lensub_line_group'];
     			
     			self.render_list(form_view,line_group,line_group_key,sub_form_template,sub_line_group,sub_line_group_key,len_line_group,lensub_line_group);
     			self.$('#CHECKIN').click(function(){
     			});  
     			self.$("select").keydown(function(){
    				var ftype = $(this).attr('ftype');
    				$(this).removeClass('warning');    				
     			  });
     		    self.$("input").keydown(function(){
    				var ftype = $(this).attr('ftype');
    				$(this).removeClass('warning');
     				if(ftype=='input_int'){
     					
     				}
     				else if(ftype=='date'){
     					
     				}
     				else if(ftype=='input_char'){
     					
     				}
     				else{
     					
     				}
     				
     			  });
     		      self.$('#submit').click(function(){
     				var tr = document.createElement("tr");
     				self.$('.rows').each(function(){
     						var x = $(":input").serializeArray();
	     					 $.each(x, function(i, field){
	     	     			    	console.log(field.name + ":" + field.value + " ");
	     	     			  });
     					});
     			   });
     			  self.$('#VIEWBILL').click(function(e){
     				//alert('dfs');
     				self.$('.rows').each(function(){
     					 var x = $(":input").serializeArray();
     					  $.each(x, function(i, field){
     	     			    	console.log(field.name + ":" + field.value + " ");
     	     			    });
     				});
     				   				
     				return false;
     			  });
     			  self.$('#Checkin').click(function(){
     				// self.$('#Reserve').click();
     				 $('#Reserve').trigger("click");
     				 var post={};
     				 var order_line =[];
     				 var order_row_line_array =[];
     				 var customer_array =[];
     				$('div.table-reservation table.headerrows').each(function() {	
     					$(this).find('input').each(function(index, element) {    						
     						if($(this).attr('ftype')=='date'){
     							var value = element.value;
     							var datestring = value.split(" ");     						
     							var sd = datestring[2]+' '+datestring[3];  
     							var momentObj = moment(sd, ["h:mm A"]);
     							var date = datestring[1]+' '+momentObj.format("HH:mm");      							
     							var dateTime = new Date(date);
     							dateTime = moment(dateTime).format("YYYY-MM-DD HH:mm:ss");     							
     							post[element.name]=dateTime;
     						}
     						else{
     							post[element.name]=element.value;
     						}
             			});
     					$(this).find('select').each(function(index, element) {     						
     						post[element.name]=element.value;
             			});
     				});
     				var rowCount = $('div#subformtemplate table').length;
     				var i=0;
     				var product_array=[];
     				$('div#subformtemplate table.subrows').each(function() {	
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
     					order_row_line_array.push(order_line_array);
     					
     				});
     				_.every(product_array, function(line){	
 						var product =  self.pos.db.get_product_by_id(line);
 						if(product!=undefined)
 							order.add_product(product, {price: product.price});
     		    	}); var cashregister=self.pos.cashregisters[0];
     				
 		           for (i = 0; i < self.pos.cashregisters.length; i++) {
 		        	   console.log('jj'+JSON.stringify(self.pos.cashregisters[i]));
 		        	  console.log('jj'+JSON.stringify(self.pos.cashregisters[i].journal['is_pay_later']));
 		        	  var is_paylater = self.pos.cashregisters[i].journal['is_pay_later'];
 		        	   if(is_paylater){
 		        		  console.log('if');
 		        		  cashregister=self.pos.cashregisters[i];
 		        	   }
 		        	   }
 		           console.log('cashregister'+JSON.stringify(cashregister));
 		          var newPaymentline = new models.Paymentline({},{order: order, cashregister:cashregister, pos: self.pos});
		            newPaymentline.set_amount( order.get_due());
		            console.log('pp'+JSON.stringify(newPaymentline));
     				self._rpc({
     	     			model: 'res.partner',
     	     			method:'createpartner',
     	     			args: [0, post],
     	     		}).then(function(result){
     	     			if(result){     	     		
     					
    					
     		            order.paymentlines.add(newPaymentline);
     		            order.set_reservation_details(post);
     		            /*var def  = new $.Deferred();
     		             var count = self.pos.db.add_partners(result['partner_details']);
     		            def.resolve();
     		             console.log('updated_count::'+count);*/
     		            self.pos.load_new_partner_id(result['id']).then(function(){
     		            	 var client = self.pos.db.get_partner_by_id(result['id']);
         		           //  post['partner_id'] = result['id'];
         		             post['order_line']=order_row_line_array; 
    	     				 order.set_client(client);
    	     				console.log('client::'+JSON.stringify(client));
    	     				self.pos.push_order(order,{to_invoice:true}).then(function(){
         						//alert('PUSH completed');
    	     					self.pos.get_order().finalize();
         						
         						 
         						self.pos.gui.show_screen('reservation2');});
    	     				self.pos.gui.show_popup('alert',{
			                     'title': _t('Success'),
			                     'body': _t('Thanks for Booking. Your Reservation is booked'),
			                 });
     		            });
     		           //  console.log('es::'+JSON.stringify(result['id']));
     		            //console.log('clientres::'+JSON.stringify(result['partner_details']));
     		            
     		          /*  self.pos.load_new_partners().then(function(){
	     		            // partners may have changed in the backend
	     		            var client = self.pos.db.get_partner_by_id(result);
	     					order.set_client(client);
	     					order.set_to_invoice(true);
	     					self.pos.push_order(order,{to_invoice:true}).then(function(){
	     						alert('PUSH completed');
	     						self.pos.gui.show_popup('alert',{
				                     'title': _t('Success'),
				                     'body': _t('Thanks for Booking. Your Reservation is booked'),
				                 });
	     						 self.pos.get_order().finalize();
	     						self.pos.gui.show_screen('reservation2');
	     						//self.pos.db.remove_unpaid_order(this);
	     						//self.show();
	     						
	     					});	     					
	     					     
	     		        });*/

     	     			}
     	     			
     	     		});

     					return false;
     			  });
     			  self.$('#Reserve').click(function(){
     				var isProceed =true;
         			self.$('input[ismandatory="true"]').each(function(index, element) {
        						if (!$(this).val().length > 0) {										
        							if(!(typeof attr !== typeof undefined)){
        								$(this).addClass('warning');
        								$(this).removeClass('hide');
        								isProceed = false;
        							}else{
        								$(this).removeClass('warning');
        							}										
        						}
        						else{
        							$(this).removeClass('warning');
        						}
        			});
         			self.$('select[ismandatory="true"]').each(function(index, element) {
						if (!$(this).val().length > 0) {										
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
         			if (!isProceed)
         			{
         				alert('Please fill col');
         				return false;
         			}
         			else{

         				self.$('.small-icon').each(function(){
             				var id = $(this).attr('field');
             				var text = $(this).closest('div').find('input#'+id).val();
             				$(this).closest('div').find('input#'+id).closest('div').addClass('addbackground_none');
             				$(this).closest('div').find('input#'+id).addClass('hide');
             				$(this).closest('div').find('input#'+id).next("span").text(text);
             				$(this).closest('div').find('input#'+id).next("span").removeClass('hide');
             				$(this).closest('div').find('input#'+id).next("span").addClass('customtext');
             				
             				
             			});
         				var text =$('div.table-reservation table.headerrows').find('input#guest_name').val();
         				//alert(text);
         				$('div.table-reservation table.headerrows').find('input#guest_name').addClass('hide');
         				$('div.table-reservation table.headerrows').closest('div').find('input#guest_name').next("span").text(text);
         				$('div.table-reservation table.headerrows').closest('div').find('input#guest_name').next("span").removeClass('hide');
         				$('div.table-reservation table.headerrows').closest('div').find('input#guest_name').next("span").addClass('customtext');
         				
         			}
     				return false;
     			});
     			
     			self.$('#addroom').click(function(){
     				//alert('clcik');
     				var row = $(this).parents('table');
     				var sd = row.clone(true);
     				var rowid=sd.attr('id');
     				var rowid =  parseInt(rowid)+1;
     				sd.attr('id',rowid);
     				sd.find('input').each(function(index, element) {
     					$(this).val('');
     				});
     				$(this).parents('table').after(sd);
     				return false;
     				
     			});
     			
     			self.$('.showdatetimepicker').click(function(){
     				
     				$(this).datetimepicker({
     	   				todayHighlight: true,
     	   				format : 'D dd-M-yy HH:ii P',     	   		    	
     	   		   	})
     	   			.on('changeDate', function(e){     	   				
     	   			    $(this).datetimepicker('hide');
     	   			    self.$('.showdatetimepicker').find('#checkout_date').parents('div').removeClass('div_err');
     	   			    self.$('.showdatetimepicker').find('#checkout_date').parents('div').next("span").removeClass('spanerror_msg');
     	   			    self.$('.showdatetimepicker').find('#checkout_date').parents('div').next("span").addClass('hide');
     	   			    self.$('.showdatetimepicker').find('#checkout_date').removeClass('warning');
     	   			    var out_date =self.$('.showdatetimepicker').find('#checkout_date').val();
     	   			    var in_date =self.$('.showdatetimepicker').find('#checkin_date').val();
     	   			    
	     	   			     	   		
		     	   		var one_day=1000*60*60*24;    // Convert both dates to milliseconds
		     	   		var date1 = new Date(in_date);
		     	   		var date2 = new Date(out_date);
		     	   		if(out_date.length>0 && in_date.length>0){
				     	   	if(date2<date1){
				     	   		alert('Checkout date must be greater than check in date');
				     	   		self.$('.showdatetimepicker').find('#checkout_date').parents('div').next("span").text('Checkout date must be greater than Check in date');
				     	   	    self.$('.showdatetimepicker').find('#checkout_date').parents('div').next("span").removeClass('hide');
				     	   		self.$('.showdatetimepicker').find('#checkout_date').parents('div').next("span").addClass('spanerror_msg');
				     	    	self.$('.showdatetimepicker').find('#checkout_date').addClass('warning');
				     	    	self.$('.showdatetimepicker').find('#checkout_date').parents('div').addClass('div_err');
				     	   	}
			     	    	var timeDiff = Math.abs(date2.getTime() - date1.getTime());
			     	    	var numberOfNights = Math.ceil(timeDiff / (1000 * 3600 * 24)); 
			     	    	//alert('f'+numberOfNights);
			     	    	var no_of_n =self.$('#no_of_nights').val();
			     	    	if(numberOfNights!=undefined && numberOfNights!='NaN')
			     	    	{
			     	    		self.$('#no_night').val(numberOfNights);
			     	    	}  
		     	   		}
     	   			});  	   			
     	   		});
     			

     			self.$('.small-icon').click(function(ev){
     				var id = $(this).attr('field');
     				$(this).closest('div').find('input#'+id).removeClass('hide');
     				$(this).closest('div').find('input#'+id).next("span").removeClass('customtext');
     				$(this).closest('div').find('input#'+id).next("span").addClass('hide');
     				$(this).find('input#'+id).parents('div').removeClass('addbackground_none');
     			});               
                
     		});
        	
    	
    	this.$('.back').click(function(){
        	 self.gui.show_screen('firstpage');
        });     	
    },
    _setValueFromUi: function () {
        var value = this.$input.val() || false;
        this.setValue(this._parseClient(value));
    },
    
    render_list: function(form_view,line_group,line_group_key,sub_form_template,sub_line_group,sub_line_group_key,len_line_group,lensub_line_group){
        var contents = this.$el[0].querySelector('.reservation_contents');
        contents.innerHTML = "";
        var vendor_html = QWeb.render('ReservationFormContent',{widget: self, form_view: form_view,                 						
				line_group: line_group, line_group_key: line_group_key,sub_form_template:sub_form_template,sub_line_group:sub_line_group,sub_line_group_key:sub_line_group_key,len_line_group,lensub_line_group:lensub_line_group});
        var dashboardline = document.createElement('div');
        dashboardline.innerHTML = vendor_html;
        dashboardline = dashboardline.childNodes[1];
        contents.appendChild(dashboardline);
    },
});
gui.define_screen({name:'reservation2', widget: ReservationWidget2});

});