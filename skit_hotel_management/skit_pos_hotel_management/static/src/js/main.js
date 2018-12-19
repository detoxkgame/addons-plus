odoo.define('skit_pos_hotel_management.main', function (require) {
"use strict";
alert('test123');
var chrome = require('point_of_sale.chrome');
var core = require('web.core');
var main = require('point_of_sale.main');
var hotelmanagement = require('skit_pos_hotel_management.hotel_management');

main.core.action_registry.add('pos.ui', hotelmanagement.HotelManagement);

});