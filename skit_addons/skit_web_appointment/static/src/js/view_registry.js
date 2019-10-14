odoo.define('skit_web_appointment.view_registry', function (require) {
"use strict";

var view_registry = require('web.view_registry');

var AppointmentView = require('skit_web_appointment.AppointmentView');

view_registry.add('appointment', AppointmentView);

});
