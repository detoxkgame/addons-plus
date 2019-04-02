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
        'change input.date_from': 'change_date',
        'change input.date_to': 'change_date',

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
    	var fdate;
    	var tdate;
    	fdate = $(event.currentTarget).closest('div').find('input.date_from').val()
    	tdate = $(event.currentTarget).closest('div').find('input.date_to').val()
    	var $id = $(event.currentTarget).closest('div').find('input.date_from').attr('id').replace('from-', '');
    	var categ_id = $("#kpi-"+$id).closest('div').find('div.kpi_reports').attr('id');//$("#kpi_table"+$id).find('tbody tr').attr('id');
    	if(fdate && tdate){
    		self._rpc({
                model: 'kpi.history',
                method: 'onchange_date',
                args: [0, fdate, tdate, categ_id],
            })
            .then(function(val) {
            	var table = $("#kpi_table"+$id).DataTable();
            	table.destroy();
            	$("#kpi_table"+$id).empty();
            	var $th = []
            	var $td = []
            	for(var i = 0; i < val['all_dates'].length; i++) { 
            				$th.push('<th>'+val['all_dates'][i].date+'</th>')
            			}
            	for(var j = 0; j < val['history'].length; j++) {
            		var $tds = [];
            		$tds = '<tr>'+'<td>'+val['history'][j].name+'</td>'+'<td>'+val['history'][j].periodicity+'</td>'+'<td>Actual</td>';
            		for(var k = 0; k < val['all_values'].length; k++) {
	            		if(val['history'][j].kpi_id == val['all_values'][k].kpi_id){
	                			$tds = $tds +'<td style="background-color:'+val['all_values'][k].color+'; color:#ffffff">'+val['all_values'][k].value+'</td>';
	            		}
	            		
	            		}
	            		$tds = $tds +'</tr>'+
	            		'<tr>'+
	            		'<td style="border-color: rgb(251, 250, 250); background: rgb(251, 250, 250);"></td>'+
	            		'<td style="border-color: rgb(251, 250, 250); background: rgb(251, 250, 250);"></td>'+
	            		'<td>Target</td>';
	            		
	            		for(var l = 0; l < val['all_values'].length; l++) {
		            		if(val['history'][j].kpi_id == val['all_values'][l].kpi_id){
		                			$tds = $tds +'<td>'+val['all_values'][l].target_value+'</td>';
		            		}
		            		
		            		}
	            		$tds = $tds + '</tr>';
	            		$td.push($tds)
    			}
            	$("#kpi_table"+$id).append('<thead class="table-thead"><th>KPI Name</th>'+
            			'<th>Frequency</th>'+
            			'<th>Measure</th>'+
            			$th+
            			'</thead>'+
            			'<tbody>'+
            				$td+
            			'</tbody>');
            	var $tab = $("#kpi_table"+$id).DataTable({
            		sScrollX: true,
        	        sScrollXInner: "100%",
        	        bScrollCollapse: true,
        	        bSort: false,
        	        bPaginate: true, 
        	        pageLength: 10,
            	});
            });
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
    
    render_table: function(result, id){
    	var self = this;
   	 	var histories = result;
	   	var contents = $('.kpi_report'+id);
	   	if(contents!=null)
		{	
	   		var order_html = QWeb.render('KPIReportDetailsScreenWidget',{widget: self,lines:result});
			contents.innerHTML=order_html;
		}
   },
    
    render_order: function(result){
    	var self = this;
   	 	var histories = result;
   	 	
	   	 $(document).on('focus', '#sandbox-container .input-daterange',function(){
	         $(this).datepicker({
	        	 todayHighlight: true,
	         })
	     });
	   	var contents = this.$el[0].querySelector('.dl_otable');
	   	if(contents!=null)
		{	
	   		var order_html = QWeb.render('KPIReportDetailsScreenWidget',{widget: self,lines:result});
			contents.innerHTML=order_html;
		}
	   	var $table = self.$el.find('table.kpi_table');
	   	$table.each(function() {
	   		var $id = $(this).attr('id');
	   		var $kpi_table = $(this);
	   		$('#'+$id).DataTable({
		        sScrollX: true,
		        sScrollXInner: "100%",
		        bScrollCollapse: true,
		        bSort: false,
		        bPaginate: true, 
		        pageLength: 10,
			});
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
    	var categ;
    	self._rpc({
            model: 'kpi.history',
            method: 'get_history',
            args: [0],
        })
        .then(function(val) {
        	self.pos.gui.show_screen('kpireport',{dldata: val},'refresh');   
        });
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