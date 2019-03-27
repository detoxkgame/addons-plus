odoo.define('skit_pos_order_lists.pos_order_list', function (require) {
"use strict";

var core = require('web.core');
var QWeb = core.qweb;
var chrome = require('point_of_sale.chrome');
var _t = core._t;
var gui = require('point_of_sale.gui');
var models = require('point_of_sale.models');
var screens = require('point_of_sale.screens');
var utils = require('web.utils');
var session = require('web.session');
var round_pr = utils.round_precision;
var PopupWidget = require('point_of_sale.popups');
var round_di = utils.round_decimals;
var PaymentScreenWidget = screens.PaymentScreenWidget;
var list_tab_id = 0

var _super = models.Order.prototype;
models.Order = models.Order.extend({
	initialize: function(attributes,options){
		_super.initialize.apply(this,arguments);
		 this.is_orderlists = false;
		 this.save_to_db();
	},
	/* Order Lists */
	set_is_orderlists: function(is_orderlists) {
        this.is_orderlists = is_orderlists;
        this.trigger('change');
    },
    get_is_orderlists: function(){
        return this.is_orderlists;
    },
  });

screens.PaymentScreenWidget.include({
	template: 'PaymentScreenWidget',
	renderElement: function() {
        var self = this;
        var order = this.pos.get_order();
        this._super();

    },
    click_back: function() {
        // Placeholder method for ReceiptScreen extensions that
        // can go back ...
    	this._super();
    	var order = this.pos.get_order();
    	if(order.get_is_orderlists()){
    		order.set_is_pending(false);
    		order.set_is_orderlists(false);
    		order.set_client();
    		this.gui.show_screen('order_list_paylater');
    	}
    },
});

var OrderListScreenWidget = screens.ScreenWidget.extend({
    template: 'OrderListScreenWidget',

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
    	// Tab click action
    	$("div.bhoechie-tab-menu>div.list-group>a").click(function(e) {
	        e.preventDefault();
	        $(this).siblings('a.active').removeClass("active");
	        $(this).addClass("active");
	        var id = $(this).attr('data-id');
	        
	        if(id>0){
	        	/** Display Pending invoice table **/
	        	var $table = $("div.bhoechie-tab>div.bhoechie-tab-content>div.pending_table>" +
		   		"div.bootstrap-table>div.fixed-table-container>div.fixed-table-body").find('#ol_pending_invoice_otable');
		        	self.render_event_order(id,$table);	
	        }
	        else{
	        	/** Display Order lists table **/
		        var $table = $("div.bhoechie-tab>div.bhoechie-tab-content>div.orderlist_table>" +
			   		"div.bootstrap-table>div.fixed-table-container>div.fixed-table-body").find('#ol_otable');
			        self.render_event_order(id,$table);
	        }
	        
    	});
    	self.render_order(self.get_data(),order); 

    	//Invoice button
    	$(document).unbind().on('click',".order_invoice",function(event){
     		var tr = $(this).closest('tr');   	
     		var order_id = tr.find('.pending_porder_id').text();
  	    	var order_type = tr.find('.pending_order_type').text();
  	    	var invoice_id = tr.find('.pending_invoice_id').text();
  	    	self.order_invoice_print(event,order_id,invoice_id,order_type);
  	    	
     	});  
    	
    	//Pay now button
        $(document).on('click',".ol_pendingpay",function(event){
        	self.pos.proxy.open_cashbox();
        	 order.set_is_pending(true);
        	 var tr = $(this).closest('tr');   	
 	    	 var invoice_id = tr.find('.pending_invoice_id').text();
 	    	 var amount = tr.find('.unpaid_amount').text();
 	    	 var porder_id = tr.find('.pending_porder_id').text();
 	    	 var porder_type = tr.find('.pending_order_type').text();
 	    	 var customer_id = tr.find('.customer_id').text();
 	    	 order.set_pending_invoice(invoice_id);
 	    	 order.set_pending_amt(amount);
 	    	 order.set_pending_porder(porder_id);
 	    	 order.set_pending_order_type(porder_type);
 	    	 order.set_is_orderlists(true);
 	    	 order.set_client(self.pos.db.get_partner_by_id(customer_id));
        	 self.gui.show_screen('payment');
        });

    	//Reprint Receipt button
        $(document).on('click',".reprint_receipt",function(event){
        		var tr = $(this).closest('tr');  
     	    	var order_id = tr.find('.pending_porder_id').text();
     	    	var order = self.pos.get_order();
     	    	order.set_is_reprint_order(order_id); //set order_id for reprint order
     	    	self.gui.show_screen('order_reprint_receipt'); //render receipt window
    	});
    },
    render_event_order: function(list_id, $table){
	   	 var self = this;
	   	 var order = self.pos.get_order();
	   	 var partner = order.get_client();   
	     if (list_id > 0)
	     {
	    	 // Order lists records
	    	 list_tab_id = list_id;
	    	 if(partner){
	    		 this._rpc({
	                 model: 'pos.order',
	                 method: 'fetch_partner_order_list',
	                 args: [list_id, partner.id, self.pos.pos_session.id],
	             }).then(function(result){
			    	   var order_lists = result['pendinginvoice'];
			    	   $table.bootstrapTable("load", order_lists);
			      });
	    	 }
	    	 else{
	    		 this._rpc({
	                 model: 'pos.order',
	                 method: 'fetch_partner_order_list',
	                 args: [list_id, 0, self.pos.pos_session.id],
	             }).then(function(result){
			    	   var order_lists = result['pendinginvoice'];
			    	   $table.bootstrapTable("load", order_lists);
			      });
	    	 }
	    	 $('.orderlist_table').hide(); //hide order list table 
	    	 $('.pending_table').show();
	     }
	     else{
	    	 //Pending Invoices records
	    	  list_tab_id = list_id;
	    	  var data = self.get_data();
	    	  $table.bootstrapTable("load", data['pendinginvoice']);
	    	  $('.orderlist_table').show();
	    	  $('.pending_table').hide(); //hide pending invoice table 
	     }
   	
   },
    renderElement: function(scrollbottom){
    	this._super();
    	var self = this;
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
    render_order: function(result, order){
   	 var lines = jQuery.extend(true, {}, order['orderlines']['models']);   		        
   	 //looping through each line  		
   	 var self = this;
   	 var current_session_id = this.pos.pos_session.id  
     var pending_invoices = result['pendinginvoice'];
   	 var $table = $('#ol_otable');
   	 	/* Order list table*/
   	 	$('#ol_otable').bootstrapTable({
		         height: function() {
		             return $(window).height() - $('h1').outerHeight(true);
		         },
		         locale:'en-US',
		         columns: [{field: 'invoice_id', class: 'pending_invoice_id',title: 'ID',sortable: true,},
		          {field: 'sno', class: 'sno',title: 'S.no',sortable: true,},
		          {field: 'customer', class: 'customer',title: 'Customer',sortable: true,},
		          {field: 'customer_id', class: 'customer_id',title: 'Customer ID',visible: true,},
		          {field: 'mobile', class: 'mobile',title: 'Mobile Number',sortable: true,},
		          {field: 'type',class:'pending_order_type',title: 'Order Type',visible: true,},
		          {field: 'porder_id',class:'pending_porder_id',title: 'Order ID',visible: true,},
		          {field: 'name',title: 'OrderRef', sortable: true,},
		          {field: 'date_order',title: 'OrderDate',sortable: true,		            	  
				    		formatter: function(value, row, index) {					    							    			
				    			var momentObj = moment(value, 'YYYY/MM/DD');
				    			var momentString = momentObj.format('DD/MM/YYYY');
				    			   return momentString;			   
				  }},
				  {field: 'status',title: 'Status', sortable: true,},
				  {field: 'invoice_ref',title: 'InvoiceRef',sortable: true,},
				  {field: 'amount_total',class: 'amount_total',title: 'Amount',align: 'right', sortable: true,},
				  {field: 'invoice_ref',title: 'Invoice',align: 'center', 
				    	 formatter: function (value) {
				    		 if(value){
				    			 return '<a class="order_invoice" style="cursor:pointer;"><i class="fa fa-print" aria-hidden="true"></i></a>';
				    		 }else{
				    			 return '';
				    		 }
				   }},
				   {field: 'porder_id',title: 'Reprint Receipt',align: 'center', 
				    	 formatter: function (value) {
				    		 if(value){
				    			 return '<a class="reprint_receipt" style="cursor:pointer;"><i class="fa fa-retweet" aria-hidden="true"></i></a>';
				    		 }else{
				    			 return '';
				    		 }
				    }},
		         ],
		         data: pending_invoices,
		         search: true,
		         pagination: true,
		         detailView: true,   
		   });
   	 	/*Pending invoice table*/
	 	$('#ol_pending_invoice_otable').bootstrapTable({
	            height: function() {
	                return $(window).height() - $('h1').outerHeight(true);
	            },
	            locale:'en-US',
	            columns: [{field: 'invoice_id', class: 'pending_invoice_id',title: 'ID',sortable: true,},
	             {field: 'sno', class: 'sno',title: 'S.no',sortable: true,},
	             {field: 'customer', class: 'customer',title: 'Customer',sortable: true,},
 	             {field: 'customer_id', class: 'customer_id',title: 'Customer ID',visible: true,},
 	             {field: 'mobile', class: 'mobile',title: 'Mobile Number',sortable: true,},
	             {field: 'type',class:'pending_order_type',title: 'Order Type',visible: true,},
	             {field: 'porder_id',class:'pending_porder_id',title: 'Order ID',visible: true,},
	             {field: 'name',title: 'OrderRef', sortable: true,},
			     {field: 'invoice_ref',title: 'InvoiceRef',sortable: true,},
			     {field: 'date_invoice',title: 'InvoiceDate',sortable: true,
			    	 formatter: function(value, row, index) {						    			
			    			var momentObj = moment(value, 'YYYY/MM/DD');
			    			var momentString = momentObj.format('DD/MM/YYYY');			
			    			   return momentString;		   
			    		}
			     },
			     {field: 'amount_total',class: 'amount_total',title: 'InvoiceAmount',align: 'right', sortable: true,},
	             {field: 'unpaid_amount',class: 'unpaid_amount',title: 'UnPaidAmount', align: 'right',},
			     {field: 'invoice_ref',title: 'Invoice',align: 'center', 
			    	 formatter: function (value) {
			    		 if(value){
			    			 return '<a class="order_invoice" style="cursor:pointer;"><i class="fa fa-print" aria-hidden="true"></i></a>';
			    		 }else{
			    			 return '';
			    		 }
			     }},
			     {field: 'porder_id',title: 'Reprint Receipt',align: 'center', 
			    	 formatter: function (value) {
			    		 if(value){
			    			 return '<a class="reprint_receipt" style="cursor:pointer;"><i class="fa fa-retweet" aria-hidden="true"></i></a>';
			    		 }else{
			    			 return '';
			    		 }
			     }},
			     {field: 'unpaid_amount',class: 'pay_button', title: 'Pay Button', align: 'center',
			    	 formatter: function (value) {
			    		 if(value != '' && value > 0){
			    			 return '<a class="ol_pendingpay" style="cursor:pointer;"><span class="pay-button">Pay Now</span></a>';
			    		 }else{
			    			 return '';
			    		 }
			     }},
	            ],
	            data: pending_invoices,
	            search: true,
	            pagination: true,
	            detailView: true,   
	      });
   	 	
	       $('#ol_pending_invoice_otable').on('expand-row.bs.table', function (e, index, row, $detail) {
	    		//Pending invoices line
	    		var invoice_id = row.invoice_id;
	    		var order_id = row.porder_id;
		    	self._rpc({
	                model: 'pos.order',
	                method: 'fetch_pending_invoice_lines',
	                args: [invoice_id],
	            }).then(
	    		   function(result){
	    			   var rline_html = QWeb.render('OLPInvoiceLineScreenWidget',{widget: this, lines:result}); 		    			 
	    			   $detail.html(rline_html);		    			   
			     });    		  
	      });  
	      $('#ol_otable').on('expand-row.bs.table', function (e, index, row, $detail) {
		    	//Order lists lines
		    	var order_id = row.porder_id;
		    	self._rpc({
	                model: 'pos.order',
	                method: 'fetch_customer_olines',
	                args: [order_id, row.type],
	            }).then(
			    	function(result){
			    		var rline_html = QWeb.render('OLPInvoiceLineScreenWidget',{widget: self, lines:result}); 		    			 
			    		$detail.html(rline_html);			  
			    	});  
	      }); 
   },
});
gui.define_screen({name:'order_list_paylater', widget: OrderListScreenWidget});

chrome.OrderSelectorWidget.include({
    template: 'OrderSelectorWidget',
    init: function(parent, options) {
        this._super(parent, options);
    },   
    view_ol_paylater_click_handler: function(event, $el) {
    	var self = this;
    	var order = self.pos.get_order();
    	var partner = order.get_client();
    	 var lines = self.pos.get_order().get_paymentlines();
         for ( var i = 0; i < lines.length; i++ ) {
                self.pos.get_order().remove_paymentline(lines[i]);
         }
    	if(partner){
    		// Render Devotee Log Screen - Refresh screen on every click
            /** Fetch order detail from Server**/
    		this._rpc({
                model: 'pos.order',
                method: 'fetch_partner_order_list',
                args: [0,partner.id, self.pos.pos_session.id],
            }).then(function(result){
  	    	  self.gui.show_screen('order_list_paylater',{dldata:result},'refresh');
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
    		/** Fetch order detail from Server**/
    		this._rpc({
                model: 'pos.order',
                method: 'fetch_partner_order_list',
                args: [0,0, self.pos.pos_session.id],
            }).then(function(result){
  	    	  self.gui.show_screen('order_list_paylater',{dldata:result},'refresh');
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
    	}    	
    },
 	
    renderElement: function(){
    	var self = this;
        this._super();
        /** Order list Button click **/   
        this.$('.ol_paylater').click(function(event){
            self.view_ol_paylater_click_handler(event,$(this));
        });
    },
  });

});