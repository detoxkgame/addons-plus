# -*- coding: utf-8 -*-
# See LICENSE file for full copyright and licensing details.

from odoo import models,  api
class FormTemplate(models.Model):
    _inherit = 'hm.form.template'

    @api.multi
    def get_reservationform(self):
        
        reservation_dashboard =  self.env['hm.vendor.dashboard'].sudo().search([('dashboard_category','ilike','Reservation')])

        form_template = self.env['hm.form.template'].sudo().search(
                         [('vendor_dashboard_id', '=', reservation_dashboard.id)])
                        # [('id', '=', int(5))])
        form_template_line = self.env['hm.form.template.line'].sudo().search(
                        [('form_template_id', '=', form_template.id)],
                        order='sequence asc')
        
        line_group = {}
        len_line_group={}
        lensub_line_group ={}
        temp_id = []
        key = 0
        count = 0
        result = []       
        fields = []
        field_type = []
        many2one_list=[]
        one2many_list = []
        sub_form_temp_ids = []
        for line in form_template_line:
            fields.append(line.form_field_id.name)
            field_type.append(line.form_field_id.ttype)
            if line.form_field_type == 'sub_form' or line.form_field_type == 'view_buttons':
                sub_form_temp_ids.append(line.sub_template_id.id)
            if line.form_field_type =='many2one':
                if line.form_field_id.relation:
                    records =  self.env[line.form_field_id.relation].search([])
                    records_model_fields =  self.env['ir.model.fields'].search([('id','in',line.form_template_model_fields.ids)])
                    for rec in records:
                        arr={}
                        for fields_rec in  records_model_fields :
                            field_name = fields_rec.name
                            arr[str(field_name)]=rec[field_name]
                        many2one_list.append(arr)

            if line.form_field_type =='one2many':
                if line.form_field_id.relation:
                    records_1 = self.env[line.form_template_model_fields.relation].search([('categ_id.is_room', '=', True)])
                    for rec in records_1:
                        arr = {}
                        # arr[str(rec.product_tmpl_id)]=rec[rec.product_tmpl_id.name]
                        arr['id'] = rec.product_tmpl_id.id
                        arr['name'] = rec.product_tmpl_id.name
                        one2many_list.append(arr)
                        
                                        
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
                                   'style': line.field_styles,
                                   'field_group': line.field_group,
                                   'many2one_list':many2one_list,
                                   'one2many_list': one2many_list,
                                   'sub_template_id': line.sub_template_id.id,
                                   }
            if count == 0:
                key = line.sequence
                temp_id.append(datas)
                line_group[key] = temp_id
            else:
                if line.sameline:
                        temp_id.append(datas)
                        line_group[key] = temp_id
                        len_line_group[key]=len(temp_id)
                else:
                    key = line.sequence
                    temp_id = []
                    temp_id.append(datas)
                    line_group[key] = temp_id
                    len_line_group[key]=len(temp_id)
            count = count+1
        form_template = self.env['hm.form.template'].sudo().search(
                        # [('vendor_dashboard_id', '=', int(10))])
                         [('id', '=', int(5))])
        sub_temp = self.env['hm.sub.form.template'].sudo().search([
                               ('id', 'in', sub_form_temp_ids)])
        sub_form_template = {}
        line_fields = []
        line_field_type = []
        sub_temp_id = []
        sub_line_group = {}
            #sub_temp_array = {}
        for temp in sub_temp:
                #sub_line_group = {}
                #sub_temp_id = []
                #sub_key = 0
                sub_temp_line = self.env['hm.sub.form.template.line'].sudo().search(
                            [('sub_form_template_id', '=', temp.id)],
                            order='sequence asc')

                tmp_line = self.env['hm.form.template.line'].sudo().search([('sub_template_id', '=', temp.id)])
                temp_array = []
                tid = 0
                for sline in sub_temp_line:
                        tid = sline.id
                        temp_array.append({'id': sline.id,
                                           'name': sline.name,
                                           'color': sline.color
                                           })
                   
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
                                model = line.form_field_id.relation
                                check_room_category_product = False
                                if 'product.product' in model:
                                    room_category = self.env['product.category'].search([('is_room', '=', True)])
                                    check_room_category_product = True
                                if line.form_field_id.relation:
                                    records = self.env[line.form_field_id.relation].search([])
                                    records_model_fields = self.env['ir.model.fields'].search(
                                        [('id', 'in', line.form_template_model_fields.ids)])
                                    for rec in records:
                                        if check_room_category_product :
                                            if  rec.product_tmpl_id.categ_id.id==room_category.id:
                                                                                            
                                                for fields_rec in records_model_fields:
                                                    field_name = fields_rec.name
                                                    arr[str(field_name)] = rec[field_name]
                                        else:
                                            for fields_rec in records_model_fields:
                                                field_name = fields_rec.name
                                                arr[str(field_name)] = rec[field_name]
                                        if (len(arr)>0):
                                            many2one_list.append(arr)
                                        arr = {}
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
                                     'style': line.field_styles,
                                   'field_group': line.field_group,
                                   'many2one_list':many2one_list,
                                   'one2many_list': one2many_list,
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
                                        lensub_line_group[sub_key] = len(sub_temp_id)
                                else:
                                    sub_key = line.sequence
                                    sub_temp_id = []
                                    sub_temp_id.append(datas)
                                    sub_line_group[sub_key] = sub_temp_id
                                    lensub_line_group[sub_key] = len(sub_temp_id)
                            count = count+1
                sub_form_template[temp.id] = temp_array
                
                
                
        #=======================================================================
        # print (len_line_group[12])
        # print (len_line_group.keys())
        # print (len_line_group)
        # print (sub_line_group)
        # print (sub_line_group.keys())
        #=======================================================================
        result.append({'d':'sdfsf','line_group': line_group,
                       'line_group_key': sorted(line_group.keys()),
                       'form_view': form_template.form_view,
                       'form_template':form_template,
                       'len_line_group':len_line_group,
                       'lensub_line_group':lensub_line_group,
                        'sub_form_template': sub_form_template,
                        'sub_line_group': sub_line_group,
                       'sub_line_group_key': sorted(sub_line_group.keys()),
                       'len_sub_line_group_key': len(sub_line_group),
                       })
        print (result)
        return result
    
    
    
