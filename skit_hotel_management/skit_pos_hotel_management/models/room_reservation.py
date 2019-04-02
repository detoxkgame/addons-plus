# -*- coding: utf-8 -*-

from odoo import api, fields, models, _
from odoo import SUPERUSER_ID
from odoo.exceptions import UserError
from datetime import datetime, timedelta


class FormTemplate(models.Model):
    _inherit = 'hm.form.template'

    @api.multi
    def get_center_panel_form(self, sub_template_id):
        center_panel_sub_id = sub_template_id
        center_panel_design = []
        result = []
        form_name = ''
        form_view = ''
        if(sub_template_id != 'false'):
            sub_form_temp = self.env['hm.sub.form.template'].sudo().search([
                                    ('id', '=', int(sub_template_id))])
            form_name = sub_form_temp.name
            for sub_line in sub_form_temp.form_template_line_ids:
                temp_design = self.get_sub_form(sub_line.form_template_id.id, sub_line.color)
                center_panel_design.append(temp_design)
                form_view = sub_line.form_template_id.form_view

        result.append({
                       'form_name': form_name,
                       'form_view': form_view,
                       'center_panel_temp': center_panel_design,
                       'center_panel_sub_id': center_panel_sub_id
                       })
        return result;

    @api.multi
    def get_sub_form(self, form_template_id, color):
        panel_form_temp = self.env['hm.form.template'].sudo().search([
                                ('id', '=', form_template_id)])
        fields = []
        field_type = []
        sub_form_temp_ids = []
        template_lines = []
        line_group = {}
        temp_id = []
        key = 0
        count = 0
        result = []
        for form_line in panel_form_temp.form_template_line_ids:
            if form_line.form_field_id:
                fields.append(form_line.form_field_id.name)
                field_type.append(form_line.form_field_id.ttype)
            if form_line.form_field_type == 'sub_form' or form_line.form_field_type == 'view_buttons' or form_line.form_field_type == 'button':
                sub_form_temp_ids.append(form_line.sub_template_id.id)
            selection_items = []
            if form_line.form_template_selection_fields:
                sql = "select hm_form_selection_item_id from hm_form_selection_item_hm_form_template_line_rel where hm_form_template_line_id = "+str(line.id)+""
                cr = self.env.cr
                cr.execute(sql)
                match_selection_recs = cr.dictfetchall()
                for rec in match_selection_recs:
                    selection = self.env['hm.form.selection.item'].sudo().search([('id', '=', rec.get('hm_form_selection_item_id'))])
                    selection_items.append({'value': selection.value,
                                            'name': selection.name})
            many2one_list = []
            if form_line.form_field_type == 'many2one' or form_line.form_field_type == 'many2many':
                if form_line.form_field_id.relation:
                    if(form_line.form_field_id.relation == 'product.category'):
                        records = self.env[form_line.form_field_id.relation].search([('is_room', '=', True)])
                    elif(form_line.form_field_id.relation == 'product.product'):
                        records = self.env[form_line.form_field_id.relation].search([('categ_id.is_room', '=', True),
                                                                                     ('available_in_pos', '=', True)])
                    else:
                        records = self.env[form_line.form_field_id.relation].search([])
                    records_model_fields = self.env['ir.model.fields'].search(
                        [('id', 'in', form_line.form_template_model_fields.ids)])
                    for rec in records:
                        arr = {}
                        for fields_rec in records_model_fields:
                            field_name = fields_rec.name
                            arr[str(field_name)] = rec[field_name]
                        many2one_list.append(arr)
            datas = {'id': form_line.id,
                     'form_label': form_line.form_label,
                     'form_field_type': form_line.form_field_type,
                     'form_fields': form_line.form_field_id.name,
                     'sameline': form_line.sameline,
                     'isMandatory': form_line.isMandatory,
                     'sequence': form_line.sequence,
                     'form_placeholder': form_line.form_placeholder,
                     'font_size': form_line.font_size,
                     'font_style': form_line.font_style,
                     'font_family': form_line.font_family,
                     'sub_template_id': form_line.sub_template_id.id,
                     'ttype': form_line.form_field_id.ttype,
                     'form_template_selection_fields': selection_items,
                     'form_template_model_fields': many2one_list,
                     'field_styles': form_line.field_styles,
                     'field_group': form_line.field_group
                     }
            template_lines.append(datas)
            if count == 0:
                key = form_line.sequence
                temp_id.append(datas)
                line_group[key] = temp_id
            else:
                if form_line.sameline:
                        temp_id.append(datas)
                        line_group[key] = temp_id
                else:
                    key = form_line.sequence
                    temp_id = []
                    temp_id.append(datas)
                    line_group[key] = temp_id
            count = count+1
        """ Form View """
        sub_temp_id = []
        sub_form_template = {}
        sub_line_group = {}
        sub_line_group_array = {}
        sub_line_group_key_array = {}
        if panel_form_temp.form_view == 'form':
            sub_temp = self.env['hm.sub.form.template'].sudo().search([
                                ('id', 'in', sub_form_temp_ids)])
            line_fields = []
            line_field_type = []
            for temp in sub_temp:
                sub_temp_line = self.env['hm.sub.form.template.line'].sudo().search(
                            [('sub_form_template_id', '=', temp.id)],
                            order='sequence asc')

                tmp_line = self.env['hm.form.template.line'].sudo().search([
                                ('sub_template_id', '=', temp.id),
                                ('form_template_id', '=', panel_form_temp.id)])
                temp_array = []
                tid = 0
                sub_line_group = {}
                for sline in sub_temp_line:
                    tid = sline.id
                    temp_array.append({'id': sline.id,
                                       'name': sline.name,
                                       'color': sline.color
                                       })
                    if tmp_line.form_field_id.ttype == 'one2many' or tmp_line.field_group == 'htmlfooter':
                        line_form_template = self.env['hm.form.template'].sudo().search(
                                    [('id', '=', sline.form_template_id.id)])
                        line_form_template_line = self.env['hm.form.template.line'].sudo().search(
                                        [('form_template_id', '=', line_form_template.id)],
                                        order='sequence asc')
                        temp_order_lines = []
                        for line in line_form_template_line:
                            # is_orderline = True
                            if line.form_field_id:
                                line_fields.append(line.form_field_id.name)
                                line_field_type.append(line.form_field_id.ttype)
                            selection_items = []
                            if line.form_template_selection_fields:
                                for selection in line.form_template_selection_fields:
                                    selection_items.append({'value': selection.value,
                                                            'name': selection.name})
                            many2one_list = []
                            if line.form_field_type == 'many2one' or line.form_field_type == 'many2many':
                                if line.form_field_id.relation:
                                    if(line.form_field_id.relation == 'product.category'):
                                        records = self.env[line.form_field_id.relation].search([('is_room', '=', True)])
                                    elif(line.form_field_id.relation == 'product.product'):
                                        records = self.env[line.form_field_id.relation].search([('categ_id.is_room', '=', True),
                                                                                                ('available_in_pos', '=', True)])
                                    else:
                                        records = self.env[line.form_field_id.relation].search([])
                                    records_model_fields = self.env['ir.model.fields'].search(
                                        [('id', 'in', line.form_template_model_fields.ids)])
                                    for rec in records:
                                        arr = {}
                                        for fields_rec in records_model_fields:
                                            field_name = fields_rec.name
                                            arr[str(field_name)] = rec[field_name]
                                        if line.form_field_id.relation == 'product.product':
                                            prod_tmpl = self.env['product.template'].sudo().search([('id', '=', rec.product_tmpl_id.id)])
                                            arr['amount'] = prod_tmpl.list_price
                                        many2one_list.append(arr)
                            line_tmp = line.form_template_id.id
                            line_model = line.form_template_id.form_model_id.model
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
                                     'font_family': line.font_family,
                                     'sub_template_id': line.sub_template_id.id,
                                     'ttype': line.form_field_id.ttype,
                                     'form_template_selection_fields': selection_items,
                                     'form_template_model_fields': many2one_list,
                                     'field_styles': line.field_styles,
                                     'field_group': line.field_group
                                     }
                            temp_order_lines.append(datas)
                            if count == 0:
                                sub_key = line.sequence
                                sub_temp_id.append(datas)
                                sub_line_group[sub_key] = sub_temp_id
                            else:
                                if line.sameline:
                                        sub_temp_id.append(datas)
                                        sub_line_group[sub_key] = sub_temp_id
                                else:
                                    sub_key = line.sequence
                                    sub_temp_id = []
                                    sub_temp_id.append(datas)
                                    sub_line_group[sub_key] = sub_temp_id
                            count = count+1

                sub_form_template[temp.id] = temp_array
                sub_line_group_array[temp.id] = sub_line_group
                sub_line_group_key_array[temp.id] = sorted(sub_line_group.keys())
        result.append({'line_group': line_group,
                       'line_group_key': sorted(line_group.keys()),
                       'form_view': panel_form_temp.form_view,
                       #'form_name': panel_form_temp.vendor_dashboard_line_id.dashboard_menu.name or panel_form_temp.name,
                      # 'text_color': form_template.vendor_dashboard_id.color or room_reservation.color,
                       #'result_datas': result_datas,
                       'sub_form_template': sub_form_template,
                       'template_lines': template_lines,
                       #'available_rooms': available_rooms,
                       #'current_order': current_order,
                       #'current_order_lines': current_order_lines,
                      # 'form_temp_id': form_template.id,
                      # 'model_name': form_template.form_model_id.model,
                       #========================================================
                       # 'vendor_id': vendor_id,
                       'sub_line_group': sub_line_group,
                       'sub_line_group_key': sorted(sub_line_group.keys()),
                       'sub_line_group_array': sub_line_group_array,
                       'sub_line_group_key_array': sub_line_group_key_array,
                       # 'sub_line_group_array': sub_line_group_array,
                       # 'temp_order_lines': temp_order_lines,
                       # 'line_form_temp_id': line_tmp,
                       # 'line_model_name': line_model,
                       # 'is_other': is_other,
                       # 'all_location': all_location,
                       # 'stock_move_datas': stock_move_datas,
                       # 'vendor_list': vendor_list
                       #========================================================
                       #========================================================
                       # 'top_panel_temp': top_panel_design,
                       # 'left_panel_temp': left_panel_design,
                       # 'right_panel_temp': right_panel_design
                       #========================================================
                       'sub_temp_color': color,
                       })
        return result

    @api.multi
    def get_room_reservation(self):
        """ get design for room reservation """
        room_reservation = self.env['hm.vendor.dashboard'].sudo().search([
                            ('dashboard_category', '=', 'room_reservation')],
                                                        limit=1)

        form_template = self.env['hm.form.template'].sudo().search([
                            ('vendor_dashboard_id', '=', room_reservation.id)])
        form_template_line = self.env['hm.form.template.line'].sudo().search([
                            ('form_template_id', '=', form_template.id)],
                                    order='sequence asc')
        line_group = {}
        temp_id = []
        key = 0
        count = 0
        result = []
        template_lines = []
        fields = []
        field_type = []
        sub_form_temp_ids = []
        top_panel_design = []
        center_panel_design = []
        left_panel_design = []
        right_panel_design = []
        center_panel_sub_id = 0;

        for line in form_template_line:
            if line.form_field_id:
                fields.append(line.form_field_id.name)
                field_type.append(line.form_field_id.ttype)
            if line.form_field_type == 'sub_form' or line.form_field_type == 'view_buttons' or line.form_field_type == 'button':
                sub_form_temp_ids.append(line.sub_template_id.id)
            selection_items = []
            if line.form_template_selection_fields:
                sql = "select hm_form_selection_item_id from hm_form_selection_item_hm_form_template_line_rel where hm_form_template_line_id = "+str(line.id)+""
                cr = self.env.cr
                cr.execute(sql)
                match_selection_recs = cr.dictfetchall()
                for rec in match_selection_recs:
                    selection = self.env['hm.form.selection.item'].sudo().search([('id', '=', rec.get('hm_form_selection_item_id'))])
                    selection_items.append({'value': selection.value,
                                            'name': selection.name})
            many2one_list = []
            if line.form_field_type == 'many2one' or line.form_field_type == 'many2many':
                if line.form_field_id.relation:
                    if(line.form_field_id.relation == 'product.category'):
                        records = self.env[line.form_field_id.relation].search([('is_room', '=', True)])
                    elif(line.form_field_id.relation == 'product.product'):
                        records = self.env[line.form_field_id.relation].search([('categ_id.is_room', '=', True),
                                                                                ('available_in_pos', '=', True)])
                    else:
                        records = self.env[line.form_field_id.relation].search([])
                    records_model_fields = self.env['ir.model.fields'].search(
                        [('id', 'in', line.form_template_model_fields.ids)])
                    for rec in records:
                        arr = {}
                        for fields_rec in records_model_fields:
                            field_name = fields_rec.name
                            arr[str(field_name)] = rec[field_name]
                        many2one_list.append(arr)
            """ Top Panel Design """
            if line.form_field_type == 'top_panel':
                sub_form_temp = self.env['hm.sub.form.template'].sudo().search([
                                ('id', '=', line.sub_template_id.id)])
                for sub_line in sub_form_temp.form_template_line_ids:
                    temp_design = self.get_sub_form(sub_line.form_template_id.id, sub_line.color)
                    top_panel_design.append(temp_design)
                    #top_panel_design = temp_design
            """ Center Panel Design """
            if line.form_field_type == 'center_panel':
                sub_form_temp = self.env['hm.sub.form.template'].sudo().search([
                                ('id', '=', line.sub_template_id.id)])
                center_panel_sub_id = line.sub_template_id.id
                for sub_line in sub_form_temp.form_template_line_ids:
                    temp_design = self.get_sub_form(sub_line.form_template_id.id, sub_line.color)
                    center_panel_design.append(temp_design)
            """ Left Panel Design """
            if line.form_field_type == 'left_panel':
                sub_form_temp = self.env['hm.sub.form.template'].sudo().search([
                                ('id', '=', line.sub_template_id.id)])
                for sub_line in sub_form_temp.form_template_line_ids:
                    temp_design = self.get_sub_form(sub_line.form_template_id.id, sub_line.color)
                    left_panel_design.append(temp_design)
            """ Right Panel Design """
            if line.form_field_type == 'right_panel':
                sub_form_temp = self.env['hm.sub.form.template'].sudo().search([
                                ('id', '=', line.sub_template_id.id)])
                for sub_line in sub_form_temp.form_template_line_ids:
                    temp_design = self.get_sub_form(sub_line.form_template_id.id, sub_line.color)
                    right_panel_design.append(temp_design)

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
                     'font_family': line.font_family,
                     'sub_template_id': line.sub_template_id.id,
                     'ttype': line.form_field_id.ttype,
                     'form_template_selection_fields': selection_items,
                     'form_template_model_fields': many2one_list,
                     'field_styles': line.field_styles,
                     'field_group': line.field_group
                     }
            template_lines.append(datas)
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
        """ Form View """
        sub_temp_id = []
        sub_form_template = {}
        sub_line_group = {}
        sub_line_group_array = {}
        sub_line_group_key_array = {}
        if form_template.form_view == 'form':
            sub_temp = self.env['hm.sub.form.template'].sudo().search([
                                ('id', 'in', sub_form_temp_ids)])
            line_fields = []
            line_field_type = []
            for temp in sub_temp:
                sub_temp_line = self.env['hm.sub.form.template.line'].sudo().search(
                            [('sub_form_template_id', '=', temp.id)],
                            order='sequence asc')

                tmp_line = self.env['hm.form.template.line'].sudo().search([
                                ('sub_template_id', '=', temp.id),
                                ('form_template_id', '=', form_template.id)])
                temp_array = []
                tid = 0
                for sline in sub_temp_line:
                    tid = sline.id
                    temp_array.append({'id': sline.id,
                                       'name': sline.name,
                                       'color': sline.color
                                       })
                    if tmp_line.form_field_id.ttype == 'one2many' or tmp_line.field_group == 'htmlfooter':
                        line_form_template = self.env['hm.form.template'].sudo().search(
                                    [('id', '=', sline.form_template_id.id)])
                        line_form_template_line = self.env['hm.form.template.line'].sudo().search(
                                        [('form_template_id', '=', line_form_template.id)],
                                        order='sequence asc')
                        temp_order_lines = []
                        for line in line_form_template_line:
                            # is_orderline = True
                            if line.form_field_id:
                                line_fields.append(line.form_field_id.name)
                                line_field_type.append(line.form_field_id.ttype)
                            selection_items = []
                            if line.form_template_selection_fields:
                                for selection in line.form_template_selection_fields:
                                    selection_items.append({'value': selection.value,
                                                            'name': selection.name})
                            many2one_list = []
                            if line.form_field_type == 'many2one' or line.form_field_type == 'many2many':
                                if line.form_field_id.relation:
                                    if(line.form_field_id.relation == 'product.category'):
                                        records = self.env[line.form_field_id.relation].search([('is_room', '=', True)])
                                    elif(line.form_field_id.relation == 'product.product'):
                                        records = self.env[line.form_field_id.relation].search([('categ_id.is_room', '=', True),
                                                                                                ('available_in_pos', '=', True)])
                                    else:
                                        records = self.env[line.form_field_id.relation].search([])
                                    records_model_fields = self.env['ir.model.fields'].search(
                                        [('id', 'in', line.form_template_model_fields.ids)])
                                    for rec in records:
                                        arr = {}
                                        for fields_rec in records_model_fields:
                                            field_name = fields_rec.name
                                            arr[str(field_name)] = rec[field_name]
                                        if line.form_field_id.relation == 'product.product':
                                            prod_tmpl = self.env['product.template'].sudo().search([('id', '=', rec.product_tmpl_id.id)])
                                            arr['amount'] = prod_tmpl.list_price
                                        many2one_list.append(arr)
                            line_tmp = line.form_template_id.id
                            line_model = line.form_template_id.form_model_id.model
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
                                     'font_family': line.font_family,
                                     'sub_template_id': line.sub_template_id.id,
                                     'ttype': line.form_field_id.ttype,
                                     'form_template_selection_fields': selection_items,
                                     'form_template_model_fields': many2one_list,
                                     'field_styles': line.field_styles,
                                     'field_group': line.field_group
                                     }
                            temp_order_lines.append(datas)
                            if count == 0:
                                sub_key = line.sequence
                                sub_temp_id.append(datas)
                                sub_line_group[sub_key] = sub_temp_id
                            else:
                                if line.sameline:
                                        sub_temp_id.append(datas)
                                        sub_line_group[sub_key] = sub_temp_id
                                else:
                                    sub_key = line.sequence
                                    sub_temp_id = []
                                    sub_temp_id.append(datas)
                                    sub_line_group[sub_key] = sub_temp_id
                            count = count+1
                sub_form_template[temp.id] = temp_array
                sub_line_group_array[temp.id] = sub_line_group
                sub_line_group_key_array[temp.id] = sorted(sub_line_group.keys())
        result.append({'line_group': line_group,
                       'line_group_key': sorted(line_group.keys()),
                       'form_view': form_template.form_view,
                       'form_name': form_template.name,
                       'text_color': form_template.vendor_dashboard_id.color or room_reservation.color,
                       #'result_datas': result_datas,
                       'sub_form_template': sub_form_template,
                       'template_lines': template_lines,
                       #'available_rooms': available_rooms,
                       #'current_order': current_order,
                       #'current_order_lines': current_order_lines,
                       'form_temp_id': form_template.id,
                       'model_name': form_template.form_model_id.model,
                       #========================================================
                       # 'vendor_id': vendor_id,
                       'sub_line_group': sub_line_group,
                       'sub_line_group_key': sorted(sub_line_group.keys()),
                       'sub_line_group_key_array': sub_line_group_key_array,
                       'sub_line_group_array': sub_line_group_array,
                       # 'temp_order_lines': temp_order_lines,
                       # 'line_form_temp_id': line_tmp,
                       # 'line_model_name': line_model,
                       # 'is_other': is_other,
                       # 'all_location': all_location,
                       # 'stock_move_datas': stock_move_datas,
                       # 'vendor_list': vendor_list
                       #========================================================
                       'top_panel_temp': top_panel_design,
                       'center_panel_temp': center_panel_design,
                       'left_panel_temp': left_panel_design,
                       'right_panel_temp': right_panel_design,
                       'center_panel_sub_id': center_panel_sub_id,
                       })

        return result


class ResPartner(models.Model):
    _inherit = 'res.partner'

    def create_partner(self,post):
        partner_id = False
        is_exisit = False
        partner = self.env['res.partner']
        is_customer_exist = partner.search([('mobile', '=', post['mobile'])],
                                           limit=1)
        if is_customer_exist:
            is_exisit = True
            partner_id = is_customer_exist
        else:
            customer_details_array = {'name': post.get('guest_name'),
                                      'mobile': post.get('mobile'),
                                      'location': post.get('location')
                                      }
            created_customer = partner.create(customer_details_array)
            partner_id = created_customer
        val = {'id': partner_id.id,
               'name': partner_id.name,
               'street': partner_id.street,
               'city': partner_id.city,
               'state_id': partner_id.state_id,
               'country_id': partner_id.country_id,
               'vat': partner_id.vat,
               'phone': partner_id.phone,
               'zip': partner_id.zip,
               'mobile': partner_id.mobile,
               'email': partner_id.email,
               'barcode': partner_id.barcode,
               'write_date': partner_id.write_date,
               }
        return {'id': partner_id.id,
                'partner_details': val,
                'is_exisit': is_exisit
                }
