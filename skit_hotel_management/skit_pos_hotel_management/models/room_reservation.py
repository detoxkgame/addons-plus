# -*- coding: utf-8 -*-

from odoo import api, fields, models, _
from odoo import SUPERUSER_ID
from odoo.exceptions import UserError
from datetime import datetime, timedelta


class FormTemplate(models.Model):
    _inherit = 'hm.form.template'

    @api.multi
    def get_order_datas(self, sub_template_id, model_id, datas):
        data_field = []
        order_id = 0
        center_panel_sub_id = sub_template_id
        center_panel_design = []
        result = []
        form_name = ''
        form_view = ''
        model = self.env['ir.model'].sudo().search([
                                    ('id', '=', int(model_id))])
        for key, value in datas.items():
            val = (key, '=', value)
            data_field.append(val)
        if(model.model == 'pos.order'):
            data_field.append(('reservation_status', '=', 'reserved'))
            order = self.env[model.model].sudo().search(data_field, limit=1,
                                                         order='id desc')
            order_id = order.id
        if(sub_template_id != 'false'):
            sub_form_temp = self.env['hm.sub.form.template'].sudo().search([
                                    ('id', '=', int(sub_template_id))])
            form_name = sub_form_temp.name
            for sub_line in sub_form_temp.form_template_line_ids:
                temp_design = self.get_sub_form(sub_line.form_template_id.id, sub_line.color, order_id)
                center_panel_design.append(temp_design)
                form_view = sub_line.form_template_id.form_view
        result.append({
                    'form_name': form_name,
                    'form_view': form_view,
                    'center_panel_temp': center_panel_design,
                    'center_panel_sub_id': center_panel_sub_id
                    })
        return result

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
                temp_design = self.get_sub_form(sub_line.form_template_id.id, sub_line.color, 0)
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
    def get_restaurant_table(self, floor_id):
        tables = []
        if floor_id:
            floor_table_ids = self.env['restaurant.table'].sudo().search([
                                ('floor_id', '=', int(floor_id))])
            for floor_table in floor_table_ids:
                room_manage_id = self.env['room.manage'].sudo().search([
                                ('room_no', '=', floor_table.product_id.id),
                                ('state', '=', 'inprogress')])
                tables.append({'id': floor_table.id,
                               'floor_id': floor_table.floor_id.id,
                               'name': floor_table.name,
                               'product_id': floor_table.product_id.id,
                               'room_name': floor_table.product_id.name,
                               'seats': floor_table.seats,
                               'shape': floor_table.shape,
                               'color': floor_table.color,
                               'width': floor_table.width,
                               'height': floor_table.height,
                               'position_h': floor_table.position_h,
                               'position_v': floor_table.position_v,
                               'rm_id': room_manage_id.id,
                               'room_no': room_manage_id.room_no.id,
                               'state': room_manage_id.state,
                               })
        return tables

    @api.multi
    def get_roomsupply_items(self, room_id):
        room_supply = []
        rs_items = []
        rm_supply_items = []
        room_supplier_ids = []
        room_supply_items = self.env['hm.room.supply'].sudo().search([])
        if room_supply_items:
            for items in room_supply_items:
                rs_items.append({'id': items.id,
                                 'name': items.name,
                                 })
        supplier_ids = self.env['res.users'].sudo().search([])
        if supplier_ids:
            for supplier in supplier_ids:
                room_supplier_ids.append({'id': supplier.id,
                                          'name': supplier.name,
                                          'partner_id': supplier.partner_id.id
                                          })
        if room_id:
            floor_table_ids = self.env['restaurant.table'].sudo().search([
                                ('product_id', '=', int(room_id))])
            for floor_table in floor_table_ids:
                room_manage_id = self.env['room.manage'].sudo().search([
                                ('room_no', '=', floor_table.product_id.id),
                                ('state', '=', 'inprogress')])
                if room_manage_id:
                    for rm_supply in room_manage_id.room_supply_details:
                        rm_supply_items.append({
                                            'id': rm_supply.room_supply.id,
                                            'name': rm_supply.room_supply.name,
                                            'rm_id': room_manage_id.id,
                                            })
                room_supply.append({'id': floor_table.id,
                                    'floor_id': floor_table.floor_id.id,
                                    'name': floor_table.name,
                                    'product_id': floor_table.product_id.id,
                                    'supply_items': rs_items,
                                    'rm_supply_items': rm_supply_items,
                                    'rm_id': room_manage_id.id,
                                    'room_no': room_manage_id.room_no.id,
                                    'state': room_manage_id.state,
                                    'supplier_id': room_manage_id.supplier.id,
                                    'supplier_name': room_manage_id.supplier.name,
                                    'room_supplier_ids': room_supplier_ids,
                                    })
        return room_supply

    @api.multi
    def get_sub_form(self, form_template_id, color, order_id):
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
        floors = []
        current_order = []
        current_order_lines = []
        model_method_datas = {}
        for form_line in panel_form_temp.form_template_line_ids:
            if form_line.form_field_id:
                fields.append(form_line.form_field_id.name)
                field_type.append(form_line.form_field_id.ttype)
            if form_line.form_field_type == 'sub_form' or form_line.form_field_type == 'view_buttons' or form_line.form_field_type == 'button' or form_line.form_field_type == 'menu':
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
            if form_line.model_method and form_line.model_name:
                model_object = self.env[form_line.model_name]
                model_datas = getattr(model_object, form_line.model_method)(form_line.id)
                model_method_datas[form_line.id] = model_datas

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
                     'model_id': form_line.form_template_id.form_model_id.id,
                     'form_template_selection_fields': selection_items,
                     'form_template_model_fields': many2one_list,
                     'field_styles': form_line.field_styles,
                     'field_group': form_line.field_group,
                     'description': form_line.description,
                     'model_name': form_line.model_name,
                     'model_method': form_line.model_method
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
            orders = self.env[panel_form_temp.form_model_id.model].sudo().search([('id', '=', int(order_id))])
            if orders:
                for order in orders:
                    order_data = {}
                    count = 0
                    for field in fields:
                        if field_type[count] == 'many2one':
                            order_data[field] = order[field].display_name or ''
                        elif field_type[count] == 'datetime':
                            odate = False
                            if order[field]:
                                odate = datetime.strftime(order[field], '%a %m-%d-%Y %H:%M %p')
                            order_data[field] = odate
                        else:
                            order_data[field] = order[field] or ''
                        count = count + 1
                    order_data['id'] = order['id']
                    order_data['state'] = order['state']
                    order_data['name'] = order['name']
                    current_order.append(order_data)
            else:
                order_data = {}
                count = 0
                for field in fields:
                    if field_type[count] == 'many2one':
                        order_data[field] = ''
                    else:
                        order_data[field] = ''
                    count = count + 1
                order_data['id'] = ''
                order_data['state'] = ''
                current_order.append(order_data)

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
                                     'model_id': line.form_template_id.form_model_id.id,
                                     'form_template_selection_fields': selection_items,
                                     'form_template_model_fields': many2one_list,
                                     'field_styles': line.field_styles,
                                     'field_group': line.field_group,
                                     'description': line.description,
                                     'model_name': line.model_name,
                                     'model_method': line.model_method
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
            if orders:
                data_lines = []
                data_lines = orders.lines
                for oline in data_lines:
                    orderline_data = {}
                    count = 0
                    for field in line_fields:
                        if line_field_type[count] == 'many2one':
                            orderline_data[field] = oline[field].display_name or ''
                        elif line_field_type[count] == 'many2many':
                            orderline_data[field] = oline[field].ids
                        else:
                            orderline_data[field] = oline[field] or ''
                        count = count + 1
                    orderline_data['id'] = order['id']
                    orderline_data['state'] = order['state']
                    current_order_lines.append(orderline_data)
            else:
                orderline_data = {}
                count = 0
                for field in line_fields:
                    if line_field_type[count] == 'many2one':
                        orderline_data[field] = ''
                    else:
                        orderline_data[field] = ''
                    count = count + 1
                orderline_data['id'] = ''
                orderline_data['state'] = ''
                current_order_lines.append(orderline_data)
        floor_count = 0
        if panel_form_temp.form_view == 'restaurant_table':
            floor_count = self.env['restaurant.floor'].sudo().search_count([
                                            ('is_room_service', '=', True)])
            floor_plans = self.env['restaurant.floor'].sudo().search([
                                            ('is_room_service', '=', True)])
            for floor in floor_plans:
                floors.append({'id': floor.id,
                               'name': floor.name})
        result.append({'line_group': line_group,
                       'line_group_key': sorted(line_group.keys()),
                       'form_view': panel_form_temp.form_view,
                       #'form_name': panel_form_temp.vendor_dashboard_line_id.dashboard_menu.name or panel_form_temp.name,
                      # 'text_color': form_template.vendor_dashboard_id.color or room_reservation.color,
                       #'result_datas': result_datas,
                       'sub_form_template': sub_form_template,
                       'template_lines': template_lines,
                       #'available_rooms': available_rooms,
                       'current_order': current_order,
                       'current_order_lines': current_order_lines,
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
                       'model_method_datas': model_method_datas,
                       'floors': floors,
                       'floor_count': floor_count,
                       })
        return result

    @api.multi
    def get_room_reservation(self, order_id):
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
        center_panel_sub_id = 0
        current_order = []
        current_order_lines = []
        model_method_datas = {}

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
                    temp_design = self.get_sub_form(sub_line.form_template_id.id, sub_line.color, 0)
                    top_panel_design.append(temp_design)
                    #top_panel_design = temp_design
            """ Center Panel Design """
            if line.form_field_type == 'center_panel':
                sub_form_temp = self.env['hm.sub.form.template'].sudo().search([
                                ('id', '=', line.sub_template_id.id)])
                center_panel_sub_id = line.sub_template_id.id
                for sub_line in sub_form_temp.form_template_line_ids:
                    temp_design = self.get_sub_form(sub_line.form_template_id.id, sub_line.color, 0)
                    center_panel_design.append(temp_design)
            """ Left Panel Design """
            if line.form_field_type == 'left_panel':
                sub_form_temp = self.env['hm.sub.form.template'].sudo().search([
                                ('id', '=', line.sub_template_id.id)])
                for sub_line in sub_form_temp.form_template_line_ids:
                    temp_design = self.get_sub_form(sub_line.form_template_id.id, sub_line.color, 0)
                    left_panel_design.append(temp_design)
            """ Right Panel Design """
            if line.form_field_type == 'right_panel':
                sub_form_temp = self.env['hm.sub.form.template'].sudo().search([
                                ('id', '=', line.sub_template_id.id)])
                for sub_line in sub_form_temp.form_template_line_ids:
                    temp_design = self.get_sub_form(sub_line.form_template_id.id, sub_line.color, 0)
                    right_panel_design.append(temp_design)
            if line.model_method and line.model_name:
                model_object = self.env[line.model_name]
                model_datas = getattr(model_object, line.model_method)(line.id)
                model_method_datas[form_line.id] = model_datas
                #model_method_datas.append(model_datas)
                #model_method_datas[line.id] = model_datas

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
                     'model_id': line.form_template_id.form_model_id.id,
                     'form_template_selection_fields': selection_items,
                     'form_template_model_fields': many2one_list,
                     'field_styles': line.field_styles,
                     'field_group': line.field_group,
                     'description': line.description,
                     'model_name': line.model_name,
                     'model_method': line.model_method
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
            orders = self.env[form_template.form_model_id.model].sudo().search(
                                                [('id', '=', int(order_id))])
            if orders:
                for order in orders:
                    order_data = {}
                    count = 0
                    for field in fields:
                        if field_type[count] == 'many2one':
                            order_data[field] = order[field].display_name or ''
                        elif field_type[count] == 'datetime':
                            odate = False
                            if order[field]:
                                odate = datetime.strftime(order[field], '%a %m-%d-%Y %H:%M %p')
                            order_data[field] = odate
                        else:
                            order_data[field] = order[field] or ''
                        count = count + 1
                    order_data['id'] = order['id']
                    order_data['state'] = order['state']
                    order_data['name'] = order['name']
                    current_order.append(order_data)
            else:
                order_data = {}
                count = 0
                for field in fields:
                    if field_type[count] == 'many2one':
                        order_data[field] = ''
                    else:
                        order_data[field] = ''
                    count = count + 1
                order_data['id'] = ''
                order_data['state'] = ''
                current_order.append(order_data)
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
                                     'model_id': line.form_template_id.form_model_id.id,
                                     'form_template_selection_fields': selection_items,
                                     'form_template_model_fields': many2one_list,
                                     'field_styles': line.field_styles,
                                     'field_group': line.field_group,
                                     'description': line.description,
                                     'model_name': line.model_name,
                                     'model_method': line.model_method
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
            if orders:
                data_lines = []
                data_lines = orders.lines
                for oline in data_lines:
                    orderline_data = {}
                    count = 0
                    for field in line_fields:
                        if line_field_type[count] == 'many2one':
                            orderline_data[field] = oline[field].display_name or ''
                        elif line_field_type[count] == 'many2many':
                            orderline_data[field] = oline[field].ids
                        else:
                            orderline_data[field] = oline[field] or ''
                        count = count + 1
                    orderline_data['id'] = order['id']
                    orderline_data['state'] = order['state']
                    current_order_lines.append(orderline_data)
            else:
                orderline_data = {}
                count = 0
                for field in line_fields:
                    if line_field_type[count] == 'many2one':
                        orderline_data[field] = ''
                    else:
                        orderline_data[field] = ''
                    count = count + 1
                orderline_data['id'] = ''
                orderline_data['state'] = ''
                current_order_lines.append(orderline_data)
        result.append({'line_group': line_group,
                       'line_group_key': sorted(line_group.keys()),
                       'form_view': form_template.form_view,
                       'form_name': form_template.name,
                       'text_color': form_template.vendor_dashboard_id.color or room_reservation.color,
                       #'result_datas': result_datas,
                       'sub_form_template': sub_form_template,
                       'template_lines': template_lines,
                       #'available_rooms': available_rooms,
                       'current_order': current_order,
                       'current_order_lines': current_order_lines,
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
                       'model_method_datas': model_method_datas
                       })

        return result


