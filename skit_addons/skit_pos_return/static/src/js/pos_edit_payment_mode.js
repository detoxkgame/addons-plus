odoo.define('skit_pos_return.pos_edit_payment_mode', function (require) {
"use strict";

	var core = require('web.core');
	var QWeb = core.qweb;
	var _t = core._t;
	var gui = require('point_of_sale.gui');
	var utils = require('web.utils'); 
	var PopupWidget = require('point_of_sale.popups');
	var pos_customerlog = require('skit_customer_log.pos_customerlog');
	var CustomerLogScreenWidget = pos_customerlog.CustomerLogScreenWidget;
	var round_di = utils.round_decimals;
	var deleted_payment_list = [];
	var error = false;
	
	CustomerLogScreenWidget.include({
	    
		show: function(){
	        var self = this;
	        this._super();      
	        var order = self.pos.get_order();
	    	self.render_order(self.get_data(),order); 

	        $(document).on('click','.cancel_invoice_btn',function(event){
	        	var line = $(this);
	        	self.pos.gui.show_popup('confirm', {
	                'title': 'Cancel Invoice',
	                'body': 'Please confirm to cancel an invoice.',
	                confirm: function(event){
	                	self.click_cancel_invoice(event,line);
				     },
	        	});
	        });
	    },
		
		click_cancel_invoice: function(event,$line){
			var self = this;
			var tr = $line.closest('tr');   	
	    	var order_id = tr.find('.dl_order_id').text();
	    	
	    	//new Model('pos.order').call('cancel_invoice',[order_id]).then(function(result){
	    	self._rpc({model: 'pos.order', method: 'cancel_invoice', args: [order_id], }).then(function(result) {
	    		if(result == true){
	    			tr.find('.edit_payment_btn').addClass("display_none");
	    			tr.find('.cancel_invoice_btn').addClass("display_none");
					self.gui.show_popup('alert',{
						'title': _t('Confirm'),
						'body': _t('Invoice cancelled.'),
					});
	    		}
	    		else{
	    			self.gui.show_popup('error',{
						'title': _t('Error'),
						'body': _t(result),
					});
	    		}
	    	});  
		},
	    
	    render_order: function(result,order){
	    	 var lines = jQuery.extend(true, {}, order['orderlines']['models']);   		        
	    	 var self = this;
	    	 var current_session_id = this.pos.pos_session.id 
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
				     {field: 'session_id',title:'Edit',align: 'center',
				    	 formatter: function (value,row) {
				    		 var edit_btn = '';
				    		 if((value == current_session_id) && (row.invoice_id)&& (!row.invoice_cancel)){
				    			 edit_btn= edit_btn+'<span class="cancel_invoice_btn btn_pressed_effect button"><i class="fa fa-remove"></i></span>';
				    		 }
				    		 return edit_btn;
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
		    		//new Model('pos.order').call('fetch_customer_olines',[order_id, row.type]).then(
		    				//function(result){
		    		self._rpc({model: 'pos.order', method: 'fetch_customer_olines', args: [order_id, row.type],})
		    		.then(function(result) {
		    					var rline_html = QWeb.render('CLOLineScreenWidget',{widget: self, lines:result}); 		    			 
		    					$detail.html(rline_html);	
		    				});
		        });		    			    	
	    },
	});
});