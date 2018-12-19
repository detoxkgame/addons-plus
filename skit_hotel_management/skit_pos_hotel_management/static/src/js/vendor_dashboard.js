odoo.define('skit_hotel_management.vendor_dashboard', function (require) {
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


/*var VendorCategoryWidget = PosBaseWidget.extend({
    template:'VendorCategoryWidget',
    init: function(parent, options) {
        var self = this;
        this._super(parent,options);
        this.model = options.model;
    },
});*/


var VendorDashboardScreenWidget = screens.ScreenWidget.extend({
    template: 'VendorDashboardScreenWidget',
    init: function(parent, options){
        this._super(parent, options);
       
    },
    hide: function(){
        this._super();
       
        this.chrome.widget.order_selector.show();
    },
    show: function(){
        this._super();
        this.chrome.widget.order_selector.hide();
        var dashboards = this.pos.vendor_dashboard;
        var dashboard_lines = this.pos.vendor_dashboard_line;
        var parent_devotee = this.pos.db.get_dashboardline_by_dashboard(1);
        var self = this;
        var el_node = this;
        //console.log('DASH'+ JSON.stringify(dashboards));
        //console.log('DASHLine'+ JSON.stringify(dashboard_lines));
        //console.log('dfs'+ JSON.stringify(parent_devotee));
        //console.log('Len'+dashboards.length)
        this.render_list(dashboards);
        /*$('.info').first().show().animate({
            width: '40%'
          });
        $('.item').first().css({'display': 'none'});*/
        var width = 100 - (dashboards.length * 4);
        this.$('.item').click(function(){
        	$(this).css({'display': 'none'});
        	//$(".test").css({'display':'none'});
        	//$(this).prev().siblings(".info").hide();
        	//$(this).siblings(".test").hide();
        	/*$('div').filter('.test').each(function(i) {
        		$(this).removeClass('test');
        		//$(this).css({'display': 'none'});
        	});*/
        	$('div').filter('.info1, .info2').each(function(i) {
        		//$(this).removeClass('test');
        		$(this).css({'display': 'none'});
        	});
        	//$(this).next().addClass('test')
        	$(this)
            .next().show().animate({
              width: width+'vw'
            })
            .siblings(".info").animate({
              width: 0
            });
        	$(this).next().find(".info1").css({'display': 'block'});
        	$(this).next().find(".info2").css({'display': 'block'});
        	el_node = $(this).next().find(".info2");
        	//$(this).closest('.test').css({'display': 'none'});
        	/*$(this)
            .prev(".info").css({'display': 'none'});*/
        	$(this).siblings(".item").css({'display': 'block'});
        });
        
        this.$('.dashboard-element').click(function(e){
        	var line_id = $(this).attr('id');
        	var vendor_categ_id = $(this).attr('categid');
        	var dashboard_id = $(this).attr('dashid');
        	var menu_name = $(this).attr('menu');
        	var color_code = $(this).attr('color');
       	
        	$('div').filter('.highlight').each(function(i) {
        		$(this).removeClass('highlight');
        		$(this).css({'background-color': 'transparent'});
        		$(this).find('img').css({'filter': ''})
        	});
        	$(this).closest('div').css({'background-color': 'whitesmoke'});
        	$(this).closest('div').addClass('highlight');
        	$(this).closest('div img').css({'filter': 'opacity(0.5) drop-shadow(0 0 0 '+color_code+')'})
        	
        	self._rpc({
    			model: 'hm.form.template',
    			method: 'get_vendor_list',
    			args: [0,vendor_categ_id, dashboard_id, line_id],
    		}).then(function(result){ 
    			var result_datas = result[0]['result_datas']
    			var line_group = result[0]['line_group']
    			var line_group_key = result[0]['line_group_key']
    			var form_view = result[0]['form_view']
    			var form_name = result[0]['form_name']
    			var color = result[0]['color']
    			
    			
    			
    			var contents = el_node.find('.vendor-contents');
                contents.innerHTML = "";
                var vendor_html = QWeb.render('VendorListContent',{widget: self, result_datas: result_datas, form_view: form_view,
                						form_name: form_name, color:color,
                						line_group: line_group, line_group_key: line_group_key});
                var vendorlist = document.createElement('div');
                vendorlist.innerHTML = vendor_html;
                vendorlist = vendorlist.childNodes[1];
                contents.empty();
                contents.append(vendorlist);
                
                var table = el_node.find('#vendor_order_list').DataTable({
    		        sScrollX: true,
    		        sScrollXInner: "100%",
    		        bScrollCollapse: true,
    		        bSort: false,
    		        //'rowsGroup': [0],
    		        bFilter: false,
    		        bPaginate: true, 
    		        pageLength: 10,
    			});
    		});
        	       	
        });
        /*$('.info').first().show().animate({
            width: '40%'
          });*/
      
          /*$('.item').click(function() {
        	  alert('item');
            $(this)
              .next().show().animate({
                width: '40%'
              })
              .siblings(".info").animate({
                width: 0
              });

          });*/
        /*var activeItem = $('#accordion').children(':first');
        $('#accordion').on('click', '.list', function() {
        	alert('dfgdg')
        	$(activeItem).css({'width': '5vw'})
        	$(activeItem).children(':first').toggleClass('blur-filter');
        	activeItem = this;
        	$(activeItem).css({'width': '75vw'})
        	$(activeItem).children(':first').removeClass('blur-filter');
         
        });*/
       /* this.$('#acc1').click(function(){
            alert('accordion');
        });*/
    },
    dashboard_icon_url: function(id){
        return '/web/image?model=hm.vendor.dashboard&id='+id+'&field=image';
    },
    
    dashboard_line_icon_url: function(id){
        return '/web/image?model=hm.vendor.dashboard.line&id='+id+'&field=image';
    },
    
    get_dashboard_line: function(id){
    	return this.pos.db.get_dashboardline_by_dashboard(id);
    },
    
    get_vendors: function(category_id){
    	return this.pos.db.get_vendor_by_category(category_id);
    },
    
    vendor_image_url: function(id){
    	return '/web/image?model=res.partner&id='+id+'&field=image';
    },
    
    /*get_form_template: function(dashboard_line_id){
    	self._rpc({
			model: 'hm.form.template',
			method: 'get_form_template_line',
			args: [0,dashboard_line_id],
		}).then(function(result){ 
			console.log('TEMplate:'+JSON.stringify(result));
		});
    },*/
    render_list: function(dashboards){
        var contents = this.$el[0].querySelector('.vendor-category');
        contents.innerHTML = "";
        var dashboard_html = QWeb.render('VendorDashboard',{widget: this, dashboards:dashboards});
        var dashboardline = document.createElement('div');
        dashboardline.innerHTML = dashboard_html;
        dashboardline = dashboardline.childNodes[1];
        contents.appendChild(dashboardline);
        /*for(var i = 0, len = Math.min(partners.length,1000); i < len; i++){
            var partner    = partners[i];
            var clientline = this.partner_cache.get_node(partner.id);
            if(!clientline){
                var clientline_html = QWeb.render('ClientLine',{widget: this, partner:partners[i]});
                var clientline = document.createElement('tbody');
                clientline.innerHTML = clientline_html;
                clientline = clientline.childNodes[1];
                this.partner_cache.cache_node(partner.id,clientline);
            }
            if( partner === this.old_client ){
                clientline.classList.add('highlight');
            }else{
                clientline.classList.remove('highlight');
            }
            contents.appendChild(clientline);
        }*/
    },
   
  
});
gui.define_screen({name:'vendor_dashboard', widget: VendorDashboardScreenWidget});

});