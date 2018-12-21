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
	    get_sessiondata : function(event, button_name){	 
	    	var self = this;
/*	    	new Model('pos.session').call('get_pos_session',
    				[0, self.pos.pos_session.id]).then(function(result){ 
    					console.log ('button_name :' + button_name + 'result :' +  JSON.stringify(result));
    					self.pos_session  = result;
    					self.onclick_PutMoneyIn(result);
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
	    	*/
	    	
	    	

	   	self._rpc({
                model: 'pos.session',
                method: 'get_pos_session',
                args: [0, self.pos.pos_session.id],
            }).then(function(result){ 
            	self.pos_session  = result;
            	if(button_name == 'PutMoneyIn')
    				self.onclick_PutMoneyIn(result);
    			else if(button_name =='TakeMoneyOut')
    				self.onclick_TakeMoneyOut(result);
    			else if(button_name =='SetCashInHand')
    				self.onclick_SetCashInHand(event,result);
    			else if(button_name =='SetClosingBalance')
    				self.onclick_SetClosingBalance(result);
    			else if(button_name == 'SetOpeningBalance')
    				self.onclick_SetOpeningBalance(result);
    			else if(button_name == 'Setadjustment')
    				self.onclick_Setadjustment(result);
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
	    	console.log('render_data:');
	    	var self = this;
	    	var rcontents = this.$el[0].querySelector('.session-data-contents');
	    	rcontents.innerHTML = "";
             var category_html = QWeb.render('SessionDataWidget',{widget: self, session:session});
             category_html = _.str.trim(category_html);
             var category_node = document.createElement('div');
             category_node.innerHTML = category_html;
             rcontents.append(category_node);	
             this.el.querySelector('.PutMoneyIn').addEventListener('click',function(event){
            	 self.get_sessiondata(event,'PutMoneyIn');            	
 		     });
             
             this.el.querySelector('.TakeMoneyOut').addEventListener('click',function(event){
             	self.get_sessiondata(event,'TakeMoneyOut');
     	       // self.onclick_TakeMoneyOut(self.pos_session);
  	    	});
              this.el.querySelector('.SetClosingBalance').addEventListener('click',function(event){
             	 self.get_sessiondata(event,'SetClosingBalance');
             	// self.onclick_SetClosingBalance(self.pos_session);
  	    	});
        /*      this.el.querySelector('.SetOpeningBalance').addEventListener('click',function(event){
            	  alert("open bal");
             	 self.get_sessiondata(event,'SetOpeningBalance');
             	 //self.onclick_SetOpeningBalance(self.pos_session);
  	    	});	  */ 
              this.el.querySelector('.EndOfSession').addEventListener('click',function(event){
             	 //self.get_sessiondata();
             	 self.onclick_EndOfSession();
  	    	});
              this.el.querySelector('.vcpentries').addEventListener('click',function(event){
             	 //self.get_sessiondata();
             	 self.onclick_vcpentries();
  	    	});
              this.el.querySelector('.printstatement').addEventListener('click',function(event){
  	        	self.onclick_printstatement();
  	    	});
             
			 return rcontents;
	    },
	    
	    
	    
	    
	    
	    
	    /** Session Report ***/
	    onclick_printstatement: function(){
	    	var self = this;
	    	var id = self.pos.pos_session.id;
	    	self.chrome.do_action('skit_pos_hm_night_audit.pos_session_report',
	    	   {additional_context:{active_ids:[id],}
	    	});
	    },
	    onclick_vcpentries: function(){
	    	var self = this;
	    	var id = self.pos.pos_session.id;
	    	new Model('pos.session').call('action_pos_session_closing_control',
					[id]).then(function(result){  
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
	                cancel: function(){
	                	//$('.session').trigger('click');
	                }
	            });
	        }); 
	    },
	    onclick_EndOfSession: function(){
	    	/*var self = this;
	    	var id = self.pos.pos_session.id;   
	    	new Model('pos.session').call('action_pos_session_closing_control',
					[id]).then(function(result){  
						//$('.session').trigger('click');
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
	    	*/
	    	
	    	
	    	var self = this;
	    	var id = self.pos.pos_session.id;   
	    	self._rpc({
                model: 'pos.session',
                method: 'action_pos_session_closing_control',
                args: [id],
	    	}).then(function(result){  
	    		$('.session').trigger('click');
			},function(err,event){
	            event.preventDefault();
	            var err_msg = 'Please verify the details given or Check the Internet Connection./n';
	            if(err.data.message)
	            	err_msg = err.data.message;
	            self.gui.show_popup('alert',{
	                'title': _t('Odoo Warning'),
	                'body': _t(err_msg),
	            });
	        });  var self = this;
	    	var id = self.pos.pos_session.id;   
	    	self._rpc({
                model: 'pos.session',
                method: 'action_pos_session_closing_control',
                args: [id],
	    	}).then(function(result){  
	    		$('.session').trigger('click');
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
	    	
	    	
	    	
	    	
	    	
	    	
	    },
	    onclick_PutMoneyIn: function(pos_session){
	    	var self = this;
	    	
	    	
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
    	            	else
    	            		$('.session').trigger('click');
    	            });                	
                },
                cancel: function(){
                	$('.session').trigger('click');
                },
     		});	
	    	
	    	
	    	
