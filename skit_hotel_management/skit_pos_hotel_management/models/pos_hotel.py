# -*- coding: utf-8 -*-

from odoo import api, fields, models, _
from odoo import SUPERUSER_ID
from odoo.exceptions import UserError


class FormTemplate(models.Model):
    _inherit = 'hm.form.template'

    #===========================================================================
    # @api.multi
    # def get_form_template_line(self, dashboard_line_id):
    #     form_template = self.env['hm.form.template'].sudo().search(
    #                     [('vendor_dashboard_line_id', '=', dashboard_line_id)],
    #                     order='sequence asc')
    #     template_lines = []
    #     for temp_line in form_template.form_template_line_ids:
    #         template_lines.append({'id': temp_line.id,
    #                                'form_label': temp_line.form_label,
    #                                'form_field_type': temp_line.form_field_type,
    #                                'sameline': temp_line.sameline,
    #                                'isMandatory': temp_line.isMandatory,
    #                                'sequence': temp_line.sequence,
    #                                'form_placeholder': temp_line.form_placeholder,
    #                                'font_size': temp_line.font_size,
    #                                'font_style': temp_line.font_style
    #                                })
    #     return template_lines
    #===========================================================================
   #============================================================================
   #  form_template = self.env['hm.form.template'].sudo().search(
   #                      [('vendor_dashboard_id', '=', int(dashboard_id)), ('vendor_dashboard_line_id', '=', int(line_id))])
   #      form_template_line = self.env['hm.form.template.line'].sudo().search(
   #                      [('form_template_id', '=', form_template.id)],
   #                      order='sequence asc')
   #      line_group = {}
   #      temp_id = []
   #      key = 0
   #      count = 0
   #      result = []
   #      template_lines = []
   #      for line in form_template_line:
   #          datas = {'id': line.id,
   #                                 'form_label': line.form_label,
   #                                 'form_field_type': line.form_field_type,
   #                                 'sameline': line.sameline,
   #                                 'isMandatory': line.isMandatory,
   #                                 'sequence': line.sequence,
   #                                 'form_placeholder': line.form_placeholder,
   #                                 'font_size': line.font_size,
   #                                 'font_style': line.font_style,
   #                                 'font_family': line.font_family
   #                                 }
   #          if count == 0:
   #              key = line.sequence
   #              temp_id.append(datas)
   #              line_group[key] = temp_id
   #          else:
   #              if line.sameline:
   #                      temp_id.append(datas)
   #                      line_group[key] = temp_id
   #              else:
   #                  key = line.sequence
   #                  temp_id = []
   #                  temp_id.append(datas)
   #                  line_group[key] = temp_id
   #          count = count+1
   # 
   #============================================================================


class ResPartner(models.Model):
    _inherit = 'hm.form.template'

    @api.multi
    def get_vendor_list(self, category_id, dashboard_id, line_id, is_form, sub_temp_id):
        vendors = self.env['res.partner'].sudo().search(
                                    [('supplier', '=', True),
                                     ('category_id', 'in', [int(category_id)])])
        if is_form:
            sub_form_template = self.env['hm.sub.form.template'].sudo().search([('id', '=', int(sub_temp_id))])
            form_template = self.env['hm.form.template'].sudo().search(
                            [('id', '=', sub_form_template.sub_form_template_id.id)])
            form_template_line = self.env['hm.form.template.line'].sudo().search(
                            [('form_template_id', '=', form_template.id)],
                            order='sequence asc')
        else:
            form_template = self.env['hm.form.template'].sudo().search(
                            [('vendor_dashboard_id', '=', int(dashboard_id)),
                             ('vendor_dashboard_line_id', '=', int(line_id)),
                             ('form_view', '!=', 'form')])
            form_template_line = self.env['hm.form.template.line'].sudo().search(
                            [('form_template_id', '=', form_template.id)],
                            order='sequence asc')
        model_datas = self.env[form_template.form_model_id.model].search([])
        line_group = {}
        temp_id = []
        key = 0
        count = 0
        result = []
        template_lines = []
        fields = []
        field_type = []
        for line in form_template_line:
            fields.append(line.form_field_id.name)
            field_type.append(line.form_field_id.ttype)
            datas = {'id': line.id,
                                   'form_label': line.form_label,
                                   'form_field_type': line.form_field_type,
                                   'form_fields': line.form_field_id.name,
                                   'sameline': line.sameline,
                                   'isMandatory': line.isMandatory,
                                   'sequence': line.sequence,
                                   'form_placeholder': line.form_placeholder,
                                   'font_size': line.font_size,
                                   'font_style': line.font_style,
                                   'font_family': line.font_family
                                   }
            if count == 0:
                key = line.sequence
                temp_id.append(datas)
                line_group[key] = temp_id
            else:
                if line.sameline:
                        temp_id.append(datas)
                        line_group[key] = temp_id
                else:
                    key = line.sequence
                    temp_id = []
                    temp_id.append(datas)
                    line_group[key] = temp_id
            count = count+1
        result_datas = []
        sub_form_template = []
        if form_template.form_view == 'kanban':
            for vendor in vendors:
                result_datas.append({'id': vendor.id,
                                     'name': vendor.name,
                                     'city': vendor.city,
                                     'country_id': vendor.country_id.name,
                                     'email': vendor.email,
                                     'phone': vendor.phone})
            sub_temp = self.env['hm.sub.form.template'].sudo().search([
                                ('form_template_id', '=', form_template.id)],
                                            order='sequence asc')
            for temp in sub_temp:
                sub_form_template.append({'id': temp.id,
                                          'name': temp.name,
                                          'color': temp.color
                                          })
        if form_template.form_view == 'list':
            order_data = {}
            for data in model_datas:
                order_data = {}
                count = 0
                for field in fields:
                    if field_type[count] == 'many2one':
                        order_data[field] = data[field].name
                    else:
                        order_data[field] = data[field]
                    count = count + 1
                result_datas.append(order_data)

        if form_template.form_view == 'form':
            result_datas = []

        result.append({'line_group': line_group,
                       'line_group_key': sorted(line_group.keys()),
                       'form_view': form_template.form_view,
                       'form_name': form_template.vendor_dashboard_line_id.dashboard_menu.name,
                       'color': form_template.vendor_dashboard_id.color,
                       'result_datas': result_datas,
                       'sub_form_template': sub_form_template,
                       'model': self.env['hm.car.type']
                       })
        return result