class PosOrder(models.Model):
    _inherit = 'pos.order' 
    
    
    
    @api.model
    def _process_order(self, pos_order):
        pos_order['to_invoice']=True
        orders = super(PosOrder, self)._process_order(pos_order)
        print (orders)       
        if(orders):        
            print (pos_order)
            if pos_order.get('reservation_details'):
                #post = pos_order.get('reservation_details')
                post_order_details = pos_order.get('reservation_details')
                #===============================================================
                # if post_order_details['order_line']:
                #     for line in post_order_details['order_line']:                    
                #         if line.get('product_id') ==orders.mapped('lines').mapped('product_id').id:
                #             
                #         
                #     
                #===============================================================
                
                
                del post_order_details['order_line']
                
                orders.update(post_order_details)
                if orders.statement_ids:
                    for stmt in orders.statement_ids:
                        stmt.update({'journal_id':13})
                
                
        return orders
        
    @api.multi   
    def newreservation(self,post,order_row_line_array):
            print (self)
            print (post)
            print (order_row_line_array)
            print ('order_linee')
            print (post.get('order_line'))
            partner = self.env['res.partner']
            pos_order = self.env['pos.order']
            pos_order_line = self.env['pos.order.line']
            is_customer_exist = partner.search(['|',('mobile','=',post['mobile']),
                                                ('email','=',post['email']),
                                                ])
            post_order_line_details  = post.get('order_line');
            post_order_details = post;
            del post_order_details['order_line']
            if is_customer_exist:
                partner_id = is_customer_exist.id
            else:
                customer_details_array ={'name':post.get('guest_name'),
                                         'mobile':post.get('mobile'),
                                         'email':post.get('email'),                                      
                                          
                    }
                #===============================================================
                # if post_order_details.get('no_night'):
                #     nof_nights = str(post_order_details.get('no_night'))
                #     post_order_details['no_night']=nof_nights.replace('Nights', '' []) 
                #===============================================================
                    
                #===============================================================
                # if post_order_details.get('checkin_date') or post_order_details.get('checkout_date'):
                #     in_date_time_str = str(post_order_details.get('checkin_date'))
                #     out_date_time_str = str(post_order_details.get('checkout_date'))
                #     
                #     in_dt = parse(in_date_time_str)
                #     out_dt = parse(out_date_time_str)                   
                #     # datetime.datetime(2010, 2, 15, 0, 0)
                #     date_time_obj = in_dt.strftime('%Y-%m-%d %H:%M:S')
                #     post_order_details['checkin_date']=date_time_obj
                #     
                #     date_time_obj = out_dt.strftime('%Y-%m-%d %H:%M:S')
                #     post_order_details['checkout_date']=date_time_obj
                #===============================================================

                print (post_order_details)
                created_customer = partner.create(customer_details_array)
                partner_id = created_customer.id
            post_order_details['partner_id']=partner_id
            post_order_details['amount_tax']=0
            post_order_details['amount_paid']=0
            post_order_details['amount_total']=0
            post_order_details['amount_return']=0
        #    post_order_details['lines']= [(0, 0, {post_order_line_details})]
           
            
            
             
            draft_order = pos_order.create(post_order_details)
            print (draft_order)
            if draft_order:     
                print (draft_order.lines) 
                order_amount =0;         
            # 'lines': [[0, 0, draft_order_lines]]#{'qty': 2, 'price_unit': 800.4, 'price_subtotal': 1600.8, 'price_subtotal_incl': 1600.8, 'discount': 0, 'product_id': 13, 'tax_ids': [[6, False, []]], 'id': 1, 'pack_lot_ids': [], 'note': ''}]],
                for line in post_order_line_details :
                    if len(line)>0 :
                        line['order_id']= draft_order.id
                        line['qty']= 1# int(line['qty'])
                        line['product_id']= int(line['product_id'])
                        product_id = line['product_id']
                        product_product = self.env['product.product'].search([('id','=',product_id)])
                        line['price_unit']= product_product.lst_price                        
                        line['price_subtotal']= line['qty']*product_product.lst_price
                        line['price_subtotal_incl']= line['qty']*product_product.lst_price
                        line['tax_ids']= [[6, False, []]]
                        line['discount']= int(0)
                        
                    #   'price_unit': 800.4, 'price_subtotal': 1600.8, 'price_subtotal_incl': 1600.8, 'discount': 0, 'product_id': 13, 'tax_ids': [[6, False, []]],
                        draft_order_lines = pos_order_line.create(line)
                        order_amount =order_amount+ line['price_subtotal']
                        print (draft_order_lines)
                        
                draft_order.write({'amount_total':order_amount})
                draft_order.action_pos_order_invoice()
                draft_order.invoice_id.sudo().action_invoice_open()
                draft_order.account_move = pos_order.invoice_id.move_id
             
            return True
        
        
    @api.multi   
    def newreservation_sve(self,post,order_row_line_array):
            print (self)
            print (post)
            print (order_row_line_array)
            print ('order_linee')
            print (post.get('order_line'))
            partner = self.env['res.partner']
            pos_order = self.env['pos.order']
            pos_order_line = self.env['pos.order.line']
            is_customer_exist = partner.search(['|',('mobile','=',post['mobile']),
                                                ('email','=',post['email']),
                                                ])
            post_order_line_details  = post.get('order_line');
            post_order_details = post;
            del post_order_details['order_line']
            if is_customer_exist:
                partner_id = is_customer_exist.id
            else:
                customer_details_array ={'name':post.get('guest_name'),
                                         'mobile':post.get('mobile'),
                                         'email':post.get('email'),                                        
                    }
                #===============================================================
                # if post_order_details.get('no_night'):
                #     nof_nights = str(post_order_details.get('no_night'))
                #     post_order_details['no_night']=nof_nights.replace('Nights', '' []) 
                #===============================================================
                    
                #===============================================================
                # if post_order_details.get('checkin_date') or post_order_details.get('checkout_date'):
                #     in_date_time_str = str(post_order_details.get('checkin_date'))
                #     out_date_time_str = str(post_order_details.get('checkout_date'))
                #     
                #     in_dt = parse(in_date_time_str)
                #     out_dt = parse(out_date_time_str)                   
                #     # datetime.datetime(2010, 2, 15, 0, 0)
                #     date_time_obj = in_dt.strftime('%Y-%m-%d %H:%M:S')
                #     post_order_details['checkin_date']=date_time_obj
                #     
                #     date_time_obj = out_dt.strftime('%Y-%m-%d %H:%M:S')
                #     post_order_details['checkout_date']=date_time_obj
                #===============================================================

                print (post_order_details)
                created_customer = partner.create(customer_details_array)
                partner_id = created_customer.id
            post_order_details['partner_id']=partner_id
            post_order_details['amount_tax']=0
            post_order_details['amount_paid']=0
            post_order_details['amount_total']=0
            post_order_details['amount_return']=0
        #    post_order_details['lines']= [(0, 0, {post_order_line_details})]
           
            
            
             
            draft_order = pos_order.create(post_order_details)
            print (draft_order)
            if draft_order:     
                print (draft_order.lines) 
                order_amount =0;         
            # 'lines': [[0, 0, draft_order_lines]]#{'qty': 2, 'price_unit': 800.4, 'price_subtotal': 1600.8, 'price_subtotal_incl': 1600.8, 'discount': 0, 'product_id': 13, 'tax_ids': [[6, False, []]], 'id': 1, 'pack_lot_ids': [], 'note': ''}]],
                for line in post_order_line_details :
                    if len(line)>0 :
                        line['order_id']= draft_order.id
                        line['qty']= 1# int(line['qty'])
                        line['product_id']= int(line['product_id'])
                        product_id = line['product_id']
                        product_product = self.env['product.product'].search([('id','=',product_id)])
                        line['price_unit']= product_product.lst_price                        
                        line['price_subtotal']= line['qty']*product_product.lst_price
                        line['price_subtotal_incl']= line['qty']*product_product.lst_price
                        line['tax_ids']= [[6, False, []]]
                        line['discount']= int(0)
                        
                    #   'price_unit': 800.4, 'price_subtotal': 1600.8, 'price_subtotal_incl': 1600.8, 'discount': 0, 'product_id': 13, 'tax_ids': [[6, False, []]],
                        draft_order_lines = pos_order_line.create(line)
                        order_amount =order_amount+ line['price_subtotal']
                        print (draft_order_lines)
                        
                draft_order.write({'amount_total':order_amount})
                draft_order.action_pos_order_invoice()
                draft_order.invoice_id.sudo().action_invoice_open()
                draft_order.account_move = pos_order.invoice_id.move_id
             
            return True
        
        
        
class ResPartner(models.Model):
    _inherit ='res.partner'
    
    def  createpartner(self,post):
        partner_id = False
        partner = self.env['res.partner']
        is_customer_exist = partner.search(['|',('mobile','=',post['mobile']),
                                                ('email','=',post['email']),
                                                ],limit=1)
           
        if is_customer_exist:
            partner_id = is_customer_exist
        else:
            customer_details_array ={'name':post.get('guest_name'),
                                         'mobile':post.get('mobile'),
                                         'email':post.get('email'),                                        
                    }
            created_customer = partner.create(customer_details_array)
            partner_id = created_customer
        val={'id':partner_id.id,
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
               # 'property_account_position_id': partner_id.property_account_position_id,
               # 'property_product_pricelist' : partner_id.property_product_pricelist,
                }
        # return partner_id
        return {'id':partner_id.id, 'partner_details':val}
