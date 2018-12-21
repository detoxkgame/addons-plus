odoo.define('skit_kpi.kpi', function (require) {
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
var rpc = require('web.rpc');

var _super_posmodel = models.PosModel.prototype;

models.load_models([
          {
     		    model:  'kpi',
     	        fields: ['name','periodicity_uom'],
     	        loaded: function(self,kpi){
     	        	 self.kpi = kpi;
     	        	 var kpi_by_id = {};
     	            for(var i = 0, len = kpi.length; i < len; i++){
     	            	kpi_by_id[kpi[i].id] = kpi[i];
     	            }
     	            self.kpi_by_id = kpi_by_id;
     	        },
	      },
	      
	      {
   		    model:  'kpi.history',
   	        fields: ['kpi_id','date', 'value', 'color', 'target_value', 'periodicity'],
   	        loaded: function(self,kpi_history){
   	        	 self.kpi_history = kpi_history;
   	        	 var kpi_history_by_id = {};
   	            for(var i = 0, len = kpi_history.length; i < len; i++){
   	            	kpi_history_by_id[kpi_history[i].id] = kpi_history[i];
   	            }
   	            self.kpi_history_by_id = kpi_history_by_id;
   	        },
	      },
]);

var KPIReportScreenWidget = screens.ScreenWidget.extend({
	template: 'KPIReportScreenWidget',
	events: _.extend({}, PopupWidget.prototype.events, {
        'change .date_from': 'change_date',
        'change .date_to': 'change_date',

    }),
	
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
        	 self.gui.show_screen('firstpage');
        });   
    	
    	self.render_order(self.get_data()); 
    },
    change_date: function(event){
    	var self = this;
    	var from_date;
    	var to_date;
    	$('.date_from').each(function(){			   	 
			   from_date = $(this).val();			
		   });
    	$('.date_to').each(function(){			   	 
    		to_date = $(this).val();			
		   });
    	if(from_date && to_date){
    		self._rpc({
                model: 'kpi.history',
                method: 'get_history',
                args: [0, from_date, to_date],
            })
            .then(function(val) {
            	var table = $("#kpi_table").DataTable()
            	table.destroy();
            	self.render_order(val);    
            });
    		//self.chrome.widget.order_selector.kpi_report_handler(event,$(this), from_date, to_date);
    	}
    },
    
    renderElement: function(scrollbottom){
    	this._super();
    	var self = this;
    	 /**Floating icon action **/      
    	 $('.kpi-report-button').click(function(event){        	
       	 self.chrome.widget.order_selector.kpi_report_handler(event,$(this)); 
        	});		   
    },
    get_data: function(){
        return this.gui.get_current_screen_param('dldata');
    },
    
    render_order: function(result){
    	var self = this;
   	 	var histories = result;
	   	 $('#sandbox-container .input-daterange').datepicker({
	   		//todayBtn: "linked"
	   		todayHighlight: true
	   	});
	   	var contents = this.$el[0].querySelector('.dl_otable');
	   	if(contents!=null)
		{	
	   		var order_html = QWeb.render('KPIReportDetailsScreenWidget',{widget: self,lines:result});
			contents.innerHTML=order_html;
		}
	   	//var rline_html = QWeb.render('KPIReportScreenWidget',{widget: self, lines:result});
	   	var table = self.$el.find('table#kpi_table').DataTable({
	        sScrollX: true,
	        sScrollXInner: "100%",
	        bScrollCollapse: true,
	        bSort: false,
	        //'rowsGroup': [0],
	        //"bFilter": false,
	        bPaginate: true, 
	        pageLength: 10,
		});
   },

});
gui.define_screen({name:'kpireport', widget: KPIReportScreenWidget});

chrome.OrderSelectorWidget.include({
    template: 'OrderSelectorWidget',
    init: function(parent, options) {
        this._super(parent, options);
    }, 
    kpi_report_handler: function(event, $el, from_date, to_date) {
    	var self = this;
    	var order = self.pos.get_order();
    	var partner = order.get_client();
    	var history = self.pos.kpi_history;
    	self._rpc({
            model: 'kpi.history',
            method: 'get_history',
            args: [0, from_date, to_date],
        })
        .then(function(val) {
        	self.pos.gui.show_screen('kpireport',{dldata: val},'refresh');   
        });
    	//var list_h = self.pos.kpi_history;
    	//console.log('list:;'+JSON.stringify(list_h));
    	//alert("kpi_history"+JSON.stringify(self.pos.kpi_history_by_id))
    	//alert("kpi"+JSON.stringify(self.pos.kpi_by_id[1]))
    		
    },
    renderElement: function(){
    	var self = this;
        this._super();
        /** KPI Button click **/
        this.$('.kpi-report-button').click(function(event){
        	self.kpi_report_handler(event,$(this));
        });
    },
  });
});