//	    	self.pos.gui.show_popup('popupMoney',{
    //            'title': 'Put Money In',
  //              'body': 'Fill in this form if you put money in the cash register: ',
   //             'model_name':'cash.box.in',
  //              'session':pos_session,
   //             'amount': self.pos_session.cash_register_money_in || '0.00',
                /*'opening_bal': session.cash_register_balance_start || '0.00',    
                'money_in_amt': session.cash_register_money_in || '0.00',
                'money_out_amt': session.cash_register_money_out || '0.00',    
                'sales_total': session.cash_register_sales_total || '0.00',
                'theoretical_closing_bal': session.cash_register_balance_end || '0.00',
                'real_cash_on_hand_amt': session.cash_register_cashinhand_end_real || '0.00',    */
     	//	});		      
	    },	
	    onclick_TakeMoneyOut: function(pos_session){
	    	var self = this;
	    	//alert("session:  "+JSON.stringify(session))
	    	
	    	//alert("ses.cash_register_sales_total:  "+ session.cash_register_sales_total) 
	    	//self.get_sessiondata();
	   /* 	self.pos.gui.show_popup('popupMoney',{
                'title': 'Take Money Out',
                'body': 'Describe why you take money from the cash register: ',
                'model_name':'cash.box.out',
                'session':pos_session  ,
                'amount': self.pos_session.cash_register_money_out || '0.00',
     		});	*/
	    	
	    	
	    	var self = this;	    	
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
    	            		$('.session').trigger('click');
    	            });               	
                },
                cancel: function(){
                	$('.session').trigger('click');
                },
     		});	
	    	
	    },	
	    
	    
	    
	    click_money_confirm: function(){
	    	
	    	var self = this;
	    	var reason = this.$('.reason').val();
	    	if(self.options.reason_hide)
	    		reason = 'Adjusted by'+ self.pos.pos_session.user_id[1];
        	var amount = this.$('.amount').val();
        	if(reason && amount != 0){                	
            	var values = {};
            	values.reason = reason;
            	values.amount = amount;
            	values.session_id = self.pos.pos_session.id;
            	new Model(self.options.model_name).call('run_from_ui',
    					[0,values]).then(function(result){
    					if(result)
        					self.pos.gui.show_popup('alert',{
			                    'title': self.options.title,
			                    'body': JSON.stringify(result),	                   
			                });
    					//else
    						//$('.session').trigger('click');
    			},function(err,event){
    	            event.preventDefault();
    	            var err_msg = 'Please verify the details given or Check the Internet Connection./n';
    	            if(err.data.message)
    	            	err_msg = err.data.message;
    	            self.gui.show_popup('alert',{
    	                'title': _t('Odoo warning'),
    	                'body': _t(err_msg),
    	            });
    	        });    
        	}
        	else{
        		$('.error').css({"display":"block"}); 
        		if(!reason)
        			$(".reason").attr('required',true);
        		else
        			$(".reason").attr('required',false);
        			
        		if(amount == 0)
        			$(".amount").attr('required',true);
        		else
        			$(".amount").attr('required',false);
        	}
	    },
	    onclick_SetOpeningBalance: function(pos_session){
	    	var self = this;
	    	self.pos.proxy.open_cashbox();
	    	var balance ="start"; //tr.attr('value');
	    	var check = "";
	    	var title = "Cash Control- Opening Balance"
	    	self.open_cash_control(balance,check,title, pos_session);
	    },	
	    
	    
	    
	    
	    onclick_SetClosingBalance: function(e){
	    	var self = this;
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
            				if(result)
            					self.pos.gui.show_popup('alert',{
            						'title': _t( 'Cash Control !!!!'),
            						'body': JSON.stringify(result),	
            						'cancel' : function() {	
            							$('.session').trigger('click');
            						}
            					}); 							
            				else
            					$('.session').trigger('click');
            			});
            		},
            		cancel: function(){
            			$('.session').trigger('click');
            		},
            	}); 							
            });
	    }, 
	    
	    
	    
	    
	    
	    
	    
	    
	    
	    
	    
	    
