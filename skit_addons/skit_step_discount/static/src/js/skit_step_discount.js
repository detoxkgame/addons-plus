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

 /**Load the step discount model **/
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

 /**on change on qty update the step discount **/
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
            if(this.pos.step_discount_product_id!=undefined)
            {   var discount_product = this.pos.step_discount_product_id[0];
                var order_line_product = selected_order_line.get_product().id;
                if((discount_product!=order_line_product) && order.step_discount_arr!=undefined)
            		order.calculate_step_discount_order(order.step_discount_arr);
            }
    	}
	},
 });
 

 var StepDiscountButtonPopupWidget = PopupWidget.extend({
	    template: 'StepDiscountButtonPopupWidget',
	    change_values :function(action){
	    	/** hide the selected values in Step discount pop up. **/
	    	var selected = [];
	    	var order = this.pos.get_order();
	    	var $select = $("select");
	    	    $.each($select, function(index, select) {           
	    	        if (select.value !== "") { selected.push(select.value); }
	    	    }); 
	    	    /** While popup open disable the options.**/
	    	    if (action =='show'){
	    	    	var list_discount_arr = order.step_discount_arr;
	    	    	if(list_discount_arr!=undefined)
		    	    {	var discount_percentage=[];
		    	    	for(var i=0; i<list_discount_arr.length;i++)
		    	    	{
		    	    		var discount_value = list_discount_arr[i];
		    	    		discount_percentage.push(discount_value.value);
		    	    	}
		    	    	selected = selected.concat(discount_percentage);
		    	    }
	    	    }
	    	   $("option").prop("disabled", false);         
	    	   for (var index in selected) { $('option[value="'+selected[index]+'"]').prop("disabled", true); }
	    },
	    show: function(options){
	    	this._super(options);
	    	var self =this;
	    	self.change_values('show');
	    	$("select").change(function(){
	    		self.change_values('change');
	    	});
	    },
	    
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
	    		var discount_product = this.pos.step_discount_product_id[0];
	    		if(i==0){
	    			var stline = this.get_step_discount_line(discount_product);
	    			if(stline!=undefined)
	    			{
	    				discount_product_line=stline;
	    				grand_total = grand_total-stline.get_unit_price();
	    			}
	    		}
		    	var discount_percentage = discount_value.value;
	        	var total_discount = (discount_percentage * grand_total)/ 100;
		    	total_discount_order=total_discount_order+total_discount;
	        	grand_total = grand_total - total_discount;       
	        	
	    	}
	    	if(discount_product_line!=undefined){
	    		discount_product_line.set_unit_price(-(total_discount_order));
	    	}	    	
	    	return true;
	    },
	    get_step_discount: function(append_discount_val) {					
	    	var Total = this.get_total_without_tax(); 	    	
	    	var grand_total = Total;
	    	var selected_step_discount =[];
	    	var step_discounts = this.pos.step_discount_name;	
	    	var discount_product = this.pos.step_discount_product_id;
	    	for(var i=0; i<=append_discount_val.length;i++){
	    		var val=append_discount_val[i];
	    		if(val!= "" && val!=undefined){   			
		    		selected_step_discount.push(val);
	    				var discount_percentage = val.value;
			        	var total_discount = (discount_percentage * grand_total)/ 100;
			        	grand_total = grand_total - total_discount;		       
	    		}	    	
	    	}
	    	return {GrandTotal: grand_total,selected_step_discount:selected_step_discount};
	    },  	    
	
	    remove_orderline: function( line ){
	        this.assert_editable();
	        var product = line.get_product();
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
	    
	    add_step_discount_product_incart: function(product, step_discount_val){				
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
		        		var percentage = step_discount_object[k].value;		        		
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
			var self =this;
			var order =this.pos.get_order();
			var client = order.get_client();
    		if(!client){
    			this.gui.show_popup('confirm',{
    				'title': _t('Please select the Customer'),
    				'body': _t('You need to select the customer before you can proceed.'),
    				confirm: function(){
    					self.gui.show_screen('clientlist');
    				},
    			});
    			return false;
    		}
			var is_step_discount_available = this.pos.step_discount_product_id;
			if (is_step_discount_available!=undefined)
				{   
				var discount_product =this.pos.db.get_product_by_id(is_step_discount_available[0]);	
				/**Check product exist in POS**/
				if (discount_product!=undefined)
				{	
					
					var step_discounts = [];
			    	var orderlines = order.get_orderlines(); // Get orderline details    	
					 	 
					var step_discounts = this.pos.step_discount; 
					for(var i=0;i<step_discounts.length;i++) 
				    {					 
				     		var step_discount = step_discounts[i];	     		
				     		step_discount[i] = [step_discount.id, step_discount.name];
				     }
					if(order.get_orderlines().length == 0){
							 this.gui.show_popup('alert', {
									'title' : 'Please select the Product',
									'body' : 'You need to select a Product before using Discount',
									'confirm' : function(value) {		
									}
								}) 
					}else{	
							
							var selected_arrays = order.step_discount_arr;
							if(selected_arrays==undefined ||selected_arrays.length==0 ){
								selected_arrays =[];
								selected_arrays.push({'id':0,'value':0},
										{'id':0,'value':0},
										{'id':0,'value':0})
							}
							if(selected_arrays.length<=2){
								for (var ii=selected_arrays.length;ii<3;ii++)
									{selected_arrays.push({'id':0,'value':0});}
							}
							this.gui.show_popup('stepdiscount',{
				                 'title': 'Step Discount',
				                 'body': 'Step Discount.',
				                 'step_discount': step_discount,
				                 'selected_step_discount':selected_arrays,
				                 'selected_step_discount_length':selected_arrays.length,
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
				             	     var append_selected_discount_val = [];
				             	     $('#additional_discounts tr').each(function() {
				             	    	var selected_discount_value = $(this).find(".step_discount_input option:selected").val();
				             	    	var selected_id= $(this).find(".step_discount_input option:selected").attr('id');
				             	    	if(selected_discount_value!="" && selected_discount_value!=undefined)
				             	    		append_selected_discount_val.push({'id':selected_id,'value':selected_discount_value});
				             	     });
				             	     var result = order.get_step_discount(append_selected_discount_val);
				             	     /*set step discount values in order*/
				             	     order.set_step_discount_arr(result.selected_step_discount);	             	    
				                	 var step_discount_val = order.get_total_without_tax() - result.GrandTotal;					                	 
				                	// To add product in orderline
				 		    		 if (discount_product){
				 		        	    order.add_step_discount_product_incart(discount_product, step_discount_val);
				 		    		 }
				                  },				
					   	    });
							
											
						 }	
						var order = this.pos.get_order();
						 var lines = order.get_orderlines();
						 var pos_db = this.pos.db;
						 /** Click on Plus icon add new row **/
						 $("#add_discounts").click(function () {
						    		var $select = $("select");
						    	    var selected = [];  
						    	    $.each($select, function(index, select) {           
						    	        if (select.value !== "") { selected.push(select.value); }
						    	    });   
						    	    var list_discount_arr = order.step_discount_arr;
						    	    if(list_discount_arr!=undefined)
							    	{	var discount_percentage=[];
							    		for(var i=0; i<list_discount_arr.length;i++)
							    		{
							    			var discount_value = list_discount_arr[i];
							    			discount_percentage.push(discount_value.discount_percentage);
							    		}
							    		selected = selected.concat(discount_percentage);
						    	    }
							 var rowCount = $('.packlot-lines table.stepdiscounttablelist tr').length;	
							 var first_row = $('#additional_discounts tbody')
								.children('tr:first');
							 var newrow = first_row.clone(true);									
							 $(newrow).removeClass ( 'hide' );
							 $(newrow).addClass('discountrow');
							 $(newrow).find('span.label').text('Discount'+(rowCount));
							var row =rowCount;
							 $(newrow).find('select').attr("id","select"+row);
							 $(newrow).find('select.step_discount_input option').each(function(e){					
									var selected_id = parseInt($(this).val());
									if(selected_id != 0 && selected.indexOf(selected_id) > -1)
									{
										$(this).prop("disabled", true); ;					
									}
								});
							 $('#additional_discounts tbody').append(newrow);
							});
					}
					else{
						this.pos.gui.show_popup('alert',{
			                'title': 'Error',
			                'body': 'Please ensure "Step discount" product is checked with "is_step_discount_product" and "Available in Point of sale"'
			                	+'\n and  atleast one record should exists in "Step Discount" screen.',		                	
			                
						});
					}
				}
			else{
				
				this.pos.gui.show_popup('alert',{
	                'title': 'Error',
	                'body': 'Please ensure "Step discount" product is checked with "is_step_discount_product" and "Available in Point of sale"'
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