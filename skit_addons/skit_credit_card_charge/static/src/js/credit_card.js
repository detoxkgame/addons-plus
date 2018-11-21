odoo.define('skit_credit_card_charge.credit_card', function(require) {
	"use strict";		
var screens = require('point_of_sale.screens');
var OrderWidget = screens.OrderWidget;
var gui = require('point_of_sale.gui');
var PopupWidget = require('point_of_sale.popups');
var models = require('point_of_sale.models');
var utils = require('web.utils');
var time = require('web.time');
var round_pr = utils.round_precision;
var core = require('web.core');
var _t = core._t;
var round_di = utils.round_decimals;
var round_pr = utils.round_precision;
var models = require('point_of_sale.models');
var field_utils = require('web.field_utils');

/**Load credit card journal**/
var _super_posmodel = models.PosModel.prototype;
models.PosModel = models.PosModel.extend({

	initialize : function(session, attributes) {
		var account_model = _.find(this.models, function(model) {
			return model.model === 'account.journal';
		});
		account_model.fields.push('credit_card_charge', 'code', 'name');

		return _super_posmodel.initialize.call(this, session, attributes);
	},

});

/**add credit_card_charge_amount in paymentline**/

models.Paymentline = models.Paymentline.extend({
	initialize: function(attributes, options) {
        this.pos = options.pos;
        this.order = options.order;
        this.amount = 0;
        this.line_paid_amount = 0;
        this.credit_card_charge_amount=0;
        this.selected = false;
        if (options.json) {
            this.init_from_JSON(options.json);
            return;
        }
        this.cashregister = options.cashregister;
        this.name = this.cashregister.journal_id[1];
    },
    init_from_JSON: function(json){
    	this.line_paid_amount = json.line_paid_amount;
    	this.credit_card_charge_amount = json.credit_card_charge_amount;	    	
        this.amount = json.amount;
        this.cashregister = this.pos.cashregisters_by_id[json.statement_id];
        this.name = this.cashregister.journal_id[1];
    },
    get_name: function(){
        return this.cashregister.journal_id[1];
    },
    
    get_line_paid_amount:function(){
    	return this.line_paid_amount;
    },
    set_line_paid_amount:function(value){
    	this.line_paid_amount = round_di(parseFloat(value) || 0, this.pos.dp['Product Price']);
    	this.trigger('change',this);
    },
    get_credit_card_charge_amount:function(){	    	
    	return this.credit_card_charge_amount;
    },
    get_credit_card_paid_amount:function(paymentline){
    	var amt= paymentline.line_paid_amount-paymentline.credit_card_charge_amount
    	return amt;
    	
    },
    
    set_credit_card_charge_amount:function(value){
    	this.credit_card_charge_amount = value;
    	this.trigger('change',this);
    },
   
    export_as_JSON: function(){
        return {
            name: time.datetime_to_str(new Date()),
            statement_id: this.cashregister.id,
            account_id: this.cashregister.account_id[0],
            journal_id: this.cashregister.journal_id[0],
            amount: this.get_amount(),
            line_paid_amount:  this.get_line_paid_amount(),
            credit_card_charge_amount:  this.get_credit_card_charge_amount(),
            
        };
    },
	
});


var _super_order = models.Order;
var card_charge = 0;
var value = 0;
models.Order = models.Order.extend({
	
	get_credit_card_charge : function(val) {
		var cash = this.pos.cashregisters;
		var val = val;
		if (val != undefined) {
			if (val.journal.credit_card_charge > 0) {
				if (val.journal.code == 'CC' || val.journal.code == 'cc') {
					card_charge = val.journal.credit_card_charge;
				}

			} else {
					card_charge += 0;
			}

		}
		return card_charge;
	},

	get_credit_card_value : function() {
		var value=0;
		var total = this.get_total_without_tax() + this.get_total_tax();			
		var lines = this.get_paymentlines();
		for (var i = 0; i < lines.length; i++) {
			var name = lines[i].name;
			
			if(((name.indexOf("Credit"))||(name.indexOf("Credit")))!= -1){
				value+=lines[i].credit_card_charge_amount;				
				
			}				
		}		
		return value;
	},
	
	get_credit_card_update : function() {
		var credit_charge = card_charge;
		if (credit_charge != undefined) {
			var subtotal = this.get_total_without_tax()
					+ this.get_total_tax();
			return (subtotal * credit_charge) / 100;
		} else {
			return 0;
		}
	},
	
	get_val: function(){
		var total = this.get_total_without_tax() + this.get_total_tax();
		var lines = this.get_paymentlines();
		var credit_val = 0;
		if(lines.length > 0){
			var other_amount = 0;
			var credit_card_charge = 0;
			for (var i = 0; i < lines.length; i++) {
				var name = lines[i].name;					
				if(((name.indexOf("Credit"))||(name.indexOf("Credit")))!= -1){						
	            	credit_val+=lines[i].credit_card_charge_amount;			
				}
		}
			if(credit_val > 0){					
				return (total + credit_val);
			}
		}
		return total;
	},

	get_total_with_tax : function() {
		var total = this.get_total_without_tax() + this.get_total_tax();
		return this.get_val();
	},

	add_paymentline : function(cashregister) {
		this.get_credit_card_charge(cashregister);
		this.assert_editable();
		var newPaymentline = new models.Paymentline({}, {
			order : this,
			cashregister : cashregister,
			pos : this.pos
		});
		if (cashregister.journal.type !== 'cash'
				|| this.pos.config.iface_precompute_cash) {
			var name = newPaymentline.name
			if(((name.indexOf("Credit"))||(name.indexOf("Credit")))!= -1){
				var total = this.get_total_without_tax() + this.get_total_tax();
				var credit_amt = this.get_due();	// Credit
				var credit_charge = (credit_amt * card_charge) / 100;
				newPaymentline.set_amount(Math.max(this.get_due(), 0));
				var amt=Math.max(this.get_due() + credit_charge, 0);
				
				newPaymentline.set_line_paid_amount(Math.max(this.get_due() + credit_charge, 0));
			}
			else{
				newPaymentline.set_amount(Math.max(this.get_due(), 0));
				newPaymentline.set_line_paid_amount(Math.max(this.get_due(), 0));
			}
		}
		this.paymentlines.add(newPaymentline);
		this.select_paymentline(newPaymentline);
	},

});

screens.OrderWidget.include({
	update_summary: function(){
        this._super();
        var order = this.pos.get_order();
        if (!order.get_orderlines().length) {
            return;
        }
        var card_charge = order ? order.get_credit_card_value() : 0; // commented to update the tax and total
        var charge     = order ? order.get_total_with_tax() : 0;
        var total = charge - card_charge;
        var taxes     = order ? total - order.get_total_without_tax() : 0;
        this.el.querySelector('.summary .total > .value').textContent = this.format_currency(total);
        this.el.querySelector('.summary .total .subentry .value').textContent = this.format_currency(taxes);
    },
});

screens.PaymentScreenWidget.include({
	
	    payment_input: function(input) {
	        var newbuf = this.gui.numpad_input(this.inputbuffer, input, {'firstinput': this.firstinput});

	        this.firstinput = (newbuf.length === 0);

	        // popup block inputs to prevent sneak editing. 
	        if (this.gui.has_popup()) {
	            return;
	        }
	        
	        if (newbuf !== this.inputbuffer) {
	            this.inputbuffer = newbuf;
	            var order = this.pos.get_order();
	            if (order.selected_paymentline) {
	                var amount = this.inputbuffer;

	                if (this.inputbuffer !== "-") {
	                    amount = field_utils.parse.float(this.inputbuffer);
	                }

	                order.selected_paymentline.set_amount(amount);
	                order.selected_paymentline.set_line_paid_amount(amount);
	                var name = order.selected_paymentline.name;
	                if(name.indexOf('Credit')>-1)
	                {	var credit_per= order.get_credit_card_charge(this.pos.cashregisters[0]);
	                	var credit_amt = amount; //order.get_due();	// Credit
						var credit_charge = (credit_amt * credit_per) / 100;
	                	order.selected_paymentline.set_line_paid_amount(amount+credit_charge);	                	
	                	
	                }
	                this.order_changes();
	                this.render_paymentlines();
	                this.$('.paymentline.selected .edit').text(this.format_currency_no_symbol(amount));
	            }
	        }
	    },
	    order_is_valid: function(force_validation) {
	        var self = this;
	        this._super();
	        var order = this.pos.get_order(); 
	        var plines = order.get_paymentlines();	      
	        for (var i = 0; i < plines.length; i++) {
	            if (plines[i].get_type() === 'bank' && plines[i].get_amount() < 0) {
	                this.gui.show_popup('error',{
	                    'message': _t('Negative Bank Payment'),
	                    'comment': _t('You cannot have a negative amount in a Bank payment. Use a cash payment method to return money to the customer.'),
	                });
	                return false;
	            }
	            var name = plines[i].name;
	            var totalcredit_amt = 0;
	            if(name.indexOf('Credit')>-1){	            	
	            	var credit_amout=plines[i].line_paid_amount;
	            	var amt=plines[i].amount;
	            	var diff = credit_amout-amt;
	            	if(diff!=0)
	            		plines[i].set_credit_card_charge_amount(diff);
	            	plines[i].set_amount(credit_amout); 
	            	totalcredit_amt+=diff;
	            }
	          }
	         return true;
	    },
});

var CreditCardButton = screens.ActionButtonWidget.extend({
	template : 'CreditCardButton',
	button_click : function() {
		var self = this;
		var selectedOrder = self.pos.get_order();
		var production;
		/*
		 * On click credit card payment button, have to popup a
		 * credit card charge details in pos 
		 */
		var card_charge = selectedOrder ? selectedOrder.get_credit_card_value() : 0;
		var charge     = selectedOrder ? selectedOrder.get_total_with_tax() : 0;
        var total = charge - card_charge;
		var cash = this.pos.cashregisters;
		for (var i = 0; i < cash.length; i++) {
			var code = cash[i].journal.code;
			if (code == 'CC' || code == 'cc') {
				var card_charge = cash[i].journal.credit_card_charge;
				
			}
			
		}
		var subtotal = (total * card_charge) / 100;
		var grand_total = total + subtotal;
		var lines = selectedOrder.get_orderlines();
		for (var i = 0; i < lines.length; i++) {
			production = lines[i].production;
		}
		// Returns the current screen(product) if production present in the order line.
		if (production) {
			this.gui.show_screen('products');
		} else if (selectedOrder.get_client() != null
				&& selectedOrder.get_orderlines().length != 0) {
			self.gui.show_popup('credit', {
				'title' : 'Credit Card Payment',
				'total' : total.toFixed(2),
				'credit_charge' : subtotal.toFixed(2),
				'grand_total' : grand_total.toFixed(2),

			});
			/*
			 * On click credit card payment button, have to
			 * popup a credit card charge details in pos 
			 */
		} else {
			if(selectedOrder.get_client() == null){
				self.gui.show_popup('alert', {
					'title' : 'Select Customer',
					'body' : 'You must select a Customer to make payment',
				});
			}
			else{
			self.gui.show_popup('error', {
				'title' : 'Empty Order',
				'body' : 'You must select a product to make payment',
			});
			}
		}
	},
});
var CreditCard = PopupWidget.extend({
	template : 'CreditCard',
});
gui.define_popup({
	name : 'credit',
	widget : CreditCard
});
screens.define_action_button({
	'name' : 'creditcard',
	'widget' : CreditCardButton,
});

});