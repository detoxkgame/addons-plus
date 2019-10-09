odoo.define('skit_slide.SlideCalendarController', function (require) {
"use strict";

var CalendarController = require('web.CalendarController');
var core = require('web.core');
var Dialog = require('web.Dialog');
var dialogs = require('web.view_dialogs');
var QuickCreate = require('web.CalendarQuickCreate');
var t_QuickCreate = require('skit_slide.Quotes');
var _t = core._t;
var QWeb = core.qweb; 

CalendarController.include({
	
	_onOpenCreate: function (event) {
        var self = this;
        if (this.model.get().scale === "month") {
            event.data.allDay = true;
        }
        var data = this.model.calendarEventToRecord(event.data);

        var context = _.extend({}, this.context, event.options && event.options.context);
        context.default_name = data.name || null;
        context['default_' + this.mapping.date_start] = data[this.mapping.date_start] || null;
        if (this.mapping.date_stop) {
            context['default_' + this.mapping.date_stop] = data[this.mapping.date_stop] || null;
        }
        if (this.mapping.date_delay) {
            context['default_' + this.mapping.date_delay] = data[this.mapping.date_delay] || null;
        }
        if (this.mapping.all_day) {
            context['default_' + this.mapping.all_day] = data[this.mapping.all_day] || null;
        }

        for (var k in context) {
            if (context[k] && context[k]._isAMomentObject) {
                context[k] = context[k].clone().utc().format('YYYY-MM-DD HH:mm:ss');
            }
        }

        var options = _.extend({}, this.options, event.options, {
            context: context,
            title: _.str.sprintf(_t('Create: %s'), (this.displayName || this.renderer.arch.attrs.string))
        });

        if (this.quick != null) {
            this.quick.destroy();
            this.quick = null;
        }

        if (!options.disableQuickCreate && !event.data.disableQuickCreate && this.quickAddPop) {
        	if(options.title == 'Create: Meetings'){
        		this.quick = new QuickCreate(this, true, options, data, event.data);
        	}
        	else{
        		this.quick = new t_QuickCreate(this, true, options, data, event.data);
        	}
            this.quick.open();
            this.quick.opened(function () {
                self.quick.focus();
            });
            return;
        }

        var title = _t("Create");
        if (this.renderer.arch.attrs.string) {
            title += ': ' + this.renderer.arch.attrs.string;
        }
        if (this.eventOpenPopup) {
            new dialogs.FormViewDialog(self, {
                res_model: this.modelName,
                context: context,
                title: title,
                disable_multiple_selection: true,
                on_saved: function () {
                    if (event.data.on_save) {
                        event.data.on_save();
                    }
                    self.reload();
                },
            }).open();
        } else {
            this.do_action({
                type: 'ir.actions.act_window',
                res_model: this.modelName,
                views: [[this.formViewId || false, 'form']],
                target: 'current',
                context: context,
            });
        }
    },
	
    });
  });