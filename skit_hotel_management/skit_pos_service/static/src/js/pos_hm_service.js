odoo.define('skit_pos_service.pos_hm_service',function(require){
    "use strict";
    
	var models = require('point_of_sale.models');
	var screens = require('point_of_sale.screens');
	var gui = require('point_of_sale.gui');
	var core = require('web.core');
	var chrome = require('point_of_sale.chrome');
	var PopupWidget = require('point_of_sale.popups');
	var Floors = require('pos_restaurant.floors');
	var _t  = core._t;
	var QWeb = core.qweb;
	
	
	var _super_posmodel = models.PosModel.prototype;
	models.PosModel = models.PosModel.extend({
	    initialize: function (session, attributes) {
	    	
	    	this.service_type_id = null;
	        /** Restaurant Table Model **/	      
	        var restaurant_table_model = _.find(this.models, function(model){
	            return model.model === 'restaurant.table';
	        });
	        restaurant_table_model.fields.push('product_id');
	      
	        return _super_posmodel.initialize.call(this, session, attributes);
	    },
	    
	    set_service: function(service){
	        this.service_type_id = service;
	        this.trigger('change',this);
	    },
	    
	    get_service: function(){
	    	return this.service_type_id;
	    }
	});
	
	models.load_models({
	    model: 'hm.service.type',
	    fields: ['name','model_id','description','sequence_no'],
	    loaded: function(self,service_types){
	        self.service_types = service_types;
	        self.service_type_by_id = {};
	        for (var i = 0; i < service_types.length; i++) {
	            self.service_type_by_id[service_types[i].id] = service_types[i];
	        }
	        // Make sure they display in the correct order
	        self.service_types = self.service_types.sort(function(a,b){ return a.sequence_no - b.sequence_no; });
	    },
	});
	
	Floors.FloorScreenWidget.include({
		init: function(parent, options) {
	        this._super(parent, options);
	        this.service_types = this.pos.service_types[0];
	    },
	    
	    click_service_button: function(event,$el){
	        var service = this.pos.service_type_by_id[$el.data('id')];
	        if (service !== this.service_types) {
	            if (this.editing) {
	                this.toggle_editing();
	            }
	            this.service_types = service;
	            this.selected_table = null;
	            this.renderElement();
	            this.check_empty_floor();
	        }
	    },
	    
	    renderElement: function(){
	    	this._super();
	        var self = this;
	        
	        this.$('.service-selector .button').click(function(event){
	            self.click_service_button(event,$(this));
	        });
	        
	        this.$('.floor-map,.floor-map .tables').click(function(event){
	            if (event.target === self.$('.floor-map')[0] ||
	                event.target === self.$('.floor-map .tables')[0]) {
	                self.deselect_tables();
	            }
	            var table = self.pos.table;
	            var service_id = $('.service-selector').find('.active').attr('data-id');
	            var service_vals = self.pos.service_type_by_id[service_id];
	            if(service_vals){
	            	self.pos.set_service(service_vals.id)
	            	if(!service_vals.model_id){
		            	self.pos.gui.show_screen('firstpage')
		            }
	            }
	            self._rpc({
        			model: 'pos.order',
        			method: 'get_customer',
        			args: [0,table.id, table.product_id[0]],
        		}).then(function(result){ 
        			self.pos.get_order().set_client(self.pos.db.get_partner_by_id(result));
        		});
	        });

	    },
		
	});
	
	/*chrome.OrderSelectorWidget.include({
	    renderElement: function(){
	        var self = this;
	        this._super();
	        if (this.pos.config.iface_floorplan) {
	            if (this.pos.get_order()) {
	                if (this.pos.table && this.pos.table.floor) {
	                	var service_id = $('.service-selector').find('.active').attr('data-id');
	                	var service_vals = this.pos.service_type_by_id[service_id];
	                	this.pos.set_service(service_vals.id)
	                   
	                }
	                this.$el.removeClass('oe_invisible');
	            } else {
	                this.$el.addClass('oe_invisible');
	            }
	        }
	    },
	});*/
	
	var _super = models.Order.prototype;
	models.Order = models.Order.extend({
		
		initialize: function() {
			_super.initialize.apply(this,arguments);
	        this.to_invoice =  true;
	    },
		
		export_as_JSON: function() {
	        var json = _super.export_as_JSON.apply(this,arguments);
	        json.service_type_id = this.pos.get_service();
	        return json;
	    },
	  });
	
	screens.ActionpadWidget.include({
		renderElement: function() {
	        var self = this;
	        this._super();
	        this.$('.pay').click(function(){
	            var order = self.pos.get_order();
	            var has_valid_product_lot = _.every(order.orderlines.models, function(line){
	                return line.has_valid_product_lot();
	            });
	            if(!has_valid_product_lot){
	                self.gui.show_popup('confirm',{
	                    'title': _t('Empty Serial/Lot Number'),
	                    'body':  _t('One or more product(s) required serial/lot number.'),
	                    confirm: function(){
	                    	if(!self.pos.config.is_room){
	                    		self.gui.show_screen('payment');
	                    	}
	                    	else{
	                    		self.gui.show_screen('receipt');
	                    	}
	                    },
	                });
	            }else{
	            	if(!self.pos.config.is_room){
                		self.gui.show_screen('payment');
                	}
	            	else{
	            		self.gui.show_screen('receipt');
                	}
	            }
	        });
	        this.$('.set-customer').click(function(){
	            self.gui.show_screen('clientlist');
	        });
	    }
	});
	
	screens.PaymentScreenWidget.include({
		    show: function(){
		      this._super();
		      var self = this;
		      // activate Pay Later method as default payment method
		      if(self.pos.config.is_room){
			      self._rpc({
	      			model: 'account.journal',
	      			method: 'get_paylater_journal',
	      			args: [0],
		      		}).then(function(result){ 
		      			self.click_paymentmethods(result);
		      			self.validate_order();
		      		});
		      }
		    },
		  });
	
});