class ResPartner(models.Model):
    _inherit = 'res.partner'

    def create_partner(self, post):
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


class PosOrder(models.Model):
    _inherit = 'pos.order'

    def update_order(self, post, order_id):
        order = self.env['pos.order'].sudo().search([('id', '=', int(order_id))])
        if(order):
            if post:
                if post.get('order_line'):
                    order_lines = post.get('order_line')
                    i = 0
                    for line in order.lines:
                        line.update(order_lines[i])
                        i = i + 1
                del post['order_line']
                order.update(post)
        return True

    @api.multi
    def get_today_checkout(self, line_id):
        date_format = '%Y-%m-%d'
        current_date = (datetime.today()).strftime(date_format)
        from_date = current_date+" 00:00:00"
        to_date = current_date+" 23:59:59"
        folio_orders = self.search([('checkout_date', '>=', from_date),
                                    ('checkout_date', '<=', to_date),
                                    ('reservation_status', '=', 'checkin')])
        checkout_rooms = []
        for folio in folio_orders:
            for line in folio.lines:
                checkout_rooms.append({'room_id': line.product_id.id,
                                       'room_name': line.product_id.name})

        return checkout_rooms

    @api.multi
    def get_room_service123(self, line_id):
        service_order = self.env['pos.order'].sudo().search([
                                    ('reservation_status', '=', 'checkin')])
        service_room = []
        state = 'draft'
        for order in service_order:
            if(order.hm_service_line_ids):
                service_line = self.env['hm.service.line'].sudo().search([
                                    ('pos_order_id', '=', order.id),
                                    ('state', '=', 'draft')])
                if(service_line):
                    state = 'draft'
                else:
                    state = 'delivered'
                close_service_line = self.env['hm.service.line'].sudo().search([
                                        ('pos_order_id', '=', service_order.id),
                                        ('state', '=', 'close')])
                if(close_service_line):
                    state = 'close'
            for line in order.lines:
                if(state != 'close'):
                    service_room.append({'room_id': line.product_id.id,
                                         'room_name': line.product_id.name,
                                         'order_id': order.id,
                                         'partner_id': order.partner_id.id,
                                         'state': state
                                         })
        return service_room

    @api.multi
    def get_room_service(self, line_id):
 
        sql = """select sl.room_no, sl.pos_order_id, po.partner_id from hm_service_line sl 
                inner join pos_order po on po.id = sl.pos_order_id
                where sl.state != 'close'
                group by sl.room_no, sl.pos_order_id, po.partner_id order by room_no"""
        #cr = self.cr
        #cr.execute(sql)
        self._cr.execute(sql)
        services = self.env.cr.fetchall()
        service_room = []
        for val in services:
            service_prod = self.env['product.product'].sudo().search([
                                        ('product_tmpl_id', '=', val[0])],
                                                        limit=1)
            service_order = self.env['pos.order'].sudo().search([
                                            ('id', '=', val[1])])
            service_line = self.env['hm.service.line'].sudo().search([
                                    ('pos_order_id', '=', service_order.id),
                                    ('state', '=', 'draft')])
            if(service_line):
                state = 'draft'
            else:
                state = 'delivered'
            close_service_line = self.env['hm.service.line'].sudo().search([
                                    ('pos_order_id', '=', service_order.id),
                                    ('state', '=', 'close')])
            if(close_service_line):
                state = 'close'
            if(state != 'close'):
                service_room.append({'room_id': service_prod.id,
                                     'room_name': service_prod.name,
                                     'order_id': service_order.id,
                                     'partner_id': service_order.partner_id.id,
                                     'state': state
                                     })
        return service_room

    @api.multi
    def get_today_reservation(self, line_id):
        date_format = '%Y-%m-%d'
        current_date = (datetime.today()).strftime(date_format)
        from_date = current_date+" 00:00:00"
        to_date = current_date+" 23:59:59"
        folio_orders = self.search([('checkin_date', '>=', from_date),
                                    ('checkin_date', '<=', to_date),
                                    ('reservation_status', '=', 'checkin')])
        checkin_rooms = []
        for folio in folio_orders:
            for line in folio.lines:
                checkin_rooms.append({'room_id': line.product_id.id,
                                      'room_name': line.room_type_id.name})

        return checkin_rooms

    @api.multi
    def get_room_order(self, product_id):
        prod = self.env['product.product'].sudo().search([
                            ('product_tmpl_id', '=', int(product_id))],
                                                limit=1)
        order_line = self.env['pos.order.line'].sudo().search([
                            ('order_id.reservation_status', '=', 'checkin'),
                            ('product_id', '=', prod.id)], limit=1)
        data = {'partner_id': order_line.order_id.partner_id.id,
                'source_order_id': order_line.order_id.id,
                'room_name': order_line.product_id.name}
        return data

    @api.multi
    def get_service_order(self, order_id):
        pos_order = self.env['pos.order'].sudo().search([
                            ('source_folio_id', '=', int(order_id))])
        lines = []
        for order in pos_order:
            for line in order.lines:
                lines.append({'line_id': line.id,
                              'product_id': line.product_id.id,
                              'qty': line.qty})
        return lines

    @api.model
    def create_pos_service_order(self, pos_order):
        print(pos_order)
        pos_session = self.env['pos.session'].browse(pos_order['pos_session_id'])
        if pos_session.state == 'closing_control' or pos_session.state == 'closed':
            pos_order['pos_session_id'] = self._get_valid_session(pos_order).id
        #=======================================================================
        # order = self.create(self._order_fields(pos_order))
        # if pos_order.get('source_folio_id'):
        #     order.update({'source_folio_id': pos_order.get('source_folio_id')})
        # if pos_order.get('room_table_id'):
        #     order.update({'table_id': pos_order.get('room_table_id')})
        # if(pos_order.get('is_service_order')):
        #     self._process_service_lines(order, pos_order)
        # return order
        #=======================================================================
