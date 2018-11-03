odoo.define('skit_customer_log.pos_customerlog', function (require) {
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

	var CustomerLogScreenWidget = screens.ScreenWidget.extend({
		template: 'CustomerLogScreenWidget',
		
	    init: function(parent, options){
	        this._super(parent, options);
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
	        	 self.gui.show_screen('products');
	        });   	
	    	
	    	self.render_order(self.get_data(),order); 

	        $(document).unbind().on('click',".order_invoice",function(event){
	    		var tr = $(this).closest('tr');   	
	 	    	var order_id = tr.find('.dl_order_id').text();
	 	    	var order_type = tr.find('.dl_order_type').text();
	 	    	var invoice_id = tr.find('.dl_invoice_id').text();
	 	    	self.order_invoice_print(event,order_id,invoice_id,order_type);
	 	    	
	    	});  
	    },
	    renderElement: function(scrollbottom){
	    	this._super();
	    	var self = this;
	    	 /**Floating icon action **/      
	    	 $('.customerlog-button').click(function(event){        	
	       	 self.chrome.widget.order_selector.viewcustomerlog_click_handler(event,$(this)); 
	        	});		   
	    },
	    get_data: function(){
	        return this.gui.get_current_screen_param('dldata');
	    },
	    order_invoice_print: function(event,order_id,invoice_id,order_type){
	    	var self = this;
	    	if(order_type == 'POS'){
	    		self.chrome.do_action('point_of_sale.pos_invoice_report',
	 	 	 	    	   {additional_context:{active_ids:[order_id],}
	 	 	 	    });
	    	}else{
	    		self.chrome.do_action('account.account_invoices',
			 	    	   {additional_context:{active_ids:[invoice_id],}
			 	});
	    	}
	    },

	    render_order: function(result,order){
	    	 var lines = jQuery.extend(true, {}, order['orderlines']['models']);   		        
	    	 var self = this;
	    	 // Order Details 	    	
	    	 var orders = result['orders'];
	    	 
	    	 $('#dl_otable').bootstrapTable({
		            height: function() {
		                return $(window).height() - $('h1').outerHeight(true);
		            },
		            locale:'en-US',
		            columns: [{field: 'id',class:'dl_order_id',title: 'ID',visible: true,},
		             {field: 'type',class:'dl_order_type',title: 'type',visible: true,},
		             {field: 'sno',title: 'S.no',sortable: true,},
		             {field: 'name',title: 'OrderRef', sortable: true,},
				     {field: 'date_order',title: 'OrderDate',sortable: true,		            	  
				    		formatter: function(value, row, index) {					    							    			
				    			var momentObj = moment(value, 'YYYY/MM/DD');
				    			var momentString = momentObj.format('DD/MM/YYYY');
				    			   return momentString;			   
				    		}
				     },
				     {field: 'status',title: 'Status', sortable: true,},
				     {field: 'invoice_ref',title: 'InvoiceRef',sortable: true,},
				     {field: 'invoice_id',class:'dl_invoice_id',title: 'InvoiceID',sortable: true,},
		             {field: 'amount_total',title: 'Amount', align: 'right',},
				     {field: 'invoice_ref',title: 'Invoice',align: 'center',sortable: true, 
				    	 formatter: function (value) {
				    		 if(value){
				    			 return '<a class="order_invoice" style="cursor:pointer;"><i class="fa fa-print" aria-hidden="true"></i></a>';
				    		 }else{
				    			 return '';
				    		 }
				     }},
		            ],
		            data: orders,
		            sortName: 'date_order',
		            sortOrder: 'desc',
		            search: true,
		            pagination: true,
		            detailView: true,   
		        });
		    	 $(document).ready(function() {
		        	 $("table.table-hover").each(function(){
		        		 $(this).addClass("customer-log-table");
			    	 });
		         });
	    	
		    	$('#dl_otable').on('expand-row.bs.table', function (e, index, row, $detail) {
		    		var order_id = row.id;
		    		self._rpc({
		                model: 'pos.order',
		                method: 'fetch_customer_olines',
		                args: [order_id, row.type],
		            })
		            .then(function(result) {
		            	var rline_html = QWeb.render('CLOLineScreenWidget',{widget: self, lines:result}); 		    			 
    					$detail.html(rline_html);
		            });
		        });		    			    	
	    },
	});
	gui.define_screen({name:'customerlog', widget: CustomerLogScreenWidget});
		
	chrome.OrderSelectorWidget.include({
	    template: 'OrderSelectorWidget',
	    init: function(parent, options) {
	        this._super(parent, options);
	    },   
	    viewcustomerlog_click_handler: function(event, $el) {
	    	var self = this;
	    	var order = self.pos.get_order();
	    	var partner = order.get_client();
	    	 var lines = self.pos.get_order().get_paymentlines();
	         for ( var i = 0; i < lines.length; i++ ) {
	                self.pos.get_order().remove_paymentline(lines[i]);
	         }
	    	if(partner){
	    		// Render Customer Log Screen - Refresh screen on every click
	            /** Fetch order detail from Server**/
	    		this._rpc({
	                model: 'pos.order',
	                method: 'fetch_customer_order',
	                args: [partner.id, self.pos.pos_session.id],
	            }).then(function (result) {
	            	self.gui.show_screen('customerlog',{dldata:result},'refresh');
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
	
	    	}else{
	    		 self.gui.show_popup('alert',{
	                 'title': _t('Please select the Customer'),                 
	             });
	    	}    	
	    },
	    renderElement: function(){
	    	var self = this;
	        this._super();
	        /** CustomerLog Button click **/
	        this.$('.customerlog-button').click(function(event){
	            self.viewcustomerlog_click_handler(event,$(this));
	        });
	    },
	  });
	
	/** Include PaymentScreenWidget for hide CustomerLog Icon */
	screens.PaymentScreenWidget.include({
		template: 'PaymentScreenWidget',
		 validate_order: function(force_validation) {
			   this._super();
			   $('.customerlog-button').css({"display":"none"});			   
		    },
		
	});
});
