# -*- coding: utf-8 -*-

from odoo import api, fields, models, _
from odoo import SUPERUSER_ID
from odoo.exceptions import UserError
from datetime import datetime, timedelta, date
from odoo.tools import float_is_zero


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
        column_count = 3
        model = self.env['ir.model'].sudo().search([
                                    ('id', '=', int(model_id))])
        for key, value in datas.items():
            val = (key, '=', value)
            data_field.append(val)
        if(datas.get('mobile') != ''):
            if(model.model == 'pos.order'):
                data_field.append(('reservation_status', 'in', ('reserved', 'checkin')))
                order = self.env[model.model].sudo().search(data_field, limit=1,
                                                            order='id desc')
                order_id = order.id
        if(sub_template_id != 'false'):
            sub_form_temp = self.env['hm.sub.form.template'].sudo().search([
                                    ('id', '=', int(sub_template_id))])
            form_name = sub_form_temp.name
            for sub_line in sorted(sub_form_temp.form_template_line_ids, key=lambda x: x.sequence):
                temp_design = self.get_sub_form(sub_line.form_template_id.id, sub_line.color, order_id)
                center_panel_design.append(temp_design)
                form_view = sub_line.form_template_id.form_view
                column_count = sub_line.form_template_id.column_count
        result.append({
                    'form_name': form_name,
                    'form_view': form_view,
                    'center_panel_temp': center_panel_design,
                    'center_panel_sub_id': center_panel_sub_id,
                    'column_count': column_count
                    })
        return result

    @api.multi
    def get_center_panel_form(self, sub_template_id, order_id):
        center_panel_sub_id = sub_template_id
        center_panel_design = []
        result = []
        form_name = ''
        form_view = ''
        model_name = ''
        column_count = 3
        floor = self.env['restaurant.floor'].sudo().search([
                                ('is_room_service', '=', True)], limit=1)
        if(sub_template_id != 'false'):
            sub_form_temp = self.env['hm.sub.form.template'].sudo().search([
                                    ('id', '=', int(sub_template_id))])
            form_name = sub_form_temp.name
            for sub_line in sorted(sub_form_temp.form_template_line_ids, key=lambda x: x.sequence):
                temp_design = self.get_sub_form(sub_line.form_template_id.id, sub_line.color, order_id)
                center_panel_design.append(temp_design)
                form_view = sub_line.form_template_id.form_view
                column_count = sub_line.form_template_id.column_count
                model_name = sub_line.form_template_id.form_model_id.model

        result.append({
                       'form_name': form_name,
                       'form_view': form_view,
                       'center_panel_temp': center_panel_design,
                       'center_panel_sub_id': center_panel_sub_id,
                       'floor_id': floor.id,
                       'column_count': column_count,
                       'model_name': model_name,
                       })
        return result;

    @api.multi
    def get_restaurant_table(self, floor_id, form_sub_id):
        tables = []
        if floor_id:
            floor_table_ids = self.env['restaurant.table'].sudo().search([
                                ('floor_id', '=', int(floor_id))])
            for floor_table in floor_table_ids:
                room_manage_id = self.env['room.manage'].sudo().search([
                                ('room_no', '=', floor_table.product_id.id),
                                ('state', '=', 'inprogress')])
                service_order = self.env['pos.order'].sudo().search([
                                    ('order_zone', '=', 'room_service'),
                                    ('service_status', '!=', 'close'),
                                    ('table_id', '=', floor_table.id)],
                                                        limit=1)
                product = self.env['product.product'].sudo().search([
                                ('product_tmpl_id', '=',
                                 floor_table.product_id.id)], limit=1)
                folio_order = self.env['pos.order.line'].sudo().search([
                                ('product_id', '=', product.id),
                                ('order_id.reservation_status', 'in', ('checkin', 'shift', 'extend'))],
                                                        limit=1)
                sub_form_line = self.env['hm.sub.form.template.line'].sudo().search(
                                [('sub_form_template_id', '=', int(form_sub_id))],
                                limit=1)
                form_template = self.env['hm.form.template'].sudo().search([
                                ('id', '=', sub_form_line.form_template_id.id)])
                if(form_template.form_model_id.model == 'hm.house.keeping'):
                    model_data = self.env[form_template.form_model_id.model].sudo().search([
                                    ('room_no', '=', floor_table.product_id.id),
                                    ('state', '!=', 'done')], limit=1)
                else:
                    if(form_template.form_model_id.model != 'pos.order'):
                        if(form_template.form_model_id.model == 'hm.house.keeping'):
                            model_data = self.env[form_template.form_model_id.model].sudo().search([
                                        ('pos_order_id', '=', folio_order.order_id.id)])
                        else:
                            model_data = self.env['pos.order']
                    else:
                        model_data = self.env[form_template.form_model_id.model].sudo().search([
                                    ('id', '=', folio_order.order_id.id)])
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
                               'orderid': service_order.id or 0,
                               'folioid': folio_order.order_id.id or 0,
                               'model_data': model_data.id,
                               'model_name': form_template.form_model_id.model
                               })
        return tables

    @api.multi
    def get_roomsupply_items(self, room_id, floor_id):
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
                                            ('product_id', '=', int(room_id)),
                                            ('floor_id', '=', int(floor_id))])
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
    def get_product_roomtype(self, room_id):
        """ Get Room type while select room"""
        room_type = []
        product = self.env['product.product'].sudo().search([
                                ('id', '=', int(room_id))])
        if product.product_tmpl_id.categ_id.is_room:
            room_type.append({
                              'id': product.product_tmpl_id.categ_id.id,
                              'name': product.product_tmpl_id.categ_id.name,
                              'capacity': product.product_tmpl_id.capacity,
                            })
        return room_type

    @api.multi
    def get_categ_products(self, categ_id):
        """ Get respective products while select room type"""
        room_ids = []
        product_ids = self.env['product.template'].sudo().search([
                                ('categ_id', '=', int(categ_id)),
                                ('available_in_pos', '=', True),
                                ])
        for product_temp in product_ids:
            product = self.env['product.product'].sudo().search([
                                ('product_tmpl_id', '=', product_temp.id)])
            is_booked = False
            prod_history = self.env['product.history'].sudo().search([('product_tmpl_id', '=', product.product_tmpl_id.id),
                                                                      ('state', 'in', ('reserved', 'checkin'))])
            if(prod_history):
                is_booked = True
            if product.id:
                room_ids.append({
                                  'id': product.id,
                                  'name': product.name,
                                  'is_booked': is_booked
                                })
        return room_ids

    @api.multi
    def get_product_room(self, categ_id, checkin_date, checkout_date, order_id):
        """ Get Product Room for particular Period """
        room_ids = []
        #from_date = in_date+" 00:00:00"
        #to_date = out_date+" 23:59:59"
        #checkin_date = datetime.strptime(from_date, '%Y-%m-%d %H:%M:%S')
        #checkout_date = datetime.strptime(to_date, '%Y-%m-%d %H:%M:%S')
        if(int(categ_id) > 0):
            product_ids = self.env['product.template'].sudo().search([
                                        ('categ_id', '=', int(categ_id)),
                                        ('available_in_pos', '=', True),
                                        ])
        else:
            product_ids = self.env['product.template'].sudo().search([
                                        ('categ_id.is_room', '=', True),
                                        ('available_in_pos', '=', True),
                                        ])
        for product_temp in product_ids:
            product = self.env['product.product'].sudo().search([
                                    ('product_tmpl_id', '=', product_temp.id)])
            is_booked = False
            #===================================================================
            # prod_history = self.env['product.history'].sudo().search([
            #                         ('product_tmpl_id', '=', product_temp.id),
            #                         ('state', 'in', ('reserved', 'checkin')),
            #                         ('date', '>=', checkin_date),
            #                         ('out_date', '<=', checkout_date)])
            #===================================================================
            sql = "select * from product_history ph where ph.product_tmpl_id = "+str(product_temp.id)+" \
                    and ((ph.date between '"+checkin_date+"' and '"+checkout_date+"') \
                    or ((ph.out_date - INTERVAL '1 DAY') between '"+checkin_date+"' and '"+checkout_date+"')) and state in ('reserved', 'checkin', 'shift', 'extend')"
            if(int(order_id) > 0):
                sql += " and order_id !="+str(order_id)+""
            cr = self.env.cr
            cr.execute(sql)
            prod_history = cr.dictfetchall()
            if(len(prod_history) > 0):
                is_booked = True
            if product.id:
                room_ids.append({
                            'id': product.id,
                            'name': product.name,
                            'is_booked': is_booked
                        })
        return room_ids

    def get_sub_ids(self, form_view):
        if(form_view == 'room_reservation'):
            return ''
        else:
            form_template = self.env['hm.form.template'].sudo().search([
                ('form_view', '=', form_view)])
            sub_form_template = self.env['hm.sub.form.template.line'].sudo().search([
                ('form_template_id', '=', form_template.id)])
            return sub_form_template.sub_form_template_id.id

    @api.multi
    def get_sub_form(self, form_template_id, color, order_id):
        panel_form_temp = self.env['hm.form.template'].sudo().search([
                                ('id', '=', form_template_id)])
        porder = self.env['pos.order'].sudo().search([('id', '=', int(order_id))])
        invoice_ids = [0]
        if panel_form_temp.form_view == 'list':
            if(porder):
                invoice_ids.append(porder.invoice_id.id)
            if panel_form_temp.form_model_id.model == 'account.invoice':
                if(porder):
                    service_order = self.env['pos.order'].sudo().search([
                                                ('order_zone', '=', 'room_service'),
                                                ('source_folio_id', '=', porder.id)])
                    for sorder in service_order:
                        invoice_ids.append(sorder.invoice_id.id)
                model_datas = self.env[panel_form_temp.form_model_id.model].search(
                                                    [('id', 'in', invoice_ids)])
            #===================================================================
            # if is_pay:
            #     if panel_form_temp.form_model_id.model == 'account.invoice':
            #         service_order = self.env['pos.order'].sudo().search([
            #                                     ('is_service_order', '=', True),
            #                                     ('source_folio_id', '=', porder.id)])
            #         for sorder in service_order:
            #             invoice_ids.append(sorder.invoice_id.id)
            #         model_datas = self.env[panel_form_temp.form_model_id.model].search(
            #                                             [('id', 'in', invoice_ids)])
            # else:
            #     if porder.invoice_id:
            #         #invoice_ids = eval('[' + invoice_ids + ']')
            #         model_datas = self.env[panel_form_temp.form_model_id.model].search(
            #                                             [('id', 'in', porder.invoice_id.ids)])
            #===================================================================

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
        res_table_sub_id = 0
        result_datas = []
        for form_line in sorted(panel_form_temp.form_template_line_ids, key=lambda x: x.sequence):
            if form_line.form_field_id:
                fields.append(form_line.form_field_id.name)
                field_type.append(form_line.form_field_id.ttype)
            if form_line.form_field_type == 'sub_form' or form_line.form_field_type == 'view_buttons' or form_line.form_field_type == 'button' or form_line.form_field_type == 'menu':
                sub_form_temp_ids.append(form_line.sub_template_id.id)
                res_table_sub_id = form_line.sub_template_id.id
            selection_items = []
            if form_line.form_template_selection_fields:
                sql = "select hm_form_selection_item_id from hm_form_selection_item_hm_form_template_line_rel where hm_form_template_line_id = "+str(form_line.id)+""
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
                        arr['is_booked'] = False
                        if form_line.form_field_id.relation == 'product.product':
                            prod_tmpl = self.env['product.template'].sudo().search([('id', '=', rec.product_tmpl_id.id)])
                            arr['amount'] = prod_tmpl.list_price
                            prod_history = self.env['product.history'].sudo().search([('product_tmpl_id', '=', prod_tmpl.id),
                                                                                      ('state', 'in', ('reserved', 'checkin'))])
                            if(prod_history):
                                arr['is_booked'] = True
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
                     'model_method': form_line.model_method,
                     'readonly': form_line.readonly
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
                            odate = ''
                            if order[field]:
                                odate = datetime.strftime(order[field], '%a %m-%d-%Y %H:%M %p')
                            order_data[field] = odate
                        else:
                            order_data[field] = order[field] or ''
                        count = count + 1
                    order_data['id'] = order['id']
                    order_data['state'] = order['state']
                    if(panel_form_temp.form_model_id.model == 'hm.house.keeping'):
                        order_data['name'] = ''
                    else:
                        order_data['name'] = order['name']
                    if(panel_form_temp.form_model_id.model == 'pos.order'):
                        order_data['reservation_status'] = order['reservation_status']
                    else:
                        order_data['reservation_status'] = ''
                    current_order.append(order_data)
            elif(panel_form_temp.form_model_id.model == 'hm.checkout.date.extend' or panel_form_temp.form_model_id.model == 'hm.shift.room'):
                orders = self.env['pos.order'].sudo().search([('id', '=', int(order_id))])
                order_line = self.env['pos.order.line'].sudo().search([
                                        ('order_id', '=', int(order_id))],
                                                order='id desc', limit=1)
                if orders:
                    for order in orders:
                        order_data = {}
                        count = 0
                        for field in fields:
                            if field_type[count] == 'many2one':
                                if(field == 'room_id' or field == 'old_room_id'):
                                    order_data[field] = order_line['product_id'].display_name or ''
                                elif(field == 'old_room_type_id'):
                                    order_data[field] = order_line['room_type_id'].display_name or ''
                                elif(field == 'pos_order_id'):
                                    order_data[field] = order['name'] or ''
                                elif(field == 'guest_name_id'):
                                    order_data[field] = order['partner_id'].display_name or ''
                                elif(field == 'new_room_id'):
                                    order_data[field] = ''
                                elif(field == 'old_plan_type_id' or field == 'new_plan_type_id'):
                                    order_data[field] = ''
                                elif(field == 'new_room_type_id'):
                                    order_data[field] = ''
                                else:
                                    order_data[field] = order[field].display_name or ''
                            elif field_type[count] == 'datetime':
                                odate = False
                                if(field == 'extend_checkout_date'):
                                    odate = ''
                                else:
                                    if order[field]:
                                        odate = datetime.strftime(order[field], '%a %m-%d-%Y %H:%M %p')
                                order_data[field] = odate
                            else:
                                if(field == 'remark'):
                                    order_data[field] = ''
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
                                        arr['is_booked'] = False
                                        if line.form_field_id.relation == 'product.product':
                                            prod_tmpl = self.env['product.template'].sudo().search([('id', '=', rec.product_tmpl_id.id)])
                                            arr['amount'] = prod_tmpl.list_price
                                            prod_history = self.env['product.history'].sudo().search([('product_tmpl_id', '=', prod_tmpl.id),
                                                                                                      ('state', 'in', ('reserved', 'checkin'))])
                                            if(prod_history):
                                                arr['is_booked'] = True
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
                                     'model_method': line.model_method,
                                     'readonly': line.readonly
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
            if(panel_form_temp.form_model_id.model == 'pos.order'):
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
        """ List View """
        if panel_form_temp.form_view == 'list':
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
                order_data['id'] = data['id']
                if panel_form_temp.form_model_id.model == 'account.invoice':
                    order = self.env['pos.order'].sudo().search([('invoice_id', '=', data['id'])])
                    order_data['order_id'] = order.id
                    order_data['cust_id'] = data.partner_id.id
                    #===========================================================
                    # paid_amount1 = 0
                    # paid_amount2 = 0
                    # if pos_order.statement_ids:
                    #     paid_amount1 = sum([x.amount for x in pos_order.statement_ids if not x.journal_id.is_pay_later])
                    # account_payment = self.env['account.payment'].sudo().search(
                    #                        [('invoice_ids', 'in', data.id)])
                    # if account_payment:
                    #     paid_amount2 = sum([x.amount for x in account_payment if not x.journal_id.is_pay_later])
                    # paid_amount = paid_amount1 + paid_amount2
                    # diff = (data.amount_total - paid_amount)
                    # amt = round(diff, 2)
                    # if diff == 0:
                    #     amt = 0
                    # order_data['residual'] = amt
                    #===========================================================
                    order_data['residual'] = data.residual
                result_datas.append(order_data)
            sub_temp = self.env['hm.sub.form.template'].sudo().search([
                                ('id', 'in', sub_form_temp_ids)])
            for temp in sub_temp:
                sub_temp_line = self.env['hm.sub.form.template.line'].sudo().search(
                            [('sub_form_template_id', '=', temp.id)],
                            order='sequence asc')

                temp_array = []
                for sline in sub_temp_line:
                    temp_array.append({'id': sline.id,
                                       'name': sline.name,
                                       'color': sline.color
                                    })
                sub_form_template[temp.id] = temp_array
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
                       'result_datas': result_datas,
                       'sub_form_template': sub_form_template,
                       'template_lines': template_lines,
                       #'available_rooms': available_rooms,
                       'current_order': current_order,
                       'current_order_lines': current_order_lines,
                      # 'form_temp_id': form_template.id,
                       'model_name': panel_form_temp.form_model_id.model,
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
                       'res_table_sub_id': res_table_sub_id,
                       'column_count': panel_form_temp.column_count,
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
                        arr['is_booked'] = False
                        if line.form_field_id.relation == 'product.product':
                            prod_tmpl = self.env['product.template'].sudo().search([('id', '=', rec.product_tmpl_id.id)])
                            arr['amount'] = prod_tmpl.list_price
                            prod_history = self.env['product.history'].sudo().search([('product_tmpl_id', '=', prod_tmpl.id),
                                                                                      ('state', 'in', ('reserved', 'checkin'))])
                            if(prod_history):
                                arr['is_booked'] = True
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
                model_method_datas[line.id] = model_datas
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
                     'model_method': line.model_method,
                     'readonly': line.readonly
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
                    if(form_template.form_model_id.model == 'pos.order'):
                        order_data['reservation_status'] = order['reservation_status']
                    else:
                        order_data['reservation_status'] = ''
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
                order_data['reservation_status'] = ''
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
                                        arr['is_booked'] = False
                                        if line.form_field_id.relation == 'product.product':
                                            prod_tmpl = self.env['product.template'].sudo().search([('id', '=', rec.product_tmpl_id.id)])
                                            arr['amount'] = prod_tmpl.list_price
                                            prod_history = self.env['product.history'].sudo().search([('product_tmpl_id', '=', prod_tmpl.id),
                                                                                                ('state', 'in', ('reserved', 'checkin'))])
                                            if(prod_history):
                                                arr['is_booked'] = True
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
                                     'model_method': line.model_method,
                                     'readonly': line.readonly
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
                       'model_method_datas': model_method_datas,
                       'column_count': form_template.column_count,
                       })

        return result

    @api.model
    def popup_create_order(self, post, order_id, model_name):
        if(post.get('folio_no')):
            if(post.get('folio_no') == 'Folio'):
                post['folio_no'] = False
        if(int(order_id) > 0):
            model = self.env[model_name].sudo().search([('id', '=', int(order_id))])
            model.update(post)
        else:
            self.env[model_name].create(post)


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
        #post = eval(post)
        order = self.env['pos.order'].sudo().search([('id', '=', int(order_id))])
        order_check_out_date = order.checkout_date.strftime('%Y-%m-%d')
        reason = post.get('remark') or ''
        order_room = self.env['pos.order.line'].sudo().search([('order_id', '=', order.id)], limit=1)
        is_shift_room = False
        is_extend_room = False
        if post.get('order_line') and not post.get('new_room_id'):
            if(order_room.product_id.id != post.get('order_line')[0]['product_id']):
                is_shift_room = True
        if post.get('order_line') and not post.get('extend_checkout_date'):
            edate = datetime.strptime(post.get('checkout_date'), '%Y-%m-%d %H:%M:%S')
            extend_date = edate.strftime('%Y-%m-%d')
            if(order_check_out_date != extend_date):
                is_extend_room = True
        if(post.get('extend_checkout_date') or is_extend_room):
            if(post.get('extend_checkout_date')):
                edate = datetime.strptime(post.get('extend_checkout_date'), '%Y-%m-%d %H:%M:%S')
                extend_date = edate.strftime('%Y-%m-%d')
                post['checkout_date'] = post.get('extend_checkout_date')
                extend_checkout_date = post.get('extend_checkout_date')
            else:
                extend_checkout_date = post.get('checkout_date')
            if(order_check_out_date != extend_date):
                self.env['hm.checkout.date.extend'].sudo().create({'pos_order_id': order.id,
                                                                   'room_id': order_room.product_id.id,
                                                                   'checkin_date': order.checkin_date,
                                                                   'checkout_date': order.checkout_date,
                                                                   'state': post.get('reservation_status'),
                                                                   'extend_checkout_date': extend_checkout_date,
                                                                   'remark': reason})
                prod_history = self.env['product.history'].sudo().search([
                                        ('order_id', '=', order.id),
                                        ('state', '=', 'checkin')])
                prod_history.write({'out_date': extend_checkout_date,
                                    'state': post.get('reservation_status'),
                                    })
            if(post.get('extend_checkout_date')):
                del post['room_id']
                if(post.get('pos_order_id')):
                    del post['pos_order_id']
                del post['extend_checkout_date']
                del post['remark']
        if post.get('new_room_id') or is_shift_room:
            if post.get('new_room_id'):
                new_room_id = int(post.get('new_room_id'))
                new_room_type_id = int(post.get('new_room_type_id'))
            else:
                new_room_id = int(post.get('order_line')[0]['product_id'])
                new_room_type_id = int(post.get('order_line')[0]['room_type_id'])
            if(order_room.product_id.id != new_room_id):
                """ Old Room Details """
                prod_history = self.env['product.history'].sudo().search([
                                        ('order_id', '=', order.id),
                                        ('state', '=', 'checkin')])
                prod_history.write({'state': 'draft'})
                prod_prod = self.env['product.product'].sudo().search([
                                        ('id', '=', order_room.product_id.id)])
                prod_temp = self.env['product.template'].sudo().search([
                                        ('id', '=', prod_prod.product_tmpl_id.id)])
                prod_temp.write({'state': 'available'})
                """ New Room Details """
                new_prod_prod = self.env['product.product'].sudo().search([
                                        ('id', '=', new_room_id)])
                new_prod_temp = self.env['product.template'].sudo().search([
                                        ('id', '=', new_prod_prod.product_tmpl_id.id)])
                new_prod_temp.write({'state': 'occupied'})
                room_history = self.env['product.history'].sudo().search([
                                        ('product_id', '=', new_prod_prod.id),
                                        ('order_id', '=', order.id)])
                room_data = {
                            'product_id': new_prod_prod.id,
                            'product_tmpl_id': new_prod_temp.id,
                            'order_id': order.id,
                            'state': post.get('reservation_status'),
                            'date': order.checkin_date,
                            'out_date': order.checkout_date,
                            }
                if(room_history):
                    self.env['product.history'].update(room_data)
                else:
                    self.env['product.history'].sudo().create(room_data)
                self.env['hm.shift.room'].sudo().create({
                                'pos_order_id': order.id,
                                'checkin_date': order.checkin_date,
                                'guest_name_id': order.partner_id.id,
                                'referred_by_id': order.referred_by_id,
                                'old_room_id': order_room.product_id.id,
                                'new_room_id': new_room_id,
                                'old_room_type_id': order_room.room_type_id.id,
                                'new_room_type_id': new_room_type_id,
                                'remark': reason
                            })
                if post.get('new_room_id'):
                    line_data = {}
                    line_data['product_id'] = new_room_id
                    line_data['room_type_id'] = new_room_type_id
                    post['order_line'].append(line_data)
                    del post['old_room_id']
                    del post['new_room_id']
                    del post['old_room_type_id']
                    del post['new_room_type_id']
                    if(post.get('pos_order_id')):
                        del post['pos_order_id']
                    del post['guest_name_id']
                    del post['remark']
        if(order):
            if post:
                # To update state for product_history and product_template
                # product_id = post['order_line'][0]['product_id']
                product_history = self.env['product.history'].sudo().search([
                                        ('order_id', '=', order.id)],
                                                order='id desc', limit=1)
                product_tmpl_id = product_history.product_tmpl_id
                product_template = self.env['product.template'].sudo().search(
                                        [('id', '=', product_tmpl_id.id)])
                #===============================================================
                # if(product_history.state == 'draft'):
                #     product_history.write({'state': 'checkin'})
                #     product_template.write({'state': 'occupied'})
                #===============================================================
                if post.get('order_line'):
                    order_lines = post.get('order_line')
                    i = 0
                    for line in order.lines:
                        line.update(order_lines[i])
                        i = i + 1
                del post['order_line']
                order.update(post)
                order.lines._onchange_product_id()
                order.lines._onchange_amount_line_all()
                currency = order.pricelist_id.currency_id
                order.amount_paid = sum(payment.amount for payment in order.statement_ids)
                order.amount_return = sum(payment.amount < 0 and payment.amount or 0 for payment in order.statement_ids)
                order.amount_tax = currency.round(sum(self._amount_line_tax(line, order.fiscal_position_id) for line in order.lines))
                amount_untaxed = currency.round(sum(line.price_subtotal for line in order.lines))
                order.amount_total = order.amount_tax + amount_untaxed
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
                                       'room_name': line.product_id.name,
                                       'order_id': folio.id})

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
 
        #=======================================================================
        # sql = """select sl.room_no, sl.pos_order_id, po.partner_id from hm_service_line sl 
        #         inner join pos_order po on po.id = sl.pos_order_id
        #         where sl.state != 'close'
        #         group by sl.room_no, sl.pos_order_id, po.partner_id order by room_no"""
        #=======================================================================
        #cr = self.cr
        #cr.execute(sql)
        sql = """ select id from pos_order where order_zone = 'room_service' and service_status != 'close' """
        self._cr.execute(sql)
        services = self.env.cr.fetchall()
        service_room = []
        for val in services:
            service_order = self.env['pos.order'].sudo().search([
                                             ('id', '=', val[0])])
            service_room.append({'room_id': service_order.table_id.product_id.id,
                                 'room_name': service_order.table_id.product_id.name,
                                 'order_id': service_order.id,
                                 'partner_id': service_order.partner_id.id,
                                 'state': service_order.service_status,
                                 'source_folio_id': service_order.source_folio_id.id
                                })
            #===================================================================
            # service_prod = self.env['product.product'].sudo().search([
            #                             ('product_tmpl_id', '=', val[0])],
            #                                             limit=1)
            # service_order = self.env['pos.order'].sudo().search([
            #                                 ('id', '=', val[1])])
            # service_line = self.env['hm.service.line'].sudo().search([
            #                         ('pos_order_id', '=', service_order.id),
            #                         ('state', '=', 'draft')])
            # if(service_line):
            #     state = 'draft'
            # else:
            #     state = 'delivered'
            # close_service_line = self.env['hm.service.line'].sudo().search([
            #                         ('pos_order_id', '=', service_order.id),
            #                         ('state', '=', 'close')])
            # if(close_service_line):
            #     state = 'close'
            # if(state != 'close'):
            #     service_room.append({'room_id': service_prod.id,
            #                          'room_name': service_prod.name,
            #                          'order_id': service_order.id,
            #                          'partner_id': service_order.partner_id.id,
            #                          'state': state
            #                          })
            #===================================================================
        return service_room

    @api.multi
    def get_today_reservation(self, line_id):
        date_format = '%Y-%m-%d'
        current_date = (datetime.today()).strftime(date_format)
        from_date = current_date+" 00:00:00"
        to_date = current_date+" 23:59:59"
        folio_orders = self.search([('checkin_date', '>=', from_date),
                                    ('checkin_date', '<=', to_date),
                                    ('reservation_status', '=', 'reserved')])
        checkin_rooms = []
        for folio in folio_orders:
            for line in folio.lines:
                checkin_rooms.append({'room_id': line.product_id.id,
                                      'room_name': line.room_type_id.name,
                                      'order_id': folio.id})

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
                            ('id', '=', int(order_id))])
        lines = []
        for order in pos_order:
            for line in order.lines:
                lines.append({'line_id': line.id,
                              'product_id': line.product_id.id,
                              'qty': line.qty})
        return lines

    @api.model
    def create_pos_service_order(self, pos_order):
        pos_session = self.env['pos.session'].browse(pos_order['pos_session_id'])
        if pos_session.state == 'closing_control' or pos_session.state == 'closed':
            pos_order['pos_session_id'] = self._get_valid_session(pos_order).id
        if(pos_order.get('exit_order_id') > 0):
            order = self.env['pos.order'].sudo().search([('id', '=', int(pos_order.get('exit_order_id')))])
            exit_order_line_ids = order.lines.ids
            order_line_ids = []
            if(pos_order.get('lines')):
                for line in pos_order.get('lines'):
                    print(line)
                    if(line[2].get('room_line_id')):
                        order_line_ids.append(line[2].get('room_line_id'))
                        pos_order_line = self.env['pos.order.line'].sudo().search(
                                    [('id', '=', line[2].get('room_line_id'))])
                        del line[2]['id']
                        del line[2]['room_line_id']
                        del line[2]['note']
                        pos_order_line.update(line[2])
                    else:
                        line[2]['order_id'] = order.id
                        line[2]['source_order_id'] = pos_order.get('source_folio_id')
                        pos_order_line = self.env['pos.order.line'].sudo().create(line[2])
                        print(pos_order_line)

                line_ids = [elem for elem in exit_order_line_ids if elem not in order_line_ids ]
                if line_ids:
                    order_line = self.env['pos.order.line'].sudo().search([('id', 'in', line_ids)])
                    order_line.unlink()
        else:
            order = self.create(self._order_fields(pos_order))
            if pos_order.get('source_folio_id'):
                order.update({'source_folio_id': pos_order.get('source_folio_id')})
            if pos_order.get('room_table_id'):
                order.update({'table_id': pos_order.get('room_table_id')})
            if(pos_order.get('is_service_order')):
                order.update({'order_zone': 'room_service'})
                order.update({'is_service_order': pos_order.get('is_service_order')})
                order.lines.update({'source_order_id': pos_order.get('source_folio_id')})
        return order

    @api.model
    def update_service_order(self, order_id, status):
        if(status == 'delivery'):
            pos_order = self.env['pos.order'].sudo().search([
                                    ('id', '=', int(order_id))])
            pos_order.update({'service_status': 'delivered'})
        else:
            pos_order = self.env['pos.order'].sudo().search([
                                    ('id', '=', int(order_id))])
            account_journal = self.env['account.journal'].sudo().search([
                                                ('is_pay_later', '=', True)],
                                                            limit=1)
            account_statement = self.env['account.bank.statement'].sudo().search(
                                [('pos_session_id', '=', pos_order.session_id.id),
                                 ('journal_id', '=', account_journal.id)])
            current_date = (datetime.today()).strftime('%Y-%m-%d %H:%M:%S')
            prec_acc = pos_order.pricelist_id.currency_id.decimal_places
            journal_ids = set()

            if(pos_order.invoice_id):
                paid_amount = sum([x.amount for x in pos_order.statement_ids])
                invoice_amount = pos_order.invoice_id.amount_total - paid_amount
                if not float_is_zero(invoice_amount, precision_digits=prec_acc):
                    pos_order.add_payment(self._payment_fields({'name': current_date, 
                                                                'partner_id': pos_order.partner_id.id,
                                                                'statement_id': account_statement.id, 
                                                                'account_id': account_journal.default_debit_account_id, 
                                                                'journal_id': account_journal.id, 
                                                                'amount': invoice_amount}))
                pos_order.update({'service_status': 'close'})
            else:
                pos_order.action_pos_order_invoice()
                pos_order.invoice_id.sudo().action_invoice_open()
                pos_order.account_move = pos_order.invoice_id.move_id

                if not float_is_zero(pos_order.invoice_id.residual, precision_digits=prec_acc):
                    pos_order.add_payment(self._payment_fields({'name': current_date, 
                                                                'partner_id': pos_order.partner_id.id,
                                                                'statement_id': account_statement.id, 
                                                                'account_id': account_journal.default_debit_account_id, 
                                                                'journal_id': account_journal.id, 
                                                                'amount': pos_order.invoice_id.residual}))
                journal_ids.add(account_journal.id)
                pos_order.update({'service_status': 'close'})
        return True

    @api.model
    def checkout_complaint(self, folio_id):
        check_out_order = self.env['pos.order'].sudo().search([('id', '=', int(folio_id))])
        current_date = (datetime.today()).strftime('%Y-%m-%d')
        checkout_date = check_out_order.checkout_date.strftime('%Y-%m-%d')
        if(checkout_date > current_date):
            return False
        else:
            return True


class Complaint(models.Model):
    _inherit = 'hm.complaint'

    @api.model
    def create_complaint(self, folio_id, reason):
        folio = self.env['pos.order'].sudo().search([('id', '=', int(folio_id))])
        folio_line = self.env['pos.order.line'].sudo().search([('order_id', '=', folio.id)], limit=1)
        complaint = self.env['hm.complaint']
        complaint.create({'room_id': folio_line.product_id.id,
                          'pos_order_id': folio.id,
                          'service_line_id': folio_line.id,
                          'guest_name_id': folio.partner_id.id,
                          'complaint': reason})
        return True