/*	    onclick_SetClosingBalance: function(pos_session){
	    	var self = this;
	    	self.pos.proxy.open_cashbox();
	    	var balance = "end"; //tr.attr('value');
	    	var check = "";
	    	var title = "Cash Control- Closing Balance";
	    	//self.get_sessiondata();
	    	self.open_cash_control(balance,check,title, pos_session);
	    	
        	
	    	
	    },
	    open_cash_control: function(balance,check,title,pos_session){
	    	var self = this;
	    	//self.get_sessiondata();
	    	
	    	
	    	
	    	self._rpc({
        		model: 'pos.session',
                method: 'get_cashbox',
                args: [0, self.pos.pos_session.id,balance,check],
            }).then(function(result){ 
            	self.pos.gui.show_popup('popupBalance',{
	                   'title': title,
	                   'pos_cashbox_line': result,
	                   'cashbox_status':balance,
	                   'balance':balance,
	                   'model_name':'account.bank.statement.cashbox',
	                   'session':pos_session,
            	 }); 
            	
            });   */
	    	
	    	
	    	
	    	
	    	
	    	
//	    	new Model('pos.session').call('get_cashbox',
//					[0, self.pos.pos_session.id,balance,check]).then(function(result){ 						
//    					self.pos.gui.show_popup('popupBalance',{
//    			                   'title': title,
//    			                   'pos_cashbox_line': result,
//    			                   'cashbox_status':balance,
//    			                   'balance':balance,
//    			                   'model_name':'account.bank.statement.cashbox',
//    			                   'session':pos_session,
    			                   /*'opening_bal': session.cash_register_balance_start || '0.00',    
    			                   'money_in_amt': session.cash_register_money_in || '0.00',
    			                   'money_out_amt': session.cash_register_money_out || '0.00',    
    			                   'sales_total': session.cash_register_sales_total || '0.00',
    			                   'theoretical_closing_bal': session.cash_register_balance_end || '0.00',
    			                   'real_cash_on_hand_amt': session.cash_register_cashinhand_end_real || '0.00',   */ 
    			                   /*confirm: function(){       			                   
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
	    			           	            	 values.push({'id':parseInt(id),'number':number,'coin_value':coin_value});	
	    			           	            }	
	    			           	        } 
	    			           	     new Model('account.bank.statement.cashbox').call('validate_from_ui',
	    			     					[0,self.pos.pos_session.id,balance,values]).then(function(result){ 
	    			     						if(result)
	    			     							//alert("result   "+result)
	    			     							var msg = result;
	    			     							if(result == 1){
	    			     								///alert("turesd");
	    			     								msg = 'You have done a great job.'
	    			     							}
	    			     							self.pos.gui.show_popup('alert',{
	    							                    'title': _t( 'Cash Control !!!!'),
	    							                    'body': JSON.stringify(msg),
	    							                    
	    							                    cancel: function(){
	    							                    	
	    							                    	if(result == 1){
	    							                    	
	    							                    	self.pos.gui.show_popup('yes_no_button', {
	    							            				'title' : 'End Of  Session',
	    							            				'body'	: 'Do you want to end the session?',
	    							            				'confirm': function() {
	    							            					$('.EndOfSession').trigger('click');
	    							            					var self = this;
	    							            					self.pos.gui.show_popup('session_print_button', {
	    							            						'title' : 'Print',
	    							            						
	    							            						
	    							            						'confirm': function() {
	    							            							//alert("sdfds");
	    							            							
	    							            							$('.vcpentries').trigger('click');
	    							            						},
	    							            					});
	    							            					
	    							            				},	    							            				
	    							            			});
	    							                    	
	    							                    }
	    							                    	
	    							                    	else{
	    							                    		$('.SetClosingBalance').trigger('click');
	    							                    		
	    							                    	}
	    			    				                	
	    			    				                },
	    							                }); 							
	    			     						//else
	    			     							// $('.session').trigger('click');
	    			     			});
	    			           	     
	    			           	     
	    			           	     
	    			           	     
	    			           	 // self.onclick_TakeMoneyOut();
    			                   },*/
    			       // }); 							
			//});
	//    },
	    /*Start Set Cash In Hand button click action*/
	    onclick_SetCashInHand: function(e,pos_session){
	    	var self = this;
	    	self.pos.proxy.open_cashbox();
	    	var tr = $(e.currentTarget);
	    	var balance = tr.attr('value');
	    	var check = "";
	    	new Model('pos.session').call('get_cashinhand',
					[0, self.pos.pos_session.id,balance,check]).then(function(result){ 						
    					self.pos.gui.show_popup('popupBalance',{
    			                   'title': 'Cash On Hand',
    			                   'pos_cashbox_line': result,
    			                   'cashbox_status':'hand',
    			                   'balance':balance,
    			                   'model_name':'account.bank.statement.cashinhand',
    			                   'session':pos_session
    			                   /*'opening_bal': session.cash_register_balance_start || '0.00',    
    			                   'money_in_amt': session.cash_register_money_in || '0.00',
    			                   'money_out_amt': session.cash_register_money_out || '0.00',    
    			                   'sales_total': session.cash_register_sales_total || '0.00',
    			                   'theoretical_closing_bal': session.cash_register_balance_end || '0.00',
    			                   'real_cash_on_hand_amt': session.cash_register_cashinhand_end_real || '0.00',    */
    			                  /* confirm: function(){
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
	    			           	            	 values.push({'id':parseInt(id),'number':number,'coin_value':coin_value});	
	    			           	            }	
	    			           	        } 
		    			           	     new Model('account.bank.statement.cashinhand').call('validate_from_ui',
			    			     					[0,self.pos.pos_session.id,balance,values]).then(function(result){ 
			    			     						if(result)
			    			     							self.pos.gui.show_popup('alert',{
			    							                    'title': _t( 'Cash Control !!!!'),
			    							                    'body': JSON.stringify(result),
			    							                    cancel: function(){
			    			    				                	//$('.session').trigger('click');
			    			    				                },
			    							                }); 							
			    			     						//else
			    			     							// $('.session').trigger('click');
			    			     			});
		    			           	     
		    			           	 // self.onclick_TakeMoneyOut();   
		    			           	  $('.TakeMoneyOut').trigger('click');
    			                   },*/
    			        }); 							
			});
	    },
	    /*End Set Cash In Hand button click action*/	
	    onclick_Setadjustment: function(pos_session){
	    	var self = this;	   
	    	self.pos.gui.show_popup('popupMoney',{
                'title': 'Shortfall',  
                'model_name':'cash.box.in.adjustment',
               // 'difference': self.options.pos_session.cash_register_difference || '0.00', 
                'amount': self.pos_session.cash_register_shortfall || '0.00',  
                'session':pos_session,
               // 'session':session
                /*'opening_bal': session.cash_register_balance_start || '0.00',    
                'money_in_amt': session.cash_register_money_in || '0.00',
                'money_out_amt': session.cash_register_money_out || '0.00',    
                'sales_total': session.cash_register_sales_total || '0.00',
                'theoretical_closing_bal': session.cash_register_balance_end || '0.00',
                'real_cash_on_hand_amt': session.cash_register_cashinhand_end_real || '0.00',*/
                
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
	var PopupSessionWidget = PopupWidget.extend({
	    template: 'PopupSessionWidget',
	    events: _.extend({}, PopupWidget.prototype.events, {
	        'click .PutMoneyIn': 'onclick_PutMoneyIn',
	        'click .TakeMoneyOut': 'onclick_TakeMoneyOut',	
	        'click .SetClosingBalance': 'onclick_SetClosingBalance',
	        'click .EndOfSession': 'onclick_EndOfSession',
	        'click .ValidateClosingControl': 'onclick_vcpentries',
	        'click .printstatement': 'onclick_printstatement',	
	    }),
	    
	    onclick_PutMoneyIn: function(){
	    	var self = this;	    	
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
    	            	else
    	            		$('.session').trigger('click');
    	            });                	
                },
                cancel: function(){
                	$('.session').trigger('click');
                },
     		});		      
	    },	
	    
	    onclick_TakeMoneyOut: function(){
	    	var self = this;	    	
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
    	            		$('.session').trigger('click');
    	            });               	
                },
                cancel: function(){
                	$('.session').trigger('click');
                },
     		});	
	    },
	    
	    onclick_SetClosingBalance: function(e){
	    	var self = this;
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
            				if(result)
            					self.pos.gui.show_popup('alert',{
            						'title': _t( 'Cash Control !!!!'),
            						'body': JSON.stringify(result),	
            						'cancel' : function() {	
            							$('.session').trigger('click');
            						}
            					}); 							
            				else
            					$('.session').trigger('click');
            			});
            		},
            		cancel: function(){
            			$('.session').trigger('click');
            		},
            	}); 							
            });
	    },
	    
	    onclick_vcpentries: function(){
	    	var self = this;
	    	var id = self.pos.pos_session.id;
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
	                cancel: function(){
	                }
	            });
			}); 
	    },
	    
	    onclick_EndOfSession: function(){
	    	var self = this;
	    	var id = self.pos.pos_session.id;   
	    	self._rpc({
                model: 'pos.session',
                method: 'action_pos_session_closing_control',
                args: [id],
	    	}).then(function(result){  
	    		$('.session').trigger('click');
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
	    },
	    
	    /** Session Report ** */
	    onclick_printstatement: function(){
	    	var self = this;
	    	var id = self.pos.pos_session.id;
	    	self.chrome.do_action('skit_pos_hm_night_audit.pos_session_report',
	    			{additional_context:{active_ids:[id],}
	    			});
	    },
	    
	});
    gui.define_popup({name:'popupsession', widget: PopupSessionWidget});

    
    /** * Render Session Button - Session Click Action ** */
	chrome.OrderSelectorWidget.include({	
		template : 'OrderSelectorWidget',
		
		init: function(parent, options) {
	        this._super(parent, options);
	    },
	    sessionevent_click_handler: function() {
        	var self = this;
        	self.gui.show_screen('sessionscreen');
        	//$('.SetCashInHand').trigger('click');
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
	    	
	    	this.$('.session').click(function(event){
		        	self.sessionevent_click_handler(event,$(this));
		       });
	    	
	    	/*this.$('.night_audit').click(function(event){
	        	self.sessionevent_click_handler(event,$(this));
	       });*/
	    	
	        
/*	        this.$('.session').click(function(event){
	        	self._rpc({
	                model: 'pos.session',
	                method: 'get_pos_session',
	                args: [0, self.pos.pos_session.id],
	            }).then(function(result){ 
	            	if(result)
	            		self.pos.gui.show_popup('popupsession',{
	            			'title': 'Sessions',
	            			'pos_session': result,
	            			'partner_list': partner_list
	            		}); 							
	            	else
	            		self.pos.gui.show_popup('error',{
	            			'title': 'Sessions',
	            			'body': 'No Opened Session.',	                   
	            		});	
	            });
	        	
	        	self.pos.gui.show_popup('popupsession',{
	        		'title': 'Sessions',
	        		'body': 'Loading...',
	        	});
	        });*/
	    },		    
	});
});