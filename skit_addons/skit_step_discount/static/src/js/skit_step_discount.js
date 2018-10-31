odoo.define('skit_step_discount.skit_step_discount', function(require) {
	"use strict";		
var screens = require('point_of_sale.screens');
var OrderWidget = screens.OrderWidget;
var gui = require('point_of_sale.gui');
var PopupWidget = require('point_of_sale.popups');
var models = require('point_of_sale.models');
var utils = require('web.utils');
var round_pr = utils.round_precision;
var core = require('web.core');
var _t = core._t;
screens.OrderWidget.include({
	set_value: function(val) {
    	var order = this.pos.get_order();
    	var selected_order_line=order.get_selected_orderline();
    	if (order.get_selected_orderline()) {
            var mode = this.numpad_state.get('mode');            
            if(selected_order_line.step_discount==undefined || val=='remove')
        	{
	            if( mode === 'quantity'){
	                order.get_selected_orderline().set_quantity(val);
	            }else if( mode === 'discount'){
	                order.get_selected_orderline().set_discount(val);
	            }else if( mode === 'price'){
	                order.get_selected_orderline().set_unit_price(val);
	            }
	    	}
            if(order.step_discount_arr!=undefined)
            	order.calculate_step_discount_order(order.step_discount_arr);
    	}
	},
});
screens.PaymentScreenWidget.include({
	/** Remove the step discount is applied for it while order validation **/
	finalize_validation: function() {
        var self = this;
        var order = this.pos.get_order();
        var step_discount;
		var lines  = this.pos.get_order().get_orderlines();
		for (var i = 0; i < lines.length; i++) {	
			step_discount = lines[i].step_discount;	
		}
		if(step_discount){	
			var row=$('#additional_discounts tr').length; 
			for(var i = 1; i <= row; i++) // by default only 3 rows
			 {		
				var select = document.getElementById('select'+i);
				
				for(var j=1; j < select.options.length ; j++)
				{					
					var lines  = this.pos.get_order().get_orderlines();
					select.selectedIndex = '';		
				}
			 }	
		}
		var self = this;
        this._super();
        
    },
	});
 
	
	models.load_models([
     	   {
     	        model:  'skit.step.discount',
     	        fields: ['id', 'name', 'discount_percentage', 'product_id'],	
     	        loaded: function(self, step_discount){	        	
     	        	self.step_discount = step_discount;	             	  
     	        	var step_discount_name = {};
     		        for(var i = 0, len = step_discount.length; i < len; i++){
     		        	step_discount_name[step_discount[i].name] = step_discount[i];	
     		        	if (i==0)
     		        		self.step_discount_product_id=step_discount[i].product_id;
     		        }
     		        self.step_discount_name = step_discount_name;     		        
     	        },
     	   },	             	  
	 ]);
	
	var StepDiscountButtonPopupWidget = PopupWidget.extend({
	    template: 'StepDiscountButtonPopupWidget',
	});
    gui.define_popup({name:'stepdiscount', widget: StepDiscountButtonPopupWidget});
    

	var _super = models.Order;
	models.Order = models.Order.extend({
		init: function(parent,options){
			 this.step_discount_arr    = [];
	        
	    },
		export_for_printing: function(){
	        var json = _super.prototype.export_for_printing.apply(this,arguments);  
	        json.step_discount_arr= this.get_step_discount_arr();
	        return json;
	    },
	    export_as_JSON: function(){
	        var json = _super.prototype.export_as_JSON.apply(this,arguments);       
	        json.step_discount_arr= this.get_step_discount_arr();
	        return json;
	    },
	    get_step_discount_arr: function(){
	        return this.step_discount_arr;
	    },
	    set_step_discount_arr: function(discount_arr) {
	        this.discount_arr = [];
	        this.step_discount_arr=discount_arr;
	        this.trigger('change');
	    },
	    init_from_JSON: function(json){
	    	_super.prototype.init_from_JSON.apply(this,arguments);	        
	        this.set_step_discount_arr(json.step_discount_arr);
	    },

	    /**calculate_step_discount_order amount on change on any line qty/price**/
	    calculate_step_discount_order:function (discount_arr){	    	
	    	var Total = this.get_total_without_tax(); 
	    	var grand_total = Total;
	    	var discount_product=0;
	    	var total_discount_order = 0;
	    	var discount_product_line = undefined;
	    	for(var i=0; i<discount_arr.length;i++){
	    		var discount_value = discount_arr[i];
	    		if(i==0){
	    			var stline = this.get_step_discount_line(discount_value.product_id[0]);
	    			if(stline!=undefined)
	    			{discount_product_line=stline;
	    			grand_total = grand_total-stline.get_unit_price();}
	    		}
		    	var discount_percentage = discount_value.discount_percentage
	        	var total_discount = (discount_percentage * grand_total)/ 100;
		    	total_discount_order=total_discount_order+total_discount;
	        	grand_total = grand_total - total_discount;		       
	        	discount_product = discount_value.product_id[0];
	    	}
	    	if(discount_product_line!=undefined){
	    		discount_product_line.set_unit_price(-(total_discount_order));
	    	}	    	
	    	return true;
	    },
	    get_step_discount: function(row, append_discount_val) {					
	    	var Total = this.get_total_without_tax(); 	    	
	    	var grand_total = Total;
	    	var selected_step_discount =[];
	    	var step_discounts = this.pos.step_discount_name;	    	
	    	for(var i=1; i<=row;i++){
	    		var select=document.getElementById('select'+i);	    		
	    		if(select!=null && select.value != ""){	    			
	    			var selectedText = select.options[select.selectedIndex].innerHTML;	    			
	    			var selectedTrim  = selectedText.trim();	    			
		    		var discount_value = step_discounts[selectedTrim];		    		
		    		selected_step_discount.push(discount_value);
	    			if(discount_value != undefined){
	    				var discount_percentage = discount_value.discount_percentage
			        	var total_discount = (discount_percentage * grand_total)/ 100;
			        	grand_total = grand_total - total_discount;		       
			        	var discount_product = discount_value.product_id[0];
	    			}		        	
	    		}	    	
	    	}
	    	if(discount_product == undefined){
	    		for(var j=4; j<=50;j++){		    		
		    		var select=document.getElementById('select'+j);	
					if (select!=null && select) 
					{
						for (var dd = 0; dd <= append_discount_val.length; dd++)
						{
							var selectedTrim = select.options[select.selectedIndex].value// append_discount_val[dd];
							if (selectedTrim != undefined)
							{
								var discount_value = step_discounts[selectedTrim];
								if (discount_value != undefined) 
								{
									select.options[select.selectedIndex].setAttribute('value',selectedTrim)
									selected_step_discount.push(discount_value);
									var discount_percentage = discount_value.discount_percentage
									var total_discount = (discount_percentage * grand_total) / 100;
									grand_total = grand_total- total_discount;
									var discount_product = discount_value.product_id[0];
									}
								}
							}
						}    		
		    	}
	    	}    	
	    	return {GrandTotal: grand_total, DiscountProduct: discount_product,selected_step_discount:selected_step_discount};
	    },  	    
	
	    remove_orderline: function( line ){
	        this.assert_editable();
	       // var product = line.get_product();
	        if(line.step_discount!=undefined){	        	
	    		this.step_discount_arr=[];
	    		this.step_discount=undefined;
	    	}
	        this.orderlines.remove(line);
	        this.select_orderline(this.get_last_orderline());
	    },
	    get_step_discount_line: function(product_id){	    	
	    	var lines = this.get_orderlines();
			   for (var i = 0; i < lines.length; i++) 
			   { 
	             if (lines[i].get_product().id  == product_id) 
	             {	                 
	                    return lines[i]; 
	             }
			   }
	    },
	    
		step_discount_product: function(product, step_discount_val, select_val, select_column){	
			this.add_product(product, {		
				price: -step_discount_val,
				step_discount: true,			
			});
		},	
		
		
		/**Add step discount in order line**/
		add_product : function(product, options) {
					var self = this;
					_super.prototype.add_product.apply(this,arguments);
					if (options)
					{
						var line = this.get_last_orderline();
						if (options.step_discount !== undefined) 
						{
							line.set_step_discount(options.step_discount);
						}
						this.orderlines.add(line);
					 }
		},
	
	});
	
	var _super_orderline = models.Orderline;
	models.Orderline = models.Orderline.extend({ 		
	    compute_all: function(taxes, price_unit, quantity, currency_rounding, no_map_tax) {
	        var self = this;
	        var list_taxes = [];
	        var currency_rounding_bak = currency_rounding;
	        if (this.pos.company.tax_calculation_rounding_method == "round_globally"){
	           currency_rounding = currency_rounding * 0.00001;
	        }
	        var total_excluded = round_pr(price_unit * quantity, currency_rounding);
	        var total_included = total_excluded;
	        var base = total_excluded;
	        var order = this.pos.get_order();
	        if (order!=null && order.step_discount_arr!=undefined)
	        {	
	        	var step_discount_object=order.step_discount_arr;
		        for(var k=0; k<step_discount_object.length;k++)
		        	{	        	
		        		var percentage = step_discount_object[k].discount_percentage;		        		
		        		var discount_amount= (base*percentage)/100;
		        		base = base-discount_amount;
		           
		        	}	
	        }
	     
	        _(taxes).each(function(tax) {
	            if (!no_map_tax){
	                tax = self._map_tax_fiscal_position(tax);
	            }
	            if (!tax){
	                return;
	            }
	            if (tax.amount_type === 'group'){	            	
	                var ret = self.compute_all(tax.children_tax_ids, price_unit, quantity, currency_rounding);
	                total_excluded = ret.total_excluded;
	                base = ret.total_excluded;
	                total_included = ret.total_included;
	                list_taxes = list_taxes.concat(ret.taxes);
	            }
	            else {
	                var tax_amount = self._compute_all(tax, base, quantity);
	                tax_amount = round_pr(tax_amount, currency_rounding);	              
	                if (tax_amount){
	                    if (tax.price_include) {
	                        total_excluded -= tax_amount;
	                        base -= tax_amount;
	                    }
	                    else {
	                        total_included += tax_amount;
	                    }
	                    if (tax.include_base_amount) {
	                        base += tax_amount;
	                    }
	                    var data = {
	                        id: tax.id,
	                        amount: tax_amount,
	                        name: tax.name,
	                    };
	                    list_taxes.push(data);
	                }
	            }
	        });
	        return {
	            taxes: list_taxes,
	            total_excluded: round_pr(total_excluded, currency_rounding_bak),
	            total_included: round_pr(total_included, currency_rounding_bak)
	        };
	    },
	    set_step_discount: function(step_discount){
	        this.step_discount = step_discount;
	        this.trigger('change',this);
	    },
	    is_step_discount: function(){	    
	        return this.step_discount;
	    },	    
	   
	    clone: function(){
	        var orderline = _super_orderline.clone.call(this); 
	        orderline.step_discount = this.is_step_discount();	
	       
	        var json = self.export_as_JSON(); 
	        return orderline;
	    },
	    
	    export_for_printing: function(){
	        var json = _super_orderline.prototype.export_for_printing.apply(this,arguments);
	        json.step_discount = this.is_step_discount();    
	       
	        return json;
	    },
	    export_as_JSON: function(){
	        var json = _super_orderline.prototype.export_as_JSON.apply(this,arguments);
	        json.step_discount = this.is_step_discount();  
	        
	        return json;
	    },
	    
	    init_from_JSON: function(json){
	        _super_orderline.prototype.init_from_JSON.apply(this,arguments);
	        this.set_step_discount(json.step_discount);  
	       
	    },
	});
	
	var StepDiscountButton = screens.ActionButtonWidget.extend({
		template : 'StepDiscountButton',		
		button_click : function() {
			var self = this;
			var is_step_discount_available = this.pos.step_discount_product_id;
			if (is_step_discount_available!=undefined)
				{   
				var product =this.pos.db.get_product_by_id(is_step_discount_available[0]);	
				/**Check product exist in POS**/
				if (product!=undefined)
				{  
					var order =this.pos.get_order();
					var cust = order.get_client();
					if (cust==null){
						return this.pos.gui.show_popup('alert',{
		                     'title': _t('Please select the Customer'),
		                     'body': _t('You need to select the customer before apply step discount.'),
		                 });				 
					}
					var order =this.pos.get_order();
					var row=$('#additional_discounts tr').length; 			
					var step_discounts = [];
					var discounts = []; //new Array();
					var order = this.pos.get_order();
		    	    var orderlines = this.pos.get_order().get_orderlines(); // Get orderline details    	
		    	    
					for(var i=1;i<=row;i++)
					{
						var select=document.getElementById('select'+i);			
						if(select.value != ""){
							var selectedoption = select.options[select.selectedIndex].innerHTML.trim();
						    discounts[i]=selectedoption;
							selectedoption++;
						}				
					}   	 
					
					var step_discounts = this.pos.step_discount;
					for(var i=0;i<step_discounts.length;i++) 
			     	{					 
			     		var step_discount = step_discounts[i];	     		
			     		step_discount[i] = [step_discount.id, step_discount.name];
			     	}
					 
					 if(this.pos.get_order().get_orderlines().length == 0){
						 this.gui.show_popup('alert', {
								'title' : 'Please select the Product',
								'body' : 'You need to select a Product before using Discount',
								'confirm' : function(value) {		
								}
							}) 
					 }else{					 			 
						
						 var store_more_discounts = '';
						 var more_discounts = [];
						 var append_discount_val = [];
						 var selectedValue;				 
						 var total_rows = $('#additional_discounts tr').length;	                	
		            	 for (var l = 4; l <= total_rows; l++) 
		            	 {
		            		 var selects=document.getElementById('select'+l);
							 if(selects){
								 if(selects.value){						
									 var selectedValue = selects.value;														 
									 var options = "";
									 var option = "";
									 step_discounts.forEach(function(val){
										 option = '<option value=""></option>'
									     options += '<option value="'+val.name+'" >'+val.name+'</option>'	// get step discounts in dropdown
								     })							 
									 store_more_discounts = 
											 '<tr style="background: #e6e6e6">\n'+
											 '	<td style="padding: 0px 8px;padding-left:14px;">\n'+
											 '		<span id="span_discounts" class="input-group-addon">Discount '+ l +': </span>\n'+
											 '	</td>\n'+
											 '	<td style="padding-left:0px;">\n'+
											 '<select id="select'+ l +'" class="discounts_value" style="font-size:16px; width: 290px;height:40px;border-radius:4px;margin-left:7px;">' + option + options + '</select>\n'+
											 '	</td>\n'+
				 							 '</tr>';
									 more_discounts.push(store_more_discounts);							 
									 $("#select"+l).val(selectedValue);		
									 $('.packlot-lines #select'+l).find("option[value='"+selectedValue+"']").attr('selected','selected');
									 append_discount_val.push(selectedValue)
								}
							}
						
		            	 }
						
						this.gui.show_popup('stepdiscount',{
			                 'title': 'Step Discount',
			                 'body': 'Step Discount.',
			                 'step_discount': step_discount,
			                 'selected_step_discount':order.step_discount_arr,
			                 confirm: function(){	                	
			                	  var step_discount = true;
			             	      for (var i = 0; i < orderlines.length; i++) 
			             	      {	
			            				var orderline = orderlines[i];	
			            				 if(orderline.step_discount == true){
			            					 	/*Remove previous step discount product and apply current discount value*/
			            				   		this.pos.get_order().remove_orderline(orderline); 
		
			            				 }	            			
			             	      }
			             	     var result = order.get_step_discount(row, append_discount_val);
			             	     /*set step discount values in order*/
			             	     order.set_step_discount_arr(result.selected_step_discount);	             	    
			                	 var step_discount_val = order.get_total_without_tax() - result.GrandTotal;
			                	 var discount_product = result.DiscountProduct;	               
			                	 var select_val = [];
			                	 var select_column = [];
			                	 var discount_val;
			                	 var total_rows = $('#additional_discounts tr').length;	                	
			                	 for (var k = 4; k <= total_rows; k++) 
			                	 {
			                		 var selects = document.getElementById('select'+k);
			                		 if(select!=null && selects){	
			                			 var selectedString = selects.options[selects.selectedIndex].value;		
				     	    			 if(selectedString != ""){				  			    	 			     	    			 
					     	    			 $("#select"+k).val(selectedString);
					     	    			 $('.packlot-lines #select'+k).find("option[value='"+selectedString+"']").attr('selected','selected');
							  			     discount_val = selectedString;
					     	    		     var discount_column = k;
					     	    		     select_val.push(discount_val);
					     	    		     select_column.push(discount_column);
				     	    			 }
			                		 }else{
				     	    			$("#select"+k).val('');
				     	    		 }
			                	 }	                	 
			                	// To add product in orderline
			 		    		 if (discount_product){
			 		        	    var product_id = discount_product;
			 		        	    var product = this.pos.db.get_product_by_id(product_id);	 		        	
			 		        	    order.step_discount_product(product, step_discount_val, select_val, select_column);
			 		    		 }
			                  },				
				   	    });
						
						// To append step discount from 4th column inside step discount popup
						for (var n = 0; n < more_discounts.length; n++)
						{
							$('.packlot-lines table').append(more_discounts[n]);
						}
						// If discounts column value is reselected use on change
					   var total_rows = $('#additional_discounts tr').length;
		           	   for (var k = 4; k <= total_rows; k++) 
		           	   {
							var selectedValue = "";				
							var selects = document.getElementById('select'+k);					
							 $('.packlot-lines #select'+k).on('change', function(e) {						 					 
								 var selectedText = $(this).find("option:selected").text();
								 var row_id = $(e.currentTarget).attr('id');						 
								 selectedValue = $(this).val();
								 if(selectedText != ""){
									   $("#"+row_id).val(selectedValue);
								 }else{
									  $("#"+row_id).val("");
								 }					    
					        });					
		           	   }					
						// Get recent onchange value from orderline and set value				
						for (var i = 0; i < orderlines.length; i++)
						{
							if(orderlines[i].step_discount == true){						
								var discount_value = orderlines[i].discount_value;
								var discount_column = orderlines[i].discount_column;
								if(discount_value != undefined){
									for (var j=0; j <= discount_value.length; j++)
									{
										var disc_val = discount_value[j];									
										if(disc_val != undefined){
											for (var k=0; k <= discount_column.length; k++)
											{
												var disc_col = discount_column[j];
												if(disc_col != undefined){
													var total_rows = $('#additional_discounts tr').length;
										           	for (var sr = 4; sr <= total_rows; sr++) 
										           	{
														if(disc_col == sr){	
															var selects = document.getElementById('select'+sr);												
															$("#select"+sr).val(disc_val);													
															$('.packlot-lines #select'+sr).find("option[value='"+disc_val+"']").attr('selected','selected');
														}											   
										           	}												
												}
											}
										}
									}
								}
							}
						}				
					 }		 
					 
					/* To store the previous selected value in discount button */
					 for(var i = 1; i <= row; i++)
					 {			
						var select = document.getElementById('select'+i);				
						if(select!=null)
						{
							for(var j=1; j < select.options.length ; j++)
							{					
							 if(select.options[j].innerText.trim() == discounts[i])
							   {
								   select.selectedIndex = j;						
							   }							
							}
						}
					 }			 
					 
					 var order = this.pos.get_order();
					 var lines = order.get_orderlines();
					 var pos_db = this.pos.db;
					 
					 $("#add_discounts").click(function () {
						 for (var i = 0; i < lines.length; i++)
						 {
						     if(lines[i].step_discount == true){
							     var discount_value = lines[i].discount_value;
							     var discount_column = lines[i].discount_column;
							 }
						 }
						 var table_rows = $('#additional_discounts tr').length;
						 row = table_rows+1;				
						 var options = "";
						 var option = "";
						 step_discounts.forEach(function(val){
							 option = '<option value=""></option>'
							 options += '<option>'+val.name+'</option>'		// get step discounts in dropdown
						 })	
						 
						 // each time append options in new discount column				 
						 $("#additional_discounts").append('\n'+
								 '<tr style="background: #e6e6e6">\n'+
								 '	<td style="padding: 0px 8px;padding-left:14px;">\n'+
								 '		<span id="span_discounts" class="input-group-addon">Discount '+ row +': </span>\n'+
								 '	</td>\n'+
								 '	<td style="padding-left:0px;">\n'+
								 '		<select id="select'+ row +'" class="discounts_value" style="font-size:16px; width: 290px;height:40px;border-radius:4px;margin-left:7px;">' + option + options + '</select>\n'+
								 '	</td>\n'+
								 '</tr>')
						 var selects = document.getElementById('select'+row);
						 if(selects){					
							 $('.packlot-lines #select'+row).on('change', function(e) {
								 var tr = $(e.currentTarget).closest('tr');
								 var row_id = $(e.currentTarget).attr('id');
								 var selectedText = tr.find("option:selected").text();						 
								 var selectedValue = $(this).val();
								 if (selectedText != ""){
									   $("#"+row_id).val(selectedValue);
									   $('.packlot-lines #'+row_id).find("option[value='"+selectedValue+"']").attr('selected','selected');					           
								 }else{
									 $("#"+row_id).val("");
								 }					    			               
					        });												
						}				
					});
					 }
					else{
						this.pos.gui.show_popup('alert',{
			                'title': 'Error',
			                'body': 'Please ensure "Step discount" product is checked with "Available in Point of sale"'
			                	+'\n and  atleast one record should exists in "Step Discount" screen.',		                	
			                
						});
					}
				}
			else{
				
				this.pos.gui.show_popup('alert',{
	                'title': 'Error',
	                'body': 'Please ensure "Step discount" product is checked with "Available in Point of sale"'
	                		+'\n and  atleast one record should exists in "Step Discount" screen.',
	               
				});
			}
		},		
	});
	
	screens.define_action_button({
		'name' : 'StepDiscount',		
		'widget' : StepDiscountButton,
	});
	

});