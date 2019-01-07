odoo.define('skit_pos_hm_night_audit.pos_session', function(require) {
	"use strict";
	
	var session = require('web.session');
	var chrome = require('point_of_sale.chrome');  
	var gui = require('point_of_sale.gui');
	var models = require('point_of_sale.models');
	var PopupWidget = require('point_of_sale.popups');
	var core = require('web.core');
	var QWeb = core.qweb;
	var _t = core._t;
	var screens = require('point_of_sale.screens');
	var is_room_confirmed = false;
	var is_service_confirmed = false;
	var is_purchase_confirmed = false;

	
	var SessionScreenWidget = screens.ScreenWidget.extend({
	    template: 'SessionScreenWidget',
	
	    init: function(parent, options){
	        this._super(parent, options);
	        this.pos_session = false;
	    },
		
	    auto_back: true,
	    
	    show: function(){
	        var self = this;
	        this._super();      
	        this.renderElement();
	        this.old_client = this.pos.get_order().get_client();
	        var order = self.pos.get_order();
	    	var partner = order.get_client();
	
	    	this.$('.back').click(function(){
	        	 self.gui.show_screen('firstpage');
	        });
	    	
	    	self._rpc({
	    		model: 'pos.session',
                method: 'get_pos_session',
                args: [0, self.pos.pos_session.id],
	    	}).then(function(result){ 
	    		self.pos_session  = result;
				self.render_data(order, result); 
	    	},function(err,event){
	            event.preventDefault();
	            var err_msg = 'Please check the Internet Connection./n';
	            if(err.data.message)
	            	err_msg = err.data.message;
	            self.gui.show_popup('alert',{
	                'title': _t('Error: Could not get order details.'),
	                'body': _t(err_msg),
	            });
	        });
	    },

	    render_data: function(order, session){	 
	    	var self = this;
	        var partner_list = []
	    	var partners_all = this.pos.db.get_partners_sorted(1000);
	    	for(var i=0; i<partners_all.length; i++){
	    		partner_list.push({ 
	    			'value' : partners_all[i].id,'key':partners_all[i].name,
	    		});
	    	}
	    	
	    	var rcontents = this.$el[0].querySelector('.session-data-contents');
	    	rcontents.innerHTML = "";
	    	var category_html = QWeb.render('SessionDataWidget',{widget: self, session:session, partner_list:partner_list,partners_all:partners_all});
	    	category_html = _.str.trim(category_html);
            var category_node = document.createElement('div');
            category_node.innerHTML = category_html;
            rcontents.append(category_node);
             
            $('.PutMoneyIn').on('click',function(event){
    	    	
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
        	            		self.gui.show_screen('sessionscreen',null,'refresh');	
         	            	}
         	            });                	
                     },
                     cancel: function(){
                     	$('.session').trigger('click');
                     },
          		});	
       	    });
             
            $('.TakeMoneyOut').on('click',function(event){
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
        	            	else
        	            		self.gui.show_screen('sessionscreen',null,'refresh');	
        	            });               	
                    },
                    cancel: function(){
                    	$('.session').trigger('click');
                    },
         		});	
             });
             
             $('.SetClosingBalance').on('click',function(e){
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
                							self.gui.show_screen('sessionscreen',null,'refresh');	
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
       
             $('.EndOfSession').on('click',function(event){
            	 var id = self.pos.pos_session.id;   
            	 self._rpc({
            		 model: 'pos.session',
            		 method: 'action_pos_session_closing_control',
            		 args: [id],
            	 }).then(function(result){  
            		 self.gui.show_screen('sessionscreen',null,'refresh');	
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
             
             $('.vcpentries').on('click',function(event){
            	 var id = self.pos.pos_session.id;

            	 if(is_room_confirmed && is_service_confirmed && is_purchase_confirmed){
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
             
             $('.printstatement').on('click',function(event){
            	 var id = self.pos.pos_session.id;
            	 self.chrome.do_action('skit_pos_hm_night_audit.pos_session_report',
            			 {additional_context:{active_ids:[id],}
            			 });
             });
             return rcontents;
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
	    
	});
	gui.define_screen({name:'sessionscreen', widget: SessionScreenWidget});
	
	
	/** POS Session- Set Closing Balance - POP-UP widget * */
	var PopupBalanceWidget = PopupWidget.extend({
	    template: 'PopupBalanceWidget', 
	    events: _.extend({}, PopupWidget.prototype.events, {
	        'click .cashbox-add': 'onclick_cashboxadd',
	        'click .cashbox-delete': 'onclick_cashboxdelete',		
	        'blur .cashbox-edit' : 'onchange_text',
	    }),
	    
	    onclick_cashboxadd: function(e){
		   var self = this;		  			
		   var table = document.getElementById('cashbox-grid');			
		   var rowCount = table.getElementsByTagName("tbody")[0].getElementsByTagName("tr").length;
		   
		   var newRow = table.insertRow(rowCount);
		   var row = rowCount-1 ;
		   newRow.id = row;
	        
		   var col1html = "";
		   var col2html = "<input id='cashbox_"+row+"_coin_value' value='0' name='coin_value' class='cashbox-edit'/>";
		   var col3html = "<input id='cashbox_"+row+"_number' value='0' name='number' class='cashbox-edit' onkeypress='return (event.charCode &gt;= 48 &amp;&amp; event.charCode &lt;= 57) || (event.charCode == 0 || event.charCode == 08 || event.charCode == 127)'/>";
		   var col4html = "";
		   var col5html = "<span class='cashbox-delete fa fa-trash-o' name='delete'/>";
		
		   var col1 = newRow.insertCell(0); col1.style="display:none"; col1.innerHTML=col1html;
		   var col2 = newRow.insertCell(1); col2.innerHTML=col2html;
		   var col3 = newRow.insertCell(2); col3.innerHTML=col3html;
		   var col4 = newRow.insertCell(3); col4.id ="cashbox_"+row+"_subtotal"; col4.innerHTML=col4html;
		   var col5 = newRow.insertCell(4);
		   if(self.options.pos_cashbox_line[0]['is_delete']){
			   col5.innerHTML=col5html;       
		   }
	    },
	    
	    onclick_cashboxdelete: function(e){
	    	var self = this;       	        
	    	var tr = $(e.currentTarget).closest('tr');	    	  
	    	var record_id = tr.find('td:first-child').text(); 
	    	if(parseInt(record_id))
	    		tr.find("td:not(:first)").remove();
	    	else
		    	tr.find("td").remove(); 
	    	tr.hide();
	    	var tr_id = tr.attr('id');
	    	var tbl = document.getElementById("cashbox-grid");				
		    var row = tbl.getElementsByTagName("tbody")[0].getElementsByTagName("tr");	
		    var total = 0;
   	        for (var i = 0; i < row.length-1; i++) 
   	        {	
   	        	var cell_count = row[i].cells.length;
   	        	if(cell_count > 1)
   	        	{
   	        		var subtotal = document.getElementById("cashbox_" + i + "_subtotal").innerHTML;
   	        		if(subtotal)
   	        			total += parseFloat(subtotal);
   	        	}
   	        }
   	        document.getElementById("cashbox_total").innerHTML = total ;
	    },
	    
	    onchange_text: function(e){
	    	var self = this;
	    	var tr = $(e.currentTarget).closest('tr');
	    	var tr_id = tr.attr('id');
	        var number = document.getElementById("cashbox_" + tr_id + "_number").value;
	        var coin_value = document.getElementById("cashbox_" + tr_id + "_coin_value").value;
	        document.getElementById("cashbox_" + tr_id + "_subtotal").innerHTML = number * coin_value;  
	        var tbl = document.getElementById("cashbox-grid");				
		    var row = tbl.getElementsByTagName("tbody")[0].getElementsByTagName("tr");	
		    var total = 0;
   	        for (var i = 0; i < row.length-1; i++) 
   	        {		
   	        	var cell_count = row[i].cells.length;
   	        	if(cell_count > 1)
   	        	{
   	        		var subtotal = document.getElementById("cashbox_" + i + "_subtotal").innerHTML;
   	        		if(subtotal)
   	        			total += parseFloat(subtotal);
   	        	}
   	        }
   	        document.getElementById("cashbox_total").innerHTML = total ;
	    },
	});
    gui.define_popup({name:'popupBalance', widget: PopupBalanceWidget});
	
    
	/** POS Session- PutMoneyIn - POP-UP widget * */
	var PopupMoneyWidget = PopupWidget.extend({
	    template: 'PopupMoneyWidget', 
	});
    gui.define_popup({name:'popupMoney', widget: PopupMoneyWidget});

    
	/** Session POP-UP widget * */
	var RoomDetailsWidget = PopupWidget.extend({
	    template: 'RoomDetailsWidget',
	    events: _.extend({}, PopupWidget.prototype.events, {
	        'click .room_btn_next': 'onclick_next',	
	        'click .room_btn_confirm_next': 'onclick_confirm_next',	
	    }),

	    get_service_details: function(self){
	    	self._rpc({
	    		model: 'pos.session',
	    		method: 'get_service_details',
	    		args: [0, self.pos.pos_session.id],
	    	}).then(function(result){ 
	    		self.pos.gui.show_popup('service_popup',{
	    			'title': 'Service Details',
	    			'service_details': result,
	    			'is_service_confirmed': is_service_confirmed
	    		}); 							
	    	});		      
	    },	
	    
	    onclick_next: function(){
	    	var self = this;
	    	self.get_service_details(self);	      
	    },	
	    
	    onclick_confirm_next: function(){
	    	var self = this;
	    	is_room_confirmed = true;
	    	self.get_service_details(self);	      
	    },	
	});
    gui.define_popup({name:'room_popup', widget: RoomDetailsWidget});
    

    
	/** Confirmation details POP-UP widget * */
	var ConfirmationDetailsWidget = PopupWidget.extend({
	    template: 'ConfirmationDetailsWidget',
	    events: _.extend({}, PopupWidget.prototype.events, {
	        'click .btn_back': 'onclick_back',	
	        'click .btn_ok': 'onclick_ok',	
	    }),

	    onclick_back: function(){
	    	var self = this;
	    	var service_popup_widget = new ServiceDetailsWidget();
	    	service_popup_widget.get_purchase_details(self)
	    },	
	    
	    onclick_ok: function(){
	    	$('.vcpentries').trigger('click');
	    },	
	});
    gui.define_popup({name:'confirm_popup', widget: ConfirmationDetailsWidget});
    
    
	/** ServiceDetails POP-UP widget * */
	var ServiceDetailsWidget = PopupWidget.extend({
	    template: 'ServiceDetailsWidget',
	    events: _.extend({}, PopupWidget.prototype.events, {
	        'click .service_btn_next': 'onclick_next',	
	        'click .service_btn_back': 'onclick_back',	
	        'click .service_btn_confirm_next': 'onclick_confirm_next',	
	    }),

	    get_purchase_details: function(self){
	        self._rpc({
	        	model: 'pos.session',
	        	method: 'get_purchase_details',
	        	args: [0, self.pos.pos_session.id],
	        }).then(function(result){ 
	        	self.pos.gui.show_popup('purchase_popup',{
	        		'title': 'Purchase Details',
	        		'purchase_details': result,
	        		'is_purchase_confirmed': is_purchase_confirmed
	        	}); 							
	        });		      
	    },	    
	    
	    onclick_next: function(){
	    	var self = this;
	    	self.get_purchase_details(self);
	    },
	    
	    onclick_confirm_next: function(){
	    	var self = this;
	    	//$("input#service_confirm").prop("checked", true);
	    	is_service_confirmed = true;
	    	self.get_purchase_details(self);
	    },	
	    
	    onclick_back: function(){
	    	var self = this;
	    	var session_screen_widget = new SessionScreenWidget();
	    	session_screen_widget.get_room_details(self)
	    },
	});
    gui.define_popup({name:'service_popup', widget: ServiceDetailsWidget});
    
 
	/** Session POP-UP widget * */
	var PurchaseDetailsWidget = PopupWidget.extend({
	    template: 'PurchaseDetailsWidget',
	    events: _.extend({}, PopupWidget.prototype.events, {
	        'click .btn_next': 'onclick_next',	
	        'click .btn_back': 'onclick_back',	
	        'click .btn_confirm_next': 'onclick_confirm_next',	
	    }),

	    get_confirm_details: function(){
	    	var self = this;
	    	var title_msg;
	    	var confirm_msg = [];
	    	if(is_room_confirmed && is_service_confirmed && is_purchase_confirmed){
	    		confirm_msg.push("All stages are confirmed");
	    	}
	    	else{
	    		title_msg = "Please confirm the below details";
		    	if (!is_room_confirmed){
		    		confirm_msg.push("Room details");
		    	}
		    	if (!is_service_confirmed){
		    		confirm_msg.push("Service details");
		    	}
		    	if (!is_purchase_confirmed){
		    		confirm_msg.push("Purchase details");
		    	}
	    	}
	    	self.pos.gui.show_popup('confirm_popup',{
    			'title': 'Confirm',
    			'confirm_msg': confirm_msg,
    			'title_msg': title_msg
    		}); 
	    },
	    
	    onclick_next: function(){
	    	var self = this;
	    	self.get_confirm_details();
	    },
	    
	    onclick_confirm_next: function(){
	    	var self = this;
	    	is_purchase_confirmed = true;
	    	self.get_confirm_details();
	    },	
	    
	    onclick_back: function(){
	    	var self = this;
	    	var room_popup_widget = new RoomDetailsWidget();
	    	room_popup_widget.get_service_details(self)
	    },	
	});
    gui.define_popup({name:'purchase_popup', widget: PurchaseDetailsWidget});
  
    
    /** * Render Session Button - Session Click Action ** */
	chrome.OrderSelectorWidget.include({	
		template : 'OrderSelectorWidget',
		
		init: function(parent, options) {
	        this._super(parent, options);
	    },
	    sessionevent_click_handler: function() {
        	var self = this;
        	self.gui.show_screen('sessionscreen');
	    },
	    renderElement: function() {
	        var self = this;
	        this._super();		              		        
	        var partner_list = []
	    	var partners_all = this.pos.db.get_partners_sorted(1000);
	    	for(var i=0; i<partners_all.length; i++){
	    		partner_list.push({ 
	    			'value' : partners_all[i].id,'key':partners_all[i].name,
	    		});
	    	}
	    	this.$('.night_audit_session').click(function(event){
	        	self.sessionevent_click_handler(event,$(this));
	    	});
	    },		    
	});

});
