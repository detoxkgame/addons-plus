odoo.define('skit_pos_restaurant.restaurant_kitchen', function (require) {
"use strict";
var PosBaseWidget = require('point_of_sale.BaseWidget');
var chrome = require('point_of_sale.chrome');
var gui = require('point_of_sale.gui');
var models = require('point_of_sale.models');
var screens = require('point_of_sale.screens');
var core = require('web.core');
var rpc = require('web.rpc');
var ActionpadWidget = screens.ActionpadWidget;
var NumpadWidget = screens.NumpadWidget;

var QWeb = core.qweb;
var _t = core._t;


/* --------- The Order Widget --------- */

//Displays the current Order.

var KitchenOrderWidget = PosBaseWidget.extend({
 template:'KitchenOrderWidget',
 init: function(parent, options) {
     var self = this;
     this._super(parent,options);

     this.numpad_state = options.numpad_state;
     this.numpad_state.reset();
     this.numpad_state.bind('set_value',   this.set_value, this);

     this.pos.bind('change:selectedOrder', this.change_selected_order, this);

     this.line_click_handler = function(event){
         self.click_line(this.orderline, event);
     };

     if (this.pos.get_order()) {
         this.bind_order_events();
     }

 },
 click_line: function(orderline, event) {
     this.pos.get_order().select_orderline(orderline);
     this.numpad_state.reset();
 },


 set_value: function(val) {
 	var order = this.pos.get_order();
 	if (order.get_selected_orderline()) {
         var mode = this.numpad_state.get('mode');
         if( mode === 'quantity'){
             order.get_selected_orderline().set_quantity(val);
         }else if( mode === 'discount'){
             order.get_selected_orderline().set_discount(val);
         }else if( mode === 'price'){
             var selected_orderline = order.get_selected_orderline();
             selected_orderline.price_manually_set = true;
             selected_orderline.set_unit_price(val);
         }
 	}
 },
 change_selected_order: function() {
     if (this.pos.get_order()) {
         this.bind_order_events();
         this.numpad_state.reset();
         this.renderElement();
     }
 },
 orderline_add: function(){
     this.numpad_state.reset();
     this.renderElement('and_scroll_to_bottom');
 },
 orderline_remove: function(line){
     this.remove_orderline(line);
     this.numpad_state.reset();
     this.update_summary();
 },
 orderline_change: function(line){
     this.rerender_orderline(line);
     this.update_summary();
 },
 bind_order_events: function() {
     var order = this.pos.get_order();
         order.unbind('change:client', this.update_summary, this);
         order.bind('change:client',   this.update_summary, this);
         order.unbind('change',        this.update_summary, this);
         order.bind('change',          this.update_summary, this);

     var lines = order.orderlines;
         lines.unbind('add',     this.orderline_add,    this);
         lines.bind('add',       this.orderline_add,    this);
         lines.unbind('remove',  this.orderline_remove, this);
         lines.bind('remove',    this.orderline_remove, this); 
         lines.unbind('change',  this.orderline_change, this);
         lines.bind('change',    this.orderline_change, this);

 },
 render_orderline: function(orderline){
     var el_str  = QWeb.render('Orderline',{widget:this, line:orderline}); 
     var el_node = document.createElement('div');
         el_node.innerHTML = _.str.trim(el_str);
         el_node = el_node.childNodes[0];
         el_node.orderline = orderline;
         el_node.addEventListener('click',this.line_click_handler);
     var el_lot_icon = el_node.querySelector('.line-lot-icon');
     if(el_lot_icon){
         el_lot_icon.addEventListener('click', (function() {
             this.show_product_lot(orderline);
         }.bind(this)));
     }

     orderline.node = el_node;
     return el_node;
 },
 remove_orderline: function(order_line){
     if(this.pos.get_order().get_orderlines().length === 0){
         this.renderElement();
     }else{
         order_line.node.parentNode.removeChild(order_line.node);
     }
 },
 rerender_orderline: function(order_line){
     var node = order_line.node;
     var replacement_line = this.render_orderline(order_line);
     node.parentNode.replaceChild(replacement_line,node);
 },
 // overriding the openerp framework replace method for performance reasons
 replace: function($target){
     this.renderElement();
     var target = $target[0];
     target.parentNode.replaceChild(this.el,target);
 },
 renderElement: function(scrollbottom){
     var order  = this.pos.get_order();
     if (!order) {
         return;
     }
     var orderlines = order.get_orderlines();

     var el_str  = QWeb.render('KitchenOrderWidget',{widget:this, order:order, orderlines:orderlines});

     var el_node = document.createElement('div');
         el_node.innerHTML = _.str.trim(el_str);
         el_node = el_node.childNodes[0];


     var list_container = el_node.querySelector('.orderlines');
     for(var i = 0, len = orderlines.length; i < len; i++){
         var orderline = this.render_orderline(orderlines[i]);
         list_container.appendChild(orderline);
     }

     if(this.el && this.el.parentNode){
         this.el.parentNode.replaceChild(el_node,this.el);
     }
     this.el = el_node;
     this.update_summary();

     if(scrollbottom){
         this.el.querySelector('.order-scroller').scrollTop = 100 * orderlines.length;
     }
 },
 update_summary: function(){
     var order = this.pos.get_order();
     if (!order.get_orderlines().length) {
         return;
     }

     var total     = order ? order.get_total_with_tax() : 0;
     var taxes     = order ? total - order.get_total_without_tax() : 0;

     this.el.querySelector('.summary .total > .value').textContent = this.format_currency(total);
     this.el.querySelector('.summary .total .subentry .value').textContent = this.format_currency(taxes);
 },
 show_product_lot: function(orderline){
     this.pos.get_order().select_orderline(orderline);
     var order = this.pos.get_order();
     order.display_lot_popup();
 },
});


var KitchenScreenWidget = screens.ScreenWidget.extend({
    template:'KitchenScreenWidget',

    start: function(){ 

        var self = this;

        this.actionpad = new ActionpadWidget(this,{});
        this.actionpad.replace(this.$('.placeholder-ActionpadWidget'));

        this.numpad = new NumpadWidget(this,{});
        this.numpad.replace(this.$('.placeholder-NumpadWidget'));

        this.kitchen_order_widget = new KitchenOrderWidget(this,{
            numpad_state: this.numpad.state,
        });
        this.kitchen_order_widget.replace(this.$('.placeholder-KitchenOrderWidget'));

        /*this.product_list_widget = new ProductListWidget(this,{
            click_product_action: function(product){ self.click_product(product); },
            product_list: this.pos.db.get_product_by_category(0)
        });
        this.product_list_widget.replace(this.$('.placeholder-ProductListWidget'));

        this.product_categories_widget = new ProductCategoriesWidget(this,{
            product_list_widget: this.product_list_widget,
        });
        this.product_categories_widget.replace(this.$('.placeholder-ProductCategoriesWidget'));

        this.action_buttons = {};
        var classes = action_button_classes;
        for (var i = 0; i < classes.length; i++) {
            var classe = classes[i];
            if ( !classe.condition || classe.condition.call(this) ) {
                var widget = new classe.widget(this,{});
                widget.appendTo(this.$('.control-buttons'));
                this.action_buttons[classe.name] = widget;
            }
        }
        if (_.size(this.action_buttons)) {
            this.$('.control-buttons').removeClass('oe_hidden');
        }*/
    },

   /* click_product: function(product) {
       if(product.to_weight && this.pos.config.iface_electronic_scale){
           this.gui.show_screen('scale',{product: product});
       }else{
           this.pos.get_order().add_product(product);
       }
    },

    show: function(reset){
        this._super();
        if (reset) {
            this.product_categories_widget.reset_category();
            this.numpad.state.reset();
        }
        if (this.pos.config.iface_vkeyboard && this.chrome.widget.keyboard) {
            this.chrome.widget.keyboard.connect($(this.el.querySelector('.searchbox input')));
        }
    },

    close: function(){
        this._super();
        if(this.pos.config.iface_vkeyboard && this.chrome.widget.keyboard){
            this.chrome.widget.keyboard.hide();
        }
    },*/
});
gui.define_screen({name:'restaurant_kitchen', widget: KitchenScreenWidget});


var KitchenScreenWidget123 = screens.ScreenWidget.extend({
    template: 'KitchenScreenWidget123',
    init: function(parent, options){
        this._super(parent, options);
        //this.pos.bind('change:selectedOrder', this.change_selected_order, this);
    },
    hide: function(){
        this._super();
       
        this.chrome.widget.order_selector.show();
    },
    change_selected_order: function() {
        if (this.pos.get_order()) {
           // this.bind_order_events();
           // this.numpad_state.reset();
           // this.renderElement();
        }
    },
    show: function(){
        this._super();
        this.chrome.widget.order_selector.hide();
       // var dashboards = this.pos.vendor_dashboard;
       // var dashboard_lines = this.pos.vendor_dashboard_line;
        var self = this;
        var el_node = this;
       
        this.render_list();
         
    },
    
    render_orderline: function(orderline){
        var el_str  = QWeb.render('KitchenOrderline',{widget:this, line:orderline}); 
        var el_node = document.createElement('div');
            el_node.innerHTML = _.str.trim(el_str);
            el_node = el_node.childNodes[0];
            el_node.orderline = orderline;
            el_node.addEventListener('click',this.line_click_handler);
        var el_lot_icon = el_node.querySelector('.line-lot-icon');
        if(el_lot_icon){
            el_lot_icon.addEventListener('click', (function() {
                this.show_product_lot(orderline);
            }.bind(this)));
        }

        orderline.node = el_node;
        return el_node;
    },
    
   /* renderElement: function(scrollbottom){
        var order  = this.pos.get_order();
        if (!order) {
            return;
        }
        var orderlines = order.get_orderlines();
       // var contents = this.$el[0].querySelector('.kitchen_order');
      //  contents.innerHTML = "";

        var el_str  = QWeb.render('KitchenOrderWidget',{widget:this, order:order, orderlines:orderlines});

        var el_node = document.createElement('div');
            el_node.innerHTML = _.str.trim(el_str);
            el_node = el_node.childNodes[0];


        var list_container = el_node.querySelector('.orderlines');
        for(var i = 0, len = orderlines.length; i < len; i++){
            var orderline = this.render_orderline(orderlines[i]);
            list_container.appendChild(orderline);
        }

        if(this.el && this.el.parentNode){
            this.el.parentNode.replaceChild(el_node,this.el);
        }
        this.el = el_node;
       // contents.appendChild(el_node);
        this.update_summary();

        if(scrollbottom){
            this.el.querySelector('.order-scroller').scrollTop = 100 * orderlines.length;
        }
    },
    */
    update_summary: function(){
        var order = this.pos.get_order();
        if (!order.get_orderlines().length) {
            return;
        }

        var total     = order ? order.get_total_with_tax() : 0;
        var taxes     = order ? total - order.get_total_without_tax() : 0;

        this.el.querySelector('.summary .total > .value').textContent = this.format_currency(total);
        this.el.querySelector('.summary .total .subentry .value').textContent = this.format_currency(taxes);
    },
    render_list: function(){
        var contents = this.$el[0].querySelector('.kitchen_order');
        contents.innerHTML = "";
        alert(contents)
        var order  = this.pos.get_order();
        if (!order) {
            return;
        }
        var orderlines = order.get_orderlines();
      /* var dashboard_html = QWeb.render('KitchenOrders',{widget:this, order:order, orderlines:orderlines, line:orderlines});
        var dashboardline = document.createElement('div');
        dashboardline.innerHTML = dashboard_html;
        dashboardline = dashboardline.childNodes[1];*/
        var el_str = QWeb.render('KitchenOrders',{widget:this, order:order, orderlines:orderlines});
        var el_node = document.createElement('div');
        el_node.innerHTML =_.str.trim(el_str);
        el_node = el_node.childNodes[0];
        var list_container = el_node.querySelector('.orderlines');
        for(var i = 0, len = orderlines.length; i < len; i++){
            var orderline = this.render_orderline(orderlines[i]);
            list_container.appendChild(orderline);
        }

        contents.appendChild(el_node);
        if(this.el && this.el.parentNode){
            this.el.parentNode.replaceChild(el_node,this.el);
        }
        this.el = el_node;
        //contents.appendChild(el_node);
        this.update_summary();
        /*var order  = this.pos.get_order();
        if (!order) {
            return;
        }
        var orderlines = order.get_orderlines();
       // var contents = this.$el[0].querySelector('.kitchen_order');
      //  contents.innerHTML = "";

        var el_str  = QWeb.render('KitchenOrderWidget',{widget:this, order:order, orderlines:orderlines});

        var el_node = document.createElement('div');
            el_node.innerHTML = _.str.trim(el_str);
            el_node = el_node.childNodes[0];


        var list_container = el_node.querySelector('.orderlines');
        for(var i = 0, len = orderlines.length; i < len; i++){
            var orderline = this.render_orderline(orderlines[i]);
            list_container.appendChild(orderline);
        }

        if(this.el && this.el.parentNode){
            this.el.parentNode.replaceChild(el_node,this.el);
        }
        this.el = el_node;
        //contents.appendChild(el_node);
        this.update_summary();*/

        /*if(scrollbottom){
            this.el.querySelector('.order-scroller').scrollTop = 100 * orderlines.length;
        }*/
    },
    
   
  
});
gui.define_screen({name:'restaurant_kitchen123', widget: KitchenScreenWidget123});

});