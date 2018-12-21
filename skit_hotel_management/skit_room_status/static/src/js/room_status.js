odoo.define('skit_room_status.roomstatus', function (require) {
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

var RoomstatusReportScreenWidget = screens.ScreenWidget.extend({
	template: 'RoomstatusReportScreenWidget',
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
                model: 'product.template',
                method: 'get_roomstatus',
                args: [0, from_date, to_date],
            })
            .then(function(val) {
            	//alert(val);
            	console.log(JSON.stringify(val));
            	var table = $("#rs_table").DataTable()
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
    	 $('.rooomstatus').click(function(event){  
    		// alert("proceed")
       	 self.chrome.widget.order_selector.roomstatus_report_handler(event,$(this)); 
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
	   		//alert("testkkdk")
	   		var order_html = QWeb.render('RoomStatusReportDetailsScreenWidget',{widget: self,lines:result});
			contents.innerHTML=order_html;
		}
	   	//var rline_html = QWeb.render('KPIReportScreenWidget',{widget: self, lines:result});
	   	var table = self.$el.find('table#rs_table').DataTable({
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
gui.define_screen({name:'roomstatusreport', widget: RoomstatusReportScreenWidget});

chrome.OrderSelectorWidget.include({
    template: 'OrderSelectorWidget',
    init: function(parent, options) {
        this._super(parent, options);
    }, 
    roomstatus_report_handler: function(event, $el, from_date, to_date) {
    	var self = this;
    	//alert("kjhdkfgh");
    	var order = self.pos.get_order();
    	self._rpc({
        model: 'product.template',
        method: 'get_roomstatus',
        args: [0, from_date, to_date],
    })
    .then(function(val) {
    	self.pos.gui.show_screen('roomstatusreport',{dldata: val},'refresh');   
    });
    	
        	//self.pos.gui.show_screen('roomstatusreport');   
       
    		
    },
    renderElement: function(){
    	//alert("jdfkjds");
    	var self = this;
        this._super();
        /**Button click **/
        this.$('.rooomstatus').click(function(){
        	//alert("test")
        	self.roomstatus_report_handler();
        });
    },
  });
});