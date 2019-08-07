odoo.define('skit_quotation.screen', function (require) {
	"use strict";

	var screens = require('point_of_sale.screens');
	var core = require('web.core');
	var _t = core._t;
	var QWeb     = core.qweb;
	//var gui = require('point_of_sale.gui');
	var OrderWidget = screens.OrderWidget;
	var chrome = require('point_of_sale.chrome');  
	var gui = require('point_of_sale.gui');
	var PopupWidget = require('point_of_sale.popups');
	var ispayment = false;
	var list_tab_id = 0 ;

	var SuccessPopupWidget = PopupWidget.extend({
	    template: 'SuccessPopupWidget',
	    events: _.extend({}, PopupWidget.prototype.events, {
	    	'click .shipment_confirm': 'click_confirm',
	    	'click .shipment_validate':'click_validate'
		}),
		click_confirm: function(ev){
			var self = this;
			var shipment_vals=[];
			var ship_vals=[];
			var error = false;
			var tr = $(this).closest('tr'); 
    		var order_id = $(".order_id").val();
    		var partner = $(".partner option:selected").val();
    		var date = $("#sp-date").val();
			var source = $(".source").val();
			var delivery = $(".delivery option:selected").val();
			var picking = $(".picking option:selected").val();
			var priority = $(".priority option:selected").val();
			var done_qty = $(".qty_done_input").val();
			if(delivery=="0" || picking==""){
				error = true;
				$(".picking").addClass("required_column");
				$(".delivery").addClass("required_column");
				 
			}
			else{
				error = false;
				$(".picking").removeClass("required_column");
				$(".delivery").removeClass("required_column");
				self.gui.close_popup();
			}
			if(!error){
				shipment_vals.push({
					"origin":source,
					"min_date":date,
					"partner_id":partner,
					"move_type":delivery,
					"picking_type_id":picking,
					"priority":priority
					});
				ship_vals.push({"quantity_done":done_qty});
				this._rpc({
	                model: 'sale.order',
	                method: 'update_shipment_details',
	                args: [0, order_id, shipment_vals, ship_vals],
	            }).then(function (result) {
				
	            });
			}
		},
	    click_validate: function(ev){
	    	 var tr = $(this).closest('tr'); 
	    	 var order_id =$(".order_id").val();
	    	 this._rpc({
	                model: 'sale.order',
	                method: 'qty_to_validate',
	                args: [order_id],
	            }).then(function (result) {
	            	
		 		 });
	   },
	});

    gui.define_popup({name:'success', widget: SuccessPopupWidget});
    
    var PaymentPopupWidget = PopupWidget.extend({
      	 template: 'PaymentPopupWidget',
   	    events: _.extend({}, PopupWidget.prototype.events, {
   	    	'click .payment_confirm':'click_payment_confirm',
   	    	'change .payment_amount': 'onchange_payamount',
   	    	'click .journal': 'onedit_field',
   	    	'click .payment_amount': 'onedit_field',
   		}),
   		 onedit_field:function(ev){
   			$(ev.currentTarget).attr('required',false);
   			if($(ev.currentTarget).hasClass('required_column')){
   				$(ev.currentTarget).removeClass("required_column");
   			}
			$(".error").css({"display":"none"});
   		 },
   	     click_payment_confirm: function(ev){
   			var self = this;
   	    	var pay_vals=[];
   			var error = false;
   			var tr = $(this).closest('tr'); 
   			var order_id =$(".order_id").val();
   			var journal = $(".journal option:selected").val();
   			var pay_date = $(".pay-date").text();
   			var payment_amount = $(".payment_amount").val();
   			var memo = $(".memo").text();
   			var payment_type = $(".payment_type").val();
   			var partner_type = $(".partner_type").val();
   			var account_id = $(".account_id").val();
   			var invoice_id = $("#invoice_id").val();
   			var currency_id = $(".currency_id").val();
   			var partner_id = $(".partner_id").val();
   			if(journal=="" || payment_amount==""){
   				error = true;
   			}
   			if(!error){
	   			pay_vals.push({
		   			"journal_id":journal,
		   			"amount":payment_amount,
		   			"payment_date":pay_date,
		   			"communication":memo,
		   			"payment_type":payment_type,
		   			"partner_type":partner_type,
		   			"account_id":account_id,
		   			"invoice_id":invoice_id,
		   			"currency_id":currency_id,
		   			"partner_id":partner_id,
	   			});
	   			this._rpc({
	   	            model: 'account.payment',
	   	            method: 'create_payment',
	   	            args: [order_id, pay_vals],
	   	        }).then(function (result) {
	   				if(result==true){
	   	   				$('#so_quotation_otable').bootstrapTable('destroy');
	   	   				$('.RFQButton').click();
	   				}
	   			});
	   			self.gui.close_popup();
   			}
   			else{
   				/*** Mandatory fields to be filled error ***/
				error = true;
   				if (journal=="" || journal == 0){
   					$(".journal").attr('required',true);
   					$(".journal").addClass("required_column");
   				}
   				if (payment_amount=="" || payment_amount == 0){
   					$(".payment_amount").attr('required',true);
   					$(".payment_amount").addClass("required_column");
   				}
   				$(".error").css({"display":"block"});
   			}
   		},
   		onchange_payamount: function(e){
   			var self = this;
   	    	var vals=[];
   			var tr = $(this).closest('tr'); 
      		var payment_id =$(".order_id").val();
      		var amount = $(".amount").val();
      		var changed_amount = $(".payment_amount").val();
      		if (changed_amount){
      			this._rpc({
   	            model: 'account.payment',
   	            method: 'change_payment_amount',
   	            args: [payment_id, changed_amount, amount],
      			}).then(function (result) {
	   				if(result>0){
	   					$(".display_partial_amt").css({'display':'contents'});
	   					$('#partial_amt').text(result);
	   				}
	   				return result
      			});
      		}
   		},
    });
    gui.define_popup({name:'payment', widget: PaymentPopupWidget});

    var QuotationPopupWidget = PopupWidget.extend({
	    template: 'QuotationPopupWidget',
	});
	
    gui.define_popup({name:'success_quotation', widget: QuotationPopupWidget});

	/*** Render RFQ Button - RFQ Click Action  ***/
    var SalesOrderButton = screens.ActionButtonWidget.extend({
    	template : 'SalesOrderButton',
		
		init: function(parent, options) {
	        this._super(parent, options);
	    },
	    
	    button_click: function(event, $el) {
	    	var self = this;
        	 var order = self.pos.get_order();
             var client = order.get_client();
             var orderlines = order.get_orderlines();
             var order_ids_to_sync = _.pluck(order, 'id');

             if(orderlines.length <= 0 ){
            	 self.gui.show_popup('alert',{
                     'title': _t('Your shopping cart is empty'),
                     'body':  _t('Please add product to create a quotation.'),
                 });
             }
             else if (!client)
 			 {
 	        	 self.gui.show_popup('confirm',{
                      'title': _t('Please select the Customer'),
                      'body': _t('You need to select the customer before creating quotation.'),
                      confirm: function(){
                          self.gui.show_screen('clientlist');
                      },
                  });
 			 }
             else{
            	 var ref = [];
            	 self.pos.gui.show_popup('confirm', {
	                'title': _t('Create Quotation'),
	                'body':  _t('Please confirm to create a request for quotation.'),
	                confirm: function(){
	                	this._rpc({
	    	                model: 'sale.order',
	    	                method: 'create_quotation_from_ui',
	    	                args: [order.export_as_JSON()],
	    	            }).then(function (order_ref) {
	    	            	ref = order_ref;
	                         order.remove_orderline(orderlines); 
	                         order.set_client(0); 
	                         $('.RFQ-cnt').removeClass('overlay-ordercnt');
	                     	 $('.RFQ-cnt').text('');
	                         self.gui.show_popup('success_quotation',{
		        	                'title': _t('Quotation created successfully !!'),
		        	                'body': _t('Quotation # '+ ref[0].name),
		        	                cancel: function(){
		        	                	var self = this;
	        	            	    	self.chrome.do_action('sale.action_report_saleorder',
	        	            	 	 	   	   {additional_context:{active_ids:[ref[0].id],}
	        	            	 	 	});
		        	                },
		        	        });
	                    },function(err,event){
	        	            event.preventDefault();
	        	            var err_msg = 'Please verify the details given or Check the Internet Connection./n';
	        	            if(err.data.message)
	        	            	err_msg = err.data.message;
	        	            self.gui.show_popup('alert',{
	        	                'title': _t('Error: Could not create quotation'),
	        	                'body': _t(err_msg),
	        	            });
	        	        });
		                },
		             });
             }
		},
		renderElement: function() {
			var self = this;
		    this._super();
		    this.$('.sales_order_button').click(function(event){
		    	self.button_click(event,$(this));
				ispayment = false;
		    });
		},
	});
    screens.define_action_button({'name' : 'saleorder', 'widget' : SalesOrderButton,});

    var RFQScreenWidget = screens.ScreenWidget.extend({
		 template: 'RFQScreenWidget',
		 init: function(parent, options){
		        this._super(parent, options);
		    },
		    auto_back: true,
		    show: function(){
		        this._super();     
		        var self = this;
		        this.renderElement();
		        var order = self.pos.get_order();
		    	this.$('.back').click(function(){
		          	 self.gui.show_screen('products');
		          });
		    	self.render_order(self.get_data(),order); 
		    	$('.confirm_order').on('click',function(event){
		    		var tr = $(this).closest('tr'); 
		    		var order_id =tr.find('.so_order_id').text();
		    		self._rpc({
		                model: 'sale.order',
		                method: 'so_order_confirm',
		                args: [order_id],
		            }).then(function (result) {
		    			if(result==true){
		    				$('#so_quotation_otable').bootstrapTable('destroy');
		    				$('.RFQButton').click();
		    			}
			 		 })
		        });
		    	$(document).on('click',".shipment",function(event){
		    		var tr = $(this).closest('tr'); 
		    		var order_id =tr.find('.so_order_id').text();
		    		self._rpc({
		                model: 'sale.order',
		                method: 'shipment_view',
		                args: [order_id],
		            }).then(function (result) {
		    			var shipment = result['shipment_vals']
		    			var shipment_dropdown = result['shipment_dropdown']
		    			var picking_vals = result['picking_type_vals']
		    			var state = result['state'];
		    			 if(shipment || shipment_dropdown || picking_vals){
		    				self.gui.show_popup('success',{
	        	                'title': _t('Shipment'),
	        	                'shipment_view':shipment,
	        	                'shipment_dropdown':shipment_dropdown,
	        	                'picking_type':picking_vals,
	        	                'state':state,
                    	  });
		    			 }
		    			var tab_id = 0
		    			self.render_tab(tab_id,order_id);
	    				  $("div.shipment-tab-menu>div.tab>a").click(function(e) {
       				        e.preventDefault(); 
       				        $(this).siblings('a.active').removeClass("active");
       				        $(this).addClass("active");
       				        var id = $(this).attr('data-id');
       				        if(id=="0"){
       				        	var $table = $("div.ship-tab>div.ship-tab-content>div.operations_table>").find('#operations');
       				        	self.render_event_order(id,$table, order_id);
       				        }
       				        else if(id=="1"){
       					        var $table = $("div.ship-tab>div.ship-tab-content>div.initial_table>").find('#initial');
       						    self.render_event_order(id,$table,order_id);
       				        }
       				        else{
       				        	var $table = $("div.ship-tab>div.ship-tab-content>div.additional_info_table>").find('#additional');
       				        	self.render_event_order(id,$table,order_id);
       				        	
       				        }
       			    	});
	    				  $('.edit').on('click',function(){ 
	    					    var self = this;
		    					$(".shipment_confirm").css({'display':'block'});		    					
		    					$("#partner").css({'display':'none'});
		    					$(".partner").css({'display':'block'})
		    					$("#delivery").css({'display':'none'});
		    					$(".delivery").css({'display':'block'});
		    					$("#priority").css({'display':'none'});
		    					$(".priority").css({'display':'block'});		    					
		    					$(".qty_done_span").css({'display':'none'});
		    					$(".qty_done_input").css({'display':'block'});
		    					$('.edit').css({'display':'none'});
		    				});
			 		 })
		        });

		    	$('.createinvoice').on('click',function(event){
		    		var tr = $(this).closest('tr'); 
		    		var order_id =tr.find('.so_order_id').text();
		    		self._rpc({
		                model: 'sale.order',
		                method: 'create_invoices',
		                args: [order_id],
		            }).then(function (result) {
		    			if(result==true){
		    				$('#so_quotation_otable').bootstrapTable('destroy');
		    				$('.RFQButton').click();
		    			}
		    			
			 		 })
		        });
		    	$('.printpdf').on('click',function(event){
					var tr = $(this).closest('tr'); 
		    		var invoice_id =tr.find('.invoice_id').text();
		    		self.chrome.do_action('account.account_invoices',
				 	    	   {additional_context:{active_ids:[invoice_id],}
				 	});
				});
				$('.payment').on('click',function(event){
					var tr = $(this).closest('tr'); 
					var order_id =tr.find('.so_order_id').text();
					self._rpc({
		                model: 'sale.order',
		                method: 'payment_details',
		                args: [order_id],
		            }).then(function (result) {
		    			var payment_details = result['payment_vals']
		    			var journals = result['journals']
		    				 self.gui.show_popup('payment',{
		     	                'title': _t('Payment'),
		     	                'payment_details':payment_details,
		     	                'journals':journals,
		              	  });
		    		 })
				});
		    	$(document).on('click',".page-number, .page-pre, .page-next, .sortable, .search",function(event){
		    		$('.confirm_order').on('click',function(event){
			    		var tr = $(this).closest('tr'); 
			    		var order_id =tr.find('.so_order_id').text();
			    		self._rpc({
			                model: 'sale.order',
			                method: 'so_order_confirm',
			                args: [order_id],
			            }).then(function (result) {
			    			if(result==true){
			    				$('#so_quotation_otable').bootstrapTable('destroy');
			    				$('.RFQButton').click();
			    			}
				 		 })
			        });
		        });
		    	$(document).on('click',".confirm_order",function(event){
		    		var tr = $(this).closest('tr'); 
		    		var order_id =tr.find('.so_order_id').text();
		    		self._rpc({
		                model: 'sale.order',
		                method: 'so_order_confirm',
		                args: [order_id],
		            }).then(function (result) {
		    			if(result==true){
		    				$('#so_quotation_otable').bootstrapTable('destroy');
		    				$('.RFQButton').click();
		    			}
			 		 })
		    	});
		    	$(document).on('click',".payment",function(event){
		    		var tr = $(this).closest('tr'); 
					var order_id =tr.find('.so_order_id').text();
					self._rpc({
		                model: 'sale.order',
		                method: 'payment_details',
		                args: [order_id],
		            }).then(function (result) {
		    			var payment_details = result['payment_vals']
		    			var journals = result['journals']
		    				 self.gui.show_popup('payment',{
		     	                'title': _t('Payment'),
		     	                'payment_details':payment_details,
		     	                'journals':journals,
		              	  });
		    		 })
		    		
		    	});
		    },
		   
		    render_event_order: function(list_id,$table,order_id){
		      	var self = this;
		   	     if (list_id=="0")
		   	     {
		   	    	list_tab_id = list_id;
		   	    	self._rpc({
		                model: 'sale.order',
		                method: 'shipment_operation_lines',
		                args: [order_id],
		            }).then(function (result) {
			   	    	 var shipment_lines =result
			   	    	
			   	    	$('#operations').bootstrapTable({
			   	    		
				   	    	height: function() {
			   	                return $(window).height() - $('h1').outerHeight(true);
			   	            },
			   	            locale:'en-US',
			   	            columns: [			   	             
			   	             {field: 'product',class:'prod',title: 'Product',},
			   	             {field: 'to_do',class:'to_do',title: 'Initial Demand',},
				             {field: 'qty_done',class:'qty_done',id:'qty_done',title: 'Done',
			   	            	 formatter: function (value) {
			   	            			 return '<span class="qty_done_span">'+value+'</span> <input  style="display:none;" class = "qty_done_input"  value='+ value +'></input>';
					     }},
			   	            ],
			   	            data: result,
				   	    	  
				   	      });
				      });
			   		$('.additional_info_table').hide();
			   		$('.initial_table').hide();
			   		$('.operations_table').show();
		   	    	
		   	     }
		   	     else if(list_id=="1"){
		   	    	list_tab_id = list_id;
		   	    	self._rpc({
		                model: 'sale.order',
		                method: 'shipment_initial_lines',
		                args: [order_id],
		            }).then(function (result) {
			   	    	  var lines =result
			   			 $('#initial').bootstrapTable({
					   		  height: function() {
				   	                return $(window).height() - $('h1').outerHeight(true);
				   	            },
				   	            locale:'en-US',
				   	            columns: [
				   	             {field: 'product',class:'prod',title: 'Product',},
					             {field: 'qty',class:'qty',title: 'Quantity',},
					             {field: 'state',class:'state',title: 'State',},
				   	            ],
				   	            data: result,
				   	      });
				      });
			   		$('.additional_info_table').hide();
			   		$('.initial_table').show();
			   		$('.operations_table').hide();
		   	    	
		   	     }
			   	  else{
			   		self._rpc({
		                model: 'sale.order',
		                method: 'shipment_view',
		                args: [order_id],
		            }).then(function (result) {
		    			var shipment = result[0]
		   	    	});
		   	    	$('.additional_info_table').show();
		   	    	$('.operations_table').hide();
		   	    	$('.initial_table').hide();
				   		
				     }
		   	
		      },
		      render_tab:function(tab_id,order_id){
		    	  	var self = this;
		    		var id = tab_id
			        $(this).siblings('a.active').removeClass("active");
			        $(this).addClass("active");
			        if(id==tab_id){
			        	var $table = $("div.ship-tab>div.ship-tab-content>div.operations_table>").find('#operations');
			        	self.render_event_order(id,$table, order_id);
			        }
		    	},
		    get_data: function(){
		        return this.gui.get_current_screen_param('dldata');
		    },
		    renderElement: function(scrollbottom){
		    	this._super();
		    	var self = this;
		    	 /**Floating icon action **/      
		    },
		    render_order: function(result, order){
		      	 var self = this;
		      	 var lines = jQuery.extend(true, {}, order['orderlines']['models']);  
		       	 //looping through each line  		
		       	 var current_session_id = this.pos.pos_session.id  
		         var so_lines = result['order_details'];
		      	 $('#so_quotation_otable').bootstrapTable({
		   	            height: function() {
		   	                return $(window).height() - $('h1').outerHeight(true);
		   	            },
		   	            locale:'en-US',
		   	            columns: [
		   	             {field: 'sno', class: 'sno',title: 'S.no',sortable: true,},
			             {field: 'partner',class:'partner',title: 'Customer',visible: true,},
			             {field: 'name',title: 'OrderRef', sortable: true,},
			             {field: 'order_id',class:'so_order_id',title: 'Order ID',visible: true,},
					     {field: 'date_order',title: 'Date',sortable: true,
					    	 formatter: function(value, row, index) {						    			
					    			var momentObj = moment(value, 'YYYY/MM/DD');
					    			var momentString = momentObj.format('DD/MM/YYYY');			
					    			   return momentString;		   
					    		}
					     },
					     {field: 'amount_total',class: 'amount_total',title: 'Amount',sortable: true,},
					     {field: 'amount_due',class: 'amount_due',title: 'Amount Due',sortable: true,},
					     {field: 'status',class: 'status',title: 'Status',sortable: true,},
					     {field: 'invoice_id',class: 'invoice_id',title: 'Invoice ID',sortable: true,},
					     {field: 'status',title: 'Shipment',align: 'right', 
					    	 formatter: function (status) {
					    		 if(status){
					    			 return '<a class="shipment" style="cursor:pointer;"><i class="fa fa-truck" aria-hidden="true"></i></a>';
					    		 }
					     }},
					     {field:'invoice_status',class:'invoice_status',title:'Invoice Status',sortable: true,},
					     {field: 'status',title: '',align: 'right', 
					    	 formatter: function (status,row) {
					    		 if(status=='Draft' || status=='Quotation'){
					    			 return '<a class="confirm_order"><span class="confirm-button">Confirm</span></a>';
					    		 }
					    		 else if((status=='Sale' || status=='Sale Order') && row.invoice_id==false){
					    			 return '<a class="createinvoice"><span class="invoice-button">Invoice</span></a>';
					    		 }
					    		 else if(status=='Open'){
					    			 return'<a class="payment"><span class="payment-button">Payment</span></a>';
					    			 
					    		 }
					    		 else{
					    			 return'<a class="printpdf"><span class="print-button">Print</span></a>';
					    		 }
					    		 
					     }},
					   
		   	            ],
		   	            data: so_lines,
		   	            search: true,
		   	            pagination: true,
		   	            detailView: true,   
		   	      });
		   	      $('#so_quotation_otable').on('expand-row.bs.table', function (e, index, row, $detail) {
		   	    	var order_id = row.order_id;
		   	    	self._rpc({
		                model: 'sale.order',
		                method: 'fetch_quotation_order_line',
		                args: [order_id],
		            }).then(function (result) {
		    			   var rline_html = QWeb.render('SOLineScreenWidget',{widget: this, lines:result}); 		    			 
		    			   $detail.html(rline_html);		    			   
				     });
		   	      });
		      },
	});
	gui.define_screen({name:'rfq', widget: RFQScreenWidget});

    chrome.OrderSelectorWidget.include({
	    template: 'OrderSelectorWidget',
	    init: function(parent, options) {
	        this._super(parent, options);
	    },
	    view_rfq_click_handler: function() {
	    	var self = this;
	    	var order = self.pos.get_order();
	    	var customer = order.get_client();
	    	var id = self.pos.pos_session.id;
	    	this._rpc({
                model: 'sale.order',
                method: 'fetch_quotation_order',
                args: [id,order.export_as_JSON()],
            }).then(function (result) {
            	  // Render RFQ view
	  	    	  self.gui.show_screen('rfq',{dldata:result},'refresh');
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
	    renderElement: function(){
	    	var self = this;
	        this._super();
	        /** RFQ Button click **/
	        this.$('.RFQButton').click(function(){
	        	self.view_rfq_click_handler(event,$(this));	        	
	        });
	    },
	  });
});