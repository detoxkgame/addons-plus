odoo.define('skit_hotel_management.checkout', function (require) {
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

var VendorPaymentScreenWidget = screens.ScreenWidget.extend({
    template: 'VendorPaymentScreenWidget',
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
        
        var contents = this.$('.vendor-payment');
        
        this.render_list();
        
        this.$('.back').click(function(){
        	self.gui.show_screen('firstpage');
        });
        this.$('.product').click(function(){
        	self.gui.show_screen('products');
        });
        
        this._rpc({
			model: 'hm.form.template',
			method: 'get_accommodation',
			args: [0],
		}).then(function(result){
			var result_datas = result[0]['result_datas']
    		var line_group = result[0]['line_group']
    		var line_group_key = result[0]['line_group_key']
    		var form_view = result[0]['form_view']
    		var sub_form_template = result[0]['sub_form_template']
    		var form_temp_id = result[0]['form_temp_id']
    		var sub_line_group = result[0]['sub_line_group']
    		var sub_line_group_key = result[0]['sub_line_group_key']
    		var dash_id = result[0]['dashboard_id']
			dashboard_id = dash_id;
			self.render_list(result_datas,form_view,sub_form_template,form_temp_id,line_group,line_group_key,sub_line_group,sub_line_group_key,false)
    		
    		var table = self.$('#vendor_order_list').DataTable({
		        bSort: false,
		        bFilter: false,
		        bPaginate: true, 
		        pageLength: 10,
		       /* columnDefs: [{
		            orderable: false,
		            targets: 0, className: 'select-checkbox'
		          }],
		          order: [[1,'asc']],
		          select:"multi"*/
			});
			
			
			/** View Option for DataTable */   
			contents.off('click','.view-datatable'); 
	        contents.on('click','.view-datatable',function(){
            	var sub_temp_id = $(this).attr('id');
            	var current_order_id = $(this).attr('orderid');
            	self._rpc({
        			model: 'hm.form.template',
        			method: 'get_vendor_list',
        			args: [0,0, dashboard_id, 0, false, sub_temp_id, current_order_id, 0, [],[], true],
        		}).then(function(result){ 
        			var result_datas = result[0]['result_datas']
        			var line_group = result[0]['line_group']
        			var line_group_key = result[0]['line_group_key']
        			var form_view = result[0]['form_view']
        			var sub_form_template = result[0]['sub_form_template']
        			var form_temp_id = result[0]['form_temp_id']
        			var sub_line_group = result[0]['sub_line_group']
        			var sub_line_group_key = result[0]['sub_line_group_key']

        			self.render_list(result_datas,form_view,sub_form_template,form_temp_id,line_group,line_group_key,sub_line_group,sub_line_group_key,true)
        			
        			var table = self.$('#vendor_order_list').DataTable({
        		        bSort: false,
        		        bFilter: false,
        		        bPaginate: true, 
        		        pageLength: 10,
        			});
        			
        			/** Show Payment Screen */
        			/*contents.off('click','.folio-payment'); 
        	        contents.on('click','.folio-payment',function(){
        				var invoice_id = $(this).attr('invid');
                    	var amount = $(this).attr('amt');
                    	var partner_id = $(this).attr('custid');
                    	var order_id = $(this).attr('orderid');

        				var order = self.pos.get_order();
        				order.set_client(self.pos.db.get_partner_by_id(partner_id));
        				self.pos.proxy.open_cashbox();
        	        	order.set_is_pending(true);
        	        	order.set_pending_invoice(invoice_id);
        	 	    	order.set_pending_amt(amount);
        	 	    	order.set_pending_porder(order_id);
        	 	    	order.set_pending_order_type('POS');
        	 	    	order.set_is_hm_pending(true);
        				self.gui.show_screen('payment');
        	        });*/
        			
        			/** Action for Back Button */
        			contents.off('click','.back-btn'); 
        	        contents.on('click','.back-btn',function(){
        				self._rpc({
                			model: 'hm.form.template',
                			method: 'get_vendor_list',
                			args: [0,0, dashboard_id, 0, false, 0, 0, 0, [], [], true],
                		}).then(function(result){ 
                			var result_datas = result[0]['result_datas']
                			var line_group = result[0]['line_group']
                			var line_group_key = result[0]['line_group_key']
                			var form_view = result[0]['form_view']
                			var sub_form_template = result[0]['sub_form_template']
                			var form_temp_id = result[0]['form_temp_id']
                			var sub_line_group = result[0]['sub_line_group']
                			var sub_line_group_key = result[0]['sub_line_group_key']

                			self.render_list(result_datas,form_view,sub_form_template,form_temp_id,line_group,line_group_key,sub_line_group,sub_line_group_key,false)
                			
                			var table = self.$('#vendor_order_list').DataTable({
                		        bSort: false,
                		        bFilter: false,
                		        bPaginate: true, 
                		        pageLength: 10,
                			});
                		});
        			});
        	        
        	        contents.off('click','.multi-pay'); 
        	        contents.on('click','.multi-pay',function(){
        	        	var invoice_id = 0;
                    	var amount = 0;
                    	var partner_id = 0;
                    	var order_id = 0;
                    	
        	        	$('#vendor_order_list tbody tr').each(function(){
        	        		//console.log($(this).find('input[type="checkbox"]').prop("checked"));
        	        		//console.log($(this).find("span.folio-payment").attr('amt'));
	       	        	    if($(this).find('input[type="checkbox"]').prop("checked")){
	       	        	    	invoice_id = $(this).find("span.folio-payment").attr('invid');
	                        	amount = amount + parseFloat($(this).find("span.folio-payment").attr('amt'));
	                        	partner_id = $(this).find("span.folio-payment").attr('custid');
	                        	order_id = $(this).find("span.folio-payment").attr('orderid');
	       	        		}
        	        	});
        	        	if(amount > 0){
        	        		var order = self.pos.get_order();
            				order.set_client(self.pos.db.get_partner_by_id(partner_id));
            				self.pos.proxy.open_cashbox();
            	        	order.set_is_pending(true);
            	        	order.set_pending_invoice(invoice_id);
            	 	    	order.set_pending_amt(amount);
            	 	    	order.set_pending_porder(order_id);
            	 	    	order.set_pending_order_type('POS');
            	 	    	order.set_is_hm_pending(true);
            	 	    	//order.set_to_invoice(true);
            				self.gui.show_screen('payment');
        	        	}
        	        });
        	        
        	        $('.data-select-all').on('click', function(){
        	            // Check/uncheck all checkboxes in the table
        	        	if(this.checked){
        	        		contents.find('.multi-pay').css({'display':'block'});
        	        	}else{
        	        		contents.find('.multi-pay').css({'display':'none'});
        	        	}
        	            var rows = table.rows({ 'search': 'applied' }).nodes();
        	            $('input[type="checkbox"]', rows).prop('checked', this.checked);
        	        });
        	        
        	        // Handle click on checkbox to set state of "Select all" control
        	        $('#vendor_order_list tbody').on('change', 'input[type="checkbox"]', function(){
        	        	
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
        	           var $checkboxes = table.$('input[type="checkbox"]');
        	           var countCheckedCheckboxes = $checkboxes.filter(':checked').length;
        	           if(countCheckedCheckboxes > 0){
        	        	   contents.find('.multi-pay').css({'display':'block'});
        	           }else{
        	        	   contents.find('.multi-pay').css({'display':'none'});
        	           }
        	        });
        			
        		});
            });
            
            
		});

    },
    sub_template_line_icon_url: function(id){
    	return '/web/image?model=hm.sub.form.template.line&id='+id+'&field=image';
    },
    render_list: function(result_datas,form_view,sub_form_template,form_temp_id,
    		line_group,line_group_key,sub_line_group,sub_line_group_key,ispending){
    	var contents = this.$el[0].querySelector('.vendor-payment');
        contents.innerHTML = "";
        var vendor_html = QWeb.render('PaymentListContent',{widget: this, result_datas: result_datas, form_view: form_view,
        						sub_form_template: sub_form_template, 
        						form_temp_id: form_temp_id,ispending: ispending,
        						line_group: line_group, line_group_key: line_group_key,
        						sub_line_group: sub_line_group, sub_line_group_key: sub_line_group_key});
        var vendorlist = document.createElement('div');
        vendorlist.innerHTML = vendor_html;
        vendorlist = vendorlist.childNodes[1];
        contents.appendChild(vendorlist);

    },
   
});
gui.define_screen({name:'vendor_payment', widget: VendorPaymentScreenWidget});

});