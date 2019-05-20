# -*- coding: utf-8 -*-

from odoo import api, fields, models, _
from odoo import SUPERUSER_ID
from odoo.exceptions import UserError
from datetime import datetime, timedelta
from odoo.tools import float_is_zero


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
    def get_vendor_list(self, category_id, dashboard_id, line_id, is_form, sub_temp_id, order_id, vendor_id = 0, invoice_ids = [], picking_ids = [], is_pay=False):
        """ is_pay: Create a Payment """
        vendor_dashboard = self.env['hm.vendor.dashboard'].sudo().search(
                                        [('id', '=', int(dashboard_id))])
        is_other = False
        if is_pay:
            if int(sub_temp_id):
                sub_template = self.env['hm.sub.form.template.line'].sudo().search([('id', '=', int(sub_temp_id))])
                form_template = self.env['hm.form.template'].sudo().search(
                                [('id', '=', sub_template.form_template_id.id)])
                form_template_line = self.env['hm.form.template.line'].sudo().search(
                                    [('form_template_id', '=', form_template.id)],
                                    order='sequence asc')
            else:
                form_template = self.env['hm.form.template'].sudo().search(
                                [('vendor_dashboard_id', '=', int(dashboard_id)),
                                 ('form_view', '!=', 'form')])
                form_template_line = self.env['hm.form.template.line'].sudo().search(
                                    [('form_template_id', '=', form_template.id)],
                                    order='sequence asc')
        else:

            vendors = self.env['res.partner'].sudo().search(
                                [('supplier', '=', True),
                                 ('category_id', 'in', [int(category_id)])])
            vendor_categ = self.env['res.partner.category'].sudo().search([
                                                    ('id', '=', int(category_id))])
            if is_form:
                sub_template = self.env['hm.sub.form.template.line'].sudo().search([('id', '=', int(sub_temp_id))])
                form_template = self.env['hm.form.template'].sudo().search(
                                [('id', '=', sub_template.form_template_id.id)])
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
        if form_template.form_view == 'list':
            if is_pay:
                if form_template.form_model_id.model == 'account.invoice':
                    pos_order_line = self.env['pos.order.line'].sudo().search([('id', '=', int(order_id))])
                    pos_order = self.env['pos.order'].sudo().search([('id', '=', pos_order_line.order_id.id)])
                    model_datas = self.env[form_template.form_model_id.model].search([('id', '=', pos_order.invoice_id.id)])
                else:
                    if form_template.form_model_id.model == 'pos.order.line':
                        reservation = self.env['pos.order'].sudo().search([('reservation_status', '=', 'checkin')])
                        model_datas = self.env[form_template.form_model_id.model].search([('order_id', 'in', reservation.ids)])
                    else:
                        model_datas = self.env[form_template.form_model_id.model].search([])
            else:
                if invoice_ids:
                    invoice_ids = eval('[' + invoice_ids + ']')
                    model_datas = self.env[form_template.form_model_id.model].search(
                                                        [('id', 'in', invoice_ids)])
                elif picking_ids:
                    picking_ids = eval('[' + picking_ids + ']')
                    model_datas = self.env[form_template.form_model_id.model].search(
                                                        [('id', 'in', picking_ids)])
                else:
                    if vendor_categ.name == 'Others':
                        other_vendors = self.env['res.partner'].sudo().search(
                                    [('supplier', '=', True),
                                     ('category_id', 'in', vendor_dashboard.vendor_category_ids.ids)])
                        model_datas = self.env[form_template.form_model_id.model].search(
                                                    [('partner_id', 'in', other_vendors.ids)])
                    else:
                        if (form_template.form_model_id.model == 'pos.order'):
                            model_datas = self.env[form_template.form_model_id.model].search(
                                                        [('vendor_id', 'in', vendors.ids)])
                        else:
                            model_datas = self.env[form_template.form_model_id.model].search(
                                                        [('partner_id', 'in', vendors.ids)])
        line_group = {}
        temp_id = []
        key = 0
        count = 0
        result = []
        template_lines = []
        fields = []
        field_type = []
        sub_form_temp_ids = []

        for line in form_template_line:
            if line.form_field_id:
                fields.append(line.form_field_id.name)
                field_type.append(line.form_field_id.ttype)
            if line.form_field_type == 'sub_form' or line.form_field_type == 'view_buttons' or line.form_field_type == 'button' or line.form_field_type == 'menu':
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
                    records = self.env[line.form_field_id.relation].search([])
                    records_model_fields = self.env['ir.model.fields'].search(
                        [('id', 'in', line.form_template_model_fields.ids)])
                    for rec in records:
                        arr = {}
                        for fields_rec in records_model_fields:
                            field_name = fields_rec.name
                            arr[str(field_name)] = rec[field_name]
                        many2one_list.append(arr)
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
        result_datas = []
        sub_form_template = {}
        products = []
        current_order = []
        current_order_lines = []
        sub_line_group = {}
        sub_temp_id = []
        sub_key = 0
        temp_order_lines = []
        sub_line_group_array = []
        sub_line_group_key_array = []
        #is_orderline = False
        line_tmp = 0
        line_model = ''
        all_location = []
        stock_move_datas = []
        list_array = []
        list_key_value = {}
        vendor_list = []
        available_rooms = []
        if form_template.form_view == 'report':
            for vendor in vendors:
                vendor_list.append({'id': vendor.id,
                                    'display_name': vendor.display_name})
            stock_loc = self.env['stock.location'].sudo().search([
                                ('islaundry', '=', True)], order='sequence')
            for loc in stock_loc:
                all_location.append({'id': loc.id,
                                     'name': loc.display_name})
            sql = "SELECT sp.laundry_order_id FROM stock_picking sp INNER JOIN laundry_order lo ON lo.id = sp.laundry_order_id"
            if int(vendor_id) > 0:
                sql += " WHERE lo.partner_id ="+str(vendor_id)+""
            sql += " GROUP BY laundry_order_id"
            laundryids = []
            cr = self.env.cr
            cr.execute(sql)
            match_recs = cr.dictfetchall()
            for lid in match_recs:
                laundryids.append(lid.get('laundry_order_id'))

            for laundryid in laundryids:
                list_array = []
                list_key_value = {}
                laundry = self.env['laundry.order'].sudo().search([('id', '=', int(laundryid))])
                stock_picking = self.env['stock.picking'].sudo().search([
                                    ('laundry_order_id', '=', int(laundryid))])
                stock_values = ','.join(str(v) for v in stock_picking.ids)
                sql = "select name,product_id,sum(product_uom_qty) from stock_move where picking_id in ("+ stock_values +") and state != 'cancel' group by product_id,name"
                cr = self.env.cr
                cr.execute(sql)
                match_move_recs = cr.dictfetchall()
                for move in match_move_recs:
                    move_array = []
                    for loc in stock_loc:
                        product = self.env['product.product'].sudo().search([('id', '=', move.get('product_id'))])
                        laundry_line = self.env['laundry.order.line'].sudo().search([
                                            ('laundry_obj', '=', laundry.id),
                                            ('product_id', '=', product.id)])
                        #stock_dest_move = self.env['stock.move'].sudo().search([('id', '=', move.id), ('location_dest_id', '=', loc.id)])
                        sql = "select sum(product_uom_qty) as total,\
                            ""((select COALESCE(SUM(product_uom_qty),0) from stock_move where picking_id in ("+ stock_values +") and state != 'cancel' and location_dest_id = "+str(loc.id)+" and product_id = "+str(product.id)+") - (\
                            select COALESCE(SUM(product_uom_qty),0) from stock_move where picking_id in ("+ stock_values +") and state != 'cancel' and location_id = "+str(loc.id)+" and product_id = "+str(product.id)+")) as current_total\
                            from stock_move where picking_id in ("+ stock_values +") and state != 'cancel'"
                        cr = self.env.cr
                        cr.execute(sql)
                        match_current_recs = cr.dictfetchall()
                        qty = match_current_recs[0]['current_total']
                        if(qty < 0):
                            qty = 0
                        move_array.append({'laundry_id': laundry.id,
                                           'laundry_name': laundry.name,
                                           'product_qty': laundry_line.qty,
                                           'product_id': product.id,
                                           'product_name': product.name,
                                           'qty': qty
                                           })

                    list_array.append(move_array)
                    list_key_value = list_array
                stock_move_datas.append(list_key_value)
            #print(stock_move_datas)

            #===================================================================
            # stock_picking = self.env['stock.picking'].sudo().search([
            #                                 ('laundry_order_id', '!=', None)])
            # for pick in stock_picking:
            #     list_array = []
            #     list_key_value = {}
            #     stock_move = self.env['stock.move'].sudo().search([
            #                                 ('picking_id', '=', pick.id)])
            #     for move in stock_move:
            #         move_array = []
            #         for loc in stock_loc:
            #             stock_dest_move = self.env['stock.move'].sudo().search([('id', '=', move.id), ('location_dest_id', '=', loc.id)])
            #             if stock_dest_move:
            #                 move_array.append({'laundry_id': pick.laundry_order_id.id,
            #                                          'laundry_name': pick.laundry_order_id.name,
            #                                          'reference': move.reference,
            #                                          'product_id': move.product_id.id,
            #                                          'product_name': move.product_id.name,
            #                                          'qty': stock_dest_move.product_uom_qty})
            #             else:
            #                 move_array.append({'laundry_id': pick.laundry_order_id.id,
            #                                          'laundry_name': pick.laundry_order_id.name,
            #                                          'reference': move.reference,
            #                                          'product_id': move.product_id.id,
            #                                          'product_name': move.product_id.name,
            #                                          'qty': '0'})
            #         list_array.append(move_array)
            #         list_key_value = list_array
            #     stock_move_datas.append(list_key_value)
            #===================================================================
        #print(stock_move_datas)
        if form_template.form_view == 'kanban':
            dash_categ_id = vendor_dashboard.vendor_category_id.ids

            if vendor_categ.name == 'Others':
                is_other = True
                dash_categ_id = vendor_dashboard.vendor_category_ids.ids
            for categ in dash_categ_id:
                vendor_categ = self.env['res.partner.category'].sudo().search([
                                                ('id', '=', int(categ))])
                vendors = self.env['res.partner'].sudo().search(
                            [('supplier', '=', True),
                             ('category_id', '=', categ)])
                for vendor in vendors:
                    order_data = {}
                    count = 0
                    for field in fields:
                        if field_type[count] == 'many2one':
                            order_data[field] = vendor[field].name
                        else:
                            order_data[field] = vendor[field]
                        count = count + 1
                    order_data['id'] = vendor['id']
                    order_data['category_id'] = vendor_categ.id
                    order_data['category_name'] = vendor_categ.name
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
                order_data['id'] = data['id']
                if form_template.form_model_id.model == 'account.invoice' and is_pay:
                    order_data['order_id'] = pos_order.id
                    order_data['cust_id'] = data.partner_id.id
                    paid_amount1 = 0
                    paid_amount2 = 0
                    if pos_order.statement_ids:
                        paid_amount1 = sum([x.amount for x in pos_order.statement_ids if not x.journal_id.is_pay_later])
                    account_payment = self.env['account.payment'].sudo().search(
                                           [('invoice_ids', 'in', data.id)])
                    if account_payment:
                        paid_amount2 = sum([x.amount for x in account_payment if not x.journal_id.is_pay_later])
                    paid_amount = paid_amount1 + paid_amount2
                    diff = (data.amount_total - paid_amount)
                    amt = round(diff, 2)
                    if diff == 0:
                        amt = 0
                    order_data['residual'] = amt
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

        if form_template.form_view == 'form':
            result_datas = []
            #prod_temp = self.env['product.template'].sudo().search([])
            folio_order = self.env['pos.order'].sudo().search([('reservation_status', '=', 'checkin')])
            for folio in folio_order:
                for room in folio.lines:
                    available_rooms.append({'id': room.product_id.id,
                                            'name': room.product_id.name,
                                            'folio': folio.display_name,
                                            'folio_id': folio.id,
                                            'partner_id': folio.partner_id.id,
                                            'guest': folio.partner_id.name})
            #===================================================================
            # for prod in prod_temp:
            #     products.append({'id': prod.id,
            #                      'name': prod.name})
            #===================================================================
            orders = self.env[form_template.form_model_id.model].sudo().search([('id', '=', int(order_id))])
            if orders:
                for order in orders:
                    order_data = {}
                    count = 0
                    for field in fields:
                        if field_type[count] == 'many2one':
                            order_data[field] = order[field].display_name or ''
                        else:
                            order_data[field] = order[field] or ''
                        count = count + 1
                    order_data['id'] = order['id']
                    order_data['state'] = order['state']
                    order_data['name'] = order['name']
                    order_data['picking_ids'] = []
                    if form_template.form_model_id.model == 'laundry.order':
                        order_data['invoice_ids'] = order.sale_obj.invoice_ids.ids
                    if form_template.form_model_id.model == 'sale.order':
                        order_data['invoice_ids'] = order.invoice_ids.ids
                        order_data['order_state'] = order.order_state
                        order_data['room_id'] = order.room_id.name
                    if form_template.form_model_id.model == 'pos.order':
                        order_data['invoice_ids'] = order.invoice_id.id
                        order_data['order_state'] = order.order_state
                        order_data['room_id'] = order.room_id.name
                    if form_template.form_model_id.model == 'purchase.order':
                        order_data['invoice_ids'] = order.invoice_ids.ids
                        order_data['is_shipped'] = order.is_shipped
                        order_data['picking_ids'] = order.picking_ids.ids
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
                order_data['invoice_ids'] = []
                order_data['name'] = ''
                order_data['order_state'] = ''
                order_data['picking_ids'] = []
                current_order.append(order_data)
            sub_temp = self.env['hm.sub.form.template'].sudo().search([
                                ('id', 'in', sub_form_temp_ids)])
            #sub_temp_array = {}
            line_fields = []
            line_field_type = []
            line_fields_array = []
            line_field_type_array = []

            for temp in sub_temp:
                #sub_line_group = {}
                #sub_temp_id = []
                #sub_key = 0
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
                    if tmp_line.form_field_id.ttype == 'one2many':
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
                    #line_fields_array.append({tid: line_fields})
                    #line_field_type_array.append({tid: line_field_type_array})
                #===============================================================
                # sub_line_group_key_array.append({
                #                     tid: sorted(sub_line_group.keys())
                #                     })
                # sub_line_group_array.append({
                #                       tid: sub_line_group
                #                       })
                #===============================================================
                sub_form_template[temp.id] = temp_array
            if orders:
                data_lines = []
                if form_template.form_model_id.model == 'laundry.order':
                    data_lines = orders.order_lines
                if form_template.form_model_id.model == 'account.invoice':
                    data_lines = orders.invoice_line_ids
                if form_template.form_model_id.model == 'purchase.order':
                    data_lines = orders.order_line
                if form_template.form_model_id.model == 'stock.picking':
                    data_lines = orders.move_ids_without_package
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


        #=======================================================================
        # if is_orderline:
        #     line_tmp = line.form_template.id
        #     line_model = line.form_model_id.model
        #=======================================================================
        taxi_product = self.env.ref('skit_hotel_management.car_service')

        result.append({'line_group': line_group,
                       'line_group_key': sorted(line_group.keys()),
                       'form_view': form_template.form_view,
                       'form_name': form_template.vendor_dashboard_line_id.dashboard_menu.name or form_template.name,
                       'text_color': form_template.vendor_dashboard_id.color or vendor_dashboard.color,
                       'result_datas': result_datas,
                       'sub_form_template': sub_form_template,
                       'template_lines': template_lines,
                       'available_rooms': available_rooms,
                       'current_order': current_order,
                       'current_order_lines': current_order_lines,
                       'form_temp_id': form_template.id,
                       'model_name': form_template.form_model_id.model,
                       'vendor_id': vendor_id,
                       'sub_line_group': sub_line_group,
                       'sub_line_group_key': sorted(sub_line_group.keys()),
                       'sub_line_group_key_array': sub_line_group_key_array,
                       'sub_line_group_array': sub_line_group_array,
                       'temp_order_lines': temp_order_lines,
                       'line_form_temp_id': line_tmp,
                       'line_model_name': line_model,
                       'is_other': is_other,
                       'all_location': all_location,
                       'stock_move_datas': stock_move_datas,
                       'vendor_list': vendor_list,
                       'taxi_product': taxi_product.id
                       })

        return result

    @api.multi
    def set_draft_order(self, order_id, model_name, form_temp_id):
        order = self.env[model_name].search([('id', '=', int(order_id))])
        if model_name == 'sale.order':
            order.action_draft()
        if model_name == 'purchase.order':
            order.button_draft()
        edit_form_id = self.env['hm.sub.form.template.line'].sudo().search([
                            ('form_template_id', '=', int(form_temp_id)),
                            ('name', '=', 'Edit')])
        result = {'order_id': order.id,
                  'edit_form_id': edit_form_id.id}
        return result

    @api.multi
    def cancel_order(self, order_id, model_name, form_temp_id):
        order = self.env[model_name].search([('id', '=', int(order_id))])
        if model_name == 'sale.order':
            order.update({'order_state': 'cancel'})
            order.action_cancel()
        if model_name == 'purchase.order':
            order.button_cancel()
        if model_name == 'laundry.order':
            order.cancel_order()
        edit_form_id = self.env['hm.sub.form.template.line'].sudo().search([
                            ('form_template_id', '=', int(form_temp_id)),
                            ('name', '=', 'Edit')])
        result = {'order_id': order.id,
                  'edit_form_id': edit_form_id.id}
        return result

    @api.multi
    def create_order(self, order_datas, pos_order, order_id, form_temp_id, model_name,
                     vendor_id, line_order_datas, line_form_temp_id, line_model_name):
        # partner_id = int(vendor_id)
        if order_id == '':
            order_id = 0
        if line_form_temp_id == '':
            line_form_temp_id = 0

        datas = {}
        line_datas = []
        current_date = fields.Datetime.from_string(fields.Datetime.now())
        form_template_line = self.env['hm.form.template.line'].sudo().search(
                            [('form_template_id', '=', int(form_temp_id))],
                            order='sequence asc')
        oline_form_template_line = self.env['hm.form.template.line'].sudo().search(
                            [('form_template_id', '=', int(line_form_temp_id))],
                            order='sequence asc')
        """ Get Order Details """
        for line in form_template_line:
            if line.form_field_id and line.form_field_type != 'view_buttons':
                if line.form_field_id.ttype == 'date' or line.form_field_id.ttype == 'datetime':
                    if line.form_field_id.name == 'date_order' or line.form_field_id.name == 'order_date':
                        datas[line.form_field_id.name] = current_date
                    else:
                        date = False
                        if(order_datas.get(line.form_field_id.name)):
                            date = datetime.strptime(order_datas[line.form_field_id.name], '%Y-%m-%d %H:%M:%S')
                        datas[line.form_field_id.name] = date
                else:
                    if line.form_field_type != 'sub_form':
                        if line.form_field_type == 'many2one':
                            if(order_datas[line.form_field_id.name] != ''):
                                datas[line.form_field_id.name] = int(order_datas[line.form_field_id.name])
                            else:
                                datas[line.form_field_id.name] = order_datas[line.form_field_id.name]
                        else:
                            datas[line.form_field_id.name] = order_datas[line.form_field_id.name]
            if(order_datas.get('room_id')):
                datas['room_id'] = order_datas.get('room_id')

        """ Get OrderLine Details """
        for ldata in line_order_datas:
            l_datas = {}
            for line in oline_form_template_line:
                if line.form_field_id:
                    if line.form_field_type == 'many2one':
                        if(ldata[line.form_field_id.name] != ''):
                            l_datas[line.form_field_id.name] = int(ldata[line.form_field_id.name])
                        else:
                            l_datas[line.form_field_id.name] = ldata[line.form_field_id.name]
                    else:
                        l_datas[line.form_field_id.name] = ldata[line.form_field_id.name]
            if line_model_name == 'purchase.order.line':
                l_datas['date_planned'] = current_date
                l_datas['product_uom'] = 1
            line_datas.append(l_datas)

        if int(order_id) > 0:
            order = self.env[model_name].search([('id', '=', int(order_id))])
            if order_datas.get('pickup_date') and order_datas.get('return_date'):
                datas['order_state'] = 'drop'
            else:
                if order_datas.get('pickup_date'):
                    datas['order_state'] = 'departure'
            order.update(datas)
            #===================================================================
            # if order.state == 'draft':
            #     order.update(datas)
            #===================================================================
        else:
            datas['partner_id'] = int(vendor_id)
            if model_name == 'pos.order':
                POSOrder = self.env[model_name]
                order = POSOrder.create(POSOrder._order_fields(pos_order))
                if pos_order.get('source_folio_id'):
                    order.update({'source_folio_id': pos_order.get('source_folio_id')})
                if(pos_order.get('is_service_order')):
                    order.update({'order_zone': 'taxi'})
                    order.update({'vendor_id': int(vendor_id)})
                    order.update({'is_service_order': pos_order.get('is_service_order')})
                    order.lines.update({'source_order_id': pos_order.get('source_folio_id')})
                if order:
                    self.create_vendor_invoice(order)
                    order.update({'order_state': 'booked'})
                if pos_order.get('vendor_order_details'):
                    vendor_order_details = pos_order.get('vendor_order_details')
                    del vendor_order_details['session_id']
                    del vendor_order_details['source_folio_id']
                    del vendor_order_details['date_order']
                    order.update(vendor_order_details)
                    route_ids = 0
                    for line in order.lines:
                        product_route = line.product_id.route_ids
                        route_ids = self.env['stock.location.route'].sudo().search([
                                                        ('id', 'in', product_route.ids),
                                                        ('pos_selectable', '=', True)],
                                                        limit=1)
                    if route_ids:
                        supplier_id = int(vendor_id)
                        self._pos_purchase_create_order(order, supplier_id)
            else:
                order = self.env[model_name].create(datas)
            if model_name == 'sale.order':
                amount = order_datas.get('charge')
                if order_datas.get('car_type_id'):
                    order.update({'order_state': 'booked'})
                    product_id = self.env.ref('skit_hotel_management.car_service')
                else:
                    if order_datas.get('product_id'):
                        prod_temp = self.env['product.template'].sudo().search([
                                            ('id', '=', int(order_datas['product_id']))])
                        product_id = self.env['product.product'].sudo().search([
                                            ('product_tmpl_id', '=', prod_temp.id)])
                        amount = product_id.lst_price
                self.env['sale.order.line'].create({
                                    'product_id': product_id.id,
                                    'name': '',
                                    'product_uom_qty': 1,
                                    'price_unit': amount,
                                    'tax_id': product_id.taxes_id.ids,
                                    'order_id': order.id
                                    })
            if int(line_form_temp_id) > 0:
                for ldata in line_datas:
                    prod = self.env['product.product'].sudo().search([
                                    ('id', '=', int(ldata['product_id']))])
                    if model_name == 'laundry.order':
                        ldata['laundry_obj'] = order.id
                    if model_name == 'stock.picking':
                        ldata['name'] = prod.display_name
                        ldata['product_uom'] = prod.uom_id.id
                        ldata['location_id'] = order.location_id.id
                        ldata['location_dest_id'] = order.location_dest_id.id
                        ldata['picking_id'] = order.id
                    if model_name == 'purchase.order':
                        ldata['name'] = prod.display_name
                    ldata['state'] = 'draft'
                    ldata['order_id'] = order.id
                    self.env[line_model_name].create(ldata)
        if model_name == 'sale.order' or model_name == 'stock.picking':
            order.action_confirm()
        if model_name == 'purchase.order':
            order.button_confirm()
        if model_name == 'laundry.order':
            order.confirm_order()

        edit_form_id = self.env['hm.sub.form.template.line'].sudo().search([
                            ('form_template_id', '=', int(form_temp_id)),
                            ('name', '=', 'Edit')])
        result = {'order_id': order.id,
                  'edit_form_id': edit_form_id.id}

        return result

    @api.model
    def _pos_purchase_create_order(self, order, supplier_id):
        """Create Purchase Order for POS order from vendor dashboard """
        purchase_order = self.env['purchase.order'].create({
                                  'partner_id': supplier_id,
                                  'origin': order.source_folio_id.name,
                                  'date_order': order.date_order,
                                  'session_id': order.session_id.id,
                                  'pos_order_id': order.source_folio_id.id
                                                            })
        for line in order.lines:
            # get vendor id
            seller_id = self.env['product.supplierinfo'].sudo().search([
                                    ('product_tmpl_id', '=',
                                     line.product_id.product_tmpl_id.id),
                                    ('name', '=', order.vendor_id.id)])
            if seller_id:
                price_unit = seller_id.price
            else:
                price_unit = line.price_unit
            order_lines = {'product_id': line.product_id.id,
                           'name': line.product_id.name,
                           'product_qty': line.qty,
                           'product_uom': line.product_id.uom_po_id.id,
                           'price_unit': price_unit,
                           'date_planned': fields.Date.from_string(purchase_order.date_order),
                           'taxes_id': line.tax_ids_after_fiscal_position,
                           'order_id': purchase_order.id,
                           }
        purchase_line = self.env['purchase.order.line'].create(order_lines)
        return

    @api.multi
    def create_vendor_invoice(self, order):
        account_journal = self.env['account.journal'].sudo().search([
                                                ('is_pay_later', '=', True)],
                                                            limit=1)
        account_statement = self.env['account.bank.statement'].sudo().search(
                                [('pos_session_id', '=', order.session_id.id),
                                 ('journal_id', '=', account_journal.id)])
        current_date = (datetime.today()).strftime('%Y-%m-%d %H:%M:%S')
        prec_acc = order.pricelist_id.currency_id.decimal_places
        journal_ids = set()
        if(order.invoice_id):
            paid_amount = sum([x.amount for x in order.statement_ids])
            invoice_amount = order.invoice_id.amount_total - paid_amount
            if not float_is_zero(invoice_amount, precision_digits=prec_acc):
                order.add_payment(order._payment_fields({
                                            'name': current_date,
                                            'partner_id': order.partner_id.id,
                                            'statement_id': account_statement.id,
                                            'account_id': account_journal.default_debit_account_id,
                                            'journal_id': account_journal.id,
                                            'amount': invoice_amount}))
        else:
            order.action_pos_order_invoice()
            order.invoice_id.sudo().action_invoice_open()
            order.account_move = order.invoice_id.move_id
            if not float_is_zero(order.invoice_id.residual, precision_digits=prec_acc):
                order.add_payment(order._payment_fields({
                                            'name': current_date,
                                            'partner_id': order.partner_id.id,
                                            'statement_id': account_statement.id,
                                            'account_id': account_journal.default_debit_account_id,
                                            'journal_id': account_journal.id,
                                            'amount': order.invoice_id.residual}))
            journal_ids.add(account_journal.id)
        return True

    @api.multi
    def create_invoice(self, order_id, form_temp_id, model_name):
        order = self.env[model_name].search([('id', '=', int(order_id))])
        if model_name == 'sale.order':
            order.update({'order_state': 'done'})
        if model_name == 'laundry.order':
            if order.sale_obj.state in ['draft', 'sent']:
                order.sale_obj.action_confirm()
            order.invoice_status = order.sale_obj.invoice_status
            invoice = order.sale_obj.action_invoice_create()
        if model_name == 'purchase.order':
            journal = self.env['account.journal'].search([('type', '=', 'purchase')], limit=1)
            invoice_val = {'type': 'in_invoice',
                           'purchase_id': order.id,
                           'currency_id': order.currency_id.id,
                           'user_id': self.env.uid,
                           'journal_id': journal.id,
                           'company_id': order.company_id.id,
                           'partner_id': order.partner_id.id,
                           'origin': order.name,
                           'account_id': order.partner_id.property_account_payable_id.id
                           }
            invoice_line = []
            for line in order.order_line:
                line_data = {'product_id': line.product_id.id,
                             'name': line.order_id.name+':'+line.product_id.display_name,
                             'purchase_line_id': line.id,
                             'purchase_id': line.order_id.id,
                             'account_id': journal.default_credit_account_id.id,
                             'quantity': line.product_qty,
                             'uom_id': line.product_id.uom_id.id,
                             'price_unit': line.price_unit,
                             'currency_id': order.currency_id.id
                             }
                invoice_line.append([0, 0, line_data])
            invoice_val['invoice_line_ids'] = invoice_line
            acc_invoice = self.env['account.invoice'].create(invoice_val)
            invoice = acc_invoice.id
        else:
            invoice = order.action_invoice_create()

        account_invoice = self.env['account.invoice'].sudo().search([
                                            ('id', '=', invoice)])
        account_invoice.update({'pos_order_id': order.pos_order_id.id})

        edit_form_id = self.env['hm.sub.form.template.line'].sudo().search([
                            ('form_template_id', '=', int(form_temp_id)),
                            ('name', '=', 'Edit')])
        result = {'order_id': order.id,
                  'edit_form_id': edit_form_id.id}

        return result

    @api.multi
    def validate_invoice(self, order_id, form_temp_id, model_name):
        order = self.env[model_name].search([('id', '=', int(order_id))])

        order.action_invoice_open()

        edit_form_id = self.env['hm.sub.form.template.line'].sudo().search([
                            ('form_template_id', '=', int(form_temp_id)),
                            ('name', '=', 'Edit')])
        result = {'order_id': order.id,
                  'edit_form_id': edit_form_id.id}

        return result

    @api.multi
    def return_dress(self, order_id, form_temp_id, model_name):
        order = self.env[model_name].search([('id', '=', int(order_id))])

        order.return_dress()

        edit_form_id = self.env['hm.sub.form.template.line'].sudo().search([
                            ('form_template_id', '=', int(form_temp_id)),
                            ('name', '=', 'Edit')])
        result = {'order_id': order.id,
                  'edit_form_id': edit_form_id.id}

        return result

    @api.multi
    def get_orderline_detail(self, order_id):
        order = self.env['laundry.order'].search([('id', '=', int(order_id))])
        datas = []
        for line in order.order_lines:
            datas.append({'id': line.id,
                          'product_id': line.product_id.id,
                          'product_name': line.product_id.display_name,
                          'qty': line.qty
                          })
        return datas

    @api.multi
    def stock_validate(self, order_id, form_temp_id, model_name):
        order = self.env[model_name].search([('id', '=', int(order_id))])

        if model_name == 'purchase.order':
            transfer = order.picking_ids.button_validate()
            if transfer.get('res_model') == 'stock.immediate.transfer':
                wiz = self.env['stock.immediate.transfer'].create({'pick_ids': [(4, order.picking_ids.id)]})
                wiz.process()
            if transfer.get('res_model') == 'stock.overprocessed.transfer':
                wiz = self.env['stock.overprocessed.transfer'].create({'picking_id': order.picking_ids.id})
                wiz.action_confirm()
            if transfer.get('res_model') == 'stock.backorder.confirmation':
                wiz = self.env['stock.backorder.confirmation'].create({'pick_ids': [(4, p.id) for p in order.picking_ids]})
                wiz._process()
        else:
            order.button_validate()

        edit_form_id = self.env['hm.sub.form.template.line'].sudo().search([
                            ('form_template_id', '=', int(form_temp_id)),
                            ('name', '=', 'Edit')])
        result = {'order_id': order.id,
                  'edit_form_id': edit_form_id.id}

        return result

    @api.multi
    def get_accommodation(self):
        vendor_dashboard = self.env['hm.vendor.dashboard'].sudo().search([
                                    ('dashboard_category', '=', 'checkout')],
                                        limit=1)
        datas = self.get_vendor_list(0, vendor_dashboard.id, 0, False, 0, 0, 0, [], [], True)
        datas[0]['dashboard_id'] = vendor_dashboard.id
        return datas

    @api.multi
    def get_invoice_details(self, invoice_id):
        invoice = self.env['account.invoice'].sudo().search([('id', '=', invoice_id)])
        result = {'id': invoice.id,
                  'partner': invoice.partner_id.name,
                  'amount': invoice.residual}
        return